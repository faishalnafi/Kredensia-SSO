<?php

declare(strict_types=1);

namespace App\Services;

use App\Events\DaftarSesiDiperbarui;
use App\Events\SesiPerangkatDiakhiri;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Layanan pengelolaan sesi perangkat multi-akun.
 *
 * Satu baris di tabel `sessions` dapat menampung beberapa akun sekaligus
 * (disimpan di kunci `sso_multi_accounts`). Layanan ini memastikan ketika
 * satu akun dikeluarkan dari jarak jauh, akun lain di perangkat yang sama
 * TIDAK ikut ter-logout, lalu mengirim push notification ke perangkat tersebut.
 */
class LayananSesiPerangkat
{
    # Batas maksimal akun yang dapat login bersamaan dalam satu perangkat/browser
    public const BATAS_MAKSIMAL_MULTI_AKUN = 25;

    # Hasilkan nama kanal broadcast untuk sebuah ID sesi (tidak membocorkan ID sesi asli)
    public static function kanalSesi(string $idSesi): string
    {
        return hash_hmac('sha256', $idSesi, (string) config('app.key'));
    }

    # Format label identitas singkat pengguna untuk keperluan log aktivitas
    public static function formatLabelPengguna(?User $pengguna, ?array $fallback = null): string
    {
        if ($pengguna) {
            $identitas = $pengguna->email ?: ($pengguna->username ? "@{$pengguna->username}" : null) ?: $pengguna->nip_nis ?: $pengguna->nik ?: $pengguna->id;
            return "{$pengguna->nama_lengkap} ({$identitas})";
        }
        if ($fallback) {
            $nama = $fallback['nama_lengkap'] ?? 'Pengguna';
            $email = $fallback['email'] ?? '-';
            return "{$nama} ({$email})";
        }
        return 'Tidak Diketahui';
    }

    # Periksa apakah sesi masih bisa menerima akun baru (maksimal 25 akun)
    public static function masihBisaTambahAkun(\Illuminate\Http\Request $request, ?string $idAtauEmailCalon = null): bool
    {
        $daftarId = array_values(array_unique(array_map('strval', $request->session()->get('sso_multi_accounts', []))));
        if (count($daftarId) < self::BATAS_MAKSIMAL_MULTI_AKUN) {
            return true;
        }
        if (!$idAtauEmailCalon) {
            return false;
        }
        # Jika akun yang mau login ternyata sudah ada di dalam daftar 25 akun tersebut, izinkan
        if (in_array($idAtauEmailCalon, $daftarId, true)) {
            return true;
        }
        $kunciCalon = strtolower(trim($idAtauEmailCalon));
        $calon = User::where('email', $kunciCalon)
            ->orWhere('username', $kunciCalon)
            ->orWhere('id', trim($idAtauEmailCalon))
            ->first();
        return $calon !== null && in_array((string) $calon->id, $daftarId, true);
    }

