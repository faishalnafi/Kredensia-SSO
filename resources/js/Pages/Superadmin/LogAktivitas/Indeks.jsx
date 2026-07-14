import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import TataLetakUtama from '@/Layouts/TataLetakUtama';

export default function LogAktivitas({ daftarLog, filters }) {
    const [cari, setCari] = useState(filters.cari || '');

    const tanganiCari = (e) => {
        e.preventDefault();
        router.get(route(route().current()), { cari }, {
            preserveState: true,
            replace: true
        });
    };

    // Helper untuk format jenis badge aktivitas
    const dapatkanWarnaBadge = (aktivitas) => {
        const text = aktivitas.toLowerCase();
        if (text.includes('gagal') || text.includes('ditolak')) {
            return 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 border border-red-200/50 dark:border-red-900/30';
        }
        if (text.includes('mendaftarkan') || text.includes('tambah') || text.includes('sukses')) {
            return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30';
        }
        if (text.includes('perbarui') || text.includes('ubah') || text.includes('regenerate') || text.includes('koreksi')) {
            return 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30';
        }
        if (text.includes('hapus') || text.includes('mengakhiri')) {
            return 'bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/30';
        }
        return 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50';
    };

    // Helper formatting waktu
    const formatWaktu = (dateString) => {
        const d = new Date(dateString);
        return d.toLocaleString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    return (
        <>
            <Head title="Log Aktivitas - SSO Sekolah" />
            
            <div className="w-full max-w-6xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Audit Trail</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Riwayat pelacakan aktivitas penting dan operasional sistem secara real-time.</p>
                    </div>
                    
                    {/* Pencarian */}
                    <form onSubmit={tanganiCari} className="flex gap-2">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <span className="material-symbols-rounded text-lg">search</span>
                            </span>
                            <input 
                                type="text"
                                placeholder="Cari log atau pengguna..."
                                value={cari}
                                onChange={e => setCari(e.target.value)}
                                className="pl-10 pr-4 py-2.5 w-64 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#0F91FC] dark:text-white transition-all shadow-sm"
                            />
                        </div>
                        <button 
                            type="submit"
                            className="bg-[#0F91FC] hover:bg-[#0a78d6] text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-[#0F91FC]/10"
                        >
                            Cari
                        </button>
                    </form>
                </div>

                {/* Table Area */}
                <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-700/50">
                        <table className="w-full text-left text-sm whitespace-nowrap table-fixed">
                            <thead className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700/50">
                                <tr>
                                    <th className="px-6 py-4 font-bold w-1/5">Waktu</th>
                                    <th className="px-6 py-4 font-bold w-1/4">Nama / Surel</th>
                                    <th className="px-6 py-4 font-bold w-2/5">Aktivitas</th>
                                    <th className="px-6 py-4 font-bold w-1/6">IP Address</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {daftarLog.data && daftarLog.data.length > 0 ? (
                                    daftarLog.data.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs truncate">
                                                {formatWaktu(log.created_at)}
                                            </td>
                                            <td className="px-6 py-4 truncate">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-700 dark:text-slate-200">
                                                        {log.user ? log.user.nama_lengkap : 'Tamu / Umum'}
                                                    </span>
                                                    <span className="text-xs text-slate-400 font-mono mt-0.5">
                                                        {log.email || 'Tidak tercatat'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 max-w-full">
                                                    <span className={`inline-flex px-2.5 py-1 text-[10px] rounded-full font-bold uppercase tracking-wider ${dapatkanWarnaBadge(log.aktivitas)}`}>
                                                        {log.aktivitas}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs truncate" title={log.user_agent}>
                                                {log.ip_address}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="text-center py-12 text-slate-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="material-symbols-rounded text-3xl">history_toggle_off</span>
                                                <span>Tidak ada riwayat log aktivitas yang ditemukan.</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Section */}
                    {daftarLog.links && daftarLog.links.length > 3 && (
                        <div className="flex flex-wrap gap-1 mt-6 justify-center">
                            {daftarLog.links.map((link, index) => {
                                if (link.url === null) {
                                    return (
                                        <span 
                                            key={index} 
                                            className="px-3.5 py-2 text-xs border border-slate-200 dark:border-slate-700/50 rounded-xl text-slate-300 dark:text-slate-600 cursor-not-allowed select-none"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    );
                                }
                                return (
                                    <Link
                                        key={index}
                                        href={link.url}
                                        className={`px-3.5 py-2 text-xs border rounded-xl transition-all font-semibold ${
                                            link.active 
                                                ? 'bg-[#0F91FC] border-[#0F91FC] text-white shadow-md shadow-[#0F91FC]/20' 
                                                : 'border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 bg-white dark:bg-slate-800'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}


LogAktivitas.layout = page => <TataLetakUtama children={page} title="Log Aktivitas Sistem (Audit Trail)" />;
