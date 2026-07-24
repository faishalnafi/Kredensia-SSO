<?php

declare(strict_types=1);

namespace App\Services;

use App\Jobs\CatatLogAktivitas;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class LayananLogAktivitas
{
    /**
     * Catat aktivitas pengguna ke database (secara asinkron lewat queue).
     * Dibungkus dengan try-catch agar jika dispatch log gagal, alur utama aplikasi tidak terganggu.
     */
    public static function catat(string $aktivitas, ?string $email = null, ?string $userId = null): void
    {
        try {
            $user = Auth::user();
            
            $idTarget = $userId ?: ($user ? $user->id : null);
            $emailTarget = $email ?: ($user ? $user->email : null);
            $ipAddress = request()->ip();
            $userAgent = request()->userAgent();

            // Gunakan dispatchAfterResponse agar pencatatan log dieksekusi secara instan
            // setelah respon dikirim tanpa memblokir HTTP dan TANPA membutuhkan queue worker.
            CatatLogAktivitas::dispatchAfterResponse($aktivitas, $emailTarget, $idTarget, $ipAddress, $userAgent);

        } catch (\Throwable $e) {
            // Fallback penulisan langsung ke database jika dispatch gagal
            try {
                \App\Models\LogAktivitas::create([
                    'user_id'    => $idTarget ?? null,
                    'email'      => $emailTarget ?? null,
                    'aktivitas'  => $aktivitas,
                    'ip_address' => $ipAddress ?? request()->ip(),
                    'user_agent' => $userAgent ?? request()->userAgent(),
                ]);
            } catch (\Throwable $err) {
                Log::error('Gagal mencatat log aktivitas: ' . $err->getMessage());
            }
        }
    }
}
