<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\ConfirmablePasswordController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\EmailVerificationPromptController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\VerifyEmailController;
use App\Http\Controllers\Auth\ClaimAccountController;
use Illuminate\Support\Facades\Route;

Route::get('otentikasi', [AuthenticatedSessionController::class, 'create'])
    ->middleware(\App\Http\Middleware\CegahBackCacheGuest::class)
    ->name('login');

Route::get('otentikasi/keluar', [AuthenticatedSessionController::class, 'destroy'])
    ->name('logout.get');

Route::get('otentikasi/masuk', function(\Illuminate\Http\Request $request) {
    $query = $request->query();
    return redirect('/otentikasi' . (!empty($query) ? '?' . http_build_query($query) : '') . '#masuk');
});

Route::get('otentikasi/redirect', function(\Illuminate\Http\Request $request) {
    return \Inertia\Inertia::render('Auth/Redirect', [
        'url' => $request->query('url')
    ]);
})->name('sso.redirect');

Route::get('otentikasi/verifikasi', function(\Illuminate\Http\Request $request) {
    $query = $request->query();
    return redirect('/otentikasi' . (!empty($query) ? '?' . http_build_query($query) : '') . '#verifikasi');
})->name('claim.form');

Route::get('auth/google', [\App\Http\Controllers\Auth\GoogleAuthController::class, 'redirectToGoogle'])
    ->name('auth.google');

Route::get('auth/google/callback', [\App\Http\Controllers\Auth\GoogleAuthController::class, 'handleGoogleCallback'])
    ->name('auth.google.callback');

Route::middleware('guest')->group(function () {
    Route::post('otentikasi', [AuthenticatedSessionController::class, 'store']);

    Route::post('otentikasi/verifikasi', [ClaimAccountController::class, 'prosesKlaim'])
        ->name('claim.process');

    Route::post('otentikasi/cek-identitas', [ClaimAccountController::class, 'cekIdentitas'])
        ->name('claim.check');

    Route::get('panduan', function (\Illuminate\Http\Request $request) {
        $query = $request->query();
        return redirect('/otentikasi' . (!empty($query) ? '?' . http_build_query($query) : '') . '#panduan');
    })->name('panduan');

    Route::get('buat-akun', function (\Illuminate\Http\Request $request) {
        $query = $request->query();
        return redirect('/otentikasi' . (!empty($query) ? '?' . http_build_query($query) : '') . '#buat-akun');
    })->name('register');

    Route::get('kebijakan-privasi', function (\Illuminate\Http\Request $request) {
        $query = $request->query();
        return redirect('/otentikasi' . (!empty($query) ? '?' . http_build_query($query) : '') . '#kebijakan-privasi');
    })->name('kebijakan-privasi');

    Route::get('syarat-dan-ketentuan', function (\Illuminate\Http\Request $request) {
        $query = $request->query();
        return redirect('/otentikasi' . (!empty($query) ? '?' . http_build_query($query) : '') . '#syarat-dan-ketentuan');
    })->name('syarat-dan-ketentuan');

    Route::get('lupa-kata-sandi', function (\Illuminate\Http\Request $request) {
        $query = $request->query();
        return redirect('/otentikasi' . (!empty($query) ? '?' . http_build_query($query) : '') . '#kata-sandi');
    })->name('password.request');

    Route::get('reset-password/{token}', [NewPasswordController::class, 'create'])
        ->name('password.reset');

    Route::post('reset-password', [NewPasswordController::class, 'store'])
        ->name('password.store');
});

Route::middleware('auth')->group(function () {
    Route::get('verify-email', EmailVerificationPromptController::class)
        ->name('verification.notice');

    Route::get('verify-email/{id}/{hash}', VerifyEmailController::class)
        ->middleware(['signed', 'throttle:6,1'])
        ->name('verification.verify');

    Route::post('email/verification-notification', [EmailVerificationNotificationController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    Route::get('confirm-password', [ConfirmablePasswordController::class, 'show'])
        ->name('password.confirm');

    Route::post('confirm-password', [ConfirmablePasswordController::class, 'store']);

    Route::put('password', [PasswordController::class, 'update'])->name('password.update');

    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])
        ->name('logout');
});
