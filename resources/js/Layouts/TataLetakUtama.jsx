import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import ThemeToggle from '@/Components/ThemeToggle';
import Swal from 'sweetalert2';

export default function TataLetakUtama({ children, title }) {
    const { url, props } = usePage();
    const { auth, settings } = props;
    const [sidebarBuka, setSidebarBuka] = useState(false);
    const [logoGagal, setLogoGagal] = useState(false);
    const [sidebarMengecil, setSidebarMengecil] = useState(() => {
        try {
            return localStorage.getItem('sso_sidebar_collapsed') === '1';
        } catch {
            return false;
        }
    });

    const toggleSidebarMengecil = () => {
        setSidebarMengecil((prev) => {
            const next = !prev;
            try {
                localStorage.setItem('sso_sidebar_collapsed', next ? '1' : '0');
            } catch {
                /* ignore */
            }
            return next;
        });
    };

    const [bannerLokasiBuka, setBannerLokasiBuka] = useState(false);
    const [statusGPS, setStatusGPS] = useState('pending'); // 'pending', 'granted', 'denied'
    const [sedangMintaGPS, setSedangMintaGPS] = useState(false);

    // Minta & simpan posisi GPS (Latitude & Longitude) pengguna saat memasuki portal
    const mintaIzinGPS = (isUserClick = false) => {
        if (isUserClick) {
            setSedangMintaGPS(true);
        }

        const simpanDanNotif = (lat, lng) => {
            sessionStorage.setItem('sso_user_lat', String(lat));
            sessionStorage.setItem('sso_user_lng', String(lng));
            localStorage.setItem('sso_user_lat', String(lat));
            localStorage.setItem('sso_user_lng', String(lng));
            document.cookie = `sso_user_lat=${lat}; path=/; max-age=86400; SameSite=Lax`;
            document.cookie = `sso_user_lng=${lng}; path=/; max-age=86400; SameSite=Lax`;
            if (window.axios) {
                window.axios.defaults.headers.common['X-GPS-Latitude'] = String(lat);
                window.axios.defaults.headers.common['X-GPS-Longitude'] = String(lng);
            }
            setStatusGPS('granted');
            setBannerLokasiBuka(false);
            setSedangMintaGPS(false);

            if (isUserClick) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'success',
                    title: '📍 Akses Lokasi Berhasil Dikonfirmasi!',
                    text: `Koordinat GPS (${lat.toFixed(4)}, ${lng.toFixed(4)}) berhasil tersimpan.`,
                    showConfirmButton: false,
                    timer: 3500,
                    timerProgressBar: true,
                });
            }
        };

        if ('geolocation' in navigator) {
            // Pertama: Coba mode cepat (enableHighAccuracy: false) agar langsung dapat via seluler/wifi (< 300ms)
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    simpanDanNotif(pos.coords.latitude, pos.coords.longitude);

                    // Pembaruan presisi tinggi di latar belakang jika GPS satelit aktif
                    navigator.geolocation.getCurrentPosition(
                        (posHigh) => {
                            sessionStorage.setItem('sso_user_lat', String(posHigh.coords.latitude));
                            sessionStorage.setItem('sso_user_lng', String(posHigh.coords.longitude));
                        },
                        () => {},
                        { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
                    );
                },
                (err) => {
                    // Fallback kedua: coba mode presisi jika mode cepat pertama memicu dialog izin
                    navigator.geolocation.getCurrentPosition(
                        (pos2) => {
                            simpanDanNotif(pos2.coords.latitude, pos2.coords.longitude);
                        },
                        (err2) => {
                            console.warn('Pelacakan posisi GPS tidak diizinkan atau gagal:', err2.message);
                            setStatusGPS('denied');
                            setSedangMintaGPS(false);

                            if (isUserClick) {
                                Swal.fire({
                                    title: '📍 Panduan Mengaktifkan Izin Lokasi',
                                    html: `
                                        <div class="text-left text-xs space-y-3 pt-2 text-slate-600 dark:text-slate-300">
                                            <p class="font-bold text-slate-800 dark:text-white">Akses lokasi diblokir oleh browser. Untuk mencatat GPS di Audit Trail SSO, ikuti langkah ini:</p>
                                            <div class="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800/60 space-y-1.5">
                                                <span class="font-extrabold text-blue-900 dark:text-blue-200 block">📱 HP Android / iOS (Chrome / Safari):</span>
                                                <ol class="list-decimal list-inside space-y-1 pl-1">
                                                    <li>Klik ikon <b>Gembok / Izin (🔒 atau ⚙️)</b> di samping URL browser.</li>
                                                    <li>Pilih <b>Izin Situs / Permissions</b> ➔ <b>Lokasi / Location</b> ➔ Ubah ke <b>Izinkan / Allow</b>.</li>
                                                    <li>Pastikan GPS/Layanan Lokasi HP dalam posisi <b>ON</b>.</li>
                                                </ol>
                                            </div>
                                            <div class="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                                                <span class="font-extrabold text-slate-800 dark:text-slate-200 block">💻 Laptop / PC (Chrome, Edge, Firefox):</span>
                                                <ol class="list-decimal list-inside space-y-1 pl-1">
                                                    <li>Klik ikon 🔒 di sebelah kiri URL address bar.</li>
                                                    <li>Aktifkan sakelar <b>Lokasi / Location</b> ➔ Refresh halaman.</li>
                                                </ol>
                                            </div>
                                        </div>
                                    `,
                                    icon: 'info',
                                    confirmButtonText: 'Saya Mengerti & Coba Lagi',
                                    confirmButtonColor: '#0F91FC',
                                    customClass: { popup: 'rounded-3xl max-w-lg', confirmButton: 'rounded-xl font-bold px-5 py-2.5' }
                                }).then(() => {
                                    mintaIzinGPS(true);
                                });
                            }
                        },
                        { enableHighAccuracy: true, timeout: 3500, maximumAge: 300000 }
                    );
                },
                { enableHighAccuracy: false, timeout: 3500, maximumAge: 300000 }
            );
        } else {
            setStatusGPS('denied');
            setSedangMintaGPS(false);
            if (isUserClick) {
                Swal.fire({
                    title: 'Tidak Didukung',
                    text: 'Browser Anda tidak mendukung fitur Geolocation GPS.',
                    icon: 'error',
                    confirmButtonColor: '#0F91FC',
                    customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5' }
                });
            }
        }
    };

    useEffect(() => {
        const hasLat = sessionStorage.getItem('sso_user_lat');
        const isDismissed = localStorage.getItem('sso_gps_prompt_dismissed');

        if (hasLat) {
            setStatusGPS('granted');
        } else {
            mintaIzinGPS(false);
            if (!isDismissed) {
                // Tampilkan banner edukasi akses lokasi jika belum diizinkan
                const timer = setTimeout(() => {
                    if (!sessionStorage.getItem('sso_user_lat')) {
                        setBannerLokasiBuka(true);
                    }
                }, 1500);
                return () => clearTimeout(timer);
            }
        }
    }, []);

    const roles = auth.user?.peran || [];
    const isSuperadmin = roles.includes('Super Admin') || roles.includes('superadmin');
    const isAdmin = roles.includes('Admin') || roles.includes('admin');

    // Tentukan role utama untuk ditampilkan di badge header
    const roleUtama = isSuperadmin ? 'Superadmin' : isAdmin ? 'Admin' : roles[0] || 'Pengguna';

    // Susun menuGroups secara dinamis berdasarkan peran
    let menuGroups = [];

    const biodataBelumLengkap = Boolean(auth.user?.biodata_belum_lengkap);

    if (isSuperadmin) {
        menuGroups = [
            {
                kategori: 'Utama',
                items: [
                    { nama: 'Beranda Sistem', rute: route('superadmin.beranda'), ikon: 'dashboard', aktif: url.startsWith('/superadmin/beranda') },
                    { nama: 'Profil Saya', rute: route('profil.indeks'), ikon: 'person', aktif: url.startsWith('/profil-saya') },
                    { nama: 'Keamanan Akun', rute: route('keamanan.indeks'), ikon: 'security', aktif: url.startsWith('/keamanan-akun') },
                ]
            },
            {
                kategori: 'Manajemen Akademik',
                items: [
                    { nama: 'Tahun Pelajaran', rute: route('superadmin.tahun-pelajaran.index'), ikon: 'calendar_month', aktif: url.startsWith('/superadmin/tahun-pelajaran') },
                    { nama: 'Manajemen Kelas', rute: route('superadmin.kelas.index'), ikon: 'meeting_room', aktif: url.startsWith('/superadmin/kelas') },
                ]
            },
            {
                kategori: 'Pengguna & Akses',
                items: [
                    { nama: 'Manajemen Pengguna', rute: route('superadmin.pengguna.indeks'), ikon: 'group', aktif: url.startsWith('/superadmin/manajemen-pengguna') },
                    { nama: 'Peran & Akses', rute: route('superadmin.peran.indeks'), ikon: 'admin_panel_settings', aktif: url.startsWith('/superadmin/manajemen-peran') },
                    { nama: 'Persetujuan Data', rute: route('superadmin.persetujuan.indeks'), ikon: 'fact_check', aktif: url.startsWith('/superadmin/persetujuan-data') },
                ]
            },
            {
                kategori: 'Integrasi & API',
                items: [
                    { nama: 'Aplikasi Portal', rute: route('superadmin.aplikasi.indeks'), ikon: 'apps', aktif: url.startsWith('/superadmin/manajemen-aplikasi') },
                    { nama: 'Kunci API', rute: route('superadmin.kunci-api.indeks'), ikon: 'key', aktif: url.startsWith('/superadmin/kunci-api') },
                    { nama: 'Dokumentasi API', rute: route('superadmin.dokumentasi.indeks'), ikon: 'api', aktif: url.startsWith('/superadmin/dokumentasi-api') },
                ]
            },
            {
                kategori: 'Pengaturan Sistem (Superadmin)',
                items: [
                    { nama: 'Pengaturan Sistem', rute: route('superadmin.pengaturan.indeks'), ikon: 'settings', aktif: url.startsWith('/superadmin/pengaturan-sistem') },
                    { nama: 'Pembaruan Sistem', rute: route('superadmin.pembaruan.indeks'), ikon: 'system_update', aktif: url.startsWith('/superadmin/pembaruan-sistem') },
                    { nama: 'Log Aktivitas', rute: route('superadmin.log.indeks'), ikon: 'history', aktif: url.startsWith('/superadmin/log-aktivitas') },
                    { nama: 'Backup & Restore', rute: route('superadmin.backup-restore.indeks'), ikon: 'cloud_sync', aktif: url.startsWith('/superadmin/backup-restore') },
                    { nama: 'Hapus Data', rute: route('superadmin.hapus-data.indeks'), ikon: 'delete_sweep', aktif: url.startsWith('/superadmin/hapus-data') },
                ]
            }
        ];
    } else if (isAdmin) {
        menuGroups = [
            {
                kategori: 'Utama',
                items: [
                    { nama: 'Beranda Admin', rute: route('admin.beranda'), ikon: 'dashboard', aktif: url.startsWith('/admin/beranda') },
                    { nama: 'Profil Saya', rute: route('profil.indeks'), ikon: 'person', aktif: url.startsWith('/profil-saya') },
                    { nama: 'Keamanan Akun', rute: route('keamanan.indeks'), ikon: 'security', aktif: url.startsWith('/keamanan-akun') },
                ]
            },
            {
                kategori: 'Manajemen Akademik',
                items: [
                    { nama: 'Tahun Pelajaran', rute: route('admin.tahun-pelajaran.index'), ikon: 'calendar_month', aktif: url.startsWith('/admin/tahun-pelajaran') },
                    { nama: 'Manajemen Kelas', rute: route('admin.kelas.index'), ikon: 'meeting_room', aktif: url.startsWith('/admin/kelas') },
                ]
            },
            {
                kategori: 'Pengguna & Akses',
                items: [
                    { nama: 'Manajemen Pengguna', rute: route('admin.pengguna.indeks'), ikon: 'group', aktif: url.startsWith('/admin/manajemen-pengguna') },
                    { nama: 'Persetujuan Data', rute: route('admin.persetujuan.indeks'), ikon: 'fact_check', aktif: url.startsWith('/admin/persetujuan-data') },
                ]
            },
            {
                kategori: 'Portal & Audit',
                items: [
                    { nama: 'Aplikasi Portal', rute: route('admin.aplikasi.indeks'), ikon: 'apps', aktif: url.startsWith('/admin/manajemen-aplikasi') },
                    { nama: 'Log Aktivitas', rute: route('admin.log.indeks'), ikon: 'history', aktif: url.startsWith('/admin/log-aktivitas') },
                    { nama: 'Hapus Data', rute: route('admin.hapus-data.indeks'), ikon: 'delete_sweep', aktif: url.startsWith('/admin/hapus-data') },
                ]
            }
        ];
    } else {
        // Pengguna Umum (Siswa, Guru, dll)
        menuGroups = [
            {
                kategori: 'Utama',
                items: [
                    { nama: 'Lengkapi Biodata', rute: route('biodata.wajib'), ikon: 'badge', aktif: url.startsWith('/biodata-wajib'), dikunci: false },
                    { nama: 'Katalog Aplikasi', rute: route('dasbor'), ikon: 'grid_view', aktif: url === '/dasbor', dikunci: biodataBelumLengkap },
                    { nama: 'Profil Saya', rute: route('profil.indeks'), ikon: 'person', aktif: url.startsWith('/profil-saya'), dikunci: biodataBelumLengkap },
                    { nama: 'Keamanan Akun', rute: route('keamanan.indeks'), ikon: 'security', aktif: url.startsWith('/keamanan-akun'), dikunci: biodataBelumLengkap },
                ]
            }
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
                fixed lg:sticky top-0 left-0 z-40 h-screen flex flex-col shrink-0
                bg-[#0F91FC] text-white border-r border-white/10
                shadow-xl shadow-slate-200/50 dark:shadow-none
                transition-all duration-300 ease-in-out
                ${sidebarBuka ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                w-64 ${sidebarMengecil ? 'lg:w-20' : 'lg:w-64'}
            `}>
                {/* Tombol perkecil/perbesar sidebar (desktop) */}
                <button
                    type="button"
                    onClick={toggleSidebarMengecil}
                    aria-label="Perkecil/perbesar sidebar"
                    className="hidden lg:flex absolute top-6 -right-3 w-7 h-7 rounded-full bg-white text-[#0F91FC] shadow-md border border-slate-200 items-center justify-center hover:bg-blue-50 transition-transform duration-300 z-10"
                >
                    <span className={`material-symbols-rounded text-base transition-transform duration-300 ${sidebarMengecil ? 'rotate-180' : ''}`}>
                        chevron_left
                    </span>
                </button>

                <div className={`flex items-center h-20 border-b border-white/15 ${sidebarMengecil ? 'lg:justify-center lg:px-0 px-6 justify-between' : 'justify-between px-6'}`}>
                    <div className="flex items-center gap-3 min-w-0">
                        {settings?.logo_primer_url && !logoGagal ? (
                            <img
                                src={settings.logo_primer_url}
                                alt={settings.nama_aplikasi || 'Logo'}
                                className="w-9 h-9 rounded-xl object-contain shadow-md shrink-0 bg-white/10"
                                onError={() => setLogoGagal(true)}
                            />
                        ) : (
                            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white shrink-0">
                                <span className="material-symbols-rounded text-lg">vpn_key</span>
                            </div>
                        )}
                        <span className={`font-extrabold text-lg tracking-tight text-white truncate ${sidebarMengecil ? 'lg:hidden' : ''}`}>
                            {settings?.nama_aplikasi || 'SingleSignOn'}
                        </span>
                    </div>
                    <button onClick={() => setSidebarBuka(false)} className={`lg:hidden text-white/70 hover:text-white ${sidebarMengecil ? 'lg:hidden' : ''}`}>
                        <span className="material-symbols-rounded">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto py-4 px-4 space-y-4 scrollbar-minimalis">
                    {biodataBelumLengkap && (
                        <div className={`mx-1 mb-2 p-3 bg-white/10 border border-white/15 rounded-2xl text-xs text-white space-y-1 ${sidebarMengecil ? 'lg:hidden' : ''}`}>
                            <div className="flex items-center gap-1.5 font-bold">
                                <span className="material-symbols-rounded text-base text-amber-300">lock</span>
                                Menu Dikunci
                            </div>
                            <p className="text-[11px] leading-relaxed opacity-90">
                                Harap lengkapi seluruh biodata wajib untuk membuka akses ke semua menu.
                            </p>
                        </div>
                    )}

                    {menuGroups.map((group, groupIdx) => (
                        <div key={groupIdx} className="space-y-1">
                            <div className={`flex items-center gap-2 px-3 pt-2 pb-1 ${sidebarMengecil ? 'lg:hidden' : ''}`}>
                                <span className="text-[10px] font-extrabold text-white/50 uppercase tracking-widest whitespace-nowrap">
                                    {group.kategori}
                                </span>
                                <div className="h-[1px] w-full bg-white/15"></div>
                            </div>

                            {group.items.map((item, index) => {
                                if (item.dikunci) {
                                    return (
                                        <div
                                            key={index}
                                            title={sidebarMengecil ? item.nama : 'Fitur dikunci sampai Anda melengkapi biodata wajib'}
                                            className={`flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold text-sm text-white/40 bg-white/5 cursor-not-allowed select-none opacity-60 ${sidebarMengecil ? 'lg:justify-center lg:px-0' : ''}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="material-symbols-rounded text-xl">
                                                    {item.ikon}
                                                </span>
                                                <span className={sidebarMengecil ? 'lg:hidden' : ''}>{item.nama}</span>
                                            </div>
                                            <span className={`material-symbols-rounded text-base text-amber-300 ${sidebarMengecil ? 'lg:hidden' : ''}`}>lock</span>
                                        </div>
                                    );
                                }

                                const Tag = item.eksternal ? 'a' : Link;
                                const extraProps = item.eksternal
                                    ? { target: '_blank', rel: 'noopener noreferrer' }
                                    : { prefetch: 'hover' };
                                return (
                                    <Tag
                                        key={index}
                                        href={item.rute}
                                        title={sidebarMengecil ? item.nama : undefined}
                                        {...extraProps}
                                        className={`
                                            flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 font-semibold text-sm
                                            ${sidebarMengecil ? 'lg:justify-center lg:px-0' : ''}
                                            ${item.aktif
                                                ? 'bg-white/15 text-white shadow-sm'
                                                : 'text-white/75 hover:bg-white/10 hover:text-white'
                                            }
                                        `}
                                    >
                                        <span className="material-symbols-rounded text-xl transition-transform duration-300 group-hover:scale-110 shrink-0">
                                            {item.ikon}
                                        </span>
                                        <span className={sidebarMengecil ? 'lg:hidden' : ''}>{item.nama}</span>
                                    </Tag>
                                );
                            })}
                        </div>
                    ))}
                </div>

                <div className="p-4 border-t border-white/15">
                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        title="Keluar"
                        className={`flex items-center gap-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors text-sm ${sidebarMengecil ? 'lg:justify-center lg:px-0 lg:w-11 lg:h-11 w-full px-4 py-3' : 'w-full px-4 py-3'}`}
                    >
                        <span className="material-symbols-rounded text-xl shrink-0">logout</span>
                        <span className={sidebarMengecil ? 'lg:hidden' : ''}>Keluar</span>
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
                            <img 
                                src={auth.user?.avatar_url || 'https://www.gravatar.com/avatar/?s=256&d=identicon'} 
                                alt={auth.user?.nama_lengkap} 
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = 'https://www.gravatar.com/avatar/?s=256&d=identicon';
                                }}
                                className="w-8 h-8 rounded-full object-cover shadow-sm border border-white dark:border-slate-700 bg-slate-200 dark:bg-slate-700"
                            />
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 pr-2 hidden sm:block capitalize">{roleUtama}</span>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="p-6 lg:p-8 flex-1 overflow-x-hidden">
                    {children}
                </div>

                {/* Banner Floating Notifikasi Izin Akses Lokasi (GPS) */}
                {bannerLokasiBuka && (
                    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full p-4 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl border border-blue-200/80 dark:border-blue-800/80 shadow-2xl rounded-3xl space-y-3 transition-all">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[#0F91FC] flex items-center justify-center shrink-0">
                                    <span className="material-symbols-rounded text-2xl text-red-500">location_on</span>
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-1.5">
                                        Izin Akses Lokasi (GPS)
                                    </h4>
                                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider block">Keamanan & Audit Trail</span>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setBannerLokasiBuka(false);
                                    localStorage.setItem('sso_gps_prompt_dismissed', 'true');
                                }}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                            >
                                <span className="material-symbols-rounded text-lg">close</span>
                            </button>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-300 leading-relaxed">
                            Portal SSO membutuhkan akses lokasi perangkat Anda untuk memverifikasi keamanan aktivitas login dan pencatatan audit trail lokasi secara presisi.
                        </p>

                        <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                                onClick={() => {
                                    setBannerLokasiBuka(false);
                                    localStorage.setItem('sso_gps_prompt_dismissed', 'true');
                                }}
                                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
                            >
                                Nanti Saja
                            </button>
                            <button
                                onClick={() => mintaIzinGPS(true)}
                                disabled={sedangMintaGPS}
                                className="px-4 py-2 rounded-xl bg-[#0F91FC] hover:bg-[#0a78d6] text-white text-xs font-bold shadow-md shadow-[#0F91FC]/20 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {sedangMintaGPS ? (
                                    <>
                                        <span className="material-symbols-rounded text-sm animate-spin">progress_activity</span>
                                        Meminta Lokasi...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-rounded text-sm">my_location</span>
                                        Izinkan Lokasi
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
