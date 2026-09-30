<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\LogAktivitas;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Carbon\Carbon;

class LayananLogAktivitas
{
    /**
     * Catat aktivitas pengguna secara langsung (instan & sinkron) ke database log_aktivitas beserta koordinat GPS.
     */
    public static function catat(
        string $aktivitas,
        ?string $email = null,
        ?string $userId = null,
        ?float $latitude = null,
        ?float $longitude = null
    ): void {
        try {
            if (!Schema::hasTable('log_aktivitas')) {
                return;
            }

            $user = Auth::user();
            
            $idTarget = $userId ?: ($user ? $user->id : null);
            $emailTarget = $email ?: ($user ? $user->email : null);
            $ipAddress = request()->ip();
            $userAgent = request()->userAgent();

            // Deteksi koordinat GPS dari parameter, request input, $_COOKIE, cookie, header, atau session
            $reqLat = request()->input('latitude')
                ?? ($_COOKIE['sso_user_lat'] ?? null)
                ?? request()->cookie('sso_user_lat')
                ?? request()->header('X-GPS-Latitude')
                ?? session('user_latitude');

            $reqLng = request()->input('longitude')
                ?? ($_COOKIE['sso_user_lng'] ?? null)
                ?? request()->cookie('sso_user_lng')
                ?? request()->header('X-GPS-Longitude')
                ?? session('user_longitude');

            $lat = $latitude !== null ? $latitude : ($reqLat !== null ? (float) $reqLat : null);
            $lng = $longitude !== null ? $longitude : ($reqLng !== null ? (float) $reqLng : null);

            // Jika GPS browser tidak tersedia (misal di Android diblokir/matikan), gunakan Fallback IP Geolocation
            if ($lat === null || $lng === null) {
                $geoIp = self::dapatkanKoordinatDariIp($ipAddress);
                if ($geoIp) {
                    $lat = $geoIp['lat'];
                    $lng = $geoIp['lng'];
                }
            }

            // Simpan log secara langsung & instan ke database
            LogAktivitas::create([
                'user_id'    => $idTarget,
                'email'      => $emailTarget,
                'aktivitas'  => mb_substr($aktivitas, 0, 250),
                'ip_address' => $ipAddress,
                'user_agent' => $userAgent,
                'latitude'   => $lat,
                'longitude'  => $lng,
            ]);

            // Pengecekan otomatis arsip log tanggal 1 (non-blocking / throttle cache)
            self::periksaDanArsipOtomatis(false);

        } catch (\Throwable $e) {
            Log::error('Gagal mencatat log_aktivitas DB: ' . $e->getMessage());
        }
    }

