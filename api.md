<div align="center">

# 📡 SSO Sekolah — Dokumentasi Lengkap Integrasi & REST API

[![Version](https://img.shields.io/badge/API-v1.0.0-6366f1?style=flat-square)](.)
[![Status](https://img.shields.io/badge/Status-Production-22c55e?style=flat-square)](.)
[![Auth](https://img.shields.io/badge/Auth-API%20Key%20%26%20JWT-f59e0b?style=flat-square)](.)
[![License](https://img.shields.io/badge/Lisensi-Open%20Source-blue?style=flat-square)](.)

*Sistem Otentikasi Terpusat Monolitik (SPA) · v1.0.0 · Community Edition*

</div>

---

## 📋 Daftar Isi

1. [🔐 Autentikasi](#1-autentikasi)
2. [👥 Manajemen Pengguna](#2-manajemen-pengguna)
3. [⚽ Ekstrakurikuler](#3-ekstrakurikuler)
4. [🎓 Siswa](#4-siswa)
5. [📅 Jurnal & Kehadiran](#5-jurnal--kehadiran)
6. [🏆 Prestasi](#6-prestasi)
7. [📝 Penilaian](#7-penilaian)
8. [⚙️ Pengaturan & Token](#8-pengaturan--token)
9. [⚠️ Kode Error](#9-kode-error)
10. [💡 Contoh Integrasi](#10-contoh-integrasi)

---

## 1. Autentikasi

Bagian ini menjelaskan mekanisme masuk terpusat (*Single Sign-On*) menggunakan pengalihan browser (*redirect-based*) serta integrasi API otentikasi langsung.

### A. Alur SSO Pengalihan (Redirect SSO)
Aplikasi klien mengarahkan browser pengguna ke halaman otentikasi portal SSO:
* **Endpoint:** `GET /otentikasi`
* **Parameter Query:**

| Parameter | Wajib | Tipe | Deskripsi |
|---|---|---|---|
| `client_id` | **Ya** | `string (UUID)` | UUID Aplikasi klien yang terdaftar di portal SSO. |
| `redirect_uri` | Tidak | `string (URL)` | URL callback pengalihan setelah sukses login. Wajib cocok dengan domain terdaftar. |

**Contoh Request:**
```
GET https://your-sso-domain.com/otentikasi?client_id=995a9e3d-0d6e-4e4b-97fa-cb885b546377&redirect_uri=https://elearning.sekolah.sch.id/sso/callback
```

### B. Callback Token (JWT)
Setelah login berhasil di portal SSO, pengguna dialihkan kembali ke `redirect_uri` dengan parameter token JWT:
* **Format Pengalihan:** `GET {redirect_uri}?token={JWT_TOKEN}`
* **Algoritma Tanda Tangan:** `HS256` (HMAC menggunakan SHA-256) dengan kunci rahasia bersama `JWT_SECRET`.

### C. Alur Keluar (Single Sign-Out)
Aplikasi klien mengarahkan proses logout melalui portal SSO untuk membersihkan sesi global:
* **Endpoint:** `GET /otentikasi/keluar`
* **Parameter Query:** `redirect_uri` (URL tujuan setelah sukses logout).

---

## 2. Manajemen Pengguna

Endpoint untuk mengambil data seluruh warga sekolah (Superadmin, Guru, Siswa, Staf) yang terdaftar di database utama SSO.

### A. Ambil Daftar Pengguna
* **Endpoint:** `GET /api/v1/pengguna`
* **Query Parameters:**

| Parameter | Tipe | Default | Deskripsi |
|---|---|---|---|
| `pencarian` | `string` | — | Fuzzy search berdasarkan nama, email, NIK, atau NIP/NIS. |
| `peran` | `string` | — | Filter nama peran (contoh: `Guru`, `Siswa`, `Super Admin`). |
| `per-halaman` | `integer` | `50` | Jumlah data per halaman (Maksimal: `100`). |

**Request:**
```bash
curl -X GET "https://your-sso-domain.com/api/v1/pengguna?peran=Guru&pencarian=Budi" \
  -H "X-API-Key: sso_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**Response `200 OK`:**
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
      "roles": [
        { "id": "uuid-peran-1", "nama_role": "Guru" }
      ]
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "per_page": 50,
    "last_page": 1
  }
}
```

### B. Ambil Detail Pengguna
* **Endpoint:** `GET /api/v1/pengguna/{id}`

---

## 3. Ekstrakurikuler

Mengelola kegiatan ekstrakurikuler siswa (Pramuka, Futsal, Basket, Paskibra, Musik, dll.) yang terintegrasi dengan data SSO.

### A. Ambil Daftar Ekstrakurikuler
* **Endpoint:** `GET /api/v1/ekstrakurikuler`
* **Query Parameters:** `pencarian` (pencarian nama ekstrakurikuler).

**Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ekskul-uuid-001",
      "nama_ekstrakurikuler": "Pramuka",
      "pembina": "Drs. Ahmad Yani",
      "hari_kegiatan": "Sabtu",
      "jam_mulai": "14:00:00",
      "jam_selesai": "16:00:00",
      "kuota_anggota": 100,
      "jumlah_anggota": 62
    }
  ]
}
```

### B. Ambil Anggota Ekstrakurikuler
* **Endpoint:** `GET /api/v1/ekstrakurikuler/anggota/{id}`

### C. Pendaftaran Ekstrakurikuler
Siswa mendaftar ke kegiatan ekstrakurikuler.
* **Endpoint:** `POST /api/v1/ekstrakurikuler/gabung`
* **Request Body:**
```json
{
  "siswa_id": "550e8400-e29b-41d4-a716-446655440000",
  "ekstrakurikuler_id": "ekskul-uuid-001"
}
```

---

## 4. Siswa

Endpoint spesifik untuk data akademis siswa, pemetaan kelas, dan profil detail siswa.

### A. Ambil Daftar Siswa Aktif
* **Endpoint:** `GET /api/v1/siswa`
* **Query Parameters:**

| Parameter | Tipe | Deskripsi |
|---|---|---|
| `kelas` | `string` | Kode/nama kelas (contoh: `X-A`, `XI-MIPA-1`). |
| `tahun-ajaran` | `string` | Tahun ajaran aktif (contoh: `2026/2027`). |

**Request:**
```bash
curl -X GET "https://your-sso-domain.com/api/v1/siswa?kelas=X-A" \
  -H "X-API-Key: sso_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

**Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "siswa-uuid-999",
      "nama_lengkap": "Rian Hidayat",
      "nisn": "0056123456",
      "kelas_sekarang": "X-A",
      "status_akademis": "Aktif",
      "nama_ayah": "Supriadi",
      "nama_ibu": "Aminah"
    }
  ]
}
```

### B. Ambil Detail Profil Siswa
* **Endpoint:** `GET /api/v1/siswa/detail/{id}`

---

## 5. Jurnal & Kehadiran

Mengelola log jurnal pembelajaran guru dan rekam kehadiran siswa harian.

### A. Ambil Rekap Kehadiran Kelas
* **Endpoint:** `GET /api/v1/kehadiran/daftar`
* **Query Parameters:** `tanggal` (YYYY-MM-DD), `kelas` (string).

**Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "siswa_id": "siswa-uuid-999",
      "nama_lengkap": "Rian Hidayat",
      "status_kehadiran": "Hadir",
      "keterangan": null
    }
  ]
}
```

### B. Simpan Kehadiran Siswa
* **Endpoint:** `POST /api/v1/kehadiran/simpan`
* **Request Body:**
```json
{
  "tanggal": "2026-07-15",
  "kelas": "X-A",
  "daftar_kehadiran": [
    { "siswa_id": "siswa-uuid-999", "status_kehadiran": "Hadir", "keterangan": "" },
    { "siswa_id": "siswa-uuid-888", "status_kehadiran": "Sakit", "keterangan": "Surat dokter terlampir" }
  ]
}
```

### C. Simpan Jurnal Pembelajaran Guru
* **Endpoint:** `POST /api/v1/jurnal/simpan`
* **Request Body:**
```json
{
  "tanggal": "2026-07-15",
  "guru_id": "550e8400-e29b-41d4-a716-446655440000",
  "kelas": "X-A",
  "mata_pelajaran": "Matematika",
  "materi_pembahasan": "Matriks Ordo 3x3",
  "hambatan_solusi": "Beberapa siswa terlambat, diberikan bimbingan susulan"
}
```

---

## 6. Prestasi

Pencatatan prestasi siswa baik di bidang akademik maupun non-akademik (olahraga, seni, sains, dll.).

### A. Ambil Daftar Prestasi Siswa
* **Endpoint:** `GET /api/v1/prestasi`
* **Query Parameters:** `siswa-id` (UUID - opsional).

**Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "id": "prestasi-uuid-321",
      "siswa_id": "siswa-uuid-999",
      "nama_siswa": "Rian Hidayat",
      "nama_prestasi": "Juara 1 Olimpiade Matematika Nasional",
      "tingkat": "Nasional",
      "kategori": "Akademik",
      "penyelenggara": "Kementerian Pendidikan",
      "tahun": 2026,
      "sertifikat_url": "https://storage.sekolah.sch.id/prestasi/sertifikat-rian.pdf"
    }
  ]
}
```

### B. Tambah Data Prestasi Siswa
* **Endpoint:** `POST /api/v1/prestasi/simpan`

---

## 7. Penilaian

Mengambil dan mengelola data nilai tugas, ujian, dan rapor siswa.

### A. Ambil Daftar Nilai Siswa
* **Endpoint:** `GET /api/v1/penilaian/daftar`
* **Query Parameters:** `kelas` (string), `mata-pelajaran` (string), `kategori` (Tugas / UH / UTS / UAS).

**Response `200 OK`:**
```json
{
  "success": true,
  "data": [
    {
      "siswa_id": "siswa-uuid-999",
      "nama_lengkap": "Rian Hidayat",
      "nilai": 88.5,
      "nilai_huruf": "A",
      "keterangan": "Tuntas"
    }
  ]
}
```

### B. Simpan Penilaian Siswa
* **Endpoint:** `POST /api/v1/penilaian/simpan`
* **Request Body:**
```json
{
  "kelas": "X-A",
  "mata_pelajaran": "Matematika",
  "kategori": "UTS",
  "tanggal_penilaian": "2026-07-15",
  "daftar_nilai": [
    { "siswa_id": "siswa-uuid-999", "nilai": 88.5 }
  ]
}
```

### C. Ambil Ringkasan Rapor Semester
* **Endpoint:** `GET /api/v1/penilaian/ringkasan-rapor/{siswa_id}`

---

## 8. Pengaturan & Token

Penjelasan parameter autentikasi Kunci API dan pengelolaan otentikasi backend-to-backend.

### A. Pengiriman Kunci API
Setiap permintaan ke REST API Data wajib menyertakan Kunci API pada header HTTP:
* **Header Utama (Direkomendasikan):** `X-API-Key`
* **Header Alternatif:** `Authorization: Bearer`

### B. Struktur Kunci API
Kunci API SSO Sekolah diawali dengan awalan unik:
```
sso_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### C. Pembatasan Keamanan (Rate Limit)
Sistem membatasi jumlah request untuk mencegah overload:
* **Batas Maksimal:** 60 request per menit per Kunci API.
* **Pembatasan Origin:** Kunci API dapat dikunci ke IP Server atau Domain asal tertentu (CORS Protection).

---

## 9. Kode Error

Sistem menggunakan kode status HTTP standar untuk mengindikasikan status transaksi.

| Kode Status | Penyebab Error | Contoh Solusi |
|---|---|---|
| `400` | Bad Request | Periksa format parameter input JSON. |
| `401` | Unauthorized | Kunci API atau Token JWT salah/hilang. |
| `403` | Forbidden | Domain request diblokir atau Kunci API dinonaktifkan. |
| `404` | Not Found | ID pengguna atau data tidak ditemukan. |
| `422` | Unprocessable Entity | Parameter tidak lolos validasi input Laravel. |
| `429` | Too Many Requests | Laju pemanggilan API terlalu cepat (tunggu 1 menit). |
| `500` | Server Error | Terjadi kesalahan sistem database pusat SSO. |

**Format Response Error JSON:**
```json
{
  "success": false,
  "pesan": "Akses ditolak. Domain asal Anda (domain.com) tidak diizinkan."
}
```

---

## 10. Contoh Integrasi

### A. PHP (Laravel - Http Client)
```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Http;
use Illuminate\Http\Request;

class SSOIntegratorController extends Controller
{
    /**
     * Mengambil daftar siswa dari SSO pusat
     */
    public function ambilDaftarSiswa(): array
    {
        $response = Http::withHeaders([
            'X-API-Key' => env('SSO_API_KEY'),
            'Accept'    => 'application/json',
        ])->get(env('SSO_BASE_URL') . '/api/v1/siswa', [
            'kelas' => 'X-A',
        ]);

        if ($response->successful()) {
            return $response->json('data');
        }

        throw new \Exception('Gagal mengambil data siswa: ' . $response->json('pesan'));
    }
}
```

### B. Node.js (Express & jsonwebtoken)
```javascript
const express = require('express');
const jwt = require('jsonwebtoken');
const app = express();

const JWT_SECRET = process.env.SSO_JWT_SECRET || 'sso_secret_key_default_32_characters';

// Rute penanganan callback SSO
app.get('/sso/callback', (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).send('Token kosong.');

  jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }, (err, decoded) => {
    if (err) return res.status(401).send('Token tidak valid: ' + err.message);

    // Dapatkan data identitas pengguna
    const user = decoded;
    res.send(`Selamat datang ${user.nama}. Peran Anda: ${user.roles.join(', ')}`);
  });
});
```

### C. Python (Flask & pyjwt)
```python
import jwt
from flask import Flask, request, jsonify

app = Flask(__name__)
JWT_SECRET = "sso_secret_key_default_32_characters"

@app.route("/sso/callback")
def sso_callback():
    token = request.args.get("token")
    if not token:
        return "Token tidak disertakan", 400
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return f"Halo {payload.get('nama')}, Login Anda Berhasil!"
    except jwt.InvalidTokenError:
        return "Verifikasi token gagal", 401
```

---

<div align="center">

<br/>

*Dokumentasi Integrasi SSO Sekolah v1.0.0 — Community Edition*

*Dirancang dengan ❤️ oleh [Faishal Nafi Network](https://faishalnafi.com)*

*Bebas disalin, dimodifikasi, dan dibagikan kembali.*

</div>
