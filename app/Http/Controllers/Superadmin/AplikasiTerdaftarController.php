<?php

declare(strict_types=1);

namespace App\Http\Controllers\Superadmin;

use App\Http\Controllers\Controller;
use App\Models\RegisteredApp;
use App\Models\Role;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AplikasiTerdaftarController extends Controller
{
    /**
     * Tampilkan daftar aplikasi dengan menyembunyikan Client Secret asli.
     */
    public function indeks(): Response
    {
        $daftarAplikasi = RegisteredApp::with('roles')
            ->orderBy('sort_order', 'asc')
            ->get()
            ->map(function ($app) {
                // Sembunyikan api_key asli dari pengiriman data umum demi keamanan jika terisi (Show Once)
                if ($app->api_key) {
                    $app->api_key = '••••••••••••••••••••••••••••••••••••••••';
                }
                return $app;
            });

        $daftarPeran = Role::all();

        // Ambil api_key_baru jika ada dari session flash
        $apiKeyBaru = session('api_key_baru');

        return Inertia::render('Superadmin/ManajemenAplikasi', [
            'daftarAplikasi' => $daftarAplikasi,
            'daftarPeran' => $daftarPeran,
            'apiKeyBaru' => $apiKeyBaru
        ]);
    }

    /**
     * Daftarkan aplikasi baru dan hasilkan Client Secret acak 64 karakter (jika SSO).
     */
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
            'login_callback_url' => ['nullable', 'string', 'url', 'max:500'], // Tidak wajib lagi
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

        // Generate Client Secret jika login_callback_url diisi
        $clientSecret = null;
        if ($request->filled('login_callback_url')) {
            $clientSecret = Str::random(64);
        }

        $appData = [
            'nama_aplikasi' => $request->nama_aplikasi,
            'deskripsi' => $request->deskripsi,
            'logo_url' => $logoUrl,
            'icon_material' => $request->icon_material ?: 'apps',
            'warna_icon' => $request->warna_icon ?: '#3b82f6',
            'portal_url' => $request->portal_url,
            'open_in_new_tab' => $request->open_in_new_tab,
            'login_callback_url' => $request->login_callback_url,
            'api_key' => $clientSecret,
            'is_global_visibility' => $request->is_global_visibility,
            'sort_order' => $request->sort_order,
            'is_active' => $request->is_active,
        ];

        // Bungkus dalam transaksi DB untuk menjamin ACID:
        // Atomicity: Jika sinkronisasi peran gagal, insert aplikasi ikut di-rollback.
        // Consistency: Tidak ada aplikasi tanpa relasi peran yang setengah jadi.
        // Isolation: Operasi ini terisolasi dari transaksi lain yang berjalan bersamaan.
        // Durability: Jika berhasil commit, data persisten meskipun server crash sesaat kemudian.
        $app = DB::transaction(function () use ($appData, $request) {
            $app = RegisteredApp::create($appData);

            if (!$request->is_global_visibility && $request->has('selected_roles')) {
                $app->roles()->sync($request->selected_roles);
            }

            return $app;
        });

        Cache::forget('superadmin:statistik');
        \App\Services\LayananLogAktivitas::catat('Mendaftarkan aplikasi baru: ' . $app->nama_aplikasi);

        return redirect()->route('superadmin.aplikasi.indeks')
            ->with('success', 'Aplikasi berhasil ditambahkan.')
            ->with('api_key_baru', $clientSecret);
    }

    /**
     * Perbarui data aplikasi tanpa mengubah Client Secret (kecuali callback berubah).
     */
    public function perbarui(Request $request, string $id)
    {
        $app = RegisteredApp::findOrFail($id);

        $request->validate([
            'nama_aplikasi' => ['required', 'string', 'max:150'],
            'deskripsi' => ['nullable', 'string'],
            'logo_url' => ['nullable', 'string', 'max:500'],
            'logo_file' => ['nullable', 'image', 'max:10240'],
            'icon_material' => ['nullable', 'string', 'max:100'],
            'warna_icon' => ['nullable', 'string', 'regex:/^#[a-fA-F0-9]{6}$/'],
            'portal_url' => ['required', 'string', 'url', 'max:500'],
            'login_callback_url' => ['nullable', 'string', 'url', 'max:500'], // Tidak wajib lagi
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
            if ($app->logo_url && str_contains($app->logo_url, '/storage/logos/')) {
                $oldPath = 'logos/' . basename($app->logo_url);
                Storage::disk('public')->delete($oldPath);
            }

            $path = $this->kompresLogo($request->file('logo_file'));
            $logoUrl = Storage::url($path);
        }

        $oldCallback = $app->login_callback_url;
        $newCallback = $request->login_callback_url;

        $updateData = [
            'nama_aplikasi' => $request->nama_aplikasi,
            'deskripsi' => $request->deskripsi,
            'logo_url' => $logoUrl,
            'icon_material' => $request->icon_material ?: 'apps',
            'warna_icon' => $request->warna_icon ?: '#3b82f6',
            'portal_url' => $request->portal_url,
            'open_in_new_tab' => $request->open_in_new_tab,
            'login_callback_url' => $newCallback,
            'is_global_visibility' => $request->is_global_visibility,
            'sort_order' => $request->sort_order,
            'is_active' => $request->is_active,
        ];

        // LOGIKA PERUBAHAN CALLBACK & GENERATE CLIENT ID / SECRET:
        if (empty($newCallback)) {
            // Jika dikosongkan, hapus api_key (client secret)
            $updateData['api_key'] = null;

            // Transaksi ACID: update data aplikasi dan hapus semua relasi peran secara atomik
            DB::transaction(function () use ($app, $updateData) {
                $app->update($updateData);
                // Hapus semua relasi peran karena api_key dikosongkan
                $app->roles()->detach();
            });

            \App\Services\LayananLogAktivitas::catat('Memperbarui data aplikasi: ' . $app->nama_aplikasi . ' (dikosongkan URL Callback & Secret)');
        } else {
            // Jika callback diisi:
            // Cek apakah callback lama kosong, atau berbeda dengan callback baru
            if (empty($oldCallback) || $oldCallback !== $newCallback) {
                // Generate client id baru (UUID) dan secret key baru (64 char)
                $newUuid = (string) Str::uuid();
                $newSecret = Str::random(64);

                // Transaksi ACID: Detach roles, ganti primary key, dan re-attach roles dalam satu unit atomik.
                // Jika salah satu langkah gagal, seluruh operasi akan di-rollback.
                $roles = $app->roles->pluck('id')->toArray();

                DB::transaction(function () use ($id, $newUuid, $newSecret, $updateData, $roles, $app) {
                    // Detach terlebih dahulu untuk menghindari FK constraint violation
                    $app->roles()->detach();

                    DB::table('registered_apps')
                        ->where('id', $id)
                        ->update(array_merge($updateData, [
                            'id'      => $newUuid,
                            'api_key' => $newSecret,
                        ]));

                    // Re-attach roles ke ID baru
                    $newApp = RegisteredApp::findOrFail($newUuid);
                    if (!empty($roles)) {
                        $newApp->roles()->sync($roles);
                    }
                });

                Cache::forget('superadmin:statistik');
                \App\Services\LayananLogAktivitas::catat('Memperbarui data aplikasi: ' . $updateData['nama_aplikasi'] . ' (URL Callback berubah, Client ID & Secret baru dibuat)');
                
                return redirect()->route('superadmin.aplikasi.indeks')
                    ->with('success', 'Data aplikasi diperbarui, Client ID & Secret baru berhasil dibuat.')
                    ->with('api_key_baru', $newSecret);

            } else {
                // Callback tidak berubah: cukup update data tanpa mengganti primary key
                DB::transaction(function () use ($app, $updateData, $request) {
                    $app->update($updateData);

                    if ($request->is_global_visibility) {
                        $app->roles()->detach();
                    } elseif ($request->has('selected_roles')) {
                        $app->roles()->sync($request->selected_roles);
                    }
                });
            }
        }

        Cache::forget('superadmin:statistik');
        \App\Services\LayananLogAktivitas::catat('Memperbarui data aplikasi: ' . $app->nama_aplikasi);

        return redirect()->route('superadmin.aplikasi.indeks')->with('success', 'Data aplikasi berhasil diperbarui.');
    }

    /**
     * Hapus aplikasi dari database.
     */
    public function hapus(string $id): RedirectResponse
    {
        $app = RegisteredApp::findOrFail($id);
        $logoUrl = $app->logo_url;

        // Transaksi ACID: Detach relasi peran dan hapus rekord aplikasi secara atomik.
        // Jika hapus rekord gagal (misal FK constraint lain), relasi peran tidak ikut terputus.
        DB::transaction(function () use ($app) {
            $app->roles()->detach();
            $app->delete();
        });

        // Hapus file logo dari storage SETELAH transaksi DB berhasil (operasi I/O, tidak bisa di-rollback)
        if ($logoUrl && str_contains($logoUrl, '/storage/logos/')) {
            $oldPath = 'logos/' . basename($logoUrl);
            Storage::disk('public')->delete($oldPath);
        }

        Cache::forget('superadmin:statistik');
        \App\Services\LayananLogAktivitas::catat('Menghapus aplikasi: ' . $app->nama_aplikasi);

        return redirect()->route('superadmin.aplikasi.indeks')->with('success', 'Aplikasi berhasil dihapus.');
    }

    /**
     * Hasilkan ulang Client Secret acak 64 karakter (Show Once).
     */
    public function regenerateSecret(string $id): RedirectResponse
    {
        $app = RegisteredApp::findOrFail($id);

        if (empty($app->login_callback_url)) {
            return redirect()->route('superadmin.aplikasi.indeks')
                ->with('error', 'Gagal: Aplikasi non-SSO (tidak ada URL callback) tidak membutuhkan Client Secret.');
        }

        $clientSecretBaru = Str::random(64);

        // Transaksi ACID: Pastikan pembaruan secret terjadi secara atomik.
        // Jika update gagal di tengah jalan (misal deadlock), data tidak berubah setengah.
        DB::transaction(function () use ($app, $clientSecretBaru) {
            $app->update(['api_key' => $clientSecretBaru]);
        });

        \App\Services\LayananLogAktivitas::catat('Meregenerasi Client Secret aplikasi: ' . $app->nama_aplikasi);

        return redirect()->route('superadmin.aplikasi.indeks')
            ->with('success', 'Client Secret berhasil digenerate ulang.')
            ->with('api_key_baru', $clientSecretBaru);
    }

    /**
     * Kompres logo yang diunggah ke format JPG dengan kualitas 75%.
     */
    private function kompresLogo($file): string
    {
        $info = getimagesize($file->getRealPath());
        $mime = $info['mime'];

        if ($mime === 'image/svg+xml' || $mime === 'image/gif') {
            return $file->store('logos', 'public');
        }

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

        imagejpeg($image, $tempPath, 75);
        imagedestroy($image);

        Storage::disk('public')->put($fileName, file_get_contents($tempPath));
        @unlink($tempPath);

        return $fileName;
    }
}
