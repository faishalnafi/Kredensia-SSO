<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CegahBackCacheGuest
{
    /**
     * Menambahkan HTTP Cache-Control Headers agar browser DILARANG menyimpan snapshot halaman login/guest di BFCache.
     * Saat pengguna menekan tombol Back setelah login, browser dipaksa mengecek sesi ke server dan langsung dialihkan ke Dasbor.
     */
    public function handle(Request $request, Closure $next): Response
    {
        /** @var Response $response */
        $response = $next($request);

        $response->headers->set('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
        $response->headers->set('Pragma', 'no-cache');
        $response->headers->set('Expires', 'Sat, 01 Jan 1990 00:00:00 GMT');

        return $response;
    }
}
