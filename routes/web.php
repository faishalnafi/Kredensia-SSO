<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SetupController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/setup', [SetupController::class, 'indeks'])->name('setup.index');
Route::post('/setup/jalankan', [SetupController::class, 'jalankanInstalasi'])->name('setup.run');

use App\Http\Controllers\KatalogAplikasiController as UserKatalogController;

Route::get('/', function () {
    if (auth()->check()) {
        $user = auth()->user();
        if ($user->hasRole('Super Admin') || $user->hasRole('superadmin')) {
            return redirect()->route('superadmin.beranda');
        }
        if ($user->hasRole('Admin') || $user->hasRole('admin')) {
            return redirect()->route('admin.beranda');
        }
        return redirect()->route('dasbor');
    }
    return redirect()->route('login');
});

Route::get('/dashboard', function () {
    return redirect()->route('dasbor');
});

use App\Http\Controllers\Superadmin\BerandaController;
use App\Http\Controllers\Superadmin\ManajemenPenggunaController;
use App\Http\Controllers\Superadmin\ManajemenPeranController;
use App\Http\Controllers\Superadmin\AplikasiTerdaftarController;
use App\Http\Controllers\Superadmin\KatalogAplikasiController;
use App\Http\Controllers\Superadmin\PengaturanSistemController;
use App\Http\Controllers\Superadmin\PersetujuanDataController;
use App\Http\Controllers\Superadmin\LogAktivitasController;
use App\Http\Controllers\Superadmin\ProfilSayaController;
use App\Http\Controllers\Superadmin\KeamananAkunController;
use App\Http\Controllers\Superadmin\DokumentasiApiController;
use App\Http\Controllers\Superadmin\KunciApiController;
use App\Http\Controllers\Superadmin\BackupRestoreController;
use App\Http\Controllers\Superadmin\HapusDataController;
use App\Http\Controllers\Admin\DasborAdminController;
use App\Http\Controllers\Admin\HapusDataAdminController;
use App\Http\Controllers\ImportPenggunaController;

// Rute Dokumentasi API Standalone (Tanpa Sidebar/Menu Portal)
Route::get('/api/docs', [DokumentasiApiController::class, 'standalone'])->name('api.docs');

// Rute API v1 Gateway untuk Integrasi Pihak Ketiga (Swagger Compatibility)
Route::prefix('api/v1')->group(function () {
    Route::post('otentikasi', [App\Http\Controllers\Auth\AuthenticatedSessionController::class, 'store']);
    Route::post('otentikasi/verifikasi', [App\Http\Controllers\Auth\ClaimAccountController::class, 'prosesKlaim']);
    Route::post('otentikasi/cek-identitas', [App\Http\Controllers\Auth\ClaimAccountController::class, 'cekIdentitas']);
    Route::get('auth/google', [App\Http\Controllers\Auth\GoogleAuthController::class, 'redirectToGoogle']);
    Route::get('auth/google/callback', [App\Http\Controllers\Auth\GoogleAuthController::class, 'handleGoogleCallback']);
    Route::post('logout', [App\Http\Controllers\Auth\AuthenticatedSessionController::class, 'destroy']);
});

