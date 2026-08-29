<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
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
        'biodata_dilengkapi_pada',
        'kelas_id',
    ];

    protected $appends = [
        'avatar_url',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'password'                => 'hashed',
            'is_active'               => 'boolean',
            'tgl_lahir'               => 'date',
            'claimed_at'              => 'datetime',
            'biodata_dilengkapi_pada' => 'datetime',
        ];
    }

    /**
     * Cek apakah user sudah pernah submit form biodata wajib.
     * Berlaku terlepas dari status persetujuan admin.
     */
    public function biodataSudahDilengkapi(): bool
    {
        return !is_null($this->biodata_dilengkapi_pada);
    }

    /**
     * Cek apakah semua field biodata wajib sudah terisi di database.
     */
    public function biodataLengkap(): bool
    {
        return !empty($this->nama_lengkap)
            && !empty($this->jk)
            && !is_null($this->tgl_lahir)
            && !empty($this->nik)
            && !empty($this->nip_nis)
            && !empty($this->no_telp)
            && !empty($this->alamat);
    }

    /**
     * Relasi ke roles melalui pivot user_roles.
     */
    public function roles()
    {
        return $this->belongsToMany(
            Role::class,
            'user_roles',
            'user_id',
            'role_id'
        )->using(UserRole::class)->withTimestamps();
    }

    /**
     * Relasi ke riwayat koreksi data yang diajukan user ini.
     */
    public function koreksi()
    {
        return $this->hasMany(UserCorrection::class, 'user_id_asli');
    }

    /**
     * Cek apakah user memiliki role tertentu.
     */
    public function hasRole(string $namaRole): bool
    {
        return $this->roles()->where('nama_role', $namaRole)->exists();
    }

    /**
     * Dapatkan URL avatar pengguna. Jika google_avatar bernilai null, gunakan Gravatar.
     */
    public function getAvatarUrlAttribute(): string
    {
        if (!empty($this->google_avatar)) {
            return $this->google_avatar;
        }

        $email = strtolower(trim($this->email ?? ''));
        $hash = !empty($email) ? md5($email) : md5($this->id ?? 'user');

        return "https://www.gravatar.com/avatar/{$hash}?s=256&d=identicon";
    }

    /**
     * Relasi ke Kelas jika pengguna ini bertindak sebagai Wali Kelas.
     */
    public function kelasWali()
    {
        return $this->hasOne(Kelas::class, 'wali_kelas_id');
    }

    /**
     * Relasi ke Kelas tempat pengguna ini terdaftar sebagai siswa.
     */
    public function kelas()
    {
        return $this->belongsTo(Kelas::class, 'kelas_id');
    }
}

