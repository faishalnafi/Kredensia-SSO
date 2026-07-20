<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;

// Jadwalkan pembersihan seluruh log aktivitas sistem setiap tanggal 1 pukul 00:00
Schedule::command('sso:bersihkan-log')->monthlyOn(1, '00:00');

