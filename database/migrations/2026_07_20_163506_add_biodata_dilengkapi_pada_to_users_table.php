<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tambahkan kolom biodata_dilengkapi_pada ke tabel users.
     * NULL  = pengguna belum pernah mengisi/submit form biodata wajib.
     * NOT NULL = pengguna sudah submit biodata → semua menu aktif.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('biodata_dilengkapi_pada')
                ->nullable()
                ->after('claimed_at')
                ->comment('Waktu pengguna pertama kali melengkapi biodata wajib. NULL = belum lengkap.');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('biodata_dilengkapi_pada');
        });
    }
};
