<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Role extends Model
{
    use HasUuids;

    protected $table = 'roles';
    protected $keyType = 'string';
    public $incrementing = false;

    protected $fillable = [
        'nama_role',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Relasi ke users melalui pivot user_roles.
     */
    public function users()
    {
        return $this->belongsToMany(
            User::class,
            'user_roles',
            'role_id',
            'user_id'
        )->using(UserRole::class)->withTimestamps();
    }

    /**
     * Relasi ke aplikasi melalui pivot app_roles.
     */
    public function apps()
    {
        return $this->belongsToMany(
            RegisteredApp::class,
            'app_roles',
            'role_id',
            'app_id'
        )->using(AppRole::class)->withTimestamps();
    }
}
