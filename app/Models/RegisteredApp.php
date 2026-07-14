<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class RegisteredApp extends Model
{
    use HasUuids;

    protected $table = 'registered_apps';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'nama_aplikasi',
        'deskripsi',
        'logo_url',
        'icon_material',
        'warna_icon',
        'portal_url',
        'open_in_new_tab',
        'login_callback_url',
        'api_key',
        'is_global_visibility',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'is_global_visibility' => 'boolean',
        'is_active' => 'boolean',
        'open_in_new_tab' => 'boolean',
        'sort_order' => 'integer',
    ];

    /**
     * Relasi ke roles yang diizinkan mengakses aplikasi ini.
     */
    public function roles()
    {
        return $this->belongsToMany(
            Role::class,
            'app_roles',
            'app_id',
            'role_id'
        )->using(AppRole::class)->withTimestamps();
    }
}
