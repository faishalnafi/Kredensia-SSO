import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import Checkbox from '@/Components/Checkbox';
import axios from 'axios';

/**
 * Komponen Otentikasi Terpadu
 * Menggabungkan halaman Masuk dan Verifikasi/Klaim Akun dalam satu halaman
 * dengan transisi geser kotak biru yang halus (smooth sliding).
 * 
 * Mode ditentukan oleh hash URL:
 * - /otentikasi#masuk      → Formulir Login (kotak biru di KANAN)
 * - /otentikasi#verifikasi → Formulir Klaim (kotak biru di KIRI)
 * 
 * Struktur layout menggunakan CSS transition pada posisi kotak biru
 * agar perpindahan antar mode terlihat mulus tanpa reload halaman.
 */
export default function HalamanOtentikasi({ status, mode: modeProp }) {
    const { props } = usePage();
    const settings = props.settings;
    // Tentukan mode awal berdasarkan prop dari backend atau hash URL
    const ambilModeAwal = () => {
        if (typeof window !== 'undefined') {
            const hash = window.location.hash.replace('#', '');
            if (hash === 'verifikasi') return 'verifikasi';
            if (hash === 'masuk') return 'masuk';
        }
        return modeProp || 'masuk';
    };

    const [modeAktif, setModeAktif] = useState(ambilModeAwal);
    const [premiumPopup, setPremiumPopup] = useState({ buka: false, tipe: '' });
    const [logoGagal, setLogoGagal] = useState(false);
    const [tahapKlaim, setTahapKlaim] = useState(1);
    const [tampilkanSandi, setTampilkanSandi] = useState(false);
    const [tampilkanSandiKlaim, setTampilkanSandiKlaim] = useState(false);
    const [tampilkanKonfirmasi, setTampilkanKonfirmasi] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [sedangTransisi, setSedangTransisi] = useState(false);

    // State validasi verifikasi identitas (Tahap 1)
    const [statusValidasi, setStatusValidasi] = useState({ nik: null, nip_nis: null, tgl_lahir: null });
    const [sedangCekIdentitas, setSedangCekIdentitas] = useState(false);
    const [pesanTerklaim, setPesanTerklaim] = useState(null);

    const images = [
        '/images/login-1.png',
        '/images/login-2.png',
        '/images/login-3.png'
    ];

    // Rotasi gambar ilustrasi
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % images.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    // Sinkronisasi hash URL dengan state mode
    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '');
            if (hash === 'verifikasi' && modeAktif !== 'verifikasi') {
                gantiMode('verifikasi');
            } else if (hash === 'masuk' && modeAktif !== 'masuk') {
                gantiMode('masuk');
            }
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [modeAktif]);

    // Set hash pada mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.location.hash = modeAktif;
        }
    }, []);

    // Sinkronisasi dengan prop mode dari backend (misal setelah redirect dari Laravel)
    useEffect(() => {
        if (modeProp && modeProp !== modeAktif) {
            setModeAktif(modeProp);
            if (typeof window !== 'undefined') {
                window.location.hash = modeProp;
            }
            // Reset ke tahap 1 jika dipaksa ke mode verifikasi
            if (modeProp === 'verifikasi') {
                setTahapKlaim(1);
                setStatusValidasi({ nik: null, nip_nis: null, tgl_lahir: null });
                setPesanTerklaim(null);
            }
        }
    }, [modeProp]);

    // Fungsi perpindahan mode dengan transisi
    const gantiMode = (modeBaru) => {
        if (modeBaru === modeAktif || sedangTransisi) return;
        setSedangTransisi(true);
        setModeAktif(modeBaru);
        window.location.hash = modeBaru;
        // Reset tahap klaim saat berpindah ke verifikasi
        if (modeBaru === 'verifikasi') {
            setTahapKlaim(1);
            setStatusValidasi({ nik: null, nip_nis: null, tgl_lahir: null });
            setPesanTerklaim(null);
        }
        setTimeout(() => setSedangTransisi(false), 800);
    };

    // === Form Login ===
    const {
        data: dataLogin,
        setData: setDataLogin,
        post: kirimLogin,
        processing: prosesLogin,
        errors: galatLogin,
        reset: resetLogin,
        transform: transformLogin
    } = useForm({
        email: '',
        password: '',
        remember: false,
        recaptcha_token: '',
    });

    const tanganiLogin = (e) => {
        e.preventDefault();
        
        // Execute reCAPTCHA first if available
        const siteKey = settings?.recaptcha_site_key;
        if (siteKey && window.grecaptcha && window.grecaptcha.enterprise) {
            window.grecaptcha.enterprise.ready(async () => {
                try {
                    const token = await window.grecaptcha.enterprise.execute(siteKey, {action: 'LOGIN'});
                    lanjutkanLogin(token);
                } catch (error) {
                    console.error("reCAPTCHA Error", error);
                    lanjutkanLogin('');
                }
            });
        } else {
            lanjutkanLogin('');
        }
    };

    const lanjutkanLogin = (token) => {
        // Meneruskan parameter pencarian URL saat ini ke rute POST login
        const params = {};
        if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has('client_id')) params.client_id = urlParams.get('client_id');
            if (urlParams.has('app_id')) params.app_id = urlParams.get('app_id');
            if (urlParams.has('redirect_uri')) params.redirect_uri = urlParams.get('redirect_uri');
        }

        transformLogin((data) => ({
            ...data,
            recaptcha_token: token
        }));

        kirimLogin(route('login', params), {
            onFinish: () => resetLogin('password'),
        });
    };

    // === Form Klaim ===
    const {
        data: dataKlaim,
        setData: setDataKlaim,
        post: kirimKlaim,
        processing: prosesKlaim,
        errors: galatKlaim,
        reset: resetKlaim,
        clearErrors: bersihkanGalatKlaim,
        setError: setGalatKlaim
    } = useForm({
        jenis_pengguna: 'Siswa',
        nik: '',
        nip_nis: '',
        tgl_lahir: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    // Handlers input kontrol angka & panjang digit
    const tanganiPerubahanNik = (e) => {
        const val = e.target.value.replace(/\D/g, ''); // Hanya angka
        if (val.length <= 16) {
            setDataKlaim('nik', val);
            setStatusValidasi(prev => ({ ...prev, nik: null }));
            setPesanTerklaim(null);
        }
    };

    const tanganiPerubahanNipNis = (e) => {
        const val = e.target.value.replace(/\D/g, ''); // Hanya angka
        const maxLen = dataKlaim.jenis_pengguna === 'Guru' ? 18 : 10;
        if (val.length <= maxLen) {
            setDataKlaim('nip_nis', val);
            setStatusValidasi(prev => ({ ...prev, nip_nis: null }));
            setPesanTerklaim(null);
        }
    };

    const ubahJenisPengguna = (jenis) => {
        setDataKlaim(prev => ({ ...prev, jenis_pengguna: jenis, nip_nis: '' }));
        setStatusValidasi({ nik: null, nip_nis: null, tgl_lahir: null });
        setPesanTerklaim(null);
    };

    const tanganiPerubahanTglLahir = (e) => {
        setDataKlaim('tgl_lahir', e.target.value);
        setStatusValidasi(prev => ({ ...prev, tgl_lahir: null }));
        setPesanTerklaim(null);
    };

    const lanjutKeTahap2 = (e) => {
        e.preventDefault();
        bersihkanGalatKlaim();
        setPesanTerklaim(null);

        const errors = { nik: null, nip_nis: null, tgl_lahir: null };
        let hasError = false;

        // Validasi client-side: panjang digit & wajib diisi
        if (!dataKlaim.nik) {
            errors.nik = 'NIK wajib diisi.';
            hasError = true;
        } else if (dataKlaim.nik.length < 16) {
            errors.nik = 'NIK harus berjumlah 16 digit angka.';
            hasError = true;
        }

        const expectedNipNisLen = dataKlaim.jenis_pengguna === 'Guru' ? 18 : 10;
        const label = dataKlaim.jenis_pengguna === 'Guru' ? 'NIP' : 'NISN';
        if (!dataKlaim.nip_nis) {
            errors.nip_nis = `${label} wajib diisi.`;
            hasError = true;
        } else if (dataKlaim.nip_nis.length < expectedNipNisLen) {
            errors.nip_nis = `${label} harus berjumlah ${expectedNipNisLen} digit angka.`;
            hasError = true;
        }

        if (!dataKlaim.tgl_lahir) {
            errors.tgl_lahir = 'Tanggal Lahir wajib diisi.';
            hasError = true;
        }

        if (hasError) {
            setStatusValidasi(errors);
            return;
        }

        // Pengecekan AJAX ke Database
        setSedangCekIdentitas(true);
        axios.post(route('claim.check'), {
            jenis_pengguna: dataKlaim.jenis_pengguna,
            nik: dataKlaim.nik,
            nip_nis: dataKlaim.nip_nis,
            tgl_lahir: dataKlaim.tgl_lahir
        })
        .then(response => {
            setSedangCekIdentitas(false);
            if (response.data.success) {
                // Tandai valid dengan warna hijau
                setStatusValidasi({
                    nik: 'valid',
                    nip_nis: 'valid',
                    tgl_lahir: 'valid'
                });
                // Isi otomatis email ke form data
                setDataKlaim('email', response.data.email);
                
                // Lanjut ke tahap 2 dengan delay transisi mulus
                setTimeout(() => {
                    setTahapKlaim(2);
                }, 800);
            }
        })
        .catch(err => {
            setSedangCekIdentitas(false);
            if (err.response && err.response.data) {
                const data = err.response.data;
                if (data.claimed) {
                    // Akun sudah diklaim, tampilkan banner kuning di atas
                    setPesanTerklaim(data.message);
                } else if (data.errors) {
                    // Set pesan error masing-masing kolom
                    setStatusValidasi({
                        nik: data.errors.nik || (data.errors.nik === undefined && dataKlaim.nik ? 'valid' : null),
                        nip_nis: data.errors.nip_nis || (data.errors.nip_nis === undefined && dataKlaim.nip_nis ? 'valid' : null),
                        tgl_lahir: data.errors.tgl_lahir || (data.errors.tgl_lahir === undefined && dataKlaim.tgl_lahir ? 'valid' : null),
                    });
                }
            } else {
                alert('Terjadi kesalahan koneksi saat memverifikasi data.');
            }
        });
    };

    const tanganiKlaim = (e) => {
        e.preventDefault();
        
        // Validasi format surel client-side
        const surelRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!dataKlaim.email) {
            setGalatKlaim('email', 'Surel wajib diisi.');
            return;
        } else if (!surelRegex.test(dataKlaim.email)) {
            setGalatKlaim('email', 'Format surel tidak valid.');
            return;
        }

        // Pastikan password memenuhi kriteria sebelum submit
        const sandi = dataKlaim.password || '';
        const kriteriaSandi = {
            panjang: sandi.length >= 8,
            hurufBesar: /[A-Z]/.test(sandi),
            hurufKecil: /[a-z]/.test(sandi),
            angka: /[0-9]/.test(sandi),
            karakterKhusus: /[^A-Za-z0-9]/.test(sandi)
        };
        const sandiMemenuhiSyarat = Object.values(kriteriaSandi).every(Boolean);
        if (!sandiMemenuhiSyarat) {
            setGalatKlaim('password', 'Kata sandi belum memenuhi semua kriteria keamanan.');
            return;
        }

        kirimKlaim(route('claim.process'), {
            onFinish: () => resetKlaim('password', 'password_confirmation'),
            onSuccess: () => {
                // Paksa pindah ke mode login setelah klaim berhasil
                gantiMode('masuk');
            },
            onError: (errors) => {
                if (errors.nik || errors.nip_nis || errors.tgl_lahir) {
                    setTahapKlaim(1);
                }
            }
        });
    };

    // Apakah kotak biru ada di kiri (mode verifikasi) atau kanan (mode masuk)
    const kotakBiruDiKiri = modeAktif === 'verifikasi';

    return (
        <div className="bg-white dark:bg-slate-900 min-h-screen w-full flex flex-col transition-colors overflow-hidden">
            <Head title={modeAktif === 'masuk' ? `Masuk - ${settings?.nama_aplikasi || 'SingleSignOn'}` : `Verifikasi Akun - ${settings?.nama_aplikasi || 'SingleSignOn'}`}>
                <style>{`
                    @keyframes particleFadeInScale {
                        0% { opacity: 0; transform: scale(0.8) translateY(20px); }
                        100% { opacity: 1; transform: scale(1) translateY(0); }
                    }
                    @keyframes float {
                        0% { transform: translateY(0px); }
                        50% { transform: translateY(-15px); }
                        100% { transform: translateY(0px); }
                    }
                    .animate-particle {
                        animation: particleFadeInScale 0.8s ease-out forwards, float 6s ease-in-out infinite 0.8s;
                    }
                    /* Transisi form yang muncul/hilang */
                    .form-enter {
                        animation: formFadeIn 0.5s ease-out 0.3s forwards;
                        opacity: 0;
                    }
                    @keyframes formFadeIn {
                        0% { opacity: 0; transform: translateY(15px); }
                        100% { opacity: 1; transform: translateY(0); }
                    }
                `}</style>
            </Head>

            <main className="w-full min-h-screen flex flex-col relative transition-colors">
                {/* Kontainer grid utama - posisi relatif untuk kotak biru absolut */}
                <div className="flex-grow flex relative min-h-screen">

                    {/* ============================================= */}
                    {/* KOTAK BIRU (Ilustrasi) - Bergeser dengan CSS */}
                    {/* ============================================= */}
                    <div
                        className={`
                            hidden lg:flex absolute top-0 bottom-0 lg:w-[calc(50%+4rem)] z-20
                            transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]
                            ${kotakBiruDiKiri ? 'left-0 lg:-left-[4rem]' : 'left-0 lg:left-1/2'}
                        `}
                    >
                        {/* Background Shape - rounded corner tetap sama di semua ujung */}
                        <div className={`
                            absolute inset-y-0 w-full bg-[#0F91FC] dark:bg-slate-950 z-0 lg:rounded-[4rem]
                            transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]
                            ${kotakBiruDiKiri 
                                ? 'shadow-[30px_0_60px_-15px_rgba(0,0,0,0.3)]' 
                                : 'shadow-[-30px_0_60px_-15px_rgba(0,0,0,0.3)]'
                            }
                        `}></div>
                        
                        <div className={`
                            relative z-10 flex flex-col h-full py-6 lg:pt-16 lg:pb-10 
                            text-white justify-center flex-grow
                            transition-all duration-700
                            ${kotakBiruDiKiri ? 'px-6 lg:pl-32 lg:pr-16 items-start text-left' : 'px-6 lg:pl-16 lg:pr-32 items-end text-right'}
                        `}>
                            {/* Area Gambar Ilustrasi */}
                            <div className={`flex-grow flex items-center py-6 w-full ${kotakBiruDiKiri ? 'justify-start' : 'justify-end'}`}>
                                <img 
                                    key={currentImageIndex}
                                    alt="Ilustrasi Layanan Pendidikan" 
                                    className="w-full max-w-none h-auto object-contain drop-shadow-2xl opacity-90 dark:opacity-85 animate-particle scale-[1.5] origin-center" 
                                    src={images[currentImageIndex]}
                                />
                            </div>

                            {/* Fitur Utama */}
                            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-white/20 pt-6 mt-8 w-full text-white transition-all duration-500 ${kotakBiruDiKiri ? 'text-left' : 'text-right'}`}>
                                <div className={`flex flex-col ${kotakBiruDiKiri ? 'items-start' : 'items-end'}`}>
                                    <div className={`flex items-center gap-2 mb-1 ${kotakBiruDiKiri ? '' : 'flex-row-reverse'}`}>
                                        <span className="material-symbols-rounded text-xl">database</span>
                                        <h3 className="text-sm font-bold">Data Terisi Otomatis</h3>
                                    </div>
                                    <p className="text-xs font-medium leading-relaxed opacity-80">
                                        Sinkronisasi otomatis dengan data sekolah.
                                    </p>
                                </div>
                                <div className={`flex flex-col ${kotakBiruDiKiri ? 'items-start' : 'items-end'}`}>
                                    <div className={`flex items-center gap-2 mb-1 ${kotakBiruDiKiri ? '' : 'flex-row-reverse'}`}>
                                        <span className="material-symbols-rounded text-xl">shield_person</span>
                                        <h3 className="text-sm font-bold">Akses Aman</h3>
                                    </div>
                                    <p className="text-xs font-medium leading-relaxed opacity-80">
                                        Enkripsi tingkat tinggi untuk semua identitas sensitif.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ============================================= */}
                    {/* FORMULIR MASUK (Sisi Kiri saat mode masuk)    */}
                    {/* ============================================= */}
                    <div className={`
                        absolute inset-y-0 w-full lg:w-1/2 left-0
                        flex flex-col justify-center px-6 lg:px-12 py-12 z-10
                        overflow-y-auto scrollbar-none
                        transition-all duration-500
                        ${modeAktif === 'masuk' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
                    `}>
                        <div key={modeAktif === 'masuk' ? 'login-active' : 'login-hidden'} className={`w-full max-w-md mx-auto flex flex-col items-center text-center lg:items-start lg:text-left ${modeAktif === 'masuk' ? 'form-enter' : ''}`}>
                            
                            {/* Logo & Nama Aplikasi Dinamis */}
                            <div className="flex items-center gap-3 mb-6 select-none">
                                {settings?.logo_primer_url && !logoGagal ? (
                                    <img 
                                        src={settings.logo_primer_url} 
                                        alt={settings.nama_aplikasi || 'Logo'} 
                                        className="w-10 h-10 object-contain shadow-sm rounded-xl"
                                        onError={() => setLogoGagal(true)}
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0F91FC] to-[#0a78d6] flex items-center justify-center text-white font-bold shadow-lg shadow-[#0F91FC]/25">
                                        <span className="material-symbols-rounded text-xl">vpn_key</span>
                                    </div>
                                )}
                                <span className="text-xl font-black text-[#081242] dark:text-white uppercase tracking-wider">
                                    {settings?.nama_aplikasi || 'SingleSignOn'}
                                </span>
                            </div>

                            <div className="flex items-center justify-center lg:justify-start gap-2 mb-6">
                                <span className="text-[10px] font-bold tracking-widest text-[#0F91FC] dark:text-[#ff6b39] uppercase">PENYEDIA IDENTITAS</span>
                                <span className="bg-gray-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] px-2 py-0.5 rounded-full font-bold">TERVERIFIKASI</span>
                            </div>
                            
                            <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-4 text-slate-800 dark:text-white tracking-tight">
                                Satu Akun Semua<br />Layanan Pendidikan.
                            </h1>
                            
                            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
                                Masuk sekali untuk mengakses sistem pembelajaran (E-Learning), penilaian, administrasi, dan seluruh ekosistem digital sekolah.
                            </p>

                            {/* Status Pesan Sukses / Info */}
                            {status && modeAktif === 'masuk' && (
                                <div className="w-full mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/30 text-sm text-emerald-600 dark:text-emerald-400 font-medium text-left">
                                    {status}
                                </div>
                            )}

                            {/* Google OAuth / General Error Alert */}
                            {props.errors?.email && !dataLogin.email && (
                                <div className="w-full mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/30 text-sm text-rose-600 dark:text-rose-400 font-medium text-left">
                                    {props.errors.email}
                                </div>
                            )}

                            {/* Formulir Login */}
                            <form onSubmit={tanganiLogin} className="w-full space-y-4 text-left">
                                <div className="w-full space-y-2 mb-2">
                                    {/* Google OAuth (Full Width) */}
                                    <button
                                        type="button"
                                        onClick={() => window.location.href = route('auth.google')}
                                        className="w-full flex items-center justify-center gap-2 px-3 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800 shadow-sm"
                                    >
                                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                        Masuk dengan Google
                                    </button>

                                    {/* Apple & Microsoft (Grid 2 Kolom) */}
                                    <div className="grid grid-cols-2 gap-3 w-full">
                                        <button
                                            type="button"
                                            onClick={() => setPremiumPopup({ buka: true, tipe: 'Apple' })}
                                            className="flex items-center justify-center gap-2 px-3 py-3.5 bg-black text-white dark:bg-white dark:text-black border border-black dark:border-white rounded-xl text-xs font-bold hover:bg-neutral-900 dark:hover:bg-neutral-100 transition-all focus:ring-4 focus:ring-neutral-200 dark:focus:ring-slate-800 shadow-sm"
                                        >
                                            <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
                                                <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.48C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.1 16.67C20.08 16.74 19.67 18.11 18.71 19.5M15.97 4.17C16.63 3.37 17.07 2.28 16.95 1C15.85 1.04 14.51 1.73 13.73 2.64C13.07 3.41 12.49 4.52 12.64 5.78C13.87 5.87 15.12 5.17 15.97 4.17Z" />
                                            </svg>
                                            Masuk dengan Apple
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPremiumPopup({ buka: true, tipe: 'Microsoft' })}
                                            className="flex items-center justify-center gap-2 px-3 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all focus:ring-4 focus:ring-slate-100 dark:focus:ring-slate-800 shadow-sm"
                                        >
                                            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 23 23">
                                                <path fill="#f35325" d="M0 0h11v11H0z" />
                                                <path fill="#81bc06" d="M12 0h11v11H12z" />
                                                <path fill="#05a6f0" d="M0 12h11v11H0z" />
                                                <path fill="#ffba08" d="M12 12h11v11H12z" />
                                            </svg>
                                            Masuk dengan Microsoft
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-center items-center gap-4 mb-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                                    <Link href={route('panduan')} className="hover:text-[#0F91FC] dark:hover:text-[#ff6b39] transition-colors">Panduan</Link>
                                    <span className="text-slate-300 dark:text-slate-600">•</span>
                                    <button type="button" onClick={() => gantiMode('verifikasi')} className="hover:text-[#0F91FC] dark:hover:text-[#ff6b39] transition-colors">Verifikasi Akun</button>
                                    <span className="text-slate-300 dark:text-slate-600">•</span>
                                    <Link href={route('register')} className="hover:text-[#0F91FC] dark:hover:text-[#ff6b39] transition-colors">Buat Akun</Link>
                                </div>
                                
                                <div className="flex items-center gap-4 py-2">
                                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                                    <span className="text-xs font-medium text-slate-400">Atau masuk dengan surel</span>
                                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700"></div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider" htmlFor="email-login">
                                        Surel
                                    </label>
                                    <input 
                                        className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0F91FC] focus:border-[#0F91FC] py-3 px-4 transition-colors"
                                        id="email-login" 
                                        type="email"
                                        placeholder="Gunakan surel yang terdaftar di sekolah" 
                                        value={dataLogin.email}
                                        onChange={(e) => setDataLogin('email', e.target.value)}
                                        autoFocus={modeAktif === 'masuk'}
                                    />
                                    <InputError message={galatLogin.email} className="mt-1" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider" htmlFor="password-login">
                                        Kata Sandi
                                    </label>
                                    <div className="relative">
                                        <input 
                                            className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0F91FC] focus:border-[#0F91FC] py-3 pl-4 pr-12 transition-colors"
                                            id="password-login" 
                                            placeholder="••••••••" 
                                            type={tampilkanSandi ? "text" : "password"}
                                            value={dataLogin.password}
                                            onChange={(e) => setDataLogin('password', e.target.value)}
                                        />
                                        <button
                                            type="button"
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
                                            onClick={() => setTampilkanSandi(!tampilkanSandi)}
                                            aria-label={tampilkanSandi ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                                        >
                                            <span className="material-symbols-rounded text-xl">
                                                {tampilkanSandi ? 'visibility_off' : 'visibility'}
                                            </span>
                                        </button>
                                    </div>
                                    <InputError message={galatLogin.password} className="mt-1" />
                                </div>

                                <div className="flex items-center justify-between py-1">
                                    <label className="flex items-center cursor-pointer">
                                        <Checkbox
                                            name="remember"
                                            checked={dataLogin.remember}
                                            onChange={(e) => setDataLogin('remember', e.target.checked)}
                                        />
                                        <span className="ms-2 text-xs font-medium text-slate-500 dark:text-slate-400 select-none">
                                            Ingat Saya
                                        </span>
                                    </label>

                                    <Link
                                        href={route('password.request')}
                                        className="text-xs font-semibold text-[#0F91FC] hover:text-[#e03d09] dark:text-[#ff6b39] dark:hover:text-[#ff8a61]"
                                    >
                                        Lupa kata sandi?
                                    </Link>
                                </div>

                                <button 
                                    className="w-full bg-slate-900 dark:bg-[#0F91FC] text-white font-bold py-4 px-8 rounded-xl hover:bg-slate-800 dark:hover:bg-[#e03d09] transition-all text-xs uppercase tracking-widest mt-2 shadow-lg shadow-slate-900/10 dark:shadow-orange-600/10 disabled:opacity-50"
                                    disabled={prosesLogin}
                                    type="submit"
                                >
                                    Masuk Ke Portal
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* ============================================= */}
                    {/* FORMULIR KLAIM (Sisi Kanan saat mode verifikasi) */}
                    {/* ============================================= */}
                    <div className={`
                        absolute inset-y-0 w-full lg:w-1/2 lg:left-1/2
                        flex flex-col justify-center px-6 lg:px-12 py-12 z-10
                        overflow-y-auto scrollbar-none
                        transition-all duration-500
                        ${modeAktif === 'verifikasi' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
                    `}>
                        <div key={modeAktif === 'verifikasi' ? 'klaim-active' : 'klaim-hidden'} className={`w-full max-w-md mx-auto flex flex-col items-start text-left ${modeAktif === 'verifikasi' ? 'form-enter' : ''}`}>
                            
                            {/* Logo & Nama Aplikasi Dinamis */}
                            <div className="flex items-center gap-3 mb-6 select-none">
                                {settings?.logo_primer_url && !logoGagal ? (
                                    <img 
                                        src={settings.logo_primer_url} 
                                        alt={settings.nama_aplikasi || 'Logo'} 
                                        className="w-10 h-10 object-contain shadow-sm rounded-xl"
                                        onError={() => setLogoGagal(true)}
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0F91FC] to-[#0a78d6] flex items-center justify-center text-white font-bold shadow-lg shadow-[#0F91FC]/25">
                                        <span className="material-symbols-rounded text-xl">vpn_key</span>
                                    </div>
                                )}
                                <span className="text-xl font-black text-[#081242] dark:text-white uppercase tracking-wider">
                                    {settings?.nama_aplikasi || 'SingleSignOn'}
                                </span>
                            </div>
                            
                            {/* ===== TAHAP 1: Verifikasi Identitas ===== */}
                            {tahapKlaim === 1 && (
                                <>
                                    <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight mb-2 text-[#081242] dark:text-white tracking-tight">
                                        Verifikasi Identitas
                                    </h1>
                                    
                                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                                        Mohon masukkan kredensial resmi Anda sebagaimana terdaftar dalam sistem sekolah.
                                    </p>

                                    {/* Warning Banner Akun Terklaim (Kuning/Emas) */}
                                    {pesanTerklaim && (
                                        <div className="w-full mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 flex items-start gap-3 text-left">
                                            <span className="material-symbols-rounded text-xl text-amber-600 dark:text-amber-400 mt-0.5">warning</span>
                                            <div>
                                                <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">Verifikasi Gagal</h4>
                                                <p className="text-xs text-amber-700 dark:text-amber-400/90 font-medium leading-relaxed mt-1">{pesanTerklaim}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="w-full space-y-5">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider">
                                                Status Pengguna
                                            </label>
                                            <div className="flex gap-2">
                                                <button 
                                                    type="button"
                                                    onClick={() => ubahJenisPengguna('Siswa')}
                                                    className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all border ${dataKlaim.jenis_pengguna === 'Siswa' ? 'bg-[#081242] text-white border-[#081242] dark:bg-slate-700 dark:border-slate-600' : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}`}
                                                >
                                                    <span className="material-symbols-rounded text-xl">school</span>
                                                    Siswa
                                                </button>
                                                <button 
                                                    type="button"
                                                    onClick={() => ubahJenisPengguna('Guru')}
                                                    className={`flex-1 py-3 px-4 rounded-xl flex items-center justify-center gap-2 font-bold transition-all border ${dataKlaim.jenis_pengguna === 'Guru' ? 'bg-[#081242] text-white border-[#081242] dark:bg-slate-700 dark:border-slate-600' : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'}`}
                                                >
                                                    <span className="material-symbols-rounded text-xl">person</span>
                                                    Guru / Tendik
                                                </button>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider" htmlFor="nik">
                                                Nomor Induk Kependudukan (NIK)
                                            </label>
                                            <input 
                                                className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#081242] py-3 px-4 transition-colors placeholder:text-slate-400"
                                                id="nik" 
                                                placeholder="Masukkan 16 digit NIK" 
                                                type="text"
                                                value={dataKlaim.nik}
                                                onChange={tanganiPerubahanNik}
                                            />
                                            {statusValidasi.nik === 'valid' && (
                                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1 block">✓ Data NIK terverifikasi</span>
                                            )}
                                            {statusValidasi.nik && statusValidasi.nik !== 'valid' && (
                                                <span className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-1 block">{statusValidasi.nik}</span>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider" htmlFor="nip_nis">
                                                {dataKlaim.jenis_pengguna === 'Guru' ? 'Nomor Induk Pegawai (NIP)' : 'Nomor Induk Siswa Nasional (NISN)'}
                                            </label>
                                            <input 
                                                className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#081242] py-3 px-4 transition-colors placeholder:text-slate-400"
                                                id="nip_nis" 
                                                placeholder={dataKlaim.jenis_pengguna === 'Guru' ? "Masukkan NIP (18 digit)" : "Masukkan NISN (10 digit)"} 
                                                type="text"
                                                value={dataKlaim.nip_nis}
                                                onChange={tanganiPerubahanNipNis}
                                            />
                                            {statusValidasi.nip_nis === 'valid' && (
                                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1 block">✓ Data {dataKlaim.jenis_pengguna === 'Guru' ? 'NIP' : 'NISN'} terverifikasi</span>
                                            )}
                                            {statusValidasi.nip_nis && statusValidasi.nip_nis !== 'valid' && (
                                                <span className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-1 block">{statusValidasi.nip_nis}</span>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider" htmlFor="tgl_lahir">
                                                Tanggal Lahir
                                            </label>
                                            <input 
                                                className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#081242] py-3 px-4 transition-colors placeholder:text-slate-400"
                                                id="tgl_lahir" 
                                                type="date"
                                                value={dataKlaim.tgl_lahir}
                                                onChange={tanganiPerubahanTglLahir}
                                            />
                                            {statusValidasi.tgl_lahir === 'valid' && (
                                                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1 block">✓ Tanggal lahir cocok</span>
                                            )}
                                            {statusValidasi.tgl_lahir && statusValidasi.tgl_lahir !== 'valid' && (
                                                <span className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-1 block">{statusValidasi.tgl_lahir}</span>
                                            )}
                                        </div>

                                        <div className="pt-2 flex gap-3">
                                            <button 
                                                type="button"
                                                onClick={() => gantiMode('masuk')}
                                                className="flex-1 py-4 px-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all text-sm shadow-sm flex items-center justify-center gap-2"
                                            >
                                                <span className="material-symbols-rounded text-lg">arrow_back</span>
                                                Kembali
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={lanjutKeTahap2}
                                                disabled={sedangCekIdentitas}
                                                className="flex-1 bg-[#111827] dark:bg-[#0F91FC] text-white font-bold py-4 px-6 rounded-xl hover:bg-slate-800 dark:hover:bg-[#0a78d6] transition-all text-sm shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50"
                                            >
                                                {sedangCekIdentitas ? 'Memverifikasi...' : 'Verifikasi'}
                                                <span className="material-symbols-rounded text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="w-full mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed mx-auto">
                                            Hanya akun yang telah didaftarkan sebelumnya oleh admin yang dapat diverifikasi.
                                        </p>
                                    </div>
                                </>
                            )}

                            {/* ===== TAHAP 2: Pengaturan Email & Kata Sandi ===== */}
                            {tahapKlaim === 2 && (() => {
                                const sandi = dataKlaim.password || '';
                                const kriteriaSandi = {
                                    panjang: sandi.length >= 8,
                                    hurufBesar: /[A-Z]/.test(sandi),
                                    hurufKecil: /[a-z]/.test(sandi),
                                    angka: /[0-9]/.test(sandi),
                                    karakterKhusus: /[^A-Za-z0-9]/.test(sandi)
                                };
                                const sandiMemenuhiSyarat = Object.values(kriteriaSandi).every(Boolean);

                                return (
                                    <>
                                        <div className="flex items-center gap-2 mb-6 text-left">
                                            <span className="text-[10px] font-bold tracking-widest text-[#0F91FC] dark:text-[#ff6b39] uppercase">PORTAL AMAN</span>
                                            <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                <span className="material-symbols-rounded text-sm">verified</span>
                                                TERPROTEKSI
                                            </span>
                                        </div>

                                        <h1 className="text-3xl lg:text-4xl font-extrabold leading-tight mb-2 text-[#081242] dark:text-white tracking-tight">
                                            Verifikasi Identitas Akademik
                                        </h1>
                                        
                                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                                            Masukkan surel terdaftar Anda untuk mengatur kata sandi baru dan mengaktifkan akun Anda.
                                        </p>

                                        <form onSubmit={tanganiKlaim} className="w-full space-y-5">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider" htmlFor="email-klaim">
                                                    Surel Terdaftar
                                                </label>
                                                <input 
                                                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#081242] py-3 px-4 transition-colors placeholder:text-slate-400"
                                                    id="email-klaim" 
                                                    placeholder="nama@sekolah.sch.id" 
                                                    type="email"
                                                    value={dataKlaim.email}
                                                    onChange={(e) => {
                                                        setDataKlaim('email', e.target.value);
                                                        bersihkanGalatKlaim('email');
                                                    }}
                                                    autoFocus
                                                    required
                                                />
                                                <InputError message={galatKlaim.email} className="mt-1" />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider" htmlFor="password-klaim">
                                                    Buat Kata Sandi Baru
                                                </label>
                                                <div className="relative">
                                                    <input 
                                                        className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#081242] py-3 pr-12 pl-4 transition-colors placeholder:text-slate-400"
                                                        id="password-klaim" 
                                                        placeholder="••••••••" 
                                                        type={tampilkanSandiKlaim ? 'text' : 'password'}
                                                        value={dataKlaim.password}
                                                        onChange={(e) => setDataKlaim('password', e.target.value)}
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setTampilkanSandiKlaim(!tampilkanSandiKlaim)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none flex items-center"
                                                    >
                                                        <span className="material-symbols-rounded text-lg">
                                                            {tampilkanSandiKlaim ? 'visibility_off' : 'visibility'}
                                                        </span>
                                                    </button>
                                                </div>
                                                
                                                {/* Kriteria Indikator Kata Sandi Real-Time */}
                                                <div className="mt-2.5 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 text-left">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`material-symbols-rounded text-[14px] ${kriteriaSandi.panjang ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700'}`}>
                                                            {kriteriaSandi.panjang ? 'check_circle' : 'circle'}
                                                        </span>
                                                        <span>Minimal 8 Karakter</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`material-symbols-rounded text-[14px] ${kriteriaSandi.hurufBesar ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700'}`}>
                                                            {kriteriaSandi.hurufBesar ? 'check_circle' : 'circle'}
                                                        </span>
                                                        <span>Huruf Kapital (A-Z)</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`material-symbols-rounded text-[14px] ${kriteriaSandi.hurufKecil ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700'}`}>
                                                            {kriteriaSandi.hurufKecil ? 'check_circle' : 'circle'}
                                                        </span>
                                                        <span>Huruf Kecil (a-z)</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={`material-symbols-rounded text-[14px] ${kriteriaSandi.angka ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700'}`}>
                                                            {kriteriaSandi.angka ? 'check_circle' : 'circle'}
                                                        </span>
                                                        <span>Angka (0-9)</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 col-span-2">
                                                        <span className={`material-symbols-rounded text-[14px] ${kriteriaSandi.karakterKhusus ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-700'}`}>
                                                            {kriteriaSandi.karakterKhusus ? 'check_circle' : 'circle'}
                                                        </span>
                                                        <span>Karakter Khusus (misal: @$!%*?&)</span>
                                                    </div>
                                                </div>

                                                <InputError message={galatKlaim.password} className="mt-1" />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider" htmlFor="password-confirm">
                                                    Konfirmasi Kata Sandi
                                                </label>
                                                <div className="relative">
                                                    <input 
                                                        className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#081242] py-3 pr-12 pl-4 transition-colors placeholder:text-slate-400"
                                                        id="password-confirm" 
                                                        placeholder="Ulangi kata sandi baru" 
                                                        type={tampilkanKonfirmasi ? 'text' : 'password'}
                                                        value={dataKlaim.password_confirmation}
                                                        onChange={(e) => setDataKlaim('password_confirmation', e.target.value)}
                                                        required
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setTampilkanKonfirmasi(!tampilkanKonfirmasi)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none flex items-center"
                                                    >
                                                        <span className="material-symbols-rounded text-lg">
                                                            {tampilkanKonfirmasi ? 'visibility_off' : 'visibility'}
                                                        </span>
                                                    </button>
                                                </div>
                                                <InputError message={galatKlaim.password_confirmation} className="mt-1" />
                                            </div>

                                            <div className="pt-2 flex gap-3">
                                                <button 
                                                    type="button"
                                                    onClick={() => setTahapKlaim(1)}
                                                    className="flex-1 py-4 px-6 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all text-sm shadow-sm flex items-center justify-center gap-2"
                                                >
                                                    <span className="material-symbols-rounded text-lg">arrow_back</span>
                                                    Kembali
                                                </button>
                                                <button 
                                                    type="submit"
                                                    disabled={prosesKlaim || !sandiMemenuhiSyarat}
                                                    className="flex-1 bg-[#111827] dark:bg-[#0F91FC] text-white font-bold py-4 px-6 rounded-xl hover:bg-slate-800 dark:hover:bg-[#0a78d6] transition-all text-sm shadow-lg flex items-center justify-center gap-2 group disabled:opacity-50"
                                                >
                                                    {prosesKlaim ? 'Memproses...' : 'Simpan Verifikasi'}
                                                    <span className="material-symbols-rounded text-lg group-hover:translate-x-1 transition-transform">check</span>
                                                </button>
                                            </div>
                                        </form>
                                    </>
                                );
                            })()}
                        </div>
                    </div>

                </div>
            </main>

            {/* Modal Informasi Fitur Premium (Apple / Microsoft) */}
            {premiumPopup.buka && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5 text-center">
                        <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-800 dark:text-white">
                            <span className="material-symbols-rounded text-3xl animate-pulse">workspace_premium</span>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">Fitur Eksklusif Gold</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                Otentikasi masuk "Masuk dengan {premiumPopup.tipe}" merupakan fitur tambahan premium. Lakukan donasi pengembangan atau langganan paket Gold untuk mengaktifkan integrasi OAuth2 {premiumPopup.tipe}.
                            </p>
                        </div>
                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/40 dark:border-amber-800/30 p-4 rounded-2xl text-left text-xs leading-relaxed text-amber-800 dark:text-amber-400 font-bold space-y-1">
                            <div className="flex items-center gap-1">
                                <span className="material-symbols-rounded text-sm text-amber-600 dark:text-amber-500">stars</span>
                                <span>Keuntungan Paket Gold:</span>
                            </div>
                            <ul className="list-disc list-inside font-medium mt-1 space-y-0.5 text-[11px] text-amber-700 dark:text-amber-400">
                                <li>OAuth2 Apple & Microsoft Azure AD</li>
                                <li>Custom Domain Lintas Subdomain SSO</li>
                                <li>Dukungan Prioritas 24/7</li>
                            </ul>
                        </div>
                        <div className="flex flex-col gap-2">
                            <a 
                                href="https://saweria.co/" 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className="w-full bg-[#0F91FC] hover:bg-blue-600 text-white font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-widest shadow-lg shadow-blue-500/10 transition-all text-center"
                            >
                                Hubungi Pengembang / Donasi
                            </a>
                            <button
                                type="button"
                                onClick={() => setPremiumPopup({ buka: false, tipe: '' })}
                                className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold py-3.5 px-4 rounded-xl text-xs uppercase tracking-widest transition-all"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
