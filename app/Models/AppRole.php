<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\Pivot;

class AppRole extends Pivot
{
    use HasUuids;

    protected $table = 'app_roles';
    public $incrementing = false;
    protected $keyType = 'string';
    public $timestamps = true;
}
