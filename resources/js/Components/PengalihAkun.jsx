import React, { useState, useEffect, useRef } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import Swal from 'sweetalert2';

/**
 * Komponen Pengalih Akun (Google-Style Account Switcher)
 * Mengakomodasi fitur multi-akun, peralihan sesi, penambahan akun baru,
 * dan akses langsung ke menu "Profil Saya" serta "Keamanan Akun".
 */
export default function PengalihAkun({ terbuka, onTutup }) {
    const { auth, settings, akunMultiSesi, batasMultiAkun = 25 } = usePage().props;
    const penggunaAktif = auth.user;
    const dialogRef = useRef(null);
    const [tampilkanMenuKelola, setTampilkanMenuKelola] = useState(false);
    const [daftarAkunTerbuka, setDaftarAkunTerbuka] = useState(true);

    // Kumpulan akun yang tersimpan di perangkat ini (disimpan di LocalStorage)
    const [daftarAkun, setDaftarAkun] = useState(() => {
        try {
            const tersimpan = localStorage.getItem('sso_multi_accounts');
            if (tersimpan) {
                const parsed = JSON.parse(tersimpan);
                // Filter out dummy accounts that were saved in previous versions
                const filtered = parsed.filter(akun => !String(akun.id).startsWith('acc-'));
                return filtered;
            }
        } catch (e) {
            console.warn('Gagal membaca sso_multi_accounts:', e);
        }

        // Mulai dengan array kosong, bukan data dummy
        return [];
    });

    // Sinkronisasi daftar akun perangkat dengan data sesi valid dari server
    useEffect(() => {
        if (!penggunaAktif) return;

        // Sumber kebenaran: akun yang masih tercatat di sesi server browser ini
        const akunServer = Array.isArray(akunMultiSesi) && akunMultiSesi.length > 0
            ? akunMultiSesi
            : [penggunaAktif];
        const emailServer = new Set(akunServer.map((a) => (a.email || '').toLowerCase()));

        setDaftarAkun((akunLama) => {
            // 1. Perbarui status akun lama berdasarkan data server
            let akunBaru = akunLama.map((a) => {
                const email = (a.email || '').toLowerCase();
                const dataServer = akunServer.find((s) => (s.email || '').toLowerCase() === email);
                return dataServer
                    ? {
                          ...a,
                          id: dataServer.id || a.id,
                          nama_lengkap: dataServer.nama_lengkap,
                          avatar_url: dataServer.avatar_url,
                          sesi_aktif: true,
                      }
                    : { ...a, sesi_aktif: emailServer.has(email) };
            });

            // 2. Tambahkan akun server yang belum ada di daftar lokal
            akunServer.forEach((s) => {
                const email = (s.email || '').toLowerCase();
                if (!akunBaru.some((a) => (a.email || '').toLowerCase() === email)) {
                    akunBaru.push({
                        id: s.id,
                        nama_lengkap: s.nama_lengkap,
                        email: s.email,
                        avatar_url: s.avatar_url,
                        sesi_aktif: true,
                        warna: 'bg-[#0F91FC]',
                    });
                }
            });

            try {
                localStorage.setItem('sso_multi_accounts', JSON.stringify(akunBaru));
            } catch (err) {
                /* ignore */
            }
            return akunBaru;
        });
    }, [penggunaAktif, akunMultiSesi]);

    // Listener klik luar & tombol Escape untuk menutup modal
    useEffect(() => {
        const tanganiKlikLuar = (event) => {
            if (dialogRef.current && !dialogRef.current.contains(event.target)) {
                onTutup();
            }
        };

        const tanganiEscape = (event) => {
            if (event.key === 'Escape') {
                onTutup();
            }
        };

        if (terbuka) {
            document.addEventListener('mousedown', tanganiKlikLuar);
            document.addEventListener('keydown', tanganiEscape);
        }

        return () => {
            document.removeEventListener('mousedown', tanganiKlikLuar);
            document.removeEventListener('keydown', tanganiEscape);
        };
    }, [terbuka, onTutup]);

    if (!terbuka) return null;

    // Fungsi penanganan klik akun
    const tanganiPilihAkun = (akun) => {
        const emailAktif = (penggunaAktif?.email || '').toLowerCase();
        const emailPilihan = (akun.email || '').toLowerCase();

        if (emailAktif === emailPilihan) {
            // Klik pada akun yang sedang aktif akan me-minimize / meng-expand daftar akun
            setDaftarAkunTerbuka((prev) => !prev);
            return;
        }

        if (!akun.sesi_aktif) {
            // Sesi berakhir -> arahkan ke halaman masuk dengan email terisi
            Swal.fire({
                title: 'Sesi Telah Berakhir',
                text: `Sesi login untuk ${akun.email} sudah kedaluwarsa. Silakan masukkan kata sandi Anda kembali.`,
                icon: 'info',
                confirmButtonText: 'Masuk Kembali',
                confirmButtonColor: '#0F91FC',
                showCancelButton: true,
                cancelButtonText: 'Batal',
                customClass: {
                    popup: 'rounded-3xl',
                    confirmButton: 'rounded-xl font-bold px-5 py-2.5',
                    cancelButton: 'rounded-xl font-semibold px-4 py-2.5',
                },
            }).then((res) => {
                if (res.isConfirmed) {
                    onTutup();
                    window.location.href = `/otentikasi?tambah_akun=1&email=${encodeURIComponent(akun.email)}#masuk`;
                }
            });
            return;
        }

        // Jika akun di localStorage tertulis aktif, minta backend untuk men-switch sesinya
        Swal.fire({
            title: 'Beralih Akun',
            text: `Beralih ke akun ${akun.nama_lengkap} (${akun.email})?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#0F91FC',
            confirmButtonText: 'Ya, Beralih',
            cancelButtonText: 'Batal',
            customClass: {
                popup: 'rounded-3xl',
                confirmButton: 'rounded-xl font-bold px-5 py-2.5',
                cancelButton: 'rounded-xl font-semibold px-4 py-2.5',
            },
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: 'Beralih...',
                    text: `Menyiapkan sesi untuk ${akun.nama_lengkap}`,
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading(),
                });
                
                router.post(route('account.switch'), { email: akun.email }, {
                    onSuccess: () => {
                        Swal.close();
                        onTutup();
                    },
                    onError: () => {
                        // Jika backend menolak (sesi expire dsb), ubah state localStorage menjadi tidak aktif
                        const akunBaru = daftarAkun.map(a => 
                            a.email === akun.email ? { ...a, sesi_aktif: false } : a
                        );
                        setDaftarAkun(akunBaru);
                        localStorage.setItem('sso_multi_accounts', JSON.stringify(akunBaru));
                        
                        Swal.fire({
                            icon: 'error',
                            title: 'Sesi Kedaluwarsa',
                            text: 'Silakan login kembali untuk mengakses akun ini.',
                            confirmButtonColor: '#0F91FC',
                        }).then(() => {
                            window.location.href = `/otentikasi?tambah_akun=1&email=${encodeURIComponent(akun.email)}#masuk`;
                        });
                    }
                });
            }
        });
    };

    // Fungsi tambah akun baru tanpa menghapus akun yang ada (secara visual)
    const tanganiTambahAkun = () => {
        onTutup();
        const jumlahAkunAktif = daftarAkun.filter((a) => a.sesi_aktif).length;
        if (jumlahAkunAktif >= batasMultiAkun) {
            Swal.fire({
                title: 'Batas Akun Tercapai',
                text: `Perangkat ini telah mencapai batas maksimal ${batasMultiAkun} akun yang aktif bersamaan. Silakan keluarkan salah satu akun terlebih dahulu.`,
                icon: 'warning',
                confirmButtonText: 'Mengerti',
                confirmButtonColor: '#0F91FC',
                customClass: {
                    popup: 'rounded-3xl',
                    confirmButton: 'rounded-xl font-bold px-5 py-2.5',
                },
            });
            return;
        }

        Swal.fire({
            title: 'Tambah Akun Baru',
            text: `Anda akan diarahkan ke halaman login untuk menambahkan akun lain pada perangkat ini (${jumlahAkunAktif}/${batasMultiAkun} akun aktif).`,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Lanjutkan',
            confirmButtonColor: '#0F91FC',
            cancelButtonText: 'Batal',
            customClass: {
                popup: 'rounded-3xl',
                confirmButton: 'rounded-xl font-bold px-5 py-2.5',
                cancelButton: 'rounded-xl font-semibold px-4 py-2.5',
            },
        }).then((res) => {
            if (res.isConfirmed) {
                window.location.href = '/otentikasi?tambah_akun=1#masuk';
            }
        });
    };

    // Fungsi logout sebagian (per-akun)
    const tanganiLogoutPartial = (akun, event) => {
        event.stopPropagation();
        onTutup();
        Swal.fire({
            title: 'Keluar dari Akun?',
            text: `Sesi login untuk ${akun.email} akan dihapus dari perangkat ini.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Ya, Keluar',
            cancelButtonText: 'Batal',
            customClass: {
                popup: 'rounded-3xl',
                confirmButton: 'rounded-xl font-bold px-5 py-2.5',
                cancelButton: 'rounded-xl font-semibold px-4 py-2.5',
            },
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire({
                    title: 'Memproses...',
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading(),
                });

                router.post(route('account.logout.partial'), { email: akun.email }, {
                    onFinish: () => {
                        Swal.close();
                        try {
                            const sisaAkun = daftarAkun.filter((a) => a.email !== akun.email);
                            setDaftarAkun(sisaAkun);
                            localStorage.setItem('sso_multi_accounts', JSON.stringify(sisaAkun));
                        } catch (e) {}
                    }
                });
            }
        });
    };

    // Fungsi logout dari semua akun
    const tanganiLogoutSemua = () => {
        onTutup();
        Swal.fire({
            title: 'Logout Dari Semua Akun?',
            text: 'Semua sesi akun yang tersimpan di perangkat ini akan dikeluarkan demi keamanan.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Ya, Logout Semua',
            cancelButtonText: 'Batal',
            customClass: {
                popup: 'rounded-3xl',
                confirmButton: 'rounded-xl font-bold px-5 py-2.5',
                cancelButton: 'rounded-xl font-semibold px-4 py-2.5',
            },
        }).then((result) => {
            if (result.isConfirmed) {
                // Tandai seluruh sesi berakhir di local storage
                try {
                    const akunBaru = daftarAkun.map((a) => ({ ...a, sesi_aktif: false }));
                    localStorage.setItem('sso_multi_accounts', JSON.stringify(akunBaru));
                } catch (e) {
                    /* ignore */
                }

                // Kirim request logout standar ke backend
                router.post(route('logout'));
            }
        });
    };

    // Ambil inisial nama jika foto profil tidak tersedia
    const ambilInisial = (nama) => {
        if (!nama) return 'U';
        const kata = nama.trim().split(/\s+/);
        if (kata.length >= 2) {
            return (kata[0][0] + kata[1][0]).toUpperCase();
        }
        return nama.substring(0, 1).toUpperCase();
    };

    // Pastikan akun yang sedang aktif selalu berada di urutan paling atas
    const akunTerurut = [...daftarAkun].sort((a, b) => {
        const aAktif = (a.email || '').toLowerCase() === (penggunaAktif?.email || '').toLowerCase();
        const bAktif = (b.email || '').toLowerCase() === (penggunaAktif?.email || '').toLowerCase();
        if (aAktif && !bAktif) return -1;
        if (!aAktif && bAktif) return 1;
        return 0;
    });

    const akunDitampilkan = daftarAkunTerbuka
        ? akunTerurut
        : akunTerurut.filter(
              (a) => (a.email || '').toLowerCase() === (penggunaAktif?.email || '').toLowerCase()
          );

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center sm:justify-end p-3 sm:p-5 sm:pt-16 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
            {/* Modal Dialog Google Account Switcher */}
            <div
                ref={dialogRef}
                className="w-full max-w-[390px] sm:max-w-[410px] bg-[#f0f4f9] dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-[28px] shadow-2xl border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 space-y-3 animate-in fade-in zoom-in-95 duration-200 relative"
            >
                {/* Tombol Tutup (X) di Pojok Kanan Atas */}
                <div className="flex items-center justify-end -mb-1">
                    <button
                        type="button"
                        onClick={onTutup}
                        className="w-8 h-8 rounded-full hover:bg-slate-200/80 dark:hover:bg-slate-800 active:bg-slate-300 dark:active:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors shrink-0 cursor-pointer"
                        aria-label="Tutup jendela pilih akun"
                    >
                        <span className="material-symbols-rounded text-xl">close</span>
                    </button>
                </div>

                {/* Kartu Daftar Akun */}
                <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/70 shadow-sm divide-y divide-slate-100 dark:divide-slate-700/60 overflow-hidden">
                    <div className="max-h-[300px] overflow-y-auto scrollbar-minimalis divide-y divide-slate-100 dark:divide-slate-700/60">
                        {akunDitampilkan.map((akun, idx) => {
                            const apakahSedangAktif =
                                (akun.email || '').toLowerCase() ===
                                (penggunaAktif?.email || '').toLowerCase();

                            return (
                                <div
                                    key={akun.id || idx}
                                    onClick={() => tanganiPilihAkun(akun)}
                                    className={`w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer group ${
                                        apakahSedangAktif && daftarAkunTerbuka
                                            ? 'bg-blue-50/70 dark:bg-blue-950/30'
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-700/40'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        {/* Avatar / Inisial */}
                                        {akun.avatar_url ? (
                                            <img
                                                src={akun.avatar_url}
                                                alt={akun.nama_lengkap}
                                                className={`w-10 h-10 rounded-full object-cover shrink-0 shadow-sm ${
                                                    apakahSedangAktif ? 'ring-2 ring-[#0F91FC]' : ''
                                                }`}
                                            />
                                        ) : (
                                            <div
                                                className={`w-10 h-10 rounded-full ${akun.warna || 'bg-[#0F91FC]'} text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm ${
                                                    apakahSedangAktif ? 'ring-2 ring-[#0F91FC]' : ''
                                                }`}
                                            >
                                                {ambilInisial(akun.nama_lengkap)}
                                            </div>
                                        )}

                                        {/* Informasi Akun */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5">
                                                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate group-hover:text-[#0F91FC] dark:group-hover:text-blue-400 transition-colors">
                                                    {akun.nama_lengkap}
                                                </h4>
                                                {apakahSedangAktif && (
                                                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Akun Aktif"></span>
                                                )}
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                                {akun.email}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1.5 sm:gap-2">
                                        {/* Indikator Status Sesi Berakhir */}
                                        {!akun.sesi_aktif && (
                                            <span className="text-[11px] font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-600 whitespace-nowrap shrink-0">
                                                Sesi berakhir
                                            </span>
                                        )}

                                        {apakahSedangAktif ? (
                                            /* Tombol Minimize / Expand Daftar Akun pada Akun Aktif */
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDaftarAkunTerbuka((prev) => !prev);
                                                }}
                                                className="w-7 h-9 sm:w-8 sm:h-10 flex items-center justify-center rounded-full bg-slate-200/70 dark:bg-slate-700/80 hover:bg-slate-300/80 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-all shrink-0 cursor-pointer"
                                                title={daftarAkunTerbuka ? 'Sembunyikan daftar akun' : 'Tampilkan daftar akun'}
                                                aria-label={daftarAkunTerbuka ? 'Sembunyikan daftar akun' : 'Tampilkan daftar akun'}
                                            >
                                                <span className={`material-symbols-rounded text-lg transition-transform duration-200 ${daftarAkunTerbuka ? 'rotate-180' : ''}`}>
                                                    expand_more
                                                </span>
                                            </button>
                                        ) : (
                                            /* Tombol Logout Individual untuk Akun Lain */
                                            <button
                                                type="button"
                                                onClick={(e) => tanganiLogoutPartial(akun, e)}
                                                className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500 transition-colors shrink-0"
                                                title="Keluar dari akun ini"
                                            >
                                                <span className="material-symbols-rounded text-[17px] sm:text-lg">close</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {daftarAkunTerbuka && (
                        <>
                            {/* Aksi: Tambahkan akun lainnya */}
                            <button
                                type="button"
                                onClick={tanganiTambahAkun}
                                className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/40 text-slate-700 dark:text-slate-200 transition-colors text-left cursor-pointer group"
                            >
                                <div className="w-8 h-8 rounded-full border border-blue-500/30 bg-blue-50 dark:bg-blue-950/50 text-[#0F91FC] dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:bg-[#0F91FC] group-hover:text-white transition-colors">
                                    <span className="material-symbols-rounded text-xl">add</span>
                                </div>
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                    Tambahkan akun lainnya
                                </span>
                            </button>

                            {/* Aksi: Logout dari semua akun */}
                            <button
                                type="button"
                                onClick={tanganiLogoutSemua}
                                className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-700 dark:text-slate-200 hover:text-red-600 dark:hover:text-red-400 transition-colors text-left cursor-pointer group border-t border-slate-100 dark:border-slate-700/60"
                            >
                                <div className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 group-hover:bg-red-600 group-hover:text-white group-hover:border-red-600 transition-colors">
                                    <span className="material-symbols-rounded text-lg">logout</span>
                                </div>
                                <span className="text-sm font-semibold">
                                    Logout dari semua akun
                                </span>
                            </button>
                        </>
                    )}
                </div>

                {/* Tombol Oval / Pill: Kelola Akun Anda (Persis Gambar 1) */}
                <div className="space-y-2">
                    <button
                        type="button"
                        onClick={() => setTampilkanMenuKelola((prev) => !prev)}
                        className="w-full py-2.5 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-full border border-slate-200/90 dark:border-slate-700 shadow-sm flex items-center justify-center gap-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer"
                    >
                        <span className="material-symbols-rounded text-[#0F91FC] text-lg">manage_accounts</span>
                        <span>Kelola Akun SSO Anda</span>
                        <span className={`material-symbols-rounded text-base text-slate-400 transition-transform ${tampilkanMenuKelola ? 'rotate-180' : ''}`}>
                            expand_more
                        </span>
                    </button>

                    {/* Submenu Profil Saya & Keamanan Akun jika tombol Kelola diklik */}
                    {tampilkanMenuKelola && (
                        <div className="p-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 shadow-md space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                            <Link
                                href={route('profil.indeks')}
                                onClick={onTutup}
                                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-[#0F91FC] dark:hover:text-blue-400 transition-colors"
                            >
                                <span className="material-symbols-rounded text-lg text-[#0F91FC]">person</span>
                                <div>
                                    <div>Profil Saya</div>
                                    <div className="text-[10px] text-slate-400 font-normal">Data pribadi & identitas sekolah</div>
                                </div>
                            </Link>
                            <Link
                                href={route('keamanan.indeks')}
                                onClick={onTutup}
                                className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-[#0F91FC] dark:hover:text-blue-400 transition-colors"
                            >
                                <span className="material-symbols-rounded text-lg text-emerald-500">security</span>
                                <div>
                                    <div>Keamanan Akun</div>
                                    <div className="text-[10px] text-slate-400 font-normal">Kata sandi, 2FA, & sesi aktif</div>
                                </div>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Footer: Kebijakan Privasi & Persyaratan Layanan (Persis Gambar 1) */}
                <div className="text-center pt-1 text-[11px] text-slate-500 dark:text-slate-400 space-x-2">
                    <Link
                        href={route('kebijakan-privasi')}
                        onClick={onTutup}
                        className="hover:underline hover:text-slate-700 dark:hover:text-slate-200"
                    >
                        Kebijakan Privasi
                    </Link>
                    <span>•</span>
                    <Link
                        href={route('syarat-dan-ketentuan')}
                        onClick={onTutup}
                        className="hover:underline hover:text-slate-700 dark:hover:text-slate-200"
                    >
                        Persyaratan Layanan
                    </Link>
                </div>
            </div>
        </div>
    );
}

