<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tambahkan kolom username unik (nullable) pada tabel users dan user_corrections.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('users', 'username')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('username', 50)->nullable()->unique()->after('nama_lengkap');
            });
        }

        if (Schema::hasTable('user_corrections') && !Schema::hasColumn('user_corrections', 'username')) {
            Schema::table('user_corrections', function (Blueprint $table) {
                $table->string('username', 50)->nullable()->after('nama_lengkap');
            });
        }
    }

    /**
     * Batalkan migrasi kolom username.
     */
    public function down(): void
    {
        if (Schema::hasTable('user_corrections') && Schema::hasColumn('user_corrections', 'username')) {
            Schema::table('user_corrections', function (Blueprint $table) {
                $table->dropColumn('username');
            });
        }

        if (Schema::hasColumn('users', 'username')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropUnique(['username']);
                $table->dropColumn('username');
            });
        }
    }
};
