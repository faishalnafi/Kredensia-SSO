<?php

declare(strict_types=1);

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\PengaturanSistem;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PengaturanSistemController extends Controller
{
    /**
     * Tampilkan halaman indeks pengaturan sistem.
     */
    public function indeks(): Response
    {
        $defaultLogo = 'https://support.nafii.my.id/icon/domains.png';
        $pengaturan = PengaturanSistem::firstOrCreate(['id' => 1], [
            'nama_aplikasi' => 'SSO Sekolah',
            'logo_primer_url' => $defaultLogo,
            'favicon_url' => $defaultLogo,
        ]);

        // Jika data di database kosong, salin dari file .env agar tidak terputus
        if (empty($pengaturan->google_client_id)) {
            $pengaturan->update([
                'google_client_id' => env('GOOGLE_CLIENT_ID'),
                'google_client_secret' => env('GOOGLE_CLIENT_SECRET'),
            ]);

            // Bersihkan cache
            Cache::forget('platform_settings');
            Cache::forget('platform_settings_model');
        }

        return Inertia::render('Superadmin/PengaturanSistem/Indeks', [
            'pengaturan' => $pengaturan,
            'callbackUri' => url('/auth/google/callback')
        ]);
    }

    /**
     * Perbarui pengaturan sistem global.
     */
    public function perbarui(Request $request): RedirectResponse
    {
        $pengaturan = PengaturanSistem::findOrFail(1);

        $request->validate([
            'nama_aplikasi' => ['required', 'string', 'max:100'],
            'logo_primer' => ['nullable', 'image', 'max:5120'], // Max 5MB
            'favicon' => ['nullable', 'file', 'max:1024'],      // Max 1MB
            'google_client_id' => ['nullable', 'string', 'max:500'],
            'google_client_secret' => ['nullable', 'string', 'max:500'],
            'batas_request_per_menit' => ['required', 'integer', 'min:1', 'max:100000'],
            'storage_provider' => ['required', 'string', 'in:local,s3,gcs,minio'],
            's3_key' => ['nullable', 'string', 'max:500'],
            's3_secret' => ['nullable', 'string', 'max:500'],
            's3_bucket' => ['nullable', 'string', 'max:255'],
            's3_region' => ['nullable', 'string', 'max:100'],
            's3_endpoint' => ['nullable', 'url', 'max:500'],
            's3_use_path_style_endpoint' => ['required', 'boolean'],
        ], [
            'logo_primer.max' => 'Ukuran logo tidak boleh melebihi 5MB.',
            'favicon.max' => 'Ukuran favicon tidak boleh melebihi 1MB.',
            's3_endpoint.url' => 'Format URL endpoint Object Storage tidak valid.',
            'batas_request_per_menit.required' => 'Batas request per menit wajib diisi.',
            'batas_request_per_menit.integer' => 'Batas request per menit harus berupa angka.',
            'batas_request_per_menit.min' => 'Batas request minimal adalah 1.',
        ]);

        DB::transaction(function () use ($pengaturan, $request) {
            $updateData = [
                'nama_aplikasi' => $request->nama_aplikasi,
                'google_client_id' => $request->google_client_id,
                'google_client_secret' => $request->google_client_secret,
                'batas_request_per_menit' => (int) $request->batas_request_per_menit,
                'storage_provider' => $request->storage_provider,
                's3_key' => $request->s3_key,
                's3_secret' => $request->s3_secret,
                's3_bucket' => $request->s3_bucket,
                's3_region' => $request->s3_region,
                's3_endpoint' => $request->s3_endpoint,
                's3_use_path_style_endpoint' => (bool) $request->s3_use_path_style_endpoint,
            ];

            // Unggah Logo Primer jika dikirimkan
            if ($request->hasFile('logo_primer')) {
                // Hapus logo lama jika bukan default
                if ($pengaturan->logo_primer_url && str_contains($pengaturan->logo_primer_url, '/storage/settings/')) {
                    $oldPath = 'settings/' . basename($pengaturan->logo_primer_url);
                    Storage::disk('public')->delete($oldPath);
                }

                $path = $request->file('logo_primer')->store('settings', 'public');
                $updateData['logo_primer_url'] = Storage::url($path);
            }

            // Unggah Favicon jika dikirimkan
            if ($request->hasFile('favicon')) {
                // Hapus favicon lama jika bukan default
                if ($pengaturan->favicon_url && str_contains($pengaturan->favicon_url, '/storage/settings/')) {
                    $oldPath = 'settings/' . basename($pengaturan->favicon_url);
                    Storage::disk('public')->delete($oldPath);
                }

                $path = $request->file('favicon')->store('settings', 'public');
                $updateData['favicon_url'] = Storage::url($path);
            }

            $pengaturan->update($updateData);
        });

        // Bersihkan cache agar konfigurasi terbaru ter-load instan
        Cache::forget('platform_settings');
        Cache::forget('platform_settings_model');

        \App\Services\LayananLogAktivitas::catat('Memperbarui pengaturan identitas platform, integrasi Google OAuth2, & Object Storage');

        return redirect()->back()->with('success', 'Pengaturan sistem berhasil diperbarui.');
    }
}
