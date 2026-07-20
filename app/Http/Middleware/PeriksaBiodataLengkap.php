<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware PeriksaBiodataLengkap
 * 
 * Memeriksa apakah pengguna umum (non-admin) sudah mengisi form biodata wajib.
 * Jika belum, redirect ke halaman /biodata-wajib.
 * Admin dan Super Admin dibebaskan dari pemeriksaan ini.
 */
class PeriksaBiodataLengkap
{
    /**
     * Peran yang dibebaskan dari pengecekan biodata wajib.
     */
    private const PERAN_DIBEBASKAN = ['Super Admin', 'Admin', 'superadmin', 'admin'];

    /**
     * Rute yang diizinkan diakses meskipun biodata belum lengkap.
     */
    private const RUTE_DIIZINKAN = [
        'biodata.wajib',
        'biodata.simpan',
        'logout',
        'profile.edit',
        'profile.update',
        'profile.destroy',
        'keamanan.indeks',
        'keamanan.ajukan_perubahan',
        'keamanan.sesi.hapus',
        'keamanan.sesi.hapus_lainnya',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        # Lewati jika belum login
        if (!$user) {
            return $next($request);
        }

        # Load roles jika belum dimuat
        if (!$user->relationLoaded('roles')) {
            $user->load('roles');
        }

        # Bebaskan Admin dan Super Admin dari pengecekan ini
        $namaPeran = $user->roles->pluck('nama_role')->toArray();
        foreach (self::PERAN_DIBEBASKAN as $peran) {
            if (in_array($peran, $namaPeran, true)) {
                return $next($request);
            }
        }

        # Bebaskan jika sedang mengakses rute yang diizinkan
        $ruteAktif = $request->route()?->getName();
        if ($ruteAktif && in_array($ruteAktif, self::RUTE_DIIZINKAN, true)) {
            return $next($request);
        }

        # Jika biodata belum pernah disubmit → redirect ke halaman biodata wajib
        if (!$user->biodataSudahDilengkapi()) {
            # Izinkan Inertia partial reload agar tidak infinite redirect
            if ($request->header('X-Inertia')) {
                return response()->json(['location' => route('biodata.wajib')], 409)
                    ->header('X-Inertia-Location', route('biodata.wajib'));
            }

            return redirect()->route('biodata.wajib')
                ->with('info', 'Silakan lengkapi biodata Anda terlebih dahulu untuk mengakses sistem.');
        }

        return $next($request);
    }
}
