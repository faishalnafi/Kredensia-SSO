import React, { useState, useEffect } from 'react';
import { Link, usePage } from '@inertiajs/react';
import ThemeToggle from '@/Components/ThemeToggle';
import Swal from 'sweetalert2';

export default function TataLetakUtama({ children, title }) {
    const { url, props } = usePage();
    const { auth, settings } = props;
    const [sidebarBuka, setSidebarBuka] = useState(false);
    const [logoGagal, setLogoGagal] = useState(false);
    const [floatingTooltip, setFloatingTooltip] = useState({ show: false, text: '', top: 0 });
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
        const itemsPengguna = [];
        if (biodataBelumLengkap) {
            itemsPengguna.push({
                nama: 'Lengkapi Biodata',
                rute: route('biodata.wajib'),
                ikon: 'badge',
                aktif: url.startsWith('/biodata-wajib'),
                dikunci: false
            });
        }
        itemsPengguna.push(
            { nama: 'Katalog Aplikasi', rute: route('dasbor'), ikon: 'grid_view', aktif: url === '/dasbor', dikunci: biodataBelumLengkap },
            { nama: 'Temukan', rute: route('temukan.indeks'), ikon: 'explore', aktif: url.startsWith('/temukan'), dikunci: biodataBelumLengkap },
            { nama: 'Komunitas', rute: route('komunitas.indeks'), ikon: 'groups', aktif: url.startsWith('/komunitas'), dikunci: biodataBelumLengkap },
            { nama: 'Profil Saya', rute: route('profil.indeks'), ikon: 'person', aktif: url.startsWith('/profil-saya'), dikunci: biodataBelumLengkap },
            { nama: 'Keamanan Akun', rute: route('keamanan.indeks'), ikon: 'security', aktif: url.startsWith('/keamanan-akun'), dikunci: biodataBelumLengkap },
        );

        menuGroups = [
            {
                kategori: 'Utama',
                items: itemsPengguna
            }
        ];
    }

    return (
        <div className="h-screen bg-[#0F91FC] text-white flex flex-col font-sans overflow-hidden transition-colors duration-300">
            {/* Top Unified Header */}
            <header className="h-16 bg-[#0F91FC] text-white flex items-center justify-between px-4 lg:px-6 shrink-0 z-40">
                <div className="flex items-center gap-3">
                    {/* Tombol Hamburger / Collapse */}
                    <button
                        type="button"
                        onClick={() => {
                            if (window.innerWidth >= 1024) {
                                toggleSidebarMengecil();
                            } else {
                                setSidebarBuka((prev) => !prev);
                            }
                        }}
                        aria-label="Menu navigasi"
                        className="w-10 h-10 rounded-full hover:bg-white/15 active:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
                    >
                        <span className="material-symbols-rounded text-2xl">menu</span>
                    </button>

                    {/* Logo & Nama Aplikasi */}
                    <Link href={route('dasbor')} className="flex items-center gap-2.5 group">
                        {settings?.logo_primer_url && !logoGagal ? (
                            <img
                                src={settings.logo_primer_url}
                                alt={settings.nama_aplikasi || 'Logo'}
                                className="w-8 h-8 rounded-xl object-contain bg-white/15 p-0.5 shadow-sm shrink-0"
                                onError={() => setLogoGagal(true)}
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold shrink-0">
                                <span className="material-symbols-rounded text-lg">vpn_key</span>
                            </div>
                        )}
                        <span className="font-extrabold text-base lg:text-lg tracking-tight text-white group-hover:opacity-90 transition-opacity">
                            {settings?.nama_aplikasi || 'SingleSignOn'}
                        </span>
                    </Link>
                </div>

                {/* Kanan Header: ThemeToggle & User Profile */}
                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <div className="flex items-center gap-2.5 pl-2 pr-3 py-1 bg-white/15 hover:bg-white/20 transition-colors rounded-full border border-white/20">
                        <img 
                            src={auth.user?.avatar_url || 'https://www.gravatar.com/avatar/?s=256&d=identicon'} 
                            alt={auth.user?.nama_lengkap} 
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = 'https://www.gravatar.com/avatar/?s=256&d=identicon';
                            }}
                            className="w-7 h-7 rounded-full object-cover shadow-sm border border-white/40 bg-white/20"
                        />
                        <span className="text-xs font-bold text-white hidden md:block capitalize">{roleUtama}</span>
                    </div>
                </div>
            </header>

            {/* Layout Body: Sidebar + Main Content */}
            <div className="flex-1 flex relative overflow-hidden bg-[#0F91FC]">
                {/* Overlay Mobile */}
                {sidebarBuka && (
                    <div 
                        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
                        onClick={() => setSidebarBuka(false)}
                    ></div>
                )}

                {/* Sidebar Navigasi (Full height dari paling atas di mode mobile, h-full di bawah header di mode desktop) */}
                <aside className={`
                    fixed lg:static top-0 left-0 z-50 lg:z-10 h-screen lg:h-full flex flex-col shrink-0
                    bg-[#0F91FC] text-white shadow-2xl lg:shadow-none
                    rounded-r-[28px] lg:rounded-none
                    transition-all duration-300 ease-in-out
                    ${sidebarBuka ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                    w-64 ${sidebarMengecil ? 'lg:w-[5.75rem]' : 'lg:w-[13.5rem]'}
                `}>
                    {/* Header khusus Mobile Drawer (di paling atas drawer) */}
                    <div className="h-16 flex items-center justify-between px-4 border-b border-white/15 shrink-0 lg:hidden">
                        <div className="flex items-center gap-2.5">
                            {settings?.logo_primer_url && !logoGagal ? (
                                <img
                                    src={settings.logo_primer_url}
                                    alt={settings.nama_aplikasi || 'Logo'}
                                    className="w-8 h-8 rounded-xl object-contain bg-white/15 p-0.5 shadow-sm shrink-0"
                                    onError={() => setLogoGagal(true)}
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white font-bold shrink-0">
                                    <span className="material-symbols-rounded text-lg">vpn_key</span>
                                </div>
                            )}
                            <span className="font-extrabold text-base tracking-tight text-white">
                                {settings?.nama_aplikasi || 'SingleSignOn'}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setSidebarBuka(false)}
                            className="w-9 h-9 rounded-full hover:bg-white/15 active:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
                            aria-label="Tutup menu navigasi"
                        >
                            <span className="material-symbols-rounded text-2xl">close</span>
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-4 scrollbar-minimalis">
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
                                                onMouseEnter={(e) => {
                                                    if (!sidebarMengecil) return;
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    setFloatingTooltip({
                                                        show: true,
                                                        text: item.nama,
                                                        top: rect.top + rect.height / 2,
                                                        left: rect.right + 12
                                                    });
                                                }}
                                                onMouseLeave={() => setFloatingTooltip({ show: false, text: '', top: 0, left: 0 })}
                                                className={`flex transition-all duration-300 font-semibold text-sm text-white/40 bg-white/5 cursor-not-allowed select-none opacity-60 rounded-xl
                                                    ${sidebarMengecil
                                                        ? 'lg:flex-col lg:items-center lg:justify-center lg:px-1.5 lg:py-2.5 lg:gap-1 lg:rounded-2xl flex items-center gap-3 px-3 py-2.5 justify-between'
                                                        : 'items-center justify-between px-3 py-2.5'
                                                    }`}
                                            >
                                                <div className={`flex w-full ${sidebarMengecil ? 'lg:flex-col lg:items-center lg:gap-1 items-center gap-3' : 'items-center gap-3'}`}>
                                                    <span className="material-symbols-rounded text-xl shrink-0">
                                                        {item.ikon}
                                                    </span>
                                                    <span className={sidebarMengecil ? 'lg:text-[10px] lg:text-center lg:leading-tight lg:font-bold lg:text-white/50 lg:w-full lg:px-0.5' : ''}>
                                                        {item.nama}
                                                    </span>
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
                                            onMouseEnter={(e) => {
                                                if (!sidebarMengecil) return;
                                                const rect = e.currentTarget.getBoundingClientRect();
                                                setFloatingTooltip({
                                                    show: true,
                                                    text: item.nama,
                                                    top: rect.top + rect.height / 2,
                                                    left: rect.right + 12
                                                });
                                            }}
                                            onMouseLeave={() => setFloatingTooltip({ show: false, text: '', top: 0, left: 0 })}
                                            {...extraProps}
                                            className={`
                                                flex transition-all duration-300 font-semibold text-sm rounded-xl
                                                ${sidebarMengecil
                                                    ? 'lg:flex-col lg:items-center lg:justify-center lg:px-1.5 lg:py-2.5 lg:gap-1 lg:rounded-2xl flex items-center gap-3 px-3 py-2.5'
                                                    : 'items-center gap-3 px-3 py-2.5'
                                                }
                                                ${item.aktif
                                                    ? 'bg-white/15 text-white shadow-sm'
                                                    : 'text-white/75 hover:bg-white/10 hover:text-white'
                                                }
                                            `}
                                        >
                                            <span className="material-symbols-rounded text-xl transition-transform duration-300 shrink-0">
                                                {item.ikon}
                                            </span>
                                            <span className={sidebarMengecil
                                                ? 'lg:text-[10px] lg:text-center lg:leading-tight lg:font-bold lg:w-full lg:px-0.5'
                                                : ''
                                            }>
                                                {item.nama}
                                            </span>
                                        </Tag>
                                    );
                                })}
                            </div>
                        ))}
                    </div>

                    <div className="p-3 border-t border-white/15">
                        <Link
                            href={route('logout')}
                            method="post"
                            as="button"
                            onMouseEnter={(e) => {
                                if (!sidebarMengecil) return;
                                const rect = e.currentTarget.getBoundingClientRect();
                                setFloatingTooltip({
                                    show: true,
                                    text: 'Keluar',
                                    top: rect.top + rect.height / 2,
                                    left: rect.right + 12
                                });
                            }}
                            onMouseLeave={() => setFloatingTooltip({ show: false, text: '', top: 0, left: 0 })}
                            className={`flex rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors text-sm
                                ${sidebarMengecil
                                    ? 'lg:flex-col lg:items-center lg:justify-center lg:w-full lg:py-2.5 lg:px-1.5 lg:gap-1 lg:rounded-2xl w-full px-4 py-3 items-center gap-3'
                                    : 'w-full px-4 py-3 items-center gap-3'
                                }`}
                        >
                            <span className="material-symbols-rounded text-xl shrink-0">logout</span>
                            <span className={sidebarMengecil
                                ? 'lg:text-[10px] lg:font-bold lg:text-center'
                                : ''
                            }>Keluar</span>
                        </Link>
                    </div>
                </aside>

                {/* Main Content Area (Native rounded-tl curve with independent smooth scroll) */}
                <main className="flex-1 h-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 lg:rounded-tl-[42px] shadow-[-4px_0_20px_rgba(0,0,0,0.06)] flex flex-col relative overflow-y-auto overflow-x-hidden transition-colors duration-300 scrollbar-minimalis">
                    {/* Ornamen Background Glassmorphism di dalam konten */}
                    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-[#0F91FC]/10 dark:bg-[#0F91FC]/20 blur-[100px]"></div>
                        <div className="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] rounded-full bg-emerald-500/10 dark:bg-emerald-500/10 blur-[100px]"></div>
                    </div>

                    {/* Page Content */}
                    <div className="p-6 lg:p-8 flex-1 relative z-10">
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

            {/* Floating Tooltip kustom saat sidebar minimize */}
            {sidebarMengecil && floatingTooltip.show && (
                <div 
                    className="fixed z-[9999] pointer-events-none -translate-y-1/2 flex items-center transition-all duration-150"
                    style={{ left: `${floatingTooltip.left || 100}px`, top: `${floatingTooltip.top}px` }}
                >
                    <div className="relative bg-white dark:bg-slate-800 text-[#081242] dark:text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-2xl border border-slate-200/80 dark:border-slate-700 whitespace-nowrap">
                        {floatingTooltip.text}
                        <span className="absolute right-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-r-white dark:border-r-slate-800"></span>
                    </div>
                </div>
            )}
        </div>
    );
}
