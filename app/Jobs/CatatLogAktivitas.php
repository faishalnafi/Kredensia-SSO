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

    /**
     * Create a new job instance.
     */
    public function __construct(string $aktivitas, ?string $email, ?string $userId, ?string $ipAddress, ?string $userAgent)
    {
        $this->aktivitas = $aktivitas;
        $this->email = $email;
        $this->userId = $userId;
        $this->ipAddress = $ipAddress;
        $this->userAgent = $userAgent;
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        \App\Models\LogAktivitas::create([
            'user_id'    => $this->userId,
            'email'      => $this->email,
            'aktivitas'  => $this->aktivitas,
            'ip_address' => $this->ipAddress,
            'user_agent' => $this->userAgent,
        ]);
    }
}
