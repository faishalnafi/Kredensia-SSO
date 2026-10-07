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
        'two_factor_prompt_challenge',
    ];

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'is_active' => 'boolean',
            'tgl_lahir' => 'date',
            'claimed_at' => 'datetime',
            'two_factor_secret' => 'encrypted',
            'two_factor_recovery_codes' => 'encrypted:array',
            'two_factor_confirmed_at' => 'datetime',
            'two_factor_email_expires_at' => 'datetime',
            'two_factor_wa_expires_at' => 'datetime',
            'two_factor_methods' => 'array',
            'two_factor_passkeys' => 'array',
            'two_factor_prompt_challenge' => 'array',
        ];
    }

    /**
     * Periksa apakah pengguna telah mengaktifkan 2FA / MFA.
     */
    public function hasEnabledTwoFactor(): bool
    {
        return !is_null($this->two_factor_confirmed_at);
    }

    /**
     * Dapatkan daftar kode metode MFA yang sedang aktif pada akun pengguna ini.
     *
     * @return array<int, string>
     */
    public function daftarMetodeMfaAktif(): array
    {
        $methods = is_array($this->two_factor_methods) ? $this->two_factor_methods : [];

        if ($this->hasEnabledTwoFactor()) {
            if (!empty($this->two_factor_type) && !in_array($this->two_factor_type, $methods, true)) {
                $methods[] = $this->two_factor_type;
            }
            if (!empty($this->two_factor_secret) && !in_array('totp', $methods, true)) {
                $methods[] = 'totp';
            }
            if (!empty($this->two_factor_recovery_codes) && !in_array('backup_codes', $methods, true)) {
                $methods[] = 'backup_codes';
            }
        }

        if (!empty($this->two_factor_passkeys) && is_array($this->two_factor_passkeys)) {
            foreach ($this->two_factor_passkeys as $pk) {
                $jenis = $pk['jenis'] ?? 'passkey';
                if (!in_array($jenis, $methods, true)) {
                    $methods[] = $jenis;
                }
            }
        }

        return array_values(array_unique($methods));
    }

    /**
     * Dapatkan metode utama (default) saat tantangan login 2FA muncul.
     */
    public function metodeMfaUtama(array $allowedBySystem = []): string
    {
        $aktif = $this->daftarMetodeMfaAktif();
        if (!empty($allowedBySystem)) {
            $aktif = array_values(array_intersect($aktif, $allowedBySystem));
        }

        if (!empty($this->two_factor_type) && in_array($this->two_factor_type, $aktif, true)) {
            return $this->two_factor_type;
        }

        foreach (['google_prompt', 'passkey', 'security_key', 'totp', 'whatsapp', 'email', 'backup_codes'] as $prioritas) {
            if (in_array($prioritas, $aktif, true)) {
                return $prioritas;
            }
        }

        return $this->two_factor_type ?: 'totp';
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

        $hash = md5(strtolower(trim($this->email ?? '')));
        return "https://www.gravatar.com/avatar/{$hash}?d=identicon";
    }
}
