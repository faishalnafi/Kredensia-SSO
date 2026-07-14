<div align="center">
  <img src="public/favicon.ico" alt="Logo" width="120" height="120">

  # 🌟 SSO Sekolah - Single Sign-On (SSO) Portal

  **Satu Akun, Semua Layanan Pendidikan.**
  <br />
  Portal otentikasi tersentralisasi (SSO) berkinerja tinggi yang dirancang khusus untuk mengintegrasikan seluruh ekosistem digital sekolah (E-Learning, Penilaian, Administrasi) ke dalam satu pintu masuk yang aman dan elegan.

  <p align="center">
    <img src="https://img.shields.io/badge/Laravel-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel" />
    <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
    <img src="https://img.shields.io/badge/Inertia.js-9553E9?style=for-the-badge&logo=inertia&logoColor=white" alt="Inertia" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind" />
    <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  </p>
</div>

---

## 🚀 Fitur Unggulan

- **🎨 UI/UX Premium (Glassmorphism & Bento Grid):** Desain antarmuka modern yang memanjakan mata, dilengkapi transisi halus *Anti-Layout-Shift* (Zero CLS) dan *Skeleton Loading*.
- **🔐 Keamanan Tingkat Tinggi (Dual-Layer):** 
  - Validasi ketat via `FormRequest` di sisi backend.
  - Integrasi **Google reCAPTCHA Enterprise** *(Invisible)* untuk perlindungan anti-Bot cerdas tanpa mengganggu kenyamanan pengguna.
- **⚡ Single Page Application (SPA):** Berpindah mode masuk dan verifikasi tanpa memuat ulang (reload) halaman berkat kekuatan React & Inertia.js.
- **⚙️ Web Setup Wizard:** Instalasi aplikasi semudah mengklik tombol (*Next-Next-Finish*) melalui browser (tidak perlu menyentuh terminal untuk migrasi database).
- **🐳 Docker Ready:** Dilengkapi dengan skrip *1-Click Easy Install* untuk *deployment* instan menggunakan Docker.

## 🛠️ Teknologi yang Digunakan

| Kategori | Teknologi | Deskripsi |
| :--- | :--- | :--- |
| **Backend** | Laravel 11/12 | Framework PHP Strict OOP untuk arsitektur MVC. |
| **Frontend** | React 18 & Inertia.js | Membangun komponen SPA tanpa API eksternal yang rumit. |
| **Styling** | Tailwind CSS 3 | Utility-first framework untuk desain adaptif & modern. |
| **Security** | reCAPTCHA Enterprise | SDK Google Cloud untuk *Risk Assessment* lalu lintas login. |
| **Infra** | Docker & SQLite/MySQL | Fleksibilitas *deployment* dari lokal hingga ke VPS/Cloud. |

---

## 📦 Panduan Memulai Cepat (*Quick Start*)

### 1. Menggunakan Docker (Paling Mudah 🪄)
Pastikan komputer/server Anda sudah memiliki Docker terinstal.
**Untuk Pengguna Windows:**
```powershell
.\setup-docker.ps1
```
**Untuk Pengguna Linux / macOS:**
```bash
chmod +x setup-docker.sh && ./setup-docker.sh
```
Setelah skrip selesai, buka peramban dan akses: `http://localhost:8000/setup` untuk menyelesaikan instalasi!

### 2. Instalasi Manual (VPS / Shared Hosting)
Untuk panduan instalasi super-lengkap (termasuk solusi jika terjadi *error open_basedir*, masalah sesi, dan layar *blank*), silakan baca dokumen wajib berikut:
👉 **[BACA PANDUAN LENGKAP: instalasi.txt](./instalasi.txt)**

---

## 🛡️ Standar Keamanan & Kode (SOP)
Proyek ini mematuhi standar *Clean Code* berbahasa Indonesia. Beberapa aturan krusial bagi para pengembang (*Developer*):
1. **Bahasa:** Semua nama Model, Controller, Fungsi, hingga Variabel menggunakan **Bahasa Indonesia Baku** (Contoh: `PengaturanSistem`, `ambilData()`).
2. **Anti-CLS:** DILARANG menggunakan library SVG *spinner/loader* dari luar. Wajib menggunakan komponen `<Skeleton />` bawaan berbasis Tailwind demi menjaga *Cumulative Layout Shift* tetap di angka 0.
3. **Environment:** Jangan pernah mengunggah (*commit*) file `.env` atau folder `public/hot` ke server produksi!

---
<div align="center">
  <i>Dibuat dengan ❤️ untuk kemajuan ekosistem pendidikan digital.</i>
</div>
