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
     * Mengatur masa aktif cookie "Remember Me" menjadi maksimal 1 hari.
     * Jika pengguna aktif beraktivitas, masa aktif akan diperpanjang (sliding expiration) 1 hari lagi.
     * Jika tidak ada aktivitas hingga melewati batas 1 hari, pengguna akan otomatis terlogout.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $guard = Auth::guard('web');

        // Pastikan guard adalah SessionGuard yang memiliki recaller cookie
        if (method_exists($guard, 'getRecallerName')) {
            $recallerName = $guard->getRecallerName();

            // 1. Jika pengguna login menggunakan "Remember Me" dan aktif beraktivitas,
            // perpanjang umur cookie 1 hari lagi (1440 menit) sejak aktivitas terakhir.
            if (Auth::check() && $request->hasCookie($recallerName)) {
                $cookieValue = $request->cookie($recallerName);
                if ($cookieValue) {
                    Cookie::queue($recallerName, $cookieValue, 1440); // 1440 menit = 24 jam = 1 hari
                }
            }

            // 2. Jika cookie remember me baru saja didefinisikan (di-queue oleh Laravel) saat login pertama kali,
            // ubah durasi bawaan Laravel yang 'forever' (5 tahun) menjadi 1 hari saja.
            $queuedCookies = Cookie::getQueuedCookies();
            foreach ($queuedCookies as $cookie) {
                if ($cookie->getName() === $recallerName) {
                    Cookie::queue($recallerName, $cookie->getValue(), 1440); // Overwrite menjadi 1 hari
                    break;
                }
            }
        }

        return $response;
    }
}
