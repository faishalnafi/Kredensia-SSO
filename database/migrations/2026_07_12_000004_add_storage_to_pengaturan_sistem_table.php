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
        Schema::table('pengaturan_sistem', function (Blueprint $table) {
            $table->string('storage_provider')->default('local'); // local, s3, gcs, minio
            $table->string('s3_key')->nullable();
            $table->string('s3_secret')->nullable();
            $table->string('s3_bucket')->nullable();
            $table->string('s3_region')->nullable();
            $table->string('s3_endpoint')->nullable();
            $table->boolean('s3_use_path_style_endpoint')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pengaturan_sistem', function (Blueprint $table) {
            $table->dropColumn([
                'storage_provider',
                's3_key',
                's3_secret',
                's3_bucket',
                's3_region',
                's3_endpoint',
                's3_use_path_style_endpoint',
            ]);
        });
    }
};