    /**
     * Daftarkan akun yang baru berhasil login ke dalam sesi multi-akun perangkat
     * sekaligus mencatat silsilah penambahan akun (akun pertama -> menambah akun B -> dst.) ke log aktivitas.
     */
    public static function daftarkanAkunKeSesi(
        \Illuminate\Http\Request $request,
        User $penggunaBaru,
        string $metodeLogin = 'Email & Kata Sandi',
        bool $catatLog = true
    ): void {
        $daftarId = array_values(array_unique(array_map('strval', $request->session()->get('sso_multi_accounts', []))));
        $idBaru = (string) $penggunaBaru->id;
        $sudahAda = in_array($idBaru, $daftarId, true);

        # Rekam akun yang pertama kali login di perangkat ini jika belum tercatat
        $akunPertama = $request->session()->get('sso_akun_pertama');
        if (!$akunPertama) {
            $userPertama = !empty($daftarId) ? User::find($daftarId[0]) : $penggunaBaru;
            $userPertama = $userPertama ?: $penggunaBaru;
            $akunPertama = [
                'id'           => (string) $userPertama->id,
                'nama_lengkap' => (string) $userPertama->nama_lengkap,
                'email'        => (string) ($userPertama->email ?: $userPertama->nip_nis ?: $userPertama->nik),
            ];
            $request->session()->put('sso_akun_pertama', $akunPertama);
        }

        $adalahAkunPertama = empty($daftarId) || (count($daftarId) === 1 && $daftarId[0] === $idBaru && !$request->session()->has('sso_riwayat_tambah_akun'));

        if (!$sudahAda && count($daftarId) < self::BATAS_MAKSIMAL_MULTI_AKUN) {
            $daftarId[] = $idBaru;
            $request->session()->put('sso_multi_accounts', $daftarId);
        }

        if (!$catatLog) {
            return;
        }

        # Susun rantai penambahan akun pada perangkat ini
        $riwayat = $request->session()->get('sso_riwayat_tambah_akun', []);
        $labelPertama = self::formatLabelPengguna(null, $akunPertama);
        $labelBaru = self::formatLabelPengguna($penggunaBaru);

        if ($adalahAkunPertama && empty($riwayat)) {
            LayananLogAktivitas::catat(
                "Login sukses via {$metodeLogin} [Akun pertama di perangkat: {$labelPertama}]",
                $penggunaBaru->email,
                (string) $penggunaBaru->id
            );
            self::siarkanPerubahanSesi($daftarId);
            return;
        }

        if (!$sudahAda || !in_array($labelBaru, $riwayat, true)) {
            if ((string) ($akunPertama['id'] ?? '') !== $idBaru) {
                $riwayat[] = $labelBaru;
                $request->session()->put('sso_riwayat_tambah_akun', $riwayat);
            }
        }

        if (!empty($riwayat)) {
            $rantaiTambahan = implode(' -> menambah ', $riwayat);
            LayananLogAktivitas::catat(
                "Tambah akun multi-sesi ({$metodeLogin}): Akun pertama {$labelPertama} -> menambah {$rantaiTambahan}",
                $penggunaBaru->email,
                (string) $penggunaBaru->id
            );
        } else {
            LayananLogAktivitas::catat(
                "Login ulang via {$metodeLogin} [Akun pertama di perangkat: {$labelPertama}]",
                $penggunaBaru->email,
                (string) $penggunaBaru->id
            );
        }

        self::siarkanPerubahanSesi($daftarId);
    }

    /**
     * Catat aktivitas perpindahan (switch) antar akun di perangkat yang sama.
     */
    public static function catatSwitchAkun(\Illuminate\Http\Request $request, ?User $penggunaAsal, User $penggunaTujuan): void
    {
        $akunPertama = $request->session()->get('sso_akun_pertama');
        $labelPertama = $akunPertama
            ? self::formatLabelPengguna(null, $akunPertama)
            : self::formatLabelPengguna($penggunaAsal ?: $penggunaTujuan);
        $labelAsal = self::formatLabelPengguna($penggunaAsal);
        $labelTujuan = self::formatLabelPengguna($penggunaTujuan);

        LayananLogAktivitas::catat(
            "Beralih akun (Switch Account): {$labelAsal} -> {$labelTujuan} [Akun pertama perangkat: {$labelPertama}]",
            $penggunaTujuan->email,
            (string) $penggunaTujuan->id
        );

        $daftarTerdampak = array_filter([
            $penggunaAsal ? (string) $penggunaAsal->id : null,
            (string) $penggunaTujuan->id,
            ...array_map('strval', $request->session()->get('sso_multi_accounts', [])),
        ]);
        self::siarkanPerubahanSesi($daftarTerdampak);
    }

    # Baca payload sesi dari database menjadi array
    public static function bacaPayload(string $payloadMentah): ?array
    {
        try {
            $data = base64_decode($payloadMentah, true);
            if ($data === false) {
                return null;
            }
            if (config('session.encrypt')) {
                $data = Crypt::decryptString($data);
            }
            $hasil = @unserialize($data);
            return is_array($hasil) ? $hasil : null;
        } catch (\Throwable) {
            return null;
        }
    }

    # Tulis ulang array payload ke format penyimpanan sesi database
    private static function tulisPayload(array $payload): string
    {
        $data = serialize($payload);
        if (config('session.encrypt')) {
            $data = Crypt::encryptString($data);
        }
        return base64_encode($data);
    }

