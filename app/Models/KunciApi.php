<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KunciApi extends Model
{
    use HasUuids;

    protected $table = 'kunci_api';

    protected $fillable = [
        'nama_aplikasi',
        'domain_diizinkan',
        'prefix',
        'kunci_api',
        'dibuat_oleh',
        'terakhir_digunakan',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'terakhir_digunakan' => 'datetime',
    ];

    # Relasi ke pengguna yang membuat kunci
    public function pembuat(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dibuat_oleh');
    }
}
