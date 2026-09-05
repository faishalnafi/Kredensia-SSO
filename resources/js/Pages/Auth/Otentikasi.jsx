import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import Checkbox from '@/Components/Checkbox';
import axios from 'axios';
import Swal from 'sweetalert2';

/**
 * Komponen Partikel Sintesa Canvas
 * Menampilkan efek partikel melayang dan constellation net khusus di bagian biru banner
 */
function KomponenPartikelSintesa() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let animationFrameId;

        let width = (canvas.width = canvas.parentElement.offsetWidth);
        let height = (canvas.height = canvas.parentElement.offsetHeight);

        const tanganiResize = () => {
            if (!canvas || !canvas.parentElement) return;
            width = canvas.width = canvas.parentElement.offsetWidth;
            height = canvas.height = canvas.parentElement.offsetHeight;
        };

        window.addEventListener('resize', tanganiResize);

        // Inisialisasi Partikel Sintesa
        const jumlahPartikel = Math.min(Math.floor((width * height) / 8000), 65);
        const partikelArray = [];

        class Partikel {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.ukuran = Math.random() * 2.2 + 1.2;
                this.kecepatanX = (Math.random() - 0.5) * 0.6;
                this.kecepatanY = -Math.random() * 0.5 - 0.2;
                this.alpha = Math.random() * 0.5 + 0.25;
                this.targetAlpha = this.alpha;
                this.kecepatanAlpha = Math.random() * 0.01 + 0.005;
            }

            perbarui() {
                this.x += this.kecepatanX;
                this.y += this.kecepatanY;

                // Reset posisi saat keluar layar
                if (this.y < -10) {
                    this.y = height + 10;
                    this.x = Math.random() * width;
                }
                if (this.x < -10) this.x = width + 10;
                if (this.x > width + 10) this.x = -10;

                // Animasi kelap-kelip lembut
                if (Math.abs(this.alpha - this.targetAlpha) < 0.01) {
                    this.targetAlpha = Math.random() * 0.6 + 0.2;
                }
                if (this.alpha < this.targetAlpha) {
                    this.alpha += this.kecepatanAlpha;
                } else {
                    this.alpha -= this.kecepatanAlpha;
                }
            }

            gambar() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.ukuran, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${this.alpha})`;
                ctx.shadowBlur = 6;
                ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }

        for (let i = 0; i < jumlahPartikel; i++) {
            partikelArray.push(new Partikel());
        }

        // Menghubungkan Garis Antar Partikel (Constellation Net Effect Sintesa)
        const hubungkanGaris = () => {
            const jarakMaksimal = 110;
            for (let a = 0; a < partikelArray.length; a++) {
                for (let b = a + 1; b < partikelArray.length; b++) {
                    const dx = partikelArray[a].x - partikelArray[b].x;
                    const dy = partikelArray[a].y - partikelArray[b].y;
                    const jarak = Math.sqrt(dx * dx + dy * dy);

                    if (jarak < jarakMaksimal) {
                        const opasitas = (1 - jarak / jarakMaksimal) * 0.22;
                        ctx.strokeStyle = `rgba(255, 255, 255, ${opasitas})`;
                        ctx.lineWidth = 0.75;
                        ctx.beginPath();
                        ctx.moveTo(partikelArray[a].x, partikelArray[a].y);
                        ctx.lineTo(partikelArray[b].x, partikelArray[b].y);
                        ctx.stroke();
                    }
                }
            }
        };

        // Loop Animasi Canvas
        const animasi = () => {
            ctx.clearRect(0, 0, width, height);

            partikelArray.forEach((partikel) => {
                partikel.perbarui();
                partikel.gambar();
            });

            hubungkanGaris();

            animationFrameId = requestAnimationFrame(animasi);
        };

        animasi();

        return () => {
            window.removeEventListener('resize', tanganiResize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-0 rounded-[4rem]"
        />
    );
}


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
            if (['verifikasi', 'buat-akun', 'panduan', 'kata-sandi', 'kebijakan-privasi', 'syarat-dan-ketentuan'].includes(hash)) {
                return hash;
            }
            if (hash === 'masuk') return 'masuk';
        }
        return modeProp || 'masuk';
    };

    const [modeAktif, setModeAktif] = useState(ambilModeAwal);
    const [logoGagal, setLogoGagal] = useState(false);
    const [tahapKlaim, setTahapKlaim] = useState(1);
    const [tampilkanSandi, setTampilkanSandi] = useState(false);
    const [tampilkanSandiKlaim, setTampilkanSandiKlaim] = useState(false);
    const [tampilkanKonfirmasi, setTampilkanKonfirmasi] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [sedangTransisi, setSedangTransisi] = useState(false);
    const [tampilkanFormSurel, setTampilkanFormSurel] = useState(false);

    // State validasi verifikasi identitas (Tahap 1)
    const [statusValidasi, setStatusValidasi] = useState({ nik: null, nip_nis: null, tgl_lahir: null });
    const [sedangCekIdentitas, setSedangCekIdentitas] = useState(false);
    const [pesanTerklaim, setPesanTerklaim] = useState(null);

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

    const images = [
        '/images/login-1.png',
        '/images/login-2.png',
        '/images/login-3.png'
    ];

    const [statusGps, setStatusGps] = useState('meminta'); // 'meminta' | 'tersedia' | 'ditolak' | 'tidak_didukung'

    const simpanKoordinat = (lat, lng) => {
        const strLat = String(lat);
        const strLng = String(lng);
        sessionStorage.setItem('sso_user_lat', strLat);
        sessionStorage.setItem('sso_user_lng', strLng);
        localStorage.setItem('sso_user_lat', strLat);
        localStorage.setItem('sso_user_lng', strLng);
        document.cookie = `sso_user_lat=${strLat}; path=/; max-age=86400; SameSite=Lax`;
        document.cookie = `sso_user_lng=${strLng}; path=/; max-age=86400; SameSite=Lax`;
        setStatusGps('tersedia');
    };

    const mintaLokasiCepat = (onDone) => {
        if (!('geolocation' in navigator)) {
            setStatusGps('tidak_didukung');
            if (onDone) onDone(null, null);
            return;
        }

        const cachedLat = sessionStorage.getItem('sso_user_lat') || localStorage.getItem('sso_user_lat');
        const cachedLng = sessionStorage.getItem('sso_user_lng') || localStorage.getItem('sso_user_lng');

        if (cachedLat && cachedLng) {
            setStatusGps('tersedia');
        }

        // Pertama: Coba mode cepat (enableHighAccuracy: false) agar langsung dapat via seluler/wifi (< 300ms)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                simpanKoordinat(pos.coords.latitude, pos.coords.longitude);
                if (onDone) onDone(pos.coords.latitude, pos.coords.longitude);

                // Latar belakang: Coba presisi tinggi jika GPS satelit aktif
                navigator.geolocation.getCurrentPosition(
                    (posHigh) => simpanKoordinat(posHigh.coords.latitude, posHigh.coords.longitude),
                    () => {},
                    { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
                );
            },
            (err) => {
                // Fallback kedua: coba mode presisi jika mode cepat pertama gagal
                navigator.geolocation.getCurrentPosition(
                    (pos2) => {
                        simpanKoordinat(pos2.coords.latitude, pos2.coords.longitude);
                        if (onDone) onDone(pos2.coords.latitude, pos2.coords.longitude);
                    },
                    (err2) => {
                        console.warn('Geolocation blocked or timeout:', err2.message);
                        if (cachedLat && cachedLng) {
                            simpanKoordinat(cachedLat, cachedLng);
                            if (onDone) onDone(cachedLat, cachedLng);
                        } else {
                            setStatusGps('ditolak');
                            if (onDone) onDone(null, null);
                        }
                    },
                    { enableHighAccuracy: true, timeout: 3500, maximumAge: 300000 }
                );
            },
            { enableHighAccuracy: false, timeout: 3500, maximumAge: 300000 }
        );
    };

    const tampilkanPanduanIzinGps = () => {
        Swal.fire({
            title: '📍 Panduan Mengaktifkan Izin Lokasi',
            html: `
                <div class="text-left text-xs space-y-3 pt-2 text-slate-600 dark:text-slate-300">
                    <p class="font-bold text-slate-800 dark:text-white">Agar lokasi login Anda dapat tercatat di Audit Trail SSO, ikuti langkah berikut:</p>
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
            mintaLokasiCepat();
        });
    };

    // Rotasi gambar ilustrasi & Tangkap koordinat GPS awal
    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentImageIndex((prev) => (prev + 1) % images.length);
        }, 5000);

        mintaLokasiCepat();

        if ('permissions' in navigator && navigator.permissions.query) {
            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                if (result.state === 'denied') {
                    setStatusGps('ditolak');
                } else if (result.state === 'granted') {
                    mintaLokasiCepat();
                }
                result.onchange = () => {
                    if (result.state === 'granted') mintaLokasiCepat();
                    else if (result.state === 'denied') setStatusGps('ditolak');
                };
            }).catch(() => {});
        }

        return () => clearInterval(timer);
    }, []);

    const { auth } = usePage().props;

    // Standar Aplikasi Multinasional: Jika pengguna sudah punya sesi aktif,
    // langsung alihkan ke dasbor meskipun pengguna menekan tombol Back (←) di browser!
    useEffect(() => {
        if (auth?.user) {
            router.visit(route('dasbor'));
        }

        const handlePageShow = (e) => {
            if (e.persisted) {
                window.location.reload();
            }
        };
        window.addEventListener('pageshow', handlePageShow);
        return () => window.removeEventListener('pageshow', handlePageShow);
    }, [auth]);

    // Sinkronisasi hash URL dengan state mode
    useEffect(() => {
        const handleHashChange = () => {
            if (typeof window !== 'undefined') {
                const hash = window.location.hash.replace('#', '');
                if (['verifikasi', 'masuk', 'buat-akun', 'panduan', 'kata-sandi', 'kebijakan-privasi', 'syarat-dan-ketentuan'].includes(hash)) {
                    setModeAktif(hash);
                }
            }
        };

        if (typeof window !== 'undefined' && window.location.hash) {
            const currentHash = window.location.hash.replace('#', '');
            if (['verifikasi', 'masuk', 'buat-akun', 'panduan', 'kata-sandi', 'kebijakan-privasi', 'syarat-dan-ketentuan'].includes(currentHash)) {
                setModeAktif(currentHash);
            } else {
                window.location.hash = modeAktif;
            }
        } else if (typeof window !== 'undefined') {
            window.location.hash = modeAktif;
        }

        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    // Sinkronisasi dengan prop mode dari backend (hanya jika Hash URL di browser kosong)
    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.hash) {
            const hash = window.location.hash.replace('#', '');
            if (['verifikasi', 'masuk', 'buat-akun', 'panduan', 'kata-sandi', 'kebijakan-privasi', 'syarat-dan-ketentuan'].includes(hash)) {
                return; // Prioritaskan Hash URL jika pengguna secara eksplisit membuka URL dengan hash (#verifikasi)
            }
        }
        if (modeProp && modeProp !== modeAktif) {
            setModeAktif(modeProp);
            if (typeof window !== 'undefined') {
                window.location.hash = modeProp;
            }
            if (modeProp === 'verifikasi') {
                setTahapKlaim(1);
                setStatusValidasi({ nik: null, nip_nis: null, tgl_lahir: null });
                setPesanTerklaim(null);
            }
        }
    }, [modeProp]);

    // Buka form surel otomatis jika terdapat error dari login
    useEffect(() => {
        if (galatLogin?.email || galatLogin?.password || props.errors?.email || props.errors?.password) {
            setTampilkanFormSurel(true);
        }
    }, [galatLogin, props.errors]);

    // Menampilkan pesan notifikasi flash (sukses / error) dari backend
    useEffect(() => {
        if (props.flash?.error) {
            Swal.fire({
                icon: 'error',
                title: 'Akses Ditolak',
                text: props.flash.error,
                confirmButtonColor: '#0F91FC'
            });
        } else if (props.flash?.sukses) {
            Swal.fire({
                icon: 'success',
                title: 'Berhasil',
                text: props.flash.sukses,
                confirmButtonColor: '#0F91FC'
            });
        }
    }, [props.flash]);

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

        const getCookie = (name) => {
            if (typeof document === 'undefined') return null;
            const value = `; ${document.cookie}`;
            const parts = value.split(`; ${name}=`);
            if (parts.length === 2) return parts.pop().split(';').shift();
            return null;
        };

        const eksekusiSubmit = (latVal, lngVal) => {
            const finalLat = latVal || sessionStorage.getItem('sso_user_lat') || localStorage.getItem('sso_user_lat') || getCookie('sso_user_lat');
            const finalLng = lngVal || sessionStorage.getItem('sso_user_lng') || localStorage.getItem('sso_user_lng') || getCookie('sso_user_lng');

            transformLogin((data) => ({
                ...data,
                recaptcha_token: token,
                latitude: finalLat ? parseFloat(finalLat) : null,
                longitude: finalLng ? parseFloat(finalLng) : null,
            }));

            kirimLogin(route('login', params), {
                onFinish: () => resetLogin('password'),
            });
        };

        const existingLat = sessionStorage.getItem('sso_user_lat') || localStorage.getItem('sso_user_lat') || getCookie('sso_user_lat');
        const existingLng = sessionStorage.getItem('sso_user_lng') || localStorage.getItem('sso_user_lng') || getCookie('sso_user_lng');

        if (existingLat && existingLng) {
            eksekusiSubmit(existingLat, existingLng);
        } else {
            // Jika lokasi belum tersimpan, jalankan probe lokasi cepat max 1.5s sebelum submit
            mintaLokasiCepat((latRes, lngRes) => {
                eksekusiSubmit(latRes, lngRes);
            });
        }
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
                Swal.fire({
                    title: 'Kesalahan Koneksi',
                    text: 'Terjadi kesalahan koneksi saat memverifikasi data.',
                    icon: 'error',
                    confirmButtonColor: '#0F91FC',
                    customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5' }
                });
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

    // Apakah kotak biru ada di kiri (mode verifikasi, buat-akun, panduan, kata-sandi) atau kanan (mode masuk)
    const kotakBiruDiKiri = modeAktif !== 'masuk';

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
                            absolute inset-y-0 w-full bg-[#0F91FC] dark:bg-slate-950 z-0 lg:rounded-[4rem] overflow-hidden
                            transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]
                            ${kotakBiruDiKiri 
                                ? 'shadow-[30px_0_60px_-15px_rgba(0,0,0,0.3)]' 
                                : 'shadow-[-30px_0_60px_-15px_rgba(0,0,0,0.3)]'
                            }
                        `}>
                            {/* Partikel Sintesa Canvas Khusus Latar Belakang Biru */}
                            <KomponenPartikelSintesa />
                        </div>
                        
                        <div className="relative z-10 flex flex-col h-full py-8 text-white justify-center items-center flex-grow transition-all duration-700 select-none px-6 lg:px-14 text-center">
                            {/* Area Gambar Ilustrasi */}
                            <div className="flex-1 flex items-center justify-center w-full max-h-[50vh] py-2">
                                <img 
                                    key={currentImageIndex}
                                    alt="Ilustrasi Layanan Pendidikan" 
                                    className="max-h-[38vh] w-auto object-contain drop-shadow-2xl opacity-95 dark:opacity-90 animate-particle origin-center" 
                                    src={images[currentImageIndex]}
                                />
                            </div>

                            {/* Konten Teks di Bawah Gambar (Gaya SIMPKB) */}
                            <div className="flex flex-col items-center text-center space-y-2.5 max-w-md mx-auto pt-2 pb-2">
                                <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
                                    Selamat Datang di {settings?.nama_aplikasi || 'SSO Sekolah'}
                                </h2>

                                <div className="text-xs sm:text-sm font-semibold text-white space-y-0.5">
                                    <p>One <span className="font-extrabold text-white">Data</span> ♦ One <span className="font-extrabold text-white">App</span> ♦ One <span className="font-extrabold text-white">Network</span></p>
                                    <p>One <span className="font-extrabold text-white">Platform</span> ♦ One <span className="font-extrabold text-white">Screen</span></p>
                                </div>

                                <p className="text-[10px] sm:text-[11px] font-bold text-white/90 tracking-wide uppercase flex items-center justify-center gap-1.5 whitespace-nowrap">
                                    <span>{settings?.nama_sekolah || settings?.nama_instansi || 'PORTAL LAYANAN PENDIDIKAN TERPADU'}</span>
                                    <span className="text-white/50">|</span>
                                    <a 
                                        href="/kebijakan-privasi" 
                                        onClick={(e) => { e.preventDefault(); gantiMode('kebijakan-privasi'); }}
                                        className="hover:text-white hover:underline transition-all cursor-pointer"
                                    >
                                        Privacy Policy
                                    </a>
                                    <span className="text-white/50">|</span>
                                    <a 
                                        href="/syarat-dan-ketentuan" 
                                        onClick={(e) => { e.preventDefault(); gantiMode('syarat-dan-ketentuan'); }}
                                        className="hover:text-white hover:underline transition-all cursor-pointer"
                                    >
                                        Terms of Service
                                    </a>
                                </p>

                                {/* Slider Indicator Dots (SIMPKB Style) */}
                                <div className="flex items-center justify-center gap-2 pt-3">
                                    {images.map((_, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => setCurrentImageIndex(idx)}
                                            aria-label={`Slide ${idx + 1}`}
                                            className={`h-2 rounded-full transition-all duration-300 ${currentImageIndex === idx ? 'w-7 bg-white shadow-sm' : 'w-2 bg-white/40 hover:bg-white/70'}`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ============================================= */}
                    {/* FORMULIR MASUK (Sisi Kiri saat mode masuk)    */}
                    {/* ============================================= */}
                    <div className={`
                        absolute inset-y-0 w-full lg:w-1/2 left-0
                        flex flex-col justify-center px-6 lg:px-12 py-6 lg:py-8 z-10
                        overflow-y-auto scrollbar-none
                        transition-all duration-500
                        ${modeAktif === 'masuk' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
                    `}>
                        <div key={modeAktif === 'masuk' ? 'login-active' : 'login-hidden'} className={`w-full max-w-md mx-auto flex flex-col text-left items-start ${modeAktif === 'masuk' ? 'form-enter' : ''}`}>
                            
                            {/* Tampilan Khusus Mobile/Tablet (< 1024px): Logo, Nama SSO, dan Slogan Aksen Merah */}
                            <div className="flex lg:hidden flex-col items-center mb-6 select-none w-full text-center">
                                <div className="flex items-center gap-3 mb-2.5">
                                    <img 
                                        src={(!logoGagal && settings?.logo_primer_url) ? settings.logo_primer_url : 'https://support.nafii.my.id/icon/domains.png'} 
                                        alt={settings?.nama_aplikasi || 'Logo'} 
                                        className="w-11 h-11 object-contain shadow-sm rounded-xl"
                                        onError={() => setLogoGagal(true)}
                                    />
                                    <span className="text-2xl font-black text-[#081242] dark:text-white uppercase tracking-wider">
                                        {settings?.nama_aplikasi || 'SSO Sekolah'}
                                    </span>
                                </div>

                                {/* Slogan 2 Baris Aksen Biru #0F91FC Khusus Mobile */}
                                <div className="text-xs font-bold text-slate-700 dark:text-slate-200 space-y-0.5 mb-2">
                                    <p>One <span className="text-[#0F91FC] dark:text-[#38b6ff] font-black">Data</span> ♦ One <span className="text-[#0F91FC] dark:text-[#38b6ff] font-black">App</span> ♦ One <span className="text-[#0F91FC] dark:text-[#38b6ff] font-black">Network</span></p>
                                    <p>One <span className="text-[#0F91FC] dark:text-[#38b6ff] font-black">Platform</span> ♦ One <span className="text-[#0F91FC] dark:text-[#38b6ff] font-black">Screen</span></p>
                                </div>
                            </div>

                            {/* Heading Form Login - Single Account, Single Sign On login sebagai Judul Utama */}
                            <div className="flex flex-col items-start mb-6 select-none w-full text-left">
                                <h1 className="text-lg sm:text-xl lg:text-2xl font-extrabold leading-tight text-[#081242] dark:text-white tracking-tight whitespace-nowrap">
                                    Single Account, Single Sign On login
                                </h1>
                            </div>

                            {/* Status Pesan Sukses / Info */}
                            {status && modeAktif === 'masuk' && (
                                <div className="w-full mb-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/30 text-xs text-emerald-600 dark:text-emerald-400 font-medium text-left">
                                    {status}
                                </div>
                            )}

                            {/* Google OAuth / General Error Alert */}
                            {props.errors?.email && !dataLogin.email && (
                                <div className="w-full mb-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/30 text-xs text-rose-600 dark:text-rose-400 font-medium text-left">
                                    {props.errors.email}
                                </div>
                            )}

                            {/* Formulir Login (Ukuran & Spacing Sama dengan Verifikasi Identitas) */}
                            <div className="w-full space-y-5 text-left">
                                <div className="w-full space-y-3">
                                    {/* Google OAuth (Full Width) */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const rememberParam = dataLogin.remember ? '?remember=1' : '?remember=0';
                                            window.location.href = route('auth.google') + rememberParam;
                                        }}
                                        className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all focus:ring-2 focus:ring-slate-100 dark:focus:ring-slate-800 shadow-sm"
                                    >
                                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                        </svg>
                                        Masuk dengan Google
                                    </button>

                                    {/* Apple & Microsoft (Grid 2 Kolom - Dinonaktifkan) */}
                                    <div className="grid grid-cols-2 gap-2.5 w-full">
                                        <button
                                            type="button"
                                            disabled
                                            title="Masuk dengan Apple saat ini belum tersedia"
                                            className="flex items-center justify-center gap-2 px-3 py-3 bg-neutral-100 text-neutral-400 dark:bg-slate-800/80 dark:text-slate-500 border border-neutral-200 dark:border-slate-700/60 rounded-xl text-xs font-bold opacity-60 cursor-not-allowed select-none shadow-none"
                                        >
                                            <svg className="w-4 h-4 shrink-0 fill-current opacity-70" viewBox="0 0 24 24">
                                                <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.48C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.1 16.67C20.08 16.74 19.67 18.11 18.71 19.5M15.97 4.17C16.63 3.37 17.07 2.28 16.95 1C15.85 1.04 14.51 1.73 13.73 2.64C13.07 3.41 12.49 4.52 12.64 5.78C13.87 5.87 15.12 5.17 15.97 4.17Z" />
                                            </svg>
                                            Masuk dengan Apple
                                        </button>
                                        <button
                                            type="button"
                                            disabled
                                            title="Masuk dengan Microsoft saat ini belum tersedia"
                                            className="flex items-center justify-center gap-2 px-3 py-3 bg-neutral-100 text-neutral-400 dark:bg-slate-800/80 dark:text-slate-500 border border-neutral-200 dark:border-slate-700/60 rounded-xl text-xs font-bold opacity-60 cursor-not-allowed select-none shadow-none"
                                        >
                                            <svg className="w-3.5 h-3.5 shrink-0 opacity-70 grayscale" viewBox="0 0 23 23">
                                                <path fill="#f35325" d="M0 0h11v11H0z" />
                                                <path fill="#81bc06" d="M12 0h11v11H12z" />
                                                <path fill="#05a6f0" d="M0 12h11v11H0z" />
                                                <path fill="#ffba08" d="M12 12h11v11H12z" />
                                            </svg>
                                            Masuk dengan Microsoft
                                        </button>
                                    </div>
                                </div>

                                <div className="flex justify-center items-center gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400 py-1 select-none">
                                    <button type="button" onClick={() => gantiMode('panduan')} className="hover:text-[#0F91FC] dark:hover:text-[#ff6b39] transition-colors">Panduan</button>
                                    <span className="text-slate-300 dark:text-slate-600">•</span>
                                    <button type="button" onClick={() => gantiMode('verifikasi')} className="hover:text-[#0F91FC] dark:hover:text-[#ff6b39] transition-colors">Verifikasi Akun</button>
                                    <span className="text-slate-300 dark:text-slate-600">•</span>
                                    <button type="button" onClick={() => gantiMode('buat-akun')} className="hover:text-[#0F91FC] dark:hover:text-[#ff6b39] transition-colors">Buat Akun</button>
                                </div>

                                {/* Header Toggle "Atau masuk dengan surel" */}
                                <div className="flex items-center gap-3 py-1 select-none w-full">
                                    <div className={`flex-1 h-px bg-slate-200 dark:bg-slate-700 transition-opacity duration-500 ${tampilkanFormSurel ? 'opacity-100' : 'opacity-0'}`}></div>
                                    <button
                                        type="button"
                                        onClick={() => setTampilkanFormSurel(!tampilkanFormSurel)}
                                        className={`flex items-center justify-center gap-1.5 text-xs transition-all cursor-pointer py-1 ${
                                            !tampilkanFormSurel
                                                ? 'font-extrabold text-[#0F91FC] dark:text-[#38b6ff] hover:text-[#0a78d6] dark:hover:text-[#42a7ff]'
                                                : 'font-medium text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
                                        }`}
                                    >
                                        <span>Atau masuk dengan surel</span>
                                        <span className={`material-symbols-rounded text-xl transition-transform duration-500 ${tampilkanFormSurel ? 'rotate-180' : 'rotate-0'}`}>
                                            arrow_drop_down
                                        </span>
                                    </button>
                                    <div className={`flex-1 h-px bg-slate-200 dark:bg-slate-700 transition-opacity duration-500 ${tampilkanFormSurel ? 'opacity-100' : 'opacity-0'}`}></div>
                                </div>

                                {/* Form Login Manual (Smooth Collapsible Accordion) */}
                                <div 
                                    className={`
                                        grid transition-all duration-500 ease-in-out w-full
                                        ${tampilkanFormSurel 
                                            ? 'grid-rows-[1fr] opacity-100 mt-4 pointer-events-auto' 
                                            : 'grid-rows-[0fr] opacity-0 mt-0 pointer-events-none'
                                        }
                                    `}
                                >
                                    <div className="overflow-hidden">
                                        <form onSubmit={tanganiLogin} className="w-full space-y-5 text-left p-1">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider" htmlFor="email-login">
                                                    Surel
                                                </label>
                                                <input 
                                                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-inset focus:ring-[#0F91FC] dark:focus:ring-[#0F91FC] focus:border-[#0F91FC] py-3.5 px-4 text-sm transition-all placeholder:text-slate-400 outline-none"
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
                                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase tracking-wider" htmlFor="password-login">
                                                    Kata Sandi
                                                </label>
                                                <div className="relative">
                                                    <input 
                                                        className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-inset focus:ring-[#0F91FC] dark:focus:ring-[#0F91FC] focus:border-[#0F91FC] py-3.5 pl-4 pr-11 text-sm transition-all placeholder:text-slate-400 outline-none"
                                                        id="password-login" 
                                                        placeholder="••••••••" 
                                                        type={tampilkanSandi ? "text" : "password"}
                                                        value={dataLogin.password}
                                                        onChange={(e) => setDataLogin('password', e.target.value)}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
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

                                            <div className="flex items-center justify-between py-0.5">
                                                <label className="flex items-center cursor-pointer">
                                                    <Checkbox
                                                        name="remember"
                                                        checked={dataLogin.remember}
                                                        onChange={(e) => setDataLogin('remember', e.target.checked)}
                                                    />
                                                    <span className="ms-2 text-sm font-medium text-slate-500 dark:text-slate-400 select-none">
                                                        Ingat Saya
                                                    </span>
                                                </label>

                                                <button
                                                    type="button"
                                                    onClick={() => gantiMode('kata-sandi')}
                                                    className="text-xs font-semibold text-[#0F91FC] hover:text-[#0a78d6] dark:text-[#0F91FC] dark:hover:text-[#42a7ff] transition-colors"
                                                >
                                                    Lupa kata sandi?
                                                </button>
                                            </div>

                                            <button 
                                                className="w-full bg-[#081242] dark:bg-[#0F91FC] text-white font-bold py-3.5 px-6 rounded-xl hover:bg-slate-800 dark:hover:bg-[#0a78d6] transition-all text-xs uppercase tracking-widest mt-1 shadow-lg shadow-[#081242]/20 dark:shadow-[#0F91FC]/20 disabled:opacity-50"
                                                disabled={prosesLogin}
                                                type="submit"
                                            >
                                                Masuk Ke Portal
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            </div>

                            {/* Footer Note Khusus Halaman Masuk */}
                            <div className="w-full mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
                                <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed mx-auto">
                                    Masuk Aman & Terenkripsi • Hubungi Administrator jika terkendala
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ============================================= */}
                    {/* SISI KANAN (Saat mode != masuk) */}
                    {/* ============================================= */}
                    <div className={`
                        absolute inset-y-0 w-full lg:w-1/2 lg:left-1/2
                        flex flex-col justify-center px-6 lg:px-12 py-12 z-10
                        overflow-y-auto scrollbar-none
                        transition-all duration-500
                        ${modeAktif !== 'masuk' ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
                    `}>
                        {modeAktif === 'verifikasi' && (
                            <div key={modeAktif} className={`w-full max-w-md mx-auto flex flex-col text-left items-start ${modeAktif === 'verifikasi' ? 'form-enter' : ''}`}>
                            
                            {/* Tampilan Khusus Mobile/Tablet (< 1024px): Logo, Nama SSO, dan Slogan Aksen Merah */}
                            <div className="flex lg:hidden flex-col items-center mb-6 select-none w-full text-center">
                                <div className="flex items-center gap-3 mb-2.5">
                                    <img 
                                        src={(!logoGagal && settings?.logo_primer_url) ? settings.logo_primer_url : 'https://support.nafii.my.id/icon/domains.png'} 
                                        alt={settings?.nama_aplikasi || 'Logo'} 
                                        className="w-11 h-11 object-contain shadow-sm rounded-xl"
                                        onError={() => setLogoGagal(true)}
                                    />
                                    <span className="text-2xl font-black text-[#081242] dark:text-white uppercase tracking-wider">
                                        {settings?.nama_aplikasi || 'SSO Sekolah'}
                                    </span>
                                </div>

                                {/* Slogan 2 Baris Aksen Biru #0F91FC Khusus Mobile */}
                                <div className="text-xs font-bold text-slate-700 dark:text-slate-200 space-y-0.5 mb-2">
                                    <p>One <span className="text-[#0F91FC] dark:text-[#38b6ff] font-black">Data</span> ♦ One <span className="text-[#0F91FC] dark:text-[#38b6ff] font-black">App</span> ♦ One <span className="text-[#0F91FC] dark:text-[#38b6ff] font-black">Network</span></p>
                                    <p>One <span className="text-[#0F91FC] dark:text-[#38b6ff] font-black">Platform</span> ♦ One <span className="text-[#0F91FC] dark:text-[#38b6ff] font-black">Screen</span></p>
                                </div>
                            </div>
                            
                            {/* ===== TAHAP 1: Verifikasi Identitas ===== */}
                            {tahapKlaim === 1 && (
                                <>
                                    <div className="flex flex-col items-start mb-6 select-none w-full text-left">
                                        <h1 className="text-lg sm:text-xl lg:text-2xl font-extrabold leading-tight text-[#081242] dark:text-white tracking-tight whitespace-nowrap">
                                            Verifikasi Identitas
                                        </h1>
                                    </div>

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
                                                className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-inset focus:ring-[#0F91FC] dark:focus:ring-[#0F91FC] focus:border-[#0F91FC] py-3 px-4 transition-all placeholder:text-slate-400 outline-none"
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
                                                className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-inset focus:ring-[#0F91FC] dark:focus:ring-[#0F91FC] focus:border-[#0F91FC] py-3 px-4 transition-all placeholder:text-slate-400 outline-none"
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
                                                className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-inset focus:ring-[#0F91FC] dark:focus:ring-[#0F91FC] focus:border-[#0F91FC] py-3 px-4 transition-all placeholder:text-slate-400 outline-none"
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
                                        <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed mx-auto">
                                            Mohon masukkan kredensial resmi Anda sebagaimana terdaftar dalam sistem sekolah.
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

                                        <div className="flex flex-col items-center lg:items-start mb-6 select-none w-full text-center lg:text-left">
                                            <h1 className="text-lg sm:text-xl lg:text-2xl font-extrabold leading-tight text-[#081242] dark:text-white tracking-tight">
                                                Verifikasi Identitas Akademik
                                            </h1>
                                        </div>
                                        
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
                        )}

                        {/* ===== FITUR DALAM MASA PENGEMBANGAN (#buat-akun, #panduan, #kata-sandi) ===== */}
                        {['buat-akun', 'panduan', 'kata-sandi', 'kebijakan-privasi', 'syarat-dan-ketentuan'].includes(modeAktif) && (
                            <div key={modeAktif} className={`w-full max-w-md mx-auto flex flex-col text-left items-start ${modeAktif !== 'masuk' ? 'form-enter' : ''}`}>
                                
                                {/* Tampilan Khusus Mobile/Tablet (< 1024px): Logo, Nama SSO, dan Slogan Aksen Merah */}
                                <div className="flex lg:hidden flex-col items-center mb-6 select-none w-full text-center">
                                    <div className="flex items-center gap-3 mb-2.5">
                                        <img 
                                            src={(!logoGagal && settings?.logo_primer_url) ? settings.logo_primer_url : 'https://support.nafii.my.id/icon/domains.png'} 
                                            alt={settings?.nama_aplikasi || 'Logo'} 
                                            className="w-11 h-11 object-contain shadow-sm rounded-xl"
                                            onError={() => setLogoGagal(true)}
                                        />
                                        <span className="text-2xl font-black text-[#081242] dark:text-white uppercase tracking-wider">
                                            {settings?.nama_aplikasi || 'SSO Sekolah'}
                                        </span>
                                    </div>

                                    {/* Slogan 2 Baris Aksen Biru #0F91FC Khusus Mobile/Tablet */}
                                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200 space-y-0.5 mb-2">
                                        <p>One <span className="text-[#0F91FC] dark:text-[#38b6ff] font-black">Data</span> ♦ One <span className="text-[#0F91FC] dark:text-[#38b6ff] font-black">App</span> ♦ One <span className="text-[#0F91FC] dark:text-[#38b6ff] font-black">Network</span></p>
                                        <p>One <span className="text-[#0F91FC] dark:text-[#38b6ff] font-black">Platform</span> ♦ One <span className="text-[#0F91FC] dark:text-[#38b6ff] font-black">Screen</span></p>
                                    </div>
                                </div>

                                <h1 className="w-full text-left text-lg sm:text-xl lg:text-2xl font-extrabold leading-tight mb-6 text-[#081242] dark:text-white tracking-tight">
                                    {modeAktif === 'buat-akun' && 'Buat Akun Baru'}
                                    {modeAktif === 'panduan' && 'Panduan Penggunaan'}
                                    {modeAktif === 'kata-sandi' && 'Lupa Kata Sandi'}
                                    {modeAktif === 'kebijakan-privasi' && 'Kebijakan Privasi (Privacy Policy)'}
                                    {modeAktif === 'syarat-dan-ketentuan' && 'Syarat & Ketentuan (Terms of Service)'}
                                </h1>

                                {/* Card Informasional */}
                                <div className="w-full p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-4 mb-6 text-left">
                                    <div className="w-12 h-12 rounded-xl bg-[#0F91FC]/10 dark:bg-[#0F91FC]/20 flex items-center justify-center text-[#0F91FC] dark:text-[#38b6ff]">
                                        <span className="material-symbols-rounded text-2xl">
                                            {modeAktif === 'buat-akun' && 'engineering'}
                                            {modeAktif === 'panduan' && 'menu_book'}
                                            {modeAktif === 'kata-sandi' && 'lock_reset'}
                                            {modeAktif === 'kebijakan-privasi' && 'shield_lock'}
                                            {modeAktif === 'syarat-dan-ketentuan' && 'gavel'}
                                        </span>
                                    </div>
                                    <div>
                                        <h3 className="text-base font-bold text-[#081242] dark:text-white mb-1.5">
                                            {modeAktif === 'kebijakan-privasi' && 'Perlindungan & Keamanan Data Privasi'}
                                            {modeAktif === 'syarat-dan-ketentuan' && 'Ketentuan Penggunaan Portal SSO'}
                                            {!['kebijakan-privasi', 'syarat-dan-ketentuan'].includes(modeAktif) && 'Fitur Dalam Masa Pengembangan'}
                                        </h3>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                            {modeAktif === 'buat-akun' && 'Modul pendaftaran akun mandiri saat ini sedang dikembangkan oleh tim pengembang. Silakan gunakan fitur Verifikasi Akun untuk mengklaim akun sekolah Anda.'}
                                            {modeAktif === 'panduan' && 'Dokumentasi dan petunjuk penggunaan terpadu SSO Sekolah sedang dalam tahap penyusunan dan penyempurnaan.'}
                                            {modeAktif === 'kata-sandi' && 'Fitur pemulihan kata sandi mandiri sedang dalam tahap pengujian keamanan. Apabila Anda lupa kata sandi, Anda dapat masuk menggunakan Akun Google terdaftar lalu memperbarui kata sandi di menu Keamanan Akun, atau hubungi Administrator Sekolah Anda.'}
                                            {modeAktif === 'kebijakan-privasi' && 'Sistem Single Sign-On (SSO) Sekolah berkomitmen penuh dalam melindungi privasi data pribadi pengguna (Siswa, Guru, dan Tendik). Seluruh identitas kredensial, enkripsi kata sandi, serta log otentikasi disimpan dengan standar keamanan tinggi dan hanya digunakan untuk verifikasi akses ekosistem sekolah.'}
                                            {modeAktif === 'syarat-dan-ketentuan' && 'Dengan mengakses Portal SSO Sekolah, Pengguna setuju untuk menjaga kerahasiaan kata sandi pribadi, tidak memberikan kredensial kepada pihak manapun, serta menggunakannya secara sah demi kelancaran kegiatan akademik dan administrasi sekolah.'}
                                        </p>
                                    </div>
                                </div>

                                {/* Tombol Navigasi Aksi */}
                                <div className="w-full flex gap-3">
                                    <button 
                                        type="button"
                                        onClick={() => gantiMode('masuk')}
                                        className="flex-1 py-3.5 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all text-xs shadow-sm flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-rounded text-base">arrow_back</span>
                                        Kembali ke Masuk
                                    </button>

                                    {modeAktif === 'buat-akun' && (
                                        <button 
                                            type="button"
                                            onClick={() => gantiMode('verifikasi')}
                                            className="flex-1 bg-[#111827] dark:bg-[#0F91FC] text-white font-bold py-3.5 px-5 rounded-xl hover:bg-slate-800 dark:hover:bg-[#0a78d6] transition-all text-xs shadow-lg flex items-center justify-center gap-2 group"
                                        >
                                            Verifikasi Akun
                                            <span className="material-symbols-rounded text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                        </button>
                                    )}

                                    {modeAktif === 'kata-sandi' && (
                                        <button 
                                            type="button"
                                            onClick={() => {
                                                window.location.href = route('auth.google');
                                            }}
                                            className="flex-1 bg-[#4285F4] hover:bg-[#3367D6] text-white font-bold py-3.5 px-5 rounded-xl transition-all text-xs shadow-lg flex items-center justify-center gap-2 group"
                                        >
                                            Masuk via Google
                                            <span className="material-symbols-rounded text-base group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                        </button>
                                    )}
                                </div>

                                {/* Footer Note Disesuaikan untuk Setiap Mode */}
                                <div className="w-full mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 text-center">
                                    <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed mx-auto">
                                        {modeAktif === 'buat-akun' && 'Gunakan akun resmi yang telah didaftarkan oleh administrator sekolah Anda.'}
                                        {modeAktif === 'panduan' && 'Pusat Bantuan & Petunjuk Layanan Diri Portal SSO Sekolah.'}
                                        {modeAktif === 'kata-sandi' && 'Hubungi Administrator Sekolah jika Anda membutuhkan bantuan reset kata sandi.'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </main>
        </div>
    );
}
