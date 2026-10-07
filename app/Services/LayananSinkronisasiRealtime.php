<?php

declare(strict_types=1);

namespace App\Services;

use App\Events\DataSistemDiperbarui;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Layanan terpusat untuk mengelola sinkronisasi data real-time 2 arah.
 * Menangani pembersihan cache terkait dan penyiaran (broadcast) event WebSocket
 * secara aman (anti-crash jika server WebSocket sedang offline) dengan
 * deduplikasi dalam satu siklus HTTP request.
 */
class LayananSinkronisasiRealtime
{
    /**
     * Daftar modul yang sudah disiarkan pada siklus request saat ini
     * untuk mencegah banjir broadcast beruntun (misal saat bulk import).
     *
     * @var array<string, bool>
     */
    private static array $modulTersiarkan = [];

    /**
     * Siarkan perubahan modul secara real-time dan bersihkan cache yang relevan.
     */
    public static function siarkan(
        string $modul,
        string $aksi = 'diperbarui',
        ?string $idTarget = null,
        bool $paksaSiarkan = false
    ): void {
        self::bersihkanCacheModul($modul);

        $kunciDedup = $modul . ':' . $aksi;
        if (!$paksaSiarkan && isset(self::$modulTersiarkan[$kunciDedup])) {
            return;
        }

        self::$modulTersiarkan[$kunciDedup] = true;

        try {
            broadcast(new DataSistemDiperbarui(
                modul: $modul,
                aksi: $aksi,
                idTarget: $idTarget,
                waktu: time()
            ));
        } catch (\Throwable $e) {
            // Jangan gagalkan request utama jika server WebSocket (Reverb/Pusher) belum dinyalakan
            Log::debug('Broadcast real-time dilewati (server WebSocket tidak terjangkau): ' . $e->getMessage());
        }
    }

    /**
     * Bersihkan cache yang berkaitan dengan modul yang mengalami perubahan.
     */
    public static function bersihkanCacheModul(string $modul): void
    {
        try {
            switch ($modul) {
                case 'pengguna':
                    Cache::forget('superadmin:daftar-pengguna');
                    Cache::forget('superadmin:statistik');
                    Cache::forget('superadmin:pengguna-terbaru');
                    Cache::forget('admin:statistik');
                    break;

                case 'peran':
                case 'aplikasi':
                    Cache::forget('superadmin:statistik');
                    Cache::forget('admin:statistik');
                    break;

                case 'koreksi':
                    Cache::forget('superadmin:daftar-pengguna');
                    Cache::forget('superadmin:statistik');
                    Cache::forget('admin:statistik');
                    break;

                case 'pengaturan':
                    Cache::forget('platform_settings');
                    Cache::forget('platform_settings_model');
                    break;

                case 'sistem':
                    Cache::forget('superadmin:daftar-pengguna');
                    Cache::forget('superadmin:statistik');
                    Cache::forget('superadmin:pengguna-terbaru');
                    Cache::forget('admin:statistik');
                    Cache::forget('platform_settings');
                    Cache::forget('platform_settings_model');
                    break;
            }
        } catch (\Throwable $e) {
            // Abaikan jika cache store belum siap
        }
    }
}
