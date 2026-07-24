<?php

declare(strict_types=1);

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\LogAktivitas;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Inertia\Inertia;
use Inertia\Response;
use Carbon\Carbon;

class LogAktivitasController extends Controller
{
    /**
     * Tampilkan riwayat log aktivitas pengguna beserta daftar arsip bulanan.
     */
    public function indeks(Request $request): Response
    {
        $query = LogAktivitas::with('user:id,nama_lengkap,email')
            ->orderBy('created_at', 'desc');

        // Filter pencarian
        if ($request->filled('cari')) {
            $cari = $request->cari;
            $query->where(function ($q) use ($cari) {
                $q->where('aktivitas', 'like', "%{$cari}%")
                  ->orWhere('email', 'like', "%{$cari}%")
                  ->orWhere('ip_address', 'like', "%{$cari}%")
                  ->orWhereHas('user', function ($userQuery) use ($cari) {
                      $userQuery->where('nama_lengkap', 'like', "%{$cari}%");
                  });
            });
        }

        // Paginasi dengan query parameter tetap dipertahankan
        $daftarLog = $query->paginate(15)->withQueryString();

        // Ambil daftar file arsip JSON dari folder storage/logs/aktivitas
        $folderArsip = storage_path('logs/aktivitas');
        $daftarArsip = [];

        if (File::exists($folderArsip)) {
            $files = File::files($folderArsip);
            rsort($files); // Urutkan dari file terbaru

            foreach ($files as $file) {
                if ($file->getExtension() === 'json') {
                    $namaFile = $file->getFilename();
                    $ukuranBytes = $file->getSize();

                    // Format ukuran berkas
                    if ($ukuranBytes >= 1048576) {
                        $ukuranFormatted = number_format($ukuranBytes / 1048576, 2) . ' MB';
                    } elseif ($ukuranBytes >= 1024) {
                        $ukuranFormatted = number_format($ukuranBytes / 1024, 2) . ' KB';
                    } else {
                        $ukuranFormatted = $ukuranBytes . ' B';
                    }

                    // Ekstrak label bulan dari nama file (log_aktivitas_YYYY_MM.json)
                    $label = $namaFile;
                    if (preg_match('/log_aktivitas_(\d{4})_(\d{2})\.json/', $namaFile, $matches)) {
                        $tahun = $matches[1];
                        $bulan = (int)$matches[2];
                        $namaBulan = Carbon::createFromDate((int)$tahun, $bulan, 1)->locale('id')->translatedFormat('F Y');
                        $label = "Log " . ucfirst($namaBulan);
                    } else {
                        $label = str_replace(['log_aktivitas_', '.json', '_'], ['', '', ' '], $namaFile);
                    }

                    $daftarArsip[] = [
                        'nama_file'     => $namaFile,
                        'label'         => $label,
                        'ukuran'        => $ukuranFormatted,
                        'tanggal_dibuat' => date('d M Y H:i', $file->getMTime()),
                    ];
                }
            }
        }

        return Inertia::render('Superadmin/LogAktivitas/Indeks', [
            'daftarLog'   => $daftarLog,
            'daftarArsip' => $daftarArsip,
            'filters'     => $request->only(['cari'])
        ]);
    }

    /**
     * Jalankan proses pengarsipan manual log aktivitas ke berkas JSON.
     */
    public function arsipSekarang(Request $request): RedirectResponse
    {
        $jumlahLog = LogAktivitas::count();
        if ($jumlahLog === 0) {
            return redirect()->back()->with('error', 'Gagal: Tabel log aktivitas saat ini kosong.');
        }

        Artisan::call('sso:bersihkan-log');

        \App\Services\LayananLogAktivitas::catat('Melakukan pengarsipan manual log aktivitas ke berkas JSON');

        return redirect()->back()->with('success', 'Berhasil mengarsipkan log aktivitas ke berkas JSON dan membersihkan tabel database.');
    }

    /**
     * Unduh berkas arsip log JSON berdasarkan nama berkas.
     */
    public function unduhArsip(string $namaFile): BinaryFileResponse|RedirectResponse
    {
        // Bersihkan nama file dari traversal path (keamanan)
        $namaFileSanitized = basename($namaFile);
        $pathFile = storage_path('logs/aktivitas' . DIRECTORY_SEPARATOR . $namaFileSanitized);

        if (!File::exists($pathFile)) {
            return redirect()->back()->with('error', 'Berkas arsip log tidak ditemukan.');
        }

        return response()->download($pathFile, $namaFileSanitized, [
            'Content-Type' => 'application/json',
        ]);
    }
}
