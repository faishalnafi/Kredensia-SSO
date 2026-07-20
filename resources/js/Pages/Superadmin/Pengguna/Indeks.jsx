import React, { useState, useEffect, useRef } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import TataLetakUtama from '@/Layouts/TataLetakUtama';
import InputError from '@/Components/InputError';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import axios from 'axios';

export default function IndeksPengguna({ daftarPengguna = { data: [] }, daftarPeran = [], filters, adaTahunPelajaranAktif = true }) {
    const { auth } = usePage().props;
    const [modalBuka, setModalBuka] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);
    const [cari, setCari] = useState(filters.cari || '');
    const [modalImportBuka, setModalImportBuka] = useState(false);

    const {
        data: importData,
        setData: setImportData,
        post: postImport,
        processing: importProcessing,
        errors: importErrors,
        reset: resetImport
    } = useForm({
        file_import: null
    });

    const tanganiImport = (e) => {
        e.preventDefault();
        postImport(route('superadmin.pengguna.import'), {
            onSuccess: () => {
                setModalImportBuka(false);
                resetImport();
            }
        });
    };

    // Dengarkan event broadcast real-time (Laravel Reverb/Pusher) dengan Fallback ke Polling
    useEffect(() => {
        let channel = null;
        let intervalId = null;

        if (window.Echo) {
            // Mode A: WebSocket Server Aktif (Real-time Instan)
            channel = window.Echo.channel('pengguna');
            channel.listen('PenggunaDiperbarui', (e) => {
                router.reload({ 
                    only: ['daftarPengguna'], 
                    preserveScroll: true,
                    preserveState: true
                });
            });
        } else {
            // Mode B: Polling Berkala (Fallback untuk Shared Hosting / Tanpa WebSocket)
            intervalId = setInterval(() => {
                router.reload({ 
                    only: ['daftarPengguna'], 
                    preserveScroll: true,
                    preserveState: true
                });
            }, 5000);
        }
        
        // Pembersihan (cleanup)
        return () => {
            if (channel && window.Echo) {
                window.Echo.leave('pengguna');
            }
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, []);

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
        nama_lengkap: '',
        email: '',
        password: '',
        jk: '',
        tgl_lahir: '',
        nik: '',
        nip_nis: '',
        no_telp: '',
        alamat: '',
        is_active: true,
        selected_roles: []
    });

    const tanganiCari = (e) => {
        e.preventDefault();
        router.get(route(route().current()), { cari }, {
            preserveState: true,
            replace: true
        });
    };

    const bukaModalTambah = () => {
        if (!adaTahunPelajaranAktif) {
            const userRolePath = window.location.pathname.startsWith('/superadmin') ? 'superadmin' : 'admin';
            Swal.fire({
                title: 'Tahun Pelajaran Belum Aktif!',
                text: 'Minimal harus ada 1 Tahun Pelajaran yang ditambahkan dan diaktifkan terlebih dahulu sebelum menambah pengguna.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#000066',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Kelola Tahun Pelajaran',
                cancelButtonText: 'Batal'
            }).then((res) => {
                if (res.isConfirmed) {
                    router.visit(route(`${userRolePath}.tahun-pelajaran.index`));
                }
            });
            return;
        }
        reset();
        clearErrors();
        setEditMode(false);
        setSelectedUserId(null);
        setModalBuka(true);
    };

    const bukaModalEdit = (user) => {
        clearErrors();
        setEditMode(true);
        setSelectedUserId(user.id);
        setData({
            nama_lengkap: user.nama_lengkap,
            email: user.email || '',
            password: '', // Kosongkan saat edit kata sandi
            jk: user.jk || '',
            tgl_lahir: user.tgl_lahir ? user.tgl_lahir.substring(0, 10) : '',
            nik: user.nik || '',
            nip_nis: user.nip_nis || '',
            no_telp: user.no_telp || '',
            alamat: user.alamat || '',
            is_active: user.is_active,
            selected_roles: user.roles ? user.roles.map(r => r.id) : []
        });
        setModalBuka(true);
    };

    const tanganiSubmit = (e) => {
        e.preventDefault();
        if (editMode) {
            put(route('superadmin.pengguna.perbarui', selectedUserId), {
                onSuccess: () => {
                    setModalBuka(false);
                    reset();
                }
            });
        } else {
            post(route('superadmin.pengguna.simpan'), {
                onSuccess: () => {
                    setModalBuka(false);
                    reset();
                }
            });
        }
    };

    const tanganiHapus = (user) => {
        if (user.id === auth.user.id) {
            alert('Anda tidak dapat menghapus akun Anda sendiri yang sedang digunakan.');
            return;
        }

        if (confirm(`Apakah Anda yakin ingin menghapus pengguna "${user.nama_lengkap}"? Seluruh data otentikasi dan peran untuk pengguna ini akan dihapus secara permanen.`)) {
            destroy(route('superadmin.pengguna.hapus', user.id), {
                preserveScroll: true
            });
        }
    };

    const toggleRoleSelection = (roleId) => {
        const currentSelection = [...data.selected_roles];
        const index = currentSelection.indexOf(roleId);
        if (index > -1) {
            currentSelection.splice(index, 1);
        } else {
            currentSelection.push(roleId);
        }
        setData('selected_roles', currentSelection);
    };

    return (
        <>
            <Head title="Manajemen Pengguna - SSO Sekolah" />
            
            <div className="w-full max-w-6xl mx-auto space-y-6">
                
                {/* Header Action Section */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Daftar Pengguna</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Kelola akun pengguna portal SSO, sinkronisasi peran, dan kelengkapan profil.</p>
                    </div>
                    
                    <div className="flex gap-2">
                        {/* Form Pencarian */}
                        <form onSubmit={tanganiCari} className="flex gap-2">
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <span className="material-symbols-rounded text-lg">search</span>
                                </span>
                                <input 
                                    type="text"
                                    placeholder="Cari nama, email, NIK..."
                                    value={cari}
                                    onChange={e => setCari(e.target.value)}
                                    className="pl-10 pr-4 py-2.5 w-48 sm:w-60 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#0F91FC] dark:text-white transition-all shadow-sm"
                                />
                            </div>
                            <button 
                                type="submit"
                                className="bg-slate-100 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-800 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all"
                            >
                                Cari
                            </button>
                        </form>
                        
                        <button 
                            type="button"
                            onClick={() => setModalImportBuka(true)}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-rounded text-lg">upload_file</span>
                            Import CSV
                        </button>

                        <button 
                            type="button"
                            onClick={bukaModalTambah}
                            className="bg-[#0F91FC] hover:bg-[#0a78d6] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-[#0F91FC]/20 transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-rounded text-lg">person_add</span>
                            Tambah Pengguna
                        </button>
                    </div>
                </div>

                {/* Table Area */}
                <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-700/50">
                        <table className="w-full text-left text-sm whitespace-nowrap table-fixed">
                            <thead className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700/50">
                                <tr>
                                    <th className="px-6 py-4 font-bold w-1/4">Nama Lengkap</th>
                                    <th className="px-6 py-4 font-bold w-1/5">Email</th>
                                    <th className="px-6 py-4 font-bold w-1/6">Peran</th>
                                    <th className="px-6 py-4 font-bold w-[110px]">Verifikasi</th>
                                    <th className="px-6 py-4 font-bold w-[90px]">Status</th>
                                    <th className="px-6 py-4 font-bold w-[100px] text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {daftarPengguna.data && daftarPengguna.data.length > 0 ? (
                                    daftarPengguna.data.map((user) => (
                                        <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                                            <td className="px-6 py-4 truncate">
                                                <div className="flex items-center gap-3">
                                                    {user.avatar_url ? (
                                                        <img 
                                                            src={user.avatar_url} 
                                                            alt={user.nama_lengkap} 
                                                            className="w-9 h-9 rounded-full object-cover border border-slate-100 dark:border-slate-700"
                                                        />
                                                    ) : (
                                                        <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                                                            <span className="material-symbols-rounded">person</span>
                                                        </div>
                                                    )}
                                                    <div className="flex flex-col truncate">
                                                        <span className="font-bold text-slate-700 dark:text-slate-200 truncate">
                                                            {user.nama_lengkap}
                                                        </span>
                                                        {user.nip_nis && (
                                                            <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                                                                NIP/NISN: {user.nip_nis}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 truncate font-mono text-xs text-slate-600 dark:text-slate-400">
                                                {user.email || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {user.roles && user.roles.length > 0 ? (
                                                        user.roles.map((role, i) => (
                                                            <span key={i} className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider">
                                                                {role.nama_role}
                                                            </span>
                                                        ))
                                                    ) : (
                                                        <span className="text-slate-400 text-xs italic">-</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {/* Badge Status Verifikasi Mandiri (Claimed) */}
                                                {user.claimed_at ? (
                                                    <span 
                                                        title={`Diverifikasi pada: ${new Date(user.claimed_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                                                        className="bg-emerald-150 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-450 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
                                                    >
                                                        Terverifikasi
                                                    </span>
                                                ) : (
                                                    <span 
                                                        title="Akun belum diklaim atau diverifikasi oleh pengguna"
                                                        className="bg-slate-100 text-slate-500 dark:bg-slate-700/40 dark:text-slate-400 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                                                    >
                                                        Belum
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.is_active ? (
                                                    <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                        Aktif
                                                    </span>
                                                ) : (
                                                    <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                        Nonaktif
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right space-x-1.5">
                                                <button 
                                                    onClick={() => bukaModalEdit(user)}
                                                    className="text-blue-500 hover:text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 p-2 rounded-xl transition-colors"
                                                    title="Edit Pengguna"
                                                >
                                                    <span className="material-symbols-rounded text-lg">edit</span>
                                                </button>
                                                {user.id !== auth.user.id && (
                                                    <button 
                                                        onClick={() => tanganiHapus(user)}
                                                        className="text-red-500 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-xl transition-colors"
                                                        title="Hapus Pengguna"
                                                    >
                                                        <span className="material-symbols-rounded text-lg">delete</span>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center py-12 text-slate-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="material-symbols-rounded text-3xl">people</span>
                                                <span>Tidak ada data pengguna yang ditemukan.</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Links */}
                    {daftarPengguna.links && daftarPengguna.links.length > 3 && (
                        <div className="flex flex-wrap gap-1 mt-6 justify-center">
                            {daftarPengguna.links.map((link, index) => {
                                if (link.url === null) {
                                    return (
                                        <span 
                                            key={index} 
                                            className="px-3.5 py-2 text-xs border border-slate-200 dark:border-slate-700/50 rounded-xl text-slate-300 dark:text-slate-600 cursor-not-allowed select-none"
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    );
                                }
                                return (
                                    <Link
                                        key={index}
                                        href={link.url}
                                        className={`px-3.5 py-2 text-xs border rounded-xl transition-all font-semibold ${
                                            link.active 
                                                ? 'bg-[#0F91FC] border-[#0F91FC] text-white shadow-md shadow-[#0F91FC]/20' 
                                                : 'border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 bg-white dark:bg-slate-800'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Dialog Form */}
            {modalBuka && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full p-6 lg:p-8 shadow-2xl border border-slate-100 dark:border-slate-700/50 relative my-8">
                        
                        <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-slate-700/50 pb-4">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                {editMode ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
                            </h3>
                            <button 
                                onClick={() => setModalBuka(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <span className="material-symbols-rounded">close</span>
                            </button>
                        </div>

                        <form onSubmit={tanganiSubmit} className="space-y-6">
                            
                            {/* Grid Data Diri */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Nama Lengkap</label>
                                    <input 
                                        type="text"
                                        value={data.nama_lengkap}
                                        onChange={e => setData('nama_lengkap', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white"
                                        required
                                    />
                                    <InputError message={errors.nama_lengkap} className="mt-1" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Email</label>
                                    <input 
                                        type="email"
                                        value={data.email}
                                        onChange={e => setData('email', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white"
                                        required
                                    />
                                    <InputError message={errors.email} className="mt-1" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">
                                        {editMode ? 'Ganti Kata Sandi (Opsional)' : 'Kata Sandi'}
                                    </label>
                                    <input 
                                        type="password"
                                        value={data.password}
                                        onChange={e => setData('password', e.target.value)}
                                        placeholder={editMode ? 'Kosongkan jika tidak diubah' : 'Minimal 8 karakter'}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white"
                                        required={!editMode}
                                    />
                                    <InputError message={errors.password} className="mt-1" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Jenis Kelamin</label>
                                    <select 
                                        value={data.jk}
                                        onChange={e => setData('jk', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white"
                                    >
                                        <option value="">Pilih Jenis Kelamin</option>
                                        <option value="L">Laki-laki</option>
                                        <option value="P">Perempuan</option>
                                    </select>
                                    <InputError message={errors.jk} className="mt-1" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Tanggal Lahir</label>
                                    <input 
                                        type="date"
                                        value={data.tgl_lahir}
                                        onChange={e => setData('tgl_lahir', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white"
                                    />
                                    <InputError message={errors.tgl_lahir} className="mt-1" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">No. Telepon</label>
                                    <input 
                                        type="text"
                                        value={data.no_telp}
                                        onChange={e => setData('no_telp', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white"
                                    />
                                    <InputError message={errors.no_telp} className="mt-1" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">NIK (KTP)</label>
                                    <input 
                                        type="text"
                                        value={data.nik}
                                        onChange={e => setData('nik', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white"
                                    />
                                    <InputError message={errors.nik} className="mt-1" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Nomor Induk (NIP/NISN)</label>
                                    <input 
                                        type="text"
                                        value={data.nip_nis}
                                        onChange={e => setData('nip_nis', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white"
                                    />
                                    <InputError message={errors.nip_nis} className="mt-1" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Alamat Lengkap</label>
                                <textarea 
                                    value={data.alamat}
                                    onChange={e => setData('alamat', e.target.value)}
                                    rows="2"
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white resize-none"
                                ></textarea>
                                <InputError message={errors.alamat} className="mt-1" />
                            </div>

                            {/* Pilihan Multi Peran */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3">Tautkan Peran Pengguna</label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {daftarPeran.map((role) => (
                                        <button 
                                            key={role.id}
                                            type="button"
                                            onClick={() => toggleRoleSelection(role.id)}
                                            className={`px-3 py-2 text-xs font-bold rounded-xl border text-left transition-all flex items-center justify-between ${
                                                data.selected_roles.includes(role.id)
                                                    ? 'bg-[#0F91FC]/10 border-[#0F91FC] text-[#0F91FC] dark:bg-[#0F91FC]/25'
                                                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                                            }`}
                                        >
                                            <span>{role.nama_role}</span>
                                            {data.selected_roles.includes(role.id) && (
                                                <span className="material-symbols-rounded text-sm text-[#0F91FC]">check_circle</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                                <InputError message={errors.selected_roles} className="mt-2" />
                            </div>

                            {/* Status Aktif */}
                            {selectedUserId !== auth.user.id && (
                                <div className="flex items-center justify-between py-2 border-t border-slate-100 dark:border-slate-700/50 pt-4">
                                    <div>
                                        <span className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                                            Status Aktif Akun
                                        </span>
                                        <span className="block text-xs text-slate-400 mt-0.5">
                                            Akun nonaktif tidak akan diizinkan login ke portal maupun aplikasi terintegrasi.
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

                            {/* Footer Tombol */}
                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                                <button 
                                    type="button"
                                    onClick={() => setModalBuka(false)}
                                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2.5 rounded-xl bg-[#0F91FC] hover:bg-[#0a78d6] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-[#0F91FC]/20 disabled:opacity-50"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Import Pengguna (CSV / XLSX) */}
            {modalImportBuka && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 relative text-left max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-rounded text-emerald-500">upload_file</span>
                                    Import Massal Pengguna
                                </h3>
                                <p className="text-xs text-slate-400">Import data siswa dan guru dari berkas Excel (.xlsx) atau CSV.</p>
                            </div>
                            <button 
                                onClick={() => setModalImportBuka(false)}
                                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center justify-center transition-colors"
                            >
                                <span className="material-symbols-rounded text-lg">close</span>
                            </button>
                        </div>

                        {/* Tab Switcher */}
                        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl my-4">
                            <button
                                type="button"
                                onClick={() => setTabImportAktif('siswa')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all ${
                                    tabImportAktif === 'siswa'
                                        ? 'bg-[#000066] text-white shadow-md'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                <span className="material-symbols-rounded text-sm">school</span>
                                Import Siswa
                            </button>
                            <button
                                type="button"
                                onClick={() => setTabImportAktif('guru')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-xs transition-all ${
                                    tabImportAktif === 'guru'
                                        ? 'bg-[#000066] text-white shadow-md'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                <span className="material-symbols-rounded text-sm">person</span>
                                Import Guru
                            </button>
                        </div>

                        {/* Content Tab Siswa */}
                        {tabImportAktif === 'siswa' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/50">
                                    <div className="text-xs text-emerald-800 dark:text-emerald-300 font-bold">
                                        Format Siswa: nama_lengkap, nik, nip_nis, tgl_lahir, jk, no_telp, alamat, jenjang, kelas, jurusan
                                    </div>
                                    <a
                                        href={route(`${window.location.pathname.startsWith('/superadmin') ? 'superadmin' : 'admin'}.pengguna.template-siswa`)}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-[11px] shrink-0 shadow-sm transition-all"
                                    >
                                        <span className="material-symbols-rounded text-xs">download</span>
                                        Template Siswa
                                    </a>
                                </div>

                                <div 
                                    onClick={() => inputFileSiswaRef.current?.click()}
                                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center cursor-pointer hover:border-[#000066] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
                                >
                                    <span className="material-symbols-rounded text-3xl text-slate-300 dark:text-slate-600 block mb-1">cloud_upload</span>
                                    {fileImportSiswa ? (
                                        <p className="font-bold text-xs text-slate-700 dark:text-slate-200">{fileImportSiswa.name} ({dataPratinjauSiswa.length} data)</p>
                                    ) : (
                                        <p className="text-xs text-slate-400 font-bold">Klik untuk memilih file Excel / CSV Siswa</p>
                                    )}
                                    <input
                                        ref={inputFileSiswaRef}
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={tanganiPilihFileSiswa}
                                        className="hidden"
                                    />
                                </div>

                                {dataPratinjauSiswa.length > 0 && (
                                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden text-xs max-h-40 overflow-y-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase text-slate-500">
                                                <tr>
                                                    <th className="px-3 py-2">NO</th>
                                                    <th className="px-3 py-2">Nama</th>
                                                    <th className="px-3 py-2">NIK</th>
                                                    <th className="px-3 py-2">NISN</th>
                                                    <th className="px-3 py-2">Kelas</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {dataPratinjauSiswa.slice(0, 5).map((row, i) => (
                                                    <tr key={i}>
                                                        <td className="px-3 py-1.5 font-bold text-slate-400">{i + 1}</td>
                                                        <td className="px-3 py-1.5 font-semibold text-slate-700 dark:text-slate-200">{row.nama_lengkap}</td>
                                                        <td className="px-3 py-1.5 text-slate-500">{row.nik}</td>
                                                        <td className="px-3 py-1.5 text-slate-500">{row.nip_nis}</td>
                                                        <td className="px-3 py-1.5 text-slate-500">{row.kelas || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Content Tab Guru */}
                        {tabImportAktif === 'guru' && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/30 p-3 rounded-2xl border border-amber-200/50 dark:border-amber-800/50">
                                    <div className="text-xs text-amber-800 dark:text-amber-300 font-bold">
                                        Format Guru: nama_lengkap, nik, nip_nis, tgl_lahir, jk, no_telp, alamat, peran
                                    </div>
                                    <a
                                        href={route(`${window.location.pathname.startsWith('/superadmin') ? 'superadmin' : 'admin'}.pengguna.template-guru`)}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-[11px] shrink-0 shadow-sm transition-all"
                                    >
                                        <span className="material-symbols-rounded text-xs">download</span>
                                        Template Guru
                                    </a>
                                </div>

                                <div 
                                    onClick={() => inputFileGuruRef.current?.click()}
                                    className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center cursor-pointer hover:border-[#000066] hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all"
                                >
                                    <span className="material-symbols-rounded text-3xl text-slate-300 dark:text-slate-600 block mb-1">cloud_upload</span>
                                    {fileImportGuru ? (
                                        <p className="font-bold text-xs text-slate-700 dark:text-slate-200">{fileImportGuru.name} ({dataPratinjauGuru.length} data)</p>
                                    ) : (
                                        <p className="text-xs text-slate-400 font-bold">Klik untuk memilih file Excel / CSV Guru</p>
                                    )}
                                    <input
                                        ref={inputFileGuruRef}
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={tanganiPilihFileGuru}
                                        className="hidden"
                                    />
                                </div>

                                {dataPratinjauGuru.length > 0 && (
                                    <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden text-xs max-h-40 overflow-y-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase text-slate-500">
                                                <tr>
                                                    <th className="px-3 py-2">NO</th>
                                                    <th className="px-3 py-2">Nama</th>
                                                    <th className="px-3 py-2">NIK</th>
                                                    <th className="px-3 py-2">NIP</th>
                                                    <th className="px-3 py-2">Peran</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {dataPratinjauGuru.slice(0, 5).map((row, i) => (
                                                    <tr key={i}>
                                                        <td className="px-3 py-1.5 font-bold text-slate-400">{i + 1}</td>
                                                        <td className="px-3 py-1.5 font-semibold text-slate-700 dark:text-slate-200">{row.nama_lengkap}</td>
                                                        <td className="px-3 py-1.5 text-slate-500">{row.nik}</td>
                                                        <td className="px-3 py-1.5 text-slate-500">{row.nip_nis}</td>
                                                        <td className="px-3 py-1.5 text-slate-500">{row.peran || 'Guru'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
                            <button 
                                type="button"
                                onClick={() => setModalImportBuka(false)}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Batal
                            </button>
                            <button 
                                type="button"
                                onClick={() => {
                                    if (tabImportAktif === 'siswa') {
                                        if (dataPratinjauSiswa.length === 0) {
                                            Swal.fire({ title: 'Tidak Ada Data!', text: 'Silakan pilih file Siswa terlebih dahulu.', icon: 'warning', confirmButtonColor: '#000066' });
                                            return;
                                        }
                                        prosesImportBatchModal(dataPratinjauSiswa, 'siswa');
                                    } else {
                                        if (dataPratinjauGuru.length === 0) {
                                            Swal.fire({ title: 'Tidak Ada Data!', text: 'Silakan pilih file Guru terlebih dahulu.', icon: 'warning', confirmButtonColor: '#000066' });
                                            return;
                                        }
                                        prosesImportBatchModal(dataPratinjauGuru, 'guru');
                                    }
                                }}
                                disabled={sedangMemprosesImport}
                                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-emerald-600/20 disabled:opacity-50 flex items-center gap-1.5"
                            >
                                <span className="material-symbols-rounded text-sm">rocket_launch</span>
                                {sedangMemprosesImport ? 'Mengimpor...' : 'Mulai Import'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}


IndeksPengguna.layout = page => <TataLetakUtama children={page} title="Manajemen Pengguna" />;
