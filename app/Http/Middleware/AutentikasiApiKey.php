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

namespace App\Http\Middleware;

use App\Models\KunciApi;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AutentikasiApiKey
{
    /**
     * Memvalidasi header Authorization: Bearer <prefix>_<token> ATAU X-API-Key: <prefix>_<token>
     */
    public function handle(Request $request, Closure $next): Response
    {
        # Mendukung X-API-Key header maupun Authorization Bearer token
        $bearerToken = $request->header('X-API-Key') ?? $request->bearerToken();

        if (!$bearerToken) {
            return response()->json([
                'status' => 'error',
                'pesan' => 'Kunci API diperlukan. Sertakan header X-API-Key atau Authorization Bearer.',
            ], 401);
        }

        # Format token wajib: <prefix>_<token_random>
        $parts = explode('_', $bearerToken, 2);
        if (count($parts) !== 2) {
            return response()->json([
                'status' => 'error',
                'pesan' => 'Format Kunci API tidak valid. Gunakan format <prefix>_<token>.',
            ], 401);
        }

        $prefix = $parts[0];

        # Cari kunci berdasarkan prefix dan nilai plain text kunci_api
        $kunciApi = KunciApi::where('prefix', $prefix)
            ->where('kunci_api', $bearerToken)
            ->first();

        if (!$kunciApi) {
            return response()->json([
                'status' => 'error',
                'pesan' => 'Kunci API tidak valid atau tidak ditemukan.',
            ], 401);
        }

        if (!$kunciApi->is_active) {
            return response()->json([
                'status' => 'error',
                'pesan' => 'Kunci API ini telah dinonaktifkan oleh administrator.',
            ], 403);
        }

        # Validasi domain jika bukan '*'
        if ($kunciApi->domain_diizinkan !== '*') {
            $origin = $request->header('Origin') ?? $request->header('Referer');
            $requestHost = null;

            if ($origin) {
                $parsed = parse_url($origin);
                $requestHost = $parsed['host'] ?? null;
            }

            if (!$requestHost) {
                $requestHost = $request->getHost();
            }

            # Normalisasi domain terdaftar (hilangkan http:// atau https:// jika ada)
            $allowedDomain = preg_replace('(^https?://)', '', $kunciApi->domain_diizinkan);
            $allowedDomain = explode(':', $allowedDomain)[0]; // hilangkan port jika ada

            # Normalisasi request host
            $requestHost = explode(':', $requestHost)[0];

            if (strtolower($requestHost) !== strtolower($allowedDomain)) {
                return response()->json([
                    'status' => 'error',
                    'pesan' => 'Akses ditolak. Kunci API ini hanya diizinkan untuk domain: ' . $kunciApi->domain_diizinkan,
                ], 403);
            }
        }

        # Perbarui waktu terakhir digunakan
        $kunciApi->update(['terakhir_digunakan' => now()]);

        # Simpan ke request
        $request->attributes->set('kunci_api', $kunciApi);

        return $next($request);
    }
}
