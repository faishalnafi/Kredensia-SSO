# 🧠 SSO Sekolah - KNOWLEDGE BASE & DEVELOPER GUIDE
Dokumen ini berfungsi sebagai dokumentasi teknis yang komprehensif bagi Programmer dan **AI Agents** di masa depan yang akan melanjutkan pengembangan proyek portal SSO ini.

---

## 1. ARSITEKTUR & TECH STACK
Aplikasi ini dibangun menggunakan arsitektur *Monolith* bergaya *Single Page Application* (SPA) tanpa API eksternal terpisah untuk *frontend*.

### 1.1 Persyaratan Sistem (System Requirements)
- **PHP**: `^8.2` (Wajib mendukung strict_types).
- **Node.js**: `v18.x` atau lebih baru.
- **Database Utama**: `MySQL/MariaDB` (Direkomendasikan), `PostgreSQL` (`^13.x`), atau `SQLite` (lokal/testing).
- **Cache & Session Stores**: `Redis` (`^7.x`), `MongoDB` (melalui `mongodb/laravel-mongodb`), atau `Amazon DynamoDB` (via AWS SDK).
- **Web Server**: `NGINX`, `Apache HTTP Server`, `LiteSpeed (LSWS)`, `Microsoft IIS (Internet Information Services)`, atau `Caddy`.

### 1.2 Versi Pustaka Utama (Dependencies)
| Kategori | Paket / Pustaka | Versi | Peran |
| :--- | :--- | :--- | :--- |
| **Backend** | `laravel/framework` | `^12.0` | Framework inti backend. |
| | `inertiajs/inertia-laravel` | `^2.0` | Adaptor Inertia untuk merender React dari Controller. |
| | `laravel/sanctum` | `^4.0` | Autentikasi token & SPA stateful. |
| **Frontend** | `react` & `react-dom` | `^18.2.0` | Pustaka antarmuka pengguna. |
| | `@inertiajs/react` | `^2.0.0` | Adaptor Inertia sisi klien. |
| | `tailwindcss` | `^3.2.1` | Framework CSS Utility-first. |
| | `vite` | `^4.0.0` | Bundler aset (menggantikan Webpack). |
| **Security**| `Http::post` (REST API)| `N/A` | Google reCAPTCHA Enterprise Validation (Tanpa SDK berat). |


---

## 2. STANDAR PENGKODEAN (AI AGENT RULES)
Berdasarkan dokumen `AGENTS.md`, seluruh agen pengembang harus mematuhi aturan berikut secara ketat:

### 2.1 Konvensi Penamaan (Wajib Bahasa Indonesia)
- **Class/Model:** PascalCase (Contoh: `Pengguna`, `AplikasiTerdaftar`, `PengaturanSistem`).
- **Fungsi/Metode:** camelCase (Contoh: `ambilDataPengguna()`, `validasiToken()`).
- **Variabel:** camelCase (Contoh: `namaLengkap`, `daftarAplikasi`).
- **Route URL:** kebab-case (Contoh: `/superadmin/manajemen-aplikasi`).

### 2.2 Aturan UI/Frontend (Anti-CLS & Glassmorphism)
- DILARANG menggunakan pustaka SVG *spinner* (seperti `react-content-loader`).
- **Wajib menggunakan komponen `<Skeleton />`** bawaan berbasis Tailwind (`animate-pulse`).
- Pembungkus grid/flex harus berada *di luar* kondisi `isLoading` dengan rasio aspek tetap agar tata letak (layout) tidak bergeser sama sekali saat data dimuat (Zero CLS).
- Antarmuka harus mengutamakan *Glassmorphism* (misal: `bg-white/20 backdrop-blur-md`).

### 2.3 Aturan Backend (Laravel)
- Setiap file PHP wajib diawali dengan `declare(strict_types=1);`.
- Semua pengembalian tampilan harus menggunakan `Inertia::render()`.
- Validasi formulir yang rumit wajib dipisah ke dalam class `FormRequest` khusus.

---

## 3. SKEMA DATABASE (ENTITY RELATIONSHIP)
Skema ini menggunakan pola penamaan Bahasa Indonesia untuk hampir semua entitas (kecuali bawaan Laravel).

### 3.1 Tabel Inti
- **`users` (Pengguna):** Menyimpan data otentikasi inti. Kolom: `id` (UUID), `nama_lengkap`, `email`, `password`, `nik`, `nip_nis`, `jk`, `avatar_url`, `is_active`, `claimed_at`.
- **`peran` (Roles):** Menyimpan daftar peran sistem (Superadmin, Admin, Guru, Siswa). Kolom: `id` (UUID), `nama_role`, `deskripsi`.
- **`peran_pengguna` (Pivot):** Relasi Many-to-Many antara `users` dan `peran`.
- **`pengaturan_sistem`:** Konfigurasi dinamis global (Nama Aplikasi, Logo, Bantuan). Model ini dipanggil di Middleware `HandleInertiaRequests`.

### 3.2 Tabel Ekosistem SSO
- **`aplikasi_terdaftar`:** Daftar klien OAuth/SSO pihak ketiga. Kolom: `id` (UUID), `nama_aplikasi`, `client_id`, `client_secret`, `redirect_uri`, `icon_url`.
- **`peran_aplikasi` (Pivot):** Hak akses aplikasi berdasarkan peran pengguna.
- **`kunci_api`:** Menyimpan *API Keys* khusus untuk integrasi pihak ketiga.

### 3.3 Tabel Aktivitas
- **`log_aktivitas`:** Tabel pencatatan riwayat (Audit Trail) dari pengguna. Kolom: `user_id`, `aktivitas`, `ip_address`, `user_agent`.
- **`koreksi_pengguna`:** Log pengajuan perubahan data dari pengguna ke admin.

---

## 4. KEAMANAN & AUTENTIKASI (SECURITY LOGIC)
1. **Google reCAPTCHA Enterprise:**
   - Diintegrasikan murni menggunakan **REST API Laravel** (di `App\Services\RecaptchaService.php`) untuk menghindari dependensi berat JSON GCP SDK.
   - Variabel Lingkungan: `RECAPTCHA_SITE_KEY`, `RECAPTCHA_PROJECT_ID`, `RECAPTCHA_API_KEY`.
   - Validasi dilakukan di `LoginRequest.php` *sebelum* pengecekan password database untuk menghemat sumber daya terhadap serangan brute-force bot.
2. **Setup Wizard Terisolasi:**
   - Halaman `/setup` (SetupController) digunakan untuk melakukan migrasi dan *seeding* otomatis bagi pengguna yang tidak memiliki akses terminal (seperti pengguna aaPanel).
   - Middleware `HandleInertiaRequests` dilindungi dengan `try...catch` agar tidak *crash* jika tabel pengaturan belum terbuat saat `/setup` diakses.

---

## 5. PANDUAN DEPLOYMENT (RINGKASAN INSTALASI)
Catatan untuk programmer yang menangani produksi:
1. Jalankan `npm run build` sebelum *deployment*.
2. HAPUS file `public/hot` di server produksi agar *Vite* mengarahkan aset ke folder kompilasi (menghindari layar putih blank).
3. Matikan batasan `open_basedir` / *Anti-XSS* pada panel hosting agar `index.php` bisa membaca folder `vendor`.
4. Ubah `SESSION_DRIVER=database` menjadi `file` sementara saat menjalankan `/setup` pertama kali, lalu kembalikan ke `database` setelah instalasi sukses.
5. Tersedia skrip otomatis untuk Docker: `setup-docker.ps1` (Windows) dan `setup-docker.sh` (Mac/Linux).
