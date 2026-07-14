<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('registered_apps', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nama_aplikasi', 150);
            $table->text('deskripsi')->nullable();
            $table->string('logo_url', 500)->nullable();
            $table->string('icon_material', 100)->nullable();   // Nama ikon dari Material Symbols
            $table->string('portal_url', 500);                  // URL utama aplikasi
            $table->string('login_callback_url', 500);          // URL direct return setelah SSO
            $table->string('api_key', 64)->unique();            // String acak unik untuk autentikasi
            $table->boolean('is_global_visibility')->default(true); // true = semua role, false = role tertentu
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('registered_apps');
    }
};
