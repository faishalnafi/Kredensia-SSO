<?php

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * ============================================================
 * SSO Sekolah - Portal Otentikasi Terpusat
 * Versi    : v1.0.0 | Production | Community Edition
 * Lisensi  : Open Source - Bebas Dikembangkan
 * Besutan  : Faishal Nafi Network (https://faishalnafi.com)
 * ============================================================
 */

class LoginRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $aturan = [
            'email' => ['required', 'string', 'email:rfc,dns', 'max:255'],
            'password' => ['required', 'string', 'max:255'],
        ];

        // Hanya wajibkan reCAPTCHA jika konfigurasinya lengkap di .env
        $projectId = env('RECAPTCHA_PROJECT_ID');
        $apiKey = env('RECAPTCHA_API_KEY');
        $siteKey = env('RECAPTCHA_SITE_KEY');

        if ($projectId && $apiKey && $siteKey) {
            $aturan['recaptcha_token'] = ['required', 'string'];
        }

        return $aturan;
    }

    /**
     * Dapatkan pesan kesalahan khusus untuk aturan validasi.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.required' => 'Surel/Email wajib diisi.',
            'email.email' => 'Format surel/email tidak valid.',
            'password.required' => 'Kata sandi wajib diisi.',
            'recaptcha_token.required' => 'Validasi keamanan reCAPTCHA gagal. Silakan muat ulang halaman.',
        ];
    }

    /**
     * Attempt to authenticate the request's credentials.
     *
     * @throws ValidationException
     */
    public function authenticate(): void
    {
        $this->ensureIsNotRateLimited();

        // Validasi reCAPTCHA Enterprise
        if (! \App\Services\RecaptchaService::verify($this->recaptcha_token, 'LOGIN')) {
            RateLimiter::hit($this->throttleKey());
            
            throw ValidationException::withMessages([
                'email' => 'Sistem mendeteksi aktivitas mencurigakan. Validasi keamanan gagal.',
            ]);
        }

        $user = \App\Models\User::where('email', $this->email)->first();

        // 1. Cek apakah email terdaftar di database
        if (! $user) {
            throw ValidationException::withMessages([
                'email' => 'Akun Anda belum diverifikasi. Silakan verifikasi akun Anda terlebih dahulu.',
            ]);
        }

        // 2. Cek apakah akun sudah diklaim
        if (is_null($user->claimed_at)) {
            throw ValidationException::withMessages([
                'email' => 'Akun Anda belum diklaim. Silakan verifikasi/klaim akun Anda terlebih dahulu.',
            ]);
        }

        // 3. Cek apakah user aktif
        if (! $user->is_active) {
            throw ValidationException::withMessages([
                'email' => 'Akun Anda telah dinonaktifkan. Silakan hubungi admin.',
            ]);
        }


        // 5. Cek validitas password
        if (! Auth::attempt(['email' => $this->email, 'password' => $this->password], $this->boolean('remember'))) {
            RateLimiter::hit($this->throttleKey());

            throw ValidationException::withMessages([
                'password' => 'Kata sandi yang Anda masukkan salah.',
            ]);
        }

        RateLimiter::clear($this->throttleKey());

        // 5. Atur masa hidup sesi dinamis (jika dicentang 1 hari, jika tidak 120 menit)
        $lifetime = $this->boolean('remember') ? 1440 : 120;
        session(['session_lifetime' => $lifetime]);
        config(['session.lifetime' => $lifetime]);
    }

    /**
     * Ensure the login request is not rate limited.
     *
     * @throws ValidationException
     */
    public function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 5)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'email' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    /**
     * Get the rate limiting throttle key for the request.
     */
    public function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->string('email')).'|'.$this->ip());
    }
}
