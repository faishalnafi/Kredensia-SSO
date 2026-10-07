<?php

declare(strict_types=1);

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;

/**
 * Event broadcast real-time (Laravel Reverb / Pusher) yang dikirim secara instan
 * setiap kali ada data pada aplikasi yang dibuat, diperbarui, atau dihapus,
 * sehingga seluruh klien yang sedang membuka halaman terkait otomatis
 * menyinkronkan data tanpa harus melakukan refresh halaman manual.
 */
class DataSistemDiperbarui implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets;

    /**
     * @param string $modul Nama modul yang berubah (pengguna, peran, aplikasi, koreksi, kelas, tahun_pelajaran, kunci_api, pengaturan, log_aktivitas, sistem)
     * @param string $aksi Jenis aksi (dibuat, diperbarui, dihapus, disinkronkan)
     * @param string|null $idTarget ID entitas yang terdampak (opsional)
     * @param int $waktu Timestamp kejadian
     */
    public function __construct(
        public string $modul = 'sistem',
        public string $aksi = 'diperbarui',
        public ?string $idTarget = null,
        public int $waktu = 0,
    ) {
        if ($this->waktu === 0) {
            $this->waktu = time();
        }
    }

    /**
     * Siarkan pada kanal publik 'sistem-realtime' dan kanal legacy 'pengguna'.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new Channel('sistem-realtime'),
        ];
    }

    /**
     * Nama event yang didengarkan oleh Laravel Echo di sisi klien.
     */
    public function broadcastAs(): string
    {
        return 'DataSistemDiperbarui';
    }

    /**
     * Payload data yang dikirimkan ke klien melalui WebSocket.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'modul' => $this->modul,
            'aksi' => $this->aksi,
            'id_target' => $this->idTarget,
            'waktu' => $this->waktu,
        ];
    }
}
