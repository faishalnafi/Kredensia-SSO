<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Jalankan migrasi untuk membuat tabel kelas.
     */
    public function up(): void
    {
        Schema::create('kelas', function (Blueprint $blueprint) {
            $blueprint->uuid('id')->primary();
            $blueprint->string('nama_kelas', 100);
            $blueprint->string('tingkat', 20); // e.g. "X", "XI", "XII"
            $blueprint->string('jurusan', 100)->nullable();
            $blueprint->uuid('tahun_pelajaran_id');
            $blueprint->uuid('wali_kelas_id')->nullable();
            $blueprint->timestamps();

            // Foreign Key Constraints
            $blueprint->foreign('tahun_pelajaran_id')
                ->references('id')
                ->on('tahun_pelajaran')
                ->onDelete('cascade');

            $blueprint->foreign('wali_kelas_id')
                ->references('id')
                ->on('users')
                ->onDelete('set null');

            // Index performa
            $blueprint->index('tahun_pelajaran_id');
            $blueprint->index('wali_kelas_id');
        });
    }

    /**
     * Batalkan migrasi.
     */
    public function down(): void
    {
        Schema::dropIfExists('kelas');
    }
};
