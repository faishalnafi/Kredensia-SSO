<?php

declare(strict_types=1);

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class ProfilSayaController extends Controller
{
    public function indeks(): Response
    {
        $pengguna = Auth::user();

        return Inertia::render('Superadmin/ProfilSaya/Indeks', [
            'pengguna' => $pengguna
        ]);
    }
}
