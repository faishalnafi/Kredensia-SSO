<?php

declare(strict_types=1);

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\KunciApi;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class KunciApiController extends Controller
{
    /**
     * Menampilkan halaman daftar kunci API.
     */
    public function indeks(): Response
    {
        $daftarKunci = KunciApi::with('pembuat:id,nama_lengkap')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($kunci) {
                return [
                    'id' => $kunci->id,
                    'nama_aplikasi' => $kunci->nama_aplikasi,
                    'domain_diizinkan' => $kunci->domain_diizinkan,
                    'prefix' => $kunci->prefix,
                    'kunci_api' => $kunci->kunci_api, // Kirim data kunci asli agar dapat dicopy di tabel
                    'is_active' => $kunci->is_active,
                    'terakhir_digunakan' => $kunci->terakhir_digunakan?->diffForHumans(),
                    'terakhir_digunakan_raw' => $kunci->terakhir_digunakan,
                    'pembuat' => $kunci->pembuat?->nama_lengkap ?? '-',
                    'dibuat_pada' => $kunci->created_at->format('d M Y, H:i'),
                ];
            });

        return Inertia::render('Superadmin/KunciApi/Indeks', [
            'daftarKunci' => $daftarKunci,
            'kunciBaru' => session('kunci_baru'),
        ]);
    }

    /**
     * Menyimpan kunci API baru.
     */
    public function simpan(Request $request): RedirectResponse
    {
        $request->validate([
            'nama_aplikasi' => ['required', 'string', 'max:150'],
            'domain_diizinkan' => ['required', 'string', 'max:255'],
            'prefix' => ['required', 'string', 'max:5', 'alpha_num'],
        ], [
            'nama_aplikasi.required' => 'Nama aplikasi wajib diisi.',
            'domain_diizinkan.required' => 'Domain yang diizinkan wajib diisi.',
            'prefix.required' => 'Prefix wajib diisi.',
            'prefix.max' => 'Prefix maksimal 5 karakter.',
            'prefix.alpha_num' => 'Prefix hanya boleh berisi huruf dan angka.',
        ]);

        # Generate token acak (tanpa prefix)
        $tokenRandom = Str::random(40);
        $prefix = $request->prefix;
        $kunciAsli = $prefix . '_' . $tokenRandom;

        KunciApi::create([
            'nama_aplikasi' => $request->nama_aplikasi,
            'domain_diizinkan' => $request->domain_diizinkan,
            'prefix' => $prefix,
            'kunci_api' => $kunciAsli,
            'dibuat_oleh' => auth()->id(),
        ]);

        return redirect()->route('superadmin.kunci-api.indeks')
            ->with('kunci_baru', $kunciAsli);
    }

    /**
     * Memperbarui data kunci API.
     */
    public function perbarui(Request $request, string $id): RedirectResponse
    {
        $kunci = KunciApi::findOrFail($id);

        $request->validate([
            'nama_aplikasi' => ['required', 'string', 'max:150'],
            'domain_diizinkan' => ['required', 'string', 'max:255'],
            'prefix' => ['required', 'string', 'max:5', 'alpha_num'],
            'is_active' => ['required', 'boolean'],
        ], [
            'prefix.required' => 'Prefix wajib diisi.',
            'prefix.max' => 'Prefix maksimal 5 karakter.',
            'prefix.alpha_num' => 'Prefix hanya boleh berisi huruf dan angka.',
        ]);

        # Jika prefix berubah, kita update prefix di database.
        # Kunci API juga disesuaikan awalannya agar sinkron.
        $tokenRandomPart = explode('_', $kunci->kunci_api, 2)[1] ?? Str::random(40);
        $kunciAsli = $request->prefix . '_' . $tokenRandomPart;

        $kunci->update([
            'nama_aplikasi' => $request->nama_aplikasi,
            'domain_diizinkan' => $request->domain_diizinkan,
            'prefix' => $request->prefix,
            'kunci_api' => $kunciAsli,
            'is_active' => $request->is_active,
        ]);

        return redirect()->route('superadmin.kunci-api.indeks');
    }

    /**
     * Menghapus kunci API.
     */
    public function hapus(string $id): RedirectResponse
    {
        $kunci = KunciApi::findOrFail($id);
        $kunci->delete();

        return redirect()->route('superadmin.kunci-api.indeks');
    }

    /**
     * Regenerasi kunci API.
     */
    public function regenerasi(string $id): RedirectResponse
    {
        $kunci = KunciApi::findOrFail($id);

        $tokenRandom = Str::random(40);
        $kunciAsli = $kunci->prefix . '_' . $tokenRandom;

        $kunci->update([
            'kunci_api' => $kunciAsli,
        ]);

        return redirect()->route('superadmin.kunci-api.indeks')
            ->with('kunci_baru', $kunciAsli);
    }
}
