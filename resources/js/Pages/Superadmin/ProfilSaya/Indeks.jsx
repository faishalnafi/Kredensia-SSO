import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import TataLetakUtama from '@/Layouts/TataLetakUtama';

export default function ProfilSaya({ pengguna }) {
    const { props } = usePage();
    const roles = props.auth?.user?.peran || [];

    return (
        <>
            <Head title="Profil Saya - SingleSignOn" />
            
            <div className="w-full max-w-4xl mx-auto space-y-6">
                <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 lg:p-8 border border-slate-100 dark:border-slate-700/50 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-700/50 mb-6">
                        <img 
                            src={pengguna?.avatar_url || 'https://www.gravatar.com/avatar/?s=256&d=identicon'} 
                            alt={pengguna?.nama_lengkap} 
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                                e.currentTarget.onerror = null;
                                e.currentTarget.src = 'https://www.gravatar.com/avatar/?s=256&d=identicon';
                            }}
                            className="w-24 h-24 rounded-full object-cover shadow-lg shadow-slate-200 dark:shadow-none border-2 border-white dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
                        />
                        <div className="text-center sm:text-left space-y-2">
                            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">{pengguna?.nama_lengkap}</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">{pengguna?.email}</p>
                            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                                {roles.map((role, index) => (
                                    <span 
                                        key={index} 
                                        className="inline-block bg-blue-100 text-blue-700 dark:bg-[#ff6b39]/10 dark:text-[#ff6b39] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider"
                                    >
                                        {role}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">UUID (ID Pengguna)</label>
                            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-600 dark:text-slate-300 font-mono flex items-center justify-between">
                                <span>{pengguna?.id || '-'}</span>
                                <span className="text-[11px] font-sans text-slate-400 font-normal">Sistem ID (UUID)</span>
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Username</label>
                            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-600 dark:text-slate-300 font-mono flex items-center justify-between gap-2">
                                <span className={pengguna?.username ? 'font-bold text-slate-800 dark:text-white' : 'text-slate-400 dark:text-slate-500 italic font-sans'}>
                                    {pengguna?.username ? `@${pengguna.username}` : 'Belum diatur'}
                                </span>
                                <span className="text-[11px] font-sans text-slate-400 font-normal">
                                    {pengguna?.username ? 'Alias Akses Sistem (Pengganti Email / UUID)' : 'Dapat diatur di menu Keamanan Akun'}
                                </span>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Nomor Induk Kependudukan (NIK)</label>
                            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-600 dark:text-slate-300 font-semibold">
                                {pengguna?.nik || '-'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">
                                {(pengguna?.peran || []).some(p => p === 'Guru' || p === 'guru') ? 'Nomor Induk Pegawai (NIP)' : 'Nomor Induk Siswa Nasional (NISN)'}
                            </label>
                            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-600 dark:text-slate-300 font-semibold">
                                {pengguna?.nip_nis || '-'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Nomor Telepon</label>
                            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-600 dark:text-slate-300 font-semibold">
                                {pengguna?.no_telp || '-'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Jenis Kelamin</label>
                            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-600 dark:text-slate-300 font-semibold uppercase">
                                {pengguna?.jk === 'L' ? 'Laki-laki' : pengguna?.jk === 'P' ? 'Perempuan' : '-'}
                            </div>
                        </div>
                    </div>

                    {/* Pintasan Keamanan & 2FA */}
                    <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#0F91FC]/10 text-[#0F91FC] flex items-center justify-center flex-shrink-0">
                                <span className="material-symbols-rounded text-xl">security</span>
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-slate-800 dark:text-white">Keamanan Akun & Autentikasi 2FA</h4>
                                <p className="text-xs text-slate-400">Kelola kata sandi, aktifkan verifikasi dua langkah (2FA), dan pantau sesi perangkat aktif Anda.</p>
                            </div>
                        </div>
                        <Link
                            href={route('keamanan.indeks')}
                            className="bg-[#0F91FC] hover:bg-[#0a78d6] text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-[#0F91FC]/20 flex items-center gap-1.5 self-start sm:self-center whitespace-nowrap"
                        >
                            <span>Kelola Keamanan</span>
                            <span className="material-symbols-rounded text-sm">arrow_forward</span>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    );
}


ProfilSaya.layout = page => <TataLetakUtama children={page} title="Profil Saya" />;
