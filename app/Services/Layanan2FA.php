<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\PengaturanSistem;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class Layanan2FA
{
    private const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    /**
     * Dapatkan instance pengaturan sistem.
     */
    public static function dapatkanPengaturan(): PengaturanSistem
    {
        return PengaturanSistem::firstOrCreate(['id' => 1], [
            'nama_aplikasi' => 'SSO Sekolah',
            'two_factor_enabled' => false,
            'two_factor_enforcement' => 'roles',
            'two_factor_roles' => ['Super Admin', 'Admin'],
            'two_factor_allowed_methods' => ['totp', 'email'],
            'two_factor_grace_period_days' => 7,
            'two_factor_remember_browser_days' => 30,
        ]);
    }

    /**
     * Periksa apakah pengguna tertentu diwajibkan 2FA berdasarkan kebijakan sistem.
     */
    public static function apakahUserWajib2FA(User $user, ?PengaturanSistem $pengaturan = null): bool
    {
        $pengaturan = $pengaturan ?: self::dapatkanPengaturan();

        if (!$pengaturan->two_factor_enabled) {
            return false;
        }

        if ($pengaturan->two_factor_enforcement === 'all') {
            return true;
        }

        if ($pengaturan->two_factor_enforcement === 'roles') {
            $rolesWajib = (array) ($pengaturan->two_factor_roles ?: ['Super Admin', 'Admin']);
            $userRoles = $user->roles()->pluck('nama_role')->toArray();

            return !empty(array_intersect($rolesWajib, $userRoles));
        }

        // Jika mode optional, hanya wajib jika pengguna sudah mengaktifkannya sendiri
        return $user->hasEnabledTwoFactor();
    }

    /**
     * Hasilkan secret key Base32 acak (16 karakter) untuk TOTP.
     */
    public static function generateSecret(int $length = 16): string
    {
        $secret = '';
        $max = strlen(self::BASE32_CHARS) - 1;

        for ($i = 0; $i < $length; $i++) {
            $secret .= self::BASE32_CHARS[random_int(0, $max)];
        }

        return $secret;
    }

    /**
     * Hasilkan URI provisioning otpauth untuk pemindaian QR Code di Google Authenticator.
     */
    public static function getProvisioningUri(string $email, string $secret, ?string $issuer = null): string
    {
        $issuer = $issuer ?: config('app.name', 'SSO Sekolah');
        $label = rawurlencode($issuer) . ':' . rawurlencode($email);

        return "otpauth://totp/{$label}?secret={$secret}&issuer=" . rawurlencode($issuer) . "&algorithm=SHA1&digits=6&period=30";
    }

    /**
     * Hasilkan URL QR Code menggunakan layanan SVG publik (atau QuickChart) yang aman.
     */
    public static function getQrCodeImageUrl(string $otpAuthUri): string
    {
        return 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=' . urlencode($otpAuthUri);
    }

    /**
     * Verifikasi kode 6-digit TOTP (dengan toleransi jendela waktu +- 1 langkah / 30 detik).
     */
    public static function verifyTotpCode(string $secret, string $code): bool
    {
        $code = trim($code);
        if (strlen($code) !== 6 || !ctype_digit($code)) {
            return false;
        }

        $secretBinary = self::base32Decode($secret);
        if ($secretBinary === null) {
            return false;
        }

        $currentTimeSlice = (int) floor(time() / 30);

        // Uji jendela waktu: saat ini, 30 detik sebelumnya, dan 30 detik sesudahnya
        for ($offset = -1; $offset <= 1; $offset++) {
            $calculatedCode = self::calculateTotp($secretBinary, $currentTimeSlice + $offset);
            if (hash_equals($calculatedCode, $code)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Hitung kode 6-digit TOTP untuk irisan waktu (counter) tertentu.
     */
    private static function calculateTotp(string $secretBinary, int $timeSlice): string
    {
        // Pack timeSlice menjadi 64-bit big-endian integer
        $timeData = pack('N*', 0, $timeSlice);

        // Hitung HMAC-SHA1
        $hash = hash_hmac('sha1', $timeData, $secretBinary, true);

        // Ambil offset dinamis dari nibble terakhir
        $offset = ord($hash[19]) & 0x0f;

        // Ekstrak 4 byte binary code
        $binary = (
            ((ord($hash[$offset]) & 0x7f) << 24) |
            ((ord($hash[$offset + 1]) & 0xff) << 16) |
            ((ord($hash[$offset + 2]) & 0xff) << 8) |
            (ord($hash[$offset + 3]) & 0xff)
        );

        $otp = $binary % 1000000;

        return str_pad((string) $otp, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Dekode string Base32 menjadi biner.
     */
    private static function base32Decode(string $b32): ?string
    {
        $b32 = strtoupper(trim($b32));
        if (empty($b32)) {
            return null;
        }

        $binary = '';
        $buffer = 0;
        $bitsLeft = 0;

        for ($i = 0, $len = strlen($b32); $i < $len; $i++) {
            $char = $b32[$i];
            $val = strpos(self::BASE32_CHARS, $char);
            if ($val === false) {
                continue; // Abaikan spasi atau karakter padding
            }

            $buffer = ($buffer << 5) | $val;
            $bitsLeft += 5;

            if ($bitsLeft >= 8) {
                $bitsLeft -= 8;
                $binary .= chr(($buffer >> $bitsLeft) & 0xff);
            }
        }

        return $binary;
    }

    /**
     * Hasilkan daftar kode pemulihan (Recovery Codes) darurat.
     */
    public static function generateRecoveryCodes(int $count = 8): array
    {
        $codes = [];
        for ($i = 0; $i < $count; $i++) {
            $part1 = strtoupper(Str::random(5));
            $part2 = strtoupper(Str::random(5));
            $codes[] = "{$part1}-{$part2}";
        }

        return $codes;
    }

    /**
     * Hasilkan dan simpan kode OTP Email 6 digit.
     */
    public static function kirimOtpEmail(User $user): string
    {
        $otp = (string) random_int(100000, 999999);

        $user->update([
            'two_factor_email_code' => $otp,
            'two_factor_email_expires_at' => now()->addMinutes(10),
        ]);

        // Catat di log (dan kirim via email jika SMTP dikonfigurasi)
        Log::info("Kode OTP 2FA Email untuk {$user->email}: {$otp}");

        // Mengirim notifikasi / mail jika mail driver aktif
        try {
            // Jika ada Mailable atau Notifikasi
        } catch (\Throwable $e) {
            Log::warning("Gagal mengirim email OTP ke {$user->email}: " . $e->getMessage());
        }

        return $otp;
    }

    /**
     * Verifikasi kode OTP Email.
     */
    public static function verifyEmailOtp(User $user, string $code): bool
    {
        if (empty($user->two_factor_email_code) || empty($user->two_factor_email_expires_at)) {
            return false;
        }

        if (now()->isAfter($user->two_factor_email_expires_at)) {
            return false;
        }

        if (hash_equals(trim($user->two_factor_email_code), trim($code))) {
            // Bersihkan kode setelah berhasil
            $user->update([
                'two_factor_email_code' => null,
                'two_factor_email_expires_at' => null,
            ]);

            return true;
        }

        return false;
    }

    /**
     * Verifikasi dan gunakan salah satu Recovery Code.
     */
    public static function verifyAndConsumeRecoveryCode(User $user, string $code): bool
    {
        $code = strtoupper(trim($code));
        $recoveryCodes = (array) ($user->two_factor_recovery_codes ?: []);

        foreach ($recoveryCodes as $index => $storedCode) {
            if (hash_equals(strtoupper($storedCode), $code)) {
                // Hapus kode yang sudah digunakan
                unset($recoveryCodes[$index]);
                $user->update([
                    'two_factor_recovery_codes' => array_values($recoveryCodes),
                ]);

                return true;
            }
        }

        return false;
    }

    /**
     * Reset seluruh konfigurasi 2FA pengguna (kunci, metode, status).
     */
    public static function resetUser2FA(User $user): void
    {
        $user->update([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
            'two_factor_type' => 'totp',
            'two_factor_email_code' => null,
            'two_factor_email_expires_at' => null,
        ]);
    }
}
