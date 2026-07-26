import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import TataLetakUtama from '@/Layouts/TataLetakUtama';

export default function Katalog({ daftarAplikasi }) {
    const [sedangMemuat, setSedangMemuat] = useState(true);

    // Helper untuk mengubah warna hex ke rgba
    const hexKeRgba = (hex, alpha) => {
        if (!hex) return `rgba(59, 130, 246, ${alpha})`;
        let c = hex.replace('#', '');
        if (c.length === 3) {
            c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
        }
        const r = parseInt(c.substring(0, 2), 16) || 0;
        const g = parseInt(c.substring(2, 4), 16) || 0;
        const b = parseInt(c.substring(4, 6), 16) || 0;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    // Efek simulasi pemuatan data awal untuk memperlihatkan animasi skeleton loader
    // dan memastikan pencegahan Cumulative Layout Shift (CLS)
    useEffect(() => {
        const penunda = setTimeout(() => {
            setSedangMemuat(false);
        }, 800);
        return () => clearTimeout(penunda);
    }, []);

    // Komponen lokal Skeleton Loader untuk meredam Cumulative Layout Shift (CLS).
    // Struktur pembungkus (Grid, margin, padding) wajib dipertahankan sama persis
    // demi mencegah pergeseran tata letak layout saat transisi data selesai dimuat.
    const SkeletonKartu = () => (
        <div className="bg-white/20 dark:bg-slate-800/40 backdrop-blur-lg border border-white/30 dark:border-slate-700/30 rounded-3xl p-6 flex flex-col justify-between h-[200px] animate-pulse">
            <div className="flex items-center gap-4">
                {/* Aspek ratio dan dimensi logo dipertahankan agar layout tidak bergeser */}
                <div className="w-14 h-14 rounded-2xl bg-white/20 dark:bg-slate-700/50 shrink-0" />
                <div className="space-y-2 flex-1">
                    <div className="h-5 bg-white/20 dark:bg-slate-700/50 rounded-md w-3/4" />
                    <div className="h-3 bg-white/10 dark:bg-slate-700/30 rounded-md w-1/2" />
                </div>
            </div>
            <div className="space-y-2">
                <div className="h-3 bg-white/10 dark:bg-slate-700/30 rounded-md w-full" />
                <div className="h-3 bg-white/10 dark:bg-slate-700/30 rounded-md w-5/6" />
            </div>
            <div className="h-12 bg-white/20 dark:bg-slate-700/50 rounded-2xl w-full mt-4" />
        </div>
    );

    return (
        <>
            <Head title="Katalog Aplikasi - Portal SSO" />

            <div className="w-full max-w-6xl mx-auto space-y-6">
                
                {/* Informasi Pengantar */}
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 lg:p-8 border border-slate-100 dark:border-slate-700/50 shadow-sm">
                    <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white leading-tight">Katalog Aplikasi Sekolah</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Selamat datang di portal SSO! Berikut adalah seluruh aplikasi akademis dan operasional yang diizinkan untuk peran Anda saat ini.
                    </p>
                </div>

                {/* Struktur Grid Aplikasi */}
                {sedangMemuat ? (
                    // Render Skeleton State dengan dimensi dan gap yang sama dengan data asli
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <SkeletonKartu />
                        <SkeletonKartu />
                        <SkeletonKartu />
                    </div>
                ) : (
                    <>
                        {daftarAplikasi && daftarAplikasi.length > 0 ? (
                            // Render Data Asli dalam layout Bento Grid dengan Glassmorphism
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {daftarAplikasi.map((aplikasi) => (
                                    <div 
                                        key={aplikasi.id} 
                                        className="bg-white/20 dark:bg-slate-800/40 backdrop-blur-lg border border-white/30 dark:border-slate-700/30 rounded-3xl p-6 flex flex-col justify-between h-[200px] shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group"
                                    >
                                        <div className="flex items-center gap-4 mb-4">
                                            {/* Container Logo / Ikon Fallback */}
                                            <div 
                                                className="w-14 h-14 rounded-2xl border flex items-center justify-center shadow-inner overflow-hidden shrink-0 transition-all duration-300"
                                                style={{
                                                    backgroundColor: hexKeRgba(aplikasi.warna_icon, 0.16),
                                                    borderColor: hexKeRgba(aplikasi.warna_icon, 0.35),
                                                    boxShadow: `0 4px 14px -2px ${hexKeRgba(aplikasi.warna_icon, 0.22)}`,
                                                }}
                                            >
                                                {aplikasi.logo_url ? (
                                                    <img src={aplikasi.logo_url} alt={aplikasi.nama_aplikasi} className="w-10 h-10 object-contain" />
                                                ) : (
                                                    <span 
                                                        className="material-symbols-rounded text-3xl"
                                                        style={{ color: aplikasi.warna_icon || '#3b82f6' }}
                                                    >
                                                        {aplikasi.icon_material || 'apps'}
                                                    </span>
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-extrabold text-slate-800 dark:text-white text-base leading-tight">
                                                    {aplikasi.nama_aplikasi}
                                                </h3>
                                                <span className="inline-block bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider mt-1.5">
                                                    Aktif
                                                </span>
                                            </div>
                                        </div>

                                        {/* Deskripsi Aplikasi */}
                                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                            {aplikasi.deskripsi || 'Aplikasi resmi sekolah yang terintegrasi dengan Single Sign-On.'}
                                        </p>

                                        {/* Aksi Klik: Menggunakan rute SSO login untuk otomatisasi pertukaran JWT token ke pihak ketiga */}
                                        <a 
                                            href={aplikasi.login_callback_url ? route('login', { client_id: aplikasi.id }) : aplikasi.portal_url}
                                            target={aplikasi.open_in_new_tab ? "_blank" : "_self"}
                                            rel="noopener noreferrer"
                                            className="w-full bg-white/80 dark:bg-slate-900/60 group-hover:bg-[#0F91FC] text-slate-700 dark:text-slate-200 group-hover:text-white font-bold py-3 px-4 rounded-2xl transition-all duration-300 text-center text-xs uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-200/50 dark:border-slate-800 mt-4 shadow-sm"
                                        >
                                            Buka Aplikasi
                                            {aplikasi.open_in_new_tab && (
                                                <span className="material-symbols-rounded text-sm">open_in_new</span>
                                            )}
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            // Tampilan State Kosong (Empty State) yang Elegan jika tidak ada akses aplikasi
                            <div className="w-full bg-white/20 dark:bg-slate-800/40 backdrop-blur-lg border border-white/30 dark:border-slate-700/30 rounded-3xl p-12 text-center shadow-sm">
                                <div className="w-16 h-16 rounded-full bg-amber-100/50 dark:bg-amber-950/30 flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-rounded text-3xl text-amber-600 dark:text-amber-500">apps_outage</span>
                                </div>
                                <h3 className="font-extrabold text-slate-800 dark:text-white text-lg">Akses Aplikasi Kosong</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto mt-2 leading-relaxed">
                                    Mohon maaf, Anda belum memiliki akses ke aplikasi manapun. Silakan hubungi Administrator untuk mendaftarkan peran Anda pada visibilitas aplikasi.
                                </p>
                            </div>
                        )}
                    </>
                )}

            </div>
        </>
    );
}


Katalog.layout = page => <TataLetakUtama children={page} title="Dasbor Katalog Aplikasi" />;
