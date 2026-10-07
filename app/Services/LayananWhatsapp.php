<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\PengaturanSistem;

/**
 * Layanan dasar (Base Setup) pengiriman pesan WhatsApp terpusat melalui Fonnte API.
 * Seluruh konfigurasi (URL, Token, Nomor Pengirim, Country Code, Delay, Typing)
 * diambil secara dinamis dari tabel pengaturan_sistem yang dikelola di Superadmin.
 */
class LayananWhatsapp
{
    /**
     * Kirim pesan teks WhatsApp ke satu atau beberapa nomor tujuan.
     *
     * @param string $nomorTujuan Nomor WhatsApp tujuan (contoh: "08123456789" atau "08123456789,08987654321")
     * @param string $pesan Isi pesan WhatsApp (mendukung format tebal *teks*, miring _teks_)
     * @param array<string, mixed> $overrideConfig Opsi override konfigurasi bila diperlukan
     * @return array{berhasil: bool, status_http: int, pesan_respon: string, data: array<string, mixed>}
     */
    public static function kirim(string $nomorTujuan, string $pesan, array $overrideConfig = []): array
    {
        $pengaturan = Layanan2FA::dapatkanPengaturan();

        return Layanan2FA::kirimPesanFonnte($nomorTujuan, $pesan, $pengaturan, $overrideConfig);
    }

    /**
     * Kirim pesan WhatsApp menggunakan template dinamis dengan variabel placeholder.
     *
     * @param string $nomorTujuan Nomor WhatsApp tujuan
     * @param string $template String template dengan placeholder (misal: "Halo {nama}, ...")
     * @param array<string, string> $variabel Pasangan key-value pengganti placeholder
     * @return array{berhasil: bool, status_http: int, pesan_respon: string, data: array<string, mixed>}
     */
    public static function kirimTemplate(string $nomorTujuan, string $template, array $variabel = []): array
    {
        $pengaturan = Layanan2FA::dapatkanPengaturan();
        $variabelLengkap = array_merge([
            'aplikasi' => (string) ($pengaturan->nama_aplikasi ?: config('app.name', 'SSO Sekolah')),
            'waktu' => now()->format('H:i'),
        ], $variabel);

        $pesanJadi = Layanan2FA::formatPesanOtpWhatsapp($template, $variabelLengkap);

        return Layanan2FA::kirimPesanFonnte($nomorTujuan, $pesanJadi, $pengaturan);
    }

    /**
     * Periksa apakah modul WhatsApp Gateway Fonnte sudah aktif dan memiliki Token API.
     */
    public static function apakahSiapDigunakan(?PengaturanSistem $pengaturan = null): bool
    {
        $pengaturan = $pengaturan ?: Layanan2FA::dapatkanPengaturan();

        return (bool) ($pengaturan->wa_fonnte_enabled ?? true)
            && !empty(trim((string) ($pengaturan->wa_fonnte_token ?? '')));
    }

    /**
     * Cek status perangkat WhatsApp yang terhubung di Fonnte.
     *
     * @return array{berhasil: bool, pesan: string, perangkat: array<string, mixed>}
     */
    public static function cekStatusPerangkat(?string $token = null): array
    {
        return Layanan2FA::cekPerangkatFonnte($token);
    }
}
