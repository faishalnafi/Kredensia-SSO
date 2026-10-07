<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    /**
     * Display the login view or auto-redirect if session is active.
     */
    public function create(Request $request)
    {
        $appId = $request->query('client_id') ?: $request->query('app_id');
        $app = null;

        // Validasi dini keberadaan aplikasi dan keabsahan redirect_uri jika parameter dikirim
        if ($appId) {
            $app = \App\Models\RegisteredApp::find($appId);

            if (!$app || !$app->is_active) {
                session()->flash('error', 'Akses Ditolak: Aplikasi tidak terdaftar atau nonaktif.');
                $appId = null;
                $app = null;
            } elseif (empty($app->login_callback_url)) {
                // Jika aplikasi ini bukan aplikasi SSO (tidak memiliki login_callback_url / Hanya Katalog), langsung alihkan ke portal_url
                return redirect()->away($app->portal_url);
            } elseif ($request->has('redirect_uri')) {
                $requestedRedirectUri = $request->query('redirect_uri');
                $registeredHost = parse_url($app->login_callback_url, PHP_URL_HOST);
                $requestedHost = parse_url($requestedRedirectUri, PHP_URL_HOST);
                $portalHost = parse_url($app->portal_url, PHP_URL_HOST);

                $hostMatch = ($registeredHost && $requestedHost && strtolower($registeredHost) === strtolower($requestedHost)) ||
                             ($portalHost && $requestedHost && strtolower($portalHost) === strtolower($requestedHost)) ||
                             ($registeredHost === 'localhost' || $registeredHost === '127.0.0.1');

                if (!$hostMatch) {
                    session()->flash('error', 'Akses Ditolak: URL Callback (redirect_uri) tidak cocok dengan domain aplikasi terdaftar.');
                    $appId = null;
                    $app = null;
                } elseif ($requestedHost && strtolower($registeredHost) !== strtolower($requestedHost)) {
                    // Otomatis perbarui login_callback_url di database jika domain cocok dengan portal_url
                    try {
                        $app->update(['login_callback_url' => $requestedRedirectUri]);
                    } catch (\Throwable $e) {
                        // Abaikan jika DB read-only
                    }
                }
            }
        }

        // Jika pengguna sudah terautentikasi (sesi aktif) dan tidak sedang menambah akun
        if (Auth::check() && !$request->has('tambah_akun')) {
            $user = Auth::user()->load('roles');

            // Cek apakah ada parameter app_id atau client_id dari pihak ketiga
            if ($appId && $app) {
                // Validasi hak akses peran (RBAC) jika visibilitas dibatasi
                if (!$app->is_global_visibility) {
                    $userRoleIds = $user->roles->pluck('id')->toArray();
                    $hasAccess = $app->roles()->whereIn('roles.id', $userRoleIds)->exists();

                    if (!$hasAccess) {
                        return redirect()->route('dasbor')->with('error', 'Anda tidak memiliki peran (hak akses) untuk menggunakan aplikasi ' . $app->nama_aplikasi . '.');
                    }
                }

                // Hasilkan token JWT untuk otentikasi otomatis pihak ketiga
                $peranUser = $user->roles->pluck('nama_role')->toArray();
                $token = \App\Services\LayananJWT::buatToken([
                    'user_id' => $user->id,
                    'username' => $user->username,
                    'nomor_induk' => $user->nip_nis ?: $user->nik,
                    'nama' => $user->nama_lengkap,
                    'roles' => $peranUser,
                    'exp' => time() + 300, // Token kadaluarsa dalam 5 menit
                ]);

                // Gunakan redirect_uri dari request jika dikirimkan oleh klien, jika tidak gunakan fallback login_callback_url bawaan aplikasi
                $callbackUrl = $request->query('redirect_uri') ?: $app->login_callback_url;

                // Gabungkan token ke callbackUrl dengan aman
                $pemisah = str_contains($callbackUrl, '?') ? '&' : '?';

                \App\Services\LayananLogAktivitas::catat('Otentikasi SSO otomatis (sesi aktif) ke aplikasi: ' . $app->nama_aplikasi, $user->email, $user->id);

                return redirect()->away($callbackUrl . $pemisah . 'token=' . $token);
            }

            // Jika tidak ada app_id / client_id, arahkan ke beranda sesuai peran
            if ($user->hasRole('Super Admin') || $user->hasRole('superadmin')) {
                return redirect()->route('superadmin.beranda');
            }

            if ($user->hasRole('Admin') || $user->hasRole('admin')) {
                return redirect()->route('admin.beranda');
            }

            return redirect()->route('dasbor');
        }

        // Jika belum masuk (guest)
        if ($appId) {
            session(['sso_app_id' => $appId]);
            if ($request->has('redirect_uri')) {
                session(['sso_redirect_uri' => $request->query('redirect_uri')]);
            }
        }

        $modeAwal = ($request->routeIs('claim.form') || $request->has('verifikasi') || str_contains($request->url(), 'verifikasi')) ? 'verifikasi' : 'masuk';

        return Inertia::render('Auth/Otentikasi', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
            'mode' => $modeAwal
        ]);
    }

    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        // Ambil appId dan redirectUri dari request query atau session sebelum diregenerasi
        $appId = $request->query('client_id') ?: $request->query('app_id') ?: $request->session()->get('sso_app_id');
        $redirectUri = $request->query('redirect_uri') ?: $request->session()->get('sso_redirect_uri');


        // Cek apakah ada proses login SSO untuk aplikasi tertentu
        // Bungkus seluruh proses autentikasi dalam DB::transaction untuk menjamin ACID.
        // Jika RBAC check gagal dan perlu logout, rollback tidak diperlukan karena login sudah terjadi,
        // namun try-catch dipasang untuk menangkap kegagalan DB tak terduga.
        # Pastikan jumlah multi-akun pada perangkat ini belum melewati batas maksimal (default 25 akun)
        if (!\App\Services\LayananSesiPerangkat::masihBisaTambahAkun($request, (string) $request->email)) {
            $batas = \App\Services\LayananSesiPerangkat::BATAS_MAKSIMAL_MULTI_AKUN;
            throw \Illuminate\Validation\ValidationException::withMessages([
                'email' => "Batas maksimal multi-akun pada perangkat ini ({$batas} akun) telah tercapai. Silakan keluarkan salah satu akun terlebih dahulu.",
            ]);
        }

        $idPenggunaSebelumnya = Auth::id();

        try {
            $request->authenticate();
        } catch (\Illuminate\Validation\ValidationException $e) {
            $pesanError = 'Salah Kata Sandi / Data Tidak Valid';
            $errors = $e->errors();

            if (isset($errors['password'])) {
                $pesanError = 'Kata Sandi Salah';
            } elseif (isset($errors['email'])) {
                $pesanEmail = implode(', ', $errors['email']);
                if (str_contains($pesanEmail, 'belum diklaim')) {
                    $pesanError = 'Akun Belum Diklaim';
                } elseif (str_contains($pesanEmail, 'dinonaktifkan')) {
                    $pesanError = 'Akun Nonaktif';
                } elseif (str_contains($pesanEmail, 'belum diverifikasi')) {
                    $pesanError = 'Akun Tidak Terdaftar';
                } else {
                    $pesanError = 'Identitas Tidak Valid';
                }
            }

            \App\Services\LayananLogAktivitas::catat('Percobaan login gagal: ' . $pesanError . ' (identitas: ' . $request->email . ')', $request->email);
            throw $e;
        } catch (\Throwable $e) {
            \App\Services\LayananLogAktivitas::catat('Percobaan login gagal (identitas: ' . $request->email . ')', $request->email);
            throw $e;
        }

        $request->session()->regenerate();

        // Ambil data user dengan eager load roles
        $user = $request->user()->load('roles');

        // Cek apakah pengguna mengaktifkan Autentikasi Dua Faktor (2FA / MFA)
        if ($user->hasEnabledTwoFactor()) {
            $rememberCookieName = 'sso_2fa_remember_' . $user->id;
            $cookieValue = $request->cookie($rememberCookieName);
            $isBrowserRemembered = false;

            if ($cookieValue && !empty($user->remember_token)) {
                if (hash_equals(hash('sha256', (string) $user->remember_token), (string) $cookieValue)) {
                    $isBrowserRemembered = true;
                }
            }

            if (!$isBrowserRemembered) {
                $remember = $request->boolean('remember');

                $request->session()->put([
                    'login.2fa.user_id' => $user->id,
                    'login.2fa.remember' => $remember,
                    'login.2fa.app_id' => $appId,
                    'login.2fa.redirect_uri' => $redirectUri,
                ]);

                if ($idPenggunaSebelumnya && (string) $idPenggunaSebelumnya !== (string) $user->id) {
                    Auth::loginUsingId($idPenggunaSebelumnya);
                } else {
                    Auth::guard('web')->logout();
                }

                $metodeUtama = $user->two_factor_type ?: 'totp';
                if ($metodeUtama === 'email') {
                    \App\Services\Layanan2FA::kirimOtpEmail($user);
                } elseif ($metodeUtama === 'whatsapp') {
                    \App\Services\Layanan2FA::kirimOtpWhatsapp($user);
                } elseif ($metodeUtama === 'google_prompt') {
                    \App\Services\Layanan2FA::buatTantanganPrompt($user, $request);
                }

                \App\Services\LayananLogAktivitas::catat("Meminta verifikasi 2FA/MFA ({$metodeUtama}) saat login", $user->email, $user->id);

                return redirect()->route('2fa.challenge');
            }
        }

        // Cek apakah ada proses login SSO untuk aplikasi tertentu
        if ($appId) {
            $app = \App\Models\RegisteredApp::find($appId);

            if ($app && $app->is_active) {
                // Periksa jika aplikasi bukan SSO (tanpa callback URL / hanya katalog), langsung alihkan ke portal_url
                if (empty($app->login_callback_url)) {
                    $request->session()->forget(['sso_app_id', 'sso_redirect_uri']);
                    \App\Services\LayananLogAktivitas::catat('Pengalihan ke aplikasi katalog (non-SSO): ' . $app->nama_aplikasi, $user->email, $user->id);
                    return redirect()->away($app->portal_url);
                }

                // Periksa hak akses peran jika aplikasi dibatasi visibilitasnya
                if (!$app->is_global_visibility) {
                    $userRoleIds = $user->roles->pluck('id')->toArray();
                    $hasAccess = $app->roles()->whereIn('roles.id', $userRoleIds)->exists();

                    if (!$hasAccess) {
                        Auth::guard('web')->logout();
                        $request->session()->invalidate();
                        $request->session()->regenerateToken();
                        
                        \App\Services\LayananLogAktivitas::catat('Ditolak akses ke aplikasi ' . $app->nama_aplikasi . ' (tidak memiliki peran)', $user->email, $user->id);
                        
                        throw \Illuminate\Validation\ValidationException::withMessages([
                            'email' => 'Anda tidak memiliki peran (hak akses) untuk menggunakan aplikasi ' . $app->nama_aplikasi . '.',
                        ]);
                    }
                }

                // Hasilkan token JWT
                $peranUser = $user->roles->pluck('nama_role')->toArray();
                $token = \App\Services\LayananJWT::buatToken([
                    'user_id' => $user->id,
                    'username' => $user->username,
                    'nomor_induk' => $user->nip_nis ?: $user->nik,
                    'nama' => $user->nama_lengkap,
                    'roles' => $peranUser,
                    'exp' => time() + 300, // Token kadaluarsa dalam 5 menit
                ]);

                // Gunakan redirect_uri dari session jika ada, jika tidak gunakan fallback
                $callbackUrl = $redirectUri ?: $app->login_callback_url;

                $request->session()->forget(['sso_app_id', 'sso_redirect_uri']);
                
                $pemisah = str_contains($callbackUrl, '?') ? '&' : '?';

                \App\Services\LayananLogAktivitas::catat('Otentikasi SSO sukses ke aplikasi: ' . $app->nama_aplikasi, $user->email, $user->id);

                return redirect()->route('sso.redirect', ['url' => $callbackUrl . $pemisah . 'token=' . $token]);
            }
        }

        # Daftarkan akun ke sesi multi-akun & catat silsilah penambahan akun ke log aktivitas
        \App\Services\LayananSesiPerangkat::daftarkanAkunKeSesi($request, $user, 'Email & Kata Sandi', true);

        if ($user->hasRole('Super Admin') || $user->hasRole('superadmin')) {
            return redirect()->intended(route('superadmin.beranda', absolute: false));
        }

        if ($user->hasRole('Admin') || $user->hasRole('admin')) {
            return redirect()->intended(route('admin.beranda', absolute: false));
        }

        return redirect()->intended(route('dasbor', absolute: false));
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        if (Auth::check()) {
            $user = Auth::user();
            $daftarTerdampak = array_filter([
                (string) $user->id,
                ...array_map('strval', $request->session()->get('sso_multi_accounts', [])),
            ]);
            $akunPertama = $request->session()->get('sso_akun_pertama');
            $infoPertama = $akunPertama
                ? ' [Akun pertama perangkat: ' . \App\Services\LayananSesiPerangkat::formatLabelPengguna(null, $akunPertama) . ']'
                : '';
            \App\Services\LayananLogAktivitas::catat('Logout dari seluruh akun pada perangkat ini' . $infoPertama, $user->email, $user->id);
            
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            \App\Services\LayananSesiPerangkat::siarkanPerubahanSesi($daftarTerdampak);
        }

        // Cek jika ada parameter redirect_uri (untuk SSO logout)
        if ($request->has('redirect_uri')) {
            return redirect()->away($request->query('redirect_uri'));
        }

        return redirect()->route('login');
    }

    /**
     * Logout hanya satu akun tertentu.
     */
    public function logoutPartial(Request $request): RedirectResponse
    {
        $email = $request->input('email');
        $multiAccounts = $request->session()->get('sso_multi_accounts', []);

        if ($email) {
            $kunciIdentitas = strtolower(trim(ltrim((string) $email, '@')));
            $targetUser = \App\Models\User::where('email', $kunciIdentitas)
                ->orWhere('username', $kunciIdentitas)
                ->orWhere('id', trim((string) $email))
                ->first();
            if ($targetUser) {
                $akunPertama = $request->session()->get('sso_akun_pertama');
                $infoPertama = $akunPertama
                    ? ' [Akun pertama perangkat: ' . \App\Services\LayananSesiPerangkat::formatLabelPengguna(null, $akunPertama) . ']'
                    : '';

                // Hapus akun dari array sesi
                $multiAccounts = array_filter($multiAccounts, function($id) use ($targetUser) {
                    return (string) $id !== (string) $targetUser->id;
                });
                $multiAccounts = array_values($multiAccounts);
                $request->session()->put('sso_multi_accounts', $multiAccounts);

                \App\Services\LayananLogAktivitas::catat(
                    'Logout parsial (keluar 1 akun dari perangkat): ' . \App\Services\LayananSesiPerangkat::formatLabelPengguna($targetUser) . $infoPertama,
                    $targetUser->email,
                    (string) $targetUser->id
                );

                \App\Services\LayananSesiPerangkat::siarkanPerubahanSesi([
                    (string) $targetUser->id,
                    ...array_map('strval', $multiAccounts),
                ]);

                // Jika yang dilogout adalah akun yang saat ini aktif
                if (Auth::check() && (string) Auth::id() === (string) $targetUser->id) {
                    Auth::guard('web')->logout();
                    
                    // Jika masih ada akun lain, switch otomatis
                    if (!empty($multiAccounts)) {
                        $nextUser = \App\Models\User::find($multiAccounts[0]);
                        if ($nextUser) {
                            Auth::guard('web')->login($nextUser);
                            \App\Services\LayananSesiPerangkat::catatSwitchAkun($request, $targetUser, $nextUser);
                            return redirect()->intended(route('dasbor', absolute: false));
                        }
                    }
                    
                    // Jika tidak ada sisa, logout total
                    $request->session()->invalidate();
                    $request->session()->regenerateToken();
                    return redirect()->route('login');
                }
            }
        }
        
        return back();
    }

    /**
     * Switch ke akun lain yang sudah login di sesi browser ini.
     */
    public function switchAccount(Request $request): RedirectResponse
    {
        $email = $request->input('email');
        $penggunaAsal = Auth::user();
        
        $multiAccounts = $request->session()->get('sso_multi_accounts', []);
        
        if (!empty($multiAccounts) && $email) {
            $kunciIdentitas = strtolower(trim(ltrim((string) $email, '@')));
            $targetUser = \App\Models\User::where('email', $kunciIdentitas)
                ->orWhere('username', $kunciIdentitas)
                ->orWhere('id', trim((string) $email))
                ->first();
            
            if ($targetUser && in_array((string) $targetUser->id, array_map('strval', $multiAccounts), true)) {
                // Login sebagai user ini tanpa password (karena sudah pernah diverifikasi di sesi ini)
                Auth::guard('web')->login($targetUser);
                $request->session()->regenerate();
                
                // Pastikan user ini tetap ada di multi_accounts
                $multiAccounts = $request->session()->get('sso_multi_accounts', []);
                if (!in_array((string) $targetUser->id, array_map('strval', $multiAccounts), true)) {
                    $multiAccounts[] = $targetUser->id;
                    $request->session()->put('sso_multi_accounts', $multiAccounts);
                }

                // Catat aktivitas switch akun ke log
                \App\Services\LayananSesiPerangkat::catatSwitchAkun($request, $penggunaAsal, $targetUser);

                if ($targetUser->hasRole('Super Admin') || $targetUser->hasRole('superadmin')) {
                    return redirect()->route('superadmin.beranda');
                }

                if ($targetUser->hasRole('Admin') || $targetUser->hasRole('admin')) {
                    return redirect()->route('admin.beranda');
                }

                return redirect()->route('dasbor');
            }
        }
        
        return back()->withErrors(['email' => 'Sesi untuk akun ini telah berakhir. Silakan login kembali.']);
    }
}
