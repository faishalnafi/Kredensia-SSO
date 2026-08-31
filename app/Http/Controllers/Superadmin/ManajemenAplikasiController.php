<?php

declare(strict_types=1);

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\RegisteredApp;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ManajemenAplikasiController extends Controller
{
    public function indeks(): Response
    {
        $daftarAplikasi = RegisteredApp::with('roles')->orderBy('sort_order')->get();
        $daftarPeran = Role::all();

        return Inertia::render('Superadmin/Aplikasi/Indeks', [
            'daftarAplikasi' => $daftarAplikasi,
            'daftarPeran' => $daftarPeran
        ]);
    }

    public function simpan(Request $request)
    {
        $request->validate([
            'nama_aplikasi' => ['required', 'string', 'max:150'],
            'deskripsi' => ['nullable', 'string'],
            'logo_url' => ['nullable', 'string', 'max:500'],
            'logo_file' => ['nullable', 'image', 'max:10240'], // max 10MB
            'icon_material' => ['nullable', 'string', 'max:100'],
            'warna_icon' => ['nullable', 'string', 'regex:/^#[a-fA-F0-9]{6}$/'],
            'portal_url' => ['required', 'string', 'url', 'max:500'],
            'login_callback_url' => ['nullable', 'string', 'url', 'max:500'],
            'open_in_new_tab' => ['required', 'boolean'],
            'is_global_visibility' => ['required', 'boolean'],
            'sort_order' => ['required', 'integer', 'min:0', 'unique:registered_apps,sort_order'],
            'is_active' => ['required', 'boolean'],
            'selected_roles' => ['nullable', 'array'],
            'selected_roles.*' => ['exists:roles,id'],
        ], [
            'sort_order.unique' => 'Urutan (sort) sudah digunakan oleh aplikasi lain.',
            'sort_order.min' => 'Urutan tidak boleh bernilai negatif.',
            'logo_file.max' => 'Ukuran logo tidak boleh melebihi 10MB.',
        ]);

        $logoUrl = $request->logo_url;

        if ($request->hasFile('logo_file')) {
            $path = $this->kompresLogo($request->file('logo_file'));
            $logoUrl = Storage::url($path);
        }

        $logoUrl = $logoUrl ?: 'https://support.nafii.my.id/icon/domains.png';

        $app = RegisteredApp::create([
            'nama_aplikasi' => $request->nama_aplikasi,
            'deskripsi' => $request->deskripsi,
            'logo_url' => $logoUrl,
            'icon_material' => $request->icon_material ?: 'apps',
            'warna_icon' => $request->warna_icon ?: '#3b82f6',
            'portal_url' => $request->portal_url,
            'open_in_new_tab' => $request->open_in_new_tab,
            'login_callback_url' => $request->login_callback_url,
            'api_key' => Str::random(40),
            'is_global_visibility' => $request->is_global_visibility,
            'sort_order' => $request->sort_order,
            'is_active' => $request->is_active,
        ]);

        if (!$request->is_global_visibility && $request->has('selected_roles')) {
            $app->roles()->sync($request->selected_roles);
        }

        Cache::forget('superadmin:statistik');

        \App\Services\LayananLogAktivitas::catat('Mendaftarkan aplikasi terdaftar baru: ' . $app->nama_aplikasi);

        return redirect()->back()->with('success', 'Aplikasi berhasil ditambahkan.');
    }

    public function perbarui(Request $request, string $id)
    {
        $app = RegisteredApp::findOrFail($id);

        $request->validate([
            'nama_aplikasi' => ['required', 'string', 'max:150'],
            'deskripsi' => ['nullable', 'string'],
            'logo_url' => ['nullable', 'string', 'max:500'],
            'logo_file' => ['nullable', 'image', 'max:10240'], // max 10MB
            'icon_material' => ['nullable', 'string', 'max:100'],
            'warna_icon' => ['nullable', 'string', 'regex:/^#[a-fA-F0-9]{6}$/'],
            'portal_url' => ['required', 'string', 'url', 'max:500'],
            'login_callback_url' => ['nullable', 'string', 'url', 'max:500'],
            'open_in_new_tab' => ['required', 'boolean'],
            'is_global_visibility' => ['required', 'boolean'],
            'sort_order' => ['required', 'integer', 'min:0', Rule::unique('registered_apps', 'sort_order')->ignore($id)],
            'is_active' => ['required', 'boolean'],
            'selected_roles' => ['nullable', 'array'],
            'selected_roles.*' => ['exists:roles,id'],
        ], [
            'sort_order.unique' => 'Urutan (sort) sudah digunakan oleh aplikasi lain.',
            'sort_order.min' => 'Urutan tidak boleh bernilai negatif.',
            'logo_file.max' => 'Ukuran logo tidak boleh melebihi 10MB.',
        ]);

        $logoUrl = $request->logo_url;

        if ($request->hasFile('logo_file')) {
            // Hapus logo lama jika ada
            if ($app->logo_url && str_contains($app->logo_url, '/storage/logos/')) {
                $oldPath = 'logos/' . basename($app->logo_url);
                Storage::disk('public')->delete($oldPath);
            }

            $path = $this->kompresLogo($request->file('logo_file'));
            $logoUrl = Storage::url($path);
        }

        $app->update([
            'nama_aplikasi' => $request->nama_aplikasi,
            'deskripsi' => $request->deskripsi,
            'logo_url' => $logoUrl,
            'icon_material' => $request->icon_material ?: 'apps',
            'warna_icon' => $request->warna_icon ?: '#3b82f6',
            'portal_url' => $request->portal_url,
            'open_in_new_tab' => $request->open_in_new_tab,
            'login_callback_url' => $request->login_callback_url,
            'is_global_visibility' => $request->is_global_visibility,
            'sort_order' => $request->sort_order,
            'is_active' => $request->is_active,
        ]);

        if ($request->is_global_visibility) {
            $app->roles()->detach();
        } else {
            $app->roles()->sync($request->input('selected_roles', []));
        }

        \App\Services\LayananLogAktivitas::catat('Memperbarui data aplikasi terdaftar: ' . $app->nama_aplikasi);

        return redirect()->back()->with('success', 'Data aplikasi berhasil diperbarui.');
    }

    public function hapus(string $id)
    {
        $app = RegisteredApp::findOrFail($id);
        $namaApp = $app->nama_aplikasi;

        if ($app->logo_url && str_contains($app->logo_url, '/storage/logos/')) {
            $oldPath = 'logos/' . basename($app->logo_url);
            Storage::disk('public')->delete($oldPath);
        }

        $app->delete();

        Cache::forget('superadmin:statistik');

        \App\Services\LayananLogAktivitas::catat('Menghapus aplikasi terdaftar: ' . $namaApp);

        return redirect()->back()->with('success', 'Aplikasi berhasil dihapus.');
    }

    /**
     * Kompres logo yang diunggah ke format JPG dengan kualitas 75%.
     */
    private function kompresLogo($file): string
    {
        $info = getimagesize($file->getRealPath());
        $mime = $info['mime'];

        // Jika extension svg atau gif, jangan dikompres agar tidak merusak format
        if ($mime === 'image/svg+xml' || $mime === 'image/gif') {
            return $file->store('logos', 'public');
        }

        // Tentukan nama berkas dan path temporer
        $fileName = 'logos/' . Str::random(40) . '.jpg';
        $tempPath = tempnam(sys_get_temp_dir(), 'logo');

        switch ($mime) {
            case 'image/jpeg':
            case 'image/jpg':
                $image = @imagecreatefromjpeg($file->getRealPath());
                break;
            case 'image/png':
                $image = @imagecreatefrompng($file->getRealPath());
                if ($image) {
                    imagealphablending($image, true);
                    imagesavealpha($image, true);
                }
                break;
            case 'image/webp':
                $image = @imagecreatefromwebp($file->getRealPath());
                break;
            default:
                return $file->store('logos', 'public');
        }

        if (!$image) {
            return $file->store('logos', 'public');
        }

        // Kompres gambar menjadi JPG dengan kualitas 75 (sangat menghemat memori)
        imagejpeg($image, $tempPath, 75);
        imagedestroy($image);

        // Simpan berkas hasil kompresi ke storage
        Storage::disk('public')->put($fileName, file_get_contents($tempPath));
        @unlink($tempPath);

        return $fileName;
    }
}
