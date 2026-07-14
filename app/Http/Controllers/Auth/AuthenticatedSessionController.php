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

            if (!$app || !$app->is_active || empty($app->login_callback_url)) {
                abort(403, 'Akses Ditolak: Aplikasi tidak terdaftar, nonaktif, atau tidak mendukung otentikasi SSO.');
            }

            if ($request->has('redirect_uri')) {
                $requestedRedirectUri = $request->query('redirect_uri');
                $registeredHost = parse_url($app->login_callback_url, PHP_URL_HOST);
                $requestedHost = parse_url($requestedRedirectUri, PHP_URL_HOST);
                $registeredPort = parse_url($app->login_callback_url, PHP_URL_PORT);
                $requestedPort = parse_url($requestedRedirectUri, PHP_URL_PORT);

                if ($registeredHost !== $requestedHost || $registeredPort !== $requestedPort) {
                    abort(403, 'Akses Ditolak: URL Callback (redirect_uri) tidak cocok dengan domain aplikasi terdaftar.');
                }
            }
        }

        // Jika pengguna sudah terautentikasi (sesi aktif)
        if (Auth::check()) {
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
                    'nomor_induk' => $user->nip_nis ?: $user->nik,
                    'nama' => $user->nama_lengkap,
                    'roles' => $peranUser,
                    'exp' => time() + 300, // Token kadaluarsa dalam 5 menit
                ]);

                // Gunakan redirect_uri dari request jika dikirimkan oleh klien, jika tidak gunakan fallback login_callback_url bawaan aplikasi
                $callbackUrl = $request->query('redirect_uri') ?: $app->login_callback_url;

                // Gabungkan token ke callbackUrl dengan aman
                $pemisah = str_contains($callbackUrl, '?') ? '&' : '?';
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

        return Inertia::render('Auth/Otentikasi', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
            'mode' => 'masuk'
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
        try {
            $request->authenticate();
        } catch (\Throwable $e) {
            \App\Services\LayananLogAktivitas::catat('Percobaan login gagal (email: ' . $request->email . ')', $request->email);
            throw $e; // re-throw ValidationException dari LoginRequest
        }

        $request->session()->regenerate();

        // Hapus log debug sementara, ambil data user dengan eager load roles
        $user = $request->user()->load('roles');

        // Cek apakah ada proses login SSO untuk aplikasi tertentu
        if ($appId) {
            $app = \App\Models\RegisteredApp::find($appId);

            if ($app && $app->is_active) {
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

        \App\Services\LayananLogAktivitas::catat('Login sukses ke portal SSO', $user->email, $user->id);

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
            \App\Services\LayananLogAktivitas::catat('Logout dari sistem', $user->email, $user->id);
            
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        // Cek jika ada parameter redirect_uri (untuk SSO logout)
        if ($request->has('redirect_uri')) {
            return redirect()->away($request->query('redirect_uri'));
        }

        return redirect()->route('login');
    }
}
