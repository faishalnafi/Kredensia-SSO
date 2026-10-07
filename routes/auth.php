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

Route::post('otentikasi', [AuthenticatedSessionController::class, 'store']);

// Verifikasi Tantangan Autentikasi Dua Faktor (2FA / MFA) saat Login maupun Tambah Akun (Multi-Akun)
Route::get('two-factor-challenge', [\App\Http\Controllers\Auth\TwoFactorChallengeController::class, 'create'])
    ->name('2fa.challenge');
Route::post('two-factor-challenge', [\App\Http\Controllers\Auth\TwoFactorChallengeController::class, 'store'])
    ->name('2fa.verify');
Route::post('two-factor-challenge/kirim-tantangan', [\App\Http\Controllers\Auth\TwoFactorChallengeController::class, 'kirimTantanganBaru'])
    ->name('2fa.send_challenge');
Route::get('two-factor-challenge/status-prompt', [\App\Http\Controllers\Auth\TwoFactorChallengeController::class, 'cekStatusPrompt'])
    ->name('2fa.prompt_status');
Route::post('two-factor-challenge/cancel', [\App\Http\Controllers\Auth\TwoFactorChallengeController::class, 'cancel'])
    ->name('2fa.cancel');

Route::middleware('guest')->group(function () {
    Route::post('otentikasi/verifikasi', [ClaimAccountController::class, 'prosesKlaim'])
        ->name('claim.process');

    Route::post('otentikasi/cek-identitas', [ClaimAccountController::class, 'cekIdentitas'])
        ->name('claim.check');

    Route::get('panduan', function () {
        return inertia('ComingSoon', ['title' => 'Panduan Penggunaan']);
    })->name('panduan');

    Route::get('buat-akun', function () {
        return inertia('ComingSoon', ['title' => 'Pembuatan Akun Baru']);
    })->name('register');

    Route::get('lupa-kata-sandi', function () {
        return inertia('ComingSoon', ['title' => 'Pemulihan Kata Sandi']);
    })->name('password.request');

    Route::post('lupa-kata-sandi', [PasswordResetLinkController::class, 'store'])
        ->middleware('throttle:6,1')
        ->name('password.email');

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

    Route::post('otentikasi/switch', [AuthenticatedSessionController::class, 'switchAccount'])
        ->name('account.switch');

    Route::post('otentikasi/logout-partial', [AuthenticatedSessionController::class, 'logoutPartial'])
        ->name('account.logout.partial');
});
