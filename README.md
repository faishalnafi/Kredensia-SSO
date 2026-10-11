<div align="center">

<br/>

# 🏫 SSO Sekolah
### Portal Otentikasi Terpusat untuk Ekosistem Sekolah Digital

<br/>

[![Version](https://img.shields.io/badge/Versi-v1.8.0-6366f1?style=for-the-badge&logo=git&logoColor=white)](https://github.com/faishalnafi/sso-sekolah-monolith)
[![Laravel](https://img.shields.io/badge/Laravel-12.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Inertia](https://img.shields.io/badge/Inertia.js-v2-9553E9?style=for-the-badge)](https://inertiajs.com)
[![WebSocket](https://img.shields.io/badge/Real--Time-Laravel%20Reverb-ff2d20?style=for-the-badge&logo=laravel&logoColor=white)](https://laravel.com/docs/reverb)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)](.)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v3-38BDF8?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![License](https://img.shields.io/badge/Lisensi-Open%20Source%20(MIT)-22c55e?style=for-the-badge&logo=opensourceinitiative&logoColor=white)](./LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](./docker-compose.yml)
[![Status](https://img.shields.io/badge/Status-Production-f59e0b?style=for-the-badge&logo=checkmarx&logoColor=white)](.)

<br/>

> **SSO Sekolah** adalah solusi *Single Sign-On* terpusat yang dirancang khusus untuk ekosistem sekolah digital Indonesia. Satu akun, akses ke semua aplikasi. Dilengkapi dengan otentikasi multi-faktor (2FA/MFA) tingkat tinggi, sinkronisasi sesi perangkat real-time dua arah, pengalih multi-akun (maksimal 25 akun), integrasi WhatsApp Gateway (Fonnte) & Email SMTP dinamis, verifikasi identitas siswa & guru, manajemen peran berbasis RBAC, REST API terintegrasi, serta instalasi siap-pakai via Docker atau Setup Wizard berbasis browser.

<br/>

</div>

---

## 📋 Daftar Isi

- [✨ Fitur Unggulan](#-fitur-unggulan)
- [🛠️ Tech Stack](#️-tech-stack)
- [📁 Struktur Folder](#-struktur-folder)
- [⚡ Quick Start](#-quick-start)
  - [🐳 Docker (Rekomendasi)](#-docker-rekomendasi)
  - [🔧 Instalasi Manual](#-instalasi-manual)
- [🧙 Web Setup Wizard](#-web-setup-wizard)
- [🔑 Kredensial Default](#-kredensial-default)
- [📡 REST API](#-rest-api)
- [⚙️ Konfigurasi Lingkungan](#️-konfigurasi-lingkungan)
- [🤝 Panduan Kontribusi](#-panduan-kontribusi)
- [📄 Lisensi](#-lisensi)

---

## ✨ Fitur Unggulan

<table>
<tr>
<td width="50%">

### 🔐 Autentikasi Multi-Provider & Kredensial Fleksibel
Login fleksibel menggunakan **Email**, **Username khusus**, atau **UUID**, didukung integrasi **Google OAuth 2.0**. Sesi dijaga dengan cookie lintas subdomain terenkripsi, cocok untuk ekosistem multi-aplikasi sekolah.

### 🛡️ Keamanan Akun Multi-Faktor (2FA & MFA Lengkap)
Lapisan proteksi keamanan sekelas perbankan & Google Account:
- **Aplikasi Autentikator (TOTP)**: Google Authenticator, Microsoft Authenticator, atau Aegis.
- **Tantangan Google Prompt Real-Time**: Konfirmasi login interaktif langsung dari perangkat tepercaya via WebSocket.
- **Kunci Sandi (Passkey) & Kunci Keamanan**: Autentikasi biometrik WebAuthn (Touch ID / Face ID / Windows Hello / YubiKey).
- **Kode Cadangan 10-Digit**: Kumpulan kode cadangan darurat sekali pakai.
- **OTP WhatsApp & Surel**: Pengiriman kode OTP via Gateway WhatsApp (Fonnte) dan SMTP Email.

### ⚡ Sinkronisasi Sesi Real-Time 2 Arah (WebSocket Reverb)
Deteksi otomatis penambahan dan pengakhiran sesi perangkat secara langsung tanpa reload halaman. Pengguna dapat memantau peramban, lokasi IP, serta mengakhiri sesi perangkat lain secara remote.

### 👥 Pengalih Multi-Akun (Hingga 25 Akun per Peramban)
Fitur *Google-Style Account Switcher* yang memungkinkan hingga 25 sesi akun berbeda aktif secara simultan dalam satu peramban, memudahkan guru atau siswa berganti profil secara instan.

### ✅ Verifikasi & Klaim Akun Mandiri
Siswa dan guru dapat **memverifikasi & mengklaim akun** mereka secara mandiri menggunakan kombinasi NIK, NISN/NIP, dan Tanggal Lahir yang terdaftar di database sekolah.

### 🏫 Modul Akademik Terpadu
Pengelolaan data terpadu untuk **Tahun Pelajaran**, **Kelas & Jurusan**, serta formulir **Biodata Wajib** dengan sistem blokir akses otomatis hingga biodata dilengkapi.

</td>
<td width="50%">

### 💬 Gateway WhatsApp (Fonnte) & Email Dinamis di Superadmin
Integrasi WhatsApp API resmi via [Fonnte](https://fonnte.com) dan SMTP Email yang sepenuhnya dapat dikonfigurasi melalui panel antarmuka Superadmin (API token, template pesan variabel dinamis, serta fitur uji kirim pesan instan) tanpa perlu mengubah kode statis.

### 📊 Log Aktivitas & Pengarsipan Otomatis (Dual-Layer Auto Archive)
Merekam seluruh aktivitas otentikasi dan aksi sistem secara detail. Dilengkapi fitur **auto-archive bulanan otomatis setiap tanggal 1** yang mengompresi log lawas ke berkas JSON terstruktur demi performa database maksimal.

### 📦 Pembaruan Sistem 1-Klik (ZIP Updater)
Fitur unggah paket ZIP pembaruan aplikasi langsung dari antarmuka Superadmin yang secara otomatis mengekstrak berkas, menjalankan migrasi database, dan mereset OPcache & cache sistem tanpa mematikan server.

### 👥 Manajemen Pengguna & Peran (RBAC)
Panel admin lengkap dengan **CRUD pengguna**, impor massal CSV/Excel, filter peran, dan sistem **Role-Based Access Control** (RBAC) yang terperinci.

### 🏢 Manajemen Aplikasi Terdaftar & Kunci API REST
Daftarkan dan kelola aplikasi klien ekosistem sekolah. Setiap aplikasi mendapatkan kunci API unik dengan pembatasan domain (CORS whitelist).

### 🛡️ Google reCAPTCHA Enterprise
Proteksi anti-bot tingkat lanjut menggunakan **reCAPTCHA Enterprise (Invisible)** pada seluruh form otentikasi.

### 🌙 Dark / Light Mode & PWA Ready
Antarmuka modern berbasis Glassmorphism & Bento Grid dengan tema gelap/terang otomatis serta dukungan **Progressive Web App (PWA)** untuk pengalaman penggunaan mirip aplikasi *native*.

</td>
</tr>
</table>

---

## 🛠️ Tech Stack

| Kategori | Teknologi | Versi |
|---|---|---|
| **Backend Framework** | Laravel | `^12.x` (PHP 8.2+) |
| **Frontend Library** | React | `^18.x` |
| **Bridge SPA** | Inertia.js | `^2.x` |
| **Real-Time WebSocket** | Laravel Reverb | `^1.x` |
| **PWA Engine** | Vite PWA Plugin + Workbox | `^1.3.x` |
| **UI Styling** | Tailwind CSS | `^3.x` |
| **Build Tool** | Vite | `^6.x` |
| **Database** | MySQL / MariaDB | `^8.x` |
| **Cache & Queue** | Redis | `^7.x` |
| **WhatsApp Gateway** | Fonnte API | v4 |
| **Biometric & Hardware Key** | WebAuthn / Passkeys (FIDO2) | W3C Standard |
| **Web Server** | Nginx + PHP-FPM / FrankenPHP | `8.2+` |
| **Kontainerisasi** | Docker + Compose | `^26.x` |
| **Autentikasi OAuth** | Google OAuth 2.0 | — |
| **Proteksi Bot** | Google reCAPTCHA Enterprise | v3 Invisible |
| **API Auth** | API Key (Bearer / X-API-Key) | — |

---

## 📁 Struktur Folder

```
sso-sekolah/
├── app/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   ├── Api/              # REST API Controllers
│   │   │   ├── Auth/             # Autentikasi (Login, Klaim, Google OAuth)
│   │   │   ├── Admin/            # Dasbor & panel Admin
│   │   │   └── Superadmin/       # Semua fitur superadmin
│   │   ├── Middleware/           # ApiKey auth, pengecekan peran
│   │   └── Requests/             # FormRequest validasi (dual-layer)
│   ├── Models/                   # Eloquent models (penamaan Bahasa Indonesia)
│   └── Services/                 # RecaptchaService, LayananJWT, dll.
│
├── database/
│   ├── migrations/               # 16 migration files (UUID-based)
│   └── seeders/                  # SuperadminSeeder
│
├── resources/
│   ├── js/
│   │   ├── Components/           # Komponen React yang dapat digunakan ulang
│   │   ├── Layouts/              # TataLetakUtama, GuestLayout, dll.
│   │   └── Pages/                # Halaman React (Auth, Superadmin, Admin)
│   └── views/
│       └── app.blade.php         # Entry-point Blade untuk Inertia
│
├── routes/
│   ├── api.php                   # REST API routes (v1)
│   ├── web.php                   # Web routes utama
│   └── auth.php                  # Auth routes (login, register, klaim)
│
├── docker/                       # Konfigurasi Nginx, Supervisor, Entrypoint
│
├── public/
│   ├── images/                   # Ilustrasi halaman login
│   └── docs/                     # Spesifikasi OpenAPI/Swagger (JSON)
│
├── .env.example                  # Template konfigurasi environment
├── docker-compose.yml            # Docker Compose utama
├── docker-compose.override.yml.example  # Template secrets Docker
├── setup-docker.ps1              # 1-Click installer — Windows
├── setup-docker.sh               # 1-Click installer — Linux/Mac
├── instalasi.txt                 # Panduan instalasi lengkap (teks)
├── api.md                        # Dokumentasi REST API
├── DEVELOPER_GUIDE.md            # Panduan developer & AI agents
└── README.md                     # Dokumen ini ✅
```

---

## ⚡ Quick Start

### 🐳 Docker (Rekomendasi)

Cara tercepat dan termudah untuk menjalankan SSO Sekolah secara lokal atau di server produksi.

**Prasyarat:** Docker Engine `^26.x` & Docker Compose sudah terpasang.

#### 🐧 Linux / macOS

```bash
# 1. Clone repositori
git clone https://github.com/faishalnafi/sso-sekolah.git
cd sso-sekolah

# 2. Jalankan skrip instalasi 1-klik
chmod +x setup-docker.sh
./setup-docker.sh

# 3. Buka browser, selesaikan Setup Wizard
#    http://localhost/setup
```

#### 🪟 Windows (PowerShell)

```powershell
# 1. Clone repositori
git clone https://github.com/faishalnafi/sso-sekolah.git
cd sso-sekolah

# 2. Jalankan skrip instalasi 1-klik (sebagai Administrator)
.\setup-docker.ps1

# 3. Buka browser, selesaikan Setup Wizard
#    http://localhost/setup
```

> **💡 Tips:** Untuk konfigurasi port dan secrets Docker, salin `docker-compose.override.yml.example` menjadi `docker-compose.override.yml` dan sesuaikan nilainya sebelum menjalankan skrip.

---

### 🔧 Instalasi Manual

Cocok untuk lingkungan pengembangan lokal tanpa Docker.

**Prasyarat:** PHP `^8.3`, Composer, Node.js `^20.x`, npm, MySQL/MariaDB, Redis.

```bash
# 1. Clone & masuk ke direktori
git clone https://github.com/faishalnafi/sso-sekolah.git
cd sso-sekolah

# 2. Install dependensi PHP
composer install --optimize-autoloader

# 3. Install dependensi JavaScript
npm install

# 4. Build aset frontend untuk produksi
npm run build

# 5. Salin file konfigurasi
cp .env.example .env

# 6. Generate application key
php artisan key:generate

# 7. Konfigurasi .env (database, mail, Google OAuth, dll.)
#    Lihat bagian ⚙️ Konfigurasi Lingkungan di bawah

# 8. Buka browser, selesaikan Setup Wizard
#    http://your-domain.com/setup
```

> **📖 Catatan:** Panduan instalasi lengkap tersedia di [`instalasi.txt`](./instalasi.txt).

---

## 🧙 Web Setup Wizard

SSO Sekolah dilengkapi dengan **Setup Wizard berbasis browser** — tidak perlu terminal untuk konfigurasi awal!

Setelah aplikasi berjalan, buka `/setup` di browser Anda. Wizard akan memandu langkah demi langkah:

| Langkah | Keterangan |
|---|---|
| **1️⃣ Koneksi Database** | Masukkan kredensial MySQL dan uji koneksi |
| **2️⃣ Migrasi & Seed** | Buat tabel dan data awal secara otomatis |
| **3️⃣ Akun Superadmin** | Atur email, nama, dan kata sandi superadmin |
| **4️⃣ Pengaturan Aplikasi** | Nama aplikasi, URL, dan konfigurasi dasar |
| **5️⃣ Google OAuth** *(Opsional)* | Client ID & Secret untuk login Google |
| **6️⃣ reCAPTCHA** *(Opsional)* | Konfigurasi Google reCAPTCHA Enterprise |
| **✅ Selesai!** | Aplikasi siap digunakan |

Setelah wizard selesai, rute `/setup` otomatis **terkunci** untuk keamanan.

---

## 🔑 Kredensial Default

> [!CAUTION]
> Segera ubah kata sandi default ini setelah instalasi selesai!

| Peran | Email | Kata Sandi | Akses |
|---|---|---|---|
| **Superadmin** | `superadmin@faishalnafi.com` | `superadmin` | Semua fitur, termasuk manajemen sistem |
| **Admin** | `admin@faishalnafi.com` | `admin` | Manajemen pengguna, log aktivitas |

---

## 📡 REST API

SSO Sekolah menyediakan **REST API v1** untuk integrasi dengan aplikasi sekolah lain.

### Autentikasi API

Setiap request ke API wajib menyertakan API Key yang valid melalui salah satu cara berikut:

```http
# Cara 1: Header Authorization Bearer
Authorization: Bearer skp_xxxxxxxxxxxxxxxxxxx

# Cara 2: Header X-API-Key
X-API-Key: skp_xxxxxxxxxxxxxxxxxxx
```

API Key dikelola oleh Superadmin dan **dibatasi per domain** — hanya request dari domain terdaftar yang akan diizinkan.

### Endpoint Utama

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/v1/test` | Tes konektivitas & verifikasi domain |
| `GET` | `/api/v1/pengguna` | Ambil data profil pengguna berdasarkan email |
| `GET` | `/api/v1/pengguna/{uuid}` | Ambil data profil pengguna berdasarkan UUID |

### Contoh Response

```json
{
  "status": "success",
  "data": {
    "uuid": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Budi Santoso",
    "email": "budi@sekolah.sch.id",
    "roles": ["Siswa"],
    "nisn": "1234567890",
    "kelas": "XII IPA 1"
  }
}
```

> **📖 Dokumentasi API Lengkap:** Tersedia di [`api.md`](./api.md) dan spesifikasi OpenAPI/Swagger di `public/docs/`.

---

## ⚙️ Konfigurasi Lingkungan

Salin `.env.example` menjadi `.env` dan sesuaikan variabel-variabel berikut:

```dotenv
# ── Aplikasi ──────────────────────────────────────────────
APP_NAME="SSO Sekolah"
APP_URL=https://sso.sekolah.sch.id
APP_KEY=                          # Generate: php artisan key:generate

# ── Database ──────────────────────────────────────────────
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=sso_sekolah
DB_USERNAME=root
DB_PASSWORD=

# ── Cache & Session ───────────────────────────────────────
CACHE_STORE=redis
SESSION_DRIVER=redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# ── Google OAuth 2.0 ──────────────────────────────────────
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI="${APP_URL}/auth/google/callback"

# ── Google reCAPTCHA Enterprise ───────────────────────────
RECAPTCHA_PROJECT_ID=your-gcp-project-id
RECAPTCHA_API_KEY=your-recaptcha-api-key
RECAPTCHA_SITE_KEY=your-site-key
RECAPTCHA_SCORE_THRESHOLD=0.5     # Skor minimum (0.0 - 1.0)

# ── Cookie Lintas Subdomain ───────────────────────────────
SESSION_DOMAIN=.sekolah.sch.id    # Prefix titik untuk lintas subdomain
SANCTUM_STATEFUL_DOMAINS=sso.sekolah.sch.id,app1.sekolah.sch.id
```

---

## 🤝 Panduan Kontribusi

Kontribusi sangat kami sambut! Baik itu perbaikan bug, fitur baru, atau penyempurnaan dokumentasi.

1. **Fork** repositori ini
2. **Buat branch fitur:** `git checkout -b fitur/nama-fitur-baru`
3. **Commit perubahan** dengan pesan yang deskriptif
4. **Push ke branch:** `git push origin fitur/nama-fitur-baru`
5. **Buat Pull Request** dan jelaskan perubahan yang dilakukan

> **📖 Standar Kode:** Baca [`DEVELOPER_GUIDE.md`](./DEVELOPER_GUIDE.md) untuk memahami konvensi penamaan, arsitektur, dan alur kerja pengembangan.

### Standar Penamaan Kode

| Elemen | Konvensi | Contoh |
|---|---|---|
| Class / Model | PascalCase (Bahasa Indonesia) | `Pengguna`, `KunciApi` |
| Fungsi / Metode | camelCase (Bahasa Indonesia) | `ambilDataPengguna()` |
| Variabel | camelCase (Bahasa Indonesia) | `namaLengkap`, `daftarAplikasi` |
| URL Route | kebab-case | `/superadmin/manajemen-aplikasi` |
| Komponen React | PascalCase (Bahasa Indonesia) | `KomponenModal`, `TataLetakUtama` |

---

## 📄 Lisensi

Proyek ini dirilis di bawah **Lisensi Open Source (MIT-like)** — bebas digunakan, dimodifikasi, dan didistribusikan, baik untuk keperluan pribadi maupun komersial, dengan tetap mencantumkan atribusi kepada penulis asli.

Lihat file [`LICENSE`](./LICENSE) untuk detail lengkap.

---

<div align="center">

<br/>

Dibuat dengan ❤️ oleh

### [Faishal Nafi Network](https://faishalnafi.com)

*Membangun infrastruktur digital yang andal untuk pendidikan Indonesia*

<br/>

[![Website](https://img.shields.io/badge/Website-faishalnafi.com-6366f1?style=flat-square&logo=globe&logoColor=white)](https://faishalnafi.com)
[![Version](https://img.shields.io/badge/SSO%20Sekolah-v1.8.0%20Production-22c55e?style=flat-square)](.)
[![Community Edition](https://img.shields.io/badge/Community-Edition-f59e0b?style=flat-square&logo=opensourceinitiative&logoColor=white)](.)

<br/>

*SSO Sekolah — Portal Otentikasi Terpusat · v1.8.0 · Production Edition*

</div>
