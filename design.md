### 3. File: `design.md`

```markdown
# ARSITEKTUR UI/UX & DESAIN SISTEM
# Proyek: SSO Sekolah Terpusat

## 1. KONSEP ESTETIKA & PANDUAN GAYA (STYLE GUIDE)
- **Tema Visual:** Flat modern dengan sudut membulat (*rounded-2xl* atau *rounded-3xl*).
- **Efek Kedalaman:** Elemen antarmuka melayang (*floating layers*) menggunakan `shadow-lg` dan `shadow-soft`.
- **Glassmorphism:** Latar belakang tembus pandang (*backdrop-blur-md*, `bg-white/70`) pada menu navigasi dan modal.
- **Tipografi:** Google Fonts `Plus Jakarta Sans`.
- **Ikonografi:** Google Material Symbols (Rounded version).

## 2. PEMETAAN PRETTY URL (BAHASA INDONESIA)
- `/otentikasi/masuk` (Login Page)
- `/superadmin/manajemen-aplikasi` (Katalog Aplikasi Terdaftar)
- `/superadmin/pengaturan-sistem` (Konfigurasi Global)
- `/admin/kelola-pengguna` (CRUD Pengguna)
- `/admin/persetujuan-data` (Tabel Approval Koreksi Data)
- `/siswa/dasbor` (Bento Grid Aplikasi untuk Siswa)
- `/guru/dasbor` (Bento Grid Aplikasi untuk Guru)

## 3. STRUKTUR KOMPONEN REACT (DASHBOARD BENTO GRID)

```jsx
// File: resources/js/Pages/DashboardBento.jsx
import React from 'react';
import { Head, Link } from '@inertiajs/react';

// Komponen utama untuk menampilkan Dasbor gaya Bento Grid
export default function DashboardBento({ dataPengguna, daftarAplikasi }) {
    return (
        <div className="min-h-screen bg-slate-50 p-6 md:p-12 font-jakarta">
            <Head title="Dasbor Aplikasi Sekolah" />
            
            {/* Efek latar belakang dekoratif */}
            <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-b-3xl -z-10 shadow-lg"></div>

            {/* Wadah utama melayang dengan efek glassmorphic pada Header */}
            <header className="flex justify-between items-center bg-white/80 backdrop-blur-md p-4 rounded-2xl shadow-sm mb-8 border border-white/40">
                <div className="flex items-center gap-3">
                    <span className="material-symbols-rounded text-indigo-600 text-3xl">school</span>
                    <h1 className="text-xl font-bold text-gray-800">SSO Sekolah Internasional</h1>
                </div>
                <div className="flex items-center gap-4">
                    <span className="font-semibold text-gray-700">Halo, {dataPengguna.namaLengkap}</span>
                    <img 
                        src={dataPengguna.tautanFotoProfil} 
                        alt="Foto Profil" 
                        className="w-10 h-10 rounded-full border-2 border-indigo-200"
                    />
                </div>
            </header>

            {/* Layout Bento Grid (Berubah sesuai ukuran layar) */}
            <main className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[200px]">
                
                {/* Kartu Profil (Ukuran lebih besar di grid) */}
                <div className="md:col-span-2 lg:col-span-2 bg-white rounded-3xl p-6 shadow-md hover:shadow-xl transition-shadow flex flex-col justify-between">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Selamat Datang Kembali!</h2>
                        <p className="text-gray-500 mt-2">Akses seluruh layanan pendidikan Anda dari satu tempat.</p>
                    </div>
                    <Link 
                        href="/pengaturan-profil" 
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl w-max hover:bg-indigo-700 transition-colors"
                    >
                        Perbarui Profil
                    </Link>
                </div>

                {/* Pemetaan Katalog Aplikasi (Grid Items) */}
                {daftarAplikasi.map((aplikasi) => (
                    <a 
                        key={aplikasi.id}
                        href={aplikasi.urlPanggilanBalik} 
                        className="bg-white rounded-3xl p-6 shadow-md hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col items-center justify-center text-center gap-3 border border-gray-100 group"
                    >
                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <img src={aplikasi.logoAplikasi} alt={aplikasi.namaAplikasi} className="w-10 h-10 object-contain" />
                        </div>
                        <h3 className="font-semibold text-gray-700">{aplikasi.namaAplikasi}</h3>
                    </a>
                ))}
            </main>
        </div>
    );
}