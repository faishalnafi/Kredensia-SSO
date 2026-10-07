import React, { useState, useEffect, useRef } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import TataLetakUtama from '@/Layouts/TataLetakUtama';
import InputError from '@/Components/InputError';
import InputTanggal from '@/Components/InputTanggal';
import Swal from 'sweetalert2';
import axios from 'axios';

export default function KeamananAkun({ daftarSesi = [], pengguna = {}, pendingCorrection = null, twoFactor = {} }) {
    const isGuru = (pengguna.peran || []).some(p => p === 'Guru' || p === 'guru');
    const maxDigitNipNis = isGuru ? 18 : 10;
    const labelNipNis = isGuru ? 'NIP' : 'NISN';
    const placeholderNipNis = isGuru ? 'Masukkan 18 digit NIP' : 'Masukkan 10 digit NISN';

    // Form untuk Ganti Kata Sandi
    const formSandi = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    // Form untuk Pengajuan Perbaikan Data Profil
    const dataAwal = pendingCorrection || pengguna || {};
    const tanggalLahirAwal = dataAwal.tgl_lahir 
        ? (typeof dataAwal.tgl_lahir === 'string' ? dataAwal.tgl_lahir.substring(0, 10) : '') 
        : '';

    const formProfil = useForm({
        username: dataAwal.username || pengguna?.username || '',
        nama_lengkap: dataAwal.nama_lengkap || '',
        email: dataAwal.email || '',
        jk: dataAwal.jk || '',
        tgl_lahir: tanggalLahirAwal,
        nik: dataAwal.nik || '',
        nip_nis: dataAwal.nip_nis || '',
        no_telp: dataAwal.no_telp || '',
        alamat: dataAwal.alamat || '',
    });

    // State validasi & cek ketersediaan username secara real-time
    const usernameTersimpan = (pengguna?.username || '').toLowerCase();
    const usernamePendingSendiri = (pendingCorrection?.username || '').toLowerCase();
    const [statusUsername, setStatusUsername] = useState(() => {
        if (usernamePendingSendiri && usernamePendingSendiri !== usernameTersimpan) {
            return {
                status: 'milik_sendiri',
                tersedia: true,
                pesan: 'Username ini sedang Anda ajukan (menunggu persetujuan admin).',
            };
        }
        if (usernameTersimpan) {
            return {
                status: 'milik_sendiri',
                tersedia: true,
                pesan: 'Username aktif milik akun Anda saat ini.',
            };
        }
        return {
            status: 'kosong',
            tersedia: true,
            pesan: 'Opsional • Min. 3–30 karakter (a-z, 0-9, titik, garis bawah)',
        };
    });

    useEffect(() => {
        const nilaiBersih = (formProfil.data.username || '').trim().toLowerCase().replace(/^@+/, '');

        if (!nilaiBersih) {
            setStatusUsername({
                status: 'kosong',
                tersedia: true,
                pesan: 'Opsional • Min. 3–30 karakter (a-z, 0-9, titik, garis bawah)',
            });
            return;
        }

        if (nilaiBersih.length < 3) {
            setStatusUsername({
                status: 'tidak_valid',
                tersedia: false,
                pesan: `Minimal 3 karakter (${nilaiBersih.length}/3 karakter)`,
            });
            return;
        }

        if (nilaiBersih.length > 30) {
            setStatusUsername({
                status: 'tidak_valid',
                tersedia: false,
                pesan: 'Maksimal 30 karakter.',
            });
            return;
        }

        if (!/^[a-z0-9._]+$/.test(nilaiBersih)) {
            setStatusUsername({
                status: 'tidak_valid',
                tersedia: false,
                pesan: 'Hanya boleh huruf kecil (a-z), angka (0-9), titik (.), atau garis bawah (_).',
            });
            return;
        }

        if (!/^[a-z0-9]+([._][a-z0-9]+)*$/.test(nilaiBersih)) {
            setStatusUsername({
                status: 'tidak_valid',
                tersedia: false,
                pesan: 'Tidak boleh diawali/diakhiri atau berurutan titik (.) maupun garis bawah (_).',
            });
            return;
        }

        if (nilaiBersih === usernameTersimpan) {
            setStatusUsername({
                status: 'milik_sendiri',
                tersedia: true,
                pesan: 'Username aktif milik akun Anda saat ini.',
            });
            return;
        }

        if (nilaiBersih === usernamePendingSendiri) {
            setStatusUsername({
                status: 'milik_sendiri',
                tersedia: true,
                pesan: 'Username ini sedang Anda ajukan (menunggu persetujuan admin).',
            });
            return;
        }

        setStatusUsername({
            status: 'memeriksa',
            tersedia: false,
            pesan: 'Memeriksa ketersediaan username...',
        });

        let dibatalkan = false;
        const timer = setTimeout(() => {
            axios
                .post(route('keamanan.cek_username'), { username: nilaiBersih })
                .then((res) => {
                    if (!dibatalkan && res.data) {
                        setStatusUsername({
                            status: res.data.status,
                            tersedia: Boolean(res.data.tersedia),
                            pesan: res.data.pesan || '',
                        });
                    }
                })
                .catch(() => {
                    if (!dibatalkan) {
                        setStatusUsername({
                            status: 'tidak_valid',
                            tersedia: false,
                            pesan: 'Gagal memeriksa ketersediaan username.',
                        });
                    }
                });
        }, 300);

        return () => {
            dibatalkan = true;
            clearTimeout(timer);
        };
    }, [formProfil.data.username, usernameTersimpan]);

    const perbaruiKataSandi = (e) => {
        e.preventDefault();
        formSandi.put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => formSandi.reset(),
        });
    };

    const ajukanPerbaikanProfil = (e) => {
        e.preventDefault();
        if (statusUsername.status === 'terpakai' || statusUsername.status === 'tidak_valid' || statusUsername.status === 'memeriksa') {
            return;
        }
        formProfil.post(route('keamanan.ajukan_perubahan'), {
            preserveScroll: true
        });
    };

    // Fungsi untuk mengakhiri sesi perangkat tertentu
    const akhiriSesi = async (id) => {
        const res = await Swal.fire({
            title: 'Akhiri Sesi Perangkat?',
            text: 'Apakah Anda yakin ingin mengakhiri sesi perangkat ini? Perangkat tersebut akan otomatis keluar (logout).',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: '🚪 Ya, Akhiri Sesi',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5', cancelButton: 'rounded-xl font-bold px-5 py-2.5' }
        });

        if (res.isConfirmed) {
            router.delete(route('keamanan.sesi.hapus', id), {
                preserveScroll: true
            });
        }
    };

    // Fungsi untuk mengakhiri seluruh sesi perangkat lainnya
    const akhiriSesiLainnya = async () => {
        const res = await Swal.fire({
            title: 'Keluar dari Semua Sesi Lainnya?',
            text: 'Apakah Anda yakin ingin mengakhiri semua sesi perangkat lainnya? Semua browser lain yang terhubung dengan akun ini akan langsung keluar.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: '🚪 Ya, Keluar dari Sesi Lainnya',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5', cancelButton: 'rounded-xl font-bold px-5 py-2.5' }
        });

        if (res.isConfirmed) {
            router.post(route('keamanan.sesi.hapus_lainnya'), {}, {
                preserveScroll: true
            });
        }
    };

    // State & Form untuk Autentikasi Dua Faktor (2FA)
    const [modal2FAOpen, setModal2FAOpen] = useState(false);
    const [setup2FAData, setSetup2FAData] = useState(null);
    const [loadingSetup, setLoadingSetup] = useState(false);
    const [salinSecretSukses, setSalinSecretSukses] = useState(false);
    const [salinRecoverySukses, setSalinRecoverySukses] = useState(false);

    const modal2FARef = useRef(false);
    const sedangMuatSesiRef = useRef(false);

    useEffect(() => {
        modal2FARef.current = modal2FAOpen;
    }, [modal2FAOpen]);

    // Komunikasi 2 Arah Real-Time untuk Panel "Sesi Perangkat Aktif"
    // Mendengarkan event WebSocket (Reverb) + Sinkronisasi Berkala Otomatis tanpa perlu refresh halaman
    useEffect(() => {
        const muatUlangDaftarSesi = () => {
            if (modal2FARef.current || sedangMuatSesiRef.current || Swal.isVisible()) {
                return;
            }
            if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
                return;
            }
            sedangMuatSesiRef.current = true;
            router.reload({
                only: ['daftarSesi'],
                preserveScroll: true,
                preserveState: true,
                onFinish: () => {
                    sedangMuatSesiRef.current = false;
                },
            });
        };

        let namaKanalUser = null;
        let timerTunda = null;

        // 1. Kanal WebSocket Real-time (Laravel Reverb / Pusher)
        if (window.Echo && pengguna?.id) {
            namaKanalUser = `App.Models.User.${pengguna.id}`;
            const kanalUser = window.Echo.private(namaKanalUser);
            kanalUser.listen('.DaftarSesiDiperbarui', () => {
                muatUlangDaftarSesi();
                // Muat ulang sekali lagi setelah 450ms untuk memastikan commit tabel sessions telah selesai
                clearTimeout(timerTunda);
                timerTunda = setTimeout(muatUlangDaftarSesi, 450);
            });
        }

        // 2. Sinkronisasi berkala setiap 4 detik & saat jendela kembali aktif (menjamin deteksi otomatis 100%)
        const intervalId = setInterval(muatUlangDaftarSesi, 4000);
        const tanganiFokus = () => muatUlangDaftarSesi();

        window.addEventListener('focus', tanganiFokus);
        document.addEventListener('visibilitychange', tanganiFokus);

        return () => {
            clearInterval(intervalId);
            clearTimeout(timerTunda);
            window.removeEventListener('focus', tanganiFokus);
            document.removeEventListener('visibilitychange', tanganiFokus);
            if (namaKanalUser && window.Echo) {
                window.Echo.leave(namaKanalUser);
            }
        };
    }, [pengguna?.id]);

    const formKonfirmasi2FA = useForm({
        code: '',
    });

    // State tambahan untuk opsi MFA lengkap (Email OTP, WhatsApp OTP, Kode Cadangan 10 Digit, Passkey & Security Key)
    const [modalOtpMetode, setModalOtpMetode] = useState(null); // 'email' | 'whatsapp' | null
    const [infoOtpSetup, setInfoOtpSetup] = useState(null);
    const [loadingKirimOtpSetup, setLoadingKirimOtpSetup] = useState(false);
    const [modalKodeCadanganOpen, setModalKodeCadanganOpen] = useState(false);
    const [daftarKodeCadangan, setDaftarKodeCadangan] = useState(twoFactor?.recovery_codes_list || []);
    const [loadingRegenerasiKode, setLoadingRegenerasiKode] = useState(false);
    const [loadingWebAuthn, setLoadingWebAuthn] = useState(false);

    useEffect(() => {
        setDaftarKodeCadangan(twoFactor?.recovery_codes_list || []);
    }, [twoFactor?.recovery_codes_list]);

    useEffect(() => {
        modal2FARef.current = modal2FAOpen || Boolean(modalOtpMetode) || modalKodeCadanganOpen;
    }, [modal2FAOpen, modalOtpMetode, modalKodeCadanganOpen]);

    const formOtpMetode = useForm({
        metode: 'whatsapp',
        code: '',
    });

    const formatKode10Digit = (kode) => {
        const bersih = String(kode || '').replace(/\s+/g, '');
        if (/^\d{10}$/.test(bersih)) {
            return `${bersih.slice(0, 5)} ${bersih.slice(5)}`;
        }
        return kode;
    };

    const mulaiSetup2FA = async () => {
        setLoadingSetup(true);
        try {
            const res = await axios.post(route('keamanan.2fa.generate'));
            setSetup2FAData(res.data);
            formKonfirmasi2FA.reset();
            setSalinSecretSukses(false);
            setSalinRecoverySukses(false);
            setModal2FAOpen(true);
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Gagal Memulai 2FA',
                text: 'Terjadi kesalahan saat menyiapkan kode QR 2FA. Silakan coba lagi.',
                customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5' }
            });
        } finally {
            setLoadingSetup(false);
        }
    };

    const kirimKonfirmasi2FA = (e) => {
        e.preventDefault();
        formKonfirmasi2FA.post(route('keamanan.2fa.confirm'), {
            preserveScroll: true,
            onSuccess: () => {
                setModal2FAOpen(false);
                setSetup2FAData(null);
                Swal.fire({
                    icon: 'success',
                    title: 'Authenticator Aktif!',
                    text: 'Aplikasi Authenticator (TOTP) beserta 10 Kode Cadangan (10 digit) telah aktif.',
                    customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5' }
                });
            }
        });
    };

    // Buka modal aktivasi OTP Email atau OTP WhatsApp
    const mulaiSetupOtpMetode = async (metode) => {
        setLoadingKirimOtpSetup(true);
        try {
            const res = await axios.post(route('keamanan.2fa.kirim_otp_setup'), { metode });
            setInfoOtpSetup(res.data);
            formOtpMetode.setData({
                metode,
                code: res.data?.kode_simulasi ? String(res.data.kode_simulasi) : '',
            });
            formOtpMetode.clearErrors();
            setModalOtpMetode(metode);
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Tidak Dapat Mengirim OTP',
                text: err?.response?.data?.pesan || 'Pastikan nomor telepon / email Anda sudah terdaftar dengan benar.',
                customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5' },
            });
        } finally {
            setLoadingKirimOtpSetup(false);
        }
    };

    const konfirmasiOtpMetode = (e) => {
        e.preventDefault();
        formOtpMetode.post(route('keamanan.2fa.konfirmasi_otp'), {
            preserveScroll: true,
            onSuccess: () => {
                setModalOtpMetode(null);
                setInfoOtpSetup(null);
                Swal.fire({
                    icon: 'success',
                    title: 'Metode Verifikasi Aktif!',
                    text: 'Opsi verifikasi OTP berhasil ditambahkan ke akun Anda.',
                    timer: 2200,
                    showConfirmButton: false,
                    customClass: { popup: 'rounded-3xl' },
                });
            },
        });
    };

    // Kelola metode instan (aktifkan / nonaktifkan / jadikan_utama)
    const ubahStatusMetodeMfa = (metode, aksi) => {
        router.post(
            route('keamanan.2fa.kelola_metode'),
            { metode, aksi },
            { preserveScroll: true }
        );
    };

    // Buat ulang 10 Kode Cadangan 10 Digit
    const buatUlangKodeCadangan = async () => {
        setLoadingRegenerasiKode(true);
        try {
            const res = await axios.post(route('keamanan.2fa.regenerasi_kode'));
            if (res.data?.recovery_codes) {
                setDaftarKodeCadangan(res.data.recovery_codes);
                setModalKodeCadanganOpen(true);
                router.reload({ only: ['twoFactor'], preserveScroll: true, preserveState: true });
            }
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Gagal Membuat Kode Cadangan',
                text: 'Silakan coba beberapa saat lagi.',
                customClass: { popup: 'rounded-3xl' },
            });
        } finally {
            setLoadingRegenerasiKode(false);
        }
    };

    // Pendaftaran WebAuthn: Kunci Sandi (Passkey) atau Kunci Keamanan Fisik (Security Key)
    const daftarkanWebAuthn = async (jenis) => {
        if (!window.PublicKeyCredential || !navigator.credentials) {
            Swal.fire({
                icon: 'warning',
                title: 'Perangkat Tidak Mendukung',
                text: 'Browser Anda saat ini belum mendukung standar WebAuthn / FIDO2 untuk Kunci Sandi atau Kunci Keamanan.',
                customClass: { popup: 'rounded-3xl' },
            });
            return;
        }

        const labelDefault =
            jenis === 'security_key'
                ? 'Kunci Keamanan USB/NFC'
                : `Kunci Sandi (${navigator.platform || 'Perangkat Ini'})`;

        const { value: namaKunci, isConfirmed } = await Swal.fire({
            title: jenis === 'security_key' ? 'Daftarkan Kunci Keamanan Fisik' : 'Buat Kunci Sandi (Passkey)',
            text:
                jenis === 'security_key'
                    ? 'Masukkan nama label untuk kunci keamanan USB/NFC (YubiKey/FIDO2) Anda, lalu sentuh sensor kunci saat diminta browser.'
                    : 'Masukkan nama untuk Kunci Sandi biometrik perangkat ini (Windows Hello / Touch ID / Sidik Jari).',
            input: 'text',
            inputValue: labelDefault,
            showCancelButton: true,
            confirmButtonText: 'Lanjutkan Pendaftaran',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#0F91FC',
            customClass: {
                popup: 'rounded-3xl',
                input: 'rounded-xl text-sm',
                confirmButton: 'rounded-xl font-bold px-5 py-2.5',
                cancelButton: 'rounded-xl font-bold px-5 py-2.5',
            },
        });

        if (!isConfirmed || !namaKunci) return;

        setLoadingWebAuthn(true);
        try {
            const challengeBytes = new Uint8Array(32);
            window.crypto.getRandomValues(challengeBytes);

            const userIdBytes = new TextEncoder().encode(String(pengguna?.id || 'sso-user'));

            const createOptions = {
                publicKey: {
                    challenge: challengeBytes,
                    rp: {
                        name: 'SSO Sekolah Terpusat',
                        id: window.location.hostname,
                    },
                    user: {
                        id: userIdBytes,
                        name: pengguna?.email || 'user@sekolah.sch.id',
                        displayName: pengguna?.nama_lengkap || 'Pengguna SSO',
                    },
                    pubKeyCredParams: [
                        { type: 'public-key', alg: -7 },   // ES256
                        { type: 'public-key', alg: -257 }, // RS256
                    ],
                    authenticatorSelection: {
                        authenticatorAttachment: jenis === 'security_key' ? 'cross-platform' : 'platform',
                        userVerification: jenis === 'security_key' ? 'discouraged' : 'preferred',
                        residentKey: 'preferred',
                    },
                    timeout: 60000,
                    attestation: 'none',
                },
            };

            const credential = await navigator.credentials.create(createOptions);
            if (!credential) {
                throw new Error('Pendaftaran dibatalkan.');
            }

            const bytesToBase64Url = (buf) => {
                const bytes = new Uint8Array(buf);
                let bin = '';
                for (let i = 0; i < bytes.byteLength; i++) {
                    bin += String.fromCharCode(bytes[i]);
                }
                return window.btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
            };

            const credentialId = bytesToBase64Url(credential.rawId);
            const transports =
                typeof credential.response?.getTransports === 'function'
                    ? credential.response.getTransports()
                    : [];

            router.post(
                route('keamanan.2fa.webauthn.simpan'),
                {
                    credential_id: credentialId,
                    public_key: bytesToBase64Url(credential.response.attestationObject),
                    nama_kunci: namaKunci,
                    jenis,
                    transports,
                },
                { preserveScroll: true }
            );
        } catch (err) {
            if (err?.name !== 'NotAllowedError') {
                Swal.fire({
                    icon: 'error',
                    title: 'Gagal Mendaftarkan Kunci',
                    text: err?.message || 'Pastikan perangkat mendukung biometrik atau kunci keamanan USB terpasang.',
                    customClass: { popup: 'rounded-3xl' },
                });
            }
        } finally {
            setLoadingWebAuthn(false);
        }
    };

    const hapusKunciWebAuthn = async (item) => {
        const res = await Swal.fire({
            title: 'Hapus Kunci Keamanan?',
            text: `Kunci "${item.nama_kunci}" tidak akan bisa digunakan lagi untuk verifikasi masuk.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Hapus',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#ef4444',
            customClass: {
                popup: 'rounded-3xl',
                confirmButton: 'rounded-xl font-bold px-5 py-2.5',
                cancelButton: 'rounded-xl font-bold px-5 py-2.5',
            },
        });

        if (res.isConfirmed) {
            router.delete(route('keamanan.2fa.webauthn.hapus', item.id), {
                preserveScroll: true,
            });
        }
    };

    const konfirmasiNonaktifkan2FA = async () => {
        const { value: password } = await Swal.fire({
            title: 'Nonaktifkan Seluruh 2FA / MFA?',
            text: 'Masukkan kata sandi akun Anda untuk menonaktifkan seluruh metode verifikasi dua langkah.',
            input: 'password',
            inputPlaceholder: 'Kata sandi akun Anda saat ini',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: '🔓 Nonaktifkan Semua',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            customClass: {
                popup: 'rounded-3xl',
                input: 'rounded-xl text-center',
                confirmButton: 'rounded-xl font-bold px-5 py-2.5',
                cancelButton: 'rounded-xl font-bold px-5 py-2.5',
            }
        });

        if (password) {
            router.post(route('keamanan.2fa.disable'), {
                current_password: password,
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    Swal.fire({
                        icon: 'success',
                        title: '2FA / MFA Dinonaktifkan',
                        text: 'Seluruh metode Autentikasi Dua Faktor telah dinonaktifkan.',
                        customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5' }
                    });
                },
                onError: (err) => {
                    Swal.fire({
                        icon: 'error',
                        title: 'Gagal Menonaktifkan',
                        text: err.current_password || 'Kata sandi salah. Silakan coba kembali.',
                        customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5' }
                    });
                }
            });
        }
    };

    const unduhRecoveryCodes = (codes) => {
        if (!codes || codes.length === 0) return;
        const text = "KODE CADANGAN 10 DIGIT - 2FA / MFA (SSO SEKOLAH)\n" +
            "Email: " + (pengguna?.email || '') + "\n" +
            "Waktu: " + new Date().toLocaleString('id-ID') + "\n\n" +
            "PERINGATAN: Simpan 10 kode cadangan (10 digit) ini di tempat aman. Setiap kode hanya dapat dipakai 1 kali:\n" +
            codes.map((c, i) => `${i + 1}. ${formatKode10Digit(c)}`).join("\n");
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sso-kode-cadangan-10digit-${pengguna?.email || 'backup'}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    };


    return (
        <>
            <Head title="Keamanan Akun - SSO Sekolah" />
            
            <div className="w-full max-w-4xl mx-auto space-y-6">
                
                {/* 1. Panel Informasi Profil & Pengajuan Perbaikan Data */}
                <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 lg:p-8 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Informasi Profil & Pengajuan Perbaikan</h2>
                        <p className="text-xs text-slate-400 mt-1">Ubah formulir di bawah ini untuk mengajukan perbaikan data profil ke pihak Admin/Superadmin.</p>
                    </div>

                    {pendingCorrection && (
                        <div className="bg-amber-500/10 border border-amber-500/25 rounded-2xl p-4 flex gap-3 text-amber-700 dark:text-amber-400">
                            <span className="material-symbols-rounded text-xl flex-shrink-0">pending_actions</span>
                            <div className="text-xs leading-relaxed">
                                <span className="font-bold block">Ada pengajuan perbaikan data Anda yang sedang tertunda (Pending Approval).</span>
                                <span className="block mt-1">
                                    Pengajuan dikirim pada tanggal {new Date(pendingCorrection.submitted_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}. 
                                    Anda masih dapat mengubah data di bawah untuk memperbarui usulan perubahan.
                                </span>
                            </div>
                        </div>
                    )}

                    <form onSubmit={ajukanPerbaikanProfil} className="space-y-6">
                        {/* Grid Data Diri */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2">
                                    UUID (ID Pengguna)
                                </label>
                                <div className="relative flex items-center">
                                    <input 
                                        type="text" 
                                        value={pengguna?.id || ''} 
                                        readOnly 
                                        disabled
                                        className="w-full bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/80 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-600 dark:text-slate-400 select-all cursor-not-allowed pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (pengguna?.id) {
                                                navigator.clipboard.writeText(pengguna.id);
                                                Swal.fire({
                                                    icon: 'success',
                                                    title: 'UUID Disalin!',
                                                    text: 'ID Pengguna (UUID) berhasil disalin ke clipboard.',
                                                    toast: true,
                                                    position: 'top-end',
                                                    showConfirmButton: false,
                                                    timer: 2000,
                                                    timerProgressBar: true
                                                });
                                            }
                                        }}
                                        className="absolute right-2.5 p-1.5 text-slate-400 hover:text-[#0F91FC] dark:hover:text-[#ff6b39] transition-colors rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800"
                                        title="Salin UUID"
                                    >
                                        <span className="material-symbols-rounded text-lg">content_copy</span>
                                    </button>
                                </div>
                                <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
                                    UUID ini merupakan ID unik akun Anda di sistem SSO.
                                </span>
                            </div>

                            <div className="md:col-span-2">
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Username (Alias Akses Sistem)
                                    </label>
                                    {statusUsername.status === 'memeriksa' && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                                            <span className="material-symbols-rounded text-xs animate-spin">progress_activity</span>
                                            <span>{statusUsername.pesan}</span>
                                        </span>
                                    )}
                                    {statusUsername.status === 'tersedia' && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                                            <span className="material-symbols-rounded text-xs">check_circle</span>
                                            <span>{statusUsername.pesan}</span>
                                        </span>
                                    )}
                                    {statusUsername.status === 'terpakai' && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                                            <span className="material-symbols-rounded text-xs">cancel</span>
                                            <span>{statusUsername.pesan}</span>
                                        </span>
                                    )}
                                    {statusUsername.status === 'milik_sendiri' && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400">
                                            <span className="material-symbols-rounded text-xs">verified</span>
                                            <span>{statusUsername.pesan}</span>
                                        </span>
                                    )}
                                    {statusUsername.status === 'tidak_valid' && (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                                            <span className="material-symbols-rounded text-xs">error</span>
                                            <span>{statusUsername.pesan}</span>
                                        </span>
                                    )}
                                    {statusUsername.status === 'kosong' && (
                                        <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                                            {statusUsername.pesan}
                                        </span>
                                    )}
                                </div>
                                <div className="relative flex items-center">
                                    <span className="absolute left-3.5 text-sm font-bold text-slate-400 dark:text-slate-500 select-none pointer-events-none font-mono">
                                        @
                                    </span>
                                    <input
                                        type="text"
                                        maxLength={30}
                                        value={formProfil.data.username}
                                        onChange={e => {
                                            const val = e.target.value
                                                .toLowerCase()
                                                .replace(/\s+/g, '')
                                                .replace(/^@+/, '');
                                            formProfil.setData('username', val);
                                        }}
                                        placeholder="contoh: faishal.nafi atau faishal_01 (kosong secara bawaan)"
                                        className={`w-full bg-slate-50 dark:bg-slate-900 border rounded-xl pl-8 pr-16 py-2.5 text-sm font-mono focus:outline-none dark:text-white transition-colors ${
                                            statusUsername.status === 'terpakai' || statusUsername.status === 'tidak_valid'
                                                ? 'border-rose-400 dark:border-rose-500/80 focus:border-rose-500'
                                                : statusUsername.status === 'tersedia' || statusUsername.status === 'milik_sendiri'
                                                ? 'border-emerald-400 dark:border-emerald-500/70 focus:border-emerald-500'
                                                : 'border-slate-200 dark:border-slate-700 focus:border-[#0F91FC]'
                                        }`}
                                    />
                                    <span className="absolute right-3 text-[11px] font-mono text-slate-400 dark:text-slate-500 select-none pointer-events-none">
                                        {(formProfil.data.username || '').length}/30
                                    </span>
                                </div>
                                <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block leading-relaxed">
                                    Standar: minimal 3–30 karakter, hanya huruf kecil (<code className="font-mono">a-z</code>), angka (<code className="font-mono">0-9</code>), titik (<code className="font-mono">.</code>), atau garis bawah (<code className="font-mono">_</code>). Berfungsi sebagai alias pengganti Email / UUID untuk login & akses sistem.
                                </span>
                                <InputError message={formProfil.errors.username} className="mt-1" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2">Nama Lengkap</label>
                                <input 
                                    type="text" 
                                    value={formProfil.data.nama_lengkap}
                                    onChange={e => formProfil.setData('nama_lengkap', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white"
                                    required
                                />
                                <InputError message={formProfil.errors.nama_lengkap} className="mt-1" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider mb-2">Alamat Email</label>
                                <input 
                                    type="email" 
                                    value={formProfil.data.email}
                                    onChange={e => formProfil.setData('email', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white"
                                    required
                                />
                                <InputError message={formProfil.errors.email} className="mt-1" />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">NIK</label>
                                    <span className={`text-[11px] font-mono ${formProfil.data.nik?.length === 16 ? 'text-emerald-500 font-bold' : 'text-slate-400'}`}>
                                        {formProfil.data.nik?.length || 0}/16
                                    </span>
                                </div>
                                <input 
                                    type="text" 
                                    inputMode="numeric"
                                    maxLength={16}
                                    value={formProfil.data.nik}
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 16);
                                        formProfil.setData('nik', val);
                                    }}
                                    placeholder="Maksimal 16 digit angka NIK"
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white"
                                />
                                <InputError message={formProfil.errors.nik} className="mt-1" />
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                                        {labelNipNis}
                                    </label>
                                    <span className={`text-[11px] font-mono ${formProfil.data.nip_nis?.length === maxDigitNipNis ? 'text-emerald-500 font-bold' : 'text-slate-400'}`}>
                                        {formProfil.data.nip_nis?.length || 0}/{maxDigitNipNis}
                                    </span>
                                </div>
                                <input 
                                    type="text" 
                                    inputMode="numeric"
                                    maxLength={maxDigitNipNis}
                                    value={formProfil.data.nip_nis}
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, maxDigitNipNis);
                                        formProfil.setData('nip_nis', val);
                                    }}
                                    placeholder={placeholderNipNis}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white"
                                />
                                <InputError message={formProfil.errors.nip_nis} className="mt-1" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-2">Nomor Telepon</label>
                                <input 
                                    type="text" 
                                    value={formProfil.data.no_telp}
                                    onChange={e => formProfil.setData('no_telp', e.target.value)}
                                    placeholder="Masukkan Nomor Telepon"
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white"
                                />
                                <InputError message={formProfil.errors.no_telp} className="mt-1" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-2">Jenis Kelamin</label>
                                <select 
                                    value={formProfil.data.jk}
                                    onChange={e => formProfil.setData('jk', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white"
                                >
                                    <option value="">Pilih Jenis Kelamin</option>
                                    <option value="L">Laki-laki</option>
                                    <option value="P">Perempuan</option>
                                </select>
                                <InputError message={formProfil.errors.jk} className="mt-1" />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Tanggal Lahir</label>
                                <InputTanggal 
                                    id="tgl_lahir" 
                                    name="tgl_lahir"
                                    value={formProfil.data.tgl_lahir}
                                    onChange={e => formProfil.setData('tgl_lahir', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white"
                                />
                                <InputError message={formProfil.errors.tgl_lahir} className="mt-1" />
                            </div>

                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-2">Alamat Lengkap</label>
                                <textarea 
                                    value={formProfil.data.alamat}
                                    onChange={e => formProfil.setData('alamat', e.target.value)}
                                    placeholder="Masukkan Alamat Lengkap"
                                    rows="2"
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white resize-none"
                                ></textarea>
                                <InputError message={formProfil.errors.alamat} className="mt-1" />
                            </div>
                        </div>

                        <div className="flex justify-end pt-2">
                            <button 
                                type="submit"
                                disabled={formProfil.processing || statusUsername.status === 'terpakai' || statusUsername.status === 'tidak_valid' || statusUsername.status === 'memeriksa'}
                                className="bg-[#0F91FC] hover:bg-[#0a78d6] text-white px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-[#0F91FC]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                            >
                                <span className="material-symbols-rounded text-sm">send</span>
                                {formProfil.processing ? 'Menyimpan...' : (pendingCorrection ? 'Simpan & Kirim Ulang Pengajuan' : 'Simpan & Ajukan Perubahan Data')}
                            </button>
                        </div>
                    </form>
                </div>

                {/* 2. Panel Ganti Kata Sandi */}
                <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 lg:p-8 border border-slate-100 dark:border-slate-700/50 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Ganti Kata Sandi</h2>
                    
                    <form onSubmit={perbaruiKataSandi} className="space-y-4 max-w-md">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                                Kata Sandi Saat Ini
                            </label>
                            <input 
                                type="password" 
                                value={formSandi.data.current_password}
                                onChange={e => formSandi.setData('current_password', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white"
                                required
                            />
                            <InputError message={formSandi.errors.current_password} className="mt-2" />
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                                Kata Sandi Baru
                            </label>
                            <input 
                                type="password" 
                                value={formSandi.data.password}
                                onChange={e => formSandi.setData('password', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white"
                                required
                            />
                            <InputError message={formSandi.errors.password} className="mt-2" />
                        </div>
                        
                        <div>
                            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                                Konfirmasi Kata Sandi Baru
                            </label>
                            <input 
                                type="password" 
                                value={formSandi.data.password_confirmation}
                                onChange={e => formSandi.setData('password_confirmation', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white"
                                required
                            />
                            <InputError message={formSandi.errors.password_confirmation} className="mt-2" />
                        </div>
                        
                        <button 
                            type="submit"
                            disabled={formSandi.processing}
                            className="bg-[#0F91FC] hover:bg-[#0a78d6] text-white px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-[#0F91FC]/20 disabled:opacity-50"
                        >
                            {formSandi.processing ? 'Menyimpan...' : 'Perbarui Kata Sandi'}
                        </button>
                    </form>
                </div>

                {/* 3. Panel Autentikasi Dua Faktor & Multi-Faktor (2FA / MFA) */}
                <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 lg:p-8 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-[#0F91FC]/10 text-[#0F91FC] flex items-center justify-center flex-shrink-0">
                                <span className="material-symbols-rounded text-2xl">shield_lock</span>
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                                        Verifikasi 2 Langkah & Multi-Faktor (2FA / MFA)
                                    </h2>
                                    {twoFactor?.enabled ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                            {(twoFactor?.active_methods || []).length} Metode Aktif
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                            Belum Aktif
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Pilih berbagai metode verifikasi keamanan: Dialog Perangkat ala Google, Authenticator, OTP WhatsApp & Email, Kunci Sandi (Passkey), Kunci Keamanan Fisik, dan Kode Cadangan 10 Digit.
                                </p>
                            </div>
                        </div>

                        {twoFactor?.enabled && (
                            <button
                                type="button"
                                onClick={konfirmasiNonaktifkan2FA}
                                className="text-xs bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 font-bold px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-800 transition-all flex items-center gap-1.5 self-start sm:self-center shadow-sm shrink-0"
                            >
                                <span className="material-symbols-rounded text-base">lock_open</span>
                                <span>Matikan Semua 2FA</span>
                            </button>
                        )}
                    </div>

                    {twoFactor?.is_required && !twoFactor?.enabled && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex gap-3 text-amber-700 dark:text-amber-400">
                            <span className="material-symbols-rounded text-2xl flex-shrink-0">warning</span>
                            <div className="text-xs leading-relaxed">
                                <span className="font-bold block">Kebijakan Keamanan Sekolah Mewajibkan 2FA / MFA</span>
                                <span className="block mt-0.5">
                                    Peran akun Anda diwajibkan untuk mengaktifkan minimal satu metode Verifikasi Dua Langkah. Silakan aktifkan salah satu metode di bawah ini.
                                </span>
                            </div>
                        </div>
                    )}

                    {/* Bento Grid Opsi Metode Verifikasi MFA */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 1. Dialog Perangkat Mirip Google (Google Prompt) */}
                        {(() => {
                            const aktif = (twoFactor?.active_methods || []).includes('google_prompt');
                            const utama = twoFactor?.type === 'google_prompt' && twoFactor?.enabled;
                            return (
                                <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${aktif ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/10' : 'border-slate-200/80 dark:border-slate-700/60 bg-slate-50/60 dark:bg-slate-900/40'}`}>
                                    <div className="flex items-start gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${aktif ? 'bg-emerald-500 text-white' : 'bg-[#0F91FC]/10 text-[#0F91FC]'}`}>
                                            <span className="material-symbols-rounded text-xl">phonelink_lock</span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Dialog Perangkat (Mirip Google)</h3>
                                                {utama && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0F91FC] text-white">Utama</span>}
                                                {aktif && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">Aktif</span>}
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                                Ketuk "Ya, Itu Saya" dan cocokkan angka 2 digit pada dialog pop-up yang muncul otomatis di perangkat Anda yang sedang aktif.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                                        {aktif && !utama && (
                                            <button
                                                type="button"
                                                onClick={() => ubahStatusMetodeMfa('google_prompt', 'jadikan_utama')}
                                                className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-[#0F91FC] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                                            >
                                                Jadikan Utama
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => ubahStatusMetodeMfa('google_prompt', aktif ? 'nonaktifkan' : 'aktifkan')}
                                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                                                aktif
                                                    ? 'border border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                                                    : 'bg-[#0F91FC] hover:bg-[#0a78d6] text-white shadow-sm'
                                            }`}
                                        >
                                            {aktif ? 'Nonaktifkan' : 'Aktifkan Dialog Google'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* 2. Aplikasi Authenticator (TOTP 6 Digit) */}
                        {(() => {
                            const aktif = (twoFactor?.active_methods || []).includes('totp') && twoFactor?.has_totp_secret;
                            const utama = twoFactor?.type === 'totp' && twoFactor?.enabled;
                            return (
                                <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${aktif ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/10' : 'border-slate-200/80 dark:border-slate-700/60 bg-slate-50/60 dark:bg-slate-900/40'}`}>
                                    <div className="flex items-start gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${aktif ? 'bg-emerald-500 text-white' : 'bg-[#0F91FC]/10 text-[#0F91FC]'}`}>
                                            <span className="material-symbols-rounded text-xl">qr_code_scanner</span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Aplikasi Authenticator (TOTP)</h3>
                                                {utama && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0F91FC] text-white">Utama</span>}
                                                {aktif && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">Terkonfigurasi</span>}
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                                Dapatkan kode 6 digit yang diperbarui setiap 30 detik melalui Google Authenticator, Authy, atau Microsoft Authenticator.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                                        {aktif && !utama && (
                                            <button
                                                type="button"
                                                onClick={() => ubahStatusMetodeMfa('totp', 'jadikan_utama')}
                                                className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-[#0F91FC] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                                            >
                                                Jadikan Utama
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={mulaiSetup2FA}
                                            disabled={loadingSetup}
                                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#0F91FC] hover:bg-[#0a78d6] text-white shadow-sm transition disabled:opacity-50"
                                        >
                                            {loadingSetup ? 'Menyiapkan...' : aktif ? 'Atur Ulang QR Code' : 'Pindai QR Authenticator'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* 3. OTP Nomor Telepon via WhatsApp */}
                        {(() => {
                            const aktif = (twoFactor?.active_methods || []).includes('whatsapp');
                            const utama = twoFactor?.type === 'whatsapp' && twoFactor?.enabled;
                            return (
                                <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${aktif ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/10' : 'border-slate-200/80 dark:border-slate-700/60 bg-slate-50/60 dark:bg-slate-900/40'}`}>
                                    <div className="flex items-start gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${aktif ? 'bg-emerald-500 text-white' : 'bg-emerald-500/10 text-emerald-600'}`}>
                                            <span className="material-symbols-rounded text-xl">chat</span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <h3 className="text-sm font-bold text-slate-800 dark:text-white">OTP No. Telp via WhatsApp</h3>
                                                {utama && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0F91FC] text-white">Utama</span>}
                                                {aktif && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">Aktif</span>}
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                                Kirim kode OTP 6 digit ke nomor WhatsApp Anda:{' '}
                                                <strong className="text-slate-700 dark:text-slate-200 font-mono">
                                                    {twoFactor?.no_telp_masked || 'Belum diatur'}
                                                </strong>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                                        {aktif && !utama && (
                                            <button
                                                type="button"
                                                onClick={() => ubahStatusMetodeMfa('whatsapp', 'jadikan_utama')}
                                                className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-[#0F91FC] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                                            >
                                                Jadikan Utama
                                            </button>
                                        )}
                                        {aktif && (
                                            <button
                                                type="button"
                                                onClick={() => ubahStatusMetodeMfa('whatsapp', 'nonaktifkan')}
                                                className="px-3 py-1.5 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                                            >
                                                Nonaktifkan
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            disabled={loadingKirimOtpSetup}
                                            onClick={() => mulaiSetupOtpMetode('whatsapp')}
                                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition disabled:opacity-50"
                                        >
                                            {aktif ? 'Uji Kirim OTP WA' : 'Verifikasi & Aktifkan WA'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* 4. OTP Nomor Telepon via SMS (Disediakan Namun Nonaktif) */}
                        <div className="p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900/30 opacity-75 flex flex-col justify-between gap-3">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 flex items-center justify-center shrink-0">
                                    <span className="material-symbols-rounded text-xl">sms</span>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">OTP No. Telp via SMS</h3>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                                            Nonaktif
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                        Pengiriman kode OTP 6 digit melalui pesan singkat SMS seluler ke{' '}
                                        <span className="font-mono">{twoFactor?.no_telp_masked || 'nomor telepon Anda'}</span>.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-slate-800">
                                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                                    Gunakan OTP WhatsApp atau Email
                                </span>
                                <button
                                    type="button"
                                    disabled
                                    className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                                >
                                    SMS Nonaktif
                                </button>
                            </div>
                        </div>

                        {/* 5. OTP via Email */}
                        {(() => {
                            const aktif = (twoFactor?.active_methods || []).includes('email');
                            const utama = twoFactor?.type === 'email' && twoFactor?.enabled;
                            return (
                                <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${aktif ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/10' : 'border-slate-200/80 dark:border-slate-700/60 bg-slate-50/60 dark:bg-slate-900/40'}`}>
                                    <div className="flex items-start gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${aktif ? 'bg-emerald-500 text-white' : 'bg-[#0F91FC]/10 text-[#0F91FC]'}`}>
                                            <span className="material-symbols-rounded text-xl">mail</span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <h3 className="text-sm font-bold text-slate-800 dark:text-white">OTP via Email</h3>
                                                {utama && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0F91FC] text-white">Utama</span>}
                                                {aktif && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">Aktif</span>}
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                                Kirim kode OTP 6 digit ke alamat email resmi akun Anda:{' '}
                                                <strong className="text-slate-700 dark:text-slate-200 font-mono">
                                                    {twoFactor?.email_masked || pengguna?.email}
                                                </strong>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                                        {aktif && !utama && (
                                            <button
                                                type="button"
                                                onClick={() => ubahStatusMetodeMfa('email', 'jadikan_utama')}
                                                className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-[#0F91FC] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                                            >
                                                Jadikan Utama
                                            </button>
                                        )}
                                        {aktif && (
                                            <button
                                                type="button"
                                                onClick={() => ubahStatusMetodeMfa('email', 'nonaktifkan')}
                                                className="px-3 py-1.5 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                                            >
                                                Nonaktifkan
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            disabled={loadingKirimOtpSetup}
                                            onClick={() => mulaiSetupOtpMetode('email')}
                                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#0F91FC] hover:bg-[#0a78d6] text-white shadow-sm transition disabled:opacity-50"
                                        >
                                            {aktif ? 'Uji Kirim OTP Email' : 'Verifikasi & Aktifkan Email'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* 6. Kode Cadangan 10 Digit (Backup Codes) */}
                        {(() => {
                            const jmlKode = (daftarKodeCadangan || []).length;
                            return (
                                <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${jmlKode > 0 ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/10' : 'border-slate-200/80 dark:border-slate-700/60 bg-slate-50/60 dark:bg-slate-900/40'}`}>
                                    <div className="flex items-start gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${jmlKode > 0 ? 'bg-emerald-500 text-white' : 'bg-indigo-500/10 text-indigo-600'}`}>
                                            <span className="material-symbols-rounded text-xl">pin</span>
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-1.5">
                                                <h3 className="text-sm font-bold text-slate-800 dark:text-white">Kode Cadangan 10 Digit</h3>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${jmlKode > 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                                    {jmlKode} Kode Tersedia
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                                10 kode angka darurat (masing-masing 10 digit) untuk masuk saat Anda tidak membawa ponsel atau kunci keamanan.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                                        {jmlKode > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => setModalKodeCadanganOpen(true)}
                                                className="px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition"
                                            >
                                                Lihat Kode (10 Digit)
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            disabled={loadingRegenerasiKode}
                                            onClick={buatUlangKodeCadangan}
                                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition disabled:opacity-50"
                                        >
                                            {loadingRegenerasiKode ? 'Membuat...' : jmlKode > 0 ? 'Buat Ulang 10 Kode' : 'Buat 10 Kode Cadangan'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* 7. Kunci Sandi (Passkey Biometrik) */}
                        {(() => {
                            const daftarPasskey = (twoFactor?.passkeys || []).filter((k) => (k.jenis || 'passkey') === 'passkey');
                            const utama = twoFactor?.type === 'passkey' && twoFactor?.enabled;
                            return (
                                <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${daftarPasskey.length > 0 ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/10' : 'border-slate-200/80 dark:border-slate-700/60 bg-slate-50/60 dark:bg-slate-900/40'}`}>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${daftarPasskey.length > 0 ? 'bg-emerald-500 text-white' : 'bg-[#0F91FC]/10 text-[#0F91FC]'}`}>
                                                <span className="material-symbols-rounded text-xl">fingerprint</span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">Kunci Sandi (Passkey)</h3>
                                                    {utama && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0F91FC] text-white">Utama</span>}
                                                    {daftarPasskey.length > 0 && (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                                                            {daftarPasskey.length} Terdaftar
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                                    Verifikasi biometrik instan menggunakan Sidik Jari, Face ID, Touch ID, atau Windows Hello di perangkat ini.
                                                </p>
                                            </div>
                                        </div>

                                        {daftarPasskey.length > 0 && (
                                            <div className="space-y-1.5 pl-1">
                                                {daftarPasskey.map((pk) => (
                                                    <div key={pk.id} className="flex items-center justify-between text-xs bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200/70 dark:border-slate-800">
                                                        <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">{pk.nama_kunci}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => hapusKunciWebAuthn(pk)}
                                                            className="text-rose-500 hover:text-rose-700 font-bold text-[11px] ml-2"
                                                        >
                                                            Hapus
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                                        {daftarPasskey.length > 0 && !utama && (
                                            <button
                                                type="button"
                                                onClick={() => ubahStatusMetodeMfa('passkey', 'jadikan_utama')}
                                                className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-[#0F91FC] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                                            >
                                                Jadikan Utama
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            disabled={loadingWebAuthn}
                                            onClick={() => daftarkanWebAuthn('passkey')}
                                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#0F91FC] hover:bg-[#0a78d6] text-white shadow-sm transition disabled:opacity-50"
                                        >
                                            + Tambah Kunci Sandi
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* 8. Kunci Keamanan Fisik (Hardware Security Key USB / NFC) */}
                        {(() => {
                            const daftarSecKey = (twoFactor?.passkeys || []).filter((k) => k.jenis === 'security_key');
                            const utama = twoFactor?.type === 'security_key' && twoFactor?.enabled;
                            return (
                                <div className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${daftarSecKey.length > 0 ? 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/30 dark:bg-emerald-950/10' : 'border-slate-200/80 dark:border-slate-700/60 bg-slate-50/60 dark:bg-slate-900/40'}`}>
                                    <div className="space-y-3">
                                        <div className="flex items-start gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${daftarSecKey.length > 0 ? 'bg-emerald-500 text-white' : 'bg-[#0F91FC]/10 text-[#0F91FC]'}`}>
                                                <span className="material-symbols-rounded text-xl">usb</span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-1.5">
                                                    <h3 className="text-sm font-bold text-slate-800 dark:text-white">Kunci Keamanan (Security Key)</h3>
                                                    {utama && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#0F91FC] text-white">Utama</span>}
                                                    {daftarSecKey.length > 0 && (
                                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                                                            {daftarSecKey.length} Terdaftar
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                                    Gunakan kunci perangkat keras FIDO2 melalui USB, NFC, atau Bluetooth (seperti YubiKey / Google Titan).
                                                </p>
                                            </div>
                                        </div>

                                        {daftarSecKey.length > 0 && (
                                            <div className="space-y-1.5 pl-1">
                                                {daftarSecKey.map((sk) => (
                                                    <div key={sk.id} className="flex items-center justify-between text-xs bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200/70 dark:border-slate-800">
                                                        <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">{sk.nama_kunci}</span>
                                                        <button
                                                            type="button"
                                                            onClick={() => hapusKunciWebAuthn(sk)}
                                                            className="text-rose-500 hover:text-rose-700 font-bold text-[11px] ml-2"
                                                        >
                                                            Hapus
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800">
                                        {daftarSecKey.length > 0 && !utama && (
                                            <button
                                                type="button"
                                                onClick={() => ubahStatusMetodeMfa('security_key', 'jadikan_utama')}
                                                className="px-3 py-1.5 rounded-xl text-[11px] font-bold text-[#0F91FC] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition"
                                            >
                                                Jadikan Utama
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            disabled={loadingWebAuthn}
                                            onClick={() => daftarkanWebAuthn('security_key')}
                                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#0F91FC] hover:bg-[#0a78d6] text-white shadow-sm transition disabled:opacity-50"
                                        >
                                            + Daftarkan Kunci Keamanan
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* Modal 1: Setup Authenticator TOTP & 10 Kode Cadangan 10 Digit */}
                {modal2FAOpen && setup2FAData && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
                            <button
                                type="button"
                                onClick={() => setModal2FAOpen(false)}
                                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <span className="material-symbols-rounded text-xl">close</span>
                            </button>

                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-[#0F91FC]/10 text-[#0F91FC] flex items-center justify-center mb-3">
                                    <span className="material-symbols-rounded text-2xl">qr_code_2</span>
                                </div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white">
                                    Setup Aplikasi Authenticator (TOTP)
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Pindai QR Code di bawah dengan Google Authenticator atau Authy, lalu simpan 10 Kode Cadangan (10 digit).
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                                    <span className="w-5 h-5 rounded-full bg-[#0F91FC] text-white flex items-center justify-center text-[11px]">1</span>
                                    <span>Pindai QR Code dengan Ponsel</span>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                                    <img
                                        src={setup2FAData.qr_code_url}
                                        alt="QR Code 2FA"
                                        className="w-44 h-44 mx-auto rounded-xl shadow-md border border-white dark:border-slate-800"
                                    />
                                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
                                        Buka Google Authenticator atau Authy, pilih "Scan QR code".
                                    </p>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                                        Atau masukkan kunci rahasia manual:
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="text"
                                            readOnly
                                            value={setup2FAData.secret}
                                            className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 dark:text-slate-300 font-bold select-all text-center tracking-widest"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(setup2FAData.secret);
                                                setSalinSecretSukses(true);
                                                setTimeout(() => setSalinSecretSukses(false), 2000);
                                            }}
                                            className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 flex-shrink-0"
                                        >
                                            <span className="material-symbols-rounded text-sm">
                                                {salinSecretSukses ? 'check' : 'content_copy'}
                                            </span>
                                            <span>{salinSecretSukses ? 'Disalin' : 'Salin'}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                                        <span className="w-5 h-5 rounded-full bg-[#0F91FC] text-white flex items-center justify-center text-[11px]">2</span>
                                        <span>Kode Cadangan 10 Digit (10 Kode)</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => unduhRecoveryCodes(setup2FAData.recovery_codes)}
                                        className="text-[11px] text-[#0F91FC] hover:underline font-bold flex items-center gap-1"
                                    >
                                        <span className="material-symbols-rounded text-xs">download</span>
                                        <span>Unduh .TXT</span>
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                                    {(setup2FAData.recovery_codes || []).map((kode, idx) => (
                                        <div
                                            key={idx}
                                            className="font-mono text-xs font-bold text-center py-1.5 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300 tracking-wider"
                                        >
                                            {formatKode10Digit(kode)}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <form onSubmit={kirimKonfirmasi2FA} className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                                        <span className="w-5 h-5 rounded-full bg-[#0F91FC] text-white flex items-center justify-center text-[11px]">3</span>
                                        <span>Verifikasi Kode OTP 6 Digit</span>
                                    </div>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        autoFocus
                                        value={formKonfirmasi2FA.data.code}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                            formKonfirmasi2FA.setData('code', val);
                                        }}
                                        placeholder="000000"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 text-center font-mono text-2xl font-black tracking-[0.4em] text-slate-800 dark:text-white focus:outline-none focus:border-[#0F91FC]"
                                        required
                                    />
                                    <InputError message={formKonfirmasi2FA.errors.code} className="mt-1 text-center" />
                                </div>

                                <div className="flex items-center justify-end gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setModal2FAOpen(false)}
                                        className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={formKonfirmasi2FA.processing || formKonfirmasi2FA.data.code.length !== 6}
                                        className="bg-[#0F91FC] hover:bg-[#0a78d6] text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#0F91FC]/20 disabled:opacity-50 flex items-center gap-1.5"
                                    >
                                        <span>{formKonfirmasi2FA.processing ? 'Memverifikasi...' : 'Konfirmasi & Aktifkan'}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal 2: Verifikasi OTP untuk Aktivasi Metode Email / WhatsApp */}
                {modalOtpMetode && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative space-y-5">
                            <button
                                type="button"
                                onClick={() => setModalOtpMetode(null)}
                                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <span className="material-symbols-rounded text-xl">close</span>
                            </button>

                            <div className="text-center">
                                <div className="w-12 h-12 mx-auto rounded-2xl bg-[#0F91FC]/10 text-[#0F91FC] flex items-center justify-center mb-3">
                                    <span className="material-symbols-rounded text-2xl">
                                        {modalOtpMetode === 'whatsapp' ? 'chat' : 'mail'}
                                    </span>
                                </div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-white">
                                    Verifikasi OTP {modalOtpMetode === 'whatsapp' ? 'WhatsApp' : 'Email'}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    {infoOtpSetup?.pesan || 'Masukkan 6 digit kode OTP yang telah dikirimkan.'}
                                </p>

                                {infoOtpSetup?.kode_simulasi && (
                                    <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200">
                                        Kode OTP Simulasi: <strong className="font-mono text-sm tracking-widest">{infoOtpSetup.kode_simulasi}</strong>
                                    </div>
                                )}
                            </div>

                            <form onSubmit={konfirmasiOtpMetode} className="space-y-4">
                                <div>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        autoFocus
                                        value={formOtpMetode.data.code}
                                        onChange={(e) =>
                                            formOtpMetode.setData('code', e.target.value.replace(/\D/g, '').slice(0, 6))
                                        }
                                        placeholder="000000"
                                        className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 text-center font-mono text-2xl font-black tracking-[0.4em] text-slate-800 dark:text-white focus:outline-none focus:border-[#0F91FC]"
                                        required
                                    />
                                    <InputError message={formOtpMetode.errors.code} className="mt-1.5 text-center" />
                                </div>

                                <div className="flex items-center justify-between gap-3">
                                    <button
                                        type="button"
                                        disabled={loadingKirimOtpSetup}
                                        onClick={() => mulaiSetupOtpMetode(modalOtpMetode)}
                                        className="text-xs font-bold text-[#0F91FC] hover:underline"
                                    >
                                        Kirim Ulang Kode
                                    </button>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setModalOtpMetode(null)}
                                            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={formOtpMetode.processing || formOtpMetode.data.code.length !== 6}
                                            className="bg-[#0F91FC] hover:bg-[#0a78d6] text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#0F91FC]/20 disabled:opacity-50"
                                        >
                                            {formOtpMetode.processing ? 'Memverifikasi...' : 'Aktifkan'}
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal 3: Daftar Kode Cadangan 10 Digit */}
                {modalKodeCadanganOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative space-y-5">
                            <button
                                type="button"
                                onClick={() => setModalKodeCadanganOpen(false)}
                                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <span className="material-symbols-rounded text-xl">close</span>
                            </button>

                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center mb-3">
                                    <span className="material-symbols-rounded text-2xl">pin</span>
                                </div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white">
                                    Kode Cadangan 10 Digit
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Simpan 10 kode angka ini di tempat yang aman. Setiap kode terdiri dari 10 digit dan hanya dapat digunakan satu kali untuk masuk.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                                {(daftarKodeCadangan || []).map((kode, idx) => (
                                    <div
                                        key={idx}
                                        className="font-mono text-xs font-black text-center py-2 px-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 tracking-wider"
                                    >
                                        {formatKode10Digit(kode)}
                                    </div>
                                ))}
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            navigator.clipboard.writeText(
                                                (daftarKodeCadangan || []).map((k) => formatKode10Digit(k)).join('\n')
                                            );
                                            setSalinRecoverySukses(true);
                                            setTimeout(() => setSalinRecoverySukses(false), 2000);
                                        }}
                                        className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1"
                                    >
                                        <span className="material-symbols-rounded text-sm">
                                            {salinRecoverySukses ? 'check' : 'content_copy'}
                                        </span>
                                        <span>{salinRecoverySukses ? 'Disalin!' : 'Salin Semua'}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => unduhRecoveryCodes(daftarKodeCadangan)}
                                        className="px-3.5 py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-[#0F91FC] hover:bg-blue-50 dark:hover:bg-blue-950/40 flex items-center gap-1"
                                    >
                                        <span className="material-symbols-rounded text-sm">download</span>
                                        <span>Unduh .TXT</span>
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setModalKodeCadanganOpen(false)}
                                    className="px-4 py-2 rounded-xl text-xs font-bold bg-[#0F91FC] text-white"
                                >
                                    Selesai
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 4. Panel Sesi Perangkat Aktif */}
                <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 lg:p-8 border border-slate-100 dark:border-slate-700/50 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Sesi Perangkat Aktif</h2>
                            <p className="text-xs text-slate-400 mt-1">Daftar browser dan perangkat yang sedang masuk menggunakan akun Anda saat ini.</p>
                        </div>
                        {daftarSesi.filter(s => !s.adalah_saat_ini).length > 0 && (
                            <button 
                                onClick={akhiriSesiLainnya}
                                className="text-xs bg-red-550/10 dark:bg-red-500/10 text-red-650 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 px-4 py-2.5 rounded-xl font-bold transition-all border border-red-200/50 dark:border-red-500/20 self-start sm:self-center"
                            >
                                Keluar dari Sesi Lainnya
                            </button>
                        )}
                    </div>
                    
                    <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                        {daftarSesi.length > 0 ? (
                            daftarSesi.map((sesi) => (
                                <div key={sesi.id} className="flex items-center justify-between py-4 first:pt-0 last:pb-0">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-500">
                                            <span className="material-symbols-rounded text-xl">
                                                {sesi.device_icon}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                                {sesi.os} - {sesi.browser}
                                            </p>
                                            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                                                <span>{sesi.ip_address}</span>
                                                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                                                <span>
                                                    {sesi.adalah_saat_ini
                                                        ? 'Perangkat ini'
                                                        : sesi.dipakai_akun_lain
                                                            ? `Dialihkan ke akun lain • ${sesi.terakhir_aktif}`
                                                            : `Terakhir aktif ${sesi.terakhir_aktif}`}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 shrink-0">
                                        {/* Badge status sesi */}
                                        {sesi.dipakai_akun_lain ? (
                                            <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                                                Dialihkan
                                            </span>
                                        ) : sesi.sedang_online ? (
                                            <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                                                Aktif
                                            </span>
                                        ) : (
                                            <span className="bg-slate-100 text-slate-500 dark:bg-slate-700/50 dark:text-slate-400 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                                                Tidak Aktif
                                            </span>
                                        )}

                                        {!sesi.adalah_saat_ini && (
                                            <button 
                                                onClick={() => akhiriSesi(sesi.id)}
                                                className="text-red-500 hover:text-red-700 dark:hover:text-red-400 text-xs font-bold uppercase tracking-wider transition-colors px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                                            >
                                                Akhiri Sesi
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-400 py-4 text-center">Tidak ada data sesi aktif.</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}


KeamananAkun.layout = page => <TataLetakUtama children={page} title="Keamanan Akun" />;
