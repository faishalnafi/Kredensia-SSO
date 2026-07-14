# PANDUAN AGEN PENGEMBANG (DEVELOPER AGENT WORKFLOW)
# Proyek: SSO Sekolah Terpusat (Monolith SPA - Laravel 12 + React Inertia)

Dokumen ini mendefinisikan alur kerja tim atau agen AI otonom dalam siklus pengembangan perangkat lunak (SDLC) untuk aplikasi SSO.

## 1. PEMBAGIAN TUGAS AGEN (AI AGENT ROLES)

### A. Agen Backend (Fokus pada Laravel 12, Keamanan, & Database)
- Bertanggung jawab merancang arsitektur MVC dan Strict OOP menggunakan Bahasa Indonesia.
- Mengimplementasikan `FormRequest` untuk validasi lapis kedua (Dual-Layer Verification).
- Menulis logika JIT Provisioning, JWT Payload, dan Cookie Lintas Subdomain.
- Memastikan semua `Model` terhubung dengan tabel UUID.

### B. Agen Frontend (Fokus pada React, Tailwind, & Inertia)
- Membangun UI/UX menggunakan prinsip desain modern, *floating layer*, *glassmorphism*, dan *Bento Grid*.
- Membangun *Single Page Application* (SPA) dengan Inertia.js dan mengelola *state* komponen.
- Menerapkan validasi formulir sisi klien (lapis pertama) sebelum mengirim *request* ke backend.
- Menulis seluruh nama komponen dan variabel menggunakan Bahasa Indonesia baku.

### C. Agen DevOps (Fokus pada Infrastruktur, CI/CD, & Cloud)
- Mengelola konfigurasi `.env` dan integrasi dengan Object Storage (AWS S3 / GCP).
- Mengelola *Deployment pipeline*, mengatur server produksi, dan menangani *SSL/TLS* untuk *Secure Cookies*.

---

## 2. STANDAR PENULISAN KODE (CODING STANDARDS)

### Aturan Penamaan (Wajib Bahasa Indonesia Baku)
- **Class / Model:** PascalCase (contoh: `Pengguna`, `Peran`, `AplikasiTerdaftar`)
- **Fungsi / Metode:** camelCase (contoh: `ambilDataPengguna()`, `validasiKoreksi()`)
- **Variabel:** camelCase (contoh: `namaLengkap`, `kataSandi`, `daftarAplikasi`)
- **URL Route:** kebab-case (contoh: `/superadmin/manajemen-aplikasi`)

### Aturan Backend (Laravel 12)
- Wajib menggunakan `strict_types=1`.
- Pengembalian data ke frontend wajib menggunakan `Inertia::render()`.
- Validasi wajib dipisah ke dalam class `FormRequest`.

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Pengguna;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PenggunaController extends Controller
{
    # Mengambil data pengguna untuk ditampilkan di dasbor
    public function tampilkanDasbor(): Response
    {
        # Mengambil semua data dari tabel pengguna
        $daftarPengguna = Pengguna::all();
        
        return Inertia::render('Admin/Dasbor', [
            'daftarPengguna' => $daftarPengguna
        ]);
    }
}
```

### Standar Loading State (Anti-CLS)
- Agen Frontend DILARANG KERAS menggunakan library SVG pihak ketiga (seperti react-content-loader) untuk membuat efek skeleton.
- **Pendekatan Skeleton-as-a-State**: Wajib menggunakan komponen `<Skeleton />` bawaan yang dibuat secara manual menggunakan utilitas Tailwind `animate-pulse` dipadukan dengan warna glassmorphism (misal: `bg-white/20` atau `bg-slate-200/50`).
- **Zero Cumulative Layout Shift (CLS)**: Saat melakukan transisi dari Skeleton Loading ke data asli (loaded), layout TIDAK BOLEH bergeser 1 milimeter pun. Agen wajib menerapkan:
  - Pembungkus terluar (Grid/Flexbox layout, padding, margin, dan gap) harus berada DI LUAR pengecekan kondisi `isLoading`.
  - Menggunakan Aspect Ratios tetap (misal: `aspect-square`, `aspect-video`) pada pembungkus media/gambar.
  - Menentukan dimensi pasti (`h-4`, `w-32`, `w-full`) pada komponen Skeleton agar sama persis dengan tinggi dan lebar tipografi/elemen asli saat di-render.
  - Sertakan instruksi bahasa Indonesia pada komentar komponen yang menjelaskan bahwa struktur pembungkus dipertahankan demi mencegah Layout Shift.
