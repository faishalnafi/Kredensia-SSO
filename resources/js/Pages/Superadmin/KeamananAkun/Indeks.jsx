import React from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import TataLetakUtama from '@/Layouts/TataLetakUtama';
import InputError from '@/Components/InputError';

export default function KeamananAkun({ daftarSesi = [], pengguna = {}, pendingCorrection = null }) {
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
    const akhiriSesi = (id) => {
        if (confirm('Apakah Anda yakin ingin mengakhiri sesi perangkat ini? Perangkat tersebut akan otomatis keluar (logout).')) {
            router.delete(route('keamanan.sesi.hapus', id), {
                preserveScroll: true
            });
        }
    };

    // Fungsi untuk mengakhiri seluruh sesi perangkat lainnya
    const akhiriSesiLainnya = () => {
        if (confirm('Apakah Anda yakin ingin mengakhiri semua sesi perangkat lainnya? Semua browser lain yang terhubung dengan akun ini akan langsung keluar.')) {
            router.post(route('keamanan.sesi.hapus_lainnya'), {}, {
                preserveScroll: true
            });
        }
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
                                <label className="block text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-2">NIK (KTP)</label>
                                <input 
                                    type="text" 
                                    value={formProfil.data.nik}
                                    onChange={e => formProfil.setData('nik', e.target.value)}
                                    placeholder="Masukkan NIK"
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white"
                                />
                                <InputError message={formProfil.errors.nik} className="mt-1" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-2">NIP / NISN</label>
                                <input 
                                    type="text" 
                                    value={formProfil.data.nip_nis}
                                    onChange={e => formProfil.setData('nip_nis', e.target.value)}
                                    placeholder="Masukkan NIP atau NISN"
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
                                <label className="block text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-2">Tanggal Lahir</label>
                                <input 
                                    type="date" 
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

                {/* 3. Panel Sesi Perangkat Aktif */}
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
