<?php

declare(strict_types=1);

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\UserCorrection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class KeamananAkunController extends Controller
{
    /**
     * Tampilkan halaman keamanan akun beserta sesi aktif dan data pengajuan perbaikan profil.
     */
    public function indeks(): Response
    {
        $user = Auth::user();

        $sessions = DB::table('sessions')
            ->where('user_id', $user->id)
            ->orderBy('last_activity', 'desc')
            ->get()
            ->map(function ($session) {
                $agent = $this->parseUserAgent((string) $session->user_agent);
                return [
                    'id' => $session->id,
                    'ip_address' => $session->ip_address ?: 'Tidak Diketahui',
                    'os' => $agent['os'],
                    'browser' => $agent['browser'],
                    'device_icon' => $agent['icon'],
                    'terakhir_aktif' => \Carbon\Carbon::createFromTimestamp($session->last_activity)->diffForHumans(),
                    'adalah_saat_ini' => $session->id === session()->getId(),
                ];
            });

        // Cari pengajuan perbaikan data yang berstatus pending dari pengguna ini
        $pendingCorrection = UserCorrection::where('user_id_asli', $user->id)
            ->where('status_correction', 'pending')
            ->first();

        // Data konfigurasi 2FA pengguna & sistem
        $twoFactorPengaturan = \App\Services\Layanan2FA::dapatkanPengaturan();
        $twoFactorInfo = [
            'enabled' => $user->hasEnabledTwoFactor(),
            'type' => $user->two_factor_type ?: 'totp',
            'confirmed_at' => $user->two_factor_confirmed_at ? $user->two_factor_confirmed_at->format('d/m/Y H:i') : null,
            'is_required' => \App\Services\Layanan2FA::apakahUserWajib2FA($user, $twoFactorPengaturan),
            'system_enabled' => (bool) $twoFactorPengaturan->two_factor_enabled,
            'allowed_methods' => (array) ($twoFactorPengaturan->two_factor_allowed_methods ?: ['totp', 'email']),
            'has_recovery_codes' => !empty($user->two_factor_recovery_codes),
        ];

        return Inertia::render('Superadmin/KeamananAkun/Indeks', [
            'daftarSesi' => $sessions,
            'pengguna' => $user,
            'pendingCorrection' => $pendingCorrection,
            'twoFactor' => $twoFactorInfo,
        ]);
    }

    /**
     * Inisiasi pembuatan secret 2FA & QR Code untuk pengguna.
     */
    public function generate2FA(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = Auth::user();
        $secret = \App\Services\Layanan2FA::generateSecret();
        $recoveryCodes = \App\Services\Layanan2FA::generateRecoveryCodes();
        $appName = config('app.name', 'SSO Sekolah');
        $provisioningUri = \App\Services\Layanan2FA::getProvisioningUri($user->email, $secret, $appName);
        $qrCodeUrl = \App\Services\Layanan2FA::getQrCodeImageUrl($provisioningUri);

        session([
            'temp_2fa_secret' => $secret,
            'temp_2fa_recovery' => $recoveryCodes,
        ]);

        return response()->json([
            'secret' => $secret,
            'qr_code_url' => $qrCodeUrl,
            'provisioning_uri' => $provisioningUri,
            'recovery_codes' => $recoveryCodes,
        ]);
    }

    /**
     * Konfirmasi kode OTP dan simpan status aktif 2FA pengguna.
     */
    public function confirm2FA(Request $request): RedirectResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ], [
            'code.required' => 'Kode verifikasi OTP wajib diisi.',
            'code.size' => 'Kode OTP harus terdiri dari 6 digit.',
        ]);

        $secret = (string) session('temp_2fa_secret');
        $recoveryCodes = (array) session('temp_2fa_recovery', []);

        if (empty($secret)) {
            return redirect()->back()->with('error', 'Sesi inisiasi 2FA telah kadaluarsa. Silakan klik tombol Aktifkan kembali.');
        }

        if (!\App\Services\Layanan2FA::verifyTotpCode($secret, $request->code)) {
            return redirect()->back()->withErrors([
                'code' => 'Kode verifikasi OTP salah atau kadaluarsa. Pastikan jam di HP/perangkat Anda sudah akurat/otomatis.',
            ]);
        }

        $user = Auth::user();
        $user->update([
            'two_factor_secret' => $secret,
            'two_factor_recovery_codes' => $recoveryCodes,
            'two_factor_confirmed_at' => now(),
            'two_factor_type' => 'totp',
        ]);

        session()->forget(['temp_2fa_secret', 'temp_2fa_recovery']);
        \App\Services\LayananLogAktivitas::catat('Berhasil mengaktifkan autentikasi dua faktor (2FA) mandiri');

        return redirect()->back()->with('success', 'Autentikasi Dua Faktor (2FA) berhasil diaktifkan! Akun Anda kini terlindungi.');
    }

    /**
     * Nonaktifkan 2FA pengguna secara mandiri.
     */
    public function disable2FA(Request $request): RedirectResponse
    {
        $request->validate([
            'current_password' => ['required', 'current_password'],
        ], [
            'current_password.required' => 'Kata sandi akun wajib diisi untuk konfirmasi.',
            'current_password.current_password' => 'Kata sandi yang Anda masukkan salah.',
        ]);

        $user = Auth::user();
        \App\Services\Layanan2FA::resetUser2FA($user);

        \App\Services\LayananLogAktivitas::catat('Menonaktifkan autentikasi dua faktor (2FA) mandiri');

        return redirect()->back()->with('success', 'Autentikasi Dua Faktor (2FA) telah berhasil dinonaktifkan.');
    }

    /**
     * Kirim/Ajukan pengajuan perbaikan data profil.
     */
    public function ajukanPerubahan(Request $request): RedirectResponse
    {
        $user = Auth::user();

        $request->validate([
            'nama_lengkap' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'jk' => ['nullable', 'string', 'in:L,P'],
            'tgl_lahir' => ['nullable', 'date'],
            'nik' => ['nullable', 'string', 'max:16', 'regex:/^[0-9]+$/'],
            'nip_nis' => ['nullable', 'string', 'max:18', 'regex:/^[0-9]+$/'],
            'no_telp' => ['nullable', 'string', 'max:20'],
            'alamat' => ['nullable', 'string'],
        ], [
            'nama_lengkap.required' => 'Nama lengkap wajib diisi.',
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email sudah digunakan oleh pengguna lain.',
            'nik.max' => 'NIK maksimal 16 digit angka.',
            'nik.regex' => 'NIK harus berupa angka.',
            'nip_nis.max' => 'Nomor Induk (NIP/NISN) maksimal 18 digit angka.',
            'nip_nis.regex' => 'Nomor Induk (NIP/NISN) harus berupa angka.',
        ]);

        DB::transaction(function () use ($user, $request) {
            // update atau buat usulan baru
            UserCorrection::updateOrCreate([
                'user_id_asli' => $user->id,
                'status_correction' => 'pending',
            ], [
                'nama_lengkap' => $request->nama_lengkap,
                'email' => $request->email,
                'jk' => $request->jk,
                'tgl_lahir' => $request->tgl_lahir,
                'nik' => $request->nik,
                'nip_nis' => $request->nip_nis,
                'no_telp' => $request->no_telp,
                'alamat' => $request->alamat,
                'submitted_at' => now(),
            ]);
        });

        \App\Services\LayananLogAktivitas::catat('Mengajukan perbaikan data profil akun');

        return redirect()->back()->with('success', 'Pengajuan perbaikan data profil berhasil dikirim dan sedang menunggu persetujuan admin.');
    }

    /**
     * Akhiri sesi perangkat tertentu.
     */
    public function hapusSesi(string $id): RedirectResponse
    {
        DB::transaction(function () use ($id) {
            DB::table('sessions')
                ->where('id', $id)
                ->where('user_id', Auth::id())
                ->delete();
        });

        \App\Services\LayananLogAktivitas::catat('Mengakhiri sesi perangkat (' . substr($id, 0, 8) . '...)');

        return redirect()->back()->with('success', 'Sesi perangkat berhasil diakhiri.');
    }

    /**
     * Akhiri semua sesi perangkat lain kecuali sesi saat ini.
     */
    public function hapusSesiLainnya(): RedirectResponse
    {
        $currentSessionId = session()->getId();

        DB::transaction(function () use ($currentSessionId) {
            DB::table('sessions')
                ->where('user_id', Auth::id())
                ->where('id', '!=', $currentSessionId)
                ->delete();
        });

        \App\Services\LayananLogAktivitas::catat('Mengakhiri semua sesi perangkat lainnya');

        return redirect()->back()->with('success', 'Semua sesi perangkat lainnya berhasil diakhiri.');
    }

    /**
     * Helper untuk parse user agent sederhana.
     */
    private function parseUserAgent(string $userAgent): array
    {
        $os = 'Sistem Operasi Tidak Diketahui';
        $browser = 'Browser Tidak Diketahui';
        $icon = 'desktop_windows';

        // Deteksi OS
        if (preg_match('/windows|win32/i', $userAgent)) {
            $os = 'Windows';
            $icon = 'desktop_windows';
        } elseif (preg_match('/macintosh|mac os x/i', $userAgent)) {
            $os = 'macOS';
            $icon = 'desktop_mac';
        } elseif (preg_match('/iphone|ipad/i', $userAgent)) {
            $os = 'iOS';
            $icon = 'phone_iphone';
        } elseif (preg_match('/android/i', $userAgent)) {
            $os = 'Android';
            $icon = 'phone_android';
        } elseif (preg_match('/linux/i', $userAgent)) {
            $os = 'Linux';
            $icon = 'terminal';
        }

        // Deteksi Browser
        if (preg_match('/chrome/i', $userAgent) && !preg_match('/edge|edg/i', $userAgent) && !preg_match('/opr|opera/i', $userAgent)) {
            $browser = 'Google Chrome';
        } elseif (preg_match('/safari/i', $userAgent) && !preg_match('/chrome/i', $userAgent)) {
            $browser = 'Apple Safari';
        } elseif (preg_match('/firefox/i', $userAgent)) {
            $browser = 'Mozilla Firefox';
        } elseif (preg_match('/edge|edg/i', $userAgent)) {
            $browser = 'Microsoft Edge';
        } elseif (preg_match('/opr|opera/i', $userAgent)) {
            $browser = 'Opera';
        }

        return ['os' => $os, 'browser' => $browser, 'icon' => $icon];
    }
}
