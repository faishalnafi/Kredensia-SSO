<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BiodataWajibTest extends TestCase
{
    use RefreshDatabase;

    public function test_uncompleted_biodata_user_is_redirected_to_biodata_wajib_page(): void
    {
        $user = User::factory()->uncompletedBiodata()->create();

        $response = $this->actingAs($user)->get('/dasbor');

        $response->assertRedirect(route('biodata.wajib'));
    }

    public function test_user_can_access_biodata_wajib_page(): void
    {
        $user = User::factory()->uncompletedBiodata()->create();

        $response = $this->actingAs($user)->get('/biodata-wajib');

        $response->assertOk();
    }

    public function test_submitting_biodata_unlocks_access_to_dashboard(): void
    {
        $user = User::factory()->uncompletedBiodata()->create();

        $response = $this->actingAs($user)->post('/biodata-wajib', [
            'nama_lengkap' => 'Budi Santoso',
            'jk'           => 'L',
            'tgl_lahir'    => '2005-08-17',
            'nik'          => '3201123456789012',
            'nip_nis'      => '123456789',
            'no_telp'      => '081234567890',
            'alamat'       => 'Jl. Merdeka No. 45 Bandung',
        ]);

        $response->assertSessionHasNoErrors();
        $response->assertRedirect(route('dasbor'));

        $user->refresh();
        $this->assertNotNull($user->biodata_dilengkapi_pada);

        // After completing biodata, user can access dasbor directly
        $dashResponse = $this->actingAs($user)->get('/dasbor');
        $dashResponse->assertOk();
    }
}
