<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;

// Jadwalkan pembersihan & pengarsipan log aktivitas bulanan setiap tanggal 1 pukul 00:00
Schedule::command('sso:bersihkan-log')->monthlyOn(1, '00:00');

// Fallback harian: jika server tidak aktif pada tanggal 1 pukul 00:00, periksa otomatis setiap hari pukul 01:00
Schedule::command('sso:bersihkan-log')->dailyAt('01:00');

