<?php

declare(strict_types=1);

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use App\Models\RegisteredApp;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class BerandaController extends Controller
{
    public function indeks(): Response
    {
        // Cache statistik beranda selama 60 detik untuk mengurangi beban query
        $statistik = Cache::remember('superadmin:statistik', 60, function () {
            return [
                'totalPengguna' => User::count(),
                'totalPeran' => Role::count(),
                'totalAplikasi' => RegisteredApp::count(),
            ];
        });

        // Cache daftar pengguna terbaru selama 30 detik
        $penggunaTerbaru = Cache::remember('superadmin:pengguna-terbaru', 30, function () {
            return User::latest()->take(5)->get(['nama_lengkap', 'email', 'created_at']);
        });

        return Inertia::render('Superadmin/Beranda', [
            'statistik' => $statistik,
            'penggunaTerbaru' => $penggunaTerbaru
        ]);
    }
}
