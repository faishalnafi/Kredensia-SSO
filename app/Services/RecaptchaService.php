<?php

namespace App\Services;

/**
 * ============================================================
 * SSO Sekolah - Portal Otentikasi Terpusat
 * Versi    : v1.0.0 | Production | Community Edition
 * Lisensi  : Open Source - Bebas Dikembangkan
 * Besutan  : Faishal Nafi Network (https://faishalnafi.com)
 * ============================================================
 */

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RecaptchaService
{
    /**
     * Verifikasi token reCAPTCHA Enterprise menggunakan REST API
     *
     * @param string $token Token dari frontend
     * @param string $expectedAction Action yang diharapkan (default: 'LOGIN')
     * @return bool True jika valid dan skor memadai, False jika gagal
     */
    public static function verify(?string $token, string $expectedAction = 'LOGIN'): bool
    {
        $projectId = env('RECAPTCHA_PROJECT_ID');
        $apiKey = env('RECAPTCHA_API_KEY');
        $siteKey = env('RECAPTCHA_SITE_KEY');

        if (!$projectId || !$apiKey || !$siteKey) {
            Log::warning('reCAPTCHA konfigurasi tidak lengkap. Melewati validasi.');
            return true; // Bypass jika tidak dikonfigurasi (misal di local)
        }

        if (empty($token)) {
            Log::error('reCAPTCHA Token kosong saat konfigurasi aktif.');
            return false;
        }

        $url = "https://recaptchaenterprise.googleapis.com/v1/projects/{$projectId}/assessments?key={$apiKey}";

        $payload = [
            'event' => [
                'token' => $token,
                'siteKey' => $siteKey,
                'expectedAction' => $expectedAction,
            ]
        ];

        try {
            $response = Http::post($url, $payload);
            
            if ($response->successful()) {
                $data = $response->json();
                
                // Cek apakah token valid
                $tokenProperties = $data['tokenProperties'] ?? [];
                if (!isset($tokenProperties['valid']) || $tokenProperties['valid'] !== true) {
                    Log::error('reCAPTCHA Invalid Token: ' . ($tokenProperties['invalidReason'] ?? 'Unknown'));
                    return false;
                }

                // Cek apakah action sesuai
                if (($tokenProperties['action'] ?? '') !== $expectedAction) {
                    Log::error('reCAPTCHA Action Mismatch: ' . ($tokenProperties['action'] ?? ''));
                    return false;
                }

                // Cek risk score (0.0 sangat berisiko, 1.0 sangat aman)
                $score = $data['riskAnalysis']['score'] ?? 0;
                
                // Anda bisa menyesuaikan threshold ini. 0.5 adalah batas menengah.
                if ($score < 0.5) {
                    Log::error("reCAPTCHA Terindikasi Bot. Skor: {$score}");
                    return false;
                }

                return true;
            } else {
                Log::error('reCAPTCHA API Error: ' . $response->body());
                // Jika API error (misal salah kunci), biarkan lolos atau tolak?
                // Lebih baik tolak agar ketahuan ada yang salah dengan API Key
                return false;
            }
        } catch (\Exception $e) {
            Log::error('reCAPTCHA Exception: ' . $e->getMessage());
            return false;
        }
    }
}
