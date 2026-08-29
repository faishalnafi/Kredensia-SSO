<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        // Otomatis simpan GPS dari input, cookie, atau header ke dalam session jika ada
        $lat = $request->input('latitude')
            ?? ($_COOKIE['sso_user_lat'] ?? null)
            ?? $request->cookie('sso_user_lat')
            ?? $request->header('X-GPS-Latitude');
        $lng = $request->input('longitude')
            ?? ($_COOKIE['sso_user_lng'] ?? null)
            ?? $request->cookie('sso_user_lng')
            ?? $request->header('X-GPS-Longitude');

        if ($lat !== null && $lng !== null && is_numeric($lat) && is_numeric($lng)) {
            session([
                'user_latitude' => (float) $lat,
                'user_longitude' => (float) $lng,
            ]);
        }
        
        $recaptchaSiteKey = (env('RECAPTCHA_SITE_KEY') && env('RECAPTCHA_PROJECT_ID') && env('RECAPTCHA_API_KEY')) 
            ? env('RECAPTCHA_SITE_KEY') 
            : null;

        $settings = Cache::remember('platform_settings', 3600, function() use ($recaptchaSiteKey) {
            try {
                $data = \App\Models\PengaturanSistem::first();
                return $data ? [
                    'nama_aplikasi' => $data->nama_aplikasi,
                    'logo_primer_url' => $data->logo_primer_url,
                    'favicon_url' => $data->favicon_url,
                    'recaptcha_site_key' => $recaptchaSiteKey,
                ] : [
                    'nama_aplikasi' => 'SSO Sekolah',
                    'logo_primer_url' => null,
                    'favicon_url' => '/favicon.ico',
                    'recaptcha_site_key' => $recaptchaSiteKey,
                ];
            } catch (\Exception $e) {
                // Return default settings if table doesn't exist yet (during setup)
                return [
                    'nama_aplikasi' => 'SSO Sekolah',
                    'logo_primer_url' => null,
                    'favicon_url' => '/favicon.ico',
                    'recaptcha_site_key' => $recaptchaSiteKey,
                ];
            }
        });

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id'           => $user->id,
                    'nama_lengkap' => $user->nama_lengkap,
                    'email'        => $user->email,
                    'nik'          => $user->nik,
                    'nip_nis'      => $user->nip_nis,
                    'no_telp'      => $user->no_telp,
                    'jk'           => $user->jk,
                    'alamat'       => $user->alamat,
                    'peran'        => $user->roles->pluck('nama_role')->toArray(),
                    'avatar_url'   => $user->avatar_url,
                    // Prop wajib untuk fitur lock menu:
                    // true  = biodata belum pernah disubmit → menu dikunci
                    // false = sudah submit atau user adalah admin/superadmin
                    'biodata_belum_lengkap' => $this->periksaBiodataBelumLengkap($user),
                ] : null,
            ],
            'settings' => $settings,
            'flash'    => [
                'sukses' => $request->session()->get('sukses'),
                'info'   => $request->session()->get('info'),
                'error'  => $request->session()->get('error'),
            ],
        ];
    }

    /**
     * Cek apakah biodata pengguna belum dilengkapi.
     * Admin dan Super Admin selalu dianggap tidak perlu mengisi biodata.
     */
    private function periksaBiodataBelumLengkap($user): bool
    {
        if (!$user) return false;

        # Load roles jika belum
        if (!$user->relationLoaded('roles')) {
            $user->load('roles');
        }

        $namaPeran = $user->roles->pluck('nama_role')->toArray();
        $peranDibebaskan = ['Super Admin', 'Admin', 'superadmin', 'admin'];

        foreach ($peranDibebaskan as $peran) {
            if (in_array($peran, $namaPeran, true)) {
                return false; // Admin tidak perlu biodata
            }
        }

        return !$user->biodataSudahDilengkapi();
    }
}
