<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Jalankan migrasi untuk membuat tabel tahun_pelajaran.
     */
    public function up(): void
    {
        Schema::create('tahun_pelajaran', function (Blueprint $blueprint) {
            $blueprint->uuid('id')->primary();
            $blueprint->integer('tahun_mulai');
            $blueprint->integer('tahun_selesai');
            $blueprint->enum('semester', ['Ganjil', 'Genap']);
            $blueprint->boolean('is_aktif')->default(false);
            $blueprint->timestamps();

            // Index performa untuk pencarian cepat status aktif
            $blueprint->index('is_aktif');
        });
    }

    /**
     * Batalkan migrasi.
     */
    public function down(): void
    {
        Schema::dropIfExists('tahun_pelajaran');
    }
};
