<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class SimpanTahunPelajaranRequest extends FormRequest
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
            'tahun_mulai' => ['required', 'integer', 'min:2000', 'max:2100'],
            'tahun_selesai' => ['required', 'integer', 'min:2000', 'max:2100', 'gt:tahun_mulai'],
            'semester' => ['required', 'in:Ganjil,Genap'],
            'is_aktif' => ['nullable', 'boolean'],
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
            'tahun_mulai.required' => 'Tahun mulai wajib diisi.',
            'tahun_mulai.integer' => 'Tahun mulai harus berupa angka.',
            'tahun_mulai.min' => 'Tahun mulai minimal tahun 2000.',
            'tahun_mulai.max' => 'Tahun mulai maksimal tahun 2100.',
            'tahun_selesai.required' => 'Tahun selesai wajib diisi.',
            'tahun_selesai.integer' => 'Tahun selesai harus berupa angka.',
            'tahun_selesai.min' => 'Tahun selesai minimal tahun 2000.',
            'tahun_selesai.max' => 'Tahun selesai maksimal tahun 2100.',
            'tahun_selesai.gt' => 'Tahun selesai harus lebih besar dari tahun mulai.',
            'semester.required' => 'Semester wajib dipilih.',
            'semester.in' => 'Semester harus berupa Ganjil atau Genap.',
        ];
    }
}
