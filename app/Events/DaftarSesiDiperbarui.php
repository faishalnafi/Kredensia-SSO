<?php

declare(strict_types=1);

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Event broadcast real-time (Laravel Reverb) yang dikirim ke kanal pengguna
 * setiap kali ada perangkat baru yang login, beralih akun (switch), atau logout,
 * sehingga panel "Sesi Perangkat Aktif" di halaman Keamanan Akun langsung
 * memperbarui daftar sesinya secara otomatis (2 arah) tanpa perlu refresh manual.
 */
class DaftarSesiDiperbarui implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    /**
     * @param array<int, string> $daftarIdPengguna Daftar UUID pengguna yang terdampak perubahan sesi
     */
    public function __construct(
        public array $daftarIdPengguna,
    ) {
    }

    public function broadcastOn(): array
    {
        $kanal = [];
        foreach (array_unique(array_filter($this->daftarIdPengguna)) as $idPengguna) {
            $kanal[] = new PrivateChannel('App.Models.User.' . $idPengguna);
        }
        return $kanal;
    }

    public function broadcastAs(): string
    {
        return 'DaftarSesiDiperbarui';
    }

    public function broadcastWith(): array
    {
        return [
            'waktu' => now()->timestamp,
        ];
    }
}
