<?php

declare(strict_types=1);

/**
 * ============================================================
 * SSO Sekolah - Portal Otentikasi Terpusat
 * Versi    : v1.0.0 | Production | Community Edition
 * Lisensi  : Open Source - Bebas Dikembangkan
 * Besutan  : Faishal Nafi Network (https://faishalnafi.com)
 * ============================================================
 */

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Kelas;
use App\Models\Role;
use App\Models\TahunPelajaran;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApiDataController extends Controller
{
    /**
     * GET /api/v1/test
     * Endpoint pengetesan konektivitas & verifikasi domain terdaftar.
     */
    public function testKoneksi(Request $request): JsonResponse
    {
        $kunci = $request->attributes->get('kunci_api');

        # Ambil IP request
        $ip = $request->ip();

        # Cari request domain source (Origin/Referer/Host)
        $origin        = $request->header('Origin');
        $referer       = $request->header('Referer');
        $domainSource  = 'host';
        $requestDomain = $request->getHost();

        if ($origin) {
            $domainSource  = 'origin';
            $parsed        = parse_url($origin);
            $requestDomain = $parsed['host'] ?? $requestDomain;
        } elseif ($referer) {
            $domainSource  = 'referer';
            $parsed        = parse_url($referer);
            $requestDomain = $parsed['host'] ?? $requestDomain;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'status'      => 'ok',
                'server_time' => now()->timezone('Asia/Jakarta')->toIso8601String(),
            ],
            'meta' => [
                'app_name'              => $kunci->nama_aplikasi,
                'request_domain'        => $kunci->domain_diizinkan,
                'request_domain_source' => $domainSource,
                'origin'                => $origin,
                'referer'               => $referer,
                'ip'                    => $ip,
            ]
        ]);
    }

    /**
     * GET /api/v1/members
     * Daftar member SSO beserta kelas dan tahun pelajaran.
     * Filter: search, email, role, kelas_id, is_active, page, per_page
     */
    public function daftarMembers(Request $request): JsonResponse
    {
        $query = User::with(['roles:id,nama_role', 'kelas', 'kelas.tahunPelajaran']);

        # Filter pencarian pencocokan umum (nama, NIK, NISN/NIP, email)
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('nama_lengkap', 'like', "%{$search}%")
                  ->orWhere('nik', 'like', "%{$search}%")
                  ->orWhere('nip_nis', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        # Filter spesifik email
        if ($request->filled('email')) {
            $query->where('email', $request->input('email'));
        }

        # Filter spesifik role
        if ($request->filled('role')) {
            $filterRole = $request->input('role');
            $query->whereHas('roles', function ($q) use ($filterRole) {
                $q->whereRaw('LOWER(nama_role) = ?', [strtolower($filterRole)]);
            });
        }

        # Filter spesifik kelas berdasarkan UUID kelas
        if ($request->filled('kelas_id')) {
            $query->where('kelas_id', $request->input('kelas_id'));
        }

        # Filter status aktif/nonaktif
        if ($request->filled('is_active')) {
            $query->where('is_active', filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN));
        }

        $perPage = min((int) $request->input('per_page', 50), 100);

        $data = $query->select(['id', 'nama_lengkap', 'email', 'nik', 'nip_nis', 'jk', 'no_telp', 'tgl_lahir', 'is_active', 'claimed_at', 'created_at', 'updated_at', 'kelas_id'])
            ->orderBy('nama_lengkap')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data'    => $data->items(),
            'meta'    => [
                'total'     => $data->total(),
                'page'      => $data->currentPage(),
                'per_page'  => $data->perPage(),
                'last_page' => $data->lastPage(),
            ],
        ]);
    }

    /**
     * GET /api/v1/members/{id}
     * Detail satu member beserta data kelas dan tahun pelajaran aktif.
     */
    public function detailMember(string $id): JsonResponse
    {
        $pengguna = User::with(['roles:id,nama_role', 'kelas', 'kelas.tahunPelajaran'])
            ->select(['id', 'nama_lengkap', 'email', 'nik', 'nip_nis', 'jk', 'no_telp', 'tgl_lahir', 'is_active', 'claimed_at', 'created_at', 'updated_at', 'kelas_id'])
            ->find($id);

        if (!$pengguna) {
            return response()->json(['success' => false, 'pesan' => 'Member tidak ditemukan.'], 404);
        }

        return response()->json(['success' => true, 'data' => $pengguna]);
    }

    /**
     * GET /api/v1/kelas
     * Daftar semua kelas beserta info tahun pelajaran & wali kelas.
     * Filter: tahun_pelajaran_id, tingkat, aktif=true (hanya TP aktif)
     */
    public function daftarKelas(Request $request): JsonResponse
    {
        $query = Kelas::with([
            'tahunPelajaran:id,tahun_mulai,tahun_selesai,semester,is_aktif',
            'waliKelas:id,nama_lengkap,nip_nis',
        ]);

        # Filter berdasarkan tahun pelajaran UUID
        if ($request->filled('tahun_pelajaran_id')) {
            $query->where('tahun_pelajaran_id', $request->input('tahun_pelajaran_id'));
        }

        # Filter berdasarkan tingkat (misal: X, XI, XII)
        if ($request->filled('tingkat')) {
            $query->where('tingkat', $request->input('tingkat'));
        }

        # Shortcut: hanya tampilkan kelas pada tahun pelajaran yang aktif
        if ($request->boolean('aktif', false)) {
            $query->whereHas('tahunPelajaran', function ($q) {
                $q->where('is_aktif', true);
            });
        }

        $data = $query->select(['id', 'nama_kelas', 'tingkat', 'jurusan', 'tahun_pelajaran_id', 'wali_kelas_id', 'created_at'])
            ->orderBy('tingkat')
            ->orderBy('nama_kelas')
            ->get()
            ->map(function ($kelas) {
                # Tambahkan jumlah siswa pada setiap kelas
                $kelas->jumlah_siswa = User::where('kelas_id', $kelas->id)->count();
                return $kelas;
            });

        return response()->json([
            'success' => true,
            'data'    => $data,
            'meta'    => ['total' => $data->count()],
        ]);
    }

    /**
     * GET /api/v1/kelas/{id}
     * Detail satu kelas beserta daftar lengkap siswa di dalamnya.
     */
    public function detailKelas(string $id): JsonResponse
    {
        $kelas = Kelas::with([
            'tahunPelajaran:id,tahun_mulai,tahun_selesai,semester,is_aktif',
            'waliKelas:id,nama_lengkap,nip_nis',
        ])->find($id);

        if (!$kelas) {
            return response()->json(['success' => false, 'pesan' => 'Kelas tidak ditemukan.'], 404);
        }

        # Ambil daftar siswa di kelas ini
        $siswa = User::with('roles:id,nama_role')
            ->select(['id', 'nama_lengkap', 'email', 'nik', 'nip_nis', 'jk', 'tgl_lahir', 'is_active', 'kelas_id'])
            ->where('kelas_id', $id)
            ->orderBy('nama_lengkap')
            ->get();

        $result             = $kelas->toArray();
        $result['jumlah_siswa'] = $siswa->count();
        $result['siswa']        = $siswa;

        return response()->json(['success' => true, 'data' => $result]);
    }

    /**
     * GET /api/v1/tahun-pelajaran
     * Daftar semua tahun pelajaran. Filter: is_aktif=true untuk yang aktif saja.
     */
    public function daftarTahunPelajaran(Request $request): JsonResponse
    {
        $query = TahunPelajaran::withCount('kelas');

        # Filter hanya yang aktif
        if ($request->filled('is_aktif')) {
            $query->where('is_aktif', filter_var($request->input('is_aktif'), FILTER_VALIDATE_BOOLEAN));
        }

        $data = $query->select(['id', 'tahun_mulai', 'tahun_selesai', 'semester', 'is_aktif', 'created_at'])
            ->orderByDesc('tahun_mulai')
            ->orderByDesc('tahun_selesai')
            ->get()
            ->map(function ($tp) {
                $tp->label = "{$tp->tahun_mulai}/{$tp->tahun_selesai} - {$tp->semester}";
                return $tp;
            });

        return response()->json([
            'success' => true,
            'data'    => $data,
            'meta'    => ['total' => $data->count()],
        ]);
    }

    /**
     * GET /api/v1/tahun-pelajaran/{id}
     * Detail satu tahun pelajaran beserta daftar kelas di dalamnya.
     */
    public function detailTahunPelajaran(string $id): JsonResponse
    {
        $tp = TahunPelajaran::with([
            'kelas:id,nama_kelas,tingkat,jurusan,tahun_pelajaran_id,wali_kelas_id',
            'kelas.waliKelas:id,nama_lengkap,nip_nis',
        ])->find($id);

        if (!$tp) {
            return response()->json(['success' => false, 'pesan' => 'Tahun pelajaran tidak ditemukan.'], 404);
        }

        $tp->label = "{$tp->tahun_mulai}/{$tp->tahun_selesai} - {$tp->semester}";

        return response()->json(['success' => true, 'data' => $tp]);
    }

    /**
     * GET /api/v1/data/peran
     * Daftar semua peran/role beserta jumlah penggunanya.
     */
    public function daftarPeran(): JsonResponse
    {
        $peran = Role::select(['id', 'nama_role', 'is_active', 'created_at'])
            ->withCount('users')
            ->orderBy('nama_role')
            ->get();

        return response()->json(['success' => true, 'data' => $peran]);
    }

    /**
     * GET /api/v1/data/statistik
     * Ringkasan statistik data sistem SSO.
     */
    public function statistik(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'total_pengguna'          => User::count(),
                'total_pengguna_aktif'    => User::where('is_active', true)->count(),
                'total_pengguna_terklaim' => User::whereNotNull('claimed_at')->count(),
                'total_peran'             => Role::count(),
                'total_kelas'             => Kelas::count(),
                'total_tahun_pelajaran'   => TahunPelajaran::count(),
                'tahun_pelajaran_aktif'   => TahunPelajaran::where('is_aktif', true)->value('id'),
            ],
        ]);
    }
}
