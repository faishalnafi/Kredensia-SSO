<?php

declare(strict_types=1);

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ManajemenPeranController extends Controller
{
    /**
     * Tampilkan halaman indeks manajemen peran.
     */
    public function indeks(): Response
    {
        $daftarPeran = Role::orderBy('created_at', 'desc')->get();

        return Inertia::render('Superadmin/Peran/Indeks', [
            'daftarPeran' => $daftarPeran
        ]);
    }

    /**
     * Simpan peran baru ke database.
     */
    public function simpan(Request $request): RedirectResponse
    {
        $request->validate([
            'nama_role' => ['required', 'string', 'max:100', 'unique:roles,nama_role'],
            'is_active' => ['required', 'boolean'],
        ], [
            'nama_role.required' => 'Nama Peran wajib diisi.',
            'nama_role.unique' => 'Nama Peran sudah terdaftar.',
            'nama_role.max' => 'Nama Peran tidak boleh melebihi 100 karakter.',
        ]);

        DB::transaction(function () use ($request) {
            Role::create([
                'nama_role' => $request->nama_role,
                'is_active' => $request->is_active,
            ]);
        });

        \App\Services\LayananLogAktivitas::catat('Menambahkan peran baru: ' . $request->nama_role);

        return redirect()->back()->with('success', 'Peran berhasil ditambahkan.');
    }

    /**
     * Perbarui data peran di database.
     */
    public function perbarui(Request $request, string $id): RedirectResponse
    {
        $role = Role::findOrFail($id);
        $roleLower = strtolower($role->nama_role);
        $isSystemRole = in_array($roleLower, ['super admin', 'superadmin', 'admin']);

        $request->validate([
            'nama_role' => [
                'required', 
                'string', 
                'max:100', 
                Rule::unique('roles', 'nama_role')->ignore($id)
            ],
            'is_active' => ['required', 'boolean'],
        ], [
            'nama_role.required' => 'Nama Peran wajib diisi.',
            'nama_role.unique' => 'Nama Peran sudah terdaftar.',
            'nama_role.max' => 'Nama Peran tidak boleh melebihi 100 karakter.',
        ]);

        if ($isSystemRole) {
            // Proteksi: Peran sistem tidak boleh diubah namanya atau dinonaktifkan
            if (strtolower($request->nama_role) !== $roleLower || !$request->is_active) {
                return redirect()->back()->with('error', 'Peran sistem (Super Admin / Admin) tidak boleh diubah namanya atau dinonaktifkan.');
            }
        }

        DB::transaction(function () use ($role, $request) {
            $role->update([
                'nama_role' => $request->nama_role,
                'is_active' => $request->is_active,
            ]);
        });

        \App\Services\LayananLogAktivitas::catat('Memperbarui peran: ' . $role->nama_role);

        return redirect()->back()->with('success', 'Data peran berhasil diperbarui.');
    }

    /**
     * Hapus peran dari database.
     */
    public function hapus(string $id): RedirectResponse
    {
        $role = Role::findOrFail($id);
        $roleLower = strtolower($role->nama_role);

        if (in_array($roleLower, ['super admin', 'superadmin', 'admin'])) {
            return redirect()->back()->with('error', 'Peran sistem (Super Admin / Admin) tidak boleh dihapus.');
        }

        DB::transaction(function () use ($role) {
            // Lepas semua relasi peran ke pengguna dan aplikasi terlebih dahulu (ACID)
            $role->users()->detach();
            $role->apps()->detach();
            $role->delete();
        });

        \App\Services\LayananLogAktivitas::catat('Menghapus peran: ' . $role->nama_role);

        return redirect()->back()->with('success', 'Peran berhasil dihapus.');
    }
}
