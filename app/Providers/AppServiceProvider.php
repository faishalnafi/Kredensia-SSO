<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        // Muat dinamis konfigurasi Google OAuth2 dari database jika tabel sudah terbuat
        try {
            if (\Illuminate\Support\Facades\Schema::hasTable('pengaturan_sistem')) {
                $settings = \Illuminate\Support\Facades\Cache::remember('platform_settings_model', 3600, function() {
                    return \App\Models\PengaturanSistem::first();
                });

                if ($settings) {
                    // Google OAuth2 (Hanya timpa jika di database terisi)
                    if (!empty($settings->google_client_id) && !empty($settings->google_client_secret)) {
                        config([
                            'services.google.client_id' => $settings->google_client_id,
                            'services.google.client_secret' => $settings->google_client_secret,
                        ]);
                    }
                    config([
                        'services.google.redirect' => url('/auth/google/callback'),
                    ]);

                    // Object Storage (AWS S3 / GCP / MinIO) - Hanya timpa jika provider bukan local
                    if ($settings->storage_provider && $settings->storage_provider !== 'local') {
                        config([
                            'filesystems.default' => 's3',
                            'filesystems.disks.s3.driver' => 's3',
                            'filesystems.disks.s3.key' => $settings->s3_key,
                            'filesystems.disks.s3.secret' => $settings->s3_secret,
                            'filesystems.disks.s3.region' => $settings->s3_region ?: 'us-east-1',
                            'filesystems.disks.s3.bucket' => $settings->s3_bucket,
                            'filesystems.disks.s3.endpoint' => $settings->s3_endpoint,
                            'filesystems.disks.s3.use_path_style_endpoint' => (bool) $settings->s3_use_path_style_endpoint,
                            'filesystems.disks.s3.url' => $settings->s3_endpoint 
                                ? rtrim($settings->s3_endpoint, '/') . '/' . $settings->s3_bucket 
                                : 'https://' . $settings->s3_bucket . '.s3.amazonaws.com',
                        ]);
                    }
                    // Simpan batas request per menit ke config
                    config([
                        'sso.batas_request_per_menit' => $settings->batas_request_per_menit ?? 2500,
                    ]);
                }
            }
        } catch (\Throwable $e) {
            // Abaikan jika migrasi belum berjalan saat boot awal
        }

        // Daftarkan Rate Limiter Global SSO berbasis setelan di database
        \Illuminate\Support\Facades\RateLimiter::for('global_sso', function (\Illuminate\Http\Request $request) {
            $limit = config('sso.batas_request_per_menit', 2500);
            return \Illuminate\Cache\RateLimiting\Limit::perMinute($limit)->by($request->ip());
        });
    }
}
