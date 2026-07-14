<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kunci_api', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nama_aplikasi', 150);
            $table->string('domain_diizinkan', 255);
            $table->string('prefix', 12)->index();
            $table->string('kunci_api', 255); // Menyimpan kunci API dalam plain text agar bisa dicopy/ditampilkan di dashboard
            $table->uuid('dibuat_oleh');
            $table->timestamp('terakhir_digunakan')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->foreign('dibuat_oleh')->references('id')->on('users')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kunci_api');
    }
};
