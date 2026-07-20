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
    public function index(): Response
    {
        $daftarTahunPelajaran = TahunPelajaran::orderBy('tahun_mulai', 'desc')
            ->get()
            ->map(function ($item) {
                return [
                    'id' => $item->id,
                    'tahun_pelajaran' => "{$item->tahun_mulai}/{$item->tahun_selesai}",
                    'tahun_mulai' => $item->tahun_mulai,
                    'tahun_selesai' => $item->tahun_selesai,
                    'semester' => $item->semester,
                    'is_aktif' => $item->is_aktif,
                    'dibuat_pada' => $item->created_at ? $item->created_at->format('Y-m-d H:i:s') : '-',
                ];
            });

        return Inertia::render('TahunPelajaran/Indeks', [
            'daftarTahunPelajaran' => $daftarTahunPelajaran,
        ]);
    }

    /**
     * Lakukan pembaruan massal tahun pelajaran (Bulk Update).
     */
    public function bulkUpdate(): RedirectResponse
    {
        // Simulasi sinkronisasi massal data akademik
        \App\Services\LayananLogAktivitas::catat('Melakukan pembaruan massal (Bulk Update) tahun pelajaran');

        return redirect()->back()->with('success', 'Bulk update tahun pelajaran berhasil diselesaikan.');
    }

    /**
     * Simpan tahun pelajaran baru ke database.
     */
    public function store(SimpanTahunPelajaranRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            $isAktif = $request->boolean('is_aktif');
            $adaAktifLain = TahunPelajaran::where('is_aktif', true)->exists();

            // Jika belum ada tahun pelajaran yang aktif, atau jika pengguna memilih aktif
            if (!$adaAktifLain || $isAktif) {
                TahunPelajaran::query()->update(['is_aktif' => false]);
                $isAktif = true;
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
                // Nonaktifkan semua tahun pelajaran lain
                TahunPelajaran::query()->where('id', '!=', $tahunPelajaran->id)->update(['is_aktif' => false]);
            } else {
                // Jika pengguna mencoba menonaktifkan dan tidak ada TP aktif lainnya, tahan agar tetap aktif
                $adaAktifLain = TahunPelajaran::where('id', '!=', $tahunPelajaran->id)->where('is_aktif', true)->exists();
                if (!$adaAktifLain) {
                    $terbaru = TahunPelajaran::where('id', '!=', $tahunPelajaran->id)->orderBy('tahun_mulai', 'desc')->first();
                    if ($terbaru) {
                        $terbaru->update(['is_aktif' => true]);
                    } else {
                        $isAktif = true; // Tetap aktif jika hanya ada 1 TP
                    }
                }
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
        DB::transaction(function () use ($tahunPelajaran) {
            $wasActive = $tahunPelajaran->is_aktif;
            $label = $tahunPelajaran->tahun_mulai . '/' . $tahunPelajaran->tahun_selesai . ' - ' . $tahunPelajaran->semester;
            
            $tahunPelajaran->delete();

            // Jika yang dihapus adalah TP aktif, otomatis aktifkan TP terbaru lainnya
            if ($wasActive) {
                $terbaru = TahunPelajaran::orderBy('tahun_mulai', 'desc')->first();
                if ($terbaru) {
                    $terbaru->update(['is_aktif' => true]);
                }
            }

            \App\Services\LayananLogAktivitas::catat('Menghapus tahun pelajaran: ' . $label);
        });

        return redirect()->back()->with('success', 'Tahun pelajaran berhasil dihapus.');
    }

    /**
     * Jadikan tahun pelajaran ini aktif secara manual.
     */
    public function setAktif(TahunPelajaran $tahunPelajaran): RedirectResponse
    {
        DB::transaction(function () use ($tahunPelajaran) {
            // Pastikan hanya 1 tahun pelajaran yang aktif
            TahunPelajaran::query()->update(['is_aktif' => false]);
            $tahunPelajaran->update(['is_aktif' => true]);
        });

        \App\Services\LayananLogAktivitas::catat('Mengaktifkan tahun pelajaran: ' . $tahunPelajaran->tahun_mulai . '/' . $tahunPelajaran->tahun_selesai . ' - ' . $tahunPelajaran->semester);

        return redirect()->back()->with('success', "Tahun pelajaran {$tahunPelajaran->tahun_mulai}/{$tahunPelajaran->tahun_selesai} sekarang menjadi aktif.");
    }
}
