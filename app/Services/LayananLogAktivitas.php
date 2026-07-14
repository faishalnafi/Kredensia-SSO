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

            // Jalankan Job secara asinkron dalam antrean queue worker
            CatatLogAktivitas::dispatch($aktivitas, $emailTarget, $idTarget, $ipAddress, $userAgent);

        } catch (\Throwable $e) {
            // Log ke file jika penulisan ke database gagal
            Log::error('Gagal mengirim antrean log aktivitas ke queue: ' . $e->getMessage(), [
                'aktivitas' => $aktivitas,
                'email'     => $email,
                'userId'    => $userId,
                'trace'     => $e->getTraceAsString(),
            ]);
        }
    }
}
