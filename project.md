Anda adalah seorang Senior Enterprise System Architect, Principal Security Engineer, dan Expert Full-Stack Developer. Tugas Anda saat ini adalah menyusun 1 file dokumentasi krusial bernama `project.md`.

File `project.md` ini akan berfungsi sebagai Peta Jalan (Roadmap) atau Project Management Plan langkah-demi-langkah yang sangat terperinci untuk membangun Aplikasi SSO Sekolah tingkat korporasi dari titik nol hingga siap rilis (Production Ready).

### 🛠️ SPESIFIKASI TEKNOLOGI & ARSITEKTUR WAJIB:
- **Arsitektur Utama:** Monolith SPA (Single Page Application) menggunakan Inertia.js. Frontend dan Backend berada dalam 1 folder project.
- **Backend:** PHP Laravel 12 (MVC, Strict OOP, Strongly Typed).
- **Frontend:** React.js, Tailwind CSS full utility classes.
- **Penyimpanan:** Integrasi dengan Object Storage (AWS S3 / GCP Cloud Storage).
- **Standardisasi Penamaan:** Seluruh penamaan Class, Method, Variabel, Komponen React, Struktur Database, dan Output Parameter URL wajib menggunakan Bahasa Indonesia Baku yang formal.
- **Pola URL (Pretty URL):** Menggunakan pola `domain.com/role/menu` (Contoh: `sso.sekolah.sch.id/superadmin/manajemen-aplikasi`).

---

### 📋 INSTRUKSI PEMBUATAN FILE `project.md`
Buatkan file `project.md` menggunakan format *Checklist* (`[ ]`) agar progres dapat dilacak. Berikan penjelasan singkat (1-2 kalimat) di bawah setiap langkah mengenai *mengapa* langkah tersebut penting secara arsitektur. 

Isi dari `project.md` harus mencakup 6 Fase berikut secara detail:

**Fase 1: Inisiasi & Konfigurasi Awal (Setup)**
- Langkah instalasi awal Laravel 12, React, Vite, dan Inertia.
- Penyiapan arsitektur folder (Pemisahan Controller, Request Validation, Service/Action classes untuk OOP yang ketat).
- Konfigurasi `.env` untuk Database (wajib UUID ready), Session (pengaturan Cross-Domain Cookie `.sekolah.sch.id`), dan Object Storage (AWS/GCP).

**Fase 2: Desain Database & Relasi (Migrations & Seeders)**
- Urutan pembuatan file *Migration* agar tidak terjadi bentrok *Foreign Key* (buat tabel master dulu, baru pivot). 
- Penegasan pembuatan kolom `nomor_induk` (NIP/NISN) bersatus UNIQUE di tabel `pengguna` sebagai jangkar utama verifikasi/klaim akun (bukan registrasi terbuka).
- Pembuatan *Factory* dan *Seeder* (Instruksikan pembuatan Seeder untuk 1 akun Superadmin "God System", 1 Admin, role lengkap [Super Admin, Admin, Guru, Siswa, Wali Kelas, BK, GDS], dan aplikasi *dummy* di App Registry).

**Fase 3: Autentikasi & Keamanan (Core SSO Engine)**
- Langkah pembuatan fitur Login standar, Klaim Akun (Verifikasi via NIP/NISN), dan Google OAuth 2.0.
- Implementasi logika penerbitan *Cross-Subdomain Cookie* dan penyuntikan array Role ke dalam JWT Payload untuk metode *Just-In-Time (JIT) Provisioning*.
- Pembuatan sistem *Middleware* Laravel untuk mengecek `redirect_uri` terhadap tabel `aplikasi_terdaftar` (Mencegah serangan Open Redirect).

**Fase 4: Role-Based Access Control (RBAC) & Middleware**
- Langkah pembuatan *Middleware* berbasis Peran. Ingat: semua role disimpan di tabel master `roles`, dan multi-role diatur di pivot tabel `user_roles`.
- Penerapan hierarki hak akses:
  - **Superadmin:** God System (Dashboard Sistem, App Registry, Manajemen Peran).
  - **Admin:** Manajemen Pengguna, Persetujuan Data (tabel `koreksi_pengguna`), Log Aktivitas.
  - **Pengguna Umum:** Katalog Aplikasi Dinamis (diatur via pivot `app_roles`), Profil, Keamanan Akun.

**Fase 5: Pengembangan Frontend & Aturan Ketat UI/UX (PENTING)**
- Langkah integrasi React + Tailwind menggunakan *Bento Grid Layout* dan desain *Glassmorphism*.
- Implementasi *Dual-Layer Verification* (Validasi form di React dan validasi ulang di Laravel Form Request).
- **ATURAN WAJIB SKELETON LOADING (ANTI-CLS):** - DILARANG menggunakan library SVG pihak ketiga (seperti `react-content-loader`).
  - WAJIB menggunakan komponen `<Skeleton />` bawaan berbasis Tailwind `animate-pulse` dan warna glassmorphism (misal: `bg-white/20`).
  - WAJIB mencegah *Cumulative Layout Shift (CLS)*: Pembungkus terluar (Grid/Flexbox, padding, gap) harus berada DI LUAR pengecekan `isLoading`. Gunakan *Aspect Ratios* tetap pada media, dan berikan dimensi pasti (contoh: `h-4 w-32`) pada skeleton agar presisi 100% dengan data asli.

**Fase 6: Pengujian Terpadu (Testing)**
- Checklist pengujian fungsionalitas SSO (lemparan *Direct Return* URL).
- Checklist pengujian *Cross-Subdomain Cookie Shared Test*.
- Checklist pengujian visibilitas menu berdasarkan Role.

Pastikan seluruh output dibungkus dalam blok kode Markdown (```markdown ... ```) agar mudah saya salin-tempel.