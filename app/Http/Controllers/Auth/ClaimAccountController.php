<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ClaimAccountController extends Controller
{
    /**
     * Tampilkan halaman verifikasi/klaim akun.
     */
    public function tampilkanFormulirKlaim(): Response
    {
        return Inertia::render('Auth/Otentikasi', [
            'status' => session('status'),
            'mode' => 'verifikasi',
        ]);
    }

    /**
     * Proses klaim akun (verifikasi email dan atur kata sandi).
     */
    public function prosesKlaim(Request $request): RedirectResponse
    {
        // Rate limiting: maksimal 5 percobaan per menit berdasarkan IP
        $throttleKey = 'claim-process:' . Str::lower($request->ip());
        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            $detik = RateLimiter::availableIn($throttleKey);
            throw ValidationException::withMessages([
                'nik' => "Terlalu banyak percobaan. Silakan coba lagi dalam {$detik} detik.",
            ]);
        }
        RateLimiter::hit($throttleKey, 60);

        $request->validate([
            'nik' => ['required', 'string', 'size:16', 'regex:/^[0-9]+$/'],
            'nip_nis' => ['required', 'string', 'regex:/^[0-9]+$/'],
            'tgl_lahir' => ['required', 'date'],
            'email' => ['required', 'string', 'email:rfc,dns', 'max:255'],
            'password' => ['required', 'string', 'confirmed', \Illuminate\Validation\Rules\Password::min(8)->mixedCase()->numbers()->symbols()],
        ], [
            'nik.required' => 'NIK wajib diisi.',
            'nik.size' => 'NIK harus tepat 16 digit.',
            'nik.regex' => 'NIK hanya boleh berisi angka.',
            'nip_nis.required' => 'NIP/NISN wajib diisi.',
            'nip_nis.regex' => 'NIP/NISN hanya boleh berisi angka.',
            'tgl_lahir.required' => 'Tanggal Lahir wajib diisi.',
            'tgl_lahir.date' => 'Format Tanggal Lahir tidak valid.',
            'email.required' => 'Surel wajib diisi.',
            'email.email' => 'Format surel tidak valid.',
            'email.max' => 'Surel tidak boleh lebih dari 255 karakter.',
            'password.required' => 'Kata sandi baru wajib diisi.',
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
            'password.min' => 'Kata sandi minimal harus 8 karakter.',
        ]);

        // Verifikasi Identitas
        $user = User::where('nik', $request->nik)
            ->where('nip_nis', $request->nip_nis)
            ->whereDate('tgl_lahir', $request->tgl_lahir)
            ->first();

        if (!$user) {
            throw ValidationException::withMessages([
                'nik' => 'Data identitas (NIK/NIP/NISN/Tanggal Lahir) tidak ditemukan atau tidak cocok dengan sistem.',
            ]);
        }

        // Verifikasi keunikan email (tidak boleh digunakan oleh pengguna lain)
        $emailExists = User::where('email', $request->email)
            ->where('id', '!=', $user->id)
            ->exists();

        if ($emailExists) {
            throw ValidationException::withMessages([
                'email' => 'Surel sudah terdaftar. Silakan gunakan surel lain atau hubungi administrator.',
            ]);
        }

        if (!is_null($user->claimed_at)) {
            throw ValidationException::withMessages([
                'email' => 'Akun dengan identitas ini sudah diklaim. Silakan masuk langsung.',
            ]);
        }

        if (!$user->is_active) {
            throw ValidationException::withMessages([
                'email' => 'Akun Anda dinonaktifkan. Silakan hubungi administrator.',
            ]);
        }

        // Perbarui kata sandi dan status klaim
        $user->update([
            'password' => Hash::make($request->password),
            'email' => $request->email,
            'claimed_at' => now(),
        ]);

        \App\Services\LayananLogAktivitas::catat('Berhasil melakukan klaim/verifikasi akun mandiri: ' . $user->nama_lengkap, $user->email, $user->id);

        // Hapus cache terkait agar data terbaru langsung muncul di dashboard
        Cache::forget('superadmin:daftar-pengguna');
        Cache::forget('superadmin:statistik');
        Cache::forget('superadmin:pengguna-terbaru');

        return redirect()->to(route('login') . '#masuk')->with('status', 'Verifikasi berhasil! Silakan masuk menggunakan Google (disarankan) atau menggunakan surel dan kata sandi Anda.');
    }

    /**
     * Cek apakah identitas terdaftar dan belum diklaim.
     */
    public function cekIdentitas(Request $request)
    {
        // Rate limiting: maksimal 10 percobaan per menit berdasarkan IP
        $throttleKey = 'claim-check:' . Str::lower($request->ip());
        if (RateLimiter::tooManyAttempts($throttleKey, 10)) {
            $detik = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'success' => false,
                'errors' => [
                    'nik' => "Terlalu banyak percobaan. Silakan coba lagi dalam {$detik} detik.",
                ]
            ], 429);
        }
        RateLimiter::hit($throttleKey, 60);

        $request->validate([
            'jenis_pengguna' => ['required', 'string', Rule::in(['Siswa', 'Guru'])],
            'nik' => ['required', 'string', 'size:16', 'regex:/^[0-9]+$/'],
            'nip_nis' => ['required', 'string', 'regex:/^[0-9]+$/'],
            'tgl_lahir' => ['required', 'date'],
        ], [
            'jenis_pengguna.in' => 'Jenis pengguna tidak valid.',
            'nik.required' => 'NIK wajib diisi.',
            'nik.size' => 'NIK harus berjumlah 16 digit.',
            'nik.regex' => 'NIK hanya boleh berisi angka.',
            'nip_nis.required' => $request->jenis_pengguna === 'Guru' ? 'NIP wajib diisi.' : 'NISN wajib diisi.',
            'nip_nis.regex' => ($request->jenis_pengguna === 'Guru' ? 'NIP' : 'NISN') . ' hanya boleh berisi angka.',
            'tgl_lahir.required' => 'Tanggal Lahir wajib diisi.',
            'tgl_lahir.date' => 'Format Tanggal Lahir tidak valid.',
        ]);

        $nikExists = User::where('nik', $request->nik)->exists();
        $nipNisExists = User::where('nip_nis', $request->nip_nis)->exists();

        $errors = [];

        if (!$nikExists) {
            $errors['nik'] = 'NIK tidak terdaftar di sistem. Silakan hubungi admin / mendaftar secara mandiri.';
        }

        if (!$nipNisExists) {
            $label = $request->jenis_pengguna === 'Guru' ? 'NIP' : 'NISN';
            $errors['nip_nis'] = "$label tidak terdaftar di sistem. Silakan hubungi admin / mendaftar secara mandiri.";
        }

        if (!empty($errors)) {
            return response()->json([
                'success' => false,
                'errors' => $errors
            ], 422);
        }

        // Cari user yang memiliki KEDUA data terdaftar (NIK & NIP/NISN)
        $user = User::where('nik', $request->nik)
            ->where('nip_nis', $request->nip_nis)
            ->first();

        // Jika tidak ada user dengan kombinasi keduanya, berarti datanya tidak selaras (mismatch)
        if (!$user) {
            return response()->json([
                'success' => false,
                'errors' => [
                    'nik' => 'Data NIK tidak selaras dengan nomor induk (' . ($request->jenis_pengguna === 'Guru' ? 'NIP' : 'NISN') . ') di database.',
                    'nip_nis' => 'Data nomor induk (' . ($request->jenis_pengguna === 'Guru' ? 'NIP' : 'NISN') . ') tidak selaras dengan NIK di database.',
                ]
            ], 422);
        }

        // Cek jika akun sudah diklaim
        if (!is_null($user->claimed_at)) {
            return response()->json([
                'success' => false,
                'claimed' => true,
                'message' => 'Akun dengan identitas NIK dan ' . ($request->jenis_pengguna === 'Guru' ? 'NIP' : 'NISN') . ' ini sudah diklaim. Silakan masuk langsung menggunakan surel Anda.'
            ], 422);
        }

        // Cek kecocokan tanggal lahir
        if ($user->tgl_lahir->format('Y-m-d') !== $request->tgl_lahir) {
            return response()->json([
                'success' => false,
                'errors' => [
                    'tgl_lahir' => 'Tanggal lahir tidak selaras dengan data yang terdaftar di database.',
                ]
            ], 422);
        }

        return response()->json([
            'success' => true,
            'email' => $user->email
        ]);
    }
}
