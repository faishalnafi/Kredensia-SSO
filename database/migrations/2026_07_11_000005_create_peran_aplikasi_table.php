<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('app_roles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('app_id')->constrained('registered_apps')->onDelete('cascade');
            $table->foreignUuid('role_id')->constrained('roles')->onDelete('cascade');
            $table->timestamps();

            // Satu app tidak boleh memiliki role yang sama dua kali
            $table->unique(['app_id', 'role_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('app_roles');
    }
};
