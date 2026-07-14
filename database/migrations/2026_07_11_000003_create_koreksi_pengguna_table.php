<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_corrections', function (Blueprint $table) {
            $table->uuid('id')->primary();

            // FK ke user asli yang mengajukan koreksi
            $table->foreignUuid('user_id_asli')->constrained('users')->onDelete('cascade');

            // Semua kolom dari tabel users (salinan data yang diajukan)
            $table->string('nama_lengkap')->nullable();
            $table->string('email')->nullable();
            $table->string('password')->nullable();
            $table->char('jk', 1)->nullable();
            $table->date('tgl_lahir')->nullable();
            $table->string('nik', 20)->nullable();
            $table->string('nip_nis', 30)->nullable();
            $table->string('no_telp', 20)->nullable();
            $table->text('alamat')->nullable();
            $table->string('google_id')->nullable();
            $table->string('google_email')->nullable();
            $table->string('google_name')->nullable();
            $table->string('google_avatar')->nullable();
            $table->boolean('is_active')->nullable();
            $table->timestamp('claimed_at')->nullable();

            // Kolom tambahan khusus koreksi
            $table->enum('status_correction', ['pending', 'approved', 'rejected'])->default('pending');
            $table->timestamp('submitted_at')->nullable();
            $table->foreignUuid('reviewed_by')->nullable()->constrained('users')->onDelete('set null');

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_corrections');
    }
};
