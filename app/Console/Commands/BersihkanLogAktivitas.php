<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\LayananLogAktivitas;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class BersihkanLogAktivitas extends Command
{
    /**
     * Nama dan tanda tangan dari perintah console.
     *
     * @var string
     */
    protected $signature = 'sso:bersihkan-log {--force : Jalankan pembersihan seluruh log tanpa syarat}';

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
        $force = (bool) $this->option('force');
        $this->info($force 
            ? 'Memulai pengarsipan manual seluruh log aktivitas...' 
            : 'Memulai pengarsipan otomatis log aktivitas bulan sebelumnya (tanggal 1)...');

        try {
            $hasil = LayananLogAktivitas::arsipkanLogBulanan($force);

            if (empty($hasil)) {
                $this->info('Tabel log aktivitas sudah bersih / tidak ada data periode sebelumnya yang perlu diarsipkan.');
                return Command::SUCCESS;
            }

            foreach ($hasil as $item) {
                $this->info("Berhasil mengarsipkan {$item['total']} log ke berkas: {$item['file']}");
            }

            $totalSemua = array_sum(array_column($hasil, 'total'));
            $pesan = "Berhasil mengarsipkan total {$totalSemua} log aktivitas ke berkas JSON dan membersihkan tabel database.";
            $this->info($pesan);
            Log::info("Command sso:bersihkan-log: " . $pesan);

            return Command::SUCCESS;
        } catch (\Throwable $e) {
            $this->error('Gagal mengarsipkan dan membersihkan log aktivitas: ' . $e->getMessage());
            Log::error('Command sso:bersihkan-log error: ' . $e->getMessage());

            return Command::FAILURE;
        }
    }
}
