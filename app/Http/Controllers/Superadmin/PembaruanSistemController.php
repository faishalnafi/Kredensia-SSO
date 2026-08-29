<?php

declare(strict_types=1);

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use App\Services\LayananLogAktivitas;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class PembaruanSistemController extends Controller
{
    /**
     * Tampilkan halaman manajemen pembaruan sistem via unggah berkas ZIP.
     */
    public function indeks(): Response
    {
        clearstatcache(true);
        $versiSekarang = '1.2.0';
        $versionJsonPath = base_path('version.json');
        if (File::exists($versionJsonPath)) {
            $dataVersion = json_decode(File::get($versionJsonPath), true);
            if (isset($dataVersion['version'])) {
                $versiSekarang = $dataVersion['version'];
            }
        }

        // Informasi Lingkungan Server & Kapasitas
        $infoServer = [
            'versi_php'           => PHP_VERSION,
            'sistem_operasi'      => PHP_OS_FAMILY,
            'max_upload_size'     => ini_get('upload_max_filesize'),
            'post_max_size'       => ini_get('post_max_size'),
            'sisa_ruang_disk'     => $this->formatUkuranBerkas((int) @disk_free_space(base_path())),
            'dukungan_zip_native' => class_exists(\ZipArchive::class),
        ];

        // Riwayat Log Pembaruan dari Audit Trail
        $riwayatPembaruan = \App\Models\LogAktivitas::with('user')
            ->where(function ($q) {
                $q->where('aktivitas', 'like', '%pembaruan%')
                  ->orWhere('aktivitas', 'like', '%update%');
            })
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        return Inertia::render('Superadmin/PembaruanSistem/Indeks', [
            'versiSekarang'    => $versiSekarang,
            'infoServer'       => $infoServer,
            'riwayatPembaruan' => $riwayatPembaruan,
        ]);
    }

    /**
     * Bersihkan seluruh cache sistem dan reset PHP OPcache.
     */
    public function bersihkanCache(): RedirectResponse
    {
        try {
            Artisan::call('optimize:clear');
            Artisan::call('config:clear');
            Artisan::call('cache:clear');
            Artisan::call('route:clear');
            Artisan::call('view:clear');

            if (function_exists('opcache_reset')) {
                @opcache_reset();
            }

            LayananLogAktivitas::catat('Membersihkan seluruh cache sistem & OPCache');

            return redirect()->back()->with('success', 'Berhasil membersihkan seluruh cache sistem dan OPCache PHP!');
        } catch (\Throwable $e) {
            return redirect()->back()->with('error', 'Gagal membersihkan cache: ' . $e->getMessage());
        }
    }

    /**
     * Proses pengunggahan dan ekstraksi paket zip pembaruan aplikasi.
     */
    public function prosesPembaruan(Request $request): RedirectResponse
    {
        $request->validate([
            'berkas_zip' => ['required', 'file', 'mimes:zip', 'max:102400'], // Maksimal 100MB
        ], [
            'berkas_zip.required' => 'Wajib memilih berkas paket pembaruan (.zip).',
            'berkas_zip.mimes'    => 'Berkas harus berformat kompresi .zip.',
            'berkas_zip.max'      => 'Ukuran berkas pembaruan tidak boleh melebihi 100MB.',
        ]);

        $file = $request->file('berkas_zip');
        $namaTersimpan = 'update_' . date('Ymd_His') . '_' . Str::random(8) . '.zip';
        $pathFolderUpdates = storage_path('app/updates');

        if (!File::exists($pathFolderUpdates)) {
            File::makeDirectory($pathFolderUpdates, 0755, true, true);
        }

        $fullPathZip = $file->storeAs('updates', $namaTersimpan);
        $absolutePathZip = storage_path('app/' . $fullPathZip);

        // Path folder ekstraksi temporer
        $folderEkstraksi = $pathFolderUpdates . '/temp_' . time();
        File::makeDirectory($folderEkstraksi, 0755, true, true);

        try {
            // Ekstraksi Berkas ZIP (Lintas Platform: ZipArchive / PowerShell / Unzip)
            $berhasilEkstrak = $this->ekstrakZip($absolutePathZip, $folderEkstraksi);

            if (!$berhasilEkstrak) {
                File::deleteDirectory($folderEkstraksi);
                @unlink($absolutePathZip);
                return redirect()->back()->with('error', 'Gagal mengekstrak berkas ZIP. Pastikan berkas ZIP tidak rusak.');
            }

            // Deteksi otomatis jika ZIP berisi folder pembungkus tunggal (Root Wrapper Folder)
            $sourceDir = $folderEkstraksi;
            $itemsInTemp = File::directories($folderEkstraksi);
            $filesInTemp = File::files($folderEkstraksi);
            if (count($itemsInTemp) === 1 && count($filesInTemp) === 0) {
                $sourceDir = $itemsInTemp[0];
            }

            // Baca Manifest versi jika tersedia
            $versiBaru = '1.2.2';
            $manifestPath = $sourceDir . '/version.json';
            if (File::exists($manifestPath)) {
                $manifest = json_decode(File::get($manifestPath), true);
                if (isset($manifest['version'])) {
                    $versiBaru = $manifest['version'];
                }
            }

            // Salin berkas ke root aplikasi (base_path()), lindungi berkas sensitif (.env, storage, db sqlite)
            $this->salinPembaruanKeRoot($sourceDir, base_path());

            // Salin secara paksa version.json jika ada di paket zip
            if (File::exists($manifestPath)) {
                @File::copy($manifestPath, base_path('version.json'));
            }

            clearstatcache(true);

            // Reset OPCache PHP jika aktif di server produksi
            if (function_exists('opcache_reset')) {
                @opcache_reset();
            }
            if (function_exists('opcache_invalidate')) {
                @opcache_invalidate(base_path('version.json'), true);
            }

            // Jalankan migrasi database & bersihkan cache otomatis
            try {
                Artisan::call('migrate', ['--force' => true]);
                Artisan::call('optimize:clear');
            } catch (\Throwable $e) {
                Log::warning('Peringatan perintah artisan saat pembaruan: ' . $e->getMessage());
            }

            // Catat Log Aktivitas Audit Trail secara instan
            LayananLogAktivitas::catat('Melakukan pembaruan sistem via berkas ZIP (' . $file->getClientOriginalName() . ') ke versi ' . $versiBaru);

            // Bersihkan folder temporer ekstraksi & berkas zip
            File::deleteDirectory($folderEkstraksi);
            @unlink($absolutePathZip);

            return redirect()->route('superadmin.pembaruan.indeks')
                ->with('success', 'Sistem berhasil diperbarui ke versi ' . $versiBaru . '! Seluruh cache, OPCache, dan migrasi telah disinkronkan.');

        } catch (\Throwable $e) {
            Log::error('Pembaruan Sistem Gagal: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);

            if (File::exists($folderEkstraksi)) {
                File::deleteDirectory($folderEkstraksi);
            }
            if (File::exists($absolutePathZip)) {
                @unlink($absolutePathZip);
            }

            return redirect()->back()->with('error', 'Gagal memproses pembaruan sistem: ' . $e->getMessage());
        }
    }

    /**
     * Ekstrak file ZIP dengan ZipArchive, PharData, PowerShell, atau unzip fallback.
     */
    private function ekstrakZip(string $zipPath, string $destinationPath): bool
    {
        // 1. ZipArchive (PHP extension)
        if (class_exists(\ZipArchive::class)) {
            try {
                $zip = new \ZipArchive();
                if ($zip->open($zipPath) === true) {
                    $zip->extractTo($destinationPath);
                    $zip->close();
                    return true;
                }
            } catch (\Throwable $e) {
                Log::warning('ZipArchive extract exception: ' . $e->getMessage());
            }
        }

        // 2. PharData (PHP Core built-in class, tanpa eksekusi shell/exec)
        try {
            if (class_exists(\PharData::class)) {
                $phar = new \PharData($zipPath);
                $phar->extractTo($destinationPath, null, true);
                return true;
            }
        } catch (\Throwable $e) {
            Log::warning('PharData extract exception: ' . $e->getMessage());
        }

        // 3. Fallback Native Windows PowerShell Expand-Archive
        if (PHP_OS_FAMILY === 'Windows' && function_exists('exec')) {
            $cmd = 'powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Path ' . escapeshellarg($zipPath) . ' -DestinationPath ' . escapeshellarg($destinationPath) . ' -Force"';
            @exec($cmd, $output, $returnVar);
            if (isset($returnVar) && $returnVar === 0) {
                return true;
            }
        }

        // 4. Fallback Linux unzip command
        if (function_exists('exec')) {
            $cmd = 'unzip -o ' . escapeshellarg($zipPath) . ' -d ' . escapeshellarg($destinationPath);
            @exec($cmd, $output, $returnVar);
            if (isset($returnVar) && $returnVar === 0) {
                return true;
            }
        }

        return false;
    }

    /**
     * Salin berkas hasil ekstraksi ke root aplikasi dengan pemblokiran berkas terproteksi dan paksa timpa (force overwrite).
     */
    private function salinPembaruanKeRoot(string $source, string $target): void
    {
        $diabaikan = [
            '.env',
            'storage',
            'database/database.sqlite',
            '.git',
            'node_modules',
            'vendor',
        ];

        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($source, \RecursiveDirectoryIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::SELF_FIRST
        );

        foreach ($files as $item) {
            $relativePath = substr($item->getPathname(), strlen($source) + 1);
            $relativePathNormalized = str_replace('\\', '/', $relativePath);

            // Cek apakah berkas/folder berada di daftar diabaikan
            $abaikan = false;
            foreach ($diabaikan as $pattern) {
                if ($relativePathNormalized === $pattern || str_starts_with($relativePathNormalized, $pattern . '/')) {
                    $abaikan = true;
                    break;
                }
            }

            if ($abaikan) {
                continue;
            }

            $targetPath = $target . DIRECTORY_SEPARATOR . $relativePath;

            if ($item->isDir()) {
                if (!File::exists($targetPath)) {
                    File::makeDirectory($targetPath, 0755, true, true);
                }
            } else {
                $targetDir = dirname($targetPath);
                if (!File::exists($targetDir)) {
                    File::makeDirectory($targetDir, 0755, true, true);
                }
                if (File::exists($targetPath)) {
                    @chmod($targetPath, 0666);
                    @unlink($targetPath);
                }
                copy($item->getPathname(), $targetPath);
            }
        }
    }

    /**
     * Helper format ukuran byte ke format manusia (KB, MB, GB).
     */
    private function formatUkuranBerkas(int $bytes): string
    {
        if ($bytes <= 0) return '0 B';
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $i = (int) floor(log($bytes, 1024));
        return round($bytes / pow(1024, $i), 2) . ' ' . $units[$i];
    }
}
