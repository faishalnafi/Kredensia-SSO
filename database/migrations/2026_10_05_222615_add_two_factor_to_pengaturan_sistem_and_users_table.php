<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Tambahkan kolom konfigurasi 2FA ke tabel pengaturan_sistem
        Schema::table('pengaturan_sistem', function (Blueprint $table) {
            $table->boolean('two_factor_enabled')->default(false)->after('google_client_secret');
            $table->string('two_factor_enforcement')->default('roles')->after('two_factor_enabled'); // 'all', 'roles', 'optional'
            $table->json('two_factor_roles')->nullable()->after('two_factor_enforcement'); // array nama role
            $table->json('two_factor_allowed_methods')->nullable()->after('two_factor_roles'); // ['totp', 'email']
            $table->unsignedInteger('two_factor_grace_period_days')->default(7)->after('two_factor_allowed_methods');
            $table->unsignedInteger('two_factor_remember_browser_days')->default(30)->after('two_factor_grace_period_days');
        });

        // Tambahkan kolom status & kunci 2FA ke tabel users
        Schema::table('users', function (Blueprint $table) {
            $table->text('two_factor_secret')->nullable()->after('password');
            $table->text('two_factor_recovery_codes')->nullable()->after('two_factor_secret');
            $table->timestamp('two_factor_confirmed_at')->nullable()->after('two_factor_recovery_codes');
            $table->string('two_factor_type', 20)->default('totp')->after('two_factor_confirmed_at'); // 'totp' atau 'email'
            $table->string('two_factor_email_code', 10)->nullable()->after('two_factor_type');
            $table->timestamp('two_factor_email_expires_at')->nullable()->after('two_factor_email_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pengaturan_sistem', function (Blueprint $table) {
            $table->dropColumn([
                'two_factor_enabled',
                'two_factor_enforcement',
                'two_factor_roles',
                'two_factor_allowed_methods',
                'two_factor_grace_period_days',
                'two_factor_remember_browser_days',
            ]);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'two_factor_secret',
                'two_factor_recovery_codes',
                'two_factor_confirmed_at',
                'two_factor_type',
                'two_factor_email_code',
                'two_factor_email_expires_at',
            ]);
        });
    }
};
