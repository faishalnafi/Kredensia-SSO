import React, { useState } from 'react';
import { Head, useForm, router, Link } from '@inertiajs/react';
import TataLetakUtama from '@/Layouts/TataLetakUtama';
import InputError from '@/Components/InputError';
import Swal from 'sweetalert2';

export default function Konfigurasi2FA({
    pengaturan,
    semuaPeran = [],
    daftarPengguna = { data: [], links: [] },
    statistik = {},
    filters = {}
}) {
    const [tabAktif, setTabAktif] = useState('kebijakan'); // 'kebijakan' | 'pengguna' | 'panduan'
    const [cari, setCari] = useState(filters.cari || '');
    const [filterPeran, setFilterPeran] = useState(filters.peran || 'semua');
    const [filterStatus, setFilterStatus] = useState(filters.status_2fa || '');

    // Form Pengaturan Kebijakan 2FA
    const { data, setData, post, processing, errors } = useForm({
        two_factor_enabled: pengaturan.two_factor_enabled ?? false,
        two_factor_enforcement: pengaturan.two_factor_enforcement || 'roles',
        two_factor_roles: pengaturan.two_factor_roles || ['Super Admin', 'Admin'],
        two_factor_allowed_methods: pengaturan.two_factor_allowed_methods || ['totp', 'email'],
        two_factor_grace_period_days: pengaturan.two_factor_grace_period_days ?? 7,
        two_factor_remember_browser_days: pengaturan.two_factor_remember_browser_days ?? 30,
    });

    const tanganiToggleRole = (roleName) => {
        const rolesSaatIni = [...data.two_factor_roles];
        const index = rolesSaatIni.indexOf(roleName);
        if (index > -1) {
            rolesSaatIni.splice(index, 1);
        } else {
            rolesSaatIni.push(roleName);
        }
        setData('two_factor_roles', rolesSaatIni);
    };

    const tanganiToggleMethod = (method) => {
        const methods = [...data.two_factor_allowed_methods];
        const index = methods.indexOf(method);
        if (index > -1) {
            if (methods.length === 1) {
                Swal.fire({
                    title: 'Peringatan',
                    text: 'Minimal harus ada 1 metode 2FA yang diizinkan untuk pengguna.',
                    icon: 'warning',
                    confirmButtonColor: '#0F91FC',
                    customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5' }
                });
                return;
            }
            methods.splice(index, 1);
        } else {
            methods.push(method);
        }
        setData('two_factor_allowed_methods', methods);
    };

    const tanganiSimpanKebijakan = (e) => {
        e.preventDefault();
        post(route('superadmin.two-factor.perbarui'), {
            preserveScroll: true,
            onSuccess: () => {
                Swal.fire({
                    title: 'Berhasil!',
                    text: 'Kebijakan Autentikasi 2FA berhasil disimpan dan diperbarui.',
                    icon: 'success',
                    confirmButtonColor: '#0F91FC',
                    customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5' }
                });
            }
        });
    };

    const tanganiCari = (e) => {
        e.preventDefault();
        router.get(route('superadmin.two-factor.indeks'), {
            cari,
            peran: filterPeran,
            status_2fa: filterStatus,
        }, {
            preserveState: true,
            replace: true,
        });
    };

    const resetFilter = () => {
        setCari('');
        setFilterPeran('semua');
        setFilterStatus('');
        router.get(route('superadmin.two-factor.indeks'), {}, {
            preserveState: true,
            replace: true,
        });
    };

    const tanganiResetUser2FA = (user) => {
        Swal.fire({
            title: 'Reset 2FA Pengguna?',
            html: `Apakah Anda yakin ingin mereset kunci 2FA untuk <b>${user.nama_lengkap}</b> (${user.email})?<br/><br/><small class="text-slate-500">Pengguna akan diminta mengatur ulang 2FA pada login berikutnya.</small>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Ya, Reset 2FA',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#64748b',
            customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5', cancelButton: 'rounded-xl font-bold px-5 py-2.5' }
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(route('superadmin.two-factor.reset', user.id), {}, {
                    preserveScroll: true,
                    onSuccess: () => {
                        Swal.fire({
                            title: '2FA Di-reset!',
                            text: `Autentikasi 2FA untuk ${user.nama_lengkap} telah berhasil di-reset.`,
                            icon: 'success',
                            confirmButtonColor: '#0F91FC',
                            customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5' }
                        });
                    }
                });
            }
        });
    };

    const tanganiResetSemua2FA = () => {
        Swal.fire({
            title: '⚠️ Reset Massal 2FA?',
            html: `Tindakan ini akan <b>menghapus seluruh kunci 2FA aktif</b> milik semua pengguna (${statistik.total_aktif_2fa} akun). Pengguna harus mengatur ulang 2FA mereka dari awal.`,
            icon: 'error',
            showCancelButton: true,
            confirmButtonText: 'Ya, Reset Semua 2FA',
            cancelButtonText: 'Batalkan',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#64748b',
            customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5', cancelButton: 'rounded-xl font-bold px-5 py-2.5' }
        }).then((result) => {
            if (result.isConfirmed) {
                router.post(route('superadmin.two-factor.reset-semua'), {}, {
                    preserveScroll: true,
                    onSuccess: () => {
                        Swal.fire({
                            title: 'Selesai!',
                            text: 'Seluruh konfigurasi 2FA pengguna telah berhasil di-reset.',
                            icon: 'success',
                            confirmButtonColor: '#0F91FC',
                            customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5' }
                        });
                    }
                });
            }
        });
    };

    return (
        <>
            <Head title="Konfigurasi Autentikasi 2FA - SSO Sekolah" />

            <div className="w-full max-w-6xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white">
                                Konfigurasi Autentikasi 2FA
                            </h1>
                            {data.two_factor_enabled ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Aktif Terlindungi
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                                    Nonaktif
                                </span>
                            )}
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                            Kelola kebijakan otentikasi dua faktor (Two-Factor Authentication / TOTP & Email OTP) untuk mengamankan akses akun di seluruh portal sekolah.
                        </p>
                    </div>

                    {statistik.total_aktif_2fa > 0 && (
                        <button
                            type="button"
                            onClick={tanganiResetSemua2FA}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 transition-all shrink-0 cursor-pointer"
                            title="Reset darurat seluruh kunci 2FA pengguna"
                        >
                            <span className="material-symbols-rounded text-base">lock_reset</span>
                            Reset Massal 2FA
                        </button>
                    )}
                </div>

                {/* Ringkasan Metrik / Statistik */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Card 1: Status Sistem */}
                    <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Status 2FA</span>
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${data.two_factor_enabled ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700'}`}>
                                <span className="material-symbols-rounded text-xl">security</span>
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-xl font-extrabold text-slate-800 dark:text-white">
                                {data.two_factor_enabled ? 'Aktif' : 'Nonaktif'}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5 truncate">
                                Mode: {data.two_factor_enforcement === 'all' ? 'Semua Pengguna' : (data.two_factor_enforcement === 'roles' ? 'Wajib Peran' : 'Sukarela')}
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Pengguna Wajib */}
                    <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Wajib 2FA</span>
                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#0F91FC] dark:bg-blue-950/50 dark:text-blue-400 flex items-center justify-center">
                                <span className="material-symbols-rounded text-xl">policy</span>
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-xl font-extrabold text-slate-800 dark:text-white">
                                {statistik.total_wajib || 0} Akun
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                                Dari total {statistik.total_pengguna || 0} akun
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Adopsi Aktif */}
                    <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sudah Aktif</span>
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center">
                                <span className="material-symbols-rounded text-xl">verified_user</span>
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                                {statistik.total_aktif_2fa || 0} Akun
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-emerald-500 rounded-full transition-all"
                                        style={{ width: `${Math.min(statistik.persentase_adopsi || 0, 100)}%` }}
                                    ></div>
                                </div>
                                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                                    {statistik.persentase_adopsi || 0}%
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Card 4: Belum Aktif */}
                    <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col justify-between">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Belum Setup</span>
                            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 flex items-center justify-center">
                                <span className="material-symbols-rounded text-xl">gpp_maybe</span>
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400">
                                {statistik.total_belum_aktif || 0} Akun
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                                Belum memasang 2FA
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tab Switcher */}
                <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-x-auto">
                    <button
                        type="button"
                        onClick={() => setTabAktif('kebijakan')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                            tabAktif === 'kebijakan'
                                ? 'bg-[#0F91FC] text-white shadow-md shadow-[#0F91FC]/25'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                        }`}
                    >
                        <span className="material-symbols-rounded text-lg">tune</span>
                        Kebijakan & Aturan Sistem
                    </button>

                    <button
                        type="button"
                        onClick={() => setTabAktif('pengguna')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                            tabAktif === 'pengguna'
                                ? 'bg-[#0F91FC] text-white shadow-md shadow-[#0F91FC]/25'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                        }`}
                    >
                        <span className="material-symbols-rounded text-lg">manage_accounts</span>
                        Monitoring Pengguna ({statistik.total_pengguna || 0})
                    </button>

                    <button
                        type="button"
                        onClick={() => setTabAktif('panduan')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer whitespace-nowrap ${
                            tabAktif === 'panduan'
                                ? 'bg-[#0F91FC] text-white shadow-md shadow-[#0F91FC]/25'
                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                        }`}
                    >
                        <span className="material-symbols-rounded text-lg">menu_book</span>
                        Panduan Teknis & Aplikasi
                    </button>
                </div>

                {/* TAB 1: FORM KEBIJAKAN 2FA */}
                {tabAktif === 'kebijakan' && (
                    <form onSubmit={tanganiSimpanKebijakan} className="space-y-6">
                        
                        {/* Sakelar Global 2FA */}
                        <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 lg:p-8 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-700/50">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                        Aktifkan Fitur Autentikasi Dua Faktor (2FA)
                                    </h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-0.5">
                                        Saat diaktifkan, pengguna yang memenuhi kriteria kebijakan akan diminta memverifikasi kode OTP saat login.
                                    </p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                    <input 
                                        type="checkbox" 
                                        checked={data.two_factor_enabled}
                                        onChange={e => setData('two_factor_enabled', e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-14 h-8 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-slate-600 peer-checked:bg-[#0F91FC]"></div>
                                </label>
                            </div>

                            {/* Mode Penerapan (Enforcement Policy) */}
                            <div className="space-y-3">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                                    Kebijakan Penerapan 2FA
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    {/* Opsi 1: Wajib untuk Peran Tertentu */}
                                    <div 
                                        onClick={() => setData('two_factor_enforcement', 'roles')}
                                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                                            data.two_factor_enforcement === 'roles'
                                                ? 'border-[#0F91FC] bg-blue-50/50 dark:bg-blue-950/20'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <span className="material-symbols-rounded text-2xl text-[#0F91FC]">badge</span>
                                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                                                    Rekomendasi
                                                </span>
                                            </div>
                                            <h4 className="font-extrabold text-sm text-slate-800 dark:text-white mt-2">
                                                Wajib Berdasarkan Peran
                                            </h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                Diwajibkan hanya untuk peran khusus (misal Admin & Superadmin), sedangkan peran lain tetap fleksibel.
                                            </p>
                                        </div>
                                        <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-[#0F91FC]">
                                            <span className="material-symbols-rounded text-base">
                                                {data.two_factor_enforcement === 'roles' ? 'radio_button_checked' : 'radio_button_unchecked'}
                                            </span>
                                            Pilih Opsi Ini
                                        </div>
                                    </div>

                                    {/* Opsi 2: Wajib untuk Semua Pengguna */}
                                    <div 
                                        onClick={() => setData('two_factor_enforcement', 'all')}
                                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                                            data.two_factor_enforcement === 'all'
                                                ? 'border-[#0F91FC] bg-blue-50/50 dark:bg-blue-950/20'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <span className="material-symbols-rounded text-2xl text-[#0F91FC]">groups</span>
                                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                                    Ketat
                                                </span>
                                            </div>
                                            <h4 className="font-extrabold text-sm text-slate-800 dark:text-white mt-2">
                                                Wajib untuk Semua Akun
                                            </h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                Seluruh pengguna tanpa terkecuali (Guru, Tendik, Siswa, Admin) wajib mengaktifkan 2FA.
                                            </p>
                                        </div>
                                        <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-[#0F91FC]">
                                            <span className="material-symbols-rounded text-base">
                                                {data.two_factor_enforcement === 'all' ? 'radio_button_checked' : 'radio_button_unchecked'}
                                            </span>
                                            Pilih Opsi Ini
                                        </div>
                                    </div>

                                    {/* Opsi 3: Sukarela / Opsional */}
                                    <div 
                                        onClick={() => setData('two_factor_enforcement', 'optional')}
                                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                                            data.two_factor_enforcement === 'optional'
                                                ? 'border-[#0F91FC] bg-blue-50/50 dark:bg-blue-950/20'
                                                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between">
                                                <span className="material-symbols-rounded text-2xl text-[#0F91FC]">volunteer_activism</span>
                                                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300">
                                                    Fleksibel
                                                </span>
                                            </div>
                                            <h4 className="font-extrabold text-sm text-slate-800 dark:text-white mt-2">
                                                Sukarela / Mandiri
                                            </h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                                Pengguna tidak dipaksa, namun mereka dapat mengaktifkan 2FA secara mandiri di halaman Keamanan Akun.
                                            </p>
                                        </div>
                                        <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-[#0F91FC]">
                                            <span className="material-symbols-rounded text-base">
                                                {data.two_factor_enforcement === 'optional' ? 'radio_button_checked' : 'radio_button_unchecked'}
                                            </span>
                                            Pilih Opsi Ini
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Daftar Peran yang Diwajibkan (Jika Mode 'roles') */}
                            {data.two_factor_enforcement === 'roles' && (
                                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/60 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <label className="text-xs font-bold uppercase text-slate-600 dark:text-slate-300">
                                                Pilih Peran yang Diwajibkan 2FA:
                                            </label>
                                            <p className="text-xs text-slate-400">
                                                Klik untuk mencentang peran yang wajib mengaktifkan 2FA.
                                            </p>
                                        </div>
                                        <span className="text-xs font-bold text-[#0F91FC]">
                                            {data.two_factor_roles.length} Peran Terpilih
                                        </span>
                                    </div>

                                    <div className="flex flex-wrap gap-2 pt-1">
                                        {semuaPeran.map((peran) => {
                                            const terpilih = data.two_factor_roles.includes(peran.nama_role);
                                            return (
                                                <button
                                                    key={peran.id}
                                                    type="button"
                                                    onClick={() => tanganiToggleRole(peran.nama_role)}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                                        terpilih
                                                            ? 'bg-[#0F91FC] text-white shadow-sm'
                                                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                                                    }`}
                                                >
                                                    <span className="material-symbols-rounded text-sm">
                                                        {terpilih ? 'check_box' : 'check_box_outline_blank'}
                                                    </span>
                                                    {peran.nama_role}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Metode 2FA yang Diizinkan */}
                            <div className="space-y-3 pt-2">
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-200">
                                    Metode 2FA yang Diizinkan
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* TOTP */}
                                    <div 
                                        onClick={() => tanganiToggleMethod('totp')}
                                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                                            data.two_factor_allowed_methods.includes('totp')
                                                ? 'border-[#0F91FC] bg-blue-50/30 dark:bg-blue-950/20'
                                                : 'border-slate-200 dark:border-slate-700'
                                        }`}
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0F91FC] dark:bg-blue-900/40 flex items-center justify-center shrink-0">
                                            <span className="material-symbols-rounded text-xl">phonelink_lock</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h5 className="font-extrabold text-sm text-slate-800 dark:text-white">
                                                    Aplikasi Authenticator (TOTP)
                                                </h5>
                                                <span className="material-symbols-rounded text-[#0F91FC]">
                                                    {data.two_factor_allowed_methods.includes('totp') ? 'check_circle' : 'circle'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                Google Authenticator, Microsoft Authenticator, Authy, dll. Paling direkomendasikan & bekerja offline.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Email OTP */}
                                    <div 
                                        onClick={() => tanganiToggleMethod('email')}
                                        className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-start gap-3.5 ${
                                            data.two_factor_allowed_methods.includes('email')
                                                ? 'border-[#0F91FC] bg-blue-50/30 dark:bg-blue-950/20'
                                                : 'border-slate-200 dark:border-slate-700'
                                        }`}
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
                                            <span className="material-symbols-rounded text-xl">mail_lock</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <h5 className="font-extrabold text-sm text-slate-800 dark:text-white">
                                                    Kode Verifikasi Email (Email OTP)
                                                </h5>
                                                <span className="material-symbols-rounded text-[#0F91FC]">
                                                    {data.two_factor_allowed_methods.includes('email') ? 'check_circle' : 'circle'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                Kode 6 digit dikirimkan ke email akun terdaftar pengguna dengan masa berlaku 10 menit.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <InputError message={errors.two_factor_allowed_methods} />
                            </div>

                            {/* Konfigurasi Tambahan: Masa Tenggang & Remember Browser */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Masa Tenggang Pengguna Baru (Grace Period)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="365"
                                            value={data.two_factor_grace_period_days}
                                            onChange={e => setData('two_factor_grace_period_days', parseInt(e.target.value) || 0)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm focus:border-[#0F91FC] focus:outline-none"
                                        />
                                        <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400 pointer-events-none">
                                            Hari
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400">
                                        Waktu yang diberikan bagi pengguna baru untuk menyetel 2FA sebelum login diblokir.
                                    </p>
                                    <InputError message={errors.two_factor_grace_period_days} />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Ingat Perangkat Terpercaya (Remember Browser)
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="1"
                                            max="365"
                                            value={data.two_factor_remember_browser_days}
                                            onChange={e => setData('two_factor_remember_browser_days', parseInt(e.target.value) || 1)}
                                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm focus:border-[#0F91FC] focus:outline-none"
                                        />
                                        <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400 pointer-events-none">
                                            Hari
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-slate-400">
                                        Perangkat pribadi tidak akan meminta kode 2FA berulang kali selama periode ini.
                                    </p>
                                    <InputError message={errors.two_factor_remember_browser_days} />
                                </div>
                            </div>
                        </div>

                        {/* Tombol Simpan Form */}
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0F91FC] hover:bg-blue-600 text-white font-bold text-sm shadow-lg shadow-blue-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                            >
                                <span className="material-symbols-rounded text-lg">save</span>
                                {processing ? 'Menyimpan...' : 'Simpan Kebijakan 2FA'}
                            </button>
                        </div>
                    </form>
                )}

                {/* TAB 2: MONITORING PENGGUNA 2FA */}
                {tabAktif === 'pengguna' && (
                    <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 lg:p-8 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-6">
                        
                        {/* Filter Bar */}
                        <form onSubmit={tanganiCari} className="flex flex-col sm:flex-row gap-3">
                            <div className="flex-1 relative">
                                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <span className="material-symbols-rounded text-lg">search</span>
                                </span>
                                <input
                                    type="text"
                                    placeholder="Cari nama, email, NIP, atau NISN..."
                                    value={cari}
                                    onChange={e => setCari(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm focus:border-[#0F91FC] focus:outline-none"
                                />
                            </div>

                            <div className="w-full sm:w-44">
                                <select
                                    value={filterPeran}
                                    onChange={e => setFilterPeran(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm focus:border-[#0F91FC] focus:outline-none"
                                >
                                    <option value="semua">Semua Peran</option>
                                    {semuaPeran.map(p => (
                                        <option key={p.id} value={p.nama_role}>{p.nama_role}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="w-full sm:w-44">
                                <select
                                    value={filterStatus}
                                    onChange={e => setFilterStatus(e.target.value)}
                                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm focus:border-[#0F91FC] focus:outline-none"
                                >
                                    <option value="">Semua Status 2FA</option>
                                    <option value="aktif">Sudah Aktif</option>
                                    <option value="belum_aktif">Belum Aktif</option>
                                </select>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="px-4 py-2.5 bg-[#0F91FC] hover:bg-blue-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-blue-500/10 cursor-pointer"
                                >
                                    Terapkan
                                </button>
                                {(cari || filterPeran !== 'semua' || filterStatus) && (
                                    <button
                                        type="button"
                                        onClick={resetFilter}
                                        className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold transition-all cursor-pointer"
                                        title="Reset Filter"
                                    >
                                        <span className="material-symbols-rounded text-lg">filter_alt_off</span>
                                    </button>
                                )}
                            </div>
                        </form>

                        {/* Tabel Status Pengguna */}
                        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-700/60">
                            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                                <thead className="bg-slate-50/80 dark:bg-slate-900/60 text-xs uppercase font-extrabold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-700/60">
                                    <tr>
                                        <th className="px-4 py-3.5">Pengguna</th>
                                        <th className="px-4 py-3.5">Peran</th>
                                        <th className="px-4 py-3.5">Kebijakan</th>
                                        <th className="px-4 py-3.5">Status 2FA</th>
                                        <th className="px-4 py-3.5">Tanggal Setup</th>
                                        <th className="px-4 py-3.5 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 font-normal">
                                    {daftarPengguna.data.length > 0 ? (
                                        daftarPengguna.data.map((user) => (
                                            <tr key={user.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                                                {/* Kolom Profil */}
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <img
                                                            src={user.avatar_url}
                                                            alt={user.nama_lengkap}
                                                            className="w-9 h-9 rounded-full object-cover shadow-sm bg-slate-100 shrink-0"
                                                        />
                                                        <div className="min-w-0">
                                                            <div className="font-bold text-slate-800 dark:text-white truncate">
                                                                {user.nama_lengkap}
                                                            </div>
                                                            <div className="text-xs text-slate-400 truncate">
                                                                {user.email || user.nip_nis || '-'}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Kolom Peran */}
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-wrap gap-1">
                                                        {user.roles.map((r, i) => (
                                                            <span key={i} className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                                                {r}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>

                                                {/* Kolom Kebijakan */}
                                                <td className="px-4 py-3">
                                                    {user.is_required ? (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
                                                            <span className="material-symbols-rounded text-xs">gavel</span>
                                                            Wajib
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                                            Sukarela
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Kolom Status 2FA */}
                                                <td className="px-4 py-3">
                                                    {user.has_2fa ? (
                                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50">
                                                            <span className="material-symbols-rounded text-sm">verified_user</span>
                                                            Aktif ({user.two_factor_type === 'email' ? 'Email' : 'App TOTP'})
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                                                            <span className="material-symbols-rounded text-sm">pending</span>
                                                            Belum Aktif
                                                        </div>
                                                    )}
                                                </td>

                                                {/* Tanggal Setup */}
                                                <td className="px-4 py-3 text-xs text-slate-400">
                                                    {user.two_factor_confirmed_at || '-'}
                                                </td>

                                                {/* Aksi Reset 2FA */}
                                                <td className="px-4 py-3 text-right">
                                                    {user.has_2fa ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => tanganiResetUser2FA(user)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50 transition-all cursor-pointer"
                                                            title="Reset 2FA pengguna jika ponsel hilang atau ganti perangkat"
                                                        >
                                                            <span className="material-symbols-rounded text-sm">lock_reset</span>
                                                            Reset
                                                        </button>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic">
                                                            Tidak ada kunci
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="text-center py-8 text-slate-400">
                                                <span className="material-symbols-rounded text-3xl block mb-1">person_search</span>
                                                Tidak ada data pengguna yang cocok dengan filter pencarian.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginasi */}
                        {daftarPengguna.links && daftarPengguna.links.length > 3 && (
                            <div className="flex items-center justify-between pt-2">
                                <span className="text-xs text-slate-400">
                                    Menampilkan {daftarPengguna.from || 0} - {daftarPengguna.to || 0} dari {daftarPengguna.total || 0} pengguna
                                </span>
                                <div className="flex gap-1">
                                    {daftarPengguna.links.map((link, index) => (
                                        <Link
                                            key={index}
                                            href={link.url || '#'}
                                            preserveScroll
                                            preserveState
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                                link.active
                                                    ? 'bg-[#0F91FC] text-white'
                                                    : link.url
                                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                                                    : 'text-slate-300 dark:text-slate-600 cursor-not-allowed'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB 3: PANDUAN TEKNIS & APLIKASI */}
                {tabAktif === 'panduan' && (
                    <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 lg:p-8 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                Panduan Teknis & Aplikasi Authenticator
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                                Informasi lengkap bagi admin dan pengelola sekolah mengenai implementasi 2FA.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            {/* Card Aplikasi Android/iOS */}
                            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
                                <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#0F91FC] dark:bg-blue-900/40 flex items-center justify-center">
                                    <span className="material-symbols-rounded text-xl">install_mobile</span>
                                </div>
                                <h4 className="font-extrabold text-slate-800 dark:text-white text-base">
                                    Aplikasi Authenticator yang Kompatibel
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Sistem SSO Sekolah menggunakan standar RFC 6238 (TOTP) yang didukung oleh seluruh aplikasi autentikasi terkemuka:
                                </p>
                                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-2 pt-1">
                                    <li className="flex items-center gap-2">
                                        <span className="material-symbols-rounded text-emerald-500 text-sm">check_circle</span>
                                        <b>Google Authenticator</b> (Android / iOS)
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="material-symbols-rounded text-emerald-500 text-sm">check_circle</span>
                                        <b>Microsoft Authenticator</b> (Android / iOS)
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="material-symbols-rounded text-emerald-500 text-sm">check_circle</span>
                                        <b>2FAS Authenticator</b> (Open Source & Tanpa Akun)
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <span className="material-symbols-rounded text-emerald-500 text-sm">check_circle</span>
                                        <b>Twilio Authy</b> atau <b>Bitwarden Authenticator</b>
                                    </li>
                                </ul>
                            </div>

                            {/* Prosedur Ponsel Hilang */}
                            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 space-y-3">
                                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-900/40 flex items-center justify-center">
                                    <span className="material-symbols-rounded text-xl">contact_support</span>
                                </div>
                                <h4 className="font-extrabold text-slate-800 dark:text-white text-base">
                                    Prosedur Jika Ponsel Guru/Siswa Hilang
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                    Jika ada staf atau siswa yang kehilangan ponsel atau tidak sengaja menghapus aplikasi authenticator:
                                </p>
                                <ol className="list-decimal list-inside text-xs text-slate-600 dark:text-slate-300 space-y-2 pt-1 pl-1">
                                    <li>Buka tab <b>Monitoring Pengguna</b> di menu ini.</li>
                                    <li>Cari nama atau email pengguna yang bersangkutan.</li>
                                    <li>Klik tombol merah <b>Reset</b> pada baris pengguna tersebut.</li>
                                    <li>Kunci 2FA akun akan dihapus dan pengguna dapat langsung login serta mengatur ulang 2FA pada perangkat barunya.</li>
                                </ol>
                            </div>
                        </div>

                        {/* Banner Catatan Keamanan */}
                        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 flex items-start gap-3">
                            <span className="material-symbols-rounded text-blue-600 dark:text-blue-400 text-xl shrink-0 mt-0.5">info</span>
                            <div className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed">
                                <b>Tips Praktik Terbaik:</b> Kami menyarankan mewajibkan 2FA minimal untuk peran <b>Super Admin</b> dan <b>Admin</b> demi mencegah pengambilalihan akun pengelola sistem sekolah dari serangan peretasan kredensial.
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}

Konfigurasi2FA.layout = page => <TataLetakUtama children={page} title="Konfigurasi Autentikasi 2FA" />;
