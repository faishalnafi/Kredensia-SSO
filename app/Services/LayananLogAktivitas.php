<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\LogAktivitas;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

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

        } catch (\Throwable $e) {
            Log::error('Gagal mencatat log_aktivitas DB: ' . $e->getMessage());
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
