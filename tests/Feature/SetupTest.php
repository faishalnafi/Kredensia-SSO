<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SetupTest extends TestCase
{
    use RefreshDatabase;

    public function test_setup_page_can_be_rendered(): void
    {
        $response = $this->get('/setup');

        $response->assertStatus(200);
        $response->assertSee('Portal SSO Sekolah');
        $response->assertSee('Setup Wizard');
    }

    public function test_setup_installer_migrates_and_seeds_correct_credentials(): void
    {
        // Jalankan request setup installer
        $response = $this->postJson('/setup/jalankan');

        if ($response->status() !== 200) {
            $response->dump();
        }

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'message' => 'Instalasi awal berhasil diselesaikan.'
        ]);

        // 1. Cek keberadaan Peran
        $this->assertDatabaseHas('roles', [
            'nama_role' => 'Super Admin',
            'is_active' => true
        ]);

        $this->assertDatabaseHas('roles', [
            'nama_role' => 'Admin',
            'is_active' => true
        ]);

        // 2. Cek user superadmin
        $this->assertDatabaseHas('users', [
            'email' => 'superadmin@faishalnafi.com',
            'nama_lengkap' => 'Super Admin'
        ]);

        // 3. Cek user admin
        $this->assertDatabaseHas('users', [
            'email' => 'admin@faishalnafi.com',
            'nama_lengkap' => 'Admin'
        ]);

        // 4. Verifikasi peran terhubung ke masing-masing user
        $superadmin = User::where('email', 'superadmin@faishalnafi.com')->first();
        $this->assertTrue($superadmin->hasRole('Super Admin'));

        $admin = User::where('email', 'admin@faishalnafi.com')->first();
        $this->assertTrue($admin->hasRole('Admin'));
    }
}
