<?php

declare(strict_types=1);

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\RegisteredApp;
use Inertia\Inertia;
use Inertia\Response;

class KatalogAplikasiController extends Controller
{
    public function indeks(): Response
    {
        $user = \Illuminate\Support\Facades\Auth::user();
        $userRoleIds = $user->roles->pluck('id')->toArray();

        // Filter aplikasi yang aktif berdasarkan visibilitas global atau relasi peran
        $daftarAplikasi = RegisteredApp::where('is_active', true)
            ->where(function ($query) use ($userRoleIds) {
                $query->where('is_global_visibility', true)
                      ->orWhereHas('roles', function ($q) use ($userRoleIds) {
                          $q->whereIn('roles.id', $userRoleIds);
                      });
            })
            ->orderBy('sort_order')
            ->get();

        return Inertia::render('Superadmin/KatalogAplikasi/Indeks', [
            'daftarAplikasi' => $daftarAplikasi
        ]);
    }
}
