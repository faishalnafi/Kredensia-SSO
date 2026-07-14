<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\UserCorrection;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class DasborAdminController extends Controller
{
    public function indeks(): Response
    {
        // Cache statistik admin selama 60 detik
        $statistik = Cache::remember('admin:statistik', 60, function () {
            return [
                'totalPenggunaAktif' => User::where('is_active', true)->count(),
                'penggunaBaru' => User::where('created_at', '>=', now()->subDays(7))->count(),
                'notifikasiPengajuan' => UserCorrection::where('status_correction', 'pending')->count(),
            ];
        });

        return Inertia::render('Admin/Dasbor', [
            'statistik' => $statistik
        ]);
    }
}
