<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\LayananLogAktivitas;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class NewPasswordController extends Controller
{
    /**
     * Tampilkan halaman pembuatan kata sandi baru (Reset Password).
     */
    public function create(Request $request): Response
    {
        return Inertia::render('Auth/ResetPassword', [
            'email' => $request->email,
            'token' => $request->route('token'),
        ]);
    }

    /**
     * Simpan kata sandi baru dari tautan pemulihan surel.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
        ], [
            'email.required' => 'Alamat surel wajib diisi.',
            'email.email' => 'Format alamat surel tidak valid.',
            'password.required' => 'Kata sandi baru wajib diisi.',
            'password.confirmed' => 'Konfirmasi kata sandi baru tidak cocok.',
            'password.min' => 'Kata sandi baru minimal harus 8 karakter.',
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user) use ($request): void {
                $user->forceFill([
                    'password' => Hash::make($request->password),
                    'remember_token' => Str::random(60),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status == Password::PASSWORD_RESET) {
            LayananLogAktivitas::catat('Berhasil melakukan reset kata sandi melalui tautan surel', (string) $request->email);
            return redirect('/otentikasi#masuk')->with(
                'status',
                'Kata sandi Anda berhasil diperbarui! Silakan masuk menggunakan kata sandi baru Anda.'
            );
        }

        $pesanError = match ($status) {
            Password::INVALID_TOKEN => 'Token pemulihan kata sandi tidak valid atau sudah kedaluwarsa. Silakan ajukan permintaan ulang.',
            Password::INVALID_USER => 'Pengguna dengan alamat surel tersebut tidak ditemukan.',
            Password::RESET_THROTTLED => 'Terlalu banyak percobaan. Silakan tunggu beberapa saat sebelum mencoba kembali.',
            default => trans($status),
        };

        throw ValidationException::withMessages([
            'email' => [$pesanError],
        ]);
    }
}
