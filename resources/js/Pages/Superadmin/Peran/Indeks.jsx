import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import TataLetakUtama from '@/Layouts/TataLetakUtama';
import InputError from '@/Components/InputError';
import Swal from 'sweetalert2';

export default function IndeksPeran({ daftarPeran = [] }) {

    const [modalBuka, setModalBuka] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedRoleId, setSelectedRoleId] = useState(null);
    const [cari, setCari] = useState('');

    const {
        data,
        setData,
        post,
        put,
        delete: destroy,
        reset,
        processing,
        errors,
        clearErrors
    } = useForm({
        nama_role: '',
        is_active: true,
    });

    const isSystemRole = (nama) => {
        const lower = nama.toLowerCase();
        return ['super admin', 'superadmin', 'admin'].includes(lower);
    };

    const bukaModalTambah = () => {
        reset();
        clearErrors();
        setEditMode(false);
        setSelectedRoleId(null);
        setModalBuka(true);
    };

    const bukaModalEdit = (role) => {
        clearErrors();
        setEditMode(true);
        setSelectedRoleId(role.id);
        setData({
            nama_role: role.nama_role,
            is_active: role.is_active,
        });
        setModalBuka(true);
    };

    const tanganiSubmit = (e) => {
        e.preventDefault();
        if (editMode) {
            put(route('superadmin.peran.perbarui', selectedRoleId), {
                onSuccess: () => {
                    setModalBuka(false);
                    reset();
                }
            });
        } else {
            post(route('superadmin.peran.simpan'), {
                onSuccess: () => {
                    setModalBuka(false);
                    reset();
                }
            });
        }
    };

    const tanganiHapus = async (role) => {
        if (isSystemRole(role.nama_role)) {
            Swal.fire({
                title: 'Tindakan Ditolak',
                text: 'Peran sistem (Super Admin / Admin) tidak boleh dihapus.',
                icon: 'warning',
                confirmButtonColor: '#0F91FC',
                customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5' }
            });
            return;
        }

        const res = await Swal.fire({
            title: 'Hapus Peran?',
            html: `Apakah Anda yakin ingin menghapus peran <strong>"${role.nama_role}"</strong>?<br/><span style="font-size:0.85rem;color:#ef4444;margin-top:6px;display:block;">Seluruh akses pengguna dan aplikasi yang terhubung ke peran ini akan dilepas.</span>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: '🗑️ Ya, Hapus',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5', cancelButton: 'rounded-xl font-bold px-5 py-2.5' }
        });

        if (res.isConfirmed) {
            destroy(route('superadmin.peran.hapus', role.id), {
                preserveScroll: true
            });
        }
    };

    // Filter pencarian client-side
    const peranTerfilter = daftarPeran.filter(p => 
        p.nama_role.toLowerCase().includes(cari.toLowerCase())
    );

    return (
        <>
            <Head title="Manajemen Peran - SSO Sekolah" />
            
            <div className="w-full max-w-6xl mx-auto space-y-6">
                
                {/* Header Action Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Daftar Peran</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Kelola peran pengguna dan pembatasan akses otentikasi aplikasi SSO.</p>
                    </div>
                    
                    <div className="flex gap-2">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <span className="material-symbols-rounded text-lg">search</span>
                            </span>
                            <input 
                                type="text"
                                placeholder="Cari peran..."
                                value={cari}
                                onChange={e => setCari(e.target.value)}
                                className="pl-10 pr-4 py-2.5 w-48 sm:w-60 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#0F91FC] dark:text-white transition-all shadow-sm"
                            />
                        </div>
                        <button 
                            onClick={bukaModalTambah}
                            className="bg-[#0F91FC] hover:bg-[#0a78d6] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-[#0F91FC]/20 transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-rounded text-lg">add</span>
                            Tambah Peran
                        </button>
                    </div>
                </div>

                {/* Table Area */}
                <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-700/50">
                        <table className="w-full text-left text-sm whitespace-nowrap table-fixed">
                            <thead className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700/50">
                                <tr>
                                    <th className="px-6 py-4 font-bold w-1/2">Nama Peran</th>
                                    <th className="px-6 py-4 font-bold w-1/4">Status</th>
                                    <th className="px-6 py-4 font-bold w-1/4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {peranTerfilter.length > 0 ? (
                                    peranTerfilter.map((peran) => (
                                        <tr key={peran.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                                            <td className="px-6 py-4 truncate font-bold text-slate-700 dark:text-slate-200">
                                                {peran.nama_role}
                                            </td>
                                            <td className="px-6 py-4">
                                                {peran.is_active ? (
                                                    <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                        Aktif
                                                    </span>
                                                ) : (
                                                    <span className="bg-slate-100 text-slate-500 dark:bg-slate-700/30 dark:text-slate-400 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                        Nonaktif
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-2">
                                                <button 
                                                    onClick={() => bukaModalEdit(peran)}
                                                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 p-2 rounded-xl transition-colors"
                                                    title="Edit Peran"
                                                >
                                                    <span className="material-symbols-rounded text-lg">edit</span>
                                                </button>
                                                {!isSystemRole(peran.nama_role) && (
                                                    <button 
                                                        onClick={() => tanganiHapus(peran)}
                                                        className="text-red-500 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-xl transition-colors"
                                                        title="Hapus Peran"
                                                    >
                                                        <span className="material-symbols-rounded text-lg">delete</span>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="text-center py-12 text-slate-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="material-symbols-rounded text-3xl">admin_panel_settings</span>
                                                <span>Tidak ada data peran yang ditemukan.</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Form Dialog */}
            {modalBuka && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700/50 relative">
                        
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                {editMode ? 'Edit Peran' : 'Tambah Peran Baru'}
                            </h3>
                            <button 
                                onClick={() => setModalBuka(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <span className="material-symbols-rounded">close</span>
                            </button>
                        </div>

                        <form onSubmit={tanganiSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                                    Nama Peran
                                </label>
                                <input 
                                    type="text"
                                    value={data.nama_role}
                                    onChange={e => setData('nama_role', e.target.value)}
                                    placeholder="Contoh: Wali Kelas"
                                    disabled={editMode && isSystemRole(data.nama_role)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white disabled:opacity-60"
                                    required
                                />
                                <InputError message={errors.nama_role} className="mt-2" />
                            </div>

                            {/* Status Switch (Hanya bisa diubah untuk peran non-sistem) */}
                            {(!editMode || !isSystemRole(data.nama_role)) && (
                                <div className="flex items-center justify-between py-2">
                                    <div>
                                        <span className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                                            Status Aktif
                                        </span>
                                        <span className="block text-xs text-slate-400">
                                            Peran nonaktif tidak akan bisa digunakan untuk otentikasi.
                                        </span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer select-none">
                                        <input 
                                            type="checkbox"
                                            checked={data.is_active}
                                            onChange={e => setData('is_active', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-[#0F91FC]"></div>
                                    </label>
                                </div>
                            )}

                            {/* Peringatan Proteksi Sistem */}
                            {editMode && isSystemRole(data.nama_role) && (
                                <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                                    <span className="font-bold block mb-1">Peran Proteksi Sistem:</span>
                                    Nama peran dan status aktif untuk peran sistem (Super Admin / Admin) tidak diperkenankan untuk dimodifikasi demi menjaga integritas sistem.
                                </div>
                            )}

                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                                <button 
                                    type="button"
                                    onClick={() => setModalBuka(false)}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Batal
                                </button>
                                {(!editMode || !isSystemRole(data.nama_role)) && (
                                    <button 
                                        type="submit"
                                        disabled={processing}
                                        className="px-5 py-2.5 rounded-xl bg-[#0F91FC] hover:bg-[#0a78d6] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-[#0F91FC]/20 disabled:opacity-50"
                                    >
                                        {processing ? 'Menyimpan...' : 'Simpan'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}


IndeksPeran.layout = page => <TataLetakUtama children={page} title="Manajemen Peran" />;
