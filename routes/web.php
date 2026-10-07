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
use App\Http\Controllers\Superadmin\Konfigurasi2FAController;
use App\Http\Controllers\Superadmin\DokumentasiApiController;
use App\Http\Controllers\Superadmin\KunciApiController;
use App\Http\Controllers\Admin\DasborAdminController;

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
    Route::post('/keamanan-akun/cek-username', [KeamananAkunController::class, 'cekUsername'])->name('keamanan.cek_username');
    Route::post('/keamanan-akun/ajukan-perubahan', [KeamananAkunController::class, 'ajukanPerubahan'])->name('keamanan.ajukan_perubahan');
    Route::delete('/keamanan-akun/sesi/{id}', [KeamananAkunController::class, 'hapusSesi'])->name('keamanan.sesi.hapus');
    Route::post('/keamanan-akun/sesi/hapus-lainnya', [KeamananAkunController::class, 'hapusSesiLainnya'])->name('keamanan.sesi.hapus_lainnya');

    # Pengaturan 2FA / MFA Mandiri Pengguna
    Route::post('/keamanan-akun/2fa/generate', [KeamananAkunController::class, 'generate2FA'])->name('keamanan.2fa.generate');
    Route::post('/keamanan-akun/2fa/konfirmasi', [KeamananAkunController::class, 'confirm2FA'])->name('keamanan.2fa.confirm');
    Route::post('/keamanan-akun/2fa/kirim-otp-setup', [KeamananAkunController::class, 'kirimOtpSetup'])->name('keamanan.2fa.kirim_otp_setup');
    Route::post('/keamanan-akun/2fa/konfirmasi-otp', [KeamananAkunController::class, 'konfirmasiMetodeOtp'])->name('keamanan.2fa.konfirmasi_otp');
    Route::post('/keamanan-akun/2fa/kelola-metode', [KeamananAkunController::class, 'kelolaMetodeMfa'])->name('keamanan.2fa.kelola_metode');
    Route::post('/keamanan-akun/2fa/kode-cadangan-baru', [KeamananAkunController::class, 'regenerasiKodeCadangan'])->name('keamanan.2fa.regenerasi_kode');
    Route::post('/keamanan-akun/2fa/webauthn', [KeamananAkunController::class, 'simpanKredensialWebAuthn'])->name('keamanan.2fa.webauthn.simpan');
    Route::delete('/keamanan-akun/2fa/webauthn/{idKunci}', [KeamananAkunController::class, 'hapusKredensialWebAuthn'])->name('keamanan.2fa.webauthn.hapus');
    Route::post('/keamanan-akun/2fa/nonaktifkan', [KeamananAkunController::class, 'disable2FA'])->name('keamanan.2fa.disable');

    # Endpoint Real-Time Dialog Google Prompt untuk perangkat yang sedang aktif login
    Route::get('/keamanan-akun/2fa/prompt-pending', [KeamananAkunController::class, 'cekPromptPending'])->name('keamanan.2fa.prompt_pending');
    Route::post('/keamanan-akun/2fa/prompt-respon', [KeamananAkunController::class, 'responPromptLogin'])->name('keamanan.2fa.prompt_respon');
    
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Rute khusus Admin
Route::middleware(['auth', 'admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/beranda', [DasborAdminController::class, 'indeks'])->name('beranda');
    Route::get('/manajemen-pengguna', [ManajemenPenggunaController::class, 'indeks'])->name('pengguna.indeks');
    
    Route::get('/persetujuan-data', [PersetujuanDataController::class, 'indeks'])->name('persetujuan.indeks');
    Route::post('/persetujuan-data/{id}/setujui', [PersetujuanDataController::class, 'setujui'])->name('persetujuan.setujui');
    Route::post('/persetujuan-data/{id}/tolak', [PersetujuanDataController::class, 'tolak'])->name('persetujuan.tolak');

    Route::get('/log-aktivitas', [LogAktivitasController::class, 'indeks'])->name('log.indeks');
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

    Route::get('/pengaturan-sistem', [PengaturanSistemController::class, 'indeks'])->name('pengaturan.indeks');
    Route::post('/pengaturan-sistem', [PengaturanSistemController::class, 'perbarui'])->name('pengaturan.perbarui');
    Route::post('/pengaturan-sistem/uji-smtp', [PengaturanSistemController::class, 'ujiKirimSmtp'])->name('pengaturan.uji-smtp');

    # Konfigurasi Autentikasi 2FA & Gateway WhatsApp Fonnte / SMTP Email
    Route::get('/konfigurasi-2fa', [Konfigurasi2FAController::class, 'indeks'])->name('two-factor.indeks');
    Route::post('/konfigurasi-2fa', [Konfigurasi2FAController::class, 'perbarui'])->name('two-factor.perbarui');
    Route::post('/konfigurasi-2fa/fonnte', [Konfigurasi2FAController::class, 'simpanKonfigurasiFonnte'])->name('two-factor.fonnte.simpan');
    Route::post('/konfigurasi-2fa/fonnte/cek-device', [Konfigurasi2FAController::class, 'cekDeviceFonnte'])->name('two-factor.fonnte.cek-device');
    Route::post('/konfigurasi-2fa/fonnte/uji-kirim', [Konfigurasi2FAController::class, 'ujiKirimFonnte'])->name('two-factor.fonnte.uji-kirim');
    Route::post('/konfigurasi-2fa/smtp', [Konfigurasi2FAController::class, 'simpanKonfigurasiSmtp'])->name('two-factor.smtp.simpan');
    Route::post('/konfigurasi-2fa/smtp/uji-kirim', [Konfigurasi2FAController::class, 'ujiKirimSmtp'])->name('two-factor.smtp.uji-kirim');
    Route::post('/konfigurasi-2fa/reset/{userId}', [Konfigurasi2FAController::class, 'resetPengguna2FA'])->name('two-factor.reset');
    Route::post('/konfigurasi-2fa/reset-semua', [Konfigurasi2FAController::class, 'resetSemua2FA'])->name('two-factor.reset-semua');
    
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
});

require __DIR__.'/auth.php';