    # Periksa apakah akun tertentu tercatat di sebuah sesi perangkat
    public static function sesiMemuatPengguna(object $barisSesi, string $idPengguna): bool
    {
        if ((string) $barisSesi->user_id === $idPengguna) {
            return true;
        }
        $payload = self::bacaPayload((string) $barisSesi->payload);
        return $payload !== null
            && in_array($idPengguna, array_map('strval', $payload['sso_multi_accounts'] ?? []), true);
    }

    /**
     * Keluarkan satu akun dari sebuah sesi perangkat.
     * Mengembalikan true jika berhasil.
     */
    public static function keluarkanPengguna(string $idSesi, User $pengguna): bool
    {
        $idPengguna = (string) $pengguna->id;
        $logoutTotal = false;

        $berhasil = DB::transaction(function () use ($idSesi, $idPengguna, &$logoutTotal) {
            $baris = DB::table('sessions')->where('id', $idSesi)->lockForUpdate()->first();
            if (!$baris || !self::sesiMemuatPengguna($baris, $idPengguna)) {
                return false;
            }

            $payload = self::bacaPayload((string) $baris->payload) ?? [];

            # Hapus akun dari daftar multi-akun perangkat tersebut
            $sisaAkun = array_values(array_filter(
                array_map('strval', $payload['sso_multi_accounts'] ?? []),
                fn ($id) => $id !== $idPengguna
            ));

            # Jika akun yang dikeluarkan sedang aktif di perangkat itu
            if ((string) $baris->user_id === $idPengguna) {
                $penggantiAkun = $sisaAkun !== [] ? User::find($sisaAkun[0]) : null;

                if (!$penggantiAkun) {
                    # Tidak ada akun tersisa → hapus seluruh sesi perangkat
                    DB::table('sessions')->where('id', $idSesi)->delete();
                    $logoutTotal = true;
                    return true;
                }

                # Alihkan otomatis sesi perangkat ke akun lain yang tersisa
                $kunciLogin = Auth::guard('web')->getName();
                $payload[$kunciLogin] = $penggantiAkun->id;
                if (array_key_exists('password_hash_web', $payload)) {
                    $payload['password_hash_web'] = $penggantiAkun->getAuthPassword();
                }
                $payload['sso_multi_accounts'] = $sisaAkun;

                DB::table('sessions')->where('id', $idSesi)->update([
                    'user_id' => $penggantiAkun->id,
                    'payload' => self::tulisPayload($payload),
                ]);
                return true;
            }

            # Akun tidak sedang aktif di perangkat itu → cukup hapus dari daftar
            $payload['sso_multi_accounts'] = $sisaAkun;
            DB::table('sessions')->where('id', $idSesi)->update([
                'payload' => self::tulisPayload($payload),
            ]);
            return true;
        });

        if ($berhasil) {
            self::kirimNotifikasi($idSesi, $pengguna, $logoutTotal);
            self::siarkanPerubahanSesi([$idPengguna]);
        }

        return $berhasil;
    }

    /**
     * Siarkan perubahan daftar sesi perangkat secara real-time (setelah siklus HTTP menulis tabel sessions).
     *
     * @param array<int, string|null> $daftarIdPengguna
     */
    public static function siarkanPerubahanSesi(array $daftarIdPengguna): void
    {
        $ids = array_values(array_unique(array_filter(array_map('strval', $daftarIdPengguna))));
        if ($ids === []) {
            return;
        }

        app()->terminating(function () use ($ids) {
            try {
                broadcast(new DaftarSesiDiperbarui($ids));
            } catch (\Throwable $e) {
                Log::warning('Broadcast DaftarSesiDiperbarui gagal dikirim: ' . $e->getMessage());
            }
        });
    }

    # Kirim push notification real-time ke perangkat (tidak menggagalkan proses jika Reverb mati)
    private static function kirimNotifikasi(string $idSesi, User $pengguna, bool $logoutTotal): void
    {
        try {
            broadcast(new SesiPerangkatDiakhiri(
                self::kanalSesi($idSesi),
                (string) $pengguna->email,
                (string) $pengguna->nama_lengkap,
                $logoutTotal,
            ));
        } catch (\Throwable $e) {
            Log::warning('Push notification sesi gagal dikirim (server Reverb tidak aktif?): ' . $e->getMessage());
        }
    }
}
