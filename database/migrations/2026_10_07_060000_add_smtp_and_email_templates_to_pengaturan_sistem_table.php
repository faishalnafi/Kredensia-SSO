<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pengaturan_sistem', function (Blueprint $table): void {
            $table->boolean('smtp_enabled')->default(false)->after('wa_fonnte_message_template');
            $table->string('smtp_host')->default('smtp.gmail.com')->after('smtp_enabled');
            $table->integer('smtp_port')->default(587)->after('smtp_host');
            $table->string('smtp_encryption')->default('tls')->after('smtp_port');
            $table->string('smtp_username')->nullable()->after('smtp_encryption');
            $table->text('smtp_password')->nullable()->after('smtp_username');
            $table->string('smtp_from_address')->nullable()->after('smtp_password');
            $table->string('smtp_from_name')->nullable()->default('SSO Sekolah')->after('smtp_from_address');

            $table->string('email_otp_subject')->nullable()->after('smtp_from_name');
            $table->text('email_otp_message')->nullable()->after('email_otp_subject');
            $table->longText('email_otp_template')->nullable()->after('email_otp_message');

            $table->string('email_reset_subject')->nullable()->after('email_otp_template');
            $table->text('email_reset_message')->nullable()->after('email_reset_subject');
            $table->longText('email_reset_template')->nullable()->after('email_reset_message');
        });
    }

    public function down(): void
    {
        Schema::table('pengaturan_sistem', function (Blueprint $table): void {
            $table->dropColumn([
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
            ]);
        });
    }
};
