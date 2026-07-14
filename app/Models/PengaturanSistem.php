<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PengaturanSistem extends Model
{
    protected $table = 'pengaturan_sistem';

    protected $fillable = [
        'nama_aplikasi',
        'logo_primer_url',
        'favicon_url',
        'google_client_id',
        'google_client_secret',
        'batas_request_per_menit',
        'storage_provider',
        's3_key',
        's3_secret',
        's3_bucket',
        's3_region',
        's3_endpoint',
        's3_use_path_style_endpoint',
    ];

    protected $casts = [
        's3_use_path_style_endpoint' => 'boolean',
        'batas_request_per_menit' => 'integer',
    ];
}
