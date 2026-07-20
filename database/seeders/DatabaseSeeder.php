<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use App\Models\Role;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Roles
        $roleSuperAdmin = Role::create([
            'nama_role' => 'Super Admin',
            'is_active' => true,
        ]);

        $roleAdmin = Role::create([
            'nama_role' => 'Admin',
            'is_active' => true,
        ]);

        $roleGuru = Role::create([
            'nama_role' => 'Guru',
            'is_active' => true,
        ]);

        $roleSiswa = Role::create([
            'nama_role' => 'Siswa',
            'is_active' => true,
        ]);

        $roleWaliKelas = Role::create([
            'nama_role' => 'Wali Kelas',
            'is_active' => true,
        ]);

        $roleBK = Role::create([
            'nama_role' => 'BK',
            'is_active' => true,
        ]);

        $roleGDS = Role::create([
            'nama_role' => 'GDS',
            'is_active' => true,
        ]);


        // 2. Seed Users
        $superAdmin = User::create([
            'nama_lengkap' => 'Super Admin SSO',
            'email' => 'superadmin@sekolah.sch.id',
            'password' => Hash::make('superadmin'),
            'jk' => 'L',
            'tgl_lahir' => '1980-01-01',
            'nik' => '1234567890123456',
            'nip_nis' => '198001012005011001',
            'is_active' => true,
            'claimed_at' => now(),
        ]);
        $superAdmin->roles()->attach($roleSuperAdmin->id);

        $admin = User::create([
            'nama_lengkap' => 'Admin Tata Usaha',
            'email' => 'admin@sekolah.sch.id',
            'password' => Hash::make('admin123'),
            'jk' => 'P',
            'tgl_lahir' => '1990-02-15',
            'nik' => '3201020304050002',
            'nip_nis' => '199002152010012001',
            'is_active' => true,
            'claimed_at' => null,
        ]);
        $admin->roles()->attach($roleAdmin->id);

        $guru = User::create([
            'nama_lengkap' => 'Budi Santoso, S.Pd',
            'email' => 'guru@sekolah.sch.id',
            'password' => Hash::make('guru123'),
            'jk' => 'L',
            'tgl_lahir' => '1985-05-12',
            'nik' => '3201020304050001',
            'nip_nis' => '198505122010011002',
            'is_active' => true,
            'claimed_at' => null,
        ]);
        // Budi Santoso adalah Guru biasa
        $guru->roles()->attach([$roleGuru->id]);

        $guruWaliKelas = User::create([
            'nama_lengkap' => 'Siti Aminah, M.Pd',
            'email' => 'walikelas@sekolah.sch.id',
            'password' => Hash::make('guru123'),
            'jk' => 'P',
            'tgl_lahir' => '1982-11-20',
            'nik' => '3201020304050010',
            'nip_nis' => '198211202010012003',
            'is_active' => true,
            'claimed_at' => null,
        ]);
        // Siti Aminah adalah Guru DAN Wali Kelas (Multi-role)
        $guruWaliKelas->roles()->attach([$roleGuru->id, $roleWaliKelas->id]);

        $guruBK = User::create([
            'nama_lengkap' => 'Drs. Iwan Setiawan',
            'email' => 'bk@sekolah.sch.id',
            'password' => Hash::make('guru123'),
            'jk' => 'L',
            'tgl_lahir' => '1975-08-08',
            'nik' => '3201020304050011',
            'nip_nis' => '197508082000011004',
            'is_active' => true,
            'claimed_at' => null,
        ]);
        // Iwan Setiawan adalah Guru DAN BK (Multi-role)
        $guruBK->roles()->attach([$roleGuru->id, $roleBK->id]);

        $guruGDS = User::create([
            'nama_lengkap' => 'Joko Purwanto, S.Or',
            'email' => 'gds@sekolah.sch.id',
            'password' => Hash::make('guru123'),
            'jk' => 'L',
            'tgl_lahir' => '1988-03-25',
            'nik' => '3201020304050012',
            'nip_nis' => '198803252015011005',
            'is_active' => true,
            'claimed_at' => null,
        ]);
        // Joko Purwanto adalah Guru DAN GDS (Multi-role)
        $guruGDS->roles()->attach([$roleGuru->id, $roleGDS->id]);

        $guruAulia = User::create([
            'nama_lengkap' => 'Aulia Rahma, S.Pd',
            'email' => 'aulia@sekolah.sch.id',
            'password' => Hash::make('guru123'),
            'jk' => 'P',
            'tgl_lahir' => '1992-04-18',
            'nik' => '3201020304050099',
            'nip_nis' => '199204182018012001',
            'is_active' => true,
            'claimed_at' => now(), // langsung set aktif & terklaim agar bisa langsung login
        ]);
        $guruAulia->roles()->attach([$roleGuru->id]);

        $siswa = User::create([
            'nama_lengkap' => 'Ahmad Fauzi',
            'email' => 'siswa@sekolah.sch.id',
            'password' => Hash::make('siswa123'),
            'jk' => 'L',
            'tgl_lahir' => '2010-10-10',
            'nik' => '3201020304050003',
            'nip_nis' => '222310101',
            'is_active' => true,
            'claimed_at' => null,
        ]);
        $siswa->roles()->attach($roleSiswa->id);
    }
}
