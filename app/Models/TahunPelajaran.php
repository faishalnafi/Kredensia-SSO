<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TahunPelajaran extends Model
{
    use HasUuids;

    /**
     * Nama tabel yang terkait dengan model ini.
     *
     * @var string
     */
    protected $table = 'tahun_pelajaran';

    /**
     * Atribut yang dapat diisi secara massal.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'tahun_mulai',
        'tahun_selesai',
        'semester',
        'is_aktif',
    ];

    /**
     * Cast tipe data atribut.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'tahun_mulai' => 'integer',
        'tahun_selesai' => 'integer',
        'is_aktif' => 'boolean',
    ];

    /**
     * Dapatkan format string tahun pelajaran, e.g. "2026/2027 - Ganjil"
     */
    public function getLabelAttribute(): string
    {
        return "{$this->tahun_mulai}/{$this->tahun_selesai} - {$this->semester}";
    }

    /**
     * Relasi ke model Kelas.
     * Satu tahun pelajaran memiliki banyak kelas.
     */
    public function kelas(): HasMany
    {
        return $this->hasMany(Kelas::class, 'tahun_pelajaran_id');
    }
}
