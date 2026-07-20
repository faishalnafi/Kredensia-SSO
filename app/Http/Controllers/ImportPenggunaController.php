<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class ImportPenggunaController extends Controller
{
    /**
     * Tampilkan halaman import pengguna.
     */
    public function indeks(): Response
    {
        return Inertia::render('Pengguna/ImportPengguna');
    }
}
