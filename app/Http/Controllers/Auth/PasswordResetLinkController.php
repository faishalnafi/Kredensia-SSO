<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\LayananEmail;
use App\Services\LayananLogAktivitas;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetLinkController extends Controller
{
    /**
     * Tampilkan halaman lupa kata sandi.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/ForgotPassword', [
            'status' => session('status'),
        ]);
    }

    /**
     * Tangani permintaan tautan atur ulang kata sandi (mendukung Email, Username, atau UUID).
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'email' => ['required', 'string', 'max:255'],
        ], [
            'email.required' => 'Silakan masukkan alamat surel (email), username, atau UUID akun Anda.',
        ]);

        $input = trim((string) $request->input('email'));
        $bersihUsername = strtolower(ltrim($input, '@'));

        $user = User::where('email', $input)
            ->orWhereRaw('LOWER(username) = ?', [$bersihUsername])
            ->orWhere('id', $input)
            ->first();

        if (! $user) {
            throw ValidationException::withMessages([
                'email' => ['Akun dengan surel, username, atau UUID tersebut tidak ditemukan di dalam sistem.'],
            ]);
        }

        if (empty($user->email)) {
            throw ValidationException::withMessages([
                'email' => ['Akun ini belum memiliki alamat surel (email) terdaftar. Silakan hubungi Administrator Sekolah.'],
            ]);
        }

        $token = Password::broker()->createToken($user);
        $resetUrl = route('password.reset', [
            'token' => $token,
            'email' => $user->email,
        ]);

        $berlakuMenit = (int) config('auth.passwords.users.expire', 60);
        $berhasilKirim = app(LayananEmail::class)->kirimResetPassword($user, $resetUrl, $token, $berlakuMenit);

        if (! $berhasilKirim) {
            throw ValidationException::withMessages([
                'email' => ['Gagal mengirim surel pemulihan kata sandi. Pastikan konfigurasi SMTP Gmail pada sistem telah aktif dan benar.'],
            ]);
        }

        $emailTersensor = $this->sensorEmail((string) $user->email);
        $pesanSukses = "Tautan atur ulang kata sandi telah dikirim ke surel terdaftar ({$emailTersensor}). Silakan periksa kotak masuk atau folder Spam Anda.";

        LayananLogAktivitas::catat("Meminta tautan reset kata sandi melalui surel ({$user->email})", $user->id);

        return back()
            ->with('status', $pesanSukses)
            ->with('success', $pesanSukses);
    }

    /**
     * Sensor alamat email agar tetap menjaga privasi saat ditampilkan ke layar.
     */
    private function sensorEmail(string $email): string
    {
        $bagian = explode('@', $email);
        if (count($bagian) !== 2) {
            return $email;
        }

        $nama = $bagian[0];
        $domain = $bagian[1];

        if (strlen($nama) <= 2) {
            $namaSensor = substr($nama, 0, 1) . '***';
        } else {
            $namaSensor = substr($nama, 0, 2) . str_repeat('*', max(3, strlen($nama) - 3)) . substr($nama, -1);
        }

        return $namaSensor . '@' . $domain;
    }
}
