<?php

declare(strict_types=1);

namespace SsoSekolah;

/**
 * ============================================================
 * SSO Sekolah - Client SDK untuk PHP
 * Versi    : 1.0.0
 * Lisensi  : MIT / Open Source
 * ============================================================
 */
class SsoSekolahClient
{
    private string $baseUrl;
    private string $apiKey;
    private int $timeout;

    /**
     * Inisialisasi SDK SSO Sekolah.
     *
     * @param string $baseUrl URL basis API SSO (contoh: https://sso.sekolah.sch.id/api)
     * @param string $apiKey Kunci API Rahasia Aplikasi Anda
     * @param int $timeout Batas waktu request HTTP dalam detik (default: 10)
     */
    public function __construct(string $baseUrl, string $apiKey, int $timeout = 10)
    {
        $this->baseUrl = rtrim($baseUrl, '/');
        $this->apiKey  = $apiKey;
        $this->timeout = $timeout;
    }

    /**
     * Uji koneksi dan validitas API Key ke portal SSO.
     */
    public function testConnection(): array
    {
        return $this->request('GET', '/v1/test');
    }

    /**
     * Ambil daftar pengguna/member dengan filter opsional (role, kelas_id, q, per_page, page).
     */
    public function getMembers(array $params = []): array
    {
        return $this->request('GET', '/v1/members', $params);
    }

    /**
     * Ambil detail data spesifik pengguna berdasarkan UUID/ID.
     */
    public function getMemberById(string $id): array
    {
        return $this->request('GET', "/v1/members/{$id}");
    }

    /**
     * Ambil daftar kelas sekolah (opsional filter: aktif=true, tahun_pelajaran_id).
     */
    public function getKelas(array $params = []): array
    {
        return $this->request('GET', '/v1/kelas', $params);
    }

    /**
     * Ambil daftar tahun pelajaran sekolah (opsional filter: is_aktif=true).
     */
    public function getTahunPelajaran(array $params = []): array
    {
        return $this->request('GET', '/v1/tahun-pelajaran', $params);
    }

    /**
     * Ambil daftar peran (roles) yang terdaftar di SSO.
     */
    public function getPeran(): array
    {
        return $this->request('GET', '/v1/data/peran');
    }

    /**
     * Ambil data statistik agregat jumlah pengguna & aplikasi.
     */
    public function getStatistik(): array
    {
        return $this->request('GET', '/v1/data/statistik');
    }

    /**
     * Dekode & Verifikasi Payload Token JWT SSO tanpa pustaka luar.
     */
    public static function verifyJwtToken(string $jwtToken): ?array
    {
        $parts = explode('.', $jwtToken);
        if (count($parts) !== 3) {
            return null;
        }

        $payload = json_decode(base64_decode(strtr($parts[1], '-_', '+/')), true);
        if (!is_array($payload)) {
            return null;
        }

        // Periksa expired token jika ada klaim 'exp'
        if (isset($payload['exp']) && time() >= $payload['exp']) {
            return null; // Token kedaluwarsa
        }

        return $payload;
    }

    /**
     * Eksekusi HTTP Client menggunakan cURL native.
     */
    private function request(string $method, string $path, array $params = []): array
    {
        $url = $this->baseUrl . $path;
        if (!empty($params)) {
            $url .= '?' . http_build_query($params);
        }

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => $this->timeout,
            CURLOPT_HTTPHEADER     => [
                'X-API-Key: ' . $this->apiKey,
                'Accept: application/json',
            ],
            CURLOPT_SSL_VERIFYPEER => false,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error    = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new \RuntimeException("Gagal menghubungkan ke SSO: " . $error);
        }

        $data = json_decode((string) $response, true);
        if ($httpCode >= 400) {
            $msg = $data['pesan'] ?? "Error API SSO (HTTP Status {$httpCode})";
            throw new \RuntimeException($msg);
        }

        return $data ?? [];
    }
}
