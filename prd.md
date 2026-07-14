# PRD — SSO Sekolah Terpusat
**Product Requirements Document · Versi 1.0**

---

## 1. Ringkasan Produk

**SSO (Single Sign-On) Sekolah Terpusat** adalah sistem autentikasi terpusat berbasis web yang memungkinkan seluruh warga sekolah (Superadmin, Guru, Siswa) masuk sekali dan mengakses semua ekosistem digital sekolah tanpa perlu login berulang kali di setiap aplikasi.

**Tech Stack:** Laravel 12 + React (Inertia.js SPA) + MySQL + TailwindCSS

---

## 2. Peran Pengguna (Roles)

Sistem menggunakan pendekatan **Role berbasis nama fleksibel** (bukan kode statis). Contoh role yang di-seed:

| Nama Role | Keterangan |
|---|---|
| Super Admin | Administrator utama sistem SSO |
| Guru | Tenaga pendidik sekolah |
| Siswa | Peserta didik sekolah |

> Nama role dapat berupa teks apapun: `Wali Kelas`, `BK`, `Tata Usaha`, dst.

---

## 3. Arsitektur Database

### 3.1 Tabel `users`
> Primary Key: UUID v4

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID, PK | Primary Key auto-generated |
| `nama_lengkap` | string | Nama lengkap pengguna |
| `email` | string, Unique, Nullable | Email login (nullable jika pakai Google) |
| `password` | string, Nullable | Hash password (nullable jika login Google) |
| `jk` | char(1) | Jenis kelamin: `L` atau `P` |
| `tgl_lahir` | date, Nullable | Tanggal lahir pengguna |
| `nik` | string(20), Unique, Nullable | Nomor Induk Kependudukan |
| `nip_nis` | string(30), Unique, Nullable | Gabungan NIP (Guru) atau NIS (Siswa) |
| `no_telp` | string(20), Nullable | Nomor telepon |
| `alamat` | text, Nullable | Alamat lengkap |
| `google_id` | string, Unique, Nullable | ID akun Google OAuth |
| `google_email` | string, Nullable | Email akun Google |
| `google_name` | string, Nullable | Nama dari akun Google |
| `google_avatar` | string, Nullable | URL foto profil Google |
| `is_active` | boolean, default: true | Status aktif akun |
| `claimed_at` | timestamp, Nullable | Waktu akun diklaim |
| `remember_token` | string | Token "Ingat Saya" |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

---

### 3.2 Tabel `roles`
> Primary Key: UUID v4

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID, PK | |
| `nama_role` | string(100) | Contoh: `Wali Kelas`, `Siswa`, `BK` |
| `is_active` | boolean, default: true | |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

---

### 3.3 Tabel `user_roles` *(Pivot)*
> Primary Key: UUID v4 · Many-to-Many antara `users` dan `roles`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID, PK | |
| `user_id` | UUID, FK ke `users.id` | ON DELETE CASCADE |
| `role_id` | UUID, FK ke `roles.id` | ON DELETE CASCADE |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

> Constraint UNIQUE pada (`user_id`, `role_id`).

---

### 3.4 Tabel `user_corrections`
> Primary Key: UUID v4 · Tabel staging koreksi data pengguna

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID, PK | |
| `user_id_asli` | UUID, FK ke `users.id` | ON DELETE CASCADE |
| `nama_lengkap` | string, Nullable | |
| `email` | string, Nullable | |
| `password` | string, Nullable | |
| `jk` | char(1), Nullable | |
| `tgl_lahir` | date, Nullable | |
| `nik` | string(20), Nullable | |
| `nip_nis` | string(30), Nullable | |
| `no_telp` | string(20), Nullable | |
| `alamat` | text, Nullable | |
| `google_id` | string, Nullable | |
| `google_email` | string, Nullable | |
| `google_name` | string, Nullable | |
| `google_avatar` | string, Nullable | |
| `is_active` | boolean, Nullable | |
| `claimed_at` | timestamp, Nullable | |
| `status_correction` | ENUM | `pending` / `approved` / `rejected` |
| `submitted_at` | timestamp, Nullable | |
| `reviewed_by` | UUID, FK ke `users.id`, Nullable | |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

---

### 3.5 Tabel `registered_apps`
> Primary Key: UUID v4

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID, PK | |
| `nama_aplikasi` | string(150) | Nama tampilan aplikasi |
| `deskripsi` | text, Nullable | |
| `logo_url` | string(500), Nullable | |
| `icon_material` | string(100), Nullable | Nama ikon Material Symbols |
| `portal_url` | string(500) | URL utama/portal aplikasi |
| `login_callback_url` | string(500) | URL direct-return setelah SSO |
| `api_key` | string(64), Unique | String acak unik untuk auth antar layanan |
| `is_global_visibility` | boolean, default: true | true = semua role, false = role tertentu saja |
| `sort_order` | integer, default: 0 | Urutan tampil di portal |
| `is_active` | boolean, default: true | |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

---

### 3.6 Tabel `app_roles` *(Pivot)*
> Primary Key: UUID v4 · Digunakan jika `is_global_visibility = false`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | UUID, PK | |
| `app_id` | UUID, FK ke `registered_apps.id` | ON DELETE CASCADE |
| `role_id` | UUID, FK ke `roles.id` | ON DELETE CASCADE |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

> Contoh: Aplikasi BK (`is_global_visibility = false`) hanya direlasikan dengan Role `BK`.

---

## 4. Relasi ERD

```
users ──< user_roles >── roles
                           │
registered_apps ──< app_roles >── roles

users ──< user_corrections (user_id_asli)
users ──< user_corrections (reviewed_by)
```

---

## 5. Fitur Autentikasi

### 5.1 Login Email + Password
- Input: Email atau NIP/NIS
- Validasi dual-layer: React (sisi klien) + Laravel FormRequest (sisi server)

### 5.2 Login via Google OAuth
- Simpan: `google_id`, `google_email`, `google_name`, `google_avatar`
- JIT Provisioning: akun dibuat otomatis jika belum ada
- Password boleh `null` jika akun dibuat via Google

### 5.3 Klaim Akun
- Alur: Input NIK/NIS/NIP → Cocokan data → Set password → Akun aktif

### 5.4 Koreksi Data
- Pengguna ajukan koreksi → tersimpan ke `user_corrections` (status: `pending`)
- Admin review: `approved` → data di-overwrite ke `users` | `rejected` → ditolak

---

## 6. Portal Aplikasi
- `is_global_visibility = true` → tampil untuk semua pengguna
- `is_global_visibility = false` → hanya tampil jika role ada di `app_roles`
- Diurutkan berdasarkan `sort_order`

---

## 7. Akun Uji Coba (Development)

| Role | Email | Password |
|---|---|---|
| Super Admin | `superadmin@sekolah.sch.id` | `superadmin` |
| Guru | `guru@sekolah.sch.id` | `guru123` |
| Siswa | `siswa@sekolah.sch.id` | `siswa123` |