<?php

declare(strict_types=1);

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\UserCorrection;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PersetujuanDataController extends Controller
{
    /**
     * Tampilkan daftar pengajuan perbaikan data yang berstatus pending.
     */
    public function indeks(): Response
    {
        $daftarKoreksi = UserCorrection::with('userAsli')
            ->where('status_correction', 'pending')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($koreksi) {
                $user = $koreksi->userAsli;
                $perubahan = [];

                if ($user) {
                    $fields = [
                        'nama_lengkap' => 'Nama Lengkap',
                        'email'        => 'Email',
                        'jk'           => 'Jenis Kelamin',
                        'tgl_lahir'    => 'Tanggal Lahir',
                        'nik'          => 'NIK',
                        'nip_nis'      => 'NIP/NISN',
                        'no_telp'      => 'No. Telepon',
                        'alamat'       => 'Alamat',
                    ];

                    foreach ($fields as $field => $label) {
                        $oldVal = $user->{$field};
                        $newVal = $koreksi->{$field};

                        // Bandingkan nilai lama dan nilai baru
                        if ($newVal !== null && $oldVal !== $newVal) {
                            // Formatting khusus untuk Jenis Kelamin
                            if ($field === 'jk') {
                                $oldVal = $oldVal === 'L' ? 'Laki-laki' : ($oldVal === 'P' ? 'Perempuan' : '-');
                                $newVal = $newVal === 'L' ? 'Laki-laki' : ($newVal === 'P' ? 'Perempuan' : '-');
                            }
                            
                            // Formatting khusus untuk Tanggal Lahir
                            if ($field === 'tgl_lahir') {
                                if ($oldVal instanceof \DateTime || $oldVal instanceof \Carbon\Carbon) {
                                    $oldVal = $oldVal->format('Y-m-d');
                                }
                                if ($newVal instanceof \DateTime || $newVal instanceof \Carbon\Carbon) {
                                    $newVal = $newVal->format('Y-m-d');
                                }
                            }

                            $perubahan[] = [
                                'kolom' => $label,
                                'lama'  => (string) ($oldVal ?: '-'),
                                'baru'  => (string) ($newVal ?: '-'),
                            ];
                        }
                    }
                }

                $koreksi->list_perubahan = $perubahan;
                return $koreksi;
            });

        return Inertia::render('Superadmin/PersetujuanData/Indeks', [
            'daftarKoreksi' => $daftarKoreksi
        ]);
    }

    /**
     * Setujui pengajuan perbaikan data.
     */
    public function setujui(string $id): RedirectResponse
    {
        $koreksi = UserCorrection::findOrFail($id);

        if ($koreksi->status_correction !== 'pending') {
            return redirect()->back()->with('error', 'Gagal: Pengajuan ini sudah ditinjau sebelumnya.');
        }

        DB::transaction(function () use ($koreksi) {
            $user = $koreksi->userAsli;

            if ($user) {
                $user->update([
                    'nama_lengkap' => $koreksi->nama_lengkap ?? $user->nama_lengkap,
                    'email'        => $koreksi->email ?? $user->email,
                    'jk'           => $koreksi->jk ?? $user->jk,
                    'tgl_lahir'    => $koreksi->tgl_lahir ?? $user->tgl_lahir,
                    'nik'          => $koreksi->nik ?? $user->nik,
                    'nip_nis'      => $koreksi->nip_nis ?? $user->nip_nis,
                    'no_telp'      => $koreksi->no_telp ?? $user->no_telp,
                    'alamat'       => $koreksi->alamat ?? $user->alamat,
                ]);
            }

            $koreksi->update([
                'status_correction' => 'approved',
                'reviewed_by'       => auth()->id(),
            ]);
        });

        // Hapus cache daftar pengguna agar perubahan ter-update instan
        Cache::forget('superadmin:daftar-pengguna');
        Cache::forget('superadmin:statistik');

        \App\Services\LayananLogAktivitas::catat('Menyetujui perbaikan data pengguna: ' . ($koreksi->nama_lengkap ?: ''));

        return redirect()->back()->with('success', 'Pengajuan perbaikan data berhasil disetujui.');
    }

    /**
     * Tolak pengajuan perbaikan data.
     */
    public function tolak(string $id): RedirectResponse
    {
        $koreksi = UserCorrection::findOrFail($id);

        if ($koreksi->status_correction !== 'pending') {
            return redirect()->back()->with('error', 'Gagal: Pengajuan ini sudah ditinjau sebelumnya.');
        }

        DB::transaction(function () use ($koreksi) {
            $koreksi->update([
                'status_correction' => 'rejected',
                'reviewed_by'       => auth()->id(),
            ]);
        });

        \App\Services\LayananLogAktivitas::catat('Menolak perbaikan data pengguna: ' . ($koreksi->nama_lengkap ?: ''));

        return redirect()->back()->with('success', 'Pengajuan perbaikan data berhasil ditolak.');
    }

    /**
     * Setujui semua pengajuan perbaikan data yang pending sekaligus.
     */
    public function setujuiSemua(): RedirectResponse
    {
        $daftarKoreksi = UserCorrection::where('status_correction', 'pending')->get();

        if ($daftarKoreksi->isEmpty()) {
            return redirect()->back()->with('error', 'Gagal: Tidak ada pengajuan perbaikan data yang tertunda.');
        }

        $totalSetujui = 0;

        DB::transaction(function () use ($daftarKoreksi, &$totalSetujui) {
            foreach ($daftarKoreksi as $koreksi) {
                $user = $koreksi->userAsli;

                if ($user) {
                    $user->update([
                        'nama_lengkap' => $koreksi->nama_lengkap ?? $user->nama_lengkap,
                        'email'        => $koreksi->email ?? $user->email,
                        'jk'           => $koreksi->jk ?? $user->jk,
                        'tgl_lahir'    => $koreksi->tgl_lahir ?? $user->tgl_lahir,
                        'nik'          => $koreksi->nik ?? $user->nik,
                        'nip_nis'      => $koreksi->nip_nis ?? $user->nip_nis,
                        'no_telp'      => $koreksi->no_telp ?? $user->no_telp,
                        'alamat'       => $koreksi->alamat ?? $user->alamat,
                    ]);
                }

                $koreksi->update([
                    'status_correction' => 'approved',
                    'reviewed_by'       => auth()->id(),
                ]);

                $totalSetujui++;
            }
        });

        // Hapus cache daftar pengguna agar perubahan ter-update instan
        Cache::forget('superadmin:daftar-pengguna');
        Cache::forget('superadmin:statistik');

        \App\Services\LayananLogAktivitas::catat("Menyetujui sekaligus ({$totalSetujui}) pengajuan perbaikan data pengguna.");

        return redirect()->back()->with('success', "Berhasil menyetujui sekaligus {$totalSetujui} pengajuan perbaikan data.");
    }
}
