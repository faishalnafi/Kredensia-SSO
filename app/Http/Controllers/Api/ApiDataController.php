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
use App\Models\Role;
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
        $origin = $request->header('Origin');
        $referer = $request->header('Referer');
        $domainSource = 'host';
        $requestDomain = $request->getHost();

        if ($origin) {
            $domainSource = 'origin';
            $parsed = parse_url($origin);
            $requestDomain = $parsed['host'] ?? $requestDomain;
        } elseif ($referer) {
            $domainSource = 'referer';
            $parsed = parse_url($referer);
            $requestDomain = $parsed['host'] ?? $requestDomain;
        }

        return response()->json([
            'success' => true,
            'data' => [
                'status' => 'ok',
                'server_time' => now()->timezone('Asia/Jakarta')->toIso8601String(),
            ],
            'meta' => [
                'app_name' => $kunci->nama_aplikasi,
                'request_domain' => $kunci->domain_diizinkan,
                'request_domain_source' => $domainSource,
                'origin' => $origin,
                'referer' => $referer,
                'ip' => $ip,
            ]
        ]);
    }

    /**
     * GET /api/v1/members
     * Mengambil daftar member SSO.
     */
    public function daftarMembers(Request $request): JsonResponse
    {
        $query = User::with('roles:id,nama_role');

        # Filter pencarian pencocokan umum
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('nama_lengkap', 'like', "%{$search}%")
                  ->orWhere('nik', 'like', "%{$search}%")
                  ->orWhere('nip_nis', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        # Filter spesifik email Google
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

        $perPage = min((int) $request->input('per_page', 50), 100);

        $data = $query->select(['id', 'nama_lengkap', 'email', 'nik', 'nip_nis', 'jk', 'no_telp', 'tgl_lahir', 'is_active', 'claimed_at', 'created_at', 'updated_at'])
            ->orderBy('nama_lengkap')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => $data->items(),
            'meta' => [
                'total' => $data->total(),
                'page' => $data->currentPage(),
                'per_page' => $data->perPage(),
                'last_page' => $data->lastPage(),
            ],
        ]);
    }

    /**
     * GET /api/v1/members/{id}
     * Detail satu member.
     */
    public function detailMember(string $id): JsonResponse
    {
        $pengguna = User::with('roles:id,nama_role')
            ->select(['id', 'nama_lengkap', 'email', 'nik', 'nip_nis', 'jk', 'no_telp', 'tgl_lahir', 'is_active', 'claimed_at', 'created_at', 'updated_at'])
            ->find($id);

        if (!$pengguna) {
            return response()->json(['success' => false, 'pesan' => 'Member tidak ditemukan.'], 404);
        }

        return response()->json(['success' => true, 'data' => $pengguna]);
    }

    /**
     * GET /api/v1/data/peran (untuk backward compatibility / utilitas lainnya)
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
     * GET /api/v1/data/statistik (untuk backward compatibility / utilitas lainnya)
     */
    public function statistik(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'total_pengguna' => User::count(),
                'total_pengguna_aktif' => User::where('is_active', true)->count(),
                'total_pengguna_terklaim' => User::whereNotNull('claimed_at')->count(),
                'total_peran' => Role::count(),
            ],
        ]);
    }
}
