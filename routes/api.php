<?php

declare(strict_types=1);

use App\Http\Controllers\Api\ApiDataController;
use Illuminate\Support\Facades\Route;

# REST API Data — Dilindungi middleware auth.apikey
Route::prefix('v1')->middleware('auth.apikey')->group(function () {
    Route::get('/test', [ApiDataController::class, 'testKoneksi']);
    Route::get('/members', [ApiDataController::class, 'daftarMembers']);
    Route::get('/members/{id}', [ApiDataController::class, 'detailMember']);

    # Backward compatibility / Utility
    Route::get('/data/peran', [ApiDataController::class, 'daftarPeran']);
    Route::get('/data/statistik', [ApiDataController::class, 'statistik']);
});
