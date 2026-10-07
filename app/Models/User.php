<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

/**
 * Model Pengguna (User) Terpusat SSO Sekolah.
 *
 * @package App\Models
 */
class User extends Authenticatable
{
    use HasFactory, Notifiable, HasUuids;

    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'nama_lengkap',
        'username',
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
        'foto_identitas',
        'biodata_dilengkapi_pada',
        'kelas_id',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_confirmed_at',
        'two_factor_type',
        'two_factor_methods',
        'two_factor_email_code',
        'two_factor_email_expires_at',
        'two_factor_wa_code',
        'two_factor_wa_expires_at',
        'two_factor_passkeys',
        'two_factor_prompt_challenge',
    ];

    protected $appends = [
        'avatar_url',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'two_factor_secret',
        'two_factor_recovery_codes',
        'two_factor_email_code',
        'two_factor_wa_code',
    ];

    protected function casts(): array
    {
        return [
            'password'                     => 'hashed',
            'is_active'                    => 'boolean',
            'tgl_lahir'                    => 'date',
            'claimed_at'                   => 'datetime',
            'biodata_dilengkapi_pada'      => 'datetime',
            'two_factor_confirmed_at'      => 'datetime',
            'two_factor_email_expires_at'  => 'datetime',
            'two_factor_wa_expires_at'     => 'datetime',
            'two_factor_secret'            => 'encrypted',
            'two_factor_recovery_codes'    => 'encrypted:array',
            'two_factor_methods'           => 'array',
            'two_factor_passkeys'          => 'array',
            'two_factor_prompt_challenge'  => 'array',
        ];
    }

    /**
     * Cek apakah pengguna telah aktif mengonfigurasi 2FA / MFA.
     */
    public function hasEnabledTwoFactor(): bool
    {
        return !is_null($this->two_factor_confirmed_at);
    }

    /**
     * Dapatkan daftar metode MFA yang diaktifkan oleh pengguna ini.
     *
     * @return array<int, string>
     */
    public function daftarMetodeMfaAktif(): array
    {
        $methods = is_array($this->two_factor_methods) ? $this->two_factor_methods : [];

        if ($this->hasEnabledTwoFactor() && empty($methods)) {
            $methods[] = $this->two_factor_type ?: 'totp';
        }

        if (!empty($this->two_factor_secret) && $this->hasEnabledTwoFactor() && !in_array('totp', $methods, true)) {
            if (($this->two_factor_type ?? 'totp') === 'totp') {
                $methods[] = 'totp';
            }
        }

        $passkeys = is_array($this->two_factor_passkeys) ? $this->two_factor_passkeys : [];
        foreach ($passkeys as $pk) {
            $jenis = $pk['jenis'] ?? 'passkey';
            if (!in_array($jenis, $methods, true)) {
                $methods[] = $jenis;
            }
        }

        if (!empty($this->two_factor_recovery_codes) && !in_array('backup_codes', $methods, true)) {
            $methods[] = 'backup_codes';
        }

        return array_values(array_unique($methods));
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
     * Dapatkan URL avatar pengguna. Jika foto_identitas ada, gunakan foto verifikasi wajah.
     * Jika google_avatar bernilai null, gunakan Gravatar.
     */
    public function getAvatarUrlAttribute(): string
    {
        if (!empty($this->foto_identitas)) {
            return str_starts_with($this->foto_identitas, 'http')
                ? $this->foto_identitas
                : \Illuminate\Support\Facades\Storage::url($this->foto_identitas);
        }

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

