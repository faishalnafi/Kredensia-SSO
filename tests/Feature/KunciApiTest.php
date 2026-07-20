<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\KunciApi;
use App\Models\Role;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

class KunciApiTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test endpoint GET /api/v1/test
     */
    public function test_api_koneksi_requires_api_key(): void
    {
        $response = $this->getJson('/api/v1/test');
        $response->assertStatus(401);
    }

    public function test_api_koneksi_succeeds_with_valid_key(): void
    {
        // 1. Buat user & role
        $pembuat = User::factory()->create(['nama_lengkap' => 'Admin Test']);
        
        // 2. Buat API key
        $prefix = 'cbt';
        $kunciAsli = $prefix . '_' . Str::random(40);

        $kunci = KunciApi::create([
            'nama_aplikasi' => 'CBT Test App',
            'domain_diizinkan' => '*', // wildcard untuk development
            'prefix' => $prefix,
            'kunci_api' => $kunciAsli,
            'dibuat_oleh' => $pembuat->id,
            'is_active' => true,
        ]);

        $response = $this->getJson('/api/v1/test', [
            'X-API-Key' => $kunciAsli
        ]);

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
        $response->assertJsonPath('data.status', 'ok');
    }

    public function test_api_koneksi_fails_with_domain_mismatch(): void
    {
        $pembuat = User::factory()->create(['nama_lengkap' => 'Admin Test']);
        
        $prefix = 'cbt';
        $kunciAsli = $prefix . '_' . Str::random(40);

        // Domain diizinkan hanya cbt.sekolah.sch.id
        $kunci = KunciApi::create([
            'nama_aplikasi' => 'CBT App',
            'domain_diizinkan' => 'cbt.sekolah.sch.id',
            'prefix' => $prefix,
            'kunci_api' => $kunciAsli,
            'dibuat_oleh' => $pembuat->id,
            'is_active' => true,
        ]);

        // Kirim request dari origin lain (mismatch)
        $response = $this->withHeaders([
            'X-API-Key' => $kunciAsli,
            'Origin' => 'https://hackerdomain.com'
        ])->getJson('/api/v1/test');

        $response->assertStatus(403);
    }

    public function test_api_koneksi_succeeds_with_correct_origin(): void
    {
        $pembuat = User::factory()->create(['nama_lengkap' => 'Admin Test']);
        
        $prefix = 'cbt';
        $kunciAsli = $prefix . '_' . Str::random(40);

        $kunci = KunciApi::create([
            'nama_aplikasi' => 'CBT App',
            'domain_diizinkan' => 'cbt.sekolah.sch.id',
            'prefix' => $prefix,
            'kunci_api' => $kunciAsli,
            'dibuat_oleh' => $pembuat->id,
            'is_active' => true,
        ]);

        // Kirim request dari origin yang sesuai
        $response = $this->withHeaders([
            'X-API-Key' => $kunciAsli,
            'Origin' => 'https://cbt.sekolah.sch.id'
        ])->getJson('/api/v1/test');

        $response->assertStatus(200);
        $response->assertJsonPath('success', true);
    }

    /**
     * Test import massal pengguna via CSV dan auto role creation
     */
    public function test_import_csv_registers_users_and_creates_missing_roles(): void
    {
        $superadmin = User::factory()->create(['nama_lengkap' => 'Super Admin']);
        $roleSuper = Role::create(['nama_role' => 'Super Admin', 'is_active' => true]);
        $superadmin->roles()->attach($roleSuper->id);
        
        // Buat file CSV di memory
        $csvContent = "nama_lengkap,email,password,jk,tgl_lahir,nik,nip_nis,no_telp,alamat,nama_peran\n";
        $csvContent .= "Budi Santoso,budi@kredensia.id,secret123,L,2008-04-15,3515012345670002,260012345,081234567891,Sidoarjo,Siswa\n";
        $csvContent .= "Siti Aminah,siti@kredensia.id,secret567,P,1985-08-20,3515012345670003,198508202010,085712345678,Surabaya,Guru BK\n";

        $tempFile = tmpfile();
        fwrite($tempFile, $csvContent);
        $meta = stream_get_meta_data($tempFile);
        $filePath = $meta['uri'];

        $file = new UploadedFile(
            $filePath,
            'users_import.csv',
            'text/csv',
            null,
            true
        );

        // Jalankan import
        $response = $this->actingAs($superadmin)
            ->post('/superadmin/manajemen-pengguna/import', [
                'file_import' => $file
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        // Pastikan user tersimpan
        $this->assertDatabaseHas('users', [
            'email' => 'budi@kredensia.id',
            'nama_lengkap' => 'Budi Santoso'
        ]);

        $this->assertDatabaseHas('users', [
            'email' => 'siti@kredensia.id',
            'nama_lengkap' => 'Siti Aminah'
        ]);

        // Pastikan role Guru BK dibuat otomatis secara case-insensitive
        $this->assertDatabaseHas('roles', [
            'nama_role' => 'Guru BK'
        ]);

        // Pastikan Budi memiliki role Siswa
        $budi = User::where('email', 'budi@kredensia.id')->first();
        $this->assertTrue($budi->roles->contains('nama_role', 'Siswa'));

        // Pastikan Siti memiliki role Guru BK
        $siti = User::where('email', 'siti@kredensia.id')->first();
        $this->assertTrue($siti->roles->contains('nama_role', 'Guru BK'));

        fclose($tempFile);
    }
}
