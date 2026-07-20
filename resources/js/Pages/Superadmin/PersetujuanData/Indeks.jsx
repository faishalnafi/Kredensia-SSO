import React from 'react';
import { Head, router } from '@inertiajs/react';
import TataLetakUtama from '@/Layouts/TataLetakUtama';
import Swal from 'sweetalert2';

export default function PersetujuanData({ daftarKoreksi = [] }) {
    const isAdmin = route().current().startsWith('admin.');
    const basePrefix = isAdmin ? 'admin.' : 'superadmin.';

    const setujuiKoreksi = async (id, nama) => {
        const res = await Swal.fire({
            title: 'Setujui Pengajuan Data?',
            html: `Apakah Anda yakin ingin menyetujui pengajuan perbaikan data dari <strong>"${nama}"</strong>?<br/><span style="font-size:0.85rem;color:#10b981;margin-top:6px;display:block;">Profil pengguna asli akan langsung diperbarui.</span>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: '✅ Ya, Setujui',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#10b981',
            cancelButtonColor: '#6b7280',
            customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5', cancelButton: 'rounded-xl font-bold px-5 py-2.5' }
        });

        if (res.isConfirmed) {
            router.post(route(`${basePrefix}persetujuan.setujui`, id), {}, {
                preserveScroll: true
            });
        }
    };

    const tolakKoreksi = async (id, nama) => {
        const res = await Swal.fire({
            title: 'Tolak Pengajuan Data?',
            html: `Apakah Anda yakin ingin menolak pengajuan perbaikan data dari <strong>"${nama}"</strong>?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: '❌ Ya, Tolak',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5', cancelButton: 'rounded-xl font-bold px-5 py-2.5' }
        });

        if (res.isConfirmed) {
            router.post(route(`${basePrefix}persetujuan.tolak`, id), {}, {
                preserveScroll: true
            });
        }
    };


    return (
        <>
            <Head title="Persetujuan Data - SSO Sekolah" />
            
            <div className="w-full max-w-6xl mx-auto space-y-6">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Validasi Pengajuan Data</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm">Setujui atau tolak pengajuan perbaikan data identitas profil dari pengguna secara teliti.</p>
                </div>

                <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-700/50">
                        <table className="w-full text-left text-sm whitespace-nowrap table-fixed">
                            <thead className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700/50">
                                <tr>
                                    <th className="px-6 py-4 font-bold w-1/4">Nama Pengguna</th>
                                    <th className="px-6 py-4 font-bold w-1/5">Kolom Data</th>
                                    <th className="px-6 py-4 font-bold w-1/4">Nilai Lama</th>
                                    <th className="px-6 py-4 font-bold w-1/4">Nilai Baru</th>
                                    <th className="px-6 py-4 font-bold w-1/5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {daftarKoreksi && daftarKoreksi.length > 0 ? (
                                    daftarKoreksi.map((koreksi) => {
                                        const namaPengguna = koreksi.user_asli ? koreksi.user_asli.nama_lengkap : 'Pengguna Tidak Diketahui';
                                        
                                        return (
                                            <tr key={koreksi.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors align-top">
                                                {/* Nama Pengguna */}
                                                <td className="px-6 py-4 truncate">
                                                    <div className="flex flex-col truncate">
                                                        <span className="font-bold text-slate-700 dark:text-slate-200 truncate">
                                                            {namaPengguna}
                                                        </span>
                                                        <span className="text-xs text-slate-400 truncate mt-0.5">
                                                            {koreksi.user_asli ? koreksi.user_asli.email : ''}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Kolom yang Diubah */}
                                                <td className="px-6 py-4">
                                                    <div className="space-y-2">
                                                        {koreksi.list_perubahan && koreksi.list_perubahan.length > 0 ? (
                                                            koreksi.list_perubahan.map((p, i) => (
                                                                <div key={i} className="text-xs font-bold text-slate-600 dark:text-slate-400 py-0.5">
                                                                    {p.kolom}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <span className="text-slate-400 italic text-xs">Tidak ada perbedaan data</span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Nilai Lama */}
                                                <td className="px-6 py-4">
                                                    <div className="space-y-2">
                                                        {koreksi.list_perubahan && koreksi.list_perubahan.length > 0 ? (
                                                            koreksi.list_perubahan.map((p, i) => (
                                                                <div key={i} className="text-xs text-red-500 line-through truncate py-0.5" title={p.lama}>
                                                                    {p.lama}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <span className="text-slate-400 text-xs">-</span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Nilai Baru */}
                                                <td className="px-6 py-4">
                                                    <div className="space-y-2">
                                                        {koreksi.list_perubahan && koreksi.list_perubahan.length > 0 ? (
                                                            koreksi.list_perubahan.map((p, i) => (
                                                                <div key={i} className="text-xs text-emerald-600 dark:text-emerald-400 font-bold truncate py-0.5" title={p.baru}>
                                                                    {p.baru}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <span className="text-slate-400 text-xs">-</span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Tombol Aksi */}
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button 
                                                            onClick={() => setujuiKoreksi(koreksi.id, namaPengguna)}
                                                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all shadow-md shadow-emerald-500/10"
                                                        >
                                                            <span className="material-symbols-rounded text-sm">check</span>
                                                            Setujui
                                                        </button>
                                                        <button 
                                                            onClick={() => tolakKoreksi(koreksi.id, namaPengguna)}
                                                            className="bg-red-550/10 dark:bg-red-500/10 text-red-650 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all border border-red-200/50 dark:border-red-500/20"
                                                        >
                                                            <span className="material-symbols-rounded text-sm">close</span>
                                                            Tolak
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-12 text-slate-400 dark:text-slate-500">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="material-symbols-rounded text-3xl">task_alt</span>
                                                <span>Tidak ada pengajuan perbaikan data tertunda.</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </>
    );
}


PersetujuanData.layout = page => <TataLetakUtama children={page} title="Persetujuan Perbaikan Data" />;
