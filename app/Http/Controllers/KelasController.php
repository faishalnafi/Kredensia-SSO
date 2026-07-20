<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\SimpanKelasRequest;
use App\Models\Kelas;
use App\Models\TahunPelajaran;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class KelasController extends Controller
{
    /**
     * Tampilkan daftar kelas.
     */
    public function index(): Response
    {
        // Ambil daftar kelas lengkap dengan relasi tahun pelajaran dan wali kelas
        $daftarKelas = Kelas::with(['tahunPelajaran', 'waliKelas'])
            ->orderBy('tingkat', 'asc')
            ->orderBy('nama_kelas', 'asc')
            ->get();

        // Ambil daftar tahun pelajaran untuk form dropdown
        $daftarTahunPelajaran = TahunPelajaran::orderBy('tahun_mulai', 'desc')
            ->orderBy('semester', 'desc')
            ->get();

        // Ambil daftar pengguna ber-role 'Guru' untuk form wali kelas
        $daftarGuru = User::whereHas('roles', function ($query) {
            $query->where('nama_role', 'Guru');
        })
        ->orderBy('nama_lengkap', 'asc')
        ->get();

        return Inertia::render('Kelas/Indeks', [
            'daftarKelas' => $daftarKelas,
            'daftarTahunPelajaran' => $daftarTahunPelajaran,
            'daftarGuru' => $daftarGuru,
        ]);
    }

    /**
     * Simpan kelas baru ke database.
     */
    public function store(SimpanKelasRequest $request): RedirectResponse
    {
        Kelas::create([
            'nama_kelas' => $request->nama_kelas,
            'tingkat' => $request->tingkat,
            'tahun_pelajaran_id' => $request->tahun_pelajaran_id,
            'wali_kelas_id' => $request->wali_kelas_id,
        ]);

        \App\Services\LayananLogAktivitas::catat('Menambahkan kelas baru: ' . $request->nama_kelas . ' (Tingkat ' . $request->tingkat . ')');

        return redirect()->back()->with('success', 'Kelas baru berhasil ditambahkan.');
    }

    /**
     * Perbarui data kelas.
     */
    public function update(SimpanKelasRequest $request, Kelas $kelas): RedirectResponse
    {
        $namaLama = $kelas->nama_kelas;
        $kelas->update([
            'nama_kelas' => $request->nama_kelas,
            'tingkat' => $request->tingkat,
            'tahun_pelajaran_id' => $request->tahun_pelajaran_id,
            'wali_kelas_id' => $request->wali_kelas_id,
        ]);

        \App\Services\LayananLogAktivitas::catat('Memperbarui data kelas: ' . $namaLama . ' -> ' . $request->nama_kelas . ' (Tingkat ' . $request->tingkat . ')');

        return redirect()->back()->with('success', 'Data kelas berhasil diperbarui.');
    }

    /**
     * Hapus data kelas dari database.
     */
    public function destroy(Kelas $kelas): RedirectResponse
    {
        $namaKelas = $kelas->nama_kelas;
        $kelas->delete();

        \App\Services\LayananLogAktivitas::catat('Menghapus kelas: ' . $namaKelas);

        return redirect()->back()->with('success', 'Kelas berhasil dihapus.');
    }
}
