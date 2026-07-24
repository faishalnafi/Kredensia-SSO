import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import TataLetakUtama from '@/Layouts/TataLetakUtama';
import Swal from 'sweetalert2';

export default function LogAktivitas({ daftarLog = { data: [], links: [] }, daftarArsip = [], filters }) {
    const [cari, setCari] = useState(filters.cari || '');
    const [modalArsipBuka, setModalArsipBuka] = useState(false);

    const pathPrefix = window.location.pathname.startsWith('/superadmin') ? 'superadmin' : 'admin';

    const tanganiCari = (e) => {
        e.preventDefault();
        router.get(route(route().current()), { cari }, {
            preserveState: true,
            replace: true
        });
    };

    const tanganiArsipManual = async () => {
        if (!daftarLog.total || daftarLog.total === 0) {
            Swal.fire({
                title: 'Tabel Kosong',
                text: 'Tidak ada entri log di database yang perlu diarsipkan.',
                icon: 'info',
                confirmButtonColor: '#0F91FC',
                customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5' }
            });
            return;
        }

        const res = await Swal.fire({
            title: 'Arsipkan & Bersihkan Log?',
            html: `Seluruh <strong>${daftarLog.total} entri log</strong> saat ini akan diekspor ke berkas <strong>JSON</strong> di server dan tabel database akan dibersihkan.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: '📦 Ya, Arsipkan Sekarang',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#0F91FC',
            cancelButtonColor: '#6b7280',
            customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5', cancelButton: 'rounded-xl font-bold px-5 py-2.5' }
        });

        if (res.isConfirmed) {
            router.post(route(`${pathPrefix}.log.arsip`), {}, {
                preserveScroll: true,
                onSuccess: () => {
                    setModalArsipBuka(false);
                }
            });
        }
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
        if (!dateString) return '-';
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
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Audit Trail</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Pencatatan real-time. Otomatis diarsipkan ke berkas JSON & dibersihkan setiap tanggal 1 bulan baru.</p>
                    </div>
                    
                    {/* Management Action Buttons */}
                    <div className="flex items-center gap-2.5 shrink-0">
                        {/* Tombol Buka Modal Arsip JSON */}
                        <button
                            onClick={() => setModalArsipBuka(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-emerald-600/10 flex items-center gap-2"
                        >
                            <span className="material-symbols-rounded text-lg">folder_zip</span>
                            Unduh Log Bulanan ({daftarArsip.length})
                        </button>

                        {/* Tombol Manual Archive */}
                        <button
                            onClick={tanganiArsipManual}
                            className="bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md flex items-center gap-2"
                            title="Ekspor log aktif ke JSON & bersihkan tabel database"
                        >
                            <span className="material-symbols-rounded text-lg">archive</span>
                            Arsipkan Sekarang
                        </button>
                    </div>
                </div>

                {/* Table Area */}
                <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-4">
                    
                    {/* Internal Table Header Bar (Filter & Search) */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                Daftar Aktivitas Real-time
                            </span>
                            <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                                {daftarLog.total || 0} Log
                            </span>
                        </div>

                        {/* Form Pencarian */}
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
                                    className="pl-10 pr-4 py-2 w-64 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#0F91FC] dark:text-white transition-all"
                                />
                            </div>
                            <button 
                                type="submit"
                                className="bg-[#0F91FC] hover:bg-[#0a78d6] text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md shadow-[#0F91FC]/10"
                            >
                                Cari
                            </button>
                        </form>
                    </div>

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
                                                <span>Tidak ada riwayat log aktivitas yang ditemukan di database.</span>
                                                <span className="text-xs text-slate-400">Log bulan-bulan sebelumnya disimpan dalam arsip JSON.</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Info & Pagination Section */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                        <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                            {daftarLog.total > 0 ? (
                                <>Menampilkan <span className="font-bold text-slate-700 dark:text-slate-300">{daftarLog.from || 0}</span> - <span className="font-bold text-slate-700 dark:text-slate-300">{daftarLog.to || 0}</span> dari <span className="font-bold text-slate-700 dark:text-slate-300">{daftarLog.total}</span> entri log aktif</>
                            ) : (
                                'Tabel log database kosong'
                            )}
                        </div>

                        {daftarLog.links && daftarLog.links.length > 3 && (
                            <div className="flex flex-wrap gap-1 justify-center">
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

            </div>

            {/* Modal Unduh Arsip Bulanan (JSON) */}
            {modalArsipBuka && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl border border-slate-100 dark:border-slate-700/50 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-2xl">
                                    <span className="material-symbols-rounded text-2xl">folder_zip</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Arsip Log Bulanan (JSON)</h3>
                                    <p className="text-xs text-slate-400">Berkas log tersimpan otomatis di folder storage/logs/aktivitas/</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setModalArsipBuka(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <span className="material-symbols-rounded">close</span>
                            </button>
                        </div>

                        <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                            {daftarArsip && daftarArsip.length > 0 ? (
                                daftarArsip.map((arsip, idx) => (
                                    <div 
                                        key={idx}
                                        className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-700/50 hover:border-emerald-500/30 transition-all"
                                    >
                                        <div className="flex items-center gap-3 truncate">
                                            <span className="material-symbols-rounded text-emerald-600 text-xl">description</span>
                                            <div className="truncate">
                                                <span className="font-bold text-sm text-slate-700 dark:text-slate-200 block truncate">
                                                    {arsip.label}
                                                </span>
                                                <span className="text-[11px] text-slate-400 font-mono">
                                                    {arsip.nama_file} • {arsip.ukuran} • Dibuat: {arsip.tanggal_dibuat}
                                                </span>
                                            </div>
                                        </div>
                                        <a
                                            href={route(`${pathPrefix}.log.unduh`, arsip.nama_file)}
                                            download
                                            className="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                                        >
                                            <span className="material-symbols-rounded text-base">download</span>
                                            Unduh JSON
                                        </a>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-slate-400">
                                    <span className="material-symbols-rounded text-3xl block mb-1">folder_off</span>
                                    <span className="text-sm">Belum ada berkas arsip log JSON. Berkas akan dibuat otomatis setiap tanggal 1 atau dengan tombol "Arsipkan Sekarang".</span>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-700/50">
                            <button
                                onClick={() => setModalArsipBuka(false)}
                                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

LogAktivitas.layout = page => <TataLetakUtama children={page} title="Log Aktivitas Sistem (Audit Trail)" />;
