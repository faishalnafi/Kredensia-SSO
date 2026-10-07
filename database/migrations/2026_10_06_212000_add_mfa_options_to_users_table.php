<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tambah kolom dukungan Multi-Factor Authentication (MFA) lengkap pada tabel users.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            if (!Schema::hasColumn('users', 'two_factor_methods')) {
                $table->json('two_factor_methods')->nullable()->after('two_factor_type');
            }
            if (!Schema::hasColumn('users', 'two_factor_wa_code')) {
                $table->string('two_factor_wa_code', 10)->nullable()->after('two_factor_email_expires_at');
            }
            if (!Schema::hasColumn('users', 'two_factor_wa_expires_at')) {
                $table->timestamp('two_factor_wa_expires_at')->nullable()->after('two_factor_wa_code');
            }
            if (!Schema::hasColumn('users', 'two_factor_passkeys')) {
                $table->json('two_factor_passkeys')->nullable()->after('two_factor_wa_expires_at');
            }
            if (!Schema::hasColumn('users', 'two_factor_prompt_challenge')) {
                $table->json('two_factor_prompt_challenge')->nullable()->after('two_factor_passkeys');
            }
        });

        // Perlebar kolom two_factor_type agar mendukung 'google_prompt', 'security_key', 'backup_codes', dll.
        Schema::table('users', function (Blueprint $table): void {
            $table->string('two_factor_type', 40)->default('totp')->change();
        });
    }

    /**
     * Kembalikan perubahan migrasi.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $kolomHapus = [];
            foreach ([
                'two_factor_methods',
                'two_factor_wa_code',
                'two_factor_wa_expires_at',
                'two_factor_passkeys',
                'two_factor_prompt_challenge',
            ] as $kolom) {
                if (Schema::hasColumn('users', $kolom)) {
                    $kolomHapus[] = $kolom;
                }
            }

            if (!empty($kolomHapus)) {
                $table->dropColumn($kolomHapus);
            }
        });
    }
};
