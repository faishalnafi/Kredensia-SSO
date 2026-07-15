# SSO Sekolah API — Panduan Integrasi

> **Base URL (Production):** `https://your-sso-domain.com`  
> **Dokumentasi Interaktif:** [`https://your-sso-domain.com/api/docs`](https://your-sso-domain.com/api/docs) (Swagger UI)  
> **OpenAPI Spec:** [`https://your-sso-domain.com/docs/openapi.json`](https://your-sso-domain.com/docs/openapi.json)

---

## Daftar Isi

1. [Autentikasi](#1-autentikasi)
2. [Manajemen Pengguna](#2-manajemen-pengguna)
3. [Manajemen Peran](#3-manajemen-peran)
4. [Aplikasi Terdaftar](#4-aplikasi-terdaftar)
5. [Klaim Akun & Verifikasi](#5-klaim-akun--verifikasi)
6. [Integrasi SSO (Redirect & JWT)](#6-integrasi-sso-redirect--jwt)
7. [Kunci API](#7-kunci-api)
8. [Persetujuan Data & Koreksi](#8-persetujuan-data--koreksi)
9. [Keamanan Akun & Sesi](#9-keamanan-akun--sesi)
10. [Pengaturan & Statistik](#10-pengaturan--statistik)
11. [Kode Error](#11-kode-error)
12. [Contoh Integrasi](#12-contoh-integrasi)

---

## 1. Autentikasi

SSO Sekolah mendukung **dua metode autentikasi**:

### 1A. Sesi Login (Cookie-Based)

Diperoleh dari endpoint login (`POST /otentikasi`). Wajib untuk akses dashboard dan operasi write pada panel Superadmin/Admin.

### 1B. API Key — X-API-Key (Integrasi Eksternal)

Token permanen yang diterbitkan Superadmin di **Dashboard → Kunci API**.  
Hanya bisa digunakan untuk **request GET (read-only)** pada endpoint `/api/v1/*`.

```http
X-API-Key: sso_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Alternatif menggunakan header Authorization:

```http
Authorization: Bearer sso_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> **Penting:** API Key berlaku permanen sampai di-revoke atau dinonaktifkan Superadmin. Simpan dengan aman — jangan expose di sisi client/frontend. Setiap API Key dapat dibatasi ke domain tertentu.

---

### `POST /otentikasi`

Login dengan email & password. Mendukung alur SSO jika `client_id` disertakan di session.

**Request**
```json
{
  "email": "guru@sekolah.sch.id",
  "password": "guru123",
  "recaptcha_token": "TOKEN_DARI_FRONTEND",
  "remember": true
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `email` | string (email) | ✅ | Format email valid (rfc,dns), max 255 |
| `password` | string | ✅ | Max 255 karakter |
| `recaptcha_token` | string | ✅ | Token reCAPTCHA Enterprise dari frontend |
| `remember` | boolean | ❌ | `true` = sesi 1440 menit, `false` = 720 menit |

**Rate Limiting:** 5 percobaan per kombinasi email + IP.

**Response 200** — Redirect ke dashboard sesuai peran, atau redirect ke aplikasi klien jika alur SSO.

---

### `GET /auth/google`

Redirect ke halaman login Google OAuth 2.0. Mendukung alur SSO (menyimpan `sso_app_id` ke session).

---

### `GET /auth/google/callback`

Callback setelah login Google berhasil. Menyimpan data Google (`google_id`, `google_email`, `google_name`, `google_avatar`) ke profil pengguna. Melakukan auto-claim jika `claimed_at` masih null. Jika alur SSO aktif, menghasilkan JWT dan redirect ke callback URL.

---

### `GET /otentikasi/keluar`

Logout via GET (untuk SSO Sign-Out). Mendukung `redirect_uri` query param.

**Query Params (opsional):**

| Parameter | Tipe | Keterangan |
|-----------|------|------------|
| `redirect_uri` | string (URL) | URL tujuan setelah logout berhasil |

---

### `POST /logout`

Logout via POST (standar CSRF-protected). **Auth:** Sesi Login

---

## 2. Manajemen Pengguna

### `GET /api/v1/members`

Daftar seluruh pengguna (member) SSO. **Auth:** X-API-Key

**Query Params:**

| Parameter | Tipe | Default | Keterangan |
|-----------|------|---------|------------|
| `search` | string | — | Pencarian fuzzy pada `nama_lengkap`, `nik`, `nip_nis`, `email` |
| `email` | string | — | Filter email (exact match) |
| `role` | string | — | Filter berdasarkan nama peran (case-insensitive) |
| `per_page` | integer | `50` | Jumlah data per halaman (max: `100`) |
| `page` | integer | `1` | Nomor halaman |

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "nama_lengkap": "Budi Santoso",
      "email": "budi@sekolah.sch.id",
      "nik": "3201234567890001",
      "nip_nis": "1234567890",
      "jk": "L",
      "no_telp": "081234567890",
      "tgl_lahir": "2005-08-17",
      "is_active": true,
      "claimed_at": "2026-07-01T08:00:00.000000Z",
      "created_at": "2026-07-01T07:00:00.000000Z",
      "updated_at": "2026-07-01T08:00:00.000000Z",
      "roles": [
        { "id": "uuid-peran-1", "nama_role": "Siswa" }
      ]
    }
  ],
  "meta": {
    "total": 350,
    "page": 1,
    "per_page": 50,
    "last_page": 7
  }
}
```

---

### `GET /api/v1/members/{id}`

Detail satu pengguna berdasarkan UUID. **Auth:** X-API-Key

**Path Param:** `id` — UUID v4 pengguna

**Response 200**
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nama_lengkap": "Budi Santoso",
    "email": "budi@sekolah.sch.id",
    "nik": "3201234567890001",
    "nip_nis": "1234567890",
    "jk": "L",
    "no_telp": "081234567890",
    "tgl_lahir": "2005-08-17",
    "is_active": true,
    "claimed_at": "2026-07-01T08:00:00.000000Z",
    "created_at": "2026-07-01T07:00:00.000000Z",
    "updated_at": "2026-07-01T08:00:00.000000Z",
    "roles": [
      { "id": "uuid-peran-1", "nama_role": "Siswa" }
    ]
  }
}
```

**Response 404**
```json
{ "success": false, "pesan": "Member tidak ditemukan." }
```

---

### `POST /superadmin/manajemen-pengguna`

Tambah pengguna baru. **Auth:** Sesi Login (Superadmin)

**Request**
```json
{
  "nama_lengkap": "Andi Wijaya",
  "email": "andi@sekolah.sch.id",
  "password": "Password123!",
  "jk": "L",
  "tgl_lahir": "2008-05-12",
  "nik": "3201234567890002",
  "nip_nis": "2345678901",
  "no_telp": "081299887766",
  "alamat": "Jl. Merdeka No. 10",
  "is_active": true,
  "selected_roles": ["uuid-peran-siswa"]
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `nama_lengkap` | string | ✅ | Max 255 karakter |
| `email` | string (email) | ✅ | Harus unik di tabel `users` |
| `password` | string | ✅ | Min 8 karakter |
| `jk` | string | ❌ | `L` (Laki-laki) atau `P` (Perempuan) |
| `tgl_lahir` | date | ❌ | Format YYYY-MM-DD |
| `nik` | string | ❌ | Max 20, harus unik |
| `nip_nis` | string | ❌ | Max 30, harus unik |
| `no_telp` | string | ❌ | Max 20 karakter |
| `alamat` | string | ❌ | Teks bebas |
| `is_active` | boolean | ✅ | Status aktif akun |
| `selected_roles` | array | ❌ | Array UUID peran yang ditetapkan |

---

### `PUT /superadmin/manajemen-pengguna/{id}`

Perbarui data pengguna & sinkronisasi peran. **Auth:** Sesi Login (Superadmin)

**Path Param:** `id` — UUID pengguna

---

### `DELETE /superadmin/manajemen-pengguna/{id}`

Hapus pengguna beserta seluruh relasi peran. **Auth:** Sesi Login (Superadmin)

---

### `POST /superadmin/manajemen-pengguna/import`

Import pengguna massal dari file CSV/Excel. **Auth:** Sesi Login (Superadmin)

**Request Format:** `multipart/form-data`

| Parameter | Tipe | Wajib | Keterangan |
|-----------|------|-------|------------|
| `file_import` | file binary | ✅ | CSV/TXT/XLSX, max 5MB |

**Kolom CSV/Excel:** `nama_lengkap`, `email`, `password`, `jk`, `tgl_lahir`, `nik`, `nip_nis`, `no_telp`, `alamat`, `nama_peran`

---

### `GET /superadmin/manajemen-pengguna/template-csv`

Unduh template CSV untuk import pengguna. **Auth:** Sesi Login (Superadmin)

### `GET /superadmin/manajemen-pengguna/template-excel`

Unduh template Excel (.xlsx) untuk import pengguna. **Auth:** Sesi Login (Superadmin)

---

## 3. Manajemen Peran

### `GET /api/v1/data/peran`

Daftar semua peran beserta jumlah penggunanya. **Auth:** X-API-Key

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-peran-1",
      "nama_role": "Guru",
      "is_active": true,
      "created_at": "2026-07-11T00:00:00.000000Z",
      "users_count": 48
    },
    {
      "id": "uuid-peran-2",
      "nama_role": "Siswa",
      "is_active": true,
      "created_at": "2026-07-11T00:00:00.000000Z",
      "users_count": 302
    }
  ]
}
```

---

### `POST /superadmin/manajemen-peran`

Tambah peran baru. **Auth:** Sesi Login (Superadmin)

```json
{ "nama_role": "Wali Kelas", "is_active": true }
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `nama_role` | string | ✅ | Max 100, harus unik |
| `is_active` | boolean | ✅ | Status aktif peran |

---

### `PUT /superadmin/manajemen-peran/{id}`

Perbarui nama atau status peran. **Auth:** Sesi Login (Superadmin)

> **Proteksi:** Peran sistem (`Super Admin`, `superadmin`, `Admin`) tidak dapat diubah namanya, dinonaktifkan, atau dihapus.

---

### `DELETE /superadmin/manajemen-peran/{id}`

Hapus peran. Gagal jika masih ada pengguna yang menggunakan peran ini. **Auth:** Sesi Login (Superadmin)

---

## 4. Aplikasi Terdaftar

Mengelola daftar aplikasi pihak ketiga yang terintegrasi dengan portal SSO.

### `POST /superadmin/manajemen-aplikasi`

Daftarkan aplikasi baru ke ekosistem SSO. **Auth:** Sesi Login (Superadmin)

**Request Format:** `multipart/form-data`

```json
{
  "nama_aplikasi": "E-Learning Sekolah",
  "deskripsi": "Platform pembelajaran daring siswa",
  "logo_url": "https://cdn.sekolah.sch.id/logo-elearning.png",
  "logo_file": "(binary — opsional, image max 10MB)",
  "icon_material": "school",
  "warna_icon": "#3b82f6",
  "portal_url": "https://elearning.sekolah.sch.id",
  "login_callback_url": "https://elearning.sekolah.sch.id/sso/callback",
  "open_in_new_tab": true,
  "is_global_visibility": true,
  "sort_order": 1,
  "is_active": true,
  "selected_roles": []
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `nama_aplikasi` | string | ✅ | Max 150 karakter |
| `deskripsi` | string | ❌ | Deskripsi singkat |
| `logo_url` | string | ❌ | URL logo (max 500), OR gunakan `logo_file` |
| `logo_file` | file (image) | ❌ | Upload file logo langsung, max 10MB |
| `icon_material` | string | ❌ | Nama ikon dari Material Symbols, max 100 |
| `warna_icon` | string | ❌ | Warna hex ikon, contoh: `#3b82f6` |
| `portal_url` | string (url) | ✅ | URL utama/landing page aplikasi, max 500 |
| `login_callback_url` | string (url) | ❌ | URL penerima token JWT setelah login SSO, max 500 |
| `open_in_new_tab` | boolean | ✅ | Buka di tab baru saat diklik di katalog portal |
| `is_global_visibility` | boolean | ✅ | `true` = semua peran, `false` = peran terpilih saja |
| `sort_order` | integer | ✅ | Urutan tampil di portal, min 0, harus unik |
| `is_active` | boolean | ✅ | Status aktif aplikasi |
| `selected_roles` | array | ❌ | Array UUID peran (hanya jika `is_global_visibility = false`) |

---

### `PUT /superadmin/manajemen-aplikasi/{id}`

Perbarui konfigurasi aplikasi. **Auth:** Sesi Login (Superadmin)

> **Catatan:** Jika `login_callback_url` berubah, sistem otomatis me-regenerasi UUID sebagai Client ID baru dan menghasilkan Client Secret baru (64 karakter).

---

### `DELETE /superadmin/manajemen-aplikasi/{id}`

Hapus aplikasi dari ekosistem SSO. **Auth:** Sesi Login (Superadmin)

---

### `POST /superadmin/manajemen-aplikasi/{id}/generate-secret`

Regenerasi Secret Key / API Key aplikasi. **Auth:** Sesi Login (Superadmin)

---

## 5. Klaim Akun & Verifikasi

Alur klaim akun untuk pengguna yang datanya sudah di-import oleh admin tetapi belum pernah login (belum di-klaim).

### `POST /otentikasi/cek-identitas`

Cek keberadaan & kecocokan identitas sebelum proses klaim (Langkah 1).

**Rate Limiting:** 10 percobaan per menit per IP.

**Request**
```json
{
  "jenis_pengguna": "Siswa",
  "nik": "3201234567890001",
  "nip_nis": "1234567890",
  "tgl_lahir": "2005-08-17"
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `jenis_pengguna` | string | ✅ | `Siswa` atau `Guru` |
| `nik` | string | ✅ | Tepat 16 digit angka |
| `nip_nis` | string | ✅ | Numerik (NIS untuk Siswa, NIP untuk Guru) |
| `tgl_lahir` | date | ✅ | Format YYYY-MM-DD |

**Response 200 — Cocok**
```json
{ "success": true, "email": "existing@email.com" }
```

**Response 422 — Tidak cocok**
```json
{ "success": false, "errors": { "nik": "NIK tidak terdaftar dalam sistem." } }
```

**Response 422 — Sudah diklaim**
```json
{ "success": false, "claimed": true, "message": "Akun sudah diklaim sebelumnya." }
```

**Response 429 — Terlalu banyak percobaan**
```json
{ "success": false, "errors": { "nik": "Terlalu banyak percobaan. Silakan coba lagi nanti." } }
```

---

### `POST /otentikasi/verifikasi`

Klaim & aktivasi akun (Langkah 2). Menetapkan email dan password pertama kali.

**Rate Limiting:** 5 percobaan per menit per IP.

**Request**
```json
{
  "nik": "3201234567890001",
  "nip_nis": "1234567890",
  "tgl_lahir": "2005-08-17",
  "email": "budi@sekolah.sch.id",
  "password": "PasswordKuat123!",
  "password_confirmation": "PasswordKuat123!"
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `nik` | string | ✅ | 16 karakter, numerik |
| `nip_nis` | string | ✅ | Numerik |
| `tgl_lahir` | date | ✅ | Format YYYY-MM-DD |
| `email` | string (email) | ✅ | Format valid (rfc,dns), max 255 |
| `password` | string | ✅ | Min 8 karakter, huruf besar+kecil, angka, simbol |
| `password_confirmation` | string | ✅ | Harus sama dengan `password` |

**Response 200** — Redirect ke halaman login dengan flash message sukses.

---

## 6. Integrasi SSO (Redirect & JWT)

Bagian ini menjelaskan alur lengkap integrasi *Single Sign-On* menggunakan mekanisme redirect browser dan token JWT.

### Langkah 1 — Inisiasi Redirect

Aplikasi klien mengarahkan browser pengguna ke portal SSO:

```
GET https://your-sso-domain.com/otentikasi?client_id={APP_UUID}&redirect_uri={CALLBACK_URL}
```

| Parameter | Wajib | Keterangan |
|-----------|-------|------------|
| `client_id` atau `app_id` | ✅ | UUID aplikasi terdaftar di panel Superadmin |
| `redirect_uri` | ❌ | URL callback. Host & port wajib cocok dengan `login_callback_url` terdaftar |

> **Keamanan:** Jika `redirect_uri` dikirim dan host/port-nya tidak cocok dengan `login_callback_url` yang terdaftar, portal SSO menolak dengan `403 Forbidden`.

---

### Langkah 2 — Login di Portal SSO

Jika sesi belum aktif, pengguna memasukkan kredensial di form login portal SSO (email/password atau Google OAuth).  
Jika sesi sudah aktif, proses login dilewati secara transparan (auto-redirect).

Portal SSO juga memeriksa hak akses peran (RBAC) jika aplikasi memiliki `is_global_visibility = false`. Pengguna tanpa peran yang sesuai akan ditolak.

---

### Langkah 3 — Callback dengan JWT

Setelah login berhasil, portal SSO menghasilkan token JWT dan mengarahkan pengguna kembali melalui halaman interstitial (`/otentikasi/redirect`):

```
302 → {redirect_uri}?token=eyJhbGciOiJIUzI1NiIs...
```

**Struktur Payload JWT:**

```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "nomor_induk": "1234567890",
  "nama": "Budi Santoso",
  "roles": ["Siswa"],
  "exp": 1786852500
}
```

| Klaim | Tipe | Keterangan |
|-------|------|------------|
| `user_id` | string (UUID) | ID unik pengguna dari database SSO |
| `nomor_induk` | string | `nip_nis` (prioritas), fallback ke `nik` |
| `nama` | string | Nama lengkap pengguna (`nama_lengkap`) |
| `roles` | string[] | Daftar `nama_role` dari peran aktif pengguna |
| `exp` | integer | UNIX timestamp kedaluwarsa (5 menit dari pembuatan) |

**Spesifikasi Token:**

| Properti | Nilai |
|----------|-------|
| Algoritma | `HS256` (HMAC-SHA256) |
| Secret | Variabel `JWT_SECRET` di `.env` |
| Fallback Secret | `sso_secret_key_default_32_characters` |
| TTL | 300 detik (5 menit) |
| Encoding | Base64URL |

---

### Langkah 4 — Validasi JWT di Sisi Client

```
TandaTangan = base64UrlEncode(HMAC_SHA256(header.payload, JWT_SECRET))
```

1. Pisahkan JWT menjadi 3 bagian (titik sebagai separator)
2. Hitung ulang tanda tangan menggunakan `JWT_SECRET` yang sama
3. Bandingkan dengan tanda tangan asli — tolak jika tidak cocok
4. Periksa klaim `exp` — tolak jika `now() >= exp`

> **Penting:** `JWT_SECRET` bersifat rahasia dan hanya boleh diketahui portal SSO dan backend aplikasi klien. Jangan simpan di frontend.

---

### Langkah 5 — JIT Provisioning

Setelah JWT valid, cari pengguna di database lokal berdasarkan `nomor_induk` atau `user_id`:

- **Ditemukan** → perbarui `nama` dan `roles` agar tetap sinkron
- **Tidak ditemukan** → buat akun baru otomatis dengan data dari JWT payload

---

### SSO Logout

Arahkan pengguna ke endpoint logout SSO untuk menghapus sesi global:

```
GET https://your-sso-domain.com/otentikasi/keluar?redirect_uri=https://elearning.sekolah.sch.id
```

---

## 7. Kunci API

### `POST /superadmin/kunci-api`

Buat Kunci API baru. **Auth:** Sesi Login (Superadmin)

```json
{
  "nama_aplikasi": "Sistem Perpustakaan",
  "domain_diizinkan": "perpustakaan.sekolah.sch.id",
  "prefix": "sso"
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `nama_aplikasi` | string | ✅ | Max 150 karakter |
| `domain_diizinkan` | string | ✅ | Domain yang diizinkan, `*` untuk semua (dev only), max 255 |
| `prefix` | string | ✅ | Prefix kunci, max 5 karakter alfanumerik |

**Response 200** — Kunci API ditampilkan sekali saat pembuatan!
```json
{
  "success": true,
  "data": {
    "id": "uuid-kunci",
    "nama_aplikasi": "Sistem Perpustakaan",
    "kunci_api": "sso_13c8f8b3c675689a7bb29a8a7c20cd92348ff98eab",
    "domain_diizinkan": "perpustakaan.sekolah.sch.id",
    "is_active": true
  }
}
```

**Format Kunci API:**
```
{prefix}_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
└──────┘ └──────────────────────────────────────┘
 prefix            token (40 karakter random)
```

> **Pembatasan Domain:** Middleware `AutentikasiApiKey` memeriksa header `Origin` atau `Referer` terhadap `domain_diizinkan`. Request dari domain lain ditolak `403`. Gunakan `*` untuk mengizinkan semua domain (hanya untuk development).

---

### `PUT /superadmin/kunci-api/{id}`

Perbarui nama aplikasi, domain yang diizinkan, atau status aktif. **Auth:** Sesi Login (Superadmin)

---

### `DELETE /superadmin/kunci-api/{id}`

Hapus (revoke) Kunci API secara permanen. **Auth:** Sesi Login (Superadmin)

---

### `POST /superadmin/kunci-api/{id}/regenerasi`

Regenerasi token Kunci API. Token lama langsung tidak berlaku. **Auth:** Sesi Login (Superadmin)

---

## 8. Persetujuan Data & Koreksi

### `POST /keamanan-akun/ajukan-perubahan`

Pengguna mengajukan koreksi data pribadi. Data disimpan ke tabel staging `user_corrections` dengan status `pending`. **Auth:** Sesi Login (Pengguna)

**Request**
```json
{
  "nama_lengkap": "Budi Santosa",
  "email": "budi.baru@sekolah.sch.id",
  "jk": "L",
  "tgl_lahir": "2005-08-17",
  "nik": "3201234567890001",
  "nip_nis": "1234567890",
  "no_telp": "081234567890",
  "alamat": "Jl. Sudirman No. 5"
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `nama_lengkap` | string | ✅ | Max 255 |
| `email` | string (email) | ✅ | Harus unik (kecuali milik sendiri) |
| `jk` | string | ❌ | `L` atau `P` |
| `tgl_lahir` | date | ❌ | Format YYYY-MM-DD |
| `nik` | string | ❌ | Max 20 |
| `nip_nis` | string | ❌ | Max 30 |
| `no_telp` | string | ❌ | Max 20 |
| `alamat` | string | ❌ | Teks bebas |

---

### `POST /superadmin/persetujuan-data/{id}/setujui`

Setujui pengajuan koreksi data. Data dari staging di-overwrite ke tabel `users`. **Auth:** Sesi Login (Superadmin/Admin)

**Path Param:** `id` — UUID koreksi

---

### `POST /superadmin/persetujuan-data/{id}/tolak`

Tolak pengajuan koreksi data. **Auth:** Sesi Login (Superadmin/Admin)

**Path Param:** `id` — UUID koreksi

**Status koreksi:** `pending` · `approved` · `rejected`

---

## 9. Keamanan Akun & Sesi

### `DELETE /keamanan-akun/sesi/{id}`

Hapus sesi login tertentu milik pengguna yang sedang aktif. **Auth:** Sesi Login (Pengguna)

**Path Param:** `id` — ID sesi

---

### `POST /keamanan-akun/sesi/hapus-lainnya`

Hapus semua sesi login lain kecuali sesi yang sedang aktif saat ini. **Auth:** Sesi Login (Pengguna)

---

## 10. Pengaturan & Statistik

### `GET /api/v1/test`

Health check — menguji konektivitas, memverifikasi API Key, dan mendeteksi domain asal. **Auth:** X-API-Key

**Response 200**
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "server_time": "2026-07-15T19:30:00+07:00"
  },
  "meta": {
    "app_name": "E-Learning SMPN 1",
    "request_domain": "elearning.sekolah.sch.id",
    "request_domain_source": "origin",
    "origin": "https://elearning.sekolah.sch.id",
    "referer": null,
    "ip": "103.xx.xx.xx"
  }
}
```

---

### `GET /api/v1/data/statistik`

Ringkasan statistik platform SSO. **Auth:** X-API-Key

**Response 200**
```json
{
  "success": true,
  "data": {
    "total_pengguna": 410,
    "total_pengguna_aktif": 398,
    "total_pengguna_terklaim": 385,
    "total_peran": 4
  }
}
```

---

### `POST /superadmin/pengaturan-sistem`

Perbarui pengaturan sistem global. **Auth:** Sesi Login (Superadmin)

**Request Format:** `multipart/form-data`

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `nama_aplikasi` | string | ✅ | Nama portal SSO, max 100 |
| `logo_primer` | file (image) | ❌ | Logo utama portal, max 5MB |
| `favicon` | file | ❌ | Favicon browser, max 1MB |
| `google_client_id` | string | ❌ | Google OAuth Client ID, max 500 |
| `google_client_secret` | string | ❌ | Google OAuth Client Secret, max 500 |
| `batas_request_per_menit` | integer | ✅ | Rate limit global, min 1 — max 100000 |
| `storage_provider` | string | ✅ | `local`, `s3`, `gcs`, atau `minio` |
| `s3_key` | string | ❌ | Access Key untuk S3/GCS/MinIO |
| `s3_secret` | string | ❌ | Secret Key untuk S3/GCS/MinIO |
| `s3_bucket` | string | ❌ | Nama bucket |
| `s3_region` | string | ❌ | Region bucket, max 100 |
| `s3_endpoint` | string (url) | ❌ | Custom endpoint URL, max 500 |
| `s3_use_path_style_endpoint` | boolean | ✅ | Path-style endpoint untuk MinIO |

---

### `GET /superadmin/log-aktivitas`

Daftar log aktivitas seluruh pengguna. **Auth:** Sesi Login (Superadmin/Admin)

**Query Params:** `cari` (pencarian pada aktivitas, email, IP, nama pengguna). Paginated 15 per halaman.

---

## 11. Kode Error

| HTTP | Keterangan | Contoh Penyebab |
|------|------------|-----------------|
| `400` | Bad Request | Parameter wajib tidak lengkap |
| `401` | Unauthorized | API Key tidak disertakan, format salah, atau key tidak ditemukan |
| `403` | Forbidden | API Key dinonaktifkan, domain request tidak diizinkan, atau RBAC ditolak |
| `404` | Not Found | Member/peran/aplikasi tidak ditemukan |
| `422` | Unprocessable Entity | Data request tidak lolos validasi Laravel FormRequest |
| `429` | Too Many Requests | Melebihi batas rate limit |
| `500` | Internal Server Error | Kesalahan di sisi server |

**Format error standar (REST API):**
```json
{
  "success": false,
  "pesan": "Akses ditolak. Kunci API ini hanya diizinkan untuk domain: elearning.sekolah.sch.id"
}
```

**Format error standar (Autentikasi):**
```json
{
  "success": false,
  "errors": {
    "email": "Kredensial yang diberikan tidak cocok."
  }
}
```

---

## 12. Contoh Integrasi

### PHP (Laravel)

```php
<?php

declare(strict_types=1);

# Konfigurasi di .env:
# SSO_BASE_URL=https://sso-sekolah.sch.id
# SSO_API_KEY=sso_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# SSO_CLIENT_ID=uuid-aplikasi-anda
# SSO_JWT_SECRET=secret_key_dari_admin_sso

use Illuminate\Support\Facades\Http;

# --- REST API Data (Backend-to-Backend) ---

function ssoGet(string $path, array $params = []): array {
    $res = Http::withHeaders([
        'X-API-Key' => env('SSO_API_KEY'),
        'Accept'    => 'application/json',
    ])->get(env('SSO_BASE_URL') . $path, $params);

    if (!$res->successful()) throw new \Exception($res->json('pesan'));
    return $res->json('data');
}

# Ambil daftar guru
$guru = ssoGet('/api/v1/members', ['role' => 'Guru', 'per_page' => 100]);

# Ambil statistik
$stats = ssoGet('/api/v1/data/statistik');

# Detail pengguna
$detail = ssoGet('/api/v1/members/550e8400-e29b-41d4-a716-446655440000');

# --- SSO Redirect Login ---

# Di controller: redirect ke portal SSO
return redirect()->away(
    env('SSO_BASE_URL') . '/otentikasi?' . http_build_query([
        'client_id'    => env('SSO_CLIENT_ID'),
        'redirect_uri' => route('sso.callback'),
    ])
);

# Di callback route: validasi JWT
function verifikasiJWT(string $jwt): array {
    [$headerB64, $payloadB64, $signatureB64] = explode('.', $jwt);
    $secret = env('SSO_JWT_SECRET');

    $expected = str_replace(['+', '/', '='], ['-', '_', ''],
        base64_encode(hash_hmac('sha256', "$headerB64.$payloadB64", $secret, true))
    );

    if ($signatureB64 !== $expected) throw new \Exception('Tanda tangan tidak valid');

    $payload = json_decode(base64_decode(strtr($payloadB64, '-_', '+/')), true);
    if (time() >= $payload['exp']) throw new \Exception('Token kedaluwarsa');

    return $payload;
}
```

---

### Node.js / JavaScript

```javascript
const API_BASE = 'https://your-sso-domain.com';
const API_KEY  = 'sso_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
const JWT_SECRET = 'secret_key_dari_admin_sso';

// --- REST API Data ---
async function ssoGet(path, params = {}) {
  const url = new URL(API_BASE + path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, { headers: { 'X-API-Key': API_KEY } });
  const data = await res.json();
  if (!data.success) throw new Error(data.pesan);
  return data.data;
}

// Contoh penggunaan
const members = await ssoGet('/api/v1/members', { role: 'Siswa', per_page: '50' });
const stats   = await ssoGet('/api/v1/data/statistik');
const peran   = await ssoGet('/api/v1/data/peran');

// --- SSO Callback (Express) ---
const jwt = require('jsonwebtoken');

app.get('/sso/callback', (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).send('Token tidak ditemukan');

  jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }, (err, decoded) => {
    if (err) return res.status(401).send('Token tidak valid: ' + err.message);

    // decoded = { user_id, nomor_induk, nama, roles, exp }
    // TODO: JIT Provisioning → simpan ke DB lokal
    req.session.user = decoded;
    res.redirect('/dashboard');
  });
});
```

---

### Python

```python
import requests
import jwt  # pip install PyJWT

API_BASE = "https://your-sso-domain.com"
API_KEY  = "sso_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
JWT_SECRET = "secret_key_dari_admin_sso"
HEADERS  = {"X-API-Key": API_KEY, "Accept": "application/json"}

def sso_get(endpoint, params=None):
    r = requests.get(f"{API_BASE}{endpoint}", headers=HEADERS, params=params)
    r.raise_for_status()
    data = r.json()
    if not data.get("success"):
        raise Exception(data.get("pesan", "Error"))
    return data["data"]

# Daftar semua siswa
siswa = sso_get("/api/v1/members", {"role": "Siswa", "per_page": 100})
print(f"Total siswa: {len(siswa)}")

# Statistik platform
stats = sso_get("/api/v1/data/statistik")
print(f"Total pengguna aktif: {stats['total_pengguna_aktif']}")

# Pagination otomatis
halaman = 1
semua_guru = []
while True:
    res = requests.get(f"{API_BASE}/api/v1/members", headers=HEADERS,
                       params={"role": "Guru", "per_page": 100, "page": halaman})
    payload = res.json()
    semua_guru.extend(payload["data"])
    if halaman >= payload["meta"]["last_page"]:
        break
    halaman += 1

# --- Validasi JWT di callback SSO (Flask) ---
from flask import Flask, request, redirect

app = Flask(__name__)

@app.route("/sso/callback")
def sso_callback():
    token = request.args.get("token")
    if not token:
        return "Token tidak ditemukan", 400
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        # payload = { user_id, nomor_induk, nama, roles, exp }
        # TODO: JIT Provisioning → simpan ke DB lokal
        return f"Halo {payload['nama']}! Peran: {', '.join(payload['roles'])}"
    except jwt.ExpiredSignatureError:
        return "Token kedaluwarsa", 401
    except jwt.InvalidTokenError as e:
        return f"Token tidak valid: {e}", 401
```

---

### cURL

```bash
BASE="https://your-sso-domain.com"
KEY="sso_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Health check
curl -H "X-API-Key: $KEY" "$BASE/api/v1/test"

# Daftar semua member
curl -H "X-API-Key: $KEY" "$BASE/api/v1/members"

# Filter siswa, 20 per halaman
curl -H "X-API-Key: $KEY" "$BASE/api/v1/members?role=Siswa&per_page=20"

# Cari berdasarkan nama
curl -H "X-API-Key: $KEY" "$BASE/api/v1/members?search=budi"

# Detail member
curl -H "X-API-Key: $KEY" \
  "$BASE/api/v1/members/550e8400-e29b-41d4-a716-446655440000"

# Daftar peran
curl -H "X-API-Key: $KEY" "$BASE/api/v1/data/peran"

# Statistik
curl -H "X-API-Key: $KEY" "$BASE/api/v1/data/statistik"
```

---

## Ringkasan Endpoint

| Endpoint | Method | Auth | Keterangan |
|----------|--------|------|------------|
| `/api/v1/test` | GET | 🔑 API Key | Health check & verifikasi koneksi |
| `/api/v1/members` | GET | 🔑 API Key | Daftar pengguna (filter & pagination) |
| `/api/v1/members/{id}` | GET | 🔑 API Key | Detail pengguna |
| `/api/v1/data/peran` | GET | 🔑 API Key | Daftar peran + jumlah pengguna |
| `/api/v1/data/statistik` | GET | 🔑 API Key | Statistik platform |
| `/otentikasi` | GET | ❌ | Halaman login / inisiasi SSO redirect |
| `/otentikasi` | POST | ❌ | Proses login email & password |
| `/otentikasi/cek-identitas` | POST | ❌ | Cek identitas untuk klaim akun |
| `/otentikasi/verifikasi` | POST | ❌ | Klaim & aktivasi akun |
| `/otentikasi/keluar` | GET | ❌ | Logout GET (SSO Sign-Out) |
| `/auth/google` | GET | ❌ | Redirect ke Google OAuth |
| `/auth/google/callback` | GET | ❌ | Callback Google OAuth |
| `/logout` | POST | 🔐 Sesi | Logout POST |
| `/superadmin/manajemen-pengguna` | GET | 🔐 Superadmin | Daftar pengguna (dashboard) |
| `/superadmin/manajemen-pengguna` | POST | 🔐 Superadmin | Tambah pengguna |
| `/superadmin/manajemen-pengguna/{id}` | PUT | 🔐 Superadmin | Perbarui pengguna |
| `/superadmin/manajemen-pengguna/{id}` | DELETE | 🔐 Superadmin | Hapus pengguna |
| `/superadmin/manajemen-pengguna/import` | POST | 🔐 Superadmin | Import massal CSV/Excel |
| `/superadmin/manajemen-pengguna/template-csv` | GET | 🔐 Superadmin | Unduh template CSV |
| `/superadmin/manajemen-pengguna/template-excel` | GET | 🔐 Superadmin | Unduh template Excel |
| `/superadmin/manajemen-peran` | POST | 🔐 Superadmin | Tambah peran |
| `/superadmin/manajemen-peran/{id}` | PUT | 🔐 Superadmin | Perbarui peran |
| `/superadmin/manajemen-peran/{id}` | DELETE | 🔐 Superadmin | Hapus peran |
| `/superadmin/manajemen-aplikasi` | POST | 🔐 Superadmin | Daftarkan aplikasi |
| `/superadmin/manajemen-aplikasi/{id}` | PUT | 🔐 Superadmin | Perbarui aplikasi |
| `/superadmin/manajemen-aplikasi/{id}` | DELETE | 🔐 Superadmin | Hapus aplikasi |
| `/superadmin/manajemen-aplikasi/{id}/generate-secret` | POST | 🔐 Superadmin | Regenerasi secret |
| `/superadmin/kunci-api` | POST | 🔐 Superadmin | Buat Kunci API |
| `/superadmin/kunci-api/{id}` | PUT | 🔐 Superadmin | Perbarui Kunci API |
| `/superadmin/kunci-api/{id}` | DELETE | 🔐 Superadmin | Hapus Kunci API |
| `/superadmin/kunci-api/{id}/regenerasi` | POST | 🔐 Superadmin | Regenerasi token |
| `/superadmin/persetujuan-data/{id}/setujui` | POST | 🔐 Superadmin | Setujui koreksi data |
| `/superadmin/persetujuan-data/{id}/tolak` | POST | 🔐 Superadmin | Tolak koreksi data |
| `/superadmin/pengaturan-sistem` | POST | 🔐 Superadmin | Perbarui pengaturan |
| `/superadmin/log-aktivitas` | GET | 🔐 Superadmin | Log aktivitas |
| `/keamanan-akun/ajukan-perubahan` | POST | 🔐 Sesi | Ajukan koreksi data |
| `/keamanan-akun/sesi/{id}` | DELETE | 🔐 Sesi | Hapus sesi tertentu |
| `/keamanan-akun/sesi/hapus-lainnya` | POST | 🔐 Sesi | Hapus semua sesi lain |
| `/api/docs` | GET | ❌ | Swagger UI (dokumentasi interaktif) |

---

*Diperbarui: Juli 2026 — SSO Sekolah v1.0.0 · Community Edition*
