<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Menambahkan index pada kolom-kolom yang sering digunakan dalam query
     * namun belum memiliki index, demi mempercepat pencarian data saat
     * jumlah pengguna membesar (ribuan - ratusan ribu).
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Index pada kolom is_active: digunakan di DasborAdminController
            // untuk menghitung total pengguna aktif (WHERE is_active = true)
            $table->index('is_active', 'idx_users_is_active');

            // Index pada kolom claimed_at: digunakan di ClaimAccountController
            // untuk mengecek apakah akun sudah diklaim (WHERE claimed_at IS NOT NULL)
            $table->index('claimed_at', 'idx_users_claimed_at');

            // Index pada kolom created_at: digunakan di DasborAdminController
            // untuk menghitung pengguna baru dalam 7 hari terakhir
            $table->index('created_at', 'idx_users_created_at');

            // Index komposit NIK + NIP/NISN: digunakan di ClaimAccountController
            // saat memvalidasi keselarasan identitas pengguna
            $table->index(['nik', 'nip_nis'], 'idx_users_nik_nip_nis');
        });

        Schema::table('user_corrections', function (Blueprint $table) {
            // Index pada status_correction: digunakan di DasborAdminController
            // untuk menghitung jumlah pengajuan koreksi berstatus pending
            $table->index('status_correction', 'idx_corrections_status');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropIndex('idx_users_is_active');
            $table->dropIndex('idx_users_claimed_at');
            $table->dropIndex('idx_users_created_at');
            $table->dropIndex('idx_users_nik_nip_nis');
        });

        Schema::table('user_corrections', function (Blueprint $table) {
            $table->dropIndex('idx_corrections_status');
        });
    }
};
