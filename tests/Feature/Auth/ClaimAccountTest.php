<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ClaimAccountTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Uji pengecekan identitas untuk Siswa dan Guru.
     */
    public function test_cek_identitas_mengembalikan_status_wajib_verifikasi_wajah(): void
    {
        $siswa = User::factory()->create([
            'nik' => '3201012345670001',
            'nip_nis' => '1234567890',
            'tgl_lahir' => '2008-05-15',
            'claimed_at' => null,
            'is_active' => true,
        ]);

        $guru = User::factory()->create([
            'nik' => '3201012345670002',
            'nip_nis' => '198501012010011001',
            'tgl_lahir' => '1985-01-01',
            'claimed_at' => null,
            'is_active' => true,
        ]);

        // Cek Siswa: wajib_verifikasi_wajah harus bernilai true
        $responsSiswa = $this->postJson(route('claim.check'), [
            'jenis_pengguna' => 'Siswa',
            'nik' => '3201012345670001',
            'nip_nis' => '1234567890',
            'tgl_lahir' => '2008-05-15',
        ]);

        $responsSiswa->assertOk();
        $responsSiswa->assertJson([
            'success' => true,
            'email' => $siswa->email,
            'nama_lengkap' => $siswa->nama_lengkap,
            'wajib_verifikasi_wajah' => true,
        ]);

        // Cek Guru: wajib_verifikasi_wajah harus bernilai false
        $responsGuru = $this->postJson(route('claim.check'), [
            'jenis_pengguna' => 'Guru',
            'nik' => '3201012345670002',
            'nip_nis' => '198501012010011001',
            'tgl_lahir' => '1985-01-01',
        ]);

        $responsGuru->assertOk();
        $responsGuru->assertJson([
            'success' => true,
            'email' => $guru->email,
            'nama_lengkap' => $guru->nama_lengkap,
            'wajib_verifikasi_wajah' => false,
        ]);
    }

    /**
     * Uji proses klaim akun dengan unggah foto verifikasi wajah.
     */
    public function test_proses_klaim_dengan_foto_wajah_tersimpan_di_foto_identitas(): void
    {
        Storage::fake('public');

        $user = User::factory()->create([
            'nik' => '3201019999990001',
            'nip_nis' => '9988776655',
            'tgl_lahir' => '2009-10-20',
            'claimed_at' => null,
            'foto_identitas' => null,
            'is_active' => true,
        ]);

        $berkasFoto = UploadedFile::fake()->image('wajah_siswa.jpg', 640, 480);

        $respons = $this->post(route('claim.process'), [
            'nik' => '3201019999990001',
            'nip_nis' => '9988776655',
            'tgl_lahir' => '2009-10-20',
            'email' => 'siswa.baru@sekolah.sch.id',
            'password' => 'Katasandi123!@#',
            'password_confirmation' => 'Katasandi123!@#',
            'foto_wajah' => $berkasFoto,
        ]);

        $respons->assertRedirect(route('login') . '#masuk');

        $user->refresh();

        $this->assertNotNull($user->claimed_at);
        $this->assertEquals('siswa.baru@sekolah.sch.id', $user->email);
        $this->assertNotNull($user->foto_identitas);
        $this->assertStringStartsWith('verifikasi-wajah/', $user->foto_identitas);

        // Pastikan berkas fisik tersimpan di storage public
        Storage::disk('public')->assertExists($user->foto_identitas);

        // Pastikan avatar_url menggunakan foto_identitas
        $this->assertStringContainsString('storage/verifikasi-wajah/', $user->avatar_url);
    }
}
