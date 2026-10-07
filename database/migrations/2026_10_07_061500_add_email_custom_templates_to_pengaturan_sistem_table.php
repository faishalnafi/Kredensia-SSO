<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pengaturan_sistem', function (Blueprint $table): void {
            $table->json('email_custom_templates')->nullable()->after('email_reset_template');
        });
    }

    public function down(): void
    {
        Schema::table('pengaturan_sistem', function (Blueprint $table): void {
            $table->dropColumn('email_custom_templates');
        });
    }
};
