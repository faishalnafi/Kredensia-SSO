import React, { useState, useRef, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import InputError from '@/Components/InputError';
import Checkbox from '@/Components/Checkbox';

export default function TwoFactorChallenge({ email = '', nama = '', type = 'totp' }) {
    const [useRecovery, setUseRecovery] = useState(false);
    const codeInputRef = useRef(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        code: '',
        recovery_code: '',
        remember_device: true,
    });

    useEffect(() => {
        if (codeInputRef.current) {
            codeInputRef.current.focus();
        }
    }, [useRecovery]);

    const handleFormSubmit = (e) => {
        e.preventDefault();
        post(route('2fa.verify'), {
            onFinish: () => {
                if (useRecovery) {
                    reset('recovery_code');
                } else {
                    reset('code');
                }
            }
        });
    };

    const handleCancel = () => {
        post(route('2fa.cancel'));
    };

    return (
        <>
            <Head title="Verifikasi Dua Langkah (2FA) - SSO Sekolah" />

            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex flex-col justify-center items-center p-4 sm:p-6">
                {/* Kartu Utama */}
                <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8">
                    
                    {/* Header Ikon & Judul */}
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-[#0F91FC] to-sky-400 flex items-center justify-center text-white shadow-lg shadow-[#0F91FC]/30">
                            <span className="material-symbols-rounded text-3xl">
                                {useRecovery ? 'vpn_key' : 'verified_user'}
                            </span>
                        </div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">
                            Verifikasi Dua Langkah
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">
                            {useRecovery
                                ? 'Masukkan salah satu kode pemulihan darurat (Recovery Code) cadangan akun Anda.'
                                : type === 'email'
                                ? 'Masukkan 6 digit kode verifikasi OTP yang telah kami kirimkan ke email Anda.'
                                : 'Buka aplikasi Google Authenticator atau Authy di ponsel Anda dan masukkan 6 digit kode.'}
                        </p>
                    </div>

                    {/* Badge Pengguna */}
                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3 mb-6 border border-slate-200/60 dark:border-slate-700/50 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#0F91FC]/10 text-[#0F91FC] flex items-center justify-center font-bold text-sm flex-shrink-0">
                            {nama ? nama.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                                {nama || 'Pengguna SSO'}
                            </p>
                            <p className="text-[11px] text-slate-400 dark:text-slate-400 font-mono truncate">
                                {email}
                            </p>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            2FA Aktif
                        </span>
                    </div>

                    {/* Formulir Verifikasi */}
                    <form onSubmit={handleFormSubmit} className="space-y-5">
                        {!useRecovery ? (
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2 text-center">
                                    {type === 'email' ? 'Kode OTP Email (6 Digit)' : 'Kode OTP Authenticator (6 Digit)'}
                                </label>
                                <div className="relative">
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
                                        className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 text-center font-mono text-3xl font-black tracking-[0.5em] text-slate-800 dark:text-white focus:outline-none focus:border-[#0F91FC] focus:ring-4 focus:ring-[#0F91FC]/10 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
                                        required
                                    />
                                </div>
                                <InputError message={errors.code} className="mt-2 text-center" />
                            </div>
                        ) : (
                            <div>
                                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2 text-center">
                                    Kode Pemulihan Darurat
                                </label>
                                <input
                                    ref={codeInputRef}
                                    type="text"
                                    autoComplete="off"
                                    value={data.recovery_code}
                                    onChange={(e) => setData('recovery_code', e.target.value.toUpperCase())}
                                    placeholder="XXXXX-XXXXX"
                                    className="w-full bg-slate-50 dark:bg-slate-950 border-2 border-slate-200 dark:border-slate-700 rounded-2xl py-3 px-4 text-center font-mono text-lg font-bold tracking-widest text-slate-800 dark:text-white uppercase focus:outline-none focus:border-[#0F91FC] focus:ring-4 focus:ring-[#0F91FC]/10 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-700"
                                    required
                                />
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
                                    Ingat browser ini selama 30 hari
                                </span>
                            </label>
                        </div>

                        {/* Tombol Aksi Verifikasi */}
                        <div className="space-y-2.5 pt-2">
                            <button
                                type="submit"
                                disabled={processing || (!useRecovery && data.code.length !== 6) || (useRecovery && !data.recovery_code.trim())}
                                className="w-full bg-[#0F91FC] hover:bg-[#0a78d6] active:scale-[0.99] text-white py-3.5 px-4 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all shadow-lg shadow-[#0F91FC]/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {processing ? (
                                    <>
                                        <span className="material-symbols-rounded animate-spin text-lg">progress_activity</span>
                                        <span>Memverifikasi...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-rounded text-lg">login</span>
                                        <span>Verifikasi & Masuk</span>
                                    </>
                                )}
                            </button>

                            {/* Toggle Metode: Kode OTP vs Pemulihan */}
                            <button
                                type="button"
                                onClick={() => {
                                    setUseRecovery(!useRecovery);
                                    reset('code', 'recovery_code');
                                }}
                                className="w-full text-xs font-semibold text-slate-500 hover:text-[#0F91FC] dark:text-slate-400 dark:hover:text-[#ff6b39] py-2 transition-colors flex items-center justify-center gap-1.5"
                            >
                                <span className="material-symbols-rounded text-base">
                                    {useRecovery ? 'smartphone' : 'key'}
                                </span>
                                <span>
                                    {useRecovery
                                        ? 'Gunakan aplikasi autentikator (Kode 6-Digit)'
                                        : 'Gunakan kode pemulihan darurat (Recovery Code)'}
                                </span>
                            </button>
                        </div>
                    </form>

                    {/* Footer Bantuan & Batal */}
                    <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center space-y-3">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="text-xs text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors inline-flex items-center gap-1"
                        >
                            <span className="material-symbols-rounded text-sm">arrow_back</span>
                            <span>Batal & Kembali ke Halaman Masuk</span>
                        </button>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-normal">
                            Kehilangan akses ke ponsel Anda? Hubungi <strong>Superadmin</strong> untuk mereset autentikasi 2FA akun Anda.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
