<?php

declare(strict_types=1);

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\PengaturanSistem;
use App\Models\Role;
use App\Models\User;
use App\Services\Layanan2FA;
use App\Services\LayananLogAktivitas;
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
                'two_factor_enabled' => (bool) $pengaturan->two_factor_enabled,
                'two_factor_enforcement' => $pengaturan->two_factor_enforcement ?: 'roles',
                'two_factor_roles' => (array) ($pengaturan->two_factor_roles ?: ['Super Admin', 'Admin']),
                'two_factor_allowed_methods' => (array) ($pengaturan->two_factor_allowed_methods ?: ['totp', 'email']),
                'two_factor_grace_period_days' => (int) ($pengaturan->two_factor_grace_period_days ?? 7),
                'two_factor_remember_browser_days' => (int) ($pengaturan->two_factor_remember_browser_days ?? 30),
            ],
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
     * Simpan pembaruan kebijakan konfigurasi 2FA sistem.
     */
    public function perbarui(Request $request): RedirectResponse
    {
        $request->validate([
            'two_factor_enabled' => ['required', 'boolean'],
            'two_factor_enforcement' => ['required', 'string', 'in:all,roles,optional'],
            'two_factor_roles' => ['nullable', 'array'],
            'two_factor_roles.*' => ['string'],
            'two_factor_allowed_methods' => ['required', 'array', 'min:1'],
            'two_factor_allowed_methods.*' => ['string', 'in:totp,email'],
            'two_factor_grace_period_days' => ['required', 'integer', 'min:0', 'max:365'],
            'two_factor_remember_browser_days' => ['required', 'integer', 'min:1', 'max:365'],
        ], [
            'two_factor_allowed_methods.min' => 'Pilih minimal satu metode 2FA yang diizinkan (TOTP atau Email).',
            'two_factor_grace_period_days.min' => 'Masa tenggang minimal 0 hari.',
            'two_factor_remember_browser_days.min' => 'Durasi ingat perangkat minimal 1 hari.',
        ]);

        $pengaturan = Layanan2FA::dapatkanPengaturan();

        DB::transaction(function () use ($pengaturan, $request) {
            $pengaturan->update([
                'two_factor_enabled' => (bool) $request->two_factor_enabled,
                'two_factor_enforcement' => $request->two_factor_enforcement,
                'two_factor_roles' => $request->two_factor_roles ?: [],
                'two_factor_allowed_methods' => $request->two_factor_allowed_methods,
                'two_factor_grace_period_days' => (int) $request->two_factor_grace_period_days,
                'two_factor_remember_browser_days' => (int) $request->two_factor_remember_browser_days,
            ]);
        });

        Cache::forget('platform_settings');
        Cache::forget('platform_settings_model');

        LayananLogAktivitas::catat('Memperbarui kebijakan konfigurasi autentikasi 2FA sistem');

        return redirect()->back()->with('success', 'Kebijakan Autentikasi 2FA berhasil disimpan dan diterapkan.');
    }

    /**
     * Reset kunci dan konfigurasi 2FA pengguna oleh Superadmin.
     */
    public function resetPengguna2FA(string $userId): RedirectResponse
    {
        $user = User::findOrFail($userId);

        Layanan2FA::resetUser2FA($user);

        LayananLogAktivitas::catat("Mereset kunci autentikasi 2FA pengguna: {$user->nama_lengkap} ({$user->email})");

        return redirect()->back()->with('success', "Autentikasi 2FA untuk pengguna {$user->nama_lengkap} berhasil di-reset. Pengguna dapat mengatur ulang 2FA pada login berikutnya.");
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
            'two_factor_email_code' => null,
            'two_factor_email_expires_at' => null,
        ]);

        LayananLogAktivitas::catat("Melakukan reset massal 2FA untuk seluruh pengguna ({$total} akun)");

        return redirect()->back()->with('success', "Berhasil mereset 2FA untuk seluruh {$total} akun pengguna.");
    }
}
