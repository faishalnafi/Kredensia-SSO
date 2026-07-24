<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\LogAktivitas;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class BersihkanLogAktivitas extends Command
{
    /**
     * Nama dan tanda tangan dari perintah console.
     *
     * @var string
     */
    protected $signature = 'sso:bersihkan-log {--force : Jalankan pembersihan tanpa syarat}';

    /**
     * Deskripsi perintah console.
     *
     * @var string
     */
    protected $description = 'Mengarsip log aktivitas ke berkas JSON bulanan di storage/logs/aktivitas lalu membersihkan tabel database';

    /**
     * Eksekusi perintah console.
     */
    public function handle(): int
    {
        $this->info('Memulai pengarsipan & pembersihan log aktivitas...');

        try {
            $jumlahLog = LogAktivitas::count();

            if ($jumlahLog === 0) {
                $this->info('Tabel log aktivitas sudah bersih (0 entri). Tidak ada data untuk diarsipkan.');
                return Command::SUCCESS;
            }

            // Memastikan folder storage/logs/aktivitas tersedia
            $folderArsip = storage_path('logs/aktivitas');
            if (!File::exists($folderArsip)) {
                File::makeDirectory($folderArsip, 0755, true, true);
            }

            // Penamaan berkas arsip JSON berdasarkan bulan sebelumnya/saat ini
            $bulanTarget = Carbon::now()->subMonth();
            $namaFile = 'log_aktivitas_' . $bulanTarget->format('Y_m') . '.json';
            $pathFile = $folderArsip . DIRECTORY_SEPARATOR . $namaFile;

            // Jika berkas sudah ada, tambahkan penanda timestamp unik
            if (File::exists($pathFile)) {
                $namaFile = 'log_aktivitas_' . Carbon::now()->format('Y_m_d_His') . '.json';
                $pathFile = $folderArsip . DIRECTORY_SEPARATOR . $namaFile;
            }

            // Ambil semua data log aktivitas beserta relasi pengguna
            $daftarLog = LogAktivitas::with('user:id,nama_lengkap,email')
                ->orderBy('created_at', 'asc')
                ->get()
                ->map(function ($log) {
                    return [
                        'id'         => $log->id,
                        'waktu'      => $log->created_at ? $log->created_at->toIso8601String() : null,
                        'user_id'    => $log->user_id,
                        'nama_user'  => $log->user ? $log->user->nama_lengkap : 'Tamu / Umum',
                        'email'      => $log->email,
                        'aktivitas'  => $log->aktivitas,
                        'ip_address' => $log->ip_address,
                        'user_agent' => $log->user_agent,
                    ];
                });

            // Format ke JSON dengan tampilan rapi
            $jsonContent = json_encode([
                'info' => [
                    'tanggal_arsip' => Carbon::now()->toIso8601String(),
                    'total_log'     => $jumlahLog,
                    'nama_file'     => $namaFile,
                ],
                'data' => $daftarLog,
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

            File::put($pathFile, $jsonContent);

            $this->info("Berhasil mengarsipkan {$jumlahLog} log ke {$pathFile}");

            // Hapus data dari tabel database setelah dipastikan file JSON berhasil ditulis
            LogAktivitas::truncate();

            $pesan = "Berhasil mengarsipkan {$jumlahLog} log aktivitas ke {$namaFile} dan membersihkan tabel database.";
            $this->info($pesan);
            Log::info($pesan);

            return Command::SUCCESS;
        } catch (\Throwable $e) {
            $this->error('Gagal mengarsipkan dan membersihkan log aktivitas: ' . $e->getMessage());
            Log::error('Gagal mengarsipkan log aktivitas: ' . $e->getMessage());

            return Command::FAILURE;
        }
    }
}
