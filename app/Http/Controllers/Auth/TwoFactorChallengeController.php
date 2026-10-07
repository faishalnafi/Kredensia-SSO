<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Layanan2FA;
use App\Services\LayananLogAktivitas;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class TwoFactorChallengeController extends Controller
{
    /**
     * Tampilkan halaman tantangan kode 2FA / MFA saat login.
     */
    public function create(Request $request): Response|RedirectResponse
    {
        $userId = $request->session()->get('login.2fa.user_id');

        if (!$userId) {
            return redirect()->route('login');
        }

        $user = User::find($userId);
        if (!$user) {
            return redirect()->route('login');
        }

        $pengaturan = Layanan2FA::dapatkanPengaturan();
        $metodeDiizinkanSistem = (array) ($pengaturan->two_factor_allowed_methods ?: [
            'totp', 'google_prompt', 'whatsapp', 'email', 'passkey', 'security_key', 'backup_codes',
        ]);

        $metodeAktifUser = $user->daftarMetodeMfaAktif();

        // Selalu izinkan email, whatsapp (jika ada no_telp), dan google_prompt sebagai alternatif jika diizinkan sistem
        foreach (['google_prompt', 'email'] as $mAlternatif) {
            if (in_array($mAlternatif, $metodeDiizinkanSistem, true) && !in_array($mAlternatif, $metodeAktifUser, true)) {
                $metodeAktifUser[] = $mAlternatif;
            }
        }
        if (!empty($user->no_telp) && in_array('whatsapp', $metodeDiizinkanSistem, true) && !in_array('whatsapp', $metodeAktifUser, true)) {
            $metodeAktifUser[] = 'whatsapp';
        }

        $metodeUtama = $user->two_factor_type ?: 'totp';
        if (!in_array($metodeUtama, $metodeAktifUser, true) && !empty($metodeAktifUser)) {
            $metodeUtama = $metodeAktifUser[0];
        }

        // Buat challenge WebAuthn untuk Passkey / Security Key
        $webauthnChallenge = (string) $request->session()->get('login.2fa.webauthn_challenge', '');
        if ($webauthnChallenge === '') {
            $webauthnChallenge = rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
            $request->session()->put('login.2fa.webauthn_challenge', $webauthnChallenge);
        }

        // Jika metode utama adalah google_prompt dan belum ada tantangan aktif, buat tantangan baru
        $promptChallenge = $user->two_factor_prompt_challenge;
        if (
            $metodeUtama === 'google_prompt' &&
            (!is_array($promptChallenge) || ($promptChallenge['status'] ?? '') !== 'pending' || now()->timestamp > (int) ($promptChallenge['expires_at'] ?? 0))
        ) {
            $promptChallenge = Layanan2FA::buatTantanganPrompt($user, $request);
        }

        $kredensialWebAuthn = collect(is_array($user->two_factor_passkeys) ? $user->two_factor_passkeys : [])
            ->map(fn (array $item): array => [
                'id' => $item['id'] ?? '',
                'credential_id' => $item['credential_id'] ?? '',
                'nama_kunci' => $item['nama_kunci'] ?? 'Kunci Keamanan',
                'jenis' => $item['jenis'] ?? 'passkey',
                'transports' => $item['transports'] ?? [],
            ])
            ->values()
            ->all();

        // Susun daftar seluruh opsi untuk dialog "Coba cara lain" mirip Google
        $daftarOpsiVerifikasi = [];
        foreach (Layanan2FA::SEMUA_METODE as $kode => $meta) {
            $tersediaUntukUser = in_array($kode, $metodeAktifUser, true);
            $alasanNonaktif = null;

            if ($kode === 'sms') {
                $tersediaUntukUser = false;
                $alasanNonaktif = 'Layanan gateway SMS sedang dinonaktifkan sistem (Gunakan WhatsApp / Email)';
            } elseif ($kode === 'totp' && empty($user->two_factor_secret)) {
                $tersediaUntukUser = false;
                $alasanNonaktif = 'Aplikasi Authenticator belum dikonfigurasi pada akun ini';
            } elseif ($kode === 'whatsapp' && empty($user->no_telp)) {
                $tersediaUntukUser = false;
                $alasanNonaktif = 'Nomor telepon belum terdaftar pada akun ini';
            } elseif ($kode === 'passkey' && !collect($kredensialWebAuthn)->contains('jenis', 'passkey')) {
                // Tetap izinkan dicoba jika perangkat mendukung atau beri keterangan
                $tersediaUntukUser = collect($kredensialWebAuthn)->contains('jenis', 'passkey');
                if (!$tersediaUntukUser) {
                    $alasanNonaktif = 'Belum ada Kunci Sandi (Passkey) terdaftar di akun ini';
                }
            } elseif ($kode === 'security_key' && !collect($kredensialWebAuthn)->contains('jenis', 'security_key')) {
                $tersediaUntukUser = collect($kredensialWebAuthn)->contains('jenis', 'security_key');
                if (!$tersediaUntukUser) {
                    $alasanNonaktif = 'Belum ada Kunci Keamanan Fisik (USB/NFC) terdaftar di akun ini';
                }
            } elseif ($kode === 'backup_codes' && empty($user->two_factor_recovery_codes)) {
                $tersediaUntukUser = false;
                $alasanNonaktif = 'Kode cadangan 10 digit belum dibuat atau sudah habis';
            }

            $daftarOpsiVerifikasi[] = [
                'kode' => $kode,
                'nama' => $meta['nama'],
                'deskripsi' => $meta['deskripsi'],
                'aktif_sistem' => $meta['aktif_sistem'],
                'tersedia' => $tersediaUntukUser,
                'alasan_nonaktif' => $alasanNonaktif,
            ];
        }

        return Inertia::render('Auth/TwoFactorChallenge', [
            'userId' => $user->id,
            'email' => $user->email,
            'emailMasked' => Layanan2FA::sensorEmail($user->email),
            'noTelpMasked' => Layanan2FA::sensorNomorTelepon($user->no_telp),
            'punyaNoTelp' => !empty($user->no_telp),
            'nama' => $user->nama_lengkap,
            'avatarUrl' => $user->avatar_url,
            'type' => $metodeUtama,
            'metodeAktif' => array_values($metodeAktifUser),
            'daftarOpsiVerifikasi' => $daftarOpsiVerifikasi,
            'promptData' => is_array($promptChallenge) ? [
                'id' => $promptChallenge['id'] ?? null,
                'angka_target' => $promptChallenge['angka_target'] ?? null,
                'status' => $promptChallenge['status'] ?? 'pending',
                'expires_at' => $promptChallenge['expires_at'] ?? 0,
            ] : null,
            'webauthnChallenge' => $webauthnChallenge,
            'kredensialWebAuthn' => $kredensialWebAuthn,
        ]);
    }

    /**
     * Kirim ulang kode OTP (Email / WhatsApp) atau picu ulang Dialog Google Prompt saat di halaman tantangan 2FA.
     */
    public function kirimTantanganBaru(Request $request): JsonResponse
    {
        $userId = $request->session()->get('login.2fa.user_id');
        if (!$userId) {
            return response()->json(['berhasil' => false, 'pesan' => 'Sesi login tidak ditemukan.'], 401);
        }

        $user = User::findOrFail($userId);
        $request->validate([
            'metode' => ['required', 'string', 'in:email,whatsapp,google_prompt'],
        ]);

        $metode = (string) $request->metode;

        if ($metode === 'whatsapp') {
            if (empty($user->no_telp)) {
                return response()->json([
                    'berhasil' => false,
                    'pesan' => 'Akun ini belum memiliki nomor telepon terdaftar untuk pengiriman WhatsApp.',
                ], 422);
            }

            $hasil = Layanan2FA::kirimOtpWhatsapp($user);

            return response()->json([
                'berhasil' => true,
                'metode' => 'whatsapp',
                'tujuan' => $hasil['no_telp_masked'],
                'kode_simulasi' => !$hasil['terkirim_gateway'] ? $hasil['otp'] : null,
                'pesan' => $hasil['terkirim_gateway']
                    ? "Kode OTP 6 digit telah dikirimkan ke WhatsApp {$hasil['no_telp_masked']}."
                    : "Mode Simulasi Lokal: Kode OTP WhatsApp untuk {$hasil['no_telp_masked']} adalah {$hasil['otp']}.",
            ]);
        }

        if ($metode === 'google_prompt') {
            $tantangan = Layanan2FA::buatTantanganPrompt($user, $request);

            return response()->json([
                'berhasil' => true,
                'metode' => 'google_prompt',
                'promptData' => [
                    'id' => $tantangan['id'],
                    'angka_target' => $tantangan['angka_target'],
                    'status' => $tantangan['status'],
                    'expires_at' => $tantangan['expires_at'],
                ],
                'pesan' => 'Dialog konfirmasi telah dikirimkan ke perangkat Anda yang sedang aktif login.',
            ]);
        }

        // Default: Email OTP
        $otp = Layanan2FA::kirimOtpEmail($user);
        $emailMasked = Layanan2FA::sensorEmail($user->email);

        return response()->json([
            'berhasil' => true,
            'metode' => 'email',
            'tujuan' => $emailMasked,
            'kode_simulasi' => config('mail.default') === 'log' || config('app.debug') ? $otp : null,
            'pesan' => "Kode OTP 6 digit telah dikirim ke alamat email {$emailMasked}.",
        ]);
    }

    /**
     * Periksa status terkini dari tantangan Dialog Google Prompt (polling dua arah).
     */
    public function cekStatusPrompt(Request $request): JsonResponse
    {
        $userId = $request->session()->get('login.2fa.user_id');
        if (!$userId) {
            return response()->json(['status' => 'unauthenticated'], 401);
        }

        $user = User::find($userId);
        if (!$user) {
            return response()->json(['status' => 'unauthenticated'], 401);
        }

        $tantangan = $user->two_factor_prompt_challenge;
        if (!is_array($tantangan)) {
            return response()->json(['status' => 'none']);
        }

        if (($tantangan['status'] ?? '') === 'pending' && now()->timestamp > (int) ($tantangan['expires_at'] ?? 0)) {
            return response()->json(['status' => 'expired']);
        }

        return response()->json([
            'id' => $tantangan['id'] ?? null,
            'status' => $tantangan['status'] ?? 'pending',
            'angka_target' => $tantangan['angka_target'] ?? null,
        ]);
    }

    /**
     * Verifikasi 2FA / MFA (TOTP, Email, WhatsApp, Kode Cadangan 10 Digit, Google Prompt, Passkey, atau Security Key)
     * dan tuntaskan proses login.
     */
    public function store(Request $request): RedirectResponse
    {
        $userId = $request->session()->get('login.2fa.user_id');
        $remember = (bool) $request->session()->get('login.2fa.remember', false);
        $appId = $request->session()->get('login.2fa.app_id');
        $redirectUri = $request->session()->get('login.2fa.redirect_uri');

        if (!$userId) {
            return redirect()->route('login');
        }

        $user = User::findOrFail($userId);

        $request->validate([
            'metode' => ['nullable', 'string'],
            'code' => ['nullable', 'string'],
            'recovery_code' => ['nullable', 'string'],
            'credential_id' => ['nullable', 'string'],
            'client_data_json' => ['nullable', 'string'],
            'remember_device' => ['nullable', 'boolean'],
        ]);

        $metode = (string) ($request->metode ?: ($request->filled('recovery_code') ? 'backup_codes' : ($user->two_factor_type ?: 'totp')));
        $isValid = false;

        if ($metode === 'backup_codes' || $request->filled('recovery_code')) {
            $kodeCadangan = (string) ($request->recovery_code ?: $request->code);
            $isValid = Layanan2FA::verifyAndConsumeRecoveryCode($user, $kodeCadangan);
            if (!$isValid) {
                throw ValidationException::withMessages([
                    'recovery_code' => 'Kode cadangan 10 digit tidak valid atau sudah pernah digunakan sebelumnya.',
                ]);
            }
        } elseif ($metode === 'google_prompt') {
            $tantangan = $user->two_factor_prompt_challenge;
            if (is_array($tantangan) && ($tantangan['status'] ?? '') === 'approved') {
                $isValid = true;
                $user->update(['two_factor_prompt_challenge' => null]);
            } else {
                throw ValidationException::withMessages([
                    'code' => 'Permintaan masuk belum disetujui dari perangkat Anda yang lain.',
                ]);
            }
        } elseif (in_array($metode, ['passkey', 'security_key'], true)) {
            $credentialId = (string) $request->credential_id;
            $clientDataJson = (string) $request->client_data_json;
            $expectedChallenge = (string) $request->session()->get('login.2fa.webauthn_challenge', '');

            if (empty($credentialId) || empty($clientDataJson)) {
                throw ValidationException::withMessages([
                    'code' => 'Data otentikasi Kunci Sandi / Kunci Keamanan tidak lengkap.',
                ]);
            }

            $isValid = Layanan2FA::verifikasiKredensialWebAuthn($user, $credentialId, $clientDataJson, $expectedChallenge);
            if (!$isValid) {
                throw ValidationException::withMessages([
                    'code' => 'Kunci Sandi atau Kunci Keamanan tidak dikenali pada akun ini.',
                ]);
            }
        } elseif ($metode === 'whatsapp') {
            $code = (string) $request->code;
            if (empty($code)) {
                throw ValidationException::withMessages([
                    'code' => 'Kode OTP WhatsApp 6 digit wajib diisi.',
                ]);
            }
            $isValid = Layanan2FA::verifyWhatsappOtp($user, $code);
            if (!$isValid) {
                throw ValidationException::withMessages([
                    'code' => 'Kode OTP WhatsApp salah atau sudah kadaluarsa.',
                ]);
            }
        } elseif ($metode === 'email') {
            $code = (string) $request->code;
            if (empty($code)) {
                throw ValidationException::withMessages([
                    'code' => 'Kode OTP Email 6 digit wajib diisi.',
                ]);
            }
            $isValid = Layanan2FA::verifyEmailOtp($user, $code);
            if (!$isValid) {
                throw ValidationException::withMessages([
                    'code' => 'Kode OTP Email salah atau sudah kadaluarsa.',
                ]);
            }
        } else {
            // Default: TOTP 6 Digit
            $code = (string) $request->code;
            if (empty($code)) {
                throw ValidationException::withMessages([
                    'code' => 'Kode verifikasi Authenticator 6 digit wajib diisi.',
                ]);
            }
            $secret = (string) $user->two_factor_secret;
            $isValid = Layanan2FA::verifyTotpCode($secret, $code);
            if (!$isValid) {
                throw ValidationException::withMessages([
                    'code' => 'Kode verifikasi Authenticator salah atau kadaluarsa. Pastikan jam pada perangkat Anda sudah akurat (otomatis).',
                ]);
            }
        }

        // Login pengguna resmi ke session
        Auth::loginUsingId($user->id, $remember);
        $request->session()->regenerate();

        // Simpan sesi multi-akun & catat silsilah penambahan akun
        $labelMetode = Layanan2FA::SEMUA_METODE[$metode]['nama'] ?? strtoupper($metode);
        \App\Services\LayananSesiPerangkat::daftarkanAkunKeSesi($request, $user, "Verifikasi 2FA ({$labelMetode})", true);

        // Bersihkan session 2FA
        $request->session()->forget([
            'login.2fa.user_id',
            'login.2fa.remember',
            'login.2fa.app_id',
            'login.2fa.redirect_uri',
            'login.2fa.webauthn_challenge',
        ]);

        // Tangani Ingat Perangkat Terpercaya (Remember Device)
        $pengaturan = Layanan2FA::dapatkanPengaturan();
        if ($request->boolean('remember_device')) {
            $durasiHari = (int) ($pengaturan->two_factor_remember_browser_days ?: 30);
            if (empty($user->remember_token)) {
                $user->setRememberToken(\Illuminate\Support\Str::random(60));
                $user->save();
            }
            $hashToken = hash('sha256', (string) $user->remember_token);
            Cookie::queue('sso_2fa_remember_' . $user->id, $hashToken, $durasiHari * 1440);
        }

        // Jika login diawali dari aplikasi SSO pihak ketiga (client_id / app_id)
        if ($appId) {
            $app = \App\Models\RegisteredApp::find($appId);

            if ($app && $app->is_active && !empty($app->login_callback_url)) {
                $user = $user->load('roles');
                $peranUser = $user->roles->pluck('nama_role')->toArray();
                $token = \App\Services\LayananJWT::buatToken([
                    'user_id' => $user->id,
                    'nomor_induk' => $user->nip_nis ?: $user->nik,
                    'nama' => $user->nama_lengkap,
                    'roles' => $peranUser,
                    'exp' => time() + 300,
                ]);

                $callbackUrl = $redirectUri ?: $app->login_callback_url;
                $pemisah = str_contains($callbackUrl, '?') ? '&' : '?';

                return redirect()->route('sso.redirect', ['url' => $callbackUrl . $pemisah . 'token=' . $token]);
            }
        }

        // Alihkan ke halaman tujuan sesuai peran
        if ($user->hasRole('Super Admin') || $user->hasRole('superadmin')) {
            return redirect()->intended(route('superadmin.beranda', absolute: false));
        }

        if ($user->hasRole('Admin') || $user->hasRole('admin')) {
            return redirect()->intended(route('admin.beranda', absolute: false));
        }

        return redirect()->intended(route('dasbor', absolute: false));
    }

    /**
     * Batalkan proses tantangan 2FA dan kembali ke formulir login (atau beranda jika sedang multi-akun).
     */
    public function cancel(Request $request): RedirectResponse
    {
        $request->session()->forget([
            'login.2fa.user_id',
            'login.2fa.remember',
            'login.2fa.app_id',
            'login.2fa.redirect_uri',
            'login.2fa.webauthn_challenge',
        ]);

        return redirect()->route('login');
    }
}
