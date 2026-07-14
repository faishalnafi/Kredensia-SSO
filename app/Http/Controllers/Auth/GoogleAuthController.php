<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\RegisteredApp;
use App\Services\LayananJWT;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Validation\ValidationException;

class GoogleAuthController extends Controller
{
    /**
     * Redirect the user to the Google authentication page.
     */
    public function redirectToGoogle(): RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    /**
     * Obtain the user information from Google.
     */
    public function handleGoogleCallback(): RedirectResponse
    {
        try {
            $googleUser = Socialite::driver('google')->user();
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Google Auth Error: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString()
            ]);
            return redirect()->route('login')->withErrors([
                'email' => 'Gagal melakukan otentikasi dengan Google. Silakan coba lagi.',
            ]);
        }

        // Cari berdasarkan google_id atau email (eager load roles untuk menghindari N+1)
        $user = User::with('roles')->where('google_id', $googleUser->getId())
            ->orWhere('email', $googleUser->getEmail())
            ->first();

        // 1. Jika email tidak terdaftar
        if (! $user) {
            \App\Services\LayananLogAktivitas::catat('Percobaan login via Google gagal (email tidak terdaftar: ' . $googleUser->getEmail() . ')', $googleUser->getEmail());
            return redirect()->route('login')->withErrors([
                'email' => 'Akun Google Anda (' . $googleUser->getEmail() . ') belum diverifikasi. Silakan verifikasi akun Anda terlebih dahulu.',
            ]);
        }

        // 2. Jika akun dinonaktifkan
        if (! $user->is_active) {
            \App\Services\LayananLogAktivitas::catat('Percobaan login via Google ditolak (akun nonaktif)', $user->email, $user->id);
            return redirect()->route('login')->withErrors([
                'email' => 'Akun Anda telah dinonaktifkan. Silakan hubungi admin.',
            ]);
        }

        // Transaksi ACID: Simpan data Google dan status klaim secara atomik.
        // Jika save() gagal (misal google_id sudah terdaftar user lain), login dibatalkan.
        try {
            DB::transaction(function () use ($user, $googleUser) {
                $user->forceFill([
                    'google_id'     => $googleUser->getId(),
                    'google_email'  => filter_var($googleUser->getEmail(), FILTER_SANITIZE_EMAIL),
                    'google_name'   => strip_tags((string) $googleUser->getName()),
                    'google_avatar' => filter_var($googleUser->getAvatar(), FILTER_SANITIZE_URL),
                ]);

                if (is_null($user->claimed_at)) {
                    $user->claimed_at = now();
                }

                $user->save();
            });
        } catch (\Throwable $e) {
            Log::error('Google Auth DB Transaction Error', [
                'user_id' => $user->id,
                'error'   => $e->getMessage(),
            ]);
            return redirect()->route('login')->withErrors([
                'email' => 'Terjadi kesalahan saat menyimpan data otentikasi Google. Silakan coba lagi.',
            ]);
        }

        // Login user
        Auth::login($user, true);

        // Atur masa hidup sesi default (24 jam karena Google login menggunakan remember secara default)
        $lifetime = 1440;
        session(['session_lifetime' => $lifetime]);
        config(['session.lifetime' => $lifetime]);

        $request = request();
        $request->session()->regenerate();

        // Cek apakah ada proses login SSO untuk aplikasi tertentu
        if ($request->session()->has('sso_app_id')) {
            $appId = $request->session()->get('sso_app_id');
            $app = RegisteredApp::find($appId);

            if ($app && $app->is_active) {
                // Periksa hak akses peran jika aplikasi dibatasi visibilitasnya
                if (!$app->is_global_visibility) {
                    $userRoleIds = $user->roles->pluck('id')->toArray();
                    $hasAccess = $app->roles()->whereIn('roles.id', $userRoleIds)->exists();

                    if (!$hasAccess) {
                        Auth::guard('web')->logout();
                        $request->session()->invalidate();
                        $request->session()->regenerateToken();
                        
                        \App\Services\LayananLogAktivitas::catat('Ditolak akses ke aplikasi ' . $app->nama_aplikasi . ' via Google (tidak memiliki peran)', $user->email, $user->id);

                        return redirect()->route('login')->withErrors([
                            'email' => 'Anda tidak memiliki peran (hak akses) untuk menggunakan aplikasi ' . $app->nama_aplikasi . '.',
                        ]);
                    }
                }

                // Hasilkan token JWT
                $peranUser = $user->roles->pluck('nama_role')->toArray();
                $token = LayananJWT::buatToken([
                    'user_id' => $user->id,
                    'nomor_induk' => $user->nip_nis ?: $user->nik,
                    'nama' => $user->nama_lengkap,
                    'roles' => $peranUser,
                    'exp' => time() + 300, // Token kadaluarsa dalam 5 menit
                ]);

                $callbackUrl = $request->session()->get('sso_redirect_uri') ?: $app->login_callback_url;

                $request->session()->forget(['sso_app_id', 'sso_redirect_uri']);
                
                $pemisah = str_contains($callbackUrl, '?') ? '&' : '?';

                \App\Services\LayananLogAktivitas::catat('Otentikasi SSO sukses via Google ke aplikasi: ' . $app->nama_aplikasi, $user->email, $user->id);

                return redirect()->away($callbackUrl . $pemisah . 'token=' . $token);
            }
        }

        \App\Services\LayananLogAktivitas::catat('Login sukses via Google', $user->email, $user->id);

        // Redirect ke beranda berdasarkan peran
        if ($user->hasRole('Super Admin') || $user->hasRole('superadmin')) {
            return redirect()->intended(route('superadmin.beranda'));
        }

        if ($user->hasRole('Admin') || $user->hasRole('admin')) {
            return redirect()->intended(route('admin.beranda'));
        }

        return redirect()->intended(route('beranda'));
    }
}
