<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\LogAktivitas;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class BersihkanLogAktivitas extends Command
{
    /**
     * Nama dan tanda tangan dari perintah console.
     *
     * @var string
     */
    protected $signature = 'sso:bersihkan-log';

    /**
     * Deskripsi perintah console.
     *
     * @var string
     */
    protected $description = 'Membersihkan seluruh log aktivitas sistem di database';

    /**
     * Eksekusi perintah console.
     */
    public function handle(): int
    {
        $this->info('Memulai pembersihan log aktivitas...');

        try {
            // Ambil jumlah log sebelum dihapus untuk pencatatan
            $jumlahLog = LogAktivitas::count();

            // Lakukan pembersihan (truncate)
            LogAktivitas::truncate();

            $pesan = "Berhasil membersihkan {$jumlahLog} log aktivitas sistem.";
            $this->info($pesan);
            
            // Catat ke log file Laravel sebagai audit trail pembersihan bulanan
            Log::info($pesan);

            return Command::SUCCESS;
        } catch (\Throwable $e) {
            $this->error('Gagal membersihkan log aktivitas: ' . $e->getMessage());
            Log::error('Gagal membersihkan log aktivitas: ' . $e->getMessage());
            
            return Command::FAILURE;
        }
    }
}
