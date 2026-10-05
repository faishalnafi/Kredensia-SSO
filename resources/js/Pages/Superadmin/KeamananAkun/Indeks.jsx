import React, { useState } from 'react';
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
        nama_lengkap: dataAwal.nama_lengkap || '',
        email: dataAwal.email || '',
        jk: dataAwal.jk || '',
        tgl_lahir: tanggalLahirAwal,
        nik: dataAwal.nik || '',
        nip_nis: dataAwal.nip_nis || '',
        no_telp: dataAwal.no_telp || '',
        alamat: dataAwal.alamat || '',
    });

    const perbaruiKataSandi = (e) => {
        e.preventDefault();
        formSandi.put(route('password.update'), {
            preserveScroll: true,
            onSuccess: () => formSandi.reset(),
        });
    };

    const ajukanPerbaikanProfil = (e) => {
        e.preventDefault();
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

    const formKonfirmasi2FA = useForm({
        code: '',
    });

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
                    title: '2FA Berhasil Aktif!',
                    text: 'Autentikasi Dua Faktor (2FA) telah berhasil diaktifkan. Akun Anda kini terlindungi.',
                    customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5' }
                });
            }
        });
    };

    const konfirmasiNonaktifkan2FA = async () => {
        const { value: password } = await Swal.fire({
            title: 'Nonaktifkan 2FA?',
            text: 'Masukkan kata sandi akun Anda untuk mengonfirmasi penonaktifan Autentikasi Dua Faktor.',
            input: 'password',
            inputPlaceholder: 'Kata sandi akun Anda saat ini',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: '🔓 Nonaktifkan 2FA',
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
                        title: '2FA Dinonaktifkan',
                        text: 'Autentikasi Dua Faktor telah berhasil dinonaktifkan.',
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
        const text = "KODE PEMULIHAN 2FA CADANGAN (SSO SEKOLAH)\n" +
            "Email: " + (pengguna?.email || '') + "\n" +
            "Waktu: " + new Date().toLocaleString('id-ID') + "\n\n" +
            "PERINGATAN: Simpan kode ini di tempat aman. Setiap kode hanya dapat dipakai 1 kali untuk login saat ponsel Anda hilang:\n" +
            codes.map((c, i) => `${i + 1}. ${c}`).join("\n");
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sso-recovery-codes-${pengguna?.email || 'backup'}.txt`;
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
                                disabled={formProfil.processing}
                                className="bg-[#0F91FC] hover:bg-[#0a78d6] text-white px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-[#0F91FC]/20 disabled:opacity-50 flex items-center gap-1.5"
                            >
                                <span className="material-symbols-rounded text-sm">send</span>
                                {formProfil.processing ? 'Mengirim...' : (pendingCorrection ? 'Kirim Ulang Pengajuan' : 'Ajukan Perubahan Data')}
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

                {/* 3. Panel Autentikasi Dua Faktor (2FA) */}
                <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 lg:p-8 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-[#0F91FC]/10 text-[#0F91FC] flex items-center justify-center flex-shrink-0">
                                <span className="material-symbols-rounded text-2xl">security</span>
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Autentikasi Dua Faktor (2FA)</h2>
                                    {twoFactor?.enabled ? (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                            Aktif
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                                            Belum Aktif
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Lindungi akun Anda dengan lapisan keamanan ganda menggunakan kode 6-digit dari aplikasi authenticator ponsel.
                                </p>
                            </div>
                        </div>
                    </div>

                    {twoFactor?.is_required && !twoFactor?.enabled && (
                        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex gap-3 text-amber-700 dark:text-amber-400">
                            <span className="material-symbols-rounded text-2xl flex-shrink-0">warning</span>
                            <div className="text-xs leading-relaxed">
                                <span className="font-bold block">Kebijakan Keamanan Sekolah Mewajibkan 2FA</span>
                                <span className="block mt-0.5">
                                    Peran akun Anda diwajibkan untuk mengaktifkan Autentikasi Dua Faktor demi menjaga kerahasiaan dan integritas data institusi. Silakan klik tombol di bawah untuk mengaktifkannya sekarang.
                                </span>
                            </div>
                        </div>
                    )}

                    {twoFactor?.enabled ? (
                        <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-2xl p-5 space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="space-y-1">
                                    <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                                        <span className="material-symbols-rounded text-lg text-emerald-600 dark:text-emerald-400">check_circle</span>
                                        2FA Sedang Aktif & Melindungi Akun Anda
                                    </p>
                                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                                        Metode: <strong className="font-semibold">Aplikasi Authenticator (Google Authenticator / Authy)</strong>
                                        {twoFactor?.confirmed_at && <span> • Dikonfirmasi sejak: {twoFactor.confirmed_at}</span>}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={konfirmasiNonaktifkan2FA}
                                    className="text-xs bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-600 dark:text-red-400 font-bold px-4 py-2.5 rounded-xl border border-red-200 dark:border-red-800 transition-all flex items-center gap-1.5 self-start sm:self-center shadow-sm"
                                >
                                    <span className="material-symbols-rounded text-base">lock_open</span>
                                    <span>Nonaktifkan 2FA</span>
                                </button>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal border-t border-emerald-100 dark:border-emerald-900/50 pt-3">
                                💡 Setiap kali Anda masuk ke sistem SSO pada perangkat atau browser baru, Anda akan diminta memasukkan kode 6 digit dari aplikasi autentikator di ponsel Anda.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-2">
                                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                    Aktifkan Verifikasi Dua Langkah
                                </p>
                                <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-1">
                                    <li className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#0F91FC]"></span>
                                        Pindai QR code dengan Google Authenticator atau Authy
                                    </li>
                                    <li className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#0F91FC]"></span>
                                        Dapatkan 8 kode pemulihan darurat jika ponsel hilang
                                    </li>
                                </ul>
                            </div>
                            <button
                                type="button"
                                onClick={mulaiSetup2FA}
                                disabled={loadingSetup}
                                className="bg-[#0F91FC] hover:bg-[#0a78d6] text-white px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#0F91FC]/20 disabled:opacity-50 flex items-center justify-center gap-2 self-start md:self-center whitespace-nowrap"
                            >
                                {loadingSetup ? (
                                    <>
                                        <span className="material-symbols-rounded animate-spin text-base">progress_activity</span>
                                        <span>Menyiapkan...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-rounded text-base">qr_code_scanner</span>
                                        <span>Aktifkan 2FA Sekarang</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>

                {/* Modal Setup 2FA Mandiri */}
                {modal2FAOpen && setup2FAData && (
                    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative space-y-6 max-h-[90vh] overflow-y-auto">
                            
                            {/* Tombol Tutup */}
                            <button
                                type="button"
                                onClick={() => setModal2FAOpen(false)}
                                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                <span className="material-symbols-rounded text-xl">close</span>
                            </button>

                            {/* Header Modal */}
                            <div>
                                <div className="w-12 h-12 rounded-2xl bg-[#0F91FC]/10 text-[#0F91FC] flex items-center justify-center mb-3">
                                    <span className="material-symbols-rounded text-2xl">qr_code_2</span>
                                </div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white">
                                    Setup Autentikasi Dua Faktor (2FA)
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                    Ikuti langkah-langkah di bawah untuk menghubungkan akun SSO Anda dengan aplikasi autentikator di ponsel.
                                </p>
                            </div>

                            {/* Langkah 1: Pindai QR Code */}
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

                                {/* Atau Masukkan Kunci Manual */}
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
                                            title="Salin Kunci"
                                        >
                                            <span className="material-symbols-rounded text-sm">
                                                {salinSecretSukses ? 'check' : 'content_copy'}
                                            </span>
                                            <span>{salinSecretSukses ? 'Disalin' : 'Salin'}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Langkah 2: Simpan Kode Pemulihan Cadangan */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                                        <span className="w-5 h-5 rounded-full bg-[#0F91FC] text-white flex items-center justify-center text-[11px]">2</span>
                                        <span>Kode Pemulihan Darurat (8 Kode)</span>
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
                                <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 text-[11px] text-amber-800 dark:text-amber-300 leading-normal">
                                    ⚠️ Simpan kode berikut di tempat yang aman. Jika ponsel Anda hilang, Anda dapat masuk menggunakan salah satu kode ini.
                                </div>
                                <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-950 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
                                    {(setup2FAData.recovery_codes || []).map((kode, idx) => (
                                        <div
                                            key={idx}
                                            className="font-mono text-[11px] font-bold text-center py-1.5 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-700 dark:text-slate-300"
                                        >
                                            {kode}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Langkah 3: Masukkan Kode OTP 6 Digit untuk Konfirmasi */}
                            <form onSubmit={kirimKonfirmasi2FA} className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
                                        <span className="w-5 h-5 rounded-full bg-[#0F91FC] text-white flex items-center justify-center text-[11px]">3</span>
                                        <span>Verifikasi Kode OTP 6 Digit</span>
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        Masukkan kode 6 digit yang sedang aktif di aplikasi autentikator Anda:
                                    </p>
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
                                        className="bg-[#0F91FC] hover:bg-[#0a78d6] text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-[#0F91FC]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                                    >
                                        {formKonfirmasi2FA.processing ? (
                                            <>
                                                <span className="material-symbols-rounded animate-spin text-sm">progress_activity</span>
                                                <span>Memverifikasi...</span>
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-rounded text-sm">verified_user</span>
                                                <span>Konfirmasi & Aktifkan</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
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
                                                <span>{sesi.adalah_saat_ini ? 'Sesi Aktif Saat Ini' : `Aktif ${sesi.terakhir_aktif}`}</span>
                                            </p>
                                        </div>
                                    </div>
                                    
                                    {sesi.adalah_saat_ini ? (
                                        <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                                            Aktif
                                        </span>
                                    ) : (
                                        <button 
                                            onClick={() => akhiriSesi(sesi.id)}
                                            className="text-red-500 hover:text-red-700 dark:hover:text-red-400 text-xs font-bold uppercase tracking-wider transition-colors px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"
                                        >
                                            Akhiri Sesi
                                        </button>
                                    )}
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
