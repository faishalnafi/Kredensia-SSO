# SIEKSA API — Panduan Integrasi

> **Base URL (Development):** `http://localhost:3110`  
> **Dokumentasi Interaktif:** [`http://localhost:3110/api/docs`](http://localhost:3110/api/docs) (Swagger UI)  
> **OpenAPI Spec:** [`http://localhost:3110/api/openapi.json`](http://localhost:3110/api/openapi.json)

---

## Daftar Isi

1. [Autentikasi](#1-autentikasi)
2. [Manajemen Pengguna](#2-manajemen-pengguna)
3. [Ekstrakurikuler](#3-ekstrakurikuler)
4. [Siswa](#4-siswa)
5. [Jurnal & Kehadiran](#5-jurnal--kehadiran)
6. [Prestasi](#6-prestasi)
7. [Penilaian](#7-penilaian)
8. [Pengaturan & Token](#8-pengaturan--token)
9. [Kode Error](#9-kode-error)
10. [Contoh Integrasi](#10-contoh-integrasi)

---

## 1. Autentikasi

SIEKSA mendukung **dua metode autentikasi**:

### 1A. Bearer Token (Sesi Login)

Diperoleh dari endpoint login. Wajib untuk akses write (POST, DELETE).

```http
Authorization: Bearer <token>
```

### 1B. API Key — X-API-Key (Integrasi Eksternal)

Token permanen yang diterbitkan Admin di **Pengaturan Sistem → Token API Eksternal**.  
Hanya bisa digunakan untuk **request GET (read-only)**.

```http
X-API-Key: sieksa_xxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> **Penting:** API Key berlaku permanen sampai di-revoke Admin. Simpan dengan aman — jangan expose di sisi client/frontend.

---

### `POST /api/auth/office/login`

Login dengan akun lokal (Admin / Pembina / Pengawas non-SSO).

**Request**
```json
{
  "username": "admin",
  "password": "123456"
}
```

**Response 200**
```json
{
  "ok": true,
  "token": "a3f7c2d...",
  "user": {
    "id": "uuid-xxx",
    "nama": "Administrator",
    "role": "admin",
    "ekskuls": []
  }
}
```

---

### `POST /api/auth/sso/login`

Login via SSO ScholarGate menggunakan email sekolah.

**Request**
```json
{
  "email": "budi@smkn1gedeg.sch.id"
}
```

**Response 200**
```json
{
  "ok": true,
  "token": "b9e1f5a...",
  "user": {
    "id": "uuid-yyy",
    "nama": "Budi Santoso",
    "role": "ekskul",
    "ekskuls": ["Futsal", "Basket"]
  }
}
```

---

## 2. Manajemen Pengguna

### `GET /api/auth/users`

Daftar seluruh pengguna sistem beserta data ekskul & kelas.

**Auth:** Bearer Token

**Response 200**
```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid-001",
      "username": "admin",
      "nama": "Administrator",
      "role": "admin",
      "isActive": true,
      "ekskul": null,
      "kelas": null
    },
    {
      "id": "uuid-002",
      "username": "budi.pembina",
      "nama": "Budi Santoso, S.Pd",
      "role": "ekskul",
      "ekskul": "Futsal"
    },
    {
      "id": "uuid-003",
      "nama": "Andi Wijaya",
      "role": "siswa",
      "ekskul": "Futsal",
      "kelas": "XI-RPL-1"
    }
  ]
}
```

---

### `POST /api/auth/users`

Tambah pengguna lokal baru. Password default: `123456`.

**Auth:** Bearer Token

**Request — Siswa**
```json
{
  "username": "andi.siswa",
  "nama": "Andi Wijaya",
  "role": "siswa",
  "kelas": "XI-RPL-1",
  "ekskul": "Futsal"
}
```

**Request — Pembina Ekskul**
```json
{
  "username": "budi.pembina",
  "nama": "Budi Santoso, S.Pd",
  "role": "ekskul",
  "ekskul": "Futsal"
}
```

**Response 200**
```json
{ "ok": true, "id": "uuid-baru" }
```

---

### `DELETE /api/auth/users/{id}`

Hapus pengguna. Untuk role siswa, profil di tabel siswa ikut terhapus (cascade).

**Auth:** Bearer Token | **Path Param:** `id` — UUID pengguna

---

## 3. Ekstrakurikuler

### `GET /api/ekskul`

Daftar semua ekskul. **Auth:** Bearer Token atau X-API-Key

**Response 200**
```json
{
  "ok": true,
  "data": [
    { "id": 1, "nama": "Futsal", "jenis": "Olahraga", "deskripsi": "Ekskul futsal putra" },
    { "id": 2, "nama": "Tari Saman", "jenis": "Seni", "deskripsi": null }
  ]
}
```

---

### `POST /api/ekskul`

Tambah ekskul baru. **Auth:** Bearer Token

```json
{ "nama": "Badminton", "jenis": "Olahraga", "deskripsi": "Ekskul badminton campuran" }
```

**Jenis valid:** `Olahraga` · `Seni` · `Keagamaan` · `Umum`

---

### `DELETE /api/ekskul/{nama}`

Hapus ekskul beserta seluruh data terkait. **Auth:** Bearer Token

---

### `GET /api/ekskul/anggota/{ekskulName}`

Daftar anggota (siswa) pada ekskul tertentu. **Auth:** Bearer Token atau X-API-Key

**Response 200**
```json
{
  "ok": true,
  "data": [
    {
      "id": 10,
      "ekskul": "Futsal",
      "siswaId": "uuid-siswa",
      "nama": "Andi Wijaya",
      "kelas": "XI-RPL-1",
      "nisn": "0012345678"
    }
  ]
}
```

---

### `POST /api/ekskul/anggota`

Daftarkan siswa ke ekskul. **Auth:** Bearer Token

```json
{ "ekskulName": "Futsal", "siswaId": "uuid-siswa" }
```

---

### `DELETE /api/ekskul/anggota/{memberId}`

Keluarkan anggota dari ekskul. **Auth:** Bearer Token | **Path Param:** `memberId` — integer ID

---

### `GET /api/ekskul/penanggung-jawab`

Daftar pembina/penanggung jawab ekskul. **Auth:** Bearer Token atau X-API-Key

**Response 200**
```json
{
  "ok": true,
  "data": [
    { "id": 1, "userId": "uuid", "nama": "Budi Santoso, S.Pd", "ekskul": "Futsal", "peran": "Pembina" }
  ]
}
```

---

## 4. Siswa

### `GET /api/siswa`

Daftar seluruh siswa. **Auth:** Bearer Token atau X-API-Key

**Response 200**
```json
{
  "ok": true,
  "data": [
    {
      "id": "uuid-siswa",
      "nisn": "0012345678",
      "nis": "2324001",
      "nama": "Andi Wijaya",
      "kelas": "XI-RPL-1",
      "jk": "L",
      "googleEmail": "andi@students.sch.id",
      "isActive": true
    }
  ]
}
```

---

## 5. Jurnal & Kehadiran

### `GET /api/jurnal/ekskul/{ekskulName}`

Daftar jurnal kegiatan (pertemuan) suatu ekskul. **Auth:** Bearer Token atau X-API-Key

**Response 200**
```json
{
  "ok": true,
  "data": [
    {
      "id": 5,
      "ekskul": "Futsal",
      "tanggal": "2026-07-09",
      "deskripsi": "Latihan fisik dan teknik dasar",
      "dokumentasi": null
    }
  ]
}
```

---

### `POST /api/jurnal`

Simpan jurnal kegiatan + data absensi anggota. **Auth:** Bearer Token

**Request**
```json
{
  "ekskul": "Futsal",
  "tanggal": "2026-07-09",
  "deskripsi": "Latihan fisik",
  "dokumentasi": null,
  "attendance": [
    { "anggotaId": 10, "siswaId": "uuid-001", "status": "H" },
    { "anggotaId": 11, "siswaId": "uuid-002", "status": "S" }
  ]
}
```

**Kode Status Absensi:**

| Kode | Keterangan |
|------|------------|
| `H`  | Hadir |
| `S`  | Sakit |
| `I`  | Izin |
| `A`  | Alfa (tanpa keterangan) |

---

### `GET /api/jurnal/kehadiran/range`

Rekap kehadiran anggota dalam rentang tanggal. **Auth:** Bearer Token atau X-API-Key

**Query Params:**

| Parameter | Tipe   | Wajib | Contoh       |
|-----------|--------|-------|--------------|
| `ekskul`  | string | ✅    | `Futsal`     |
| `start`   | date   | ✅    | `2026-01-01` |
| `end`     | date   | ✅    | `2026-07-09` |

**Contoh:**
```
GET /api/jurnal/kehadiran/range?ekskul=Futsal&start=2026-01-01&end=2026-07-09
```

**Response 200**
```json
{
  "ok": true,
  "data": [
    { "siswaId": "uuid", "nama": "Andi Wijaya", "H": 12, "S": 1, "I": 0, "A": 0, "total": 13 }
  ]
}
```

---

### `GET /api/jurnal/siswa/{studentId}`

Riwayat kehadiran personal seorang siswa. **Auth:** Bearer Token atau X-API-Key

**Response 200**
```json
{
  "ok": true,
  "data": [
    { "id": 45, "ekskul": "Futsal", "tanggal": "2026-07-09", "deskripsi": "Latihan fisik", "status": "H" }
  ]
}
```

---

### `GET /api/jurnal/uploads`

Daftar semua berkas dokumen yang diunggah oleh pembina ekskul beserta tautan unduh presigned R2/S3. **Auth:** Bearer Token atau X-API-Key

**Response 200**
```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "ekskul": "Futsal",
      "filename_original": "proker_futsal.pdf",
      "stored_filename": "eks_Futsal_1719878900.pdf",
      "size_bytes": 1048576,
      "mime": "application/pdf",
      "uploaded_at": "2026-07-09T12:00:00.000Z",
      "review_status": "pending",
      "review_note": null,
      "document_type_name": "Program Kerja Awal Tahun",
      "download_url": "https://static-r2-apac.ppti.me/sieksav3/eks_Futsal_1719878900.pdf?X-Amz-Algorithm=..."
    }
  ]
}
```

---

### `POST /api/jurnal/uploads`

Mengunggah dokumen ekskul ke Cloudflare R2 / S3 storage. **Auth:** Bearer Token

**Request Format:** `multipart/form-data`

| Parameter | Tipe | Wajib | Keterangan |
|-----------|------|-------|------------|
| `file` | file binary | ✅ | File PDF/JPG/PNG |
| `ekskul` | string | ✅ | Nama ekskul |
| `documentTypeId` | integer | ✅ | ID jenis berkas |

**Response 200**
```json
{
  "ok": true,
  "id": 1,
  "storedFilename": "eks_Futsal_1719878900.pdf",
  "download_url": "https://static-r2-apac.ppti.me/sieksav3/eks_Futsal_1719878900.pdf?X-Amz-Algorithm=...",
  "message": "Berkas berhasil diunggah ke Cloudflare R2."
}
```

---

### `POST /api/jurnal/uploads/approve/{id}` & `POST /api/jurnal/uploads/reject/{id}`

Menyetujui atau menolak dokumen yang diunggah. **Auth:** Bearer Token

---

## 6. Prestasi

### `GET /api/prestasi`

Daftar pengajuan prestasi. **Auth:** Bearer Token atau X-API-Key

**Query Params (opsional):** `ekskul` — filter per ekskul

**Response 200**
```json
{
  "ok": true,
  "data": [
    {
      "id": 3,
      "ekskul": "Futsal",
      "namaPrestasi": "Juara 1 Turnamen Antar Sekolah",
      "jenis": "Tim",
      "penyelenggara": "Dinas Pendidikan Kabupaten",
      "tingkat": "Kabupaten",
      "mulai": "2026-03-01",
      "selesai": "2026-03-03",
      "status": "approved"
    }
  ]
}
```

**Status:** `submitted` · `approved` · `rejected`

---

### `POST /api/prestasi`

Ajukan prestasi baru. **Auth:** Bearer Token

```json
{
  "ekskul": "Futsal",
  "siswaId": "uuid-001",
  "anggotaId": 10,
  "jenis": "Tim",
  "nama": "Juara 2 Turnamen Regional",
  "penyelenggara": "Dinas Pendidikan",
  "tingkat": "Provinsi",
  "mulai": "2026-05-10",
  "selesai": "2026-05-12",
  "link": null
}
```

**Tingkat valid:** `Sekolah` · `Kabupaten` · `Provinsi` · `Nasional`

---

### `POST /api/prestasi/approve/{id}` & `POST /api/prestasi/reject/{id}`

Setujui atau tolak pengajuan prestasi. **Auth:** Bearer Token | **Path Param:** `id` — integer

---

## 7. Penilaian

### `GET /api/penilaian/ekskul/{ekskulName}`

Data penilaian kinerja anggota ekskul. **Auth:** Bearer Token atau X-API-Key

**Response 200**
```json
{
  "ok": true,
  "data": [
    {
      "id": 1,
      "ekskul": "Futsal",
      "siswaId": "uuid",
      "nama": "Andi Wijaya",
      "kategori": "Keaktifan",
      "deskripsi": "Selalu hadir dan aktif berlatih"
    }
  ]
}
```

---

### `POST /api/penilaian`

Simpan penilaian untuk anggota. **Auth:** Bearer Token

```json
{
  "ekskul": "Futsal",
  "anggotaId": 10,
  "siswaId": "uuid-001",
  "kategori": "Teknik",
  "deskripsi": "Teknik dribble dan passing sudah sangat baik"
}
```

---

## 8. Pengaturan & Token

### `GET /api/settings/gating` — Publik (tanpa auth)

```json
{
  "ok": true,
  "data": {
    "app_title": "SIEKSA",
    "school_name": "SMA Negeri 1 Gedeg",
    "school_logo_url": "https://contoh.com/logo.png",
    "maintenance_mode": "0",
    "sso_platform_name": "ScholarGate SSO"
  }
}
```

---

### `GET /api/settings/dashboard/stats` — Bearer Token atau X-API-Key

```json
{
  "ok": true,
  "data": {
    "totalStudents": 245,
    "totalAssigned": 198,
    "totalJournals": 42,
    "totalAchievements": 17,
    "typeCounts": { "Olahraga": 3, "Seni": 2, "Keagamaan": 1, "Umum": 1 },
    "levelCounts": { "Sekolah": 5, "Kabupaten": 8, "Provinsi": 3, "Nasional": 1 }
  }
}
```

---

### `POST /api/settings/api-tokens` — Bearer Token (Admin only)

```json
{ "name": "integrasi-simsekolah" }
```

**Response 200** — Token hanya ditampilkan sekali!
```json
{
  "ok": true,
  "data": {
    "name": "integrasi-simsekolah",
    "token": "sieksa_898d4cea9d7fd56255653808c6692c27079b0dfa96d62298",
    "createdAt": "2026-07-09T12:04:11.408Z"
  }
}
```

---

### `DELETE /api/settings/api-tokens/{name}` — Revoke token. Bearer Token (Admin only)

---

## 9. Kode Error

| HTTP | `error` key | Keterangan |
|------|-------------|------------|
| `400` | `missing_fields` | Field wajib tidak lengkap |
| `400` | `username_exists` | Username sudah terdaftar |
| `400` | `token_name_already_exists` | Nama token sudah dipakai |
| `401` | `invalid_credentials` | Username/password salah |
| `401` | `invalid_api_key` | X-API-Key tidak valid atau sudah direvoke |
| `403` | `api_key_readonly` | API Key hanya boleh akses GET |
| `404` | `not_found` | Data tidak ditemukan |
| `409` | `already_member` | Siswa sudah terdaftar di ekskul |
| `500` | `internal_error` | Kesalahan server |

**Format error standar:**
```json
{
  "ok": false,
  "error": "kode_error",
  "message": "Deskripsi lengkap error."
}
```

---

## 10. Contoh Integrasi

### Node.js / JavaScript

```javascript
const API_BASE = 'http://localhost:3110';
const API_KEY  = 'sieksa_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

async function apiGet(path, params = {}) {
  const url = new URL(API_BASE + path);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, { headers: { 'X-API-Key': API_KEY } });
  const data = await res.json();
  if (!data.ok) throw new Error(data.error);
  return data.data;
}

// Contoh penggunaan
const ekskuls = await apiGet('/api/ekskul');
const stats   = await apiGet('/api/settings/dashboard/stats');
const rekap   = await apiGet('/api/jurnal/kehadiran/range', {
  ekskul: 'Futsal', start: '2026-01-01', end: '2026-06-30'
});
```

---

### Python

```python
import requests

API_BASE = "http://localhost:3110"
HEADERS  = {"X-API-Key": "sieksa_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"}

def api_get(endpoint, params=None):
    r = requests.get(f"{API_BASE}{endpoint}", headers=HEADERS, params=params)
    r.raise_for_status()
    return r.json()["data"]

# Daftar semua siswa
siswa = api_get("/api/siswa")
print(f"Total siswa: {len(siswa)}")

# Rekap kehadiran Futsal semester 1
rekap = api_get("/api/jurnal/kehadiran/range", {
    "ekskul": "Futsal", "start": "2026-01-01", "end": "2026-06-30"
})

# Prestasi per ekskul
prestasi = api_get("/api/prestasi", {"ekskul": "Futsal"})
```

---

### PHP

```php
<?php
define('API_BASE', 'http://localhost:3110');
define('API_KEY',  'sieksa_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');

function sieksa_get(string $path, array $params = []): array {
    $url = API_BASE . $path . ($params ? '?' . http_build_query($params) : '');
    $ch  = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => ['X-API-Key: ' . API_KEY],
    ]);
    $res = json_decode(curl_exec($ch), true);
    curl_close($ch);
    return $res['data'] ?? [];
}

$ekskuls = sieksa_get('/api/ekskul');
$anggota = sieksa_get('/api/ekskul/anggota/Futsal');
$rekap   = sieksa_get('/api/jurnal/kehadiran/range', [
    'ekskul' => 'Futsal', 'start' => '2026-01-01', 'end' => '2026-06-30'
]);
```

---

### cURL

```bash
API_BASE="http://localhost:3110"
KEY="sieksa_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Health check
curl "$API_BASE/api/health"

# Daftar ekskul
curl -H "X-API-Key: $KEY" "$API_BASE/api/ekskul"

# Rekap kehadiran
curl -H "X-API-Key: $KEY" \
  "$API_BASE/api/jurnal/kehadiran/range?ekskul=Futsal&start=2026-01-01&end=2026-06-30"

# Login dan dapatkan Bearer token
TOKEN=$(curl -s -X POST "$API_BASE/api/auth/office/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}' \
  | python3 -c "import json,sys; print(json.load(sys.stdin)['token'])")

# Generate API Token baru (perlu Bearer)
curl -s -X POST "$API_BASE/api/settings/api-tokens" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"integrasi-rapor"}'
```

---

## Ringkasan Endpoint

| Endpoint | Method | Auth | Keterangan |
|----------|--------|------|------------|
| `/api/health` | GET | ❌ | Health check server |
| `/api/settings/gating` | GET | ❌ | Konfigurasi publik |
| `/api/auth/office/login` | POST | ❌ | Login lokal |
| `/api/auth/sso/login` | POST | ❌ | Login SSO |
| `/api/auth/users` | GET | 🔐 Bearer | Daftar pengguna |
| `/api/auth/users` | POST | 🔐 Bearer | Tambah pengguna |
| `/api/auth/users/{id}` | DELETE | 🔐 Bearer | Hapus pengguna |
| `/api/ekskul` | GET | 🔐 Bearer / 🔑 Key | Daftar ekskul |
| `/api/ekskul` | POST | 🔐 Bearer | Tambah ekskul |
| `/api/ekskul/{nama}` | DELETE | 🔐 Bearer | Hapus ekskul |
| `/api/ekskul/anggota/{nama}` | GET | 🔐 Bearer / 🔑 Key | Anggota ekskul |
| `/api/ekskul/anggota` | POST | 🔐 Bearer | Tambah anggota |
| `/api/ekskul/anggota/{id}` | DELETE | 🔐 Bearer | Keluarkan anggota |
| `/api/ekskul/penanggung-jawab` | GET | 🔐 Bearer / 🔑 Key | Daftar pembina |
| `/api/siswa` | GET | 🔐 Bearer / 🔑 Key | Daftar siswa |
| `/api/jurnal/ekskul/{nama}` | GET | 🔐 Bearer / 🔑 Key | Jurnal ekskul |
| `/api/jurnal` | POST | 🔐 Bearer | Simpan jurnal + absensi |
| `/api/jurnal/kehadiran/range` | GET | 🔐 Bearer / 🔑 Key | Rekap kehadiran |
| `/api/jurnal/siswa/{id}` | GET | 🔐 Bearer / 🔑 Key | Kehadiran siswa |
| `/api/jurnal/uploads` | GET | 🔐 Bearer / 🔑 Key | Daftar semua berkas |
| `/api/jurnal/uploads` | POST | 🔐 Bearer | Unggah berkas ke R2/S3 |
| `/api/jurnal/uploads/approve/{id}` | POST | 🔐 Bearer | Setujui berkas |
| `/api/jurnal/uploads/reject/{id}` | POST | 🔐 Bearer | Tolak berkas |
| `/api/prestasi` | GET | 🔐 Bearer / 🔑 Key | Daftar prestasi |
| `/api/prestasi` | POST | 🔐 Bearer | Ajukan prestasi |
| `/api/prestasi/approve/{id}` | POST | 🔐 Bearer | Setujui prestasi |
| `/api/prestasi/reject/{id}` | POST | 🔐 Bearer | Tolak prestasi |
| `/api/penilaian/ekskul/{nama}` | GET | 🔐 Bearer / 🔑 Key | Data penilaian |
| `/api/penilaian` | POST | 🔐 Bearer | Simpan penilaian |
| `/api/settings/dashboard/stats` | GET | 🔐 Bearer / 🔑 Key | Statistik |
| `/api/settings/api-tokens` | GET | 🔐 Bearer | Daftar token |
| `/api/settings/api-tokens` | POST | 🔐 Bearer | Generate token |
| `/api/settings/api-tokens/{name}` | DELETE | 🔐 Bearer | Revoke token |

---

*Diperbarui: Juli 2026 — SIEKSA v1.0*