    /**
     * Jalankan proses pengarsipan log aktivitas ke berkas JSON bulanan.
     *
     * @param bool $forceAll Jika true, arsipkan seluruh entri log yang ada saat ini (manual).
     *                       Jika false, hanya arsipkan entri log sebelum awal bulan saat ini (otomatis tanggal 1).
     * @return array Daftar file yang dibuat dan jumlah log per file.
     */
    public static function arsipkanLogBulanan(bool $forceAll = false): array
    {
        $hasil = [];

        try {
            if (!Schema::hasTable('log_aktivitas')) {
                return $hasil;
            }

            $folderArsip = storage_path('logs/aktivitas');
            if (!File::exists($folderArsip)) {
                File::makeDirectory($folderArsip, 0755, true, true);
            }

            $query = LogAktivitas::with('user:id,nama_lengkap,email')->orderBy('created_at', 'asc');

            if (!$forceAll) {
                // Hanya arsipkan log yang dicatat sebelum awal bulan ini (misal sebelum tanggal 1 pukul 00:00:00)
                $awalBulanIni = Carbon::now()->startOfMonth();
                $query->where('created_at', '<', $awalBulanIni);
            }

            $logs = $query->get();

            if ($logs->isEmpty()) {
                return $hasil;
            }

            // Kelompokkan data log berdasarkan tahun dan bulan (format Y_m)
            $logsPerBulan = $logs->groupBy(function ($item) {
                return $item->created_at ? $item->created_at->format('Y_m') : Carbon::now()->format('Y_m');
            });

            $idsToDelete = [];

            foreach ($logsPerBulan as $periode => $daftarItem) {
                $namaFile = 'log_aktivitas_' . $periode . '.json';
                $pathFile = $folderArsip . DIRECTORY_SEPARATOR . $namaFile;

                // Jika file sudah ada, tambahkan penanda waktu unik agar data aman dan tidak tertimpa
                if (File::exists($pathFile)) {
                    $namaFile = 'log_aktivitas_' . $periode . '_' . Carbon::now()->format('Ymd_His') . '.json';
                    $pathFile = $folderArsip . DIRECTORY_SEPARATOR . $namaFile;
                }

                $mappedData = $daftarItem->map(function ($log) {
                    return [
                        'id'         => $log->id,
                        'waktu'      => $log->created_at ? $log->created_at->toIso8601String() : null,
                        'user_id'    => $log->user_id,
                        'nama_user'  => $log->user ? $log->user->nama_lengkap : 'Tamu / Umum',
                        'email'      => $log->email,
                        'aktivitas'  => $log->aktivitas,
                        'ip_address' => $log->ip_address,
                        'user_agent' => $log->user_agent,
                        'latitude'   => $log->latitude,
                        'longitude'  => $log->longitude,
                    ];
                })->values()->all();

                $bulanObj = Carbon::createFromFormat('Y_m', (string) $periode);
                $namaBulanIndo = $bulanObj ? $bulanObj->locale('id')->translatedFormat('F Y') : (string) $periode;

                $jsonContent = json_encode([
                    'info' => [
                        'periode'       => $namaBulanIndo,
                        'kode_periode'  => (string) $periode,
                        'tanggal_arsip' => Carbon::now()->toIso8601String(),
                        'total_log'     => count($mappedData),
                        'nama_file'     => $namaFile,
                        'metode'        => $forceAll ? 'manual' : 'otomatis_tanggal_1',
                    ],
                    'data' => $mappedData,
                ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

                File::put($pathFile, $jsonContent);

                $hasil[] = [
                    'file'  => $namaFile,
                    'total' => count($mappedData),
                ];

                foreach ($daftarItem as $item) {
                    $idsToDelete[] = $item->id;
                }
            }

            // Hapus hanya record yang sudah berhasil ditulis ke file JSON
            if (!empty($idsToDelete)) {
                foreach (array_chunk($idsToDelete, 500) as $chunkIds) {
                    LogAktivitas::whereIn('id', $chunkIds)->delete();
                }
            }

            return $hasil;
        } catch (\Throwable $e) {
            Log::error('LayananLogAktivitas::arsipkanLogBulanan error: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Periksa apakah saat ini ada log dari bulan-bulan sebelumnya yang belum diarsipkan.
     * Berjalan otomatis saat sistem diakses (misal tanggal 1 atau setelah pergantian bulan).
     */
    public static function periksaDanArsipOtomatis(bool $forceCheck = false): void
    {
        $cacheKey = 'sso_cek_arsip_log_' . date('Y_m_d');

        if (!$forceCheck && Cache::has($cacheKey)) {
            return;
        }

        try {
            // Pasang jeda pemeriksaan (30 menit) agar tidak membebani query request berikutnya
            Cache::put($cacheKey, true, 1800);

            if (!Schema::hasTable('log_aktivitas')) {
                return;
            }

            $awalBulanIni = Carbon::now()->startOfMonth();
            $adaLogLama = LogAktivitas::where('created_at', '<', $awalBulanIni)->exists();

            if ($adaLogLama) {
                $hasil = self::arsipkanLogBulanan(forceAll: false);
                if (!empty($hasil)) {
                    $total = array_sum(array_column($hasil, 'total'));
                    Log::info("Sistem Otomatis: Berhasil mengarsipkan {$total} log aktivitas periode sebelumnya.");
                }
            }
        } catch (\Throwable $e) {
            Log::error('LayananLogAktivitas::periksaDanArsipOtomatis error: ' . $e->getMessage());
        }
    }

    /**
     * Fallback estimasi koordinat GPS dari IP Address pengguna jika GPS browser diblokir/mati di HP Android.
     */
    private static function dapatkanKoordinatDariIp(string $ip): ?array
    {
        if (in_array($ip, ['127.0.0.1', '::1']) || str_starts_with($ip, '192.168.') || str_starts_with($ip, '10.')) {
            return null;
        }

        return \Illuminate\Support\Facades\Cache::remember('ip_geo_' . md5($ip), 86400, function () use ($ip) {
            try {
                $response = \Illuminate\Support\Facades\Http::timeout(2)
                    ->get("http://ip-api.com/json/{$ip}?fields=status,lat,lon,city");

                if ($response->successful() && $response->json('status') === 'success') {
                    return [
                        'lat' => (float) $response->json('lat'),
                        'lng' => (float) $response->json('lon'),
                    ];
                }
            } catch (\Throwable $e) {
                Log::warning("IP Geolocation lookup failed for IP {$ip}: " . $e->getMessage());
            }
            return null;
        });
    }
}
