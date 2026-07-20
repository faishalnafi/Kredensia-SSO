<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SimpanKelasRequest extends FormRequest
{
    /**
     * Tentukan apakah pengguna diizinkan melakukan request ini.
     */
    public function authorize(): bool
    {
        // Hanya izinkan admin dan superadmin
        $user = $this->user();
        return $user && ($user->hasRole('Super Admin') || $user->hasRole('Admin') || $user->hasRole('superadmin') || $user->hasRole('admin'));
    }

    /**
     * Dapatkan aturan validasi yang berlaku untuk request ini.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'nama_kelas' => ['required', 'string', 'max:100'],
            'tingkat' => ['required', 'string', 'max:20'],
            'tahun_pelajaran_id' => ['required', 'uuid', 'exists:tahun_pelajaran,id'],
            'wali_kelas_id' => ['nullable', 'uuid', 'exists:users,id'],
        ];
    }

    /**
     * Dapatkan pesan kesalahan kustom untuk aturan validasi.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'nama_kelas.required' => 'Nama kelas wajib diisi.',
            'nama_kelas.string' => 'Nama kelas harus berupa teks.',
            'nama_kelas.max' => 'Nama kelas tidak boleh lebih dari 100 karakter.',
            'tingkat.required' => 'Tingkat kelas wajib diisi.',
            'tingkat.string' => 'Tingkat kelas harus berupa teks.',
            'tingkat.max' => 'Tingkat kelas tidak boleh lebih dari 20 karakter.',
            'tahun_pelajaran_id.required' => 'Tahun pelajaran wajib dipilih.',
            'tahun_pelajaran_id.uuid' => 'Format tahun pelajaran tidak valid.',
            'tahun_pelajaran_id.exists' => 'Tahun pelajaran yang dipilih tidak terdaftar.',
            'wali_kelas_id.uuid' => 'Format wali kelas tidak valid.',
            'wali_kelas_id.exists' => 'Wali kelas yang dipilih tidak terdaftar.',
        ];
    }
}
