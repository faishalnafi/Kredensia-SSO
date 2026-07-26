import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import TataLetakUtama from '@/Layouts/TataLetakUtama';

export default function KatalogAplikasi({ daftarAplikasi }) {
    const [kataKunci, setKataKunci] = useState('');
    const [sematanIds, setSematanIds] = useState(() => {
        try {
            const tersimpan = localStorage.getItem('sso_pinned_apps');
            return tersimpan ? JSON.parse(tersimpan) : [];
        } catch (e) {
            return [];
        }
    });

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

    const tanganiSemat = (id) => {
        let baru;
        if (sematanIds.includes(id)) {
            baru = sematanIds.filter((x) => x !== id);
        } else {
            baru = [id, ...sematanIds.filter((x) => x !== id)];
        }
        setSematanIds(baru);
        try {
            localStorage.setItem('sso_pinned_apps', JSON.stringify(baru));
        } catch (e) {
            console.error('Gagal menyimpan sematan:', e);
        }
    };

    const aplikasiTersaring = (daftarAplikasi || []).filter((app) => {
        if (!kataKunci.trim()) return true;
        const q = kataKunci.toLowerCase();
        return (
            (app.nama_aplikasi && app.nama_aplikasi.toLowerCase().includes(q)) ||
            (app.deskripsi && app.deskripsi.toLowerCase().includes(q))
        );
    });

    const aplikasiTerurut = [...aplikasiTersaring].sort((a, b) => {
        const idxA = sematanIds.indexOf(a.id);
        const idxB = sematanIds.indexOf(b.id);
        const isPinnedA = idxA !== -1;
        const isPinnedB = idxB !== -1;

        if (isPinnedA && isPinnedB) {
            return idxA - idxB;
        }
        if (isPinnedA) return -1;
        if (isPinnedB) return 1;

        return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });

    return (
        <>
            <Head title="Katalog Aplikasi - Superadmin SSO" />
            
            <div className="w-full max-w-6xl mx-auto space-y-6">
                {/* Informasi & Kolom Pencarian (Gambar 3) */}
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 lg:p-8 border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Katalog Aplikasi</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Masuk ke aplikasi ekosistem sekolah secara langsung</p>
                    </div>

                    {/* Kolom Pencarian (Gambar 3) */}
                    <div className="relative w-full sm:w-72 shrink-0">
                        <span className="material-symbols-rounded absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
                            search
                        </span>
                        <input 
                            type="text"
                            value={kataKunci}
                            onChange={(e) => setKataKunci(e.target.value)}
                            placeholder="Cari aplikasi..."
                            className="w-full bg-slate-50 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-9 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-[#0F91FC] focus:border-transparent transition-all placeholder:text-slate-400 shadow-inner"
                        />
                        {kataKunci && (
                            <button 
                                onClick={() => setKataKunci('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                            >
                                <span className="material-symbols-rounded text-sm">close</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {aplikasiTerurut && aplikasiTerurut.length > 0 ? (
                        aplikasiTerurut.map((aplikasi, index) => {
                            const tersemat = sematanIds.includes(aplikasi.id);
                            return (
                                <div key={index} className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col justify-between hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 group">
                                    <div>
                                        {/* Baris Atas: Ikon Aplikasi & Tombol Pin */}
                                        <div className="flex items-start justify-between gap-4 mb-4">
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

                                            {/* Tombol Pin / Sematan Favorit */}
                                            <button
                                                type="button"
                                                onClick={() => tanganiSemat(aplikasi.id)}
                                                className={`p-2 rounded-xl transition-all duration-300 ${
                                                    tersemat 
                                                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-500 border border-amber-200 dark:border-amber-800/60 shadow-sm scale-105' 
                                                        : 'text-slate-300 dark:text-slate-600 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-700/50 opacity-60 hover:opacity-100'
                                                }`}
                                                title={tersemat ? "Lepas sematan favorit" : "Sematkan ke favorit"}
                                            >
                                                <span className={`material-symbols-rounded text-xl ${tersemat ? 'fill-current' : ''}`}>
                                                    push_pin
                                                </span>
                                            </button>
                                        </div>

                                        {/* Judul Aplikasi (Gambar 2) */}
                                        <h3 className="font-extrabold text-slate-800 dark:text-white text-lg leading-tight mb-2">
                                            {aplikasi.nama_aplikasi}
                                        </h3>

                                        {/* Deskripsi Lengkap (Gambar 2) */}
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                                            {aplikasi.deskripsi || 'Aplikasi terhubung ke portal SSO'}
                                        </p>
                                    </div>

                                    {/* Action Link: Ikon panah miring (tab baru) vs panah lurus kanan (tab sama) (Gambar 2) */}
                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700/40">
                                        <a 
                                            href={aplikasi.login_callback_url ? route('login', { client_id: aplikasi.id }) : aplikasi.portal_url}
                                            target={aplikasi.open_in_new_tab ? "_blank" : "_self"}
                                            rel="noopener noreferrer"
                                            className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 group-hover:text-[#0F91FC] transition-colors"
                                        >
                                            {aplikasi.open_in_new_tab ? (
                                                <span className="material-symbols-rounded text-base text-[#0F91FC]">open_in_new</span>
                                            ) : (
                                                <span className="material-symbols-rounded text-base text-[#0F91FC]">east</span>
                                            )}
                                            <span>Buka Aplikasi</span>
                                        </a>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="col-span-full bg-white/80 dark:bg-slate-800/80 rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-700/50 shadow-sm">
                            <div className="w-16 h-16 rounded-full bg-amber-100/50 dark:bg-amber-950/30 flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-rounded text-3xl text-amber-600 dark:text-amber-500">
                                    {kataKunci ? 'search_off' : 'apps_outage'}
                                </span>
                            </div>
                            <h3 className="font-extrabold text-slate-800 dark:text-white text-lg">
                                {kataKunci ? 'Aplikasi Tidak Ditemukan' : 'Belum Ada Aplikasi'}
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto mt-2 leading-relaxed">
                                {kataKunci 
                                    ? `Tidak ditemukan aplikasi yang cocok dengan kata kunci "${kataKunci}".`
                                    : 'Belum ada aplikasi yang terhubung atau diaktifkan.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

KatalogAplikasi.layout = page => <TataLetakUtama children={page} title="Katalog Aplikasi" />;
