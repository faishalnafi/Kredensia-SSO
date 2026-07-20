<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Kelas extends Model
{
    use HasUuids;

    /**
     * Nama tabel yang terkait dengan model ini.
     *
     * @var string
     */
    protected $table = 'kelas';

    /**
     * Atribut yang dapat diisi secara massal.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'nama_kelas',
        'tingkat',
        'jurusan',
        'tahun_pelajaran_id',
        'wali_kelas_id',
    ];

    /**
     * Relasi ke model TahunPelajaran.
     */
    public function tahunPelajaran(): BelongsTo
    {
        return $this->belongsTo(TahunPelajaran::class, 'tahun_pelajaran_id');
    }

    /**
     * Relasi ke model User (sebagai Wali Kelas).
     */
    public function waliKelas(): BelongsTo
    {
        return $this->belongsTo(User::class, 'wali_kelas_id');
    }

    /**
     * Relasi ke model User (sebagai Siswa di kelas ini).
     */
    public function siswa()
    {
        return $this->hasMany(User::class, 'kelas_id');
    }
}
