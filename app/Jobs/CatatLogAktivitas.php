<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;

class CatatLogAktivitas implements ShouldQueue
{
    use Queueable;

    protected string $aktivitas;
    protected ?string $email;
    protected ?string $userId;
    protected ?string $ipAddress;
    protected ?string $userAgent;
    protected ?float $latitude;
    protected ?float $longitude;

    /**
     * Create a new job instance.
     */
    public function __construct(string $aktivitas, ?string $email, ?string $userId, ?string $ipAddress, ?string $userAgent, ?float $latitude = null, ?float $longitude = null)
    {
        $this->aktivitas = $aktivitas;
        $this->email = $email;
        $this->userId = $userId;
        $this->ipAddress = $ipAddress;
        $this->userAgent = $userAgent;
        $this->latitude = $latitude;
        $this->longitude = $longitude;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        try {
            if (\Illuminate\Support\Facades\Schema::hasTable('log_aktivitas')) {
                \App\Models\LogAktivitas::create([
                    'user_id'    => $this->userId,
                    'email'      => $this->email,
                    'aktivitas'  => $this->aktivitas,
                    'ip_address' => $this->ipAddress,
                    'user_agent' => $this->userAgent,
                    'latitude'   => $this->latitude,
                    'longitude'  => $this->longitude,
                ]);
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Gagal simpan log_aktivitas DB: ' . $e->getMessage());
        }
    }
}
