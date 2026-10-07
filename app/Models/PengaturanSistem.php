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
        'two_factor_enabled',
        'two_factor_enforcement',
        'two_factor_roles',
        'two_factor_allowed_methods',
        'two_factor_grace_period_days',
        'two_factor_remember_browser_days',
        'wa_fonnte_enabled',
        'wa_fonnte_api_url',
        'wa_fonnte_token',
        'wa_fonnte_sender',
        'wa_fonnte_country_code',
        'wa_fonnte_delay',
        'wa_fonnte_typing',
        'wa_fonnte_message_template',
        'smtp_enabled',
        'smtp_host',
        'smtp_port',
        'smtp_encryption',
        'smtp_username',
        'smtp_password',
        'smtp_from_address',
        'smtp_from_name',
        'email_otp_subject',
        'email_otp_message',
        'email_otp_template',
        'email_reset_subject',
        'email_reset_message',
        'email_reset_template',
        'email_custom_templates',
    ];

    protected $casts = [
        's3_use_path_style_endpoint' => 'boolean',
        'batas_request_per_menit' => 'integer',
        'two_factor_enabled' => 'boolean',
        'two_factor_roles' => 'array',
        'two_factor_allowed_methods' => 'array',
        'two_factor_grace_period_days' => 'integer',
        'two_factor_remember_browser_days' => 'integer',
        'wa_fonnte_enabled' => 'boolean',
        'wa_fonnte_typing' => 'boolean',
        'smtp_enabled' => 'boolean',
        'smtp_port' => 'integer',
        'email_custom_templates' => 'array',
    ];
}
