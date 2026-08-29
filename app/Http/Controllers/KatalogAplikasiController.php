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

    /**
     * Catat aktivitas ketika pengguna mengakses/membuka aplikasi beserta koordinat GPS (latitude & longitude).
     */
    public function catatAplikasiAkses(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'nama_aplikasi' => ['required', 'string', 'max:255'],
            'latitude'      => ['nullable', 'numeric'],
            'longitude'     => ['nullable', 'numeric'],
        ]);

        $namaApp = $request->input('nama_aplikasi');
        $lat = $request->filled('latitude') ? (float) $request->input('latitude') : null;
        $lng = $request->filled('longitude') ? (float) $request->input('longitude') : null;

        if ($lat !== null && $lng !== null) {
            session([
                'user_latitude'  => $lat,
                'user_longitude' => $lng,
            ]);
        }

        \App\Services\LayananLogAktivitas::catat(
            'Membuka aplikasi: ' . $namaApp,
            null,
            null,
            $lat,
            $lng
        );

        return response()->json([
            'success'   => true,
            'latitude'  => $lat,
            'longitude' => $lng,
        ]);
    }

    /**
     * Uji kesehatan server aplikasi (Ping Health Check Cloudflare Style) sebelum pengalihan.
     * Jika HTTP Status == 200 (atau 2xx/3xx) -> online = true, catat log audit & alihkan.
     * Jika HTTP Status 4xx/5xx/Timeout -> online = false, kirim status server down.
     */
    public function pingDanCatatAplikasiAkses(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'app_id'        => ['required', 'string'],
            'latitude'      => ['nullable', 'numeric'],
            'longitude'     => ['nullable', 'numeric'],
        ]);

        $app = RegisteredApp::find($request->app_id);

        if (!$app) {
            return response()->json([
                'online'  => false,
                'message' => 'Aplikasi tidak ditemukan di sistem.',
            ], 404);
        }

        $lat = $request->filled('latitude') ? (float) $request->input('latitude') : null;
        $lng = $request->filled('longitude') ? (float) $request->input('longitude') : null;

        if ($lat !== null && $lng !== null) {
            session([
                'user_latitude'  => $lat,
                'user_longitude' => $lng,
            ]);
        }

        // URL target pengujian (login_callback_url atau portal_url)
        $targetUrl = $app->login_callback_url ?: $app->portal_url;
        $waktuMulai = microtime(true);
        $online = false;
        $statusCode = 0;
        $pesan = '';

        try {
            // Gunakan HTTP Client Laravel dengan timeout 4.0 detik & tanpa verifikasi SSL (tanpa error SSL internal)
            $response = \Illuminate\Support\Facades\Http::withoutVerifying()
                ->timeout(4)
                ->connectTimeout(3)
                ->get($targetUrl);

            $statusCode = $response->status();
            $responseTimeMs = (int) round((microtime(true) - $waktuMulai) * 1000);

            // Respon dianggap ONLINE jika kodenya 2xx atau 3xx (200 OK, 301, 302, dll)
            if ($response->successful() || $response->redirect()) {
                $online = true;
                $pesan = "Server aplikasi {$app->nama_aplikasi} merespon dengan baik (HTTP {$statusCode} OK).";

                \App\Services\LayananLogAktivitas::catat(
                    'Membuka aplikasi: ' . $app->nama_aplikasi,
                    null,
                    null,
                    $lat,
                    $lng
                );
            } else {
                $online = false;
                $pesan = "Server aplikasi {$app->nama_aplikasi} mengembalikan respon error HTTP {$statusCode}.";

                \App\Services\LayananLogAktivitas::catat(
                    'Gagal membuka aplikasi ' . $app->nama_aplikasi . ' (Server Error HTTP ' . $statusCode . ')',
                    null,
                    null,
                    $lat,
                    $lng
                );
            }
        } catch (\Throwable $e) {
            $responseTimeMs = (int) round((microtime(true) - $waktuMulai) * 1000);
            $online = false;
            $statusCode = 502; // Bad Gateway / Server Offline
            $pesan = "Koneksi ke server {$app->nama_aplikasi} mengalami timeout (waktu habis) atau server offline.";

            \App\Services\LayananLogAktivitas::catat(
                'Gagal membuka aplikasi ' . $app->nama_aplikasi . ' (Server Down / Offline)',
                null,
                null,
                $lat,
                $lng
            );
        }

        $directUrl = $app->login_callback_url 
            ? route('login', ['client_id' => $app->id]) 
            : $app->portal_url;

        return response()->json([
            'online'           => $online,
            'status_code'      => $statusCode,
            'response_time_ms' => $responseTimeMs ?? 0,
            'nama_aplikasi'    => $app->nama_aplikasi,
            'portal_url'       => $app->portal_url,
            'target_url'       => $directUrl,
            'open_in_new_tab'  => (bool) $app->open_in_new_tab,
            'pesan'            => $pesan,
        ]);
    }

    /**
     * Tampilkan halaman error Cloudflare-style jika server aplikasi tujuan down.
     */
    public function halamanServerDown(Request $request, string $id): Response
    {
        $app = RegisteredApp::findOrFail($id);
        $targetUrl = $app->login_callback_url ? route('login', ['client_id' => $app->id]) : $app->portal_url;

        $aplikasiInfo = [
            'id'               => $app->id,
            'app_id'           => $app->id,
            'nama_aplikasi'    => $app->nama_aplikasi,
            'portal_url'       => $app->portal_url,
            'target_url'       => $targetUrl,
            'open_in_new_tab'  => (bool) $app->open_in_new_tab,
            'status_code'      => (int) $request->query('status', 502),
            'response_time_ms' => (int) $request->query('latency', 4000),
            'pesan'            => $request->query('pesan', 'Server aplikasi tidak merespon pengujian kesehatan (HTTP 200 OK).'),
        ];

        return Inertia::render('Errors/ServerDown', [
            'aplikasiInfo' => $aplikasiInfo,
        ]);
    }
}
