<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cookie;
use Symfony\Component\HttpFoundation\Response;

class PerpanjangSesiRememberMe
{
    /**
     * Mengatur masa aktif sesi & cookie secara dinamis (Sliding Expiration):
     * 1. Dicentang "Ingat Saya": SEUMUR HIDUP / FOREVER (5 Tahun = 2.628.000 menit). Tidak pernah terlogout.
     * 2. TANPA Centang "Ingat Saya": 31 HARI (44.640 menit) dengan perpanjangan otomatis (sliding expiration) setiap kali pengguna beraktivitas.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $guard = Auth::guard('web');
        $isRememberForever = false;

        if (Auth::check()) {
            if (method_exists($guard, 'getRecallerName')) {
                $recallerName = $guard->getRecallerName();
                if ($request->hasCookie($recallerName) || $request->session()->get('is_remember_forever') === true) {
                    $isRememberForever = true;
                }
            }

            // Set lifetime sesi dinamis sebelum request diproses:
            // 2.628.000 menit = 5 Tahun (Forever / Seumur Hidup)
            // 44.640 menit = 31 Hari (Sliding Expiration per aktivitas)
            $lifetime = $isRememberForever ? 2628000 : 44640;
            
            config([
                'session.lifetime' => $lifetime,
                'session.expire_on_close' => false,
            ]);
        }

        $response = $next($request);

        if (Auth::check() && method_exists($guard, 'getRecallerName')) {
            $recallerName = $guard->getRecallerName();

            // Jika "Ingat Saya" aktif, perpanjang cookie remember me ke 5 TAHUN (Forever = 2.628.000 menit)
            if ($isRememberForever) {
                if ($request->hasCookie($recallerName)) {
                    $cookieValue = $request->cookie($recallerName);
                    if ($cookieValue) {
                        Cookie::queue($recallerName, $cookieValue, 2628000);
                    }
                }

                $queuedCookies = Cookie::getQueuedCookies();
                foreach ($queuedCookies as $cookie) {
                    if ($cookie->getName() === $recallerName) {
                        Cookie::queue($recallerName, $cookie->getValue(), 2628000);
                        break;
                    }
                }
            }
        }

        return $response;
    }
}
