<?php

declare(strict_types=1);

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Push notification real-time (Laravel Reverb) yang dikirim ke sebuah perangkat
 * ketika salah satu akun di perangkat tersebut dikeluarkan dari jarak jauh
 * (misal melalui menu Keamanan Akun > Akhiri Sesi).
 */
class SesiPerangkatDiakhiri implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    public function __construct(
        public string $kanalSesi,
        public string $email,
        public string $namaLengkap,
        public bool $logoutTotal,
    ) {
    }

    # Kanal privat unik per sesi browser (berbasis hash, bukan ID sesi mentah)
    public function broadcastOn(): array
    {
        return [new PrivateChannel('sesi.' . $this->kanalSesi)];
    }

    public function broadcastAs(): string
    {
        return 'SesiPerangkatDiakhiri';
    }

    public function broadcastWith(): array
    {
        return [
            'email' => $this->email,
            'nama_lengkap' => $this->namaLengkap,
            'logout_total' => $this->logoutTotal,
        ];
    }
}
