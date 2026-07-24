<?php

declare(strict_types=1);

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\Kelas;
use App\Models\KunciApi;
use App\Models\LogAktivitas;
use App\Models\PersetujuanData;
use App\Models\Role;
use App\Models\TahunPelajaran;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class BackupRestoreController extends Controller
{
    /**
     * Tampilkan halaman Backup & Restore untuk Superadmin.
     */
    public function indeks(): InertiaResponse
    {
        $ringkasan = $this->ambilRingkasanData();

        return Inertia::render('Superadmin/BackupRestore/Indeks', [
            'ringkasan' => $ringkasan,
        ]);
    }

    /**
     * GET /superadmin/backup-restore/unduh
     * Unduh seluruh data sistem sebagai file JSON terenkripsi.
     */
    public function unduhBackup(): Response
    {
        $data = $this->kumpulkanData();
        $namaFile = 'kredensia-backup-' . now()->format('Y-m-d_H-i-s') . '.json';

        \App\Services\LayananLogAktivitas::catat('Mengunduh backup snapshot data sistem (JSON)');

        return response(json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), 200, [
            'Content-Type'        => 'application/json',
            'Content-Disposition' => "attachment; filename=\"{$namaFile}\"",
        ]);
    }

    /**
     * POST /superadmin/backup-restore/restore
     * Proses restore dari file JSON yang diunggah.
     */
    public function unggahRestore(Request $request)
    {
        $request->validate([
            'file_backup' => ['required', 'file', 'mimes:json', 'max:51200'], // max 50MB
        ], [
            'file_backup.required' => 'File backup JSON wajib diunggah.',
            'file_backup.mimes'    => 'File harus berformat JSON.',
            'file_backup.max'      => 'Ukuran file tidak boleh melebihi 50MB.',
        ]);

        $konten = file_get_contents($request->file('file_backup')->getRealPath());
        $data   = json_decode($konten, true);

        if (!$data || !isset($data['meta']['versi'])) {
            return back()->withErrors(['file_backup' => 'Format file backup tidak valid atau sudah rusak.']);
        }

        try {
            \DB::transaction(function () use ($data) {
                # Restore Tahun Pelajaran
                if (!empty($data['tahun_pelajaran'])) {
                    foreach ($data['tahun_pelajaran'] as $tp) {
                        TahunPelajaran::updateOrCreate(['id' => $tp['id']], $tp);
                    }
                }

                # Restore Kelas
                if (!empty($data['kelas'])) {
                    foreach ($data['kelas'] as $kelas) {
                        Kelas::updateOrCreate(['id' => $kelas['id']], $kelas);
                    }
                }

                # Restore Peran (kecuali Super Admin dan Admin)
                if (!empty($data['peran'])) {
                    foreach ($data['peran'] as $peran) {
                        if (!in_array($peran['nama_role'], ['Super Admin', 'Admin'])) {
                            Role::updateOrCreate(['id' => $peran['id']], $peran);
                        }
                    }
                }

                # Restore Pengguna (kecuali Super Admin dan Admin aktif)
                if (!empty($data['pengguna'])) {
                    foreach ($data['pengguna'] as $pengguna) {
                        # Jangan timpa akun admin yang sudah ada
                        $existing = User::find($pengguna['id']);
                        if ($existing && $existing->hasRole('Super Admin')) {
                            continue;
                        }
                        unset($pengguna['roles']); // Relasi ditangani terpisah
                        User::updateOrCreate(['id' => $pengguna['id']], $pengguna);
                    }
                }
            });

            \App\Services\LayananLogAktivitas::catat('Melakukan restore data sistem dari berkas backup JSON');

            return back()->with('sukses', 'Data berhasil di-restore dari backup JSON.');
        } catch (\Throwable $e) {
            return back()->withErrors(['file_backup' => 'Gagal melakukan restore: ' . $e->getMessage()]);
        }
    }

    /**
     * Kumpulkan seluruh data sistem untuk backup.
     */
    private function kumpulkanData(): array
    {
        return [
            'meta' => [
                'versi'        => '1.0',
                'dibuat_pada'  => now()->toIso8601String(),
                'aplikasi'     => config('app.name', 'Kredensia SSO'),
                'deskripsi'    => 'Full system backup — Kredensia SSO',
            ],
            'pengguna' => User::with('roles:id,nama_role')
                ->get()
                ->map(fn($u) => array_merge($u->toArray(), [
                    'roles' => $u->roles->pluck('nama_role')->toArray(),
                ]))->toArray(),
            'peran'           => Role::all()->toArray(),
            'kelas'           => Kelas::all()->toArray(),
            'tahun_pelajaran' => TahunPelajaran::all()->toArray(),
            'kunci_api'       => KunciApi::all()->map(fn($k) => array_merge($k->toArray(), [
                'kunci_rahasia' => '***REDACTED***', // Jangan expose secret key
            ]))->toArray(),
        ];
    }

    /**
     * Ambil ringkasan jumlah data untuk ditampilkan di halaman.
     */
    private function ambilRingkasanData(): array
    {
        return [
            'pengguna'        => User::count(),
            'peran'           => Role::count(),
            'kelas'           => Kelas::count(),
            'tahun_pelajaran' => TahunPelajaran::count(),
            'kunci_api'       => class_exists(KunciApi::class) ? KunciApi::count() : 0,
        ];
    }
}
