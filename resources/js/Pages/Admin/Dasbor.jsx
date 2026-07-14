import React from 'react';
import { Head, Link } from '@inertiajs/react';
import TataLetakUtama from '@/Layouts/TataLetakUtama';

export default function DasborAdmin({ statistik }) {
    return (
        <>
            <Head title="Dasbor Admin - SingleSignOn" />
            
            <div className="w-full max-w-6xl mx-auto space-y-6">
                
                {/* Welcome Banner */}
                <div className="relative overflow-hidden bg-gradient-to-br from-[#081242] to-[#0F91FC] rounded-3xl p-8 lg:p-10 text-white shadow-xl shadow-[#0F91FC]/20">
                    <div className="relative z-10 max-w-2xl">
                        <h2 className="text-3xl lg:text-4xl font-extrabold mb-4 tracking-tight">Manajemen Operasional</h2>
                        <p className="text-blue-100 text-sm leading-relaxed">
                            Pusat kendali operasional untuk mengelola data siswa, guru, persetujuan data koreksi, serta audit dasar aktivitas pengguna.
                        </p>
                    </div>
                    <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
                </div>

                {/* Bento Grid Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Pengguna Aktif */}
                    <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                <span className="material-symbols-rounded text-2xl">group</span>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Pengguna Aktif</h3>
                            <p className="text-4xl font-extrabold text-slate-800 dark:text-white">{statistik.totalPenggunaAktif}</p>
                        </div>
                    </div>

                    {/* Pengguna Baru (7 Hari) */}
                    <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                <span className="material-symbols-rounded text-2xl">person_add</span>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Pengguna Baru (7 Hari)</h3>
                            <p className="text-4xl font-extrabold text-slate-800 dark:text-white">{statistik.penggunaBaru}</p>
                        </div>
                    </div>

                    {/* Notifikasi Pengajuan */}
                    <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                <span className="material-symbols-rounded text-2xl">notifications_active</span>
                            </div>
                            {statistik.notifikasiPengajuan > 0 && (
                                <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 text-xs font-bold px-2.5 py-1 rounded-full animate-pulse">Butuh Tindakan</span>
                            )}
                        </div>
                        <div>
                            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Pengajuan Koreksi Data</h3>
                            <p className="text-4xl font-extrabold text-slate-800 dark:text-white">{statistik.notifikasiPengajuan}</p>
                        </div>
                    </div>
                </div>

                {/* Quick Access */}
                <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 lg:p-8 border border-slate-100 dark:border-slate-700/50 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Akses Cepat Fitur Admin</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Link href={route('admin.pengguna.indeks')} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 hover:bg-[#0F91FC]/10 dark:hover:bg-[#ff6b39]/10 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all font-semibold">
                            <span className="material-symbols-rounded text-2xl text-[#0F91FC] dark:text-[#ff6b39]">manage_accounts</span>
                            Manajemen Pengguna
                        </Link>
                        <Link href={route('admin.persetujuan.indeks')} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 hover:bg-[#0F91FC]/10 dark:hover:bg-[#ff6b39]/10 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all font-semibold">
                            <span className="material-symbols-rounded text-2xl text-amber-500">task</span>
                            Persetujuan Data
                        </Link>
                        <Link href={route('admin.log.indeks')} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-900 hover:bg-[#0F91FC]/10 dark:hover:bg-[#ff6b39]/10 rounded-2xl border border-slate-100 dark:border-slate-800 transition-all font-semibold">
                            <span className="material-symbols-rounded text-2xl text-emerald-500">history</span>
                            Log Aktivitas
                        </Link>
                    </div>
                </div>

            </div>
        </>
    );
}


DasborAdmin.layout = page => <TataLetakUtama children={page} title="Dasbor Admin Operasional" />;
