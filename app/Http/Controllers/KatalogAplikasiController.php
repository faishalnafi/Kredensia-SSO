<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\RegisteredApp;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

/**
 * @OA\Info(
 *     title="Portal SSO Sekolah Terpusat API",
 *     version="1.0.0",
 *     description="Dokumentasi API untuk Portal SSO Sekolah Terpusat"
 * )
 */
class KatalogAplikasiController extends Controller
{
    /**
     * @OA\Get(
     *     path="/dasbor",
     *     summary="Tampilkan Dasbor Katalog Aplikasi",
     *     description="Mengambil daftar aplikasi terdaftar yang diizinkan untuk pengguna terautentikasi berdasarkan RBAC.",
     *     operationId="ambilKatalogAplikasi",
     *     tags={"Katalog"},
     *     security={{"session": {}}},
     *     @OA\Response(
     *         response=200,
     *         description="Sukses mendapatkan katalog aplikasi.",
     *         @OA\JsonContent(
     *             type="object",
     *             @OA\Property(
     *                 property="daftarAplikasi",
     *                 type="array",
     *                 @OA\Items(
     *                     type="object",
     *                     @OA\Property(property="id", type="string", format="uuid", example="9c3a1b4d-ef56-78ab-cdef-1234567890ab"),
     *                     @OA\Property(property="nama_aplikasi", type="string", example="E-Learning Madrasah"),
     *                     @OA\Property(property="deskripsi", type="string", example="Platform pembelajaran online terintegrasi."),
     *                     @OA\Property(property="logo_url", type="string", nullable=true, example="/storage/logos/elearning.png"),
     *                     @OA\Property(property="icon_material", type="string", example="school"),
     *                     @OA\Property(property="warna_icon", type="string", example="#3b82f6"),
     *                     @OA\Property(property="portal_url", type="string", example="https://elearning.sekolah.sch.id"),
     *                     @OA\Property(property="open_in_new_tab", type="boolean", example=true)
     *                 )
     *             )
     *         )
     *     ),
     *     @OA\Response(
     *         response=401,
     *         description="Pengguna belum terautentikasi."
     *     )
     * )
     *
     * Tampilkan halaman dasbor katalog aplikasi.
     */
    public function tampilkanKatalog(Request $request): Response
    {
        $penggunaAktif = Auth::user();

        // Logika Filter RBAC (Role-Based Access Control)
        // Ambil ID semua peran yang dimiliki oleh pengguna aktif
        $peranPengguna = $penggunaAktif->roles->pluck('id')->toArray();

        // Tentukan apakah pengguna memiliki hak akses Super Admin
        $apakahSuperadmin = $penggunaAktif->hasRole('Super Admin') || $penggunaAktif->hasRole('superadmin');

        $daftarAplikasi = RegisteredApp::where('is_active', true)
            ->when(!$apakahSuperadmin, function ($query) use ($peranPengguna) {
                // Jika bukan Super Admin, filter visibilitas:
                // Harus bertipe global visibility ATAU role yang dipilih terikat di tabel app_roles
                $query->where(function ($subQuery) use ($peranPengguna) {
                    $subQuery->where('is_global_visibility', true)
                             ->orWhereHas('roles', function ($roleQuery) use ($peranPengguna) {
                                 $roleQuery->whereIn('roles.id', $peranPengguna);
                             });
                });
            })
            ->orderBy('sort_order', 'asc') // Urutan angka paling kecil tampil paling pertama
            ->get();

        return Inertia::render('Dashboard/Katalog', [
            'daftarAplikasi' => $daftarAplikasi
        ]);
    }
}
