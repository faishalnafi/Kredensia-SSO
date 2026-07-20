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
        $tpAktif = \App\Models\TahunPelajaran::where('is_aktif', true)->first();

        return Inertia::render('Pengguna/ImportPengguna', [
            'adaTahunPelajaranAktif' => (bool)$tpAktif,
            'tahunPelajaranAktif' => $tpAktif ? "{$tpAktif->tahun_mulai}/{$tpAktif->tahun_selesai}" : null,
        ]);
    }
}
