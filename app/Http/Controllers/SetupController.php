<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Role;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Schema;

class SetupController extends Controller
{
    /**
     * Menampilkan halaman instalasi awal (Web Interface).
     */
    public function indeks()
    {
        // Cek status koneksi database
        $dbKoneksiOk = false;
        $dbPesan = '';
        try {
            DB::connection()->getPdo();
            $dbKoneksiOk = true;
            $dbPesan = 'Koneksi ke database berhasil terhubung.';
        } catch (\Exception $e) {
            $dbPesan = 'Gagal terhubung ke database: ' . $e->getMessage();
        }

        // Cek apakah database sudah termigrasi
        $sudahTermigrasi = false;
        if ($dbKoneksiOk && Schema::hasTable('users')) {
            $sudahTermigrasi = User::count() > 0;
        }

        return view('setup', [
            'dbKoneksiOk' => $dbKoneksiOk,
            'dbPesan' => $dbPesan,
            'sudahTermigrasi' => $sudahTermigrasi,
            'phpVersion' => PHP_VERSION,
        ]);
    }

    /**
     * Menjalankan proses migrasi dan seeding data awal.
     */
    public function jalankanInstalasi(Request $request): JsonResponse
    {
        try {
            // 1. Jalankan Migrasi (Fresh di prod, standar di testing untuk mencegah error SQLite vacuum)
            if (app()->environment('testing')) {
                // Di lingkungan testing, tabel sudah bersih/dibuat oleh RefreshDatabase
                Artisan::call('migrate', ['--force' => true]);
            } else {
                Artisan::call('migrate:fresh', ['--force' => true]);
            }

            // 2. Buat Peran (Roles)
            $roleSuperAdmin = Role::create([
                'nama_role' => 'Super Admin',
                'is_active' => true,
            ]);

            $roleAdmin = Role::create([
                'nama_role' => 'Admin',
                'is_active' => true,
            ]);

            // 3. Buat User Superadmin
            $superadmin = User::create([
                'nama_lengkap'            => 'Super Admin',
                'email'                   => 'superadmin@faishalnafi.com',
                'password'                => Hash::make('@Password123'),
                'jk'                      => 'L',
                'tgl_lahir'               => '2000-10-01',
                'nik'                     => '1029384756564738',
                'nip_nis'                 => '123456789012345678',
                'no_telp'                 => '081234567890',
                'alamat'                  => 'Jakarta',
                'is_active'               => true,
                'claimed_at'              => now(),
                'biodata_dilengkapi_pada' => now(),
            ]);
            $superadmin->roles()->attach($roleSuperAdmin->id);

            // 4. Buat User Admin
            $admin = User::create([
                'nama_lengkap'            => 'Admin',
                'email'                   => 'admin@faishalnafi.com',
                'password'                => Hash::make('@Password123'),
                'jk'                      => 'P',
                'tgl_lahir'               => '2000-10-01',
                'nik'                     => '1029384756102938',
                'nip_nis'                 => '123456789098765432',
                'no_telp'                 => '081234567891',
                'alamat'                  => 'Jakarta',
                'is_active'               => true,
                'claimed_at'              => now(),
                'biodata_dilengkapi_pada' => now(),
            ]);
            $admin->roles()->attach($roleAdmin->id);

            return response()->json([
                'success' => true,
                'message' => 'Instalasi awal berhasil diselesaikan.',
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menjalankan instalasi: ' . $e->getMessage(),
            ], 500);
        }
    }
}
