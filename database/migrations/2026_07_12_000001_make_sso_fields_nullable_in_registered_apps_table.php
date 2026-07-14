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
            $table->string('login_callback_url', 500)->nullable()->change();
            $table->string('api_key', 64)->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('registered_apps', function (Blueprint $table) {
            $table->string('login_callback_url', 500)->nullable(false)->change();
            $table->string('api_key', 64)->nullable(false)->change();
        });
    }
};
