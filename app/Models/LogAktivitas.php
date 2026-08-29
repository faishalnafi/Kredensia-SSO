<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LogAktivitas extends Model
{
    use HasUuids;

    protected $table = 'log_aktivitas';

    protected $keyType = 'string';
    public $incrementing = false;

    // Hanya menggunakan created_at, abaikan updated_at
    const UPDATED_AT = null;

    protected $fillable = [
        'user_id',
        'email',
        'aktivitas',
        'ip_address',
        'user_agent',
        'latitude',
        'longitude',
    ];

    /**
     * Relasi ke User.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}
