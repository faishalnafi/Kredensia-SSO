<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\SimpanTahunPelajaranRequest;
use App\Models\TahunPelajaran;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class TahunPelajaranController extends Controller
{
    /**
     * Tampilkan daftar tahun pelajaran.
     */
    public function index(): Response
    {
        $daftarTahunPelajaran = TahunPelajaran::orderBy('tahun_mulai', 'desc')
            ->orderBy('semester', 'desc')
            ->get();

        return Inertia::render('TahunPelajaran/Indeks', [
            'daftarTahunPelajaran' => $daftarTahunPelajaran,
        ]);
    }

    /**
     * Simpan tahun pelajaran baru ke database.
     */
    public function store(SimpanTahunPelajaranRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            $isAktif = $request->boolean('is_aktif');

            if ($isAktif) {
                // Nonaktifkan semua tahun pelajaran lain terlebih dahulu
                TahunPelajaran::query()->update(['is_aktif' => false]);
            }

            TahunPelajaran::create([
                'tahun_mulai' => $request->tahun_mulai,
                'tahun_selesai' => $request->tahun_selesai,
                'semester' => $request->semester,
                'is_aktif' => $isAktif,
            ]);
        });

        \App\Services\LayananLogAktivitas::catat('Menambahkan tahun pelajaran baru: ' . $request->tahun_mulai . '/' . $request->tahun_selesai . ' - ' . $request->semester);

        return redirect()->back()->with('success', 'Tahun pelajaran baru berhasil ditambahkan.');
    }

    /**
     * Perbarui data tahun pelajaran.
     */
    public function update(SimpanTahunPelajaranRequest $request, TahunPelajaran $tahunPelajaran): RedirectResponse
    {
        DB::transaction(function () use ($request, $tahunPelajaran) {
            $isAktif = $request->boolean('is_aktif');

            if ($isAktif) {
                // Nonaktifkan semua tahun pelajaran lain terlebih dahulu
                TahunPelajaran::query()->where('id', '!=', $tahunPelajaran->id)->update(['is_aktif' => false]);
            }

            $tahunPelajaran->update([
                'tahun_mulai' => $request->tahun_mulai,
                'tahun_selesai' => $request->tahun_selesai,
                'semester' => $request->semester,
                'is_aktif' => $isAktif,
            ]);
        });

        \App\Services\LayananLogAktivitas::catat('Memperbarui tahun pelajaran: ' . $tahunPelajaran->tahun_mulai . '/' . $tahunPelajaran->tahun_selesai . ' - ' . $tahunPelajaran->semester);

        return redirect()->back()->with('success', 'Tahun pelajaran berhasil diperbarui.');
    }

    /**
     * Hapus data tahun pelajaran.
     */
    public function destroy(TahunPelajaran $tahunPelajaran): RedirectResponse
    {
        $label = $tahunPelajaran->tahun_mulai . '/' . $tahunPelajaran->tahun_selesai . ' - ' . $tahunPelajaran->semester;
        $tahunPelajaran->delete();

        \App\Services\LayananLogAktivitas::catat('Menghapus tahun pelajaran: ' . $label);

        return redirect()->back()->with('success', 'Tahun pelajaran berhasil dihapus.');
    }

    /**
     * Jadikan tahun pelajaran ini aktif secara manual.
     */
    public function setAktif(TahunPelajaran $tahunPelajaran): RedirectResponse
    {
        DB::transaction(function () use ($tahunPelajaran) {
            TahunPelajaran::query()->update(['is_aktif' => false]);
            $tahunPelajaran->update(['is_aktif' => true]);
        });

        \App\Services\LayananLogAktivitas::catat('Mengaktifkan tahun pelajaran: ' . $tahunPelajaran->tahun_mulai . '/' . $tahunPelajaran->tahun_selesai . ' - ' . $tahunPelajaran->semester);

        return redirect()->back()->with('success', "Tahun pelajaran {$tahunPelajaran->label} sekarang menjadi aktif.");
    }
}
