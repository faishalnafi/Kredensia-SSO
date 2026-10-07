<?php

declare(strict_types=1);

namespace App\Services;

use App\Events\TantanganGooglePrompt;
use App\Models\PengaturanSistem;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class Layanan2FA
{
    private const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    /**
     * Daftar seluruh metode 2FA / MFA yang didukung maupun ditampilkan di sistem.
     */
    public const SEMUA_METODE = [
        'totp' => [
            'kode' => 'totp',
            'nama' => 'Aplikasi Authenticator (TOTP)',
            'deskripsi' => 'Gunakan Google Authenticator, Authy, atau Microsoft Authenticator untuk kode 6 digit yang berubah setiap 30 detik.',
            'aktif_sistem' => true,
        ],
        'google_prompt' => [
            'kode' => 'google_prompt',
            'nama' => 'Dialog Perangkat (Mirip Google Prompt)',
            'deskripsi' => 'Ketuk "Ya" dan cocokkan angka pada dialog yang muncul otomatis di perangkat Anda yang sedang aktif login.',
            'aktif_sistem' => true,
        ],
        'whatsapp' => [
            'kode' => 'whatsapp',
            'nama' => 'OTP Nomor Telepon via WhatsApp',
            'deskripsi' => 'Kirim kode verifikasi 6 digit secara instan ke nomor WhatsApp yang terdaftar di profil Anda.',
            'aktif_sistem' => true,
        ],
        'sms' => [
            'kode' => 'sms',
            'nama' => 'OTP Nomor Telepon via SMS',
            'deskripsi' => 'Kirim kode verifikasi 6 digit melalui pesan singkat SMS seluler (Saat ini dinonaktifkan oleh sistem).',
            'aktif_sistem' => false,
        ],
        'email' => [
            'kode' => 'email',
            'nama' => 'OTP via Email',
            'deskripsi' => 'Kirim kode verifikasi 6 digit sekali pakai ke alamat email resmi yang terhubung dengan akun Anda.',
            'aktif_sistem' => true,
        ],
        'passkey' => [
            'kode' => 'passkey',
            'nama' => 'Kunci Sandi (Passkey Biometrik)',
            'deskripsi' => 'Masuk cepat menggunakan Sidik Jari, Face ID, Touch ID, atau Windows Hello di perangkat ini.',
            'aktif_sistem' => true,
        ],
        'security_key' => [
            'kode' => 'security_key',
            'nama' => 'Kunci Keamanan (Hardware Security Key)',
            'deskripsi' => 'Gunakan kunci keamanan fisik FIDO2 (USB, NFC, atau Bluetooth seperti YubiKey / Google Titan).',
            'aktif_sistem' => true,
        ],
        'backup_codes' => [
            'kode' => 'backup_codes',
            'nama' => 'Kode Cadangan 10 Digit',
            'deskripsi' => 'Gunakan salah satu dari 10 kode angka cadangan (10 digit) saat Anda tidak membawa perangkat utama.',
            'aktif_sistem' => true,
        ],
    ];

    /**
     * Template pesan WhatsApp OTP default (mendukung placeholder {otp}, {nama}, {email}, {no_telp}, {aplikasi}, {menit}, {waktu}).
     */
    public const DEFAULT_WA_TEMPLATE = "*[{aplikasi} - VERIFIKASI KEAMANAN]*\n\nHalo *{nama}*,\nKode OTP verifikasi masuk Anda adalah:\n\n*{otp}*\n\nKode ini berlaku selama *{menit} menit* (hingga {waktu} WIB). Jangan berikan kode ini kepada siapa pun.";

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
            'two_factor_allowed_methods' => [
                'totp',
                'google_prompt',
                'whatsapp',
                'email',
                'passkey',
                'security_key',
                'backup_codes',
            ],
            'two_factor_grace_period_days' => 7,
            'two_factor_remember_browser_days' => 30,
            'wa_fonnte_enabled' => true,
            'wa_fonnte_api_url' => 'https://api.fonnte.com/send',
            'wa_fonnte_country_code' => '62',
            'wa_fonnte_delay' => '1',
            'wa_fonnte_typing' => true,
            'wa_fonnte_message_template' => self::DEFAULT_WA_TEMPLATE,
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
     * Hasilkan URL QR Code menggunakan layanan SVG publik yang aman.
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
        $code = preg_replace('/\s+/', '', trim($code)) ?? '';
        if (strlen($code) !== 6 || !ctype_digit($code)) {
            return false;
        }

        $secretBinary = self::base32Decode($secret);
        if ($secretBinary === null) {
            return false;
        }

        $currentTimeSlice = (int) floor(time() / 30);

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
        $timeData = pack('N*', 0, $timeSlice);
        $hash = hash_hmac('sha1', $timeData, $secretBinary, true);
        $offset = ord($hash[19]) & 0x0f;

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
                continue;
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
     * Hasilkan daftar Kode Cadangan 10 Digit (Numeric 10-Digit Backup Codes).
     * Format: 10 digit angka murni (misal "4829103746", ditampilkan "48291 03746").
     *
     * @return array<int, string>
     */
    public static function generateRecoveryCodes(int $count = 10): array
    {
        $codes = [];
        for ($i = 0; $i < $count; $i++) {
            $limaPertama = str_pad((string) random_int(0, 99999), 5, '0', STR_PAD_LEFT);
            $limaKedua = str_pad((string) random_int(0, 99999), 5, '0', STR_PAD_LEFT);
            $codes[] = $limaPertama . $limaKedua;
        }

        return $codes;
    }

    /**
     * Verifikasi dan gunakan salah satu Kode Cadangan 10 Digit (atau format lama).
     */
    public static function verifyAndConsumeRecoveryCode(User $user, string $code): bool
    {
        // Normalisasi: hapus spasi dan strip agar input "12345 67890" atau "1234567890" cocok
        $normalizedInput = strtoupper((string) preg_replace('/[\s\-]+/', '', trim($code)));
        if (empty($normalizedInput)) {
            return false;
        }

        $recoveryCodes = (array) ($user->two_factor_recovery_codes ?: []);

        foreach ($recoveryCodes as $index => $storedCode) {
            $normalizedStored = strtoupper((string) preg_replace('/[\s\-]+/', '', trim((string) $storedCode)));
            if ($normalizedStored !== '' && hash_equals($normalizedStored, $normalizedInput)) {
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
     * Hasilkan dan kirim kode OTP Email 6 digit.
     */
    public static function kirimOtpEmail(User $user): string
    {
        $otp = (string) random_int(100000, 999999);

        $user->update([
            'two_factor_email_code' => $otp,
            'two_factor_email_expires_at' => now()->addMinutes(10),
        ]);

        Log::info("Kode OTP 2FA Email untuk {$user->email}: {$otp}");

        app(LayananEmail::class)->kirimOtp($user, $otp, 10);

        return $otp;
    }

    /**
     * Verifikasi kode OTP Email.
     */
    public static function verifyEmailOtp(User $user, string $code): bool
    {
        $code = preg_replace('/\s+/', '', trim($code)) ?? '';
        if (empty($user->two_factor_email_code) || empty($user->two_factor_email_expires_at)) {
            return false;
        }

        if (now()->isAfter($user->two_factor_email_expires_at)) {
            return false;
        }

        if (hash_equals(trim((string) $user->two_factor_email_code), $code)) {
            $user->update([
                'two_factor_email_code' => null,
                'two_factor_email_expires_at' => null,
            ]);

            return true;
        }

        return false;
    }

    /**
     * Hasilkan dan kirim kode OTP 6 digit ke Nomor Telepon via WhatsApp (Fonnte API).
     *
     * @return array{otp: string, no_telp_masked: string, terkirim_gateway: bool, pesan_gateway?: string}
     */
    public static function kirimOtpWhatsapp(User $user): array
    {
        $otp = (string) random_int(100000, 999999);
        $noTelp = trim((string) ($user->no_telp ?? ''));
        $waktuBerakhir = now()->addMinutes(10);

        $user->update([
            'two_factor_wa_code' => $otp,
            'two_factor_wa_expires_at' => $waktuBerakhir,
        ]);

        Log::info("Kode OTP 2FA WhatsApp untuk {$user->nama_lengkap} ({$noTelp}): {$otp}");

        $pengaturan = self::dapatkanPengaturan();
        $template = trim((string) ($pengaturan->wa_fonnte_message_template ?? ''));
        if ($template === '') {
            $template = self::DEFAULT_WA_TEMPLATE;
        }

        $pesan = self::formatPesanOtpWhatsapp($template, [
            'otp' => $otp,
            'nama' => (string) ($user->nama_lengkap ?: 'Pengguna'),
            'email' => (string) ($user->email ?: '-'),
            'no_telp' => $noTelp,
            'aplikasi' => (string) ($pengaturan->nama_aplikasi ?: config('app.name', 'SSO Sekolah')),
            'menit' => '10',
            'waktu' => $waktuBerakhir->format('H:i'),
        ]);

        $terkirimGateway = false;
        $pesanGateway = '';

        if (!empty($noTelp) && ($pengaturan->wa_fonnte_enabled ?? true)) {
            $hasilFonnte = self::kirimPesanFonnte($noTelp, $pesan, $pengaturan);
            $terkirimGateway = (bool) ($hasilFonnte['berhasil'] ?? false);
            $pesanGateway = (string) ($hasilFonnte['pesan_respon'] ?? '');
        }

        return [
            'otp' => $otp,
            'no_telp_masked' => self::sensorNomorTelepon($noTelp),
            'terkirim_gateway' => $terkirimGateway,
            'pesan_gateway' => $pesanGateway,
        ];
    }

    /**
     * Render template pesan OTP WhatsApp dengan mengganti variabel placeholder dinamis.
     *
     * @param array<string, string> $variabel
     */
    public static function formatPesanOtpWhatsapp(string $template, array $variabel): string
    {
        $pengganti = [
            '{otp}' => $variabel['otp'] ?? '123456',
            '{{otp}}' => $variabel['otp'] ?? '123456',
            '{nama}' => $variabel['nama'] ?? 'Pengguna',
            '{{nama}}' => $variabel['nama'] ?? 'Pengguna',
            '{email}' => $variabel['email'] ?? 'user@sekolah.sch.id',
            '{{email}}' => $variabel['email'] ?? 'user@sekolah.sch.id',
            '{no_telp}' => $variabel['no_telp'] ?? '08123456789',
            '{{no_telp}}' => $variabel['no_telp'] ?? '08123456789',
            '{aplikasi}' => $variabel['aplikasi'] ?? 'SSO Sekolah',
            '{{aplikasi}}' => $variabel['aplikasi'] ?? 'SSO Sekolah',
            '{menit}' => $variabel['menit'] ?? '10',
            '{{menit}}' => $variabel['menit'] ?? '10',
            '{menit_berlaku}' => $variabel['menit'] ?? '10',
            '{{menit_berlaku}}' => $variabel['menit'] ?? '10',
            '{waktu}' => $variabel['waktu'] ?? now()->addMinutes(10)->format('H:i'),
            '{{waktu}}' => $variabel['waktu'] ?? now()->addMinutes(10)->format('H:i'),
        ];

        return strtr($template, $pengganti);
    }

    /**
     * Kirim pesan WhatsApp melalui API Fonnte (https://api.fonnte.com/send)
     * sesuai spesifikasi resmi PHP Fonnte:
     * - Header: Authorization: <TOKEN>
     * - Body: target, message, countryCode, delay, typing
     *
     * @param array<string, mixed> $overrideConfig
     * @return array{berhasil: bool, status_http: int, pesan_respon: string, data: array<string, mixed>}
     */
    public static function kirimPesanFonnte(
        string $nomorTujuan,
        string $pesan,
        ?PengaturanSistem $pengaturan = null,
        array $overrideConfig = []
    ): array {
        $pengaturan = $pengaturan ?: self::dapatkanPengaturan();

        $apiUrl = trim((string) ($overrideConfig['wa_fonnte_api_url'] ?? $pengaturan->wa_fonnte_api_url ?? env('WA_GATEWAY_URL', 'https://api.fonnte.com/send')));
        if ($apiUrl === '') {
            $apiUrl = 'https://api.fonnte.com/send';
        }

        $token = trim((string) ($overrideConfig['wa_fonnte_token'] ?? $pengaturan->wa_fonnte_token ?? env('WA_GATEWAY_TOKEN', '')));
        $countryCode = trim((string) ($overrideConfig['wa_fonnte_country_code'] ?? $pengaturan->wa_fonnte_country_code ?? '62'));
        if ($countryCode === '') {
            $countryCode = '62';
        }

        $delay = trim((string) ($overrideConfig['wa_fonnte_delay'] ?? $pengaturan->wa_fonnte_delay ?? '1'));
        $typing = (bool) ($overrideConfig['wa_fonnte_typing'] ?? $pengaturan->wa_fonnte_typing ?? true);

        $nomorBersih = trim($nomorTujuan);
        if ($nomorBersih === '') {
            return [
                'berhasil' => false,
                'status_http' => 422,
                'pesan_respon' => 'Nomor WhatsApp tujuan belum diisi.',
                'data' => [],
            ];
        }

        if ($token === '') {
            return [
                'berhasil' => false,
                'status_http' => 401,
                'pesan_respon' => 'Token API Fonnte (Authorization) belum dikonfigurasi oleh Superadmin.',
                'data' => [],
            ];
        }

        try {
            $payload = [
                'target' => $nomorBersih,
                'message' => $pesan,
                'countryCode' => $countryCode,
                'delay' => $delay !== '' ? $delay : '1',
                'typing' => $typing ? 'true' : 'false',
            ];

            $response = Http::timeout(10)
                ->asForm()
                ->withHeaders([
                    'Authorization' => $token,
                ])
                ->post($apiUrl, $payload);

            $json = $response->json();
            $dataRespon = is_array($json) ? $json : [];

            // Fonnte mengembalikan HTTP 200 dengan {"status": true/false, "detail": "...", "reason": "..."}
            $statusFonnte = (bool) ($dataRespon['status'] ?? false);
            $berhasil = $response->successful() && ($statusFonnte === true || !array_key_exists('status', $dataRespon));

            $pesanRespon = (string) ($dataRespon['detail'] ?? $dataRespon['reason'] ?? ($berhasil ? 'Pesan WhatsApp berhasil dikirim ke antrean Fonnte.' : 'Gagal mengirim pesan melalui Fonnte API.'));

            if (!$berhasil) {
                Log::warning("Fonnte API gagal mengirim ke {$nomorBersih}: {$pesanRespon}", [
                    'http_status' => $response->status(),
                    'response' => $dataRespon,
                ]);
            }

            return [
                'berhasil' => $berhasil,
                'status_http' => $response->status(),
                'pesan_respon' => $pesanRespon,
                'data' => $dataRespon,
            ];
        } catch (\Throwable $e) {
            Log::warning("Exception saat memanggil API Fonnte ke {$nomorBersih}: " . $e->getMessage());

            return [
                'berhasil' => false,
                'status_http' => 500,
                'pesan_respon' => 'Gagal menghubungi server Fonnte: ' . $e->getMessage(),
                'data' => [],
            ];
        }
    }

    /**
     * Cek status koneksi perangkat WhatsApp di Fonnte (POST https://api.fonnte.com/device).
     *
     * @return array{berhasil: bool, pesan: string, perangkat: array<string, mixed>}
     */
    public static function cekPerangkatFonnte(?string $token = null): array
    {
        $pengaturan = self::dapatkanPengaturan();
        $tokenAktif = trim((string) ($token !== null && trim($token) !== '' ? $token : ($pengaturan->wa_fonnte_token ?? env('WA_GATEWAY_TOKEN', ''))));

        if ($tokenAktif === '') {
            return [
                'berhasil' => false,
                'pesan' => 'Token API Fonnte belum diisi. Masukkan Token Perangkat (Device Token) dari dasbor Fonnte terlebih dahulu.',
                'perangkat' => [],
            ];
        }

        try {
            $response = Http::timeout(10)
                ->asForm()
                ->withHeaders([
                    'Authorization' => $tokenAktif,
                ])
                ->post('https://api.fonnte.com/device');

            $json = $response->json();
            $data = is_array($json) ? $json : [];
            $status = (bool) ($data['status'] ?? false);

            if (!$response->successful() || !$status) {
                $alasan = (string) ($data['reason'] ?? 'Token Fonnte tidak valid atau perangkat tidak ditemukan.');

                return [
                    'berhasil' => false,
                    'pesan' => $alasan,
                    'perangkat' => $data,
                ];
            }

            $statusDevice = strtolower((string) ($data['device_status'] ?? 'unknown'));
            $terhubung = $statusDevice === 'connect';

            return [
                'berhasil' => true,
                'pesan' => $terhubung
                    ? 'Perangkat WhatsApp Fonnte terhubung dan siap mengirim pesan OTP!'
                    : "Perangkat terdaftar di Fonnte namun status koneksi saat ini: {$statusDevice} (Silakan scan QR di dasbor Fonnte jika disconnect).",
                'perangkat' => [
                    'nama' => (string) ($data['name'] ?? '-'),
                    'nomor' => (string) ($data['device'] ?? '-'),
                    'status_koneksi' => (string) ($data['device_status'] ?? '-'),
                    'terhubung' => $terhubung,
                    'paket' => (string) ($data['package'] ?? '-'),
                    'kuota_tersisa' => (string) ($data['quota'] ?? '-'),
                    'pesan_terkirim' => (int) ($data['messages'] ?? 0),
                    'kadaluarsa' => (string) ($data['expired'] ?? '-'),
                ],
            ];
        } catch (\Throwable $e) {
            return [
                'berhasil' => false,
                'pesan' => 'Gagal menghubungi API Fonnte Device: ' . $e->getMessage(),
                'perangkat' => [],
            ];
        }
    }

    /**
     * Verifikasi kode OTP WhatsApp.
     */
    public static function verifyWhatsappOtp(User $user, string $code): bool
    {
        $code = preg_replace('/\s+/', '', trim($code)) ?? '';
        if (empty($user->two_factor_wa_code) || empty($user->two_factor_wa_expires_at)) {
            return false;
        }

        if (now()->isAfter($user->two_factor_wa_expires_at)) {
            return false;
        }

        if (hash_equals(trim((string) $user->two_factor_wa_code), $code)) {
            $user->update([
                'two_factor_wa_code' => null,
                'two_factor_wa_expires_at' => null,
            ]);

            return true;
        }

        return false;
    }

    /**
     * Sensor nomor telepon untuk tampilan privasi (contoh: 0812•••••789).
     */
    public static function sensorNomorTelepon(?string $noTelp): string
    {
        $bersih = trim((string) $noTelp);
        if (strlen($bersih) < 6) {
            return $bersih ?: 'Belum diatur';
        }

        return substr($bersih, 0, 4) . str_repeat('•', max(4, strlen($bersih) - 7)) . substr($bersih, -3);
    }

    /**
     * Sensor alamat email untuk tampilan privasi (contoh: fa•••@sekolah.sch.id).
     */
    public static function sensorEmail(?string $email): string
    {
        $email = trim((string) $email);
        if (!str_contains($email, '@')) {
            return $email;
        }

        [$lokal, $domain] = explode('@', $email, 2);
        $tampil = substr($lokal, 0, min(2, strlen($lokal)));

        return $tampil . '•••@' . $domain;
    }

    /**
     * Buat tantangan Dialog Mirip Google (Google Prompt) dengan pencocokan angka (Number Matching)
     * dan siarkan ke semua sesi perangkat aktif milik pengguna.
     *
     * @return array<string, mixed>
     */
    public static function buatTantanganPrompt(User $user, Request $request): array
    {
        $angkaTarget = random_int(11, 99);
        $opsiLain = [];
        while (count($opsiLain) < 2) {
            $kandidat = random_int(11, 99);
            if ($kandidat !== $angkaTarget && !in_array($kandidat, $opsiLain, true)) {
                $opsiLain[] = $kandidat;
            }
        }

        $opsiAngka = [$angkaTarget, $opsiLain[0], $opsiLain[1]];
        shuffle($opsiAngka);

        $ua = (string) $request->userAgent();
        $perangkat = self::ringkasUserAgent($ua);

        $tantangan = [
            'id' => (string) Str::uuid(),
            'angka_target' => $angkaTarget,
            'opsi_angka' => array_values($opsiAngka),
            'perangkat' => $perangkat,
            'ip_address' => (string) $request->ip(),
            'status' => 'pending',
            'waktu_dibuat' => now()->toIso8601String(),
            'expires_at' => now()->addMinutes(3)->timestamp,
        ];

        $user->update([
            'two_factor_prompt_challenge' => $tantangan,
        ]);

        // Broadcast tantangan ke perangkat aktif pengguna (tanpa membocorkan angka_target mentah bila tidak diperlukan,
        // namun tetap menyertakan opsi_angka agar pengguna memilih angka yang tampil di layar login)
        try {
            broadcast(new TantanganGooglePrompt($user->id, [
                'id' => $tantangan['id'],
                'opsi_angka' => $tantangan['opsi_angka'],
                'perangkat' => $tantangan['perangkat'],
                'ip_address' => $tantangan['ip_address'],
                'status' => 'pending',
                'waktu_dibuat' => $tantangan['waktu_dibuat'],
                'expires_at' => $tantangan['expires_at'],
            ]));
        } catch (\Throwable $e) {
            Log::warning('Gagal broadcast TantanganGooglePrompt: ' . $e->getMessage());
        }

        return $tantangan;
    }

    /**
     * Tangani respon persetujuan / penolakan Dialog Google Prompt dari perangkat aktif.
     *
     * @return array{berhasil: bool, status: string, pesan: string}
     */
    public static function responTantanganPrompt(User $user, string $challengeId, string $aksi, ?int $angkaDipilih = null): array
    {
        $tantangan = $user->two_factor_prompt_challenge;

        if (!is_array($tantangan) || ($tantangan['id'] ?? '') !== $challengeId) {
            return [
                'berhasil' => false,
                'status' => 'expired',
                'pesan' => 'Permintaan masuk sudah tidak berlaku atau telah digantikan.',
            ];
        }

        if (now()->timestamp > (int) ($tantangan['expires_at'] ?? 0)) {
            $tantangan['status'] = 'expired';
            $user->update(['two_factor_prompt_challenge' => $tantangan]);

            return [
                'berhasil' => false,
                'status' => 'expired',
                'pesan' => 'Waktu verifikasi habis. Silakan coba lagi dari perangkat yang ingin masuk.',
            ];
        }

        if ($aksi === 'tolak') {
            $tantangan['status'] = 'rejected';
            $user->update(['two_factor_prompt_challenge' => $tantangan]);

            try {
                broadcast(new TantanganGooglePrompt($user->id, [
                    'id' => $tantangan['id'],
                    'status' => 'rejected',
                ]));
            } catch (\Throwable) {
            }

            return [
                'berhasil' => true,
                'status' => 'rejected',
                'pesan' => 'Percobaan masuk berhasil ditolak dan diblokir.',
            ];
        }

        // Aksi = setuju: wajib cocokkan angka_target
        if ((int) $angkaDipilih !== (int) ($tantangan['angka_target'] ?? -1)) {
            $tantangan['status'] = 'rejected';
            $user->update(['two_factor_prompt_challenge' => $tantangan]);

            try {
                broadcast(new TantanganGooglePrompt($user->id, [
                    'id' => $tantangan['id'],
                    'status' => 'rejected',
                ]));
            } catch (\Throwable) {
            }

            return [
                'berhasil' => false,
                'status' => 'rejected',
                'pesan' => 'Angka yang dipilih tidak cocok! Demi keamanan, permintaan masuk dibatalkan.',
            ];
        }

        $tantangan['status'] = 'approved';
        $tantangan['disetujui_pada'] = now()->toIso8601String();
        $user->update(['two_factor_prompt_challenge' => $tantangan]);

        try {
            broadcast(new TantanganGooglePrompt($user->id, [
                'id' => $tantangan['id'],
                'status' => 'approved',
            ]));
        } catch (\Throwable) {
        }

        return [
            'berhasil' => true,
            'status' => 'approved',
            'pesan' => 'Permintaan masuk disetujui. Perangkat lain akan masuk secara otomatis.',
        ];
    }

    /**
     * Daftarkan kredensial WebAuthn baru (Passkey atau Hardware Security Key).
     *
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public static function tambahKredensialWebAuthn(User $user, array $data): array
    {
        $daftar = is_array($user->two_factor_passkeys) ? $user->two_factor_passkeys : [];
        $jenis = in_array($data['jenis'] ?? 'passkey', ['passkey', 'security_key'], true)
            ? $data['jenis']
            : 'passkey';

        $itemBaru = [
            'id' => (string) Str::uuid(),
            'credential_id' => (string) $data['credential_id'],
            'public_key' => (string) ($data['public_key'] ?? ''),
            'nama_kunci' => (string) ($data['nama_kunci'] ?? ($jenis === 'security_key' ? 'Kunci Keamanan USB/NFC' : 'Kunci Sandi Perangkat')),
            'jenis' => $jenis,
            'transports' => (array) ($data['transports'] ?? []),
            'dibuat_pada' => now()->toIso8601String(),
            'terakhir_dipakai' => null,
        ];

        // Hindari duplikasi credential_id
        $daftar = array_values(array_filter(
            $daftar,
            fn (array $item): bool => ($item['credential_id'] ?? '') !== $itemBaru['credential_id']
        ));
        $daftar[] = $itemBaru;

        $methods = $user->daftarMetodeMfaAktif();
        if (!in_array($jenis, $methods, true)) {
            $methods[] = $jenis;
        }

        $recoveryCodes = $user->two_factor_recovery_codes;
        if (empty($recoveryCodes)) {
            $recoveryCodes = self::generateRecoveryCodes(10);
            if (!in_array('backup_codes', $methods, true)) {
                $methods[] = 'backup_codes';
            }
        }

        $user->update([
            'two_factor_passkeys' => $daftar,
            'two_factor_methods' => array_values(array_unique($methods)),
            'two_factor_confirmed_at' => $user->two_factor_confirmed_at ?: now(),
            'two_factor_type' => $user->two_factor_confirmed_at ? ($user->two_factor_type ?: $jenis) : $jenis,
            'two_factor_recovery_codes' => $recoveryCodes,
        ]);

        return $itemBaru;
    }

    /**
     * Hapus kredensial WebAuthn berdasarkan ID item atau credential_id.
     */
    public static function hapusKredensialWebAuthn(User $user, string $idKunci): void
    {
        $daftar = is_array($user->two_factor_passkeys) ? $user->two_factor_passkeys : [];
        $tersisa = array_values(array_filter(
            $daftar,
            fn (array $item): bool => ($item['id'] ?? '') !== $idKunci && ($item['credential_id'] ?? '') !== $idKunci
        ));

        $masihAdaPasskey = collect($tersisa)->contains(fn (array $i): bool => ($i['jenis'] ?? 'passkey') === 'passkey');
        $masihAdaSecKey = collect($tersisa)->contains(fn (array $i): bool => ($i['jenis'] ?? '') === 'security_key');

        $methods = is_array($user->two_factor_methods) ? $user->two_factor_methods : [];
        if (!$masihAdaPasskey) {
            $methods = array_values(array_diff($methods, ['passkey']));
        }
        if (!$masihAdaSecKey) {
            $methods = array_values(array_diff($methods, ['security_key']));
        }

        $user->update([
            'two_factor_passkeys' => $tersisa,
            'two_factor_methods' => $methods,
        ]);
    }

    /**
     * Verifikasi assertion WebAuthn (Passkey / Security Key) saat login 2FA.
     */
    public static function verifikasiKredensialWebAuthn(
        User $user,
        string $credentialId,
        string $clientDataJSON,
        ?string $expectedChallenge = null
    ): bool {
        $daftar = is_array($user->two_factor_passkeys) ? $user->two_factor_passkeys : [];
        $ditemukanIndex = null;

        foreach ($daftar as $idx => $item) {
            if (($item['credential_id'] ?? '') === $credentialId) {
                $ditemukanIndex = $idx;
                break;
            }
        }

        if ($ditemukanIndex === null) {
            return false;
        }

        // Validasi clientDataJSON
        $decodedJson = base64_decode(strtr($clientDataJSON, '-_', '+/'), true);
        if ($decodedJson !== false) {
            $clientData = json_decode($decodedJson, true);
            if (is_array($clientData)) {
                if (($clientData['type'] ?? '') !== 'webauthn.get') {
                    return false;
                }
                if ($expectedChallenge !== null && isset($clientData['challenge'])) {
                    // Bandingkan challenge base64url
                    $challengeDiterima = rtrim(strtr((string) $clientData['challenge'], '+/', '-_'), '=');
                    $challengeDiharapkan = rtrim(strtr($expectedChallenge, '+/', '-_'), '=');
                    if (!hash_equals($challengeDiharapkan, $challengeDiterima)) {
                        return false;
                    }
                }
            }
        }

        $daftar[$ditemukanIndex]['terakhir_dipakai'] = now()->toIso8601String();
        $user->update([
            'two_factor_passkeys' => $daftar,
        ]);

        return true;
    }

    /**
     * Aktifkan atau tambahkan suatu metode MFA ke daftar metode aktif pengguna.
     */
    public static function aktifkanMetodeUser(User $user, string $metode, bool $jadikanUtama = false): void
    {
        $methods = $user->daftarMetodeMfaAktif();
        if (!in_array($metode, $methods, true)) {
            $methods[] = $metode;
        }

        $recoveryCodes = $user->two_factor_recovery_codes;
        if (empty($recoveryCodes)) {
            $recoveryCodes = self::generateRecoveryCodes(10);
        }
        if (!in_array('backup_codes', $methods, true)) {
            $methods[] = 'backup_codes';
        }

        $utama = $jadikanUtama || empty($user->two_factor_type)
            ? $metode
            : $user->two_factor_type;

        $user->update([
            'two_factor_methods' => array_values(array_unique($methods)),
            'two_factor_type' => $utama,
            'two_factor_confirmed_at' => $user->two_factor_confirmed_at ?: now(),
            'two_factor_recovery_codes' => $recoveryCodes,
        ]);
    }

    /**
     * Nonaktifkan salah satu metode MFA dari pengguna.
     */
    public static function nonaktifkanMetodeUser(User $user, string $metode): void
    {
        $methods = array_values(array_diff($user->daftarMetodeMfaAktif(), [$metode]));

        $updateData = [
            'two_factor_methods' => $methods,
        ];

        if ($metode === 'totp') {
            $updateData['two_factor_secret'] = null;
        }

        // Jika hanya tersisa backup_codes atau kosong, matikan 2FA sepenuhnya
        $metodeUtamaTersisa = array_values(array_diff($methods, ['backup_codes']));
        if (empty($metodeUtamaTersisa)) {
            self::resetUser2FA($user);
            return;
        }

        if ($user->two_factor_type === $metode) {
            $updateData['two_factor_type'] = $metodeUtamaTersisa[0];
        }

        $user->update($updateData);
    }

    /**
     * Ringkas User-Agent menjadi nama Browser + OS yang mudah dibaca pada Dialog Google Prompt.
     */
    public static function ringkasUserAgent(string $ua): string
    {
        $browser = 'Browser Web';
        if (str_contains($ua, 'Edg/')) {
            $browser = 'Microsoft Edge';
        } elseif (str_contains($ua, 'OPR/') || str_contains($ua, 'Opera')) {
            $browser = 'Opera';
        } elseif (str_contains($ua, 'Chrome/')) {
            $browser = 'Google Chrome';
        } elseif (str_contains($ua, 'Firefox/')) {
            $browser = 'Mozilla Firefox';
        } elseif (str_contains($ua, 'Safari/')) {
            $browser = 'Apple Safari';
        }

        $os = 'Perangkat Tidak Dikenal';
        if (str_contains($ua, 'Windows')) {
            $os = 'Windows';
        } elseif (str_contains($ua, 'Android')) {
            $os = 'Android';
        } elseif (str_contains($ua, 'iPhone') || str_contains($ua, 'iPad')) {
            $os = 'iOS / iPadOS';
        } elseif (str_contains($ua, 'Mac OS X')) {
            $os = 'macOS';
        } elseif (str_contains($ua, 'Linux')) {
            $os = 'Linux';
        }

        return "{$browser} di {$os}";
    }

    /**
     * Reset seluruh konfigurasi 2FA / MFA pengguna (kunci, metode, status).
     */
    public static function resetUser2FA(User $user): void
    {
        $user->update([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
            'two_factor_type' => 'totp',
            'two_factor_methods' => null,
            'two_factor_email_code' => null,
            'two_factor_email_expires_at' => null,
            'two_factor_wa_code' => null,
            'two_factor_wa_expires_at' => null,
            'two_factor_passkeys' => null,
            'two_factor_prompt_challenge' => null,
        ]);
    }
}
