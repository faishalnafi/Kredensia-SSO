import React from 'react';
import { Head, usePage } from '@inertiajs/react';
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
                        {pengguna?.avatar_url ? (
                            <img 
                                src={pengguna.avatar_url} 
                                alt={pengguna.nama_lengkap} 
                                className="w-24 h-24 rounded-full object-cover shadow-lg shadow-slate-200 dark:shadow-none border-2 border-white dark:border-slate-700"
                            />
                        ) : (
                            <div className="w-24 h-24 rounded-full bg-[#0F91FC] text-white flex items-center justify-center text-3xl font-extrabold shadow-lg shadow-[#0F91FC]/20">
                                {pengguna?.nama_lengkap?.charAt(0)}
                            </div>
                        )}
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
                        <div>
                            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Nomor Induk Kependudukan (NIK)</label>
                            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-600 dark:text-slate-300 font-semibold">
                                {pengguna?.nik || '-'}
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">NIP / NISN</label>
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
                </div>
            </div>
        </>
    );
}


ProfilSaya.layout = page => <TataLetakUtama children={page} title="Profil Saya" />;
