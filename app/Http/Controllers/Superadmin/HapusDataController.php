<?php

declare(strict_types=1);

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\Kelas;
use App\Models\KunciApi;
use App\Models\Role;
use App\Models\TahunPelajaran;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

class HapusDataController extends Controller
{
    /**
     * Tampilkan halaman Hapus Data Keseluruhan (Superadmin).
     */
    public function indeks(): InertiaResponse
    {
        return Inertia::render('Superadmin/HapusData/Indeks', [
            'ringkasan' => $this->ambilRingkasan(),
            'peranAdmin' => ['Super Admin', 'Admin'],
        ]);
    }

    /**
     * GET /superadmin/hapus-data/unduh-backup
     * Unduh snapshot JSON sebelum menghapus data (dipanggil dari SweetAlert).
     */
    public function unduhBackup(): Response
    {
        $data      = $this->kumpulkanDataUntukHapus();
        $namaFile  = 'kredensia-pra-hapus-' . now()->format('Y-m-d_H-i-s') . '.json';

        return response(json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), 200, [
            'Content-Type'        => 'application/json',
            'Content-Disposition' => "attachment; filename=\"{$namaFile}\"",
        ]);
    }

    /**
     * DELETE /superadmin/hapus-data
     * Eksekusi penghapusan seluruh data non-admin.
     */
    public function prosesHapus(Request $request)
    {
        $request->validate([
            'konfirmasi' => ['required', 'string', 'in:HAPUS SEMUA DATA'],
        ], [
            'konfirmasi.in' => 'Teks konfirmasi tidak cocok. Ketik tepat: HAPUS SEMUA DATA',
        ]);

        try {
            \DB::transaction(function () {
                # Null-kan kelas_id pengguna (agar FK tidak error)
                User::whereNotNull('kelas_id')->update(['kelas_id' => null]);

                # Hapus data kelas
                Kelas::query()->delete();

                # Hapus data tahun pelajaran
                TahunPelajaran::query()->delete();

                # Hapus pengguna NON-admin (Super Admin & Admin tetap aman)
                $idAdmin = User::whereHas('roles', function ($q) {
                    $q->whereIn('nama_role', ['Super Admin', 'Admin']);
                })->pluck('id');

                User::whereNotIn('id', $idAdmin)->delete();

                # Hapus peran non-sistem
                Role::whereNotIn('nama_role', ['Super Admin', 'Admin'])->delete();
            });

            \App\Services\LayananLogAktivitas::catat('Melakukan penghapusan/reset seluruh data sistem (kecuali admin & superadmin)');

            return redirect()->back()->with('sukses', 'Seluruh data berhasil dihapus. Sistem telah direset ke kondisi awal.');
        } catch (\Throwable $e) {
            return redirect()->back()->withErrors(['hapus' => 'Gagal menghapus data: ' . $e->getMessage()]);
        }
    }

    /**
     * Kumpulkan data non-admin yang akan dihapus (untuk snapshot JSON).
     */
    private function kumpulkanDataUntukHapus(): array
    {
        $idAdmin = User::whereHas('roles', function ($q) {
            $q->whereIn('nama_role', ['Super Admin', 'Admin']);
        })->pluck('id')->toArray();

        return [
            'meta' => [
                'versi'       => '1.0',
                'dibuat_pada' => now()->toIso8601String(),
                'aplikasi'    => config('app.name', 'Kredensia SSO'),
                'tipe'        => 'pra-hapus-keseluruhan',
                'peringatan'  => 'File ini adalah backup otomatis sebelum penghapusan data. Simpan baik-baik!',
            ],
            'pengguna' => User::with('roles:id,nama_role')
                ->whereNotIn('id', $idAdmin)
                ->get()
                ->map(fn($u) => array_merge($u->toArray(), [
                    'roles' => $u->roles->pluck('nama_role')->toArray(),
                ]))->toArray(),
            'kelas'           => Kelas::all()->toArray(),
            'tahun_pelajaran' => TahunPelajaran::all()->toArray(),
            'peran'           => Role::whereNotIn('nama_role', ['Super Admin', 'Admin'])->get()->toArray(),
        ];
    }

    /**
     * Ringkasan data yang akan terdampak oleh penghapusan.
     */
    private function ambilRingkasan(): array
    {
        $idAdmin = User::whereHas('roles', function ($q) {
            $q->whereIn('nama_role', ['Super Admin', 'Admin']);
        })->pluck('id');

        return [
            'pengguna_terdampak' => User::whereNotIn('id', $idAdmin)->count(),
            'kelas'              => Kelas::count(),
            'tahun_pelajaran'    => TahunPelajaran::count(),
            'peran_terdampak'    => Role::whereNotIn('nama_role', ['Super Admin', 'Admin'])->count(),
            'pengguna_aman'      => $idAdmin->count(), // yang tidak akan dihapus
        ];
    }
}
