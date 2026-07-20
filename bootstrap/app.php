<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\SetSessionLifetime::class,
            \App\Http\Middleware\PerpanjangSesiRememberMe::class,
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            'throttle:global_sso',
        ]);

        $middleware->alias([
            'superadmin'    => \App\Http\Middleware\PeriksaPeranSuperadmin::class,
            'admin'         => \App\Http\Middleware\PeriksaPeranAdmin::class,
            'auth.apikey'   => \App\Http\Middleware\AutentikasiApiKey::class,
            'biodata.check' => \App\Http\Middleware\PeriksaBiodataLengkap::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
