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
        Schema::table('registered_apps', function (Blueprint $table) {
            // Menambahkan warna icon dan opsi open in new tab ke tabel registered_apps
            $table->string('warna_icon', 7)->default('#3b82f6')->after('icon_material');
            $table->boolean('open_in_new_tab')->default(true)->after('portal_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('registered_apps', function (Blueprint $table) {
            $table->dropColumn(['warna_icon', 'open_in_new_tab']);
        });
    }
};
