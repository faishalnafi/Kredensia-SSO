<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tambahkan kolom agama (nullable) pada tabel users dan user_corrections.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('users', 'agama')) {
            Schema::table('users', function (Blueprint $table) {
                $table->string('agama', 50)->nullable()->after('jk');
            });
        }

        if (Schema::hasTable('user_corrections') && !Schema::hasColumn('user_corrections', 'agama')) {
            Schema::table('user_corrections', function (Blueprint $table) {
                $table->string('agama', 50)->nullable()->after('jk');
            });
        }
    }

    /**
     * Batalkan migrasi kolom agama.
     */
    public function down(): void
    {
        if (Schema::hasTable('user_corrections') && Schema::hasColumn('user_corrections', 'agama')) {
            Schema::table('user_corrections', function (Blueprint $table) {
                $table->dropColumn('agama');
            });
        }

        if (Schema::hasColumn('users', 'agama')) {
            Schema::table('users', function (Blueprint $table) {
                $table->dropColumn('agama');
            });
        }
    }
};
