<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Roles (Hanya 2 role: Super Admin dan Admin)
        $roleSuperAdmin = Role::create([
            'nama_role' => 'Super Admin',
            'is_active' => true,
        ]);

        $roleAdmin = Role::create([
            'nama_role' => 'Admin',
            'is_active' => true,
        ]);

        // 2. Seed Users
        $superAdmin = User::create([
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
        $superAdmin->roles()->attach($roleSuperAdmin->id);

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
    }
}
