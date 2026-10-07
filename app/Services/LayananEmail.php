<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\PengaturanSistem;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class LayananEmail
{
    public static function ambilDefaultSubjekOtp(): string
    {
        return 'Kode Verifikasi Keamanan (OTP) - {nama_aplikasi}';
    }

    public static function ambilDefaultPesanOtp(): string
    {
        return "Halo *{nama}*,\n\nBerikut adalah kode verifikasi keamanan (OTP) untuk masuk atau mengamankan akun SSO Anda ({email}):\n\n*{otp}*\n\nKode ini berlaku selama *{berlaku_menit} menit*. Demi keamanan akun Anda, jangan pernah membagikan kode rahasia ini kepada siapa pun termasuk pihak admin.";
    }

    public static function ambilDefaultTemplateHtmlOtp(): string
    {
        return <<<'HTML'
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{subjek}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f8fafc;padding:32px 16px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:540px;background-color:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 4px 20px rgba(15,23,42,0.05);">
                    <tr>
                        <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a8a 100%);padding:24px 32px;text-align:center;">
                            <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#93c5fd;margin-bottom:6px;">VERIFIKASI KEAMANAN AKUN</div>
                            <div style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">{nama_aplikasi}</div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px;">
                            <div style="font-size:14px;line-height:1.7;color:#334155;margin-bottom:24px;">
                                {isi_pesan}
                            </div>
                            <div style="background-color:#eff6ff;border:2px dashed #93c5fd;border-radius:12px;padding:20px;text-align:center;margin:24px 0;">
                                <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#2563eb;margin-bottom:8px;">KODE OTP ANDA</div>
                                <div style="font-family:'Courier New',monospace;font-size:32px;font-weight:800;letter-spacing:8px;color:#0f172a;">{otp}</div>
                                <div style="font-size:11px;color:#64748b;margin-top:8px;">Berlaku selama {berlaku_menit} menit &bull; Akun: {email}</div>
                            </div>
                            <div style="font-size:12px;color:#64748b;line-height:1.6;border-top:1px solid #f1f5f9;padding-top:16px;margin-top:24px;">
                                Jika Anda tidak merasa melakukan permintaan kode ini, silakan abaikan surel ini. Akun Anda tetap aman.
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color:#f8fafc;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;">
                            &copy; {tahun} {nama_aplikasi} &bull; Dikirim otomatis pada {waktu}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;
    }

    public static function ambilDefaultSubjekReset(): string
    {
        return 'Permintaan Atur Ulang Kata Sandi - {nama_aplikasi}';
    }

    public static function ambilDefaultPesanReset(): string
    {
        return "Halo *{nama}*,\n\nKami menerima permintaan untuk mengatur ulang kata sandi akun SSO Anda ({email} / @{username}).\n\nSilakan tekan tombol *Atur Ulang Kata Sandi* di bawah ini untuk membuat kata sandi baru. Tautan pemulihan ini hanya berlaku selama *{berlaku_menit} menit*.\n\nJika Anda tidak merasa meminta pengaturan ulang kata sandi, abaikan pesan ini.";
    }

    public static function ambilDefaultTemplateHtmlReset(): string
    {
        return <<<'HTML'
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{subjek}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f8fafc;padding:32px 16px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:540px;background-color:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 4px 20px rgba(15,23,42,0.05);">
                    <tr>
                        <td style="background:linear-gradient(135deg,#0f172a 0%,#312e81 100%);padding:24px 32px;text-align:center;">
                            <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#a5b4fc;margin-bottom:6px;">PEMULIHAN KATA SANDI</div>
                            <div style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">{nama_aplikasi}</div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px;">
                            <div style="font-size:14px;line-height:1.7;color:#334155;margin-bottom:24px;">
                                {isi_pesan}
                            </div>
                            <div style="text-align:center;margin:28px 0;">
                                <a href="{reset_url}" style="display:inline-block;background-color:#2563eb;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;padding:14px 28px;border-radius:10px;box-shadow:0 4px 12px rgba(37,99,235,0.25);">
                                    Atur Ulang Kata Sandi
                                </a>
                            </div>
                            <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px;margin:20px 0;">
                                <div style="font-size:11px;font-weight:700;color:#64748b;margin-bottom:6px;">Atau salin tautan berikut ke peramban Anda:</div>
                                <div style="font-size:11px;word-break:break-all;color:#2563eb;font-family:'Courier New',monospace;">{reset_url}</div>
                            </div>
                            <div style="font-size:12px;color:#64748b;line-height:1.6;border-top:1px solid #f1f5f9;padding-top:16px;margin-top:24px;">
                                Tautan ini akan kedaluwarsa dalam {berlaku_menit} menit.
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color:#f8fafc;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;">
                            &copy; {tahun} {nama_aplikasi} &bull; Dikirim otomatis pada {waktu}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;
    }

    public static function ambilDefaultTemplateHtmlUmum(): string
    {
        return <<<'HTML'
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{subjek}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f8fafc;padding:32px 16px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:540px;background-color:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 4px 20px rgba(15,23,42,0.05);">
                    <tr>
                        <td style="background:linear-gradient(135deg,#0f172a 0%,#0369a1 100%);padding:24px 32px;text-align:center;">
                            <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#7dd3fc;margin-bottom:6px;">NOTIFIKASI SISTEM</div>
                            <div style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.3px;">{nama_aplikasi}</div>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px;">
                            <div style="font-size:14px;line-height:1.7;color:#334155;">
                                {isi_pesan}
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color:#f8fafc;padding:16px 32px;text-align:center;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;">
                            &copy; {tahun} {nama_aplikasi} &bull; Dikirim otomatis pada {waktu}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
HTML;
    }

    /**
     * Terapkan konfigurasi SMTP / Gmail Pribadi secara dinamis ke runtime Laravel Mail
     */
    public function terapkanKonfigurasiSmtp(?PengaturanSistem $pengaturan = null): bool
    {
        $pengaturan = $pengaturan ?? PengaturanSistem::first();

        if (! $pengaturan || ! $pengaturan->smtp_enabled) {
            return false;
        }

        $username = trim((string) ($pengaturan->smtp_username ?? ''));
        // Hapus spasi pada App Password Gmail 16-digit (misal: "abcd efgh ijkl mnop" -> "abcdefghijklmnop")
        $password = preg_replace('/\s+/', '', (string) ($pengaturan->smtp_password ?? ''));

        if ($username === '' || $password === '') {
            return false;
        }

        $host = trim((string) ($pengaturan->smtp_host ?: 'smtp.gmail.com'));
        $port = (int) ($pengaturan->smtp_port ?: 587);
        $encryption = strtolower(trim((string) ($pengaturan->smtp_encryption ?? 'tls')));
        $fromAddress = trim((string) ($pengaturan->smtp_from_address ?: $username));
        $fromName = trim((string) ($pengaturan->smtp_from_name ?: ($pengaturan->nama_aplikasi ?: 'SSO Sekolah')));

        config([
            'mail.default' => 'smtp',
            'mail.mailers.smtp.transport' => 'smtp',
            'mail.mailers.smtp.host' => $host,
            'mail.mailers.smtp.port' => $port,
            'mail.mailers.smtp.encryption' => $encryption === 'none' ? null : $encryption,
            'mail.mailers.smtp.username' => $username,
            'mail.mailers.smtp.password' => $password,
            'mail.mailers.smtp.timeout' => 15,
            'mail.from.address' => $fromAddress,
            'mail.from.name' => $fromName,
        ]);

        try {
            Mail::purge('smtp');
        } catch (\Throwable $e) {
            // Abaikan jika mailer belum diinisialisasi
        }

        return true;
    }

    /**
     * Format teks pesan (isi chat) ke HTML aman dengan dukungan *tebal* dan baris baru
     */
    public function formatPesanKeHtml(string $pesanTeks): string
    {
        $escaped = e($pesanTeks);
        $boldFormatted = (string) preg_replace('/\*([^\*\n]+)\*/', '<strong>$1</strong>', $escaped);
        return nl2br($boldFormatted);
    }

    /**
     * Ganti variabel placeholder di dalam teks / HTML
     *
     * @param array<string, string> $variabel
     */
    private function gantiPlaceholder(string $konten, array $variabel): string
    {
        return str_replace(array_keys($variabel), array_values($variabel), $konten);
    }

    /**
     * Siapkan variabel dasar untuk substitusi placeholder
     *
     * @param array<string, scalar> $variabelTambahan
     * @return array<string, string>
     */
    private function bangunVariabelDasar(?User $user, ?PengaturanSistem $pengaturan = null, array $variabelTambahan = []): array
    {
        $pengaturan = $pengaturan ?? PengaturanSistem::first();
        $namaAplikasi = $pengaturan?->nama_aplikasi ?: config('app.name', 'SSO Sekolah');

        $variabel = [
            '{nama}' => (string) ($user?->name ?: 'Pengguna SSO'),
            '{email}' => (string) ($user?->email ?: '-'),
            '{username}' => (string) ($user?->username ?: '-'),
            '{uuid}' => (string) ($user?->id ?: '-'),
            '{nama_aplikasi}' => (string) $namaAplikasi,
            '{tahun}' => date('Y'),
            '{waktu}' => now()->format('d M Y H:i'),
        ];

        foreach ($variabelTambahan as $kunci => $nilai) {
            $tag = str_starts_with((string) $kunci, '{') ? (string) $kunci : '{' . trim((string) $kunci, '{}') . '}';
            $variabel[$tag] = (string) $nilai;
        }

        return $variabel;
    }

    /**
     * Render email OTP beserta subjek, HTML, dan teks polosnya
     *
     * @return array{subjek: string, html: string, teks: string}
     */
    public function renderEmailOtp(User $user, string $otp, int $berlakuMenit = 10, ?PengaturanSistem $pengaturan = null): array
    {
        $pengaturan = $pengaturan ?? PengaturanSistem::first();

        $variabelDasar = $this->bangunVariabelDasar($user, $pengaturan, [
            'otp' => $otp,
            'kode_otp' => $otp,
            'berlaku_menit' => (string) $berlakuMenit,
        ]);

        $templateSubjek = trim((string) ($pengaturan?->email_otp_subject ?: self::ambilDefaultSubjekOtp()));
        $templatePesan = trim((string) ($pengaturan?->email_otp_message ?: self::ambilDefaultPesanOtp()));
        $templateHtml = trim((string) ($pengaturan?->email_otp_template ?: self::ambilDefaultTemplateHtmlOtp()));

        $subjekFinal = $this->gantiPlaceholder($templateSubjek, $variabelDasar);
        $pesanTeksFinal = $this->gantiPlaceholder($templatePesan, $variabelDasar);
        $isiPesanHtml = $this->formatPesanKeHtml($pesanTeksFinal);

        $variabelHtml = array_merge($variabelDasar, [
            '{subjek}' => e($subjekFinal),
            '{isi_pesan}' => $isiPesanHtml,
        ]);

        $htmlFinal = $this->gantiPlaceholder($templateHtml, $variabelHtml);
        $teksPolos = str_replace('*', '', $pesanTeksFinal);

        return [
            'subjek' => $subjekFinal,
            'html' => $htmlFinal,
            'teks' => $teksPolos,
        ];
    }

    /**
     * Render email Reset Password beserta subjek, HTML, dan teks polosnya
     *
     * @return array{subjek: string, html: string, teks: string}
     */
    public function renderEmailResetPassword(User $user, string $resetUrl, string $token, int $berlakuMenit = 60, ?PengaturanSistem $pengaturan = null): array
    {
        $pengaturan = $pengaturan ?? PengaturanSistem::first();

        $variabelDasar = $this->bangunVariabelDasar($user, $pengaturan, [
            'reset_url' => $resetUrl,
            'tautan_reset' => $resetUrl,
            'otp' => $token,
            'kode_otp' => $token,
            'token' => $token,
            'berlaku_menit' => (string) $berlakuMenit,
        ]);

        $templateSubjek = trim((string) ($pengaturan?->email_reset_subject ?: self::ambilDefaultSubjekReset()));
        $templatePesan = trim((string) ($pengaturan?->email_reset_message ?: self::ambilDefaultPesanReset()));
        $templateHtml = trim((string) ($pengaturan?->email_reset_template ?: self::ambilDefaultTemplateHtmlReset()));

        $subjekFinal = $this->gantiPlaceholder($templateSubjek, $variabelDasar);
        $pesanTeksFinal = $this->gantiPlaceholder($templatePesan, $variabelDasar);
        $isiPesanHtml = $this->formatPesanKeHtml($pesanTeksFinal);

        $variabelHtml = array_merge($variabelDasar, [
            '{subjek}' => e($subjekFinal),
            '{isi_pesan}' => $isiPesanHtml,
        ]);

        $htmlFinal = $this->gantiPlaceholder($templateHtml, $variabelHtml);
        $teksPolos = str_replace('*', '', $pesanTeksFinal) . "\n\nTautan Reset: " . $resetUrl;

        return [
            'subjek' => $subjekFinal,
            'html' => $htmlFinal,
            'teks' => $teksPolos,
        ];
    }

    /**
     * Render email modular berdasarkan Kode Template (mendukung 'otp', 'reset', maupun template kustom di email_custom_templates)
     *
     * @param array<string, scalar> $variabelTambahan
     * @return array{subjek: string, html: string, teks: string}|null
     */
    public function renderDariKodeTemplate(string $kodeTemplate, ?User $user, array $variabelTambahan = [], ?PengaturanSistem $pengaturan = null): ?array
    {
        $pengaturan = $pengaturan ?? PengaturanSistem::first();
        $kode = strtolower(trim($kodeTemplate));

        if ($kode === 'otp' && $user) {
            return $this->renderEmailOtp(
                $user,
                (string) ($variabelTambahan['otp'] ?? '000000'),
                (int) ($variabelTambahan['berlaku_menit'] ?? 10),
                $pengaturan
            );
        }

        if ($kode === 'reset' && $user) {
            return $this->renderEmailResetPassword(
                $user,
                (string) ($variabelTambahan['reset_url'] ?? url('/')),
                (string) ($variabelTambahan['token'] ?? $variabelTambahan['otp'] ?? ''),
                (int) ($variabelTambahan['berlaku_menit'] ?? 60),
                $pengaturan
            );
        }

        $daftarTemplateKustom = is_array($pengaturan?->email_custom_templates)
            ? $pengaturan->email_custom_templates
            : [];

        $itemTemplate = collect($daftarTemplateKustom)->first(function ($item) use ($kode) {
            return is_array($item) && strtolower(trim((string) ($item['kode'] ?? ''))) === $kode;
        });

        if (! $itemTemplate) {
            return null;
        }

        $variabelDasar = $this->bangunVariabelDasar($user, $pengaturan, $variabelTambahan);
        $templateSubjek = trim((string) ($itemTemplate['subject'] ?? 'Notifikasi - {nama_aplikasi}'));
        $templatePesan = trim((string) ($itemTemplate['message'] ?? 'Halo *{nama}*,'));
        $templateHtml = trim((string) ($itemTemplate['template'] ?: self::ambilDefaultTemplateHtmlUmum()));

        $subjekFinal = $this->gantiPlaceholder($templateSubjek, $variabelDasar);
        $pesanTeksFinal = $this->gantiPlaceholder($templatePesan, $variabelDasar);
        $isiPesanHtml = $this->formatPesanKeHtml($pesanTeksFinal);

        $variabelHtml = array_merge($variabelDasar, [
            '{subjek}' => e($subjekFinal),
            '{isi_pesan}' => $isiPesanHtml,
        ]);

        return [
            'subjek' => $subjekFinal,
            'html' => $this->gantiPlaceholder($templateHtml, $variabelHtml),
            'teks' => str_replace('*', '', $pesanTeksFinal),
        ];
    }

    /**
     * Kirim email berdasarkan Kode Template (untuk kebutuhan fitur baru ke depannya tanpa perlu build dari awal).
     * Contoh pemakaian: app(LayananEmail::class)->kirimDariKodeTemplate('notifikasi_login', $user, ['ip' => $ip]);
     *
     * @param array<string, scalar> $variabelTambahan
     */
    public function kirimDariKodeTemplate(string $kodeTemplate, User|string $penerima, array $variabelTambahan = []): bool
    {
        $user = $penerima instanceof User
            ? $penerima
            : new User(['name' => (string) ($variabelTambahan['nama'] ?? 'Pengguna'), 'email' => (string) $penerima]);

        if (empty($user->email)) {
            return false;
        }

        $pengaturan = PengaturanSistem::first();
        $this->terapkanKonfigurasiSmtp($pengaturan);

        $konten = $this->renderDariKodeTemplate($kodeTemplate, $user, $variabelTambahan, $pengaturan);
        if (! $konten) {
            Log::warning("Template email dengan kode '{$kodeTemplate}' belum dikonfigurasi.");
            return false;
        }

        try {
            Mail::send([], [], function ($message) use ($user, $konten): void {
                $message->to($user->email, $user->name)
                    ->subject($konten['subjek'])
                    ->html($konten['html'])
                    ->text($konten['teks']);
            });

            return true;
        } catch (\Throwable $e) {
            Log::error("Gagal mengirim email template '{$kodeTemplate}' via LayananEmail: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Kirim email OTP ke pengguna
     */
    public function kirimOtp(User $user, string $otp, int $berlakuMenit = 10): bool
    {
        return $this->kirimDariKodeTemplate('otp', $user, [
            'otp' => $otp,
            'berlaku_menit' => $berlakuMenit,
        ]);
    }

    /**
     * Kirim email Reset Kata Sandi ke pengguna
     */
    public function kirimResetPassword(User $user, string $resetUrl, string $token, int $berlakuMenit = 60): bool
    {
        return $this->kirimDariKodeTemplate('reset', $user, [
            'reset_url' => $resetUrl,
            'token' => $token,
            'otp' => $token,
            'berlaku_menit' => $berlakuMenit,
        ]);
    }

    /**
     * Kirim email uji coba (Test Email) dari antarmuka Superadmin (mendukung 'otp', 'reset', maupun kode template kustom)
     *
     * @return array{berhasil: bool, pesan: string}
     */
    public function kirimEmailUjiCoba(string $emailTujuan, string $jenis = 'otp', ?PengaturanSistem $pengaturan = null): array
    {
        $pengaturan = $pengaturan ?? PengaturanSistem::first();
        $smtpAktif = $this->terapkanKonfigurasiSmtp($pengaturan);

        $dummyUser = new User([
            'name' => 'Superadmin Uji Coba',
            'email' => $emailTujuan,
            'username' => 'superadmin_test',
        ]);
        $dummyUser->id = '00000000-0000-0000-0000-000000000001';

        $resetUrl = url('/reset-password/token-uji-coba-123456?email=' . urlencode($emailTujuan));
        $konten = $this->renderDariKodeTemplate($jenis, $dummyUser, [
            'otp' => '482910',
            'token' => '894120',
            'reset_url' => $resetUrl,
            'berlaku_menit' => $jenis === 'otp' ? 10 : 60,
        ], $pengaturan);

        if (! $konten) {
            return [
                'berhasil' => false,
                'pesan' => "Template email dengan kode '{$jenis}' tidak ditemukan. Simpan perubahan terlebih dahulu.",
            ];
        }

        try {
            Mail::send([], [], function ($message) use ($emailTujuan, $konten): void {
                $message->to($emailTujuan, 'Penerima Uji Coba')
                    ->subject('[UJI COBA] ' . $konten['subjek'])
                    ->html($konten['html'])
                    ->text($konten['teks']);
            });

            $modePengiriman = $smtpAktif
                ? "SMTP Gmail ({$pengaturan->smtp_username})"
                : 'Mailer Default (' . config('mail.default') . ')';

            return [
                'berhasil' => true,
                'pesan' => "Email uji coba ({$jenis}) berhasil dikirim ke {$emailTujuan} melalui {$modePengiriman}.",
            ];
        } catch (\Throwable $e) {
            return [
                'berhasil' => false,
                'pesan' => 'Gagal mengirim email: ' . $e->getMessage(),
            ];
        }
    }
}
