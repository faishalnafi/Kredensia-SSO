<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class UserCorrection extends Model
{
    use HasUuids;

    protected $table = 'user_corrections';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'user_id_asli',
        'nama_lengkap',
        'email',
        'password',
        'jk',
        'tgl_lahir',
        'nik',
        'nip_nis',
        'no_telp',
        'alamat',
        'google_id',
        'google_email',
        'google_name',
        'google_avatar',
        'is_active',
        'claimed_at',
        'status_correction',
        'submitted_at',
        'reviewed_by',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'tgl_lahir' => 'date',
        'claimed_at' => 'datetime',
        'submitted_at' => 'datetime',
    ];

    /**
     * Relasi ke user asli yang mengajukan koreksi.
     */
    public function userAsli()
    {
        return $this->belongsTo(User::class, 'user_id_asli');
    }

    /**
     * Relasi ke admin yang me-review koreksi ini.
     */
    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
