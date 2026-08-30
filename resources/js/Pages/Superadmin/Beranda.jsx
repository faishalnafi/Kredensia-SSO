import React from 'react';
import { Head, Link } from '@inertiajs/react';
import TataLetakUtama from '@/Layouts/TataLetakUtama';

export default function Beranda({ statistik, penggunaTerbaru }) {
    return (
        <>
            <Head title="Beranda - Superadmin SSO" />
            
            <div className="w-full max-w-6xl mx-auto space-y-6">
                
                {/* Welcome Banner */}
                <div className="relative overflow-hidden bg-[#0F91FC] rounded-3xl p-8 lg:p-10 text-white shadow-xl shadow-[#0F91FC]/30">
                    <div className="relative z-10 max-w-2xl">
                        <h2 className="text-3xl lg:text-4xl font-extrabold mb-4 tracking-tight">Selamat Datang di Pusat Kendali!</h2>
                        <p className="text-white/80 text-sm leading-relaxed">
                            Pantau aktivitas sistem Single Sign-On, kelola akses pengguna, peran, dan aplikasi yang terhubung secara terpusat.
                        </p>
                    </div>
                    {/* Decorative Elements */}
                    <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
                    <div className="absolute right-20 -bottom-20 w-48 h-48 rounded-full bg-white/10 blur-2xl"></div>
                </div>

                {/* Bento Grid Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Total Pengguna */}
                    <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300 group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                <span className="material-symbols-rounded text-2xl">group</span>
                            </div>
                            <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 text-xs font-bold px-2 py-1 rounded-full">+12%</span>
                        </div>
                        <div>
                            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Total Pengguna</h3>
                            <p className="text-4xl font-extrabold text-slate-800 dark:text-white">{statistik.totalPengguna}</p>
                        </div>
                    </div>

                    {/* Total Peran */}
                    <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300 group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                <span className="material-symbols-rounded text-2xl">admin_panel_settings</span>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Total Peran Aktif</h3>
                            <p className="text-4xl font-extrabold text-slate-800 dark:text-white">{statistik.totalPeran}</p>
                        </div>
                    </div>

                    {/* Total Aplikasi */}
                    <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300 group">
                        <div className="flex items-center justify-between mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                <span className="material-symbols-rounded text-2xl">apps</span>
                            </div>
                            <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 text-xs font-bold px-2 py-1 rounded-full">Aktif</span>
                        </div>
                        <div>
                            <h3 className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider mb-1">Aplikasi Terdaftar</h3>
                            <p className="text-4xl font-extrabold text-slate-800 dark:text-white">{statistik.totalAplikasi}</p>
                        </div>
                    </div>
                </div>

                {/* Bottom Section - Recent Users */}
                <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 lg:p-8 border border-slate-100 dark:border-slate-700/50 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Pengguna Terdaftar Terbaru</h3>
                        <Link href={route('superadmin.pengguna.indeks')} className="text-sm font-bold text-[#0F91FC] hover:text-[#0a78d6] flex items-center gap-1 group">
                            Lihat Semua
                            <span className="material-symbols-rounded text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </Link>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-xl font-bold">Nama Lengkap</th>
                                    <th className="px-4 py-3 font-bold">Email</th>
                                    <th className="px-4 py-3 font-bold">Waktu Pendaftaran</th>
                                </tr>
                            </thead>
                            <tbody>
                                {penggunaTerbaru && penggunaTerbaru.length > 0 ? (
                                    penggunaTerbaru.map((pengguna, index) => (
                                        <tr key={index} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-4 py-4 font-semibold text-slate-800 dark:text-slate-200">
                                                {pengguna.nama_lengkap}
                                            </td>
                                            <td className="px-4 py-4 text-slate-500 dark:text-slate-400">
                                                {pengguna.email}
                                            </td>
                                            <td className="px-4 py-4 text-slate-500 dark:text-slate-400">
                                                {new Date(pengguna.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="text-center py-8 text-slate-400">Belum ada data pengguna.</td>
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


Beranda.layout = page => <TataLetakUtama children={page} title="Beranda Superadmin" />;
