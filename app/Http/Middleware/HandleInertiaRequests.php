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
                    'id' => $user->id,
                    'nama_lengkap' => $user->nama_lengkap,
                    'email' => $user->email,
                    'nik' => $user->nik,
                    'nip_nis' => $user->nip_nis,
                    'no_telp' => $user->no_telp,
                    'jk' => $user->jk,
                    'peran' => $user->roles->pluck('nama_role')->toArray(),
                    'avatar_url' => $user->avatar_url,
                ] : null,
            ],
            'settings' => $settings,
        ];
    }
}
