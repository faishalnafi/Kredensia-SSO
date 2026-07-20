import React, { useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import ThemeToggle from '@/Components/ThemeToggle';

export default function TataLetakUtama({ children, title }) {
    const { url, props } = usePage();
    const { auth, settings } = props;
    const [sidebarBuka, setSidebarBuka] = useState(false);
    const [logoGagal, setLogoGagal] = useState(false);

    const roles = auth.user?.peran || [];
    const isSuperadmin = roles.includes('Super Admin') || roles.includes('superadmin');
    const isAdmin = roles.includes('Admin') || roles.includes('admin');

    // Tentukan role utama untuk ditampilkan di badge header
    const roleUtama = isSuperadmin ? 'Superadmin' : isAdmin ? 'Admin' : roles[0] || 'Pengguna';

    // Susun menuItems secara dinamis berdasarkan peran
    let menuItems = [];

    if (isSuperadmin) {
        menuItems = [
            { nama: 'Beranda Sistem', rute: route('superadmin.beranda'), ikon: 'dashboard', aktif: url.startsWith('/superadmin/beranda') },
            { nama: 'Aplikasi Portal', rute: route('superadmin.aplikasi.indeks'), ikon: 'apps', aktif: url.startsWith('/superadmin/manajemen-aplikasi') },
            { nama: 'Peran & Akses', rute: route('superadmin.peran.indeks'), ikon: 'admin_panel_settings', aktif: url.startsWith('/superadmin/manajemen-peran') },
            { nama: 'Manajemen Pengguna', rute: route('superadmin.pengguna.indeks'), ikon: 'group', aktif: url.startsWith('/superadmin/manajemen-pengguna') },
            { nama: 'Pengaturan Sistem', rute: route('superadmin.pengaturan.indeks'), ikon: 'settings', aktif: url.startsWith('/superadmin/pengaturan-sistem') },
            { nama: 'Persetujuan Data', rute: route('superadmin.persetujuan.indeks'), ikon: 'fact_check', aktif: url.startsWith('/superadmin/persetujuan-data') },
            { nama: 'Log Aktivitas', rute: route('superadmin.log.indeks'), ikon: 'history', aktif: url.startsWith('/superadmin/log-aktivitas') },
            { nama: 'Kunci API', rute: route('superadmin.kunci-api.indeks'), ikon: 'key', aktif: url.startsWith('/superadmin/kunci-api') },
            { nama: 'Tahun Pelajaran', rute: route('superadmin.tahun-pelajaran.index'), ikon: 'calendar_month', aktif: url.startsWith('/superadmin/tahun-pelajaran') },
            { nama: 'Manajemen Kelas', rute: route('superadmin.kelas.index'), ikon: 'meeting_room', aktif: url.startsWith('/superadmin/kelas') },
            { nama: 'Dokumentasi API', rute: route('superadmin.dokumentasi.indeks'), ikon: 'api', aktif: url.startsWith('/superadmin/dokumentasi-api') },
            { nama: 'Backup & Restore', rute: route('superadmin.backup-restore.indeks'), ikon: 'cloud_sync', aktif: url.startsWith('/superadmin/backup-restore') },
            { nama: 'Hapus Data', rute: route('superadmin.hapus-data.indeks'), ikon: 'delete_sweep', aktif: url.startsWith('/superadmin/hapus-data') },
            { nama: 'Profil Saya', rute: route('profil.indeks'), ikon: 'person', aktif: url.startsWith('/profil-saya') },
            { nama: 'Keamanan Akun', rute: route('keamanan.indeks'), ikon: 'security', aktif: url.startsWith('/keamanan-akun') },
        ];
    } else if (isAdmin) {
        menuItems = [
            { nama: 'Beranda Admin', rute: route('admin.beranda'), ikon: 'dashboard', aktif: url.startsWith('/admin/beranda') },
            { nama: 'Aplikasi Portal', rute: route('admin.aplikasi.indeks'), ikon: 'apps', aktif: url.startsWith('/admin/manajemen-aplikasi') },
            { nama: 'Manajemen Pengguna', rute: route('admin.pengguna.indeks'), ikon: 'group', aktif: url.startsWith('/admin/manajemen-pengguna') },
            { nama: 'Persetujuan Data', rute: route('admin.persetujuan.indeks'), ikon: 'fact_check', aktif: url.startsWith('/admin/persetujuan-data') },
            { nama: 'Log Aktivitas', rute: route('admin.log.indeks'), ikon: 'history', aktif: url.startsWith('/admin/log-aktivitas') },
            { nama: 'Tahun Pelajaran', rute: route('admin.tahun-pelajaran.index'), ikon: 'calendar_month', aktif: url.startsWith('/admin/tahun-pelajaran') },
            { nama: 'Manajemen Kelas', rute: route('admin.kelas.index'), ikon: 'meeting_room', aktif: url.startsWith('/admin/kelas') },
            { nama: 'Hapus Data', rute: route('admin.hapus-data.indeks'), ikon: 'delete_sweep', aktif: url.startsWith('/admin/hapus-data') },
            { nama: 'Profil Saya', rute: route('profil.indeks'), ikon: 'person', aktif: url.startsWith('/profil-saya') },
            { nama: 'Keamanan Akun', rute: route('keamanan.indeks'), ikon: 'security', aktif: url.startsWith('/keamanan-akun') },
        ];
    } else {
        // Pengguna Umum (Siswa, Guru, dll)
        menuItems = [
            { nama: 'Katalog Aplikasi', rute: route('dasbor'), ikon: 'grid_view', aktif: url === '/dasbor' },
            { nama: 'Profil Saya', rute: route('profil.indeks'), ikon: 'person', aktif: url.startsWith('/profil-saya') },
            { nama: 'Keamanan Akun', rute: route('keamanan.indeks'), ikon: 'security', aktif: url.startsWith('/keamanan-akun') },
        ];
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex text-slate-800 dark:text-slate-100 font-sans transition-colors duration-300">
            {/* Ornamen Background Glassmorphism */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-[#0F91FC]/10 dark:bg-[#0F91FC]/20 blur-[100px]"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] rounded-full bg-emerald-500/10 dark:bg-emerald-500/10 blur-[100px]"></div>
            </div>

            {/* Overlay Mobile */}
            {sidebarBuka && (
                <div 
                    className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden"
                    onClick={() => setSidebarBuka(false)}
                ></div>
            )}

            {/* Sidebar */}
            <aside className={`
                fixed lg:sticky top-0 left-0 z-40 h-screen w-64 flex flex-col 
                bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-slate-800/50
                shadow-xl shadow-slate-200/50 dark:shadow-none
                transition-transform duration-300 ease-in-out
                ${sidebarBuka ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                <div className="flex items-center justify-between h-20 px-6 border-b border-slate-200/50 dark:border-slate-800/50">
                    <div className="flex items-center gap-3">
                        {settings?.logo_primer_url && !logoGagal ? (
                            <img 
                                src={settings.logo_primer_url} 
                                alt={settings.nama_aplikasi || 'Logo'} 
                                className="w-8 h-8 rounded-xl object-contain shadow-md"
                                onError={() => setLogoGagal(true)}
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0F91FC] to-[#0a78d6] flex items-center justify-center text-white font-bold shadow-lg shadow-[#0F91FC]/30">
                                <span className="material-symbols-rounded text-lg">vpn_key</span>
                            </div>
                        )}
                        <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#081242] to-[#0F91FC] dark:from-white dark:to-slate-300">
                            {settings?.nama_aplikasi || 'SingleSignOn'}
                        </span>
                    </div>
                    <button onClick={() => setSidebarBuka(false)} className="lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <span className="material-symbols-rounded">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
                    <p className="px-3 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                        Menu Portal
                    </p>
                    {menuItems.map((item, index) => {
                        const Tag = item.eksternal ? 'a' : Link;
                        const extraProps = item.eksternal 
                            ? { target: '_blank', rel: 'noopener noreferrer' } 
                            : { prefetch: 'hover' };
                        return (
                            <Tag 
                                key={index}
                                href={item.rute}
                                {...extraProps}
                                className={`
                                    flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 font-semibold text-sm
                                    ${item.aktif 
                                        ? 'bg-[#0F91FC]/10 dark:bg-[#0F91FC]/20 text-[#0F91FC] dark:text-[#ff6b39] shadow-sm' 
                                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                                    }
                                `}
                            >
                                <span className="material-symbols-rounded text-xl transition-transform duration-300 group-hover:scale-110">
                                    {item.ikon}
                                </span>
                                {item.nama}
                            </Tag>
                        );
                    })}
                </div>

                <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50">
                    <Link 
                        href={route('logout')} 
                        method="post" 
                        as="button"
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 font-bold hover:bg-red-100 dark:hover:bg-red-500/20 transition-colors text-sm"
                    >
                        <span className="material-symbols-rounded text-xl">logout</span>
                        Keluar
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col min-h-screen relative z-10 w-full">
                {/* Header */}
                <header className="h-20 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between px-6 sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setSidebarBuka(true)} 
                            className="lg:hidden text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white"
                        >
                            <span className="material-symbols-rounded text-2xl">menu</span>
                        </button>
                        <h1 className="text-xl font-extrabold text-[#081242] dark:text-white tracking-tight">
                            {title}
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full">
                            {auth.user?.avatar_url ? (
                                <img 
                                    src={auth.user.avatar_url} 
                                    alt={auth.user.nama_lengkap} 
                                    className="w-8 h-8 rounded-full object-cover shadow-sm border border-white dark:border-slate-700"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-md">
                                    <span className="material-symbols-rounded text-sm">shield_person</span>
                                </div>
                            )}
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 pr-2 hidden sm:block capitalize">{roleUtama}</span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-6 lg:p-8 flex-1 overflow-x-hidden">
                    {children}
                </div>
            </main>
        </div>
    );
}
