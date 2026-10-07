<?php

declare(strict_types=1);

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\UserCorrection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class KeamananAkunController extends Controller
{
    /**
     * Tampilkan halaman keamanan akun beserta sesi aktif dan data pengajuan perbaikan profil.
     */
    public function indeks(): Response
    {
        $user = Auth::user();

        $sessions = DB::table('sessions')
            ->orderBy('last_activity', 'desc')
            ->get()
            ->filter(fn ($session) => \App\Services\LayananSesiPerangkat::sesiMemuatPengguna($session, (string) $user->id))
            ->map(function ($session) use ($user) {
                $agent = $this->parseUserAgent((string) $session->user_agent);
                $isCurrentSession = $session->id === session()->getId();
                $isDipakaiAkunLain = (string) $session->user_id !== (string) $user->id;

                return [
                    'id' => $session->id,
                    'ip_address' => $session->ip_address ?: 'Tidak Diketahui',
                    'os' => $agent['os'],
                    'browser' => $agent['browser'],
                    'device_icon' => $agent['icon'],
                    'terakhir_aktif' => \Carbon\Carbon::createFromTimestamp($session->last_activity)->locale('id')->diffForHumans(),
                    // Sesi dianggap sedang online jika ada aktivitas dalam 5 menit terakhir
                    'sedang_online' => $isCurrentSession || $session->last_activity >= now()->subMinutes(5)->timestamp,
                    'adalah_saat_ini' => $isCurrentSession,
                    'dipakai_akun_lain' => $isDipakaiAkunLain,
                ];
            })->values();

        // Cari pengajuan perbaikan data yang berstatus pending dari pengguna ini
        $pendingCorrection = UserCorrection::where('user_id_asli', $user->id)
            ->where('status_correction', 'pending')
            ->first();

        // Data konfigurasi 2FA / MFA pengguna & sistem
        $twoFactorPengaturan = \App\Services\Layanan2FA::dapatkanPengaturan();
        $activeMethods = $user->daftarMetodeMfaAktif();
        $recoveryCodes = (array) ($user->two_factor_recovery_codes ?: []);

        $twoFactorInfo = [
            'enabled' => $user->hasEnabledTwoFactor(),
            'type' => $user->two_factor_type ?: 'totp',
            'active_methods' => $activeMethods,
            'confirmed_at' => $user->two_factor_confirmed_at ? $user->two_factor_confirmed_at->format('d/m/Y H:i') : null,
            'is_required' => \App\Services\Layanan2FA::apakahUserWajib2FA($user, $twoFactorPengaturan),
            'system_enabled' => (bool) $twoFactorPengaturan->two_factor_enabled,
            'allowed_methods' => (array) ($twoFactorPengaturan->two_factor_allowed_methods ?: [
                'totp', 'google_prompt', 'whatsapp', 'email', 'passkey', 'security_key', 'backup_codes',
            ]),
            'all_methods_meta' => array_values(\App\Services\Layanan2FA::SEMUA_METODE),
            'has_totp_secret' => !empty($user->two_factor_secret),
            'has_recovery_codes' => !empty($recoveryCodes),
            'recovery_codes_count' => count($recoveryCodes),
            'recovery_codes_list' => array_values($recoveryCodes),
            'passkeys' => is_array($user->two_factor_passkeys) ? array_values($user->two_factor_passkeys) : [],
            'no_telp_masked' => \App\Services\Layanan2FA::sensorNomorTelepon($user->no_telp),
            'email_masked' => \App\Services\Layanan2FA::sensorEmail($user->email),
        ];

        return Inertia::render('Superadmin/KeamananAkun/Indeks', [
            'daftarSesi' => $sessions,
            'pengguna' => $user,
            'pendingCorrection' => $pendingCorrection,
            'twoFactor' => $twoFactorInfo,
        ]);
    }

    /**
     * Inisiasi pembuatan secret 2FA TOTP & Kode Cadangan 10 Digit untuk pengguna.
     */
    public function generate2FA(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = Auth::user();
        $secret = \App\Services\Layanan2FA::generateSecret();
        $recoveryCodes = !empty($user->two_factor_recovery_codes)
            ? (array) $user->two_factor_recovery_codes
            : \App\Services\Layanan2FA::generateRecoveryCodes(10);
        $appName = config('app.name', 'SSO Sekolah');
        $provisioningUri = \App\Services\Layanan2FA::getProvisioningUri($user->email, $secret, $appName);
        $qrCodeUrl = \App\Services\Layanan2FA::getQrCodeImageUrl($provisioningUri);

        session([
            'temp_2fa_secret' => $secret,
            'temp_2fa_recovery' => $recoveryCodes,
        ]);

        return response()->json([
            'secret' => $secret,
            'qr_code_url' => $qrCodeUrl,
            'provisioning_uri' => $provisioningUri,
            'recovery_codes' => $recoveryCodes,
        ]);
    }

    /**
     * Konfirmasi kode OTP TOTP dan simpan status aktif 2FA pengguna.
     */
    public function confirm2FA(Request $request): RedirectResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ], [
            'code.required' => 'Kode verifikasi OTP wajib diisi.',
            'code.size' => 'Kode OTP harus terdiri dari 6 digit.',
        ]);

        $secret = (string) session('temp_2fa_secret');
        $recoveryCodes = (array) session('temp_2fa_recovery', []);

        if (empty($secret)) {
            return redirect()->back()->with('error', 'Sesi inisiasi 2FA telah kadaluarsa. Silakan klik tombol Aktifkan kembali.');
        }

        if (!\App\Services\Layanan2FA::verifyTotpCode($secret, $request->code)) {
            return redirect()->back()->withErrors([
                'code' => 'Kode verifikasi OTP salah atau kadaluarsa. Pastikan jam di HP/perangkat Anda sudah akurat/otomatis.',
            ]);
        }

        $user = Auth::user();
        $user->update([
            'two_factor_secret' => $secret,
            'two_factor_recovery_codes' => !empty($recoveryCodes) ? $recoveryCodes : \App\Services\Layanan2FA::generateRecoveryCodes(10),
        ]);
        \App\Services\Layanan2FA::aktifkanMetodeUser($user, 'totp', !$user->hasEnabledTwoFactor());

        session()->forget(['temp_2fa_secret', 'temp_2fa_recovery']);
        \App\Services\LayananLogAktivitas::catat('Berhasil mengaktifkan metode Aplikasi Authenticator (TOTP) 2FA/MFA');

        return redirect()->back()->with('success', 'Aplikasi Authenticator (TOTP) berhasil diaktifkan beserta Kode Cadangan 10 Digit!');
    }

    /**
     * Kirim kode OTP uji coba / aktivasi untuk metode Email atau WhatsApp dari halaman Keamanan Akun.
     */
    public function kirimOtpSetup(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'metode' => ['required', 'string', 'in:email,whatsapp'],
        ]);

        $user = Auth::user();
        $metode = (string) $request->metode;

        if ($metode === 'whatsapp') {
            if (empty($user->no_telp)) {
                return response()->json([
                    'berhasil' => false,
                    'pesan' => 'Nomor telepon belum diisi pada profil Anda. Silakan lengkapi nomor telepon terlebih dahulu.',
                ], 422);
            }

            $hasil = \App\Services\Layanan2FA::kirimOtpWhatsapp($user);

            return response()->json([
                'berhasil' => true,
                'metode' => 'whatsapp',
                'tujuan' => $hasil['no_telp_masked'],
                'terkirim_gateway' => $hasil['terkirim_gateway'],
                'kode_simulasi' => !$hasil['terkirim_gateway'] ? $hasil['otp'] : null,
                'pesan' => $hasil['terkirim_gateway']
                    ? "Kode OTP 6 digit telah dikirim ke WhatsApp {$hasil['no_telp_masked']}."
                    : "Mode Simulasi Lokal: Kode OTP WhatsApp untuk {$hasil['no_telp_masked']} adalah {$hasil['otp']}.",
            ]);
        }

        $otp = \App\Services\Layanan2FA::kirimOtpEmail($user);
        $emailMasked = \App\Services\Layanan2FA::sensorEmail($user->email);

        return response()->json([
            'berhasil' => true,
            'metode' => 'email',
            'tujuan' => $emailMasked,
            'kode_simulasi' => config('mail.default') === 'log' || config('app.debug') ? $otp : null,
            'pesan' => "Kode OTP 6 digit telah dikirim ke alamat email {$emailMasked}.",
        ]);
    }

    /**
     * Verifikasi kode OTP untuk mengaktifkan metode Email atau WhatsApp pada akun pengguna.
     */
    public function konfirmasiMetodeOtp(Request $request): RedirectResponse
    {
        $request->validate([
            'metode' => ['required', 'string', 'in:email,whatsapp'],
            'code' => ['required', 'string', 'size:6'],
        ], [
            'code.required' => 'Kode OTP 6 digit wajib diisi.',
            'code.size' => 'Kode OTP harus terdiri dari 6 digit angka.',
        ]);

        $user = Auth::user();
        $metode = (string) $request->metode;
        $code = (string) $request->code;

        $valid = $metode === 'whatsapp'
            ? \App\Services\Layanan2FA::verifyWhatsappOtp($user, $code)
            : \App\Services\Layanan2FA::verifyEmailOtp($user, $code);

        if (!$valid) {
            return redirect()->back()->withErrors([
                'code' => 'Kode OTP tidak valid atau sudah kadaluarsa. Silakan minta kode baru.',
            ]);
        }

        \App\Services\Layanan2FA::aktifkanMetodeUser($user, $metode, !$user->hasEnabledTwoFactor());
        $label = $metode === 'whatsapp' ? 'OTP WhatsApp' : 'OTP Email';
        \App\Services\LayananLogAktivitas::catat("Berhasil mengaktifkan metode verifikasi {$label} (MFA)");

        return redirect()->back()->with('success', "Metode verifikasi {$label} berhasil diaktifkan!");
    }

    /**
     * Aktifkan / nonaktifkan metode MFA tertentu atau ubah metode utama (default).
     */
    public function kelolaMetodeMfa(Request $request): RedirectResponse
    {
        $request->validate([
            'metode' => ['required', 'string', 'in:totp,google_prompt,whatsapp,email,passkey,security_key,backup_codes'],
            'aksi' => ['required', 'string', 'in:aktifkan,nonaktifkan,jadikan_utama'],
        ]);

        $user = Auth::user();
        $metode = (string) $request->metode;
        $aksi = (string) $request->aksi;
        $namaMetode = \App\Services\Layanan2FA::SEMUA_METODE[$metode]['nama'] ?? strtoupper($metode);

        if ($aksi === 'aktifkan') {
            if ($metode === 'whatsapp' && empty($user->no_telp)) {
                return redirect()->back()->with('error', 'Nomor telepon Anda belum terdaftar untuk mengaktifkan OTP WhatsApp.');
            }
            \App\Services\Layanan2FA::aktifkanMetodeUser($user, $metode, !$user->hasEnabledTwoFactor());
            \App\Services\LayananLogAktivitas::catat("Mengaktifkan metode MFA: {$namaMetode}");

            return redirect()->back()->with('success', "{$namaMetode} berhasil diaktifkan sebagai opsi verifikasi akun Anda.");
        }

        if ($aksi === 'jadikan_utama') {
            \App\Services\Layanan2FA::aktifkanMetodeUser($user, $metode, true);
            \App\Services\LayananLogAktivitas::catat("Mengubah metode verifikasi 2FA utama menjadi: {$namaMetode}");

            return redirect()->back()->with('success', "{$namaMetode} berhasil dijadikan metode verifikasi utama saat login.");
        }

        \App\Services\Layanan2FA::nonaktifkanMetodeUser($user, $metode);
        \App\Services\LayananLogAktivitas::catat("Menonaktifkan metode MFA: {$namaMetode}");

        return redirect()->back()->with('success', "{$namaMetode} telah dinonaktifkan.");
    }

    /**
     * Buat ulang (Regenerate) 10 Kode Cadangan 10 Digit baru.
     */
    public function regenerasiKodeCadangan(): \Illuminate\Http\JsonResponse
    {
        $user = Auth::user();
        $kodeBaru = \App\Services\Layanan2FA::generateRecoveryCodes(10);

        $methods = $user->daftarMetodeMfaAktif();
        if (!in_array('backup_codes', $methods, true)) {
            $methods[] = 'backup_codes';
        }

        $user->update([
            'two_factor_recovery_codes' => $kodeBaru,
            'two_factor_methods' => array_values(array_unique($methods)),
            'two_factor_confirmed_at' => $user->two_factor_confirmed_at ?: now(),
        ]);

        \App\Services\LayananLogAktivitas::catat('Membuat ulang (regenerate) 10 Kode Cadangan 10 Digit (2FA/MFA)');

        return response()->json([
            'berhasil' => true,
            'recovery_codes' => $kodeBaru,
            'pesan' => '10 Kode Cadangan (10 digit) baru berhasil dibuat. Kode lama tidak lagi berlaku.',
        ]);
    }

    /**
     * Simpan kredensial WebAuthn baru (Kunci Sandi / Passkey atau Kunci Keamanan / Security Key).
     */
    public function simpanKredensialWebAuthn(Request $request): RedirectResponse
    {
        $request->validate([
            'credential_id' => ['required', 'string'],
            'public_key' => ['nullable', 'string'],
            'nama_kunci' => ['required', 'string', 'max:80'],
            'jenis' => ['required', 'string', 'in:passkey,security_key'],
            'transports' => ['nullable', 'array'],
        ]);

        $user = Auth::user();
        $item = \App\Services\Layanan2FA::tambahKredensialWebAuthn($user, $request->only([
            'credential_id',
            'public_key',
            'nama_kunci',
            'jenis',
            'transports',
        ]));

        $labelJenis = $item['jenis'] === 'security_key' ? 'Kunci Keamanan Fisik' : 'Kunci Sandi (Passkey)';
        \App\Services\LayananLogAktivitas::catat("Mendaftarkan {$labelJenis} baru: {$item['nama_kunci']}");

        return redirect()->back()->with('success', "{$labelJenis} \"{$item['nama_kunci']}\" berhasil didaftarkan untuk verifikasi tanpa kata sandi!");
    }

    /**
     * Hapus kredensial WebAuthn (Passkey / Security Key) milik pengguna.
     */
    public function hapusKredensialWebAuthn(string $idKunci): RedirectResponse
    {
        $user = Auth::user();
        \App\Services\Layanan2FA::hapusKredensialWebAuthn($user, $idKunci);

        \App\Services\LayananLogAktivitas::catat('Menghapus Kunci Sandi / Kunci Keamanan WebAuthn dari akun');

        return redirect()->back()->with('success', 'Kunci keamanan berhasil dihapus dari akun Anda.');
    }

    /**
     * Cek apakah ada tantangan Dialog Google Prompt yang sedang menunggu persetujuan pada akun aktif ini.
     */
    public function cekPromptPending(): \Illuminate\Http\JsonResponse
    {
        $user = Auth::user();
        if (!$user) {
            return response()->json(['tantangan' => null]);
        }

        $tantangan = $user->two_factor_prompt_challenge;
        if (
            is_array($tantangan) &&
            ($tantangan['status'] ?? '') === 'pending' &&
            now()->timestamp <= (int) ($tantangan['expires_at'] ?? 0)
        ) {
            return response()->json([
                'tantangan' => [
                    'id' => $tantangan['id'],
                    'opsi_angka' => $tantangan['opsi_angka'] ?? [],
                    'perangkat' => $tantangan['perangkat'] ?? 'Perangkat Lain',
                    'ip_address' => $tantangan['ip_address'] ?? '-',
                    'status' => 'pending',
                    'waktu_dibuat' => $tantangan['waktu_dibuat'] ?? null,
                    'expires_at' => $tantangan['expires_at'] ?? 0,
                ],
            ]);
        }

        return response()->json(['tantangan' => null]);
    }

    /**
     * Terima respon persetujuan / penolakan Dialog Google Prompt dari perangkat yang sedang login.
     */
    public function responPromptLogin(Request $request): \Illuminate\Http\JsonResponse
    {
        $request->validate([
            'challenge_id' => ['required', 'string'],
            'aksi' => ['required', 'string', 'in:setuju,tolak'],
            'angka_dipilih' => ['nullable', 'integer'],
        ]);

        $user = Auth::user();
        $hasil = \App\Services\Layanan2FA::responTantanganPrompt(
            $user,
            (string) $request->challenge_id,
            (string) $request->aksi,
            $request->filled('angka_dipilih') ? (int) $request->angka_dipilih : null
        );

        \App\Services\LayananLogAktivitas::catat(
            "Merespon Dialog Verifikasi Perangkat (Google Prompt): {$hasil['status']}"
        );

        return response()->json($hasil);
    }

    /**
     * Nonaktifkan seluruh 2FA / MFA pengguna secara mandiri.
     */
    public function disable2FA(Request $request): RedirectResponse
    {
        $request->validate([
            'current_password' => ['required', 'current_password'],
        ], [
            'current_password.required' => 'Kata sandi akun wajib diisi untuk konfirmasi.',
            'current_password.current_password' => 'Kata sandi yang Anda masukkan salah.',
        ]);

        $user = Auth::user();
        \App\Services\Layanan2FA::resetUser2FA($user);

        \App\Services\LayananLogAktivitas::catat('Menonaktifkan seluruh autentikasi dua faktor (2FA/MFA) mandiri');

        return redirect()->back()->with('success', 'Autentikasi Dua Faktor (2FA / MFA) telah berhasil dinonaktifkan.');
    }

    /**
     * Cek ketersediaan dan validitas format username secara real-time.
     */
    public function cekUsername(Request $request): \Illuminate\Http\JsonResponse
    {
        $user = Auth::user();
        $idAbaikan = $request->input('abaikan_user_id') ?: ($user ? (string) $user->id : null);
        $mentah = (string) $request->input('username', '');
        $username = strtolower(trim(ltrim($mentah, '@')));

        if ($username === '') {
            return response()->json([
                'status' => 'kosong',
                'tersedia' => true,
                'username' => '',
                'pesan' => 'Username bersifat opsional (bawaan kosong).',
            ]);
        }

        if (strlen($username) < 3) {
            return response()->json([
                'status' => 'tidak_valid',
                'tersedia' => false,
                'username' => $username,
                'pesan' => 'Minimal 3 karakter (3–30 karakter).',
            ]);
        }

        if (strlen($username) > 30) {
            return response()->json([
                'status' => 'tidak_valid',
                'tersedia' => false,
                'username' => $username,
                'pesan' => 'Maksimal 30 karakter.',
            ]);
        }

        if (!preg_match('/^[a-z0-9._]+$/', $username)) {
            return response()->json([
                'status' => 'tidak_valid',
                'tersedia' => false,
                'username' => $username,
                'pesan' => 'Hanya boleh huruf kecil (a-z), angka (0-9), titik (.), atau garis bawah (_).',
            ]);
        }

        if (!preg_match('/^[a-z0-9]+([._][a-z0-9]+)*$/', $username)) {
            return response()->json([
                'status' => 'tidak_valid',
                'tersedia' => false,
                'username' => $username,
                'pesan' => 'Tidak boleh diawali/diakhiri atau berurutan titik (.) maupun garis bawah (_).',
            ]);
        }

        if ($user && (string) $idAbaikan === (string) $user->id && strtolower((string) $user->username) === $username) {
            return response()->json([
                'status' => 'milik_sendiri',
                'tersedia' => true,
                'username' => $username,
                'pesan' => 'Username aktif milik akun Anda saat ini.',
            ]);
        }

        if ($user && (string) $idAbaikan === (string) $user->id) {
            $sedangDiajukanSendiri = UserCorrection::where('user_id_asli', $user->id)
                ->where('status_correction', 'pending')
                ->whereRaw('LOWER(username) = ?', [$username])
                ->exists();

            if ($sedangDiajukanSendiri) {
                return response()->json([
                    'status' => 'milik_sendiri',
                    'tersedia' => true,
                    'username' => $username,
                    'pesan' => 'Username ini sedang Anda ajukan (menunggu persetujuan admin).',
                ]);
            }
        }

        $sudahDipakai = \App\Models\User::whereRaw('LOWER(username) = ?', [$username])
            ->when($idAbaikan, fn ($q) => $q->where('id', '!=', $idAbaikan))
            ->exists();

        if ($sudahDipakai) {
            return response()->json([
                'status' => 'terpakai',
                'tersedia' => false,
                'username' => $username,
                'pesan' => 'Username sudah dipakai pengguna lain, tidak dapat digunakan.',
            ]);
        }

        # Cek apakah username yang sama sedang diajukan (pending) oleh pengguna lain
        $sedangDiajukanOrangLain = UserCorrection::where('status_correction', 'pending')
            ->whereRaw('LOWER(username) = ?', [$username])
            ->when($idAbaikan, fn ($q) => $q->where('user_id_asli', '!=', $idAbaikan))
            ->exists();

        if ($sedangDiajukanOrangLain) {
            return response()->json([
                'status' => 'terpakai',
                'tersedia' => false,
                'username' => $username,
                'pesan' => 'Username sedang diajukan pengguna lain (menunggu persetujuan admin) & tidak dapat dipakai.',
            ]);
        }

        return response()->json([
            'status' => 'tersedia',
            'tersedia' => true,
            'username' => $username,
            'pesan' => 'Username tersedia dan dapat diajukan!',
        ]);
    }

    /**
     * Kirim/Ajukan pengajuan perbaikan data profil (termasuk username) untuk disetujui admin.
     */
    public function ajukanPerubahan(Request $request): RedirectResponse
    {
        $user = Auth::user();

        $usernameBersih = strtolower(trim(ltrim((string) $request->input('username', ''), '@')));
        $request->merge([
            'username' => $usernameBersih !== '' ? $usernameBersih : null,
        ]);

        $request->validate([
            'username' => [
                'nullable',
                'string',
                'min:3',
                'max:30',
                'regex:/^[a-z0-9]+([._][a-z0-9]+)*$/',
                \Illuminate\Validation\Rule::unique('users', 'username')->ignore($user->id),
                function (string $attribute, mixed $value, \Closure $fail) use ($user): void {
                    if ($value === null || $value === '') {
                        return;
                    }
                    $bentrokPending = UserCorrection::where('status_correction', 'pending')
                        ->whereRaw('LOWER(username) = ?', [strtolower((string) $value)])
                        ->where('user_id_asli', '!=', $user->id)
                        ->exists();
                    if ($bentrokPending) {
                        $fail('Username tersebut sudah lebih dulu diajukan oleh pengguna lain dan sedang menunggu persetujuan admin.');
                    }
                },
            ],
            'nama_lengkap' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'jk' => ['nullable', 'string', 'in:L,P'],
            'tgl_lahir' => ['nullable', 'date'],
            'nik' => ['nullable', 'string', 'max:16', 'regex:/^[0-9]+$/'],
            'nip_nis' => ['nullable', 'string', 'max:18', 'regex:/^[0-9]+$/'],
            'no_telp' => ['nullable', 'string', 'max:20'],
            'alamat' => ['nullable', 'string'],
        ], [
            'username.min' => 'Username minimal terdiri dari 3 karakter.',
            'username.max' => 'Username maksimal terdiri dari 30 karakter.',
            'username.regex' => 'Username hanya boleh menggunakan huruf kecil (a-z), angka (0-9), titik (.), atau garis bawah (_), serta tidak diawali/diakhiri simbol.',
            'username.unique' => 'Username tersebut sudah dipakai oleh pengguna lain.',
            'nama_lengkap.required' => 'Nama lengkap wajib diisi.',
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'email.unique' => 'Email sudah digunakan oleh pengguna lain.',
            'nik.max' => 'NIK maksimal 16 digit angka.',
            'nik.regex' => 'NIK harus berupa angka.',
            'nip_nis.max' => 'Nomor Induk (NIP/NISN) maksimal 18 digit angka.',
            'nip_nis.regex' => 'Nomor Induk (NIP/NISN) harus berupa angka.',
        ]);

        DB::transaction(function () use ($user, $request) {
            # Kunci pengecekan (lockForUpdate) untuk mencegah race-condition jika 2 pengguna mengirim username sama bersamaan
            if (!empty($request->username)) {
                $sudahAdaDiUsers = \App\Models\User::whereRaw('LOWER(username) = ?', [$request->username])
                    ->where('id', '!=', $user->id)
                    ->lockForUpdate()
                    ->exists();

                $sudahAdaDiPending = UserCorrection::where('status_correction', 'pending')
                    ->whereRaw('LOWER(username) = ?', [$request->username])
                    ->where('user_id_asli', '!=', $user->id)
                    ->lockForUpdate()
                    ->exists();

                if ($sudahAdaDiUsers || $sudahAdaDiPending) {
                    throw \Illuminate\Validation\ValidationException::withMessages([
                        'username' => 'Pengajuan ditolak: Username ini baru saja digunakan atau diajukan oleh pengguna lain.',
                    ]);
                }
            }

            UserCorrection::updateOrCreate([
                'user_id_asli' => $user->id,
                'status_correction' => 'pending',
            ], [
                'nama_lengkap' => $request->nama_lengkap,
                'username' => $request->username,
                'email' => $request->email,
                'jk' => $request->jk,
                'tgl_lahir' => $request->tgl_lahir,
                'nik' => $request->nik,
                'nip_nis' => $request->nip_nis,
                'no_telp' => $request->no_telp,
                'alamat' => $request->alamat,
                'submitted_at' => now(),
            ]);
        });

        \App\Services\LayananLogAktivitas::catat('Mengajukan perbaikan data profil akun');

        return redirect()->back()->with('success', 'Pengajuan perubahan data profil (termasuk username) berhasil dikirim dan sedang menunggu persetujuan admin.');
    }

    /**
     * Akhiri sesi perangkat tertentu.
     */
    public function hapusSesi(string $id): RedirectResponse
    {
        $user = Auth::user();

        # Tidak boleh mengakhiri sesi milik perangkat ini sendiri dari menu ini
        if ($id === session()->getId()) {
            return redirect()->back()->with('error', 'Gunakan tombol Logout untuk keluar dari perangkat ini.');
        }

        $berhasil = \App\Services\LayananSesiPerangkat::keluarkanPengguna($id, $user);

        if (!$berhasil) {
            return redirect()->back()->with('error', 'Sesi perangkat tidak ditemukan atau sudah berakhir.');
        }

        \App\Services\LayananLogAktivitas::catat('Mengakhiri sesi perangkat (' . substr($id, 0, 8) . '...)');

        return redirect()->back()->with('success', 'Sesi perangkat berhasil diakhiri.');
    }

    /**
     * Akhiri semua sesi perangkat lain kecuali sesi saat ini.
     */
    public function hapusSesiLainnya(): RedirectResponse
    {
        $user = Auth::user();
        $currentSessionId = session()->getId();

        # Cari semua sesi perangkat lain yang memuat akun ini (aktif maupun dialihkan)
        DB::table('sessions')
            ->where('id', '!=', $currentSessionId)
            ->get()
            ->filter(fn ($sesi) => \App\Services\LayananSesiPerangkat::sesiMemuatPengguna($sesi, (string) $user->id))
            ->each(fn ($sesi) => \App\Services\LayananSesiPerangkat::keluarkanPengguna($sesi->id, $user));

        \App\Services\LayananLogAktivitas::catat('Mengakhiri semua sesi perangkat lainnya');

        return redirect()->back()->with('success', 'Semua sesi perangkat lainnya berhasil diakhiri.');
    }

    /**
     * Helper untuk parse user agent sederhana.
     */
    private function parseUserAgent(string $userAgent): array
    {
        $os = 'Sistem Operasi Tidak Diketahui';
        $browser = 'Browser Tidak Diketahui';
        $icon = 'desktop_windows';

        // Deteksi OS
        if (preg_match('/windows|win32/i', $userAgent)) {
            $os = 'Windows';
            $icon = 'desktop_windows';
        } elseif (preg_match('/macintosh|mac os x/i', $userAgent)) {
            $os = 'macOS';
            $icon = 'desktop_mac';
        } elseif (preg_match('/iphone|ipad/i', $userAgent)) {
            $os = 'iOS';
            $icon = 'phone_iphone';
        } elseif (preg_match('/android/i', $userAgent)) {
            $os = 'Android';
            $icon = 'phone_android';
        } elseif (preg_match('/linux/i', $userAgent)) {
            $os = 'Linux';
            $icon = 'terminal';
        }

        // Deteksi Browser
        if (preg_match('/chrome/i', $userAgent) && !preg_match('/edge|edg/i', $userAgent) && !preg_match('/opr|opera/i', $userAgent)) {
            $browser = 'Google Chrome';
        } elseif (preg_match('/safari/i', $userAgent) && !preg_match('/chrome/i', $userAgent)) {
            $browser = 'Apple Safari';
        } elseif (preg_match('/firefox/i', $userAgent)) {
            $browser = 'Mozilla Firefox';
        } elseif (preg_match('/edge|edg/i', $userAgent)) {
            $browser = 'Microsoft Edge';
        } elseif (preg_match('/opr|opera/i', $userAgent)) {
            $browser = 'Opera';
        }

        return ['os' => $os, 'browser' => $browser, 'icon' => $icon];
    }
}
