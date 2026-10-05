<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Layanan2FA;
use App\Services\LayananLogAktivitas;
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
     * Tampilkan halaman tantangan kode 2FA saat login.
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

        return Inertia::render('Auth/TwoFactorChallenge', [
            'email' => $user->email,
            'nama' => $user->nama_lengkap,
            'type' => $user->two_factor_type ?: 'totp',
        ]);
    }

    /**
     * Verifikasi kode 2FA (TOTP atau Recovery Code) dan tuntaskan proses login.
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
            'code' => ['nullable', 'string'],
            'recovery_code' => ['nullable', 'string'],
            'remember_device' => ['nullable', 'boolean'],
        ]);

        $isValid = false;

        // Cek jika menggunakan Kode Pemulihan (Recovery Code)
        if ($request->filled('recovery_code')) {
            $isValid = Layanan2FA::verifyAndConsumeRecoveryCode($user, (string) $request->recovery_code);
            if (!$isValid) {
                throw ValidationException::withMessages([
                    'recovery_code' => 'Kode pemulihan tidak valid atau sudah pernah digunakan sebelumnya.',
                ]);
            }
        } else {
            // Cek jika menggunakan Kode OTP 6 Digit
            $code = (string) $request->code;
            if (empty($code)) {
                throw ValidationException::withMessages([
                    'code' => 'Kode verifikasi 6 digit wajib diisi.',
                ]);
            }

            if ($user->two_factor_type === 'email') {
                $isValid = Layanan2FA::verifyEmailOtp($user, $code);
            } else {
                $secret = (string) $user->two_factor_secret;
                $isValid = Layanan2FA::verifyTotpCode($secret, $code);
            }

            if (!$isValid) {
                throw ValidationException::withMessages([
                    'code' => 'Kode verifikasi OTP salah atau kadaluarsa. Pastikan jam pada perangkat Anda sudah akurat (otomatis).',
                ]);
            }
        }

        // Login pengguna resmi ke session
        Auth::loginUsingId($user->id, $remember);
        $request->session()->regenerate();

        // Bersihkan session 2FA
        $request->session()->forget([
            'login.2fa.user_id',
            'login.2fa.remember',
            'login.2fa.app_id',
            'login.2fa.redirect_uri',
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

        LayananLogAktivitas::catat('Verifikasi 2FA sukses saat login', $user->email, $user->id);

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
     * Batalkan proses tantangan 2FA dan kembali ke formulir login.
     */
    public function cancel(Request $request): RedirectResponse
    {
        $request->session()->forget([
            'login.2fa.user_id',
            'login.2fa.remember',
            'login.2fa.app_id',
            'login.2fa.redirect_uri',
        ]);

        return redirect()->route('login');
    }
}
