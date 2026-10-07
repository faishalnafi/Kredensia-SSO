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
        Schema::table('pengaturan_sistem', function (Blueprint $table) {
            if (!Schema::hasColumn('pengaturan_sistem', 'wa_fonnte_enabled')) {
                $table->boolean('wa_fonnte_enabled')->default(true);
            }
            if (!Schema::hasColumn('pengaturan_sistem', 'wa_fonnte_api_url')) {
                $table->string('wa_fonnte_api_url', 500)->default('https://api.fonnte.com/send');
            }
            if (!Schema::hasColumn('pengaturan_sistem', 'wa_fonnte_token')) {
                $table->string('wa_fonnte_token', 500)->nullable();
            }
            if (!Schema::hasColumn('pengaturan_sistem', 'wa_fonnte_sender')) {
                $table->string('wa_fonnte_sender', 50)->nullable();
            }
            if (!Schema::hasColumn('pengaturan_sistem', 'wa_fonnte_country_code')) {
                $table->string('wa_fonnte_country_code', 10)->default('62');
            }
            if (!Schema::hasColumn('pengaturan_sistem', 'wa_fonnte_delay')) {
                $table->string('wa_fonnte_delay', 20)->default('1');
            }
            if (!Schema::hasColumn('pengaturan_sistem', 'wa_fonnte_typing')) {
                $table->boolean('wa_fonnte_typing')->default(true);
            }
            if (!Schema::hasColumn('pengaturan_sistem', 'wa_fonnte_message_template')) {
                $table->text('wa_fonnte_message_template')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pengaturan_sistem', function (Blueprint $table) {
            $kolom = [
                'wa_fonnte_enabled',
                'wa_fonnte_api_url',
                'wa_fonnte_token',
                'wa_fonnte_sender',
                'wa_fonnte_country_code',
                'wa_fonnte_delay',
                'wa_fonnte_typing',
                'wa_fonnte_message_template',
            ];

            foreach ($kolom as $namaKolom) {
                if (Schema::hasColumn('pengaturan_sistem', $namaKolom)) {
                    $table->dropColumn($namaKolom);
                }
            }
        });
    }
};
