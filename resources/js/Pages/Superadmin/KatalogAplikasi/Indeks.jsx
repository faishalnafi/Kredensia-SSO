import React from 'react';
import { Head } from '@inertiajs/react';
import TataLetakUtama from '@/Layouts/TataLetakUtama';

export default function KatalogAplikasi({ daftarAplikasi }) {
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

    return (
        <>
            <Head title="Katalog Aplikasi - Superadmin SSO" />
            
            <div className="w-full max-w-6xl mx-auto space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Katalog Aplikasi</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Masuk ke aplikasi ekosistem sekolah secara langsung</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {daftarAplikasi && daftarAplikasi.length > 0 ? (
                        daftarAplikasi.map((aplikasi, index) => (
                            <div key={index} className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300 group">
                                <div className="flex items-center gap-4 mb-6">
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
                                        <h3 className="font-extrabold text-slate-800 dark:text-white text-lg leading-tight">{aplikasi.nama_aplikasi}</h3>
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 line-clamp-1">{aplikasi.deskripsi || 'Aplikasi terhubung ke portal SSO'}</p>
                                    </div>
                                </div>
                                <a 
                                    href={aplikasi.login_callback_url ? route('login', { client_id: aplikasi.id }) : aplikasi.portal_url}
                                    target={aplikasi.open_in_new_tab ? "_blank" : "_self"}
                                    rel="noopener noreferrer"
                                    className="w-full bg-slate-50 dark:bg-slate-900 group-hover:bg-[#0F91FC] text-slate-700 dark:text-slate-200 group-hover:text-white font-bold py-3.5 px-4 rounded-2xl transition-all duration-300 text-center text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                                >
                                    Buka Aplikasi
                                    {aplikasi.open_in_new_tab && (
                                        <span className="material-symbols-rounded text-base">open_in_new</span>
                                    )}
                                </a>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full bg-white dark:bg-slate-800/80 rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-700/50 shadow-sm">
                            <span className="material-symbols-rounded text-5xl text-slate-400 mb-4">apps_outage</span>
                            <p className="text-slate-500 dark:text-slate-400 font-semibold">Belum ada aplikasi yang terhubung atau diaktifkan.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}


KatalogAplikasi.layout = page => <TataLetakUtama children={page} title="Dashboard Katalog Aplikasi" />;
