<?php

declare(strict_types=1);

namespace App\Services;

class LayananJWT
{
    private static string $keyDefault = 'sso_secret_key_default_32_characters';

    /**
     * Membuat JSON Web Token untuk JIT Provisioning aplikasi turunan.
     */
    public static function buatToken(array $payload): string
    {
        // Header standar HS256
        $header = json_encode([
            'alg' => 'HS256',
            'typ' => 'JWT'
        ]);

        $base64UrlHeader = self::base64UrlEncode($header);
        $base64UrlPayload = self::base64UrlEncode(json_encode($payload));

        // Ambil secret key dari .env atau fallback ke default
        $secretKey = env('JWT_SECRET', self::$keyDefault);

        // Hitung tanda tangan HMAC-SHA256
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secretKey, true);
        $base64UrlSignature = self::base64UrlEncode($signature);

        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    /**
     * Konversi data ke format Base64Url (standar JWT).
     */
    private static function base64UrlEncode(string $data): string
    {
        return str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($data));
    }
}
