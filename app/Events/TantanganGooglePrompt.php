<?php

declare(strict_types=1);

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Event broadcast real-time untuk Dialog Verifikasi ala Google (Google Prompt)
 * yang dikirimkan ke seluruh sesi perangkat aktif milik pengguna.
 */
class TantanganGooglePrompt implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * @param string $userId ID pengguna yang sedang mencoba masuk
     * @param array<string, mixed> $tantangan Data tantangan (id, opsi_angka, perangkat, lokasi/ip, status, waktu)
     */
    public function __construct(
        public string $userId,
        public array $tantangan
    ) {}

    /**
     * Siarkan ke channel privat pengguna agar perangkat yang sedang login menerima dialog prompt.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('App.Models.User.' . $this->userId),
        ];
    }

    /**
     * Nama event yang didengarkan oleh Laravel Echo.
     */
    public function broadcastAs(): string
    {
        return 'TantanganGooglePrompt';
    }

    /**
     * Payload yang dikirimkan ke frontend.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'user_id' => $this->userId,
            'tantangan' => $this->tantangan,
            'waktu' => now()->toIso8601String(),
        ];
    }
}
