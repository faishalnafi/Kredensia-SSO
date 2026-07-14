<?php

declare(strict_types=1);

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\PengaturanSistem;
use Illuminate\Contracts\View\View;
use Inertia\Inertia;
use Inertia\Response;

class DokumentasiApiController extends Controller
{
    /**
     * Tampilkan halaman dokumentasi API Swagger dalam portal (dengan sidebar).
     */
    public function indeks(): Response
    {
        return Inertia::render('Superadmin/DokumentasiApi');
    }

    /**
     * Tampilkan halaman dokumentasi API Swagger mandiri (tanpa sidebar/menu).
     */
    public function standalone(): View
    {
        $settings = PengaturanSistem::first();
        $favicon = $settings ? $settings->favicon_url : '/favicon.ico';

        return view('swagger', [
            'favicon' => $favicon
        ]);
    }
}
