<?php

declare(strict_types=1);

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PenggunaDiperbarui implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Buat instance event baru.
     */
    public function __construct(
        public string $aksi = 'diperbarui',
        public ?string $idPengguna = null,
    ) {
    }

    /**
     * Dapatkan kanal tempat event disiarkan.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('pengguna'),
            new Channel('sistem-realtime'),
        ];
    }

    /**
     * Payload tambahan untuk sinkronisasi real-time.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'modul' => 'pengguna',
            'aksi' => $this->aksi,
            'id_target' => $this->idPengguna,
            'waktu' => time(),
        ];
    }
}