// Rute Umum yang dapat diakses oleh semua pengguna terautentikasi
Route::middleware('auth')->group(function () {
    Route::get('/dasbor', [UserKatalogController::class, 'tampilkanKatalog'])->name('dasbor');
    Route::get('/beranda', [KatalogAplikasiController::class, 'indeks'])->name('beranda');
    Route::get('/profil-saya', [ProfilSayaController::class, 'indeks'])->name('profil.indeks');
    Route::get('/keamanan-akun', [KeamananAkunController::class, 'indeks'])->name('keamanan.indeks');
    Route::post('/keamanan-akun/ajukan-perubahan', [KeamananAkunController::class, 'ajukanPerubahan'])->name('keamanan.ajukan_perubahan');
    Route::delete('/keamanan-akun/sesi/{id}', [KeamananAkunController::class, 'hapusSesi'])->name('keamanan.sesi.hapus');
    Route::post('/keamanan-akun/sesi/hapus-lainnya', [KeamananAkunController::class, 'hapusSesiLainnya'])->name('keamanan.sesi.hapus_lainnya');
    
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Rute khusus Admin
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/beranda', [DasborAdminController::class, 'indeks'])->name('beranda');
    
    // Manajemen Aplikasi untuk Admin
    Route::get('/manajemen-aplikasi', [AplikasiTerdaftarController::class, 'indeks'])->name('aplikasi.indeks');
    Route::post('/manajemen-aplikasi', [AplikasiTerdaftarController::class, 'simpan'])->name('aplikasi.simpan');
    Route::put('/manajemen-aplikasi/{id}', [AplikasiTerdaftarController::class, 'perbarui'])->name('aplikasi.perbarui');
    Route::delete('/manajemen-aplikasi/{id}', [AplikasiTerdaftarController::class, 'hapus'])->name('aplikasi.hapus');
    Route::post('/manajemen-aplikasi/{id}/generate-secret', [AplikasiTerdaftarController::class, 'regenerateSecret'])->name('aplikasi.regenerate');

    // Manajemen Pengguna untuk Admin
    Route::get('/manajemen-pengguna', [ManajemenPenggunaController::class, 'indeks'])->name('pengguna.indeks');
    Route::post('/manajemen-pengguna', [ManajemenPenggunaController::class, 'simpan'])->name('pengguna.simpan');
    Route::put('/manajemen-pengguna/{id}', [ManajemenPenggunaController::class, 'perbarui'])->name('pengguna.perbarui');
    Route::delete('/manajemen-pengguna/{id}', [ManajemenPenggunaController::class, 'hapus'])->name('pengguna.hapus');
    Route::get('/manajemen-pengguna/template-csv', [ManajemenPenggunaController::class, 'unduhTemplate'])->name('pengguna.template-csv');
    Route::get('/manajemen-pengguna/template-excel', [ManajemenPenggunaController::class, 'unduhTemplateExcel'])->name('pengguna.template-excel');
    Route::post('/manajemen-pengguna/import', [ManajemenPenggunaController::class, 'import'])->name('pengguna.import');
    Route::post('/manajemen-pengguna/import-batch-siswa', [ManajemenPenggunaController::class, 'importBatchSiswa'])->name('pengguna.import-batch-siswa');
    Route::post('/manajemen-pengguna/import-batch-guru', [ManajemenPenggunaController::class, 'importBatchGuru'])->name('pengguna.import-batch-guru');
    Route::get('/manajemen-pengguna/template-siswa', [ManajemenPenggunaController::class, 'unduhTemplateSiswa'])->name('pengguna.template-siswa');
    Route::get('/manajemen-pengguna/template-guru', [ManajemenPenggunaController::class, 'unduhTemplateGuru'])->name('pengguna.template-guru');
    
    Route::get('/persetujuan-data', [PersetujuanDataController::class, 'indeks'])->name('persetujuan.indeks');
    Route::post('/persetujuan-data/{id}/setujui', [PersetujuanDataController::class, 'setujui'])->name('persetujuan.setujui');
    Route::post('/persetujuan-data/{id}/tolak', [PersetujuanDataController::class, 'tolak'])->name('persetujuan.tolak');

    Route::get('/log-aktivitas', [LogAktivitasController::class, 'indeks'])->name('log.indeks');

    // Manajemen Tahun Pelajaran & Kelas
    Route::get('/tahun-pelajaran', [App\Http\Controllers\TahunPelajaranController::class, 'index'])->name('tahun-pelajaran.index');
    Route::post('/tahun-pelajaran', [App\Http\Controllers\TahunPelajaranController::class, 'store'])->name('tahun-pelajaran.store');
    Route::put('/tahun-pelajaran/{tahunPelajaran}', [App\Http\Controllers\TahunPelajaranController::class, 'update'])->name('tahun-pelajaran.update');
    Route::delete('/tahun-pelajaran/{tahunPelajaran}', [App\Http\Controllers\TahunPelajaranController::class, 'destroy'])->name('tahun-pelajaran.destroy');
    Route::post('/tahun-pelajaran/{tahunPelajaran}/aktif', [App\Http\Controllers\TahunPelajaranController::class, 'setAktif'])->name('tahun-pelajaran.aktif');
    Route::post('/tahun-pelajaran/bulk-update', [App\Http\Controllers\TahunPelajaranController::class, 'bulkUpdate'])->name('tahun-pelajaran.bulk-update');

    Route::get('/kelas', [App\Http\Controllers\KelasController::class, 'index'])->name('kelas.index');
    Route::post('/kelas', [App\Http\Controllers\KelasController::class, 'store'])->name('kelas.store');
    Route::put('/kelas/{kelas}', [App\Http\Controllers\KelasController::class, 'update'])->name('kelas.update');
    Route::delete('/kelas/{kelas}', [App\Http\Controllers\KelasController::class, 'destroy'])->name('kelas.destroy');

    # Hapus Data Keseluruhan (Admin)
    Route::get('/hapus-data', [HapusDataAdminController::class, 'indeks'])->name('hapus-data.indeks');
    Route::get('/hapus-data/unduh-backup', [HapusDataAdminController::class, 'unduhBackup'])->name('hapus-data.unduh-backup');
    Route::delete('/hapus-data', [HapusDataAdminController::class, 'prosesHapus'])->name('hapus-data.proses');
});

