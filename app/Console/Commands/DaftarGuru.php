<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\User;
use App\Models\Role;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class DaftarGuru extends Command
{
    /**
     * Nama dan signature dari console command.
     */
    protected $signature = 'sso:daftar-guru {email} {nama} {--password=guru123}';

    /**
     * Deskripsi command.
     */
    protected $description = 'Mendaftarkan guru baru secara instan dan langsung aktif di sistem SSO';

    /**
     * Eksekusi command.
     */
    public function handle(): int
    {
        $email = $this->argument('email');
        $nama = $this->argument('nama');
        $passwordRaw = $this->option('password');

        $this->info("Memproses pendaftaran guru: {$nama} ({$email})");

        // 1. Dapatkan atau buat peran Guru
        $roleGuru = Role::firstOrCreate(
            ['nama_role' => 'Guru'],
            ['is_active' => true]
        );

        // 2. Periksa apakah pengguna dengan email tersebut sudah terdaftar
        $user = User::where('email', $email)->first();

        if ($user) {
            $this->warn("User dengan email {$email} sudah terdaftar. Memperbarui data...");
            $user->update([
                'nama_lengkap' => $nama,
                'password' => Hash::make($passwordRaw),
                'is_active' => true,
                'claimed_at' => now(), // langsung aktif/klaim agar bisa langsung login
            ]);
        } else {
            // Generate NIP & NIK acak untuk pelengkap identitas jika belum ada
            $nik = '3201' . str_pad((string) rand(1, 999999999999), 12, '0', STR_PAD_LEFT);
            $nip = '1990' . str_pad((string) rand(1, 99999999999999), 14, '0', STR_PAD_LEFT);

            $user = User::create([
                'nama_lengkap' => $nama,
                'email' => $email,
                'password' => Hash::make($passwordRaw),
                'jk' => 'P',
                'tgl_lahir' => '1990-01-01',
                'nik' => $nik,
                'nip_nis' => $nip,
                'is_active' => true,
                'claimed_at' => now(), // langsung diset aktif/claimed
            ]);
        }

        // Hubungkan ke role Guru jika belum terhubung
        if (!$user->roles->contains($roleGuru->id)) {
            $user->roles()->attach($roleGuru->id);
        }

        $this->info("Sukses! Guru {$nama} berhasil didaftarkan.");
        $this->info("Email: {$email}");
        $this->info("Password: {$passwordRaw}");
        $this->info("Akun berstatus AKTIF & TERKLAIM (siap digunakan login).");

        return 0;
    }
}
