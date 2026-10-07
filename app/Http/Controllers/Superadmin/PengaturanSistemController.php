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

        if (empty($pengaturan->wa_fonnte_message_template)) {
            $pengaturan->wa_fonnte_message_template = \App\Services\Layanan2FA::DEFAULT_WA_TEMPLATE;
        }
        if (empty($pengaturan->wa_fonnte_api_url)) {
            $pengaturan->wa_fonnte_api_url = 'https://api.fonnte.com/send';
        }
        if (empty($pengaturan->wa_fonnte_country_code)) {
            $pengaturan->wa_fonnte_country_code = '62';
        }
        if (empty($pengaturan->wa_fonnte_delay)) {
            $pengaturan->wa_fonnte_delay = '1';
        }

        if (empty($pengaturan->smtp_host)) {
            $pengaturan->smtp_host = 'smtp.gmail.com';
        }
        if (empty($pengaturan->smtp_port)) {
            $pengaturan->smtp_port = 587;
        }
        if (empty($pengaturan->smtp_encryption)) {
            $pengaturan->smtp_encryption = 'tls';
        }
        if (empty($pengaturan->smtp_from_name)) {
            $pengaturan->smtp_from_name = $pengaturan->nama_aplikasi ?: 'SSO Sekolah';
        }
        if (empty($pengaturan->email_otp_subject)) {
            $pengaturan->email_otp_subject = \App\Services\LayananEmail::ambilDefaultSubjekOtp();
        }
        if (empty($pengaturan->email_otp_message)) {
            $pengaturan->email_otp_message = \App\Services\LayananEmail::ambilDefaultPesanOtp();
        }
        if (empty($pengaturan->email_otp_template)) {
            $pengaturan->email_otp_template = \App\Services\LayananEmail::ambilDefaultTemplateHtmlOtp();
        }
        if (empty($pengaturan->email_reset_subject)) {
            $pengaturan->email_reset_subject = \App\Services\LayananEmail::ambilDefaultSubjekReset();
        }
        if (empty($pengaturan->email_reset_message)) {
            $pengaturan->email_reset_message = \App\Services\LayananEmail::ambilDefaultPesanReset();
        }
        if (empty($pengaturan->email_reset_template)) {
            $pengaturan->email_reset_template = \App\Services\LayananEmail::ambilDefaultTemplateHtmlReset();
        }
        if (! is_array($pengaturan->email_custom_templates)) {
            $pengaturan->email_custom_templates = [];
        }

        return Inertia::render('Superadmin/PengaturanSistem/Indeks', [
            'pengaturan' => $pengaturan,
            'callbackUri' => url('/auth/google/callback'),
            'defaultWaTemplate' => \App\Services\Layanan2FA::DEFAULT_WA_TEMPLATE,
            'defaultEmailTemplates' => [
                'otp_subject' => \App\Services\LayananEmail::ambilDefaultSubjekOtp(),
                'otp_message' => \App\Services\LayananEmail::ambilDefaultPesanOtp(),
                'otp_template' => \App\Services\LayananEmail::ambilDefaultTemplateHtmlOtp(),
                'reset_subject' => \App\Services\LayananEmail::ambilDefaultSubjekReset(),
                'reset_message' => \App\Services\LayananEmail::ambilDefaultPesanReset(),
                'reset_template' => \App\Services\LayananEmail::ambilDefaultTemplateHtmlReset(),
                'general_template' => \App\Services\LayananEmail::ambilDefaultTemplateHtmlUmum(),
            ],
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
            'wa_fonnte_enabled' => ['nullable', 'boolean'],
            'wa_fonnte_api_url' => ['nullable', 'url', 'max:500'],
            'wa_fonnte_token' => ['nullable', 'string', 'max:500'],
            'wa_fonnte_sender' => ['nullable', 'string', 'max:50'],
            'wa_fonnte_country_code' => ['nullable', 'string', 'max:10'],
            'wa_fonnte_delay' => ['nullable', 'string', 'max:20'],
            'wa_fonnte_typing' => ['nullable', 'boolean'],
            'wa_fonnte_message_template' => ['nullable', 'string', 'max:4000'],
            'smtp_enabled' => ['nullable', 'boolean'],
            'smtp_host' => ['nullable', 'string', 'max:255'],
            'smtp_port' => ['nullable', 'integer', 'min:1', 'max:65535'],
            'smtp_encryption' => ['nullable', 'string', 'in:tls,ssl,none'],
            'smtp_username' => ['nullable', 'string', 'max:255'],
            'smtp_password' => ['nullable', 'string', 'max:500'],
            'smtp_from_address' => ['nullable', 'email', 'max:255'],
            'smtp_from_name' => ['nullable', 'string', 'max:100'],
            'email_otp_subject' => ['nullable', 'string', 'max:255'],
            'email_otp_message' => ['nullable', 'string', 'max:5000'],
            'email_otp_template' => ['nullable', 'string', 'max:50000'],
            'email_reset_subject' => ['nullable', 'string', 'max:255'],
            'email_reset_message' => ['nullable', 'string', 'max:5000'],
            'email_reset_template' => ['nullable', 'string', 'max:50000'],
            'email_custom_templates' => ['nullable', 'array'],
        ], [
            'logo_primer.max' => 'Ukuran logo tidak boleh melebihi 5MB.',
            'favicon.max' => 'Ukuran favicon tidak boleh melebihi 1MB.',
            's3_endpoint.url' => 'Format URL endpoint Object Storage tidak valid.',
            'wa_fonnte_api_url.url' => 'Format URL Endpoint API Fonnte tidak valid.',
            'smtp_from_address.email' => 'Format alamat email pengirim (From Address) tidak valid.',
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

            if ($request->has('wa_fonnte_api_url') || $request->has('wa_fonnte_token')) {
                $updateData['wa_fonnte_enabled'] = (bool) ($request->wa_fonnte_enabled ?? true);
                $updateData['wa_fonnte_api_url'] = trim((string) ($request->wa_fonnte_api_url ?: 'https://api.fonnte.com/send'));
                $updateData['wa_fonnte_token'] = trim((string) ($request->wa_fonnte_token ?? '')) ?: null;
                $updateData['wa_fonnte_sender'] = trim((string) ($request->wa_fonnte_sender ?? '')) ?: null;
                $updateData['wa_fonnte_country_code'] = trim((string) ($request->wa_fonnte_country_code ?: '62'));
                $updateData['wa_fonnte_delay'] = trim((string) ($request->wa_fonnte_delay ?: '1'));
                $updateData['wa_fonnte_typing'] = (bool) ($request->wa_fonnte_typing ?? true);
                $updateData['wa_fonnte_message_template'] = trim((string) ($request->wa_fonnte_message_template ?: \App\Services\Layanan2FA::DEFAULT_WA_TEMPLATE));
            }

            if ($request->has('smtp_host') || $request->has('smtp_username') || $request->has('email_otp_subject')) {
                $updateData['smtp_enabled'] = (bool) ($request->smtp_enabled ?? false);
                $updateData['smtp_host'] = trim((string) ($request->smtp_host ?: 'smtp.gmail.com'));
                $updateData['smtp_port'] = (int) ($request->smtp_port ?: 587);
                $updateData['smtp_encryption'] = trim((string) ($request->smtp_encryption ?: 'tls'));
                $updateData['smtp_username'] = trim((string) ($request->smtp_username ?? '')) ?: null;
                $updateData['smtp_password'] = trim((string) ($request->smtp_password ?? '')) ?: null;
                $updateData['smtp_from_address'] = trim((string) ($request->smtp_from_address ?? '')) ?: null;
                $updateData['smtp_from_name'] = trim((string) ($request->smtp_from_name ?: ($request->nama_aplikasi ?: 'SSO Sekolah')));

                $updateData['email_otp_subject'] = trim((string) ($request->email_otp_subject ?: \App\Services\LayananEmail::ambilDefaultSubjekOtp()));
                $updateData['email_otp_message'] = trim((string) ($request->email_otp_message ?: \App\Services\LayananEmail::ambilDefaultPesanOtp()));
                $updateData['email_otp_template'] = trim((string) ($request->email_otp_template ?: \App\Services\LayananEmail::ambilDefaultTemplateHtmlOtp()));

                $updateData['email_reset_subject'] = trim((string) ($request->email_reset_subject ?: \App\Services\LayananEmail::ambilDefaultSubjekReset()));
                $updateData['email_reset_message'] = trim((string) ($request->email_reset_message ?: \App\Services\LayananEmail::ambilDefaultPesanReset()));
                $updateData['email_reset_template'] = trim((string) ($request->email_reset_template ?: \App\Services\LayananEmail::ambilDefaultTemplateHtmlReset()));

                if (is_array($request->email_custom_templates)) {
                    $updateData['email_custom_templates'] = array_values(array_map(function ($item) {
                        $kodeBersih = preg_replace('/[^a-z0-9_\-]/', '_', strtolower(trim((string) ($item['kode'] ?? 'template_baru'))));
                        return [
                            'kode' => $kodeBersih ?: 'template_baru',
                            'label' => trim((string) ($item['label'] ?? 'Template Kustom')),
                            'subject' => trim((string) ($item['subject'] ?? 'Notifikasi - {nama_aplikasi}')),
                            'message' => trim((string) ($item['message'] ?? 'Halo *{nama}*,')),
                            'template' => trim((string) ($item['template'] ?: \App\Services\LayananEmail::ambilDefaultTemplateHtmlUmum())),
                        ];
                    }, $request->email_custom_templates));
                }
            }

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

        \App\Services\LayananLogAktivitas::catat('Memperbarui pengaturan identitas platform, integrasi Google OAuth2, Email SMTP Gmail, WhatsApp Fonnte, & Object Storage');

        return redirect()->back()->with('success', 'Pengaturan sistem berhasil diperbarui.');
    }

    /**
     * Uji coba pengiriman email (OTP, Reset Password, atau Template Kustom) menggunakan konfigurasi Gmail / SMTP.
     */
    public function ujiCobaEmail(Request $request): RedirectResponse
    {
        $request->validate([
            'email_tujuan' => ['required', 'email', 'max:255'],
            'jenis_template' => ['required', 'string', 'max:100'],
        ], [
            'email_tujuan.required' => 'Alamat email tujuan uji coba wajib diisi.',
            'email_tujuan.email' => 'Format alamat email tujuan uji coba tidak valid.',
        ]);

        $pengaturan = PengaturanSistem::firstOrCreate(['id' => 1]);

        $hasil = app(\App\Services\LayananEmail::class)->kirimEmailUjiCoba(
            (string) $request->input('email_tujuan'),
            (string) $request->input('jenis_template', 'otp'),
            $pengaturan
        );

        if (! $hasil['berhasil']) {
            return redirect()->back()->withErrors(['uji_email' => $hasil['pesan']]);
        }

        \App\Services\LayananLogAktivitas::catat("Mengirim email uji coba ({$request->input('jenis_template')}) ke {$request->input('email_tujuan')}");

        return redirect()->back()->with('success', $hasil['pesan']);
    }
}