// Rute khusus Superadmin
Route::middleware(['auth', 'superadmin'])->prefix('superadmin')->name('superadmin.')->group(function () {
    Route::get('/beranda', [BerandaController::class, 'indeks'])->name('beranda');
    Route::get('/manajemen-aplikasi', [AplikasiTerdaftarController::class, 'indeks'])->name('aplikasi.indeks');
    Route::post('/manajemen-aplikasi', [AplikasiTerdaftarController::class, 'simpan'])->name('aplikasi.simpan');
    Route::put('/manajemen-aplikasi/{id}', [AplikasiTerdaftarController::class, 'perbarui'])->name('aplikasi.perbarui');
    Route::delete('/manajemen-aplikasi/{id}', [AplikasiTerdaftarController::class, 'hapus'])->name('aplikasi.hapus');
    Route::post('/manajemen-aplikasi/{id}/generate-secret', [AplikasiTerdaftarController::class, 'regenerateSecret'])->name('aplikasi.regenerate');
    
    Route::get('/manajemen-peran', [ManajemenPeranController::class, 'indeks'])->name('peran.indeks');
    Route::post('/manajemen-peran', [ManajemenPeranController::class, 'simpan'])->name('peran.simpan');
    Route::put('/manajemen-peran/{id}', [ManajemenPeranController::class, 'perbarui'])->name('peran.perbarui');
    Route::delete('/manajemen-peran/{id}', [ManajemenPeranController::class, 'hapus'])->name('peran.hapus');

    Route::get('/manajemen-pengguna', [ManajemenPenggunaController::class, 'indeks'])->name('pengguna.indeks');
    Route::post('/manajemen-pengguna', [ManajemenPenggunaController::class, 'simpan'])->name('pengguna.simpan');
    Route::put('/manajemen-pengguna/{id}', [ManajemenPenggunaController::class, 'perbarui'])->name('pengguna.perbarui');
    Route::delete('/manajemen-pengguna/{id}', [ManajemenPenggunaController::class, 'hapus'])->name('pengguna.hapus');
    Route::get('/manajemen-pengguna/template-csv', [ManajemenPenggunaController::class, 'unduhTemplate'])->name('pengguna.template-csv');
    Route::get('/manajemen-pengguna/template-excel', [ManajemenPenggunaController::class, 'unduhTemplateExcel'])->name('pengguna.template-excel');
    Route::post('/manajemen-pengguna/import', [ManajemenPenggunaController::class, 'import'])->name('pengguna.import');
    Route::post('/manajemen-pengguna/import-batch-siswa', [ManajemenPenggunaController::class, 'importBatchSiswa'])->name('pengguna.import-batch-siswa');
    Route::post('/manajemen-pengguna/import-batch-guru', [ManajemenPenggunaController::class, 'importBatchGuru'])->name('pengguna.import-batch-guru');
    Route::get('/manajemen-pengguna/template-siswa', [ManajemenPenggunaController::class, 'unduhTemplateSiswa'])->name('pengguna.template-siswa');
    Route::get('/manajemen-pengguna/template-guru', [ManajemenPenggunaController::class, 'unduhTemplateGuru'])->name('pengguna.template-guru');

    Route::get('/pengaturan-sistem', [PengaturanSistemController::class, 'indeks'])->name('pengaturan.indeks');
    Route::post('/pengaturan-sistem', [PengaturanSistemController::class, 'perbarui'])->name('pengaturan.perbarui');
    
    Route::get('/persetujuan-data', [PersetujuanDataController::class, 'indeks'])->name('persetujuan.indeks');
    Route::post('/persetujuan-data/{id}/setujui', [PersetujuanDataController::class, 'setujui'])->name('persetujuan.setujui');
    Route::post('/persetujuan-data/{id}/tolak', [PersetujuanDataController::class, 'tolak'])->name('persetujuan.tolak');

    Route::get('/log-aktivitas', [LogAktivitasController::class, 'indeks'])->name('log.indeks');

    Route::get('/kunci-api', [KunciApiController::class, 'indeks'])->name('kunci-api.indeks');
    Route::post('/kunci-api', [KunciApiController::class, 'simpan'])->name('kunci-api.simpan');
    Route::put('/kunci-api/{id}', [KunciApiController::class, 'perbarui'])->name('kunci-api.perbarui');
    Route::delete('/kunci-api/{id}', [KunciApiController::class, 'hapus'])->name('kunci-api.hapus');
    Route::post('/kunci-api/{id}/regenerasi', [KunciApiController::class, 'regenerasi'])->name('kunci-api.regenerasi');

    Route::get('/dokumentasi-api', [DokumentasiApiController::class, 'indeks'])->name('dokumentasi.indeks');

    // Manajemen Tahun Pelajaran & Kelas
    Route::get('/tahun-pelajaran', [App\Http\Controllers\TahunPelajaranController::class, 'index'])->name('tahun-pelajaran.index');
    Route::post('/tahun-pelajaran', [App\Http\Controllers\TahunPelajaranController::class, 'store'])->name('tahun-pelajaran.store');
    Route::put('/tahun-pelajaran/{tahunPelajaran}', [App\Http\Controllers\TahunPelajaranController::class, 'update'])->name('tahun-pelajaran.update');
    Route::delete('/tahun-pelajaran/{tahunPelajaran}', [App\Http\Controllers\TahunPelajaranController::class, 'destroy'])->name('tahun-pelajaran.destroy');
    Route::post('/tahun-pelajaran/{tahunPelajaran}/aktif', [App\Http\Controllers\TahunPelajaranController::class, 'setAktif'])->name('tahun-pelajaran.aktif');
    Route::post('/tahun-pelajaran/bulk-update', [App\Http\Controllers\TahunPelajaranController::class, 'bulkUpdate'])->name('tahun-pelajaran.bulk-update');

    Route::get('/kelas', [App\Http\Controllers\KelasController::class, 'index'])->name('kelas.index');
    Route::post('/kelas', [App\Http\Controllers\KelasController::class, 'store'])->name('kelas.store');
    Route::put('/kelas/{kelas}', [App\Http\Controllers\KelasController::class, 'update'])->name('kelas.update');
    Route::delete('/kelas/{kelas}', [App\Http\Controllers\KelasController::class, 'destroy'])->name('kelas.destroy');

    # Backup & Restore Data (Superadmin only)
    Route::get('/backup-restore', [BackupRestoreController::class, 'indeks'])->name('backup-restore.indeks');
    Route::get('/backup-restore/unduh', [BackupRestoreController::class, 'unduhBackup'])->name('backup-restore.unduh');
    Route::post('/backup-restore/restore', [BackupRestoreController::class, 'unggahRestore'])->name('backup-restore.restore');

    # Hapus Data Keseluruhan (Superadmin)
    Route::get('/hapus-data', [HapusDataController::class, 'indeks'])->name('hapus-data.indeks');
    Route::get('/hapus-data/unduh-backup', [HapusDataController::class, 'unduhBackup'])->name('hapus-data.unduh-backup');
    Route::delete('/hapus-data', [HapusDataController::class, 'prosesHapus'])->name('hapus-data.proses');
});

require __DIR__.'/auth.php';
