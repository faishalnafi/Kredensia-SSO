<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PeriksaPeranAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (!\Illuminate\Support\Facades\Auth::check()) {
            return redirect()->route('login');
        }

        $user = \Illuminate\Support\Facades\Auth::user();
        if (!$user->hasRole('Admin') && !$user->hasRole('admin') && !$user->hasRole('Super Admin') && !$user->hasRole('superadmin')) {
            abort(403, 'Akses ditolak. Hanya Admin atau Superadmin yang diizinkan mengakses halaman ini.');
        }

        return $next($request);
    }
}
