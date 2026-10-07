import React, { useState, useEffect, useRef } from 'react';
import { router, usePage } from '@inertiajs/react';
import Swal from 'sweetalert2';

/**
 * Pendengar Sesi & Sinkronisasi Data Real-time 2 Arah.
 *
 * 1. Berlangganan kanal privat `sesi.{kanalSesi}` via Laravel Reverb / Pusher
 *    untuk mendeteksi pengakhiran sesi perangkat dari jarak jauh.
 * 2. Berlangganan kanal publik `sistem-realtime` untuk menyinkronkan data
 *    di seluruh halaman secara otomatis (tanpa refresh halaman manual) setiap kali
 *    ada perubahan pengguna, peran, aplikasi, persetujuan data, kelas, tahun pelajaran,
 *    kunci API, pengaturan sistem, maupun log aktivitas.
 * 3. Fallback cerdas: jika server WebSocket sedang offline, melakukan sinkronisasi
 *    ringan secara berkala dan saat tab kembali aktif tanpa mengganggu form/modal yang sedang dibuka.
 */
export default function PendengarSesiRealtime({ tampilkanIndikator = false }) {
    const { url, props } = usePage();
    const { kanalSesi } = props;
    const terakhirSinkron = useRef(0);
    const timerDebounceRef = useRef(null);
    const sedangReloadRef = useRef(false);
    const urlSaatIniRef = useRef(url);

    // Status koneksi real-time: 'terhubung' | 'polling' | 'menyinkronkan'
    const [statusKoneksi, setStatusKoneksi] = useState(() => {
        if (typeof window !== 'undefined' && window.Echo?.connector?.pusher?.connection?.state === 'connected') {
            return 'terhubung';
        }
        return 'polling';
    });

    useEffect(() => {
        urlSaatIniRef.current = url;
    }, [url]);

    // Periksa apakah pengguna sedang mengetik di form atau membuka modal dialog
    const apakahSedangInteraksiForm = () => {
        if (typeof document === 'undefined') return false;

        // Jangan reload jika ada popup SweetAlert2 yang sedang tampil
        if (Swal.isVisible()) return true;

        // Jangan reload jika fokus berada pada input, textarea, atau select yang sedang diedit
        const elemenAktif = document.activeElement;
        if (elemenAktif) {
            const tag = elemenAktif.tagName ? elemenAktif.tagName.toLowerCase() : '';
            const adalahInputPencarian =
                elemenAktif.getAttribute('type') === 'search' ||
                (elemenAktif.getAttribute('placeholder') || '').toLowerCase().includes('cari');

            if (['input', 'textarea', 'select'].includes(tag) && !adalahInputPencarian) {
                return true;
            }
        }

        // Jangan reload jika ada modal form dengan backdrop z-50 yang terbuka di halaman
        const modalTerbuka = document.querySelector('[role="dialog"], .fixed.inset-0.z-50, .fixed.inset-0.z-\\[60\\], .fixed.inset-0.z-\\[70\\]');
        if (modalTerbuka) return true;

        return false;
    };

    // Tentukan daftar props Inertia yang perlu di-reload berdasarkan URL aktif dan modul yang berubah
    const tentukanPropsUntukReload = (modul) => {
        const path = (urlSaatIniRef.current || window.location.pathname).split('?')[0];

        // Jika perubahan global ('sistem'), muat ulang seluruh prop halaman saat ini
        if (modul === 'sistem') {
            return [];
        }

        const daftarProps = new Set();

        // Prop global yang selalu relevan jika pengaturan atau pengguna berubah
        if (modul === 'pengaturan') {
            daftarProps.add('settings');
        }
        if (modul === 'pengguna' || modul === 'peran' || modul === 'koreksi') {
            daftarProps.add('auth');
            daftarProps.add('akunMultiSesi');
        }

        // Pemetaan spesifik per halaman
        if (path.endsWith('/beranda')) {
            if (['pengguna', 'peran', 'aplikasi', 'koreksi'].includes(modul)) {
                daftarProps.add('statistik');
                daftarProps.add('penggunaTerbaru');
            }
        } else if (path.includes('/manajemen-pengguna')) {
            if (['pengguna', 'peran', 'kelas', 'tahun_pelajaran', 'koreksi'].includes(modul)) {
                daftarProps.add('daftarPengguna');
                daftarProps.add('daftarPeran');
                daftarProps.add('daftarKelas');
                daftarProps.add('adaTahunPelajaranAktif');
            }
        } else if (path.includes('/manajemen-peran')) {
            if (['peran', 'pengguna'].includes(modul)) {
                daftarProps.add('daftarPeran');
            }
        } else if (path.includes('/persetujuan-data')) {
            if (['koreksi', 'pengguna'].includes(modul)) {
                daftarProps.add('daftarKoreksi');
            }
        } else if (path.includes('/manajemen-aplikasi')) {
            if (['aplikasi', 'peran'].includes(modul)) {
                daftarProps.add('daftarAplikasi');
                daftarProps.add('daftarPeran');
            }
        } else if (path === '/dasbor' || path.includes('/katalog')) {
            if (['aplikasi', 'peran', 'pengguna'].includes(modul)) {
                daftarProps.add('daftarAplikasi');
            }
        } else if (path.includes('/kelas')) {
            if (['kelas', 'tahun_pelajaran', 'pengguna'].includes(modul)) {
                daftarProps.add('daftarKelas');
                daftarProps.add('daftarTahunPelajaran');
                daftarProps.add('daftarGuru');
            }
        } else if (path.includes('/tahun-pelajaran')) {
            if (['tahun_pelajaran', 'kelas'].includes(modul)) {
                daftarProps.add('daftarTahunPelajaran');
            }
        } else if (path.includes('/kunci-api')) {
            if (modul === 'kunci_api') {
                daftarProps.add('daftarKunci');
            }
        } else if (path.includes('/log-aktivitas')) {
            if (['log_aktivitas', 'pengguna'].includes(modul)) {
                daftarProps.add('daftarLog');
                daftarProps.add('daftarArsip');
            }
        } else if (path.includes('/pengaturan-sistem')) {
            if (modul === 'pengaturan') {
                daftarProps.add('pengaturan');
            }
        } else if (path.includes('/konfigurasi-2fa')) {
            if (['pengaturan', 'pengguna', 'peran'].includes(modul)) {
                daftarProps.add('pengaturan');
                daftarProps.add('daftarPengguna');
                daftarProps.add('semuaPeran');
                daftarProps.add('statistik');
            }
        } else if (path.includes('/keamanan-akun')) {
            if (['pengguna', 'koreksi', 'pengaturan'].includes(modul)) {
                daftarProps.add('daftarSesi');
                daftarProps.add('pengguna');
                daftarProps.add('pendingCorrection');
                daftarProps.add('twoFactor');
            }
        } else if (path.includes('/profil-saya')) {
            if (['pengguna', 'koreksi'].includes(modul)) {
                daftarProps.add('pengguna');
            }
        } else if (path.includes('/backup-restore') || path.includes('/hapus-data')) {
            if (['pengguna', 'peran', 'kelas', 'tahun_pelajaran', 'kunci_api'].includes(modul)) {
                daftarProps.add('ringkasan');
            }
        } else if (path.includes('/pembaruan-sistem')) {
            if (['log_aktivitas', 'sistem'].includes(modul)) {
                daftarProps.add('versiSekarang');
                daftarProps.add('riwayatPembaruan');
            }
        }

        return Array.from(daftarProps);
    };

    // Eksekusi reload Inertia secara mulus (tanpa refresh browser & tanpa menghilangkan posisi scroll)
    const jalankanSinkronisasiHalus = (daftarOnly = null) => {
        if (sedangReloadRef.current || apakahSedangInteraksiForm()) {
            return;
        }

        sedangReloadRef.current = true;
        setStatusKoneksi((prev) => (prev === 'terhubung' ? 'menyinkronkan' : prev));

        const opsiReload = {
            preserveScroll: true,
            preserveState: true,
            onFinish: () => {
                sedangReloadRef.current = false;
                terakhirSinkron.current = Date.now();
                setStatusKoneksi(() => {
                    if (window.Echo?.connector?.pusher?.connection?.state === 'connected') {
                        return 'terhubung';
                    }
                    return 'polling';
                });
            },
        };

        if (Array.isArray(daftarOnly) && daftarOnly.length > 0) {
            opsiReload.only = daftarOnly;
        }

        router.reload(opsiReload);
    };

    // Jadwalkan sinkronisasi dengan debounce (350ms) agar rentetan event digabung jadi 1 request
    const jadwalkanSinkronisasiModul = (modul) => {
        const propsTarget = tentukanPropsUntukReload(modul);

        // Jika modul bukan 'sistem' dan tidak ada prop yang relevan dengan halaman aktif, abaikan
        if (modul !== 'sistem' && propsTarget.length === 0) {
            return;
        }

        if (timerDebounceRef.current) {
            clearTimeout(timerDebounceRef.current);
        }

        timerDebounceRef.current = setTimeout(() => {
            jalankanSinkronisasiHalus(modul === 'sistem' ? null : propsTarget);
        }, 350);
    };

    // Tandai akun sebagai "Sesi berakhir" di daftar akun perangkat (localStorage)
    const tandaiSesiBerakhir = (email) => {
        try {
            const daftar = JSON.parse(localStorage.getItem('sso_multi_accounts') || '[]');
            const baru = daftar.map((a) =>
                (a.email || '').toLowerCase() === (email || '').toLowerCase()
                    ? { ...a, sesi_aktif: false }
                    : a
            );
            localStorage.setItem('sso_multi_accounts', JSON.stringify(baru));
        } catch (e) {
            /* abaikan */
        }
    };

    // Tampilkan notifikasi sistem operasi (Web Notification API)
    const tampilkanNotifikasiOS = (judul, isi) => {
        if (typeof window === 'undefined' || !('Notification' in window)) return;
        if (Notification.permission !== 'granted') return;
        try {
            new Notification(judul, { body: isi, icon: '/favicon.ico', tag: 'sso-sesi' });
        } catch (e) {
            /* abaikan */
        }
    };

    // Minta izin notifikasi sekali, pada interaksi pertama pengguna (aturan browser)
    useEffect(() => {
        if (typeof window === 'undefined' || !('Notification' in window)) return;
        if (Notification.permission !== 'default') return;

        const mintaIzin = () => {
            Notification.requestPermission().catch(() => {});
            window.removeEventListener('click', mintaIzin);
        };
        window.addEventListener('click', mintaIzin, { once: true });
        return () => window.removeEventListener('click', mintaIzin);
    }, []);

    // Pantau status koneksi WebSocket (Laravel Reverb / Pusher) & berlangganan kanal sistem-realtime
    useEffect(() => {
        if (typeof window === 'undefined' || !window.Echo) {
            setStatusKoneksi('polling');
            return;
        }

        const pusherConn = window.Echo.connector?.pusher?.connection;

        const saatTerhubung = () => setStatusKoneksi('terhubung');
        const saatTerputus = () => setStatusKoneksi('polling');

        if (pusherConn) {
            if (pusherConn.state === 'connected') {
                setStatusKoneksi('terhubung');
            }
            pusherConn.bind('connected', saatTerhubung);
            pusherConn.bind('disconnected', saatTerputus);
            pusherConn.bind('unavailable', saatTerputus);
            pusherConn.bind('failed', saatTerputus);
        }

        // Berlangganan kanal publik 'sistem-realtime' untuk sinkronisasi 2 arah instan
        const kanalSistem = window.Echo.channel('sistem-realtime');
        kanalSistem.listen('.DataSistemDiperbarui', (payload) => {
            const modul = payload?.modul || 'sistem';
            jadwalkanSinkronisasiModul(modul);
        });
        kanalSistem.listen('PenggunaDiperbarui', () => {
            jadwalkanSinkronisasiModul('pengguna');
        });

        return () => {
            if (timerDebounceRef.current) {
                clearTimeout(timerDebounceRef.current);
            }
            if (pusherConn) {
                pusherConn.unbind('connected', saatTerhubung);
                pusherConn.unbind('disconnected', saatTerputus);
                pusherConn.unbind('unavailable', saatTerputus);
                pusherConn.unbind('failed', saatTerputus);
            }
            window.Echo.leave('sistem-realtime');
        };
    }, []);

    // Berlangganan push notification sesi perangkat privat
    useEffect(() => {
        if (!kanalSesi || !window.Echo) return;

        const namaKanal = `sesi.${kanalSesi}`;
        const kanal = window.Echo.private(namaKanal);

        kanal.listen('.SesiPerangkatDiakhiri', (data) => {
            tandaiSesiBerakhir(data.email);

            const judul = 'Sesi Telah Berakhir';
            const isi = data.logout_total
                ? `Sesi akun ${data.email} telah diakhiri dari perangkat lain.`
                : `Akun ${data.email} telah dikeluarkan dari perangkat ini. Anda dialihkan ke akun lain.`;

            tampilkanNotifikasiOS(judul, isi);

            Swal.fire({
                icon: 'warning',
                title: judul,
                text: isi,
                confirmButtonText: data.logout_total ? 'Masuk Kembali' : 'Mengerti',
                confirmButtonColor: '#0F91FC',
                allowOutsideClick: false,
                customClass: {
                    popup: 'rounded-3xl',
                    confirmButton: 'rounded-xl font-bold px-5 py-2.5',
                },
            }).then(() => {
                if (data.logout_total) {
                    window.location.href = `/otentikasi?email=${encodeURIComponent(data.email)}#masuk`;
                } else {
                    // Muat ulang data halaman agar akun aktif & daftar akun ikut berganti
                    router.reload();
                }
            });
        });

        return () => {
            window.Echo.leave(namaKanal);
        };
    }, [kanalSesi]);

    // State untuk Dialog Verifikasi Perangkat Mirip Google (Google Prompt)
    const idPenggunaAktif = props?.auth?.user?.id;
    const emailPenggunaAktif = props?.auth?.user?.email;
    const [tantanganPrompt, setTantanganPrompt] = useState(null);
    const [sedangMeresponPrompt, setSedangMeresponPrompt] = useState(false);
    const [tahapPrompt, setTahapPrompt] = useState('konfirmasi'); // 'konfirmasi' | 'pilih_angka'
    const idPromptDitolakRef = useRef(null);

    // Dengarkan event real-time TantanganGooglePrompt pada kanal pengguna aktif + fallback polling
    useEffect(() => {
        if (!idPenggunaAktif) return;

        const tanganiDataTantangan = (t) => {
            if (!t || !t.id) {
                setTantanganPrompt(null);
                return;
            }
            if (t.status && t.status !== 'pending') {
                setTantanganPrompt((prev) => (prev?.id === t.id ? null : prev));
                return;
            }
            if (idPromptDitolakRef.current === t.id) {
                return;
            }
            setTantanganPrompt((prev) => {
                if (!prev || prev.id !== t.id) {
                    setTahapPrompt('konfirmasi');
                    tampilkanNotifikasiOS(
                        'Mencoba masuk dari perangkat lain?',
                        `Perangkat ${t.perangkat || 'lain'} (${t.ip_address || '-'}) meminta izin masuk ke akun Anda.`
                    );
                }
                return t;
            });
        };

        let kanalUser = null;
        if (window.Echo) {
            kanalUser = window.Echo.private(`App.Models.User.${idPenggunaAktif}`);
            kanalUser.listen('.TantanganGooglePrompt', (payload) => {
                tanganiDataTantangan(payload?.tantangan);
            });
        }

        const cekPromptServer = async () => {
            if (document.visibilityState !== 'visible') return;
            try {
                const res = await window.axios.get(route('keamanan.2fa.prompt_pending'));
                if (res.data?.tantangan) {
                    tanganiDataTantangan(res.data.tantangan);
                } else {
                    setTantanganPrompt(null);
                }
            } catch (e) {
                /* abaikan */
            }
        };

        cekPromptServer();
        const intervalPrompt = setInterval(cekPromptServer, 3500);

        return () => {
            clearInterval(intervalPrompt);
            if (kanalUser) {
                kanalUser.stopListening('.TantanganGooglePrompt');
            }
        };
    }, [idPenggunaAktif]);

    const kirimResponPrompt = async (aksi, angkaDipilih = null) => {
        if (!tantanganPrompt?.id || sedangMeresponPrompt) return;
        setSedangMeresponPrompt(true);

        try {
            const res = await window.axios.post(route('keamanan.2fa.prompt_respon'), {
                challenge_id: tantanganPrompt.id,
                aksi,
                angka_dipilih: angkaDipilih,
            });

            idPromptDitolakRef.current = tantanganPrompt.id;
            setTantanganPrompt(null);

            Swal.fire({
                icon: res.data?.status === 'approved' ? 'success' : 'info',
                title: res.data?.status === 'approved' ? 'Masuk Disetujui' : 'Akses Diblokir',
                text: res.data?.pesan || 'Respon keamanan telah dikirimkan.',
                timer: 2600,
                showConfirmButton: false,
                customClass: {
                    popup: 'rounded-3xl',
                },
            });
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Gagal Mengirim Respon',
                text: err?.response?.data?.pesan || 'Permintaan mungkin sudah kadaluarsa.',
                customClass: {
                    popup: 'rounded-3xl',
                },
            });
            setTantanganPrompt(null);
        } finally {
            setSedangMeresponPrompt(false);
        }
    };

    // Fallback tanpa WebSocket & sinkronisasi saat tab difokuskan kembali
    useEffect(() => {
        const sinkronkanSaatFokus = () => {
            if (document.visibilityState !== 'visible') return;
            const sekarang = Date.now();
            if (sekarang - terakhirSinkron.current < 8000) return;
            jalankanSinkronisasiHalus();
        };

        // Jika WebSocket tidak terhubung (misal Reverb belum dijalankan), lakukan polling ringan setiap 12 detik saat tab terlihat
        const intervalPolling = setInterval(() => {
            if (document.visibilityState !== 'visible') return;
            const wsTerhubung = window.Echo?.connector?.pusher?.connection?.state === 'connected';
            if (!wsTerhubung) {
                jalankanSinkronisasiHalus();
            }
        }, 12000);

        document.addEventListener('visibilitychange', sinkronkanSaatFokus);
        window.addEventListener('focus', sinkronkanSaatFokus);

        return () => {
            clearInterval(intervalPolling);
            document.removeEventListener('visibilitychange', sinkronkanSaatFokus);
            window.removeEventListener('focus', sinkronkanSaatFokus);
        };
    }, []);

    if (!tantanganPrompt) {
        return null;
    }

    // Render Dialog Verifikasi Perangkat Mirip Google (Google Prompt)
    return (
        <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-md animate-fade-in"
        >
            <div className="w-full max-w-[420px] bg-white dark:bg-slate-900 rounded-[28px] shadow-2xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden">
                {/* Header ala Google Security Prompt */}
                <div className="px-7 pt-7 pb-5 text-center border-b border-slate-100 dark:border-slate-800">
                    <div className="mx-auto w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800/60 flex items-center justify-center mb-4 shadow-sm">
                        <span className="material-symbols-outlined text-[30px] text-[#0F91FC]">
                            phonelink_lock
                        </span>
                    </div>

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>{emailPenggunaAktif}</span>
                    </div>

                    <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Mencoba masuk dari perangkat lain?
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                        Seseorang baru saja memasukkan kata sandi akun Anda dan meminta persetujuan masuk.
                    </p>
                </div>

                {/* Detail Perangkat yang Meminta Akses */}
                <div className="px-7 py-5 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
                    <div className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/70">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-[#0F91FC] flex items-center justify-center shrink-0 mt-0.5">
                            <span className="material-symbols-outlined text-[22px]">devices</span>
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Perangkat Pemohon</p>
                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5">
                                {tantanganPrompt.perangkat || 'Browser di Perangkat Lain'}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                                <span className="inline-flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">location_on</span>
                                    IP: {tantanganPrompt.ip_address || '-'}
                                </span>
                                <span className="inline-flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[14px]">schedule</span>
                                    Baru saja
                                </span>
                            </div>
                        </div>
                    </div>

                    {tahapPrompt === 'konfirmasi' ? (
                        <div className="pt-2">
                            <p className="text-xs text-center text-slate-600 dark:text-slate-300 font-medium mb-4">
                                Apakah benar Anda yang sedang mencoba masuk?
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    disabled={sedangMeresponPrompt}
                                    onClick={() => kirimResponPrompt('tolak')}
                                    className="py-3 px-4 rounded-2xl border border-rose-200 dark:border-rose-800/70 bg-rose-50/70 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-300 font-bold text-xs transition flex items-center justify-center gap-1.5"
                                >
                                    <span className="material-symbols-outlined text-[18px]">close</span>
                                    Tidak, Jangan Izinkan
                                </button>
                                <button
                                    type="button"
                                    disabled={sedangMeresponPrompt}
                                    onClick={() => setTahapPrompt('pilih_angka')}
                                    className="py-3 px-4 rounded-2xl bg-[#0F91FC] hover:bg-[#0c7cd8] text-white font-bold text-xs shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-1.5"
                                >
                                    <span className="material-symbols-outlined text-[18px]">check</span>
                                    Ya, Itu Saya
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="pt-2 text-center">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                                Ketuk angka yang tampil di layar login Anda
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-4">
                                Cocokkan angka 2 digit di bawah ini untuk menyelesaikan verifikasi:
                            </p>

                            <div className="grid grid-cols-3 gap-3 mb-4">
                                {(tantanganPrompt.opsi_angka || []).map((angka) => (
                                    <button
                                        key={angka}
                                        type="button"
                                        disabled={sedangMeresponPrompt}
                                        onClick={() => kirimResponPrompt('setuju', angka)}
                                        className="h-16 rounded-2xl border-2 border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 hover:bg-[#0F91FC] hover:border-[#0F91FC] hover:text-white text-slate-800 dark:text-white font-black text-2xl shadow-sm transition-all transform active:scale-95 flex items-center justify-center"
                                    >
                                        {angka}
                                    </button>
                                ))}
                            </div>

                            <button
                                type="button"
                                disabled={sedangMeresponPrompt}
                                onClick={() => kirimResponPrompt('tolak')}
                                className="w-full py-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                            >
                                Batalkan & Tolak Permintaan Masuk
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


