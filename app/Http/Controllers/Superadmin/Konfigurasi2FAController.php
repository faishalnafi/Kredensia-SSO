<?php

declare(strict_types=1);

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\PengaturanSistem;
use App\Models\Role;
use App\Models\User;
use App\Services\Layanan2FA;
use App\Services\LayananLogAktivitas;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class Konfigurasi2FAController extends Controller
{
    /**
     * Tampilkan halaman utama konfigurasi autentikasi 2FA superadmin.
     */
    public function indeks(Request $request): Response
    {
        $pengaturan = Layanan2FA::dapatkanPengaturan();
        $semuaPeran = Role::orderBy('nama_role')->get(['id', 'nama_role']);

        // Query Pengguna dengan filter
        $query = User::with('roles:id,nama_role')
            ->select([
                'id',
                'nama_lengkap',
                'email',
                'nip_nis',
                'foto_identitas',
                'google_avatar',
                'is_active',
                'two_factor_confirmed_at',
                'two_factor_type',
                'two_factor_methods',
                'two_factor_passkeys',
                'two_factor_recovery_codes',
                'created_at',
            ])
            ->orderBy('nama_lengkap', 'asc');

        // Filter Pencarian Nama / Email / NIP-NISN
        if ($request->filled('cari')) {
            $cari = trim((string) $request->cari);
            $query->where(function ($q) use ($cari) {
                $q->where('nama_lengkap', 'like', "%{$cari}%")
                    ->orWhere('email', 'like', "%{$cari}%")
                    ->orWhere('nip_nis', 'like', "%{$cari}%");
            });
        }

        // Filter Peran
        if ($request->filled('peran') && $request->peran !== 'semua') {
            $peran = (string) $request->peran;
            $query->whereHas('roles', function ($q) use ($peran) {
                $q->where('nama_role', $peran);
            });
        }

        // Filter Status 2FA
        if ($request->filled('status_2fa')) {
            $status = (string) $request->status_2fa;
            if ($status === 'aktif') {
                $query->whereNotNull('two_factor_confirmed_at');
            } elseif ($status === 'belum_aktif') {
                $query->whereNull('two_factor_confirmed_at');
            }
        }

        $daftarPengguna = $query->paginate(12)->withQueryString();

        // Tambahkan informasi apakah pengguna ini wajib 2FA berdasarkan kebijakan saat ini
        $rolesWajib = (array) ($pengaturan->two_factor_roles ?: ['Super Admin', 'Admin']);
        $isGlobalEnabled = (bool) $pengaturan->two_factor_enabled;
        $enforcement = (string) $pengaturan->two_factor_enforcement;

        $daftarPengguna->getCollection()->transform(function ($u) use ($isGlobalEnabled, $enforcement, $rolesWajib) {
            $userRoles = $u->roles->pluck('nama_role')->toArray();
            $isWajib = false;

            if ($isGlobalEnabled) {
                if ($enforcement === 'all') {
                    $isWajib = true;
                } elseif ($enforcement === 'roles') {
                    $isWajib = !empty(array_intersect($rolesWajib, $userRoles));
                }
            }

            return [
                'id' => $u->id,
                'nama_lengkap' => $u->nama_lengkap,
                'email' => $u->email,
                'nip_nis' => $u->nip_nis,
                'avatar_url' => $u->avatar_url,
                'is_active' => (bool) $u->is_active,
                'roles' => $userRoles,
                'has_2fa' => !is_null($u->two_factor_confirmed_at),
                'two_factor_confirmed_at' => $u->two_factor_confirmed_at ? $u->two_factor_confirmed_at->format('d/m/Y H:i') : null,
                'two_factor_type' => $u->two_factor_type ?: 'totp',
                'two_factor_methods' => $u->daftarMetodeMfaAktif(),
                'is_required' => $isWajib,
            ];
        });

        // Hitung Statistik
        $totalPengguna = User::count();
        $totalAktif2FA = User::whereNotNull('two_factor_confirmed_at')->count();
        $totalBelumAktif = $totalPengguna - $totalAktif2FA;
        $persentaseAdopsi = $totalPengguna > 0 ? round(($totalAktif2FA / $totalPengguna) * 100, 1) : 0;

        // Hitung total pengguna yang wajib 2FA
        $totalWajib = 0;
        if ($isGlobalEnabled) {
            if ($enforcement === 'all') {
                $totalWajib = $totalPengguna;
            } elseif ($enforcement === 'roles') {
                $totalWajib = User::whereHas('roles', function ($q) use ($rolesWajib) {
                    $q->whereIn('nama_role', $rolesWajib);
                })->count();
            }
        }

        return Inertia::render('Superadmin/Konfigurasi2FA/Indeks', [
            'pengaturan' => [
                'nama_aplikasi' => (string) ($pengaturan->nama_aplikasi ?: 'SSO Sekolah'),
                'two_factor_enabled' => (bool) $pengaturan->two_factor_enabled,
                'two_factor_enforcement' => $pengaturan->two_factor_enforcement ?: 'roles',
                'two_factor_roles' => (array) ($pengaturan->two_factor_roles ?: ['Super Admin', 'Admin']),
                'two_factor_allowed_methods' => (array) ($pengaturan->two_factor_allowed_methods ?: ['totp', 'google_prompt', 'whatsapp', 'email', 'passkey', 'security_key', 'backup_codes']),
                'two_factor_grace_period_days' => (int) ($pengaturan->two_factor_grace_period_days ?? 7),
                'two_factor_remember_browser_days' => (int) ($pengaturan->two_factor_remember_browser_days ?? 30),
                'wa_fonnte_enabled' => (bool) ($pengaturan->wa_fonnte_enabled ?? true),
                'wa_fonnte_api_url' => (string) ($pengaturan->wa_fonnte_api_url ?: 'https://api.fonnte.com/send'),
                'wa_fonnte_token' => (string) ($pengaturan->wa_fonnte_token ?: ''),
                'wa_fonnte_sender' => (string) ($pengaturan->wa_fonnte_sender ?: ''),
                'wa_fonnte_country_code' => (string) ($pengaturan->wa_fonnte_country_code ?: '62'),
                'wa_fonnte_delay' => (string) ($pengaturan->wa_fonnte_delay ?: '1'),
                'wa_fonnte_typing' => (bool) ($pengaturan->wa_fonnte_typing ?? true),
                'wa_fonnte_message_template' => (string) ($pengaturan->wa_fonnte_message_template ?: Layanan2FA::DEFAULT_WA_TEMPLATE),
                'default_wa_template' => Layanan2FA::DEFAULT_WA_TEMPLATE,
                'smtp_enabled' => (bool) ($pengaturan->smtp_enabled ?? false),
                'smtp_host' => (string) ($pengaturan->smtp_host ?: 'smtp.gmail.com'),
                'smtp_port' => (int) ($pengaturan->smtp_port ?: 587),
                'smtp_encryption' => (string) ($pengaturan->smtp_encryption ?: 'tls'),
                'smtp_username' => (string) ($pengaturan->smtp_username ?: ''),
                'smtp_password' => (string) ($pengaturan->smtp_password ?: ''),
                'smtp_from_address' => (string) ($pengaturan->smtp_from_address ?: ''),
                'smtp_from_name' => (string) ($pengaturan->smtp_from_name ?: ($pengaturan->nama_aplikasi ?: 'SSO Sekolah')),
                'email_otp_subject' => (string) ($pengaturan->email_otp_subject ?: \App\Services\LayananEmail::ambilDefaultSubjekOtp()),
                'email_otp_message' => (string) ($pengaturan->email_otp_message ?: \App\Services\LayananEmail::ambilDefaultPesanOtp()),
                'email_otp_template' => (string) ($pengaturan->email_otp_template ?: \App\Services\LayananEmail::ambilDefaultTemplateHtmlOtp()),
                'email_reset_subject' => (string) ($pengaturan->email_reset_subject ?: \App\Services\LayananEmail::ambilDefaultSubjekReset()),
                'email_reset_message' => (string) ($pengaturan->email_reset_message ?: \App\Services\LayananEmail::ambilDefaultPesanReset()),
                'email_reset_template' => (string) ($pengaturan->email_reset_template ?: \App\Services\LayananEmail::ambilDefaultTemplateHtmlReset()),
                'default_email_templates' => [
                    'otp_subject' => \App\Services\LayananEmail::ambilDefaultSubjekOtp(),
                    'otp_message' => \App\Services\LayananEmail::ambilDefaultPesanOtp(),
                    'otp_template' => \App\Services\LayananEmail::ambilDefaultTemplateHtmlOtp(),
                    'reset_subject' => \App\Services\LayananEmail::ambilDefaultSubjekReset(),
                    'reset_message' => \App\Services\LayananEmail::ambilDefaultPesanReset(),
                    'reset_template' => \App\Services\LayananEmail::ambilDefaultTemplateHtmlReset(),
                ],
            ],
            'daftarMetodeSistem' => array_values(Layanan2FA::SEMUA_METODE),
            'semuaPeran' => $semuaPeran,
            'daftarPengguna' => $daftarPengguna,
            'statistik' => [
                'total_pengguna' => $totalPengguna,
                'total_aktif_2fa' => $totalAktif2FA,
                'total_belum_aktif' => $totalBelumAktif,
                'total_wajib' => $totalWajib,
                'persentase_adopsi' => $persentaseAdopsi,
            ],
            'filters' => $request->only(['cari', 'peran', 'status_2fa']),
        ]);
    }

    /**
     * Simpan pembaruan kebijakan konfigurasi 2FA sistem beserta konfigurasi Fonnte WhatsApp API.
     */
    public function perbarui(Request $request): RedirectResponse
    {
        $request->validate([
            'two_factor_enabled' => ['required', 'boolean'],
            'two_factor_enforcement' => ['required', 'string', 'in:all,roles,optional'],
            'two_factor_roles' => ['nullable', 'array'],
            'two_factor_roles.*' => ['string'],
            'two_factor_allowed_methods' => ['required', 'array', 'min:1'],
            'two_factor_allowed_methods.*' => ['string', 'in:totp,google_prompt,whatsapp,email,passkey,security_key,backup_codes'],
            'two_factor_grace_period_days' => ['required', 'integer', 'min:0', 'max:365'],
            'two_factor_remember_browser_days' => ['required', 'integer', 'min:1', 'max:365'],
            'wa_fonnte_enabled' => ['nullable', 'boolean'],
            'wa_fonnte_api_url' => ['nullable', 'url', 'max:500'],
            'wa_fonnte_token' => ['nullable', 'string', 'max:500'],
            'wa_fonnte_sender' => ['nullable', 'string', 'max:50'],
            'wa_fonnte_country_code' => ['nullable', 'string', 'max:10'],
            'wa_fonnte_delay' => ['nullable', 'string', 'max:20'],
            'wa_fonnte_typing' => ['nullable', 'boolean'],
            'wa_fonnte_message_template' => ['nullable', 'string', 'max:4000'],
        ], [
            'two_factor_allowed_methods.min' => 'Pilih minimal satu metode verifikasi 2FA / MFA yang diizinkan.',
            'two_factor_grace_period_days.min' => 'Masa tenggang minimal 0 hari.',
            'two_factor_remember_browser_days.min' => 'Durasi ingat perangkat minimal 1 hari.',
            'wa_fonnte_api_url.url' => 'Format URL Endpoint API Fonnte tidak valid.',
        ]);

        $pengaturan = Layanan2FA::dapatkanPengaturan();

        DB::transaction(function () use ($pengaturan, $request) {
            $dataUpdate = [
                'two_factor_enabled' => (bool) $request->two_factor_enabled,
                'two_factor_enforcement' => $request->two_factor_enforcement,
                'two_factor_roles' => $request->two_factor_roles ?: [],
                'two_factor_allowed_methods' => array_values(array_unique($request->two_factor_allowed_methods)),
                'two_factor_grace_period_days' => (int) $request->two_factor_grace_period_days,
                'two_factor_remember_browser_days' => (int) $request->two_factor_remember_browser_days,
            ];

            if ($request->has('wa_fonnte_api_url') || $request->has('wa_fonnte_token')) {
                $dataUpdate['wa_fonnte_enabled'] = (bool) ($request->wa_fonnte_enabled ?? true);
                $dataUpdate['wa_fonnte_api_url'] = trim((string) ($request->wa_fonnte_api_url ?: 'https://api.fonnte.com/send'));
                $dataUpdate['wa_fonnte_token'] = trim((string) ($request->wa_fonnte_token ?? '')) ?: null;
                $dataUpdate['wa_fonnte_sender'] = trim((string) ($request->wa_fonnte_sender ?? '')) ?: null;
                $dataUpdate['wa_fonnte_country_code'] = trim((string) ($request->wa_fonnte_country_code ?: '62'));
                $dataUpdate['wa_fonnte_delay'] = trim((string) ($request->wa_fonnte_delay ?: '1'));
                $dataUpdate['wa_fonnte_typing'] = (bool) ($request->wa_fonnte_typing ?? true);
                $dataUpdate['wa_fonnte_message_template'] = trim((string) ($request->wa_fonnte_message_template ?: Layanan2FA::DEFAULT_WA_TEMPLATE));
            }

            $pengaturan->update($dataUpdate);
        });

        Cache::forget('platform_settings');
        Cache::forget('platform_settings_model');

        LayananLogAktivitas::catat('Memperbarui kebijakan konfigurasi autentikasi 2FA / MFA & Gateway WhatsApp Fonnte');

        return redirect()->back()->with('success', 'Kebijakan Autentikasi 2FA / MFA dan Konfigurasi WhatsApp Fonnte berhasil disimpan.');
    }

    /**
     * Simpan khusus konfigurasi API WhatsApp Fonnte dari panel Superadmin.
     */
    public function simpanKonfigurasiFonnte(Request $request): RedirectResponse
    {
        $request->validate([
            'wa_fonnte_enabled' => ['required', 'boolean'],
            'wa_fonnte_api_url' => ['required', 'url', 'max:500'],
            'wa_fonnte_token' => ['nullable', 'string', 'max:500'],
            'wa_fonnte_sender' => ['nullable', 'string', 'max:50'],
            'wa_fonnte_country_code' => ['required', 'string', 'max:10'],
            'wa_fonnte_delay' => ['required', 'string', 'max:20'],
            'wa_fonnte_typing' => ['required', 'boolean'],
            'wa_fonnte_message_template' => ['required', 'string', 'max:4000'],
        ], [
            'wa_fonnte_api_url.required' => 'URL Endpoint API Fonnte wajib diisi.',
            'wa_fonnte_api_url.url' => 'Format URL Endpoint API Fonnte tidak valid.',
            'wa_fonnte_message_template.required' => 'Template pesan OTP WhatsApp wajib diisi.',
        ]);

        $pengaturan = Layanan2FA::dapatkanPengaturan();

        DB::transaction(function () use ($pengaturan, $request) {
            $pengaturan->update([
                'wa_fonnte_enabled' => (bool) $request->wa_fonnte_enabled,
                'wa_fonnte_api_url' => trim((string) $request->wa_fonnte_api_url),
                'wa_fonnte_token' => trim((string) ($request->wa_fonnte_token ?? '')) ?: null,
                'wa_fonnte_sender' => trim((string) ($request->wa_fonnte_sender ?? '')) ?: null,
                'wa_fonnte_country_code' => trim((string) ($request->wa_fonnte_country_code ?: '62')),
                'wa_fonnte_delay' => trim((string) ($request->wa_fonnte_delay ?: '1')),
                'wa_fonnte_typing' => (bool) $request->wa_fonnte_typing,
                'wa_fonnte_message_template' => trim((string) $request->wa_fonnte_message_template),
            ]);
        });

        Cache::forget('platform_settings');
        Cache::forget('platform_settings_model');

        LayananLogAktivitas::catat('Memperbarui konfigurasi API WhatsApp Gateway (Fonnte)');

        return redirect()->back()->with('success', 'Konfigurasi API WhatsApp Fonnte berhasil disimpan dan diterapkan secara dinamis.');
    }

    /**
     * Cek status koneksi perangkat WhatsApp di Fonnte secara langsung.
     */
    public function cekDeviceFonnte(Request $request): JsonResponse
    {
        $token = $request->input('wa_fonnte_token');
        $hasil = Layanan2FA::cekPerangkatFonnte(is_string($token) ? $token : null);

        return response()->json($hasil, $hasil['berhasil'] ? 200 : 422);
    }

    /**
     * Uji kirim pesan WhatsApp OTP melalui Fonnte menggunakan konfigurasi yang sedang diedit.
     */
    public function ujiKirimFonnte(Request $request): JsonResponse
    {
        $request->validate([
            'nomor_tujuan' => ['required', 'string', 'max:30'],
            'wa_fonnte_api_url' => ['nullable', 'url', 'max:500'],
            'wa_fonnte_token' => ['nullable', 'string', 'max:500'],
            'wa_fonnte_country_code' => ['nullable', 'string', 'max:10'],
            'wa_fonnte_delay' => ['nullable', 'string', 'max:20'],
            'wa_fonnte_typing' => ['nullable', 'boolean'],
            'wa_fonnte_message_template' => ['nullable', 'string', 'max:4000'],
        ], [
            'nomor_tujuan.required' => 'Masukkan nomor WhatsApp tujuan untuk pengujian.',
        ]);

        $pengaturan = Layanan2FA::dapatkanPengaturan();
        $user = $request->user();
        $otpSimulasi = (string) random_int(100000, 999999);

        $template = trim((string) ($request->input('wa_fonnte_message_template') ?: $pengaturan->wa_fonnte_message_template ?: Layanan2FA::DEFAULT_WA_TEMPLATE));

        $pesan = Layanan2FA::formatPesanOtpWhatsapp($template, [
            'otp' => $otpSimulasi,
            'nama' => (string) ($user?->nama_lengkap ?: 'Superadmin SSO'),
            'email' => (string) ($user?->email ?: 'superadmin@sekolah.sch.id'),
            'no_telp' => (string) $request->input('nomor_tujuan'),
            'aplikasi' => (string) ($pengaturan->nama_aplikasi ?: config('app.name', 'SSO Sekolah')),
            'menit' => '10',
            'waktu' => now()->addMinutes(10)->format('H:i'),
        ]);

        $override = [
            'wa_fonnte_api_url' => $request->input('wa_fonnte_api_url') ?: $pengaturan->wa_fonnte_api_url,
            'wa_fonnte_token' => $request->input('wa_fonnte_token') !== null ? $request->input('wa_fonnte_token') : $pengaturan->wa_fonnte_token,
            'wa_fonnte_country_code' => $request->input('wa_fonnte_country_code') ?: $pengaturan->wa_fonnte_country_code,
            'wa_fonnte_delay' => $request->input('wa_fonnte_delay') ?: $pengaturan->wa_fonnte_delay,
            'wa_fonnte_typing' => $request->has('wa_fonnte_typing') ? (bool) $request->boolean('wa_fonnte_typing') : (bool) $pengaturan->wa_fonnte_typing,
        ];

        $hasil = Layanan2FA::kirimPesanFonnte(
            (string) $request->input('nomor_tujuan'),
            $pesan,
            $pengaturan,
            $override
        );

        if ($hasil['berhasil']) {
            LayananLogAktivitas::catat("Melakukan uji kirim pesan OTP WhatsApp Fonnte ke nomor: {$request->input('nomor_tujuan')}");
        }

        return response()->json([
            'berhasil' => $hasil['berhasil'],
            'pesan' => $hasil['pesan_respon'],
            'otp_simulasi' => $otpSimulasi,
            'pratinjau_pesan' => $pesan,
            'detail' => $hasil['data'],
        ], $hasil['berhasil'] ? 200 : 422);
    }

    /**
     * Reset kunci dan konfigurasi 2FA pengguna oleh Superadmin.
     */
    public function resetPengguna2FA(string $userId): RedirectResponse
    {
        $user = User::findOrFail($userId);

        Layanan2FA::resetUser2FA($user);

        LayananLogAktivitas::catat("Mereset kunci autentikasi 2FA/MFA pengguna: {$user->nama_lengkap} ({$user->email})");

        return redirect()->back()->with('success', "Autentikasi 2FA/MFA untuk pengguna {$user->nama_lengkap} berhasil di-reset. Pengguna dapat mengatur ulang metode verifikasi pada login berikutnya.");
    }

    /**
     * Reset massal seluruh pengguna (opsional darurat).
     */
    public function resetSemua2FA(): RedirectResponse
    {
        $total = User::whereNotNull('two_factor_confirmed_at')->count();

        User::whereNotNull('two_factor_confirmed_at')->update([
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

        LayananLogAktivitas::catat("Melakukan reset massal 2FA/MFA untuk seluruh pengguna ({$total} akun)");

        return redirect()->back()->with('success', "Berhasil mereset 2FA/MFA untuk seluruh {$total} akun pengguna.");
    }
}
