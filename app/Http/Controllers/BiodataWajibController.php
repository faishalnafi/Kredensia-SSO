<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Inertia\Inertia;
use Inertia\Response;

class BiodataWajibController extends Controller
{
    /**
     * Tampilkan halaman pengisian biodata wajib.
     * Hanya bisa diakses oleh pengguna yang belum melengkapi biodata.
     */
    public function indeks(Request $request): Response|RedirectResponse
    {
        $user = $request->user();

        # Jika sudah pernah submit, langsung arahkan ke beranda
        if ($user->biodataSudahDilengkapi()) {
            return redirect()->route('beranda');
        }

        return Inertia::render('BiodataWajib/Indeks', [
            'user' => [
                'id'          => $user->id,
                'nama_lengkap' => $user->nama_lengkap,
                'email'       => $user->email,
                'nik'         => $user->nik,
                'nip_nis'     => $user->nip_nis,
                'jk'          => $user->jk,
                'tgl_lahir'   => $user->tgl_lahir?->format('Y-m-d'),
                'no_telp'     => $user->no_telp,
                'alamat'      => $user->alamat,
                'kelas'       => $user->kelas ? [
                    'nama_kelas' => $user->kelas->nama_kelas,
                    'tingkat'    => $user->kelas->tingkat,
                    'jurusan'    => $user->kelas->jurusan,
                ] : null,
            ],
            'peran' => $user->roles->pluck('nama_role')->toArray(),
        ]);
    }

    /**
     * Simpan biodata lengkap pengguna.
     * Menandai biodata_dilengkapi_pada = now() sehingga akses menu terbuka kembali.
     */
    public function simpan(Request $request): RedirectResponse
    {
        $user = $request->user();

        # Jika sudah pernah submit, tolak permintaan duplikat
        if ($user->biodataSudahDilengkapi()) {
            return redirect()->route('beranda')->with('info', 'Biodata Anda sudah dilengkapi sebelumnya.');
        }

        $validated = $request->validate([
            'nama_lengkap' => ['required', 'string', 'min:3', 'max:255'],
            'jk'           => ['required', 'string', 'in:L,P'],
            'tgl_lahir'    => ['required', 'date', 'before:today'],
            'nik'          => ['required', 'string', 'size:16', 'regex:/^[0-9]+$/'],
            'nip_nis'      => ['required', 'string', 'regex:/^[0-9]+$/', 'max:20'],
            'no_telp'      => ['required', 'string', 'regex:/^[0-9+\-\s\(\)]+$/', 'min:8', 'max:20'],
            'alamat'       => ['required', 'string', 'min:10', 'max:500'],
        ], [
            'nama_lengkap.required' => 'Nama lengkap wajib diisi.',
            'nama_lengkap.min'      => 'Nama lengkap minimal 3 karakter.',
            'jk.required'           => 'Jenis kelamin wajib dipilih.',
            'jk.in'                 => 'Jenis kelamin tidak valid.',
            'tgl_lahir.required'    => 'Tanggal lahir wajib diisi.',
            'tgl_lahir.before'      => 'Tanggal lahir tidak valid.',
            'nik.required'          => 'NIK wajib diisi.',
            'nik.size'              => 'NIK harus tepat 16 digit.',
            'nik.regex'             => 'NIK hanya boleh berisi angka.',
            'nip_nis.required'      => 'NIP/NISN wajib diisi.',
            'nip_nis.regex'         => 'NIP/NISN hanya boleh berisi angka.',
            'no_telp.required'      => 'Nomor telepon wajib diisi.',
            'no_telp.min'           => 'Nomor telepon minimal 8 digit.',
            'no_telp.regex'         => 'Format nomor telepon tidak valid.',
            'alamat.required'       => 'Alamat lengkap wajib diisi.',
            'alamat.min'            => 'Alamat minimal 10 karakter.',
        ]);

        # Simpan biodata + tandai waktu pengisian
        $user->update([
            ...$validated,
            'biodata_dilengkapi_pada' => now(),
        ]);

        # Bersihkan cache yang mungkin menyimpan data user lama
        Cache::forget('superadmin:daftar-pengguna');
        Cache::forget('superadmin:statistik');

        \App\Services\LayananLogAktivitas::catat(
            'Biodata wajib berhasil dilengkapi',
            $user->email,
            $user->id
        );

        return redirect()->route('dasbor')->with('sukses', 'Biodata Anda berhasil dilengkapi! Selamat datang di sistem.');
    }
}
