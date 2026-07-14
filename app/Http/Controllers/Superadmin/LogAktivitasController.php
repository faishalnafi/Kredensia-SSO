<?php

declare(strict_types=1);

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\LogAktivitas;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LogAktivitasController extends Controller
{
    /**
     * Tampilkan riwayat log aktivitas pengguna.
     */
    public function indeks(Request $request): Response
    {
        $query = LogAktivitas::with('user:id,nama_lengkap,email')
            ->orderBy('created_at', 'desc');

        // Filter pencarian
        if ($request->filled('cari')) {
            $cari = $request->cari;
            $query->where(function ($q) use ($cari) {
                $q->where('aktivitas', 'like', "%{$cari}%")
                  ->orWhere('email', 'like', "%{$cari}%")
                  ->orWhere('ip_address', 'like', "%{$cari}%")
                  ->orWhereHas('user', function ($userQuery) use ($cari) {
                      $userQuery->where('nama_lengkap', 'like', "%{$cari}%");
                  });
            });
        }

        // Paginasi dengan query parameter tetap dipertahankan
        $daftarLog = $query->paginate(15)->withQueryString();

        return Inertia::render('Superadmin/LogAktivitas/Indeks', [
            'daftarLog' => $daftarLog,
            'filters'   => $request->only(['cari'])
        ]);
    }
}
