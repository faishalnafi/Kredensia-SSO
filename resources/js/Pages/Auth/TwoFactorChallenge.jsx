import React, { useState, useRef, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import Checkbox from '@/Components/Checkbox';

const IKON_METODE = {
    google_prompt: 'phonelink_lock',
    totp: 'qr_code_scanner',
    whatsapp: 'chat',
    sms: 'sms',
    email: 'mail',
    passkey: 'fingerprint',
    security_key: 'usb',
    backup_codes: 'pin',
};

const LABEL_SINGKAT_METODE = {
    google_prompt: 'Dialog Perangkat (Mirip Google)',
    totp: 'Aplikasi Authenticator (TOTP)',
    whatsapp: 'OTP Nomor Telepon via WhatsApp',
    sms: 'OTP Nomor Telepon via SMS',
    email: 'OTP via Email',
    passkey: 'Kunci Sandi (Passkey Biometrik)',
    security_key: 'Kunci Keamanan Fisik (USB/NFC)',
    backup_codes: 'Kode Cadangan 10 Digit',
};

// Konversi string base64url ke Uint8Array untuk WebAuthn
function base64UrlKeUint8Array(base64Url) {
    const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
    const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Konversi ArrayBuffer ke string base64url
function bufferKeBase64Url(buffer) {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export default function TwoFactorChallenge({
    email = '',
    emailMasked = '',
    noTelpMasked = '',
    punyaNoTelp = false,
    nama = '',
    avatarUrl = '',
    type = 'totp',
    daftarOpsiVerifikasi = [],
    promptData: initialPromptData = null,
    webauthnChallenge = '',
    kredensialWebAuthn = [],
}) {
    const [metodePilihan, setMetodePilihan] = useState(type || 'totp');
    const [tampilkanDaftarMetode, setTampilkanDaftarMetode] = useState(false);
    const [promptState, setPromptState] = useState(initialPromptData);
    const [sedangKirimUlang, setSedangKirimUlang] = useState(false);
    const [hitungMundurKirim, setHitungMundurKirim] = useState(0);
    const [pesanInfo, setPesanInfo] = useState('');
    const [kodeSimulasi, setKodeSimulasi] = useState(null);
    const [errorWebAuthn, setErrorWebAuthn] = useState('');
    const [sedangProsesWebAuthn, setSedangProsesWebAuthn] = useState(false);
    const codeInputRef = useRef(null);
    const sudahAutoSubmitPromptRef = useRef(false);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        metode: type || 'totp',
        code: '',
        recovery_code: '',
        credential_id: '',
        client_data_json: '',
        remember_device: true,
    });

    useEffect(() => {
        setData('metode', metodePilihan);
        clearErrors();
        setErrorWebAuthn('');
        if (codeInputRef.current && ['totp', 'email', 'whatsapp', 'backup_codes'].includes(metodePilihan)) {
            setTimeout(() => codeInputRef.current?.focus(), 80);
        }
    }, [metodePilihan, tampilkanDaftarMetode]);

    // Timer hitung mundur tombol kirim ulang OTP
    useEffect(() => {
        if (hitungMundurKirim <= 0) return;
        const timer = setInterval(() => {
            setHitungMundurKirim((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [hitungMundurKirim]);

    // Polling real-time 2 arah ketika pengguna berada pada metode Dialog Google Prompt
    useEffect(() => {
        if (metodePilihan !== 'google_prompt' || tampilkanDaftarMetode) return;

        const periksaStatusPrompt = async () => {
            try {
                const res = await window.axios.get(route('2fa.prompt_status'));
                const statusBaru = res.data?.status;
                if (statusBaru) {
                    setPromptState((prev) => ({
                        ...(prev || {}),
                        id: res.data?.id ?? prev?.id,
                        angka_target: res.data?.angka_target ?? prev?.angka_target,
                        status: statusBaru,
                    }));

                    if (statusBaru === 'approved' && !sudahAutoSubmitPromptRef.current) {
                        sudahAutoSubmitPromptRef.current = true;
                        router.post(route('2fa.verify'), {
                            metode: 'google_prompt',
                            remember_device: data.remember_device,
                        });
                    }
                }
            } catch (e) {
                /* abaikan */
            }
        };

        const interval = setInterval(periksaStatusPrompt, 2000);
        return () => clearInterval(interval);
    }, [metodePilihan, tampilkanDaftarMetode, data.remember_device]);

    // Minta pengiriman tantangan baru (OTP Email / OTP WhatsApp / Dialog Google Prompt)
    const mintaTantanganBaru = async (targetMetode) => {
        if (sedangKirimUlang) return;
        setSedangKirimUlang(true);
        setPesanInfo('');
        setKodeSimulasi(null);

        try {
            const res = await window.axios.post(route('2fa.send_challenge'), {
                metode: targetMetode,
            });
            if (res.data?.berhasil) {
                setPesanInfo(res.data.pesan || 'Kode verifikasi berhasil dikirim.');
                if (res.data.kode_simulasi) {
                    setKodeSimulasi(res.data.kode_simulasi);
                }
                if (res.data.promptData) {
                    sudahAutoSubmitPromptRef.current = false;
                    setPromptState(res.data.promptData);
                }
                if (['email', 'whatsapp'].includes(targetMetode)) {
                    setHitungMundurKirim(45);
                }
            }
        } catch (err) {
            setPesanInfo(err?.response?.data?.pesan || 'Gagal mengirim permintaan verifikasi.');
        } finally {
            setSedangKirimUlang(false);
        }
    };

    // Pilih metode dari dialog "Coba cara lain"
    const pilihMetodeVerifikasi = (opsi) => {
        if (!opsi.aktif_sistem || !opsi.tersedia) return;

        const kode = opsi.kode;
        setMetodePilihan(kode);
        setTampilkanDaftarMetode(false);
        reset('code', 'recovery_code');
        setPesanInfo('');
        setKodeSimulasi(null);

        if (['email', 'whatsapp', 'google_prompt'].includes(kode)) {
            mintaTantanganBaru(kode);
        }
    };

    // Eksekusi WebAuthn (Kunci Sandi / Kunci Keamanan Fisik)
    const jalankanVerifikasiWebAuthn = async () => {
        setErrorWebAuthn('');
        if (!window.PublicKeyCredential || !navigator.credentials) {
            setErrorWebAuthn('Browser atau perangkat ini tidak mendukung WebAuthn (Kunci Sandi / Kunci Keamanan).');
            return;
        }

        setSedangProsesWebAuthn(true);
        try {
            const kredensialSesuai = kredensialWebAuthn.filter((k) => k.jenis === metodePilihan);
            const daftarAllow = (kredensialSesuai.length > 0 ? kredensialSesuai : kredensialWebAuthn).map((item) => ({
                type: 'public-key',
                id: base64UrlKeUint8Array(item.credential_id),
                transports: Array.isArray(item.transports) && item.transports.length > 0 ? item.transports : undefined,
            }));

            const publicKeyOptions = {
                challenge: base64UrlKeUint8Array(webauthnChallenge || 'c3NvLXNla29sYWgtd2ViYXV0aG4='),
                timeout: 60000,
                userVerification: metodePilihan === 'passkey' ? 'preferred' : 'discouraged',
                ...(daftarAllow.length > 0 ? { allowCredentials: daftarAllow } : {}),
            };

            const assertion = await navigator.credentials.get({ publicKey: publicKeyOptions });
            if (!assertion) {
                throw new Error('Tidak ada kredensial yang dipilih.');
            }

            const credentialId = bufferKeBase64Url(assertion.rawId);
            const clientDataJSON = bufferKeBase64Url(assertion.response.clientDataJSON);

            router.post(route('2fa.verify'), {
                metode: metodePilihan,
                credential_id: credentialId,
                client_data_json: clientDataJSON,
                remember_device: data.remember_device,
            });
        } catch (err) {
            setErrorWebAuthn(
                err?.name === 'NotAllowedError'
                    ? 'Verifikasi dibatalkan atau waktu habis. Silakan ketuk tombol di bawah untuk mencoba lagi.'
                    : err?.message || 'Gagal memverifikasi Kunci Sandi / Kunci Keamanan.'
            );
        } finally {
            setSedangProsesWebAuthn(false);
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        post(route('2fa.verify'), {
            onFinish: () => {
                if (metodePilihan === 'backup_codes') {
                    reset('recovery_code');
                } else {
                    reset('code');
                }
            },
        });
    };

    const handleCancel = () => {
        router.post(route('2fa.cancel'));
    };

    // Format tampilan Kode Cadangan 10 digit menjadi "12345 67890"
    const formatInputKodeCadangan = (nilai) => {
        const bersih = nilai.replace(/\s+/g, '');
        if (/^\d+$/.test(bersih)) {
            const potong = bersih.slice(0, 10);
            if (potong.length > 5) {
                return `${potong.slice(0, 5)} ${potong.slice(5)}`;
            }
            return potong;
        }
        return nilai.toUpperCase().slice(0, 11);
    };

    const digitCadanganBersih = data.recovery_code.replace(/[\s\-]+/g, '');

    return (
        <>
            <Head title="Verifikasi 2 Langkah (MFA) - SSO Sekolah" />

            {/* Pembungkus utama dipertahankan tetap guna mencegah Cumulative Layout Shift (CLS) */}
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/40 to-indigo-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-center items-center p-4 sm:p-6">
                {/* Kartu Dialog Verifikasi ala Google */}
                <div className="w-full max-w-[460px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-[28px] shadow-2xl overflow-hidden transition-all">
                    {/* Bar Atas Aksentuasi */}
                    <div className="h-1.5 w-full bg-gradient-to-r from-[#0F91FC] via-sky-400 to-indigo-500" />

                    <div className="p-6 sm:p-8">
                        {/* Header Identitas Akun ala Dialog Google */}
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800/60 text-[#0F91FC] mb-3.5 shadow-sm">
                                <span className="material-symbols-outlined text-[30px]">
                                    {tampilkanDaftarMetode ? 'security' : IKON_METODE[metodePilihan] || 'verified_user'}
                                </span>
                            </div>

                            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                                {tampilkanDaftarMetode ? 'Pilih Cara Verifikasi' : 'Verifikasi 2 Langkah'}
                            </h1>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Untuk membantu menjaga keamanan akun SSO Sekolah Anda
                            </p>

                            {/* Pill Akun Mirip Google */}
                            <div className="mt-3.5 inline-flex items-center gap-2.5 pl-1.5 pr-3.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 bg-slate-50/80 dark:bg-slate-800/60 max-w-full">
                                {avatarUrl ? (
                                    <img
                                        src={avatarUrl}
                                        alt={nama}
                                        className="w-6 h-6 rounded-full object-cover shrink-0"
                                    />
                                ) : (
                                    <div className="w-6 h-6 rounded-full bg-[#0F91FC] text-white text-xs font-bold flex items-center justify-center shrink-0">
                                        {nama ? nama.charAt(0).toUpperCase() : 'U'}
                                    </div>
                                )}
                                <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">
                                    {email}
                                </span>
                            </div>
                        </div>

                        {/* TAMPILAN 1: DIALOG PEMILIHAN METODE ("COBA CARA LAIN" MIRIP GOOGLE) */}
                        {tampilkanDaftarMetode ? (
                            <div className="space-y-2.5">
                                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-3">
                                    Pilih salah satu metode verifikasi berikut untuk membuktikan bahwa ini memang Anda:
                                </p>

                                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                                    {daftarOpsiVerifikasi.map((opsi) => {
                                        const terpilih = metodePilihan === opsi.kode;
                                        const bisaDipilih = opsi.aktif_sistem && opsi.tersedia;

                                        return (
                                            <button
                                                key={opsi.kode}
                                                type="button"
                                                disabled={!bisaDipilih}
                                                onClick={() => pilihMetodeVerifikasi(opsi)}
                                                className={`w-full text-left p-3.5 rounded-2xl border transition-all flex items-start gap-3.5 ${
                                                    !bisaDipilih
                                                        ? 'border-slate-200/60 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 opacity-65 cursor-not-allowed'
                                                        : terpilih
                                                        ? 'border-[#0F91FC] bg-blue-50/60 dark:bg-blue-950/30 shadow-sm'
                                                        : 'border-slate-200 dark:border-slate-700/80 hover:border-[#0F91FC]/60 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                                }`}
                                            >
                                                <div
                                                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                                        !bisaDipilih
                                                            ? 'bg-slate-200/70 dark:bg-slate-800 text-slate-400'
                                                            : terpilih
                                                            ? 'bg-[#0F91FC] text-white'
                                                            : 'bg-blue-50 dark:bg-slate-800 text-[#0F91FC]'
                                                    }`}
                                                >
                                                    <span className="material-symbols-outlined text-[21px]">
                                                        {IKON_METODE[opsi.kode] || 'shield'}
                                                    </span>
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                                                            {opsi.nama}
                                                        </span>
                                                        {!opsi.aktif_sistem ? (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 shrink-0">
                                                                Nonaktif
                                                            </span>
                                                        ) : !opsi.tersedia ? (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 shrink-0">
                                                                Belum Diatur
                                                            </span>
                                                        ) : terpilih ? (
                                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-[#0F91FC] dark:bg-blue-900/50 dark:text-blue-300 shrink-0">
                                                                Aktif
                                                            </span>
                                                        ) : null}
                                                    </div>

                                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                                                        {opsi.alasan_nonaktif || opsi.deskripsi}
                                                    </p>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="pt-3">
                                    <button
                                        type="button"
                                        onClick={() => setTampilkanDaftarMetode(false)}
                                        className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                                    >
                                        Kembali ke Verifikasi {LABEL_SINGKAT_METODE[metodePilihan]}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* TAMPILAN 2: LAYAR VERIFIKASI SESUAI METODE YANG DIPILIH */
                            <div>
                                {/* Banner Informasi / Simulasi Lokal */}
                                {pesanInfo && (
                                    <div className="mb-4 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2.5">
                                        <span className="material-symbols-outlined text-[18px] text-emerald-600 shrink-0 mt-0.5">
                                            check_circle
                                        </span>
                                        <div className="flex-1">
                                            <p className="font-semibold">{pesanInfo}</p>
                                            {kodeSimulasi && (
                                                <div className="mt-1.5 inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700">
                                                    <span className="text-[11px] text-slate-500">Kode OTP Anda:</span>
                                                    <span className="font-mono font-black text-sm tracking-widest text-emerald-700 dark:text-emerald-300">
                                                        {kodeSimulasi}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => setData('code', String(kodeSimulasi))}
                                                        className="text-[10px] font-bold text-[#0F91FC] hover:underline ml-1"
                                                    >
                                                        Isi Otomatis
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* METODE A: DIALOG MIRIP GOOGLE (GOOGLE PROMPT - COCOKKAN ANGKA) */}
                                {metodePilihan === 'google_prompt' && (
                                    <div className="text-center space-y-4">
                                        <div className="py-5 px-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60">
                                            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                                Angka Pencocokan Perangkat
                                            </p>
                                            <div className="w-24 h-24 mx-auto rounded-full bg-white dark:bg-slate-900 border-4 border-[#0F91FC] flex items-center justify-center shadow-lg shadow-blue-500/10">
                                                <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                                                    {promptState?.angka_target ?? '••'}
                                                </span>
                                            </div>
                                            <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 mt-4">
                                                Periksa perangkat Anda yang sedang aktif login
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                                                Dialog verifikasi telah dikirim ke sesi browser/perangkat Anda yang lain. Ketuk{' '}
                                                <strong className="text-slate-700 dark:text-slate-200">Ya, Itu Saya</strong>, lalu pilih angka{' '}
                                                <strong className="text-[#0F91FC]">{promptState?.angka_target ?? ''}</strong>.
                                            </p>

                                            {/* Status Real-time */}
                                            <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-xs font-semibold text-[#0F91FC]">
                                                {promptState?.status === 'rejected' ? (
                                                    <>
                                                        <span className="material-symbols-outlined text-[16px] text-rose-500">cancel</span>
                                                        <span className="text-rose-600 dark:text-rose-400">
                                                            Permintaan ditolak dari perangkat lain
                                                        </span>
                                                    </>
                                                ) : promptState?.status === 'expired' ? (
                                                    <>
                                                        <span className="material-symbols-outlined text-[16px] text-amber-500">schedule</span>
                                                        <span className="text-amber-600 dark:text-amber-400">
                                                            Waktu dialog habis, silakan kirim ulang
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="w-2 h-2 rounded-full bg-[#0F91FC] animate-ping" />
                                                        <span>Menunggu persetujuan dari perangkat Anda...</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            disabled={sedangKirimUlang}
                                            onClick={() => mintaTantanganBaru('google_prompt')}
                                            className="w-full py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-[#0F91FC] text-xs font-bold text-slate-700 dark:text-slate-200 transition flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">refresh</span>
                                            <span>{sedangKirimUlang ? 'Mengirim ulang dialog...' : 'Kirim Ulang Dialog ke Perangkat'}</span>
                                        </button>
                                    </div>
                                )}

                                {/* METODE B: KUNCI SANDI (PASSKEY) ATAU KUNCI KEAMANAN FISIK (SECURITY KEY) */}
                                {(metodePilihan === 'passkey' || metodePilihan === 'security_key') && (
                                    <div className="text-center space-y-4">
                                        <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60">
                                            <div className="w-16 h-16 mx-auto rounded-2xl bg-[#0F91FC]/10 text-[#0F91FC] flex items-center justify-center mb-3">
                                                <span className="material-symbols-outlined text-[36px]">
                                                    {metodePilihan === 'security_key' ? 'usb' : 'fingerprint'}
                                                </span>
                                            </div>
                                            <h3 className="text-sm font-extrabold text-slate-800 dark:text-white">
                                                {metodePilihan === 'security_key'
                                                    ? 'Gunakan Kunci Keamanan USB / NFC Anda'
                                                    : 'Gunakan Kunci Sandi (Passkey) Perangkat'}
                                            </h3>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                                                {metodePilihan === 'security_key'
                                                    ? 'Colokkan kunci keamanan FIDO2 ke port USB atau tempelkan pada pembaca NFC, lalu sentuh sensornya.'
                                                    : 'Verifikasi identitas Anda menggunakan Sidik Jari, Face ID, Touch ID, atau PIN Windows Hello.'}
                                            </p>

                                            {errorWebAuthn && (
                                                <p className="mt-3 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2.5 rounded-xl">
                                                    {errorWebAuthn}
                                                </p>
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            disabled={sedangProsesWebAuthn || processing}
                                            onClick={jalankanVerifikasiWebAuthn}
                                            className="w-full bg-[#0F91FC] hover:bg-[#0a78d6] text-white py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-[#0F91FC]/25 transition flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">
                                                {metodePilihan === 'security_key' ? 'vpn_key' : 'fingerprint'}
                                            </span>
                                            <span>
                                                {sedangProsesWebAuthn
                                                    ? 'Menunggu Sensor Keamanan...'
                                                    : metodePilihan === 'security_key'
                                                    ? 'Pindai Kunci Keamanan'
                                                    : 'Verifikasi dengan Kunci Sandi'}
                                            </span>
                                        </button>
                                    </div>
                                )}

                                {/* METODE C: INPUT KODE (TOTP, OTP EMAIL, OTP WHATSAPP, ATAU KODE CADANGAN 10 DIGIT) */}
                                {['totp', 'email', 'whatsapp', 'backup_codes'].includes(metodePilihan) && (
                                    <form onSubmit={handleFormSubmit} className="space-y-4">
                                        {metodePilihan !== 'backup_codes' ? (
                                            <div>
                                                <p className="text-xs text-slate-600 dark:text-slate-300 text-center mb-3 leading-relaxed">
                                                    {metodePilihan === 'whatsapp' ? (
                                                        <>
                                                            Masukkan 6 digit kode OTP yang dikirim ke nomor WhatsApp{' '}
                                                            <strong className="text-slate-800 dark:text-white">{noTelpMasked}</strong>.
                                                        </>
                                                    ) : metodePilihan === 'email' ? (
                                                        <>
                                                            Masukkan 6 digit kode OTP yang dikirim ke email{' '}
                                                            <strong className="text-slate-800 dark:text-white">{emailMasked || email}</strong>.
                                                        </>
                                                    ) : (
                                                        'Buka aplikasi Google Authenticator / Authy di ponsel Anda dan masukkan 6 digit kode OTP.'
                                                    )}
                                                </p>

                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 text-center">
                                                    {metodePilihan === 'whatsapp'
                                                        ? 'Kode OTP WhatsApp (6 Digit)'
                                                        : metodePilihan === 'email'
                                                        ? 'Kode OTP Email (6 Digit)'
                                                        : 'Kode Authenticator (6 Digit)'}
                                                </label>

                                                <input
                                                    ref={codeInputRef}
                                                    type="text"
                                                    inputMode="numeric"
                                                    autoComplete="one-time-code"
                                                    maxLength={6}
                                                    value={data.code}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                        setData('code', val);
                                                    }}
                                                    placeholder="000000"
                                                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 text-center font-mono text-3xl font-black tracking-[0.45em] text-slate-800 dark:text-white focus:outline-none focus:border-[#0F91FC] focus:ring-4 focus:ring-[#0F91FC]/10 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
                                                    required
                                                />
                                                <InputError message={errors.code} className="mt-2 text-center" />

                                                {/* Tombol Kirim Ulang OTP Email / WhatsApp */}
                                                {(metodePilihan === 'email' || metodePilihan === 'whatsapp') && (
                                                    <div className="mt-3 text-center">
                                                        <button
                                                            type="button"
                                                            disabled={sedangKirimUlang || hitungMundurKirim > 0}
                                                            onClick={() => mintaTantanganBaru(metodePilihan)}
                                                            className="text-xs font-bold text-[#0F91FC] hover:underline disabled:text-slate-400 disabled:no-underline inline-flex items-center gap-1"
                                                        >
                                                            <span className="material-symbols-outlined text-[15px]">send</span>
                                                            {hitungMundurKirim > 0
                                                                ? `Kirim ulang kode dalam ${hitungMundurKirim} detik`
                                                                : sedangKirimUlang
                                                                ? 'Mengirim kode...'
                                                                : `Kirim Ulang Kode OTP via ${
                                                                      metodePilihan === 'whatsapp' ? 'WhatsApp' : 'Email'
                                                                  }`}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="text-xs text-slate-600 dark:text-slate-300 text-center mb-3 leading-relaxed">
                                                    Masukkan salah satu dari <strong>Kode Cadangan 10 Digit</strong> Anda. Setiap kode hanya dapat dipakai satu kali.
                                                </p>

                                                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 text-center">
                                                    Kode Cadangan 10 Digit
                                                </label>

                                                <input
                                                    ref={codeInputRef}
                                                    type="text"
                                                    inputMode="numeric"
                                                    autoComplete="off"
                                                    value={data.recovery_code}
                                                    onChange={(e) =>
                                                        setData('recovery_code', formatInputKodeCadangan(e.target.value))
                                                    }
                                                    placeholder="12345 67890"
                                                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 text-center font-mono text-2xl font-black tracking-[0.2em] text-slate-800 dark:text-white focus:outline-none focus:border-[#0F91FC] focus:ring-4 focus:ring-[#0F91FC]/10 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
                                                    required
                                                />
                                                <p className="text-[11px] text-slate-400 text-center mt-1.5">
                                                    Terdiri dari 10 digit angka ({digitCadanganBersih.length}/10 digit)
                                                </p>
                                                <InputError message={errors.recovery_code} className="mt-2 text-center" />
                                            </div>
                                        )}

                                        {/* Opsi Ingat Perangkat */}
                                        <div className="flex items-center justify-between text-xs pt-1">
                                            <label className="flex items-center gap-2 cursor-pointer select-none">
                                                <Checkbox
                                                    checked={data.remember_device}
                                                    onChange={(e) => setData('remember_device', e.target.checked)}
                                                    className="rounded-lg text-[#0F91FC] focus:ring-[#0F91FC]"
                                                />
                                                <span className="text-slate-600 dark:text-slate-400 font-medium">
                                                    Jangan tanyakan lagi di browser perangkat ini selama 30 hari
                                                </span>
                                            </label>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={
                                                processing ||
                                                (metodePilihan !== 'backup_codes' && data.code.length !== 6) ||
                                                (metodePilihan === 'backup_codes' && digitCadanganBersih.length < 10)
                                            }
                                            className="w-full bg-[#0F91FC] hover:bg-[#0a78d6] active:scale-[0.99] text-white py-3.5 px-4 rounded-2xl font-bold text-xs sm:text-sm uppercase tracking-wider transition-all shadow-lg shadow-[#0F91FC]/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {processing ? (
                                                <>
                                                    <span className="material-symbols-outlined animate-spin text-[18px]">
                                                        progress_activity
                                                    </span>
                                                    <span>Memverifikasi...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className="material-symbols-outlined text-[18px]">verified</span>
                                                    <span>Verifikasi & Masuk</span>
                                                </>
                                            )}
                                        </button>
                                    </form>
                                )}

                                {/* Tombol "Coba cara lain" Mirip Dialog Google */}
                                <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setTampilkanDaftarMetode(true)}
                                        className="px-3.5 py-2 rounded-xl text-xs font-bold text-[#0F91FC] hover:bg-blue-50 dark:hover:bg-blue-950/40 transition inline-flex items-center gap-1.5"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
                                        <span>Coba cara lain</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition inline-flex items-center gap-1"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                                        <span>Batal</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
