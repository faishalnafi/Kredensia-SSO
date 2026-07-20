import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import TataLetakUtama from '@/Layouts/TataLetakUtama';
import InputError from '@/Components/InputError';
import Swal from 'sweetalert2';

export default function IndeksAplikasi({ daftarAplikasi, daftarPeran }) {

    const [modalBuka, setModalBuka] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedAppId, setSelectedAppId] = useState(null);
    const [aktifTab, setAktifTab] = useState('kelola');
    const [dragOver, setDragOver] = useState(false);
    const [sortError, setSortError] = useState('');

    // Helper untuk mengubah warna hex ke rgba
    const hexKeRgba = (hex, alpha) => {
        if (!hex) return `rgba(59, 130, 246, ${alpha})`;
        let c = hex.replace('#', '');
        if (c.length === 3) {
            c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
        }
        const r = parseInt(c.substring(0, 2), 16) || 0;
        const g = parseInt(c.substring(2, 4), 16) || 0;
        const b = parseInt(c.substring(4, 6), 16) || 0;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const {
        data,
        setData,
        post,
        reset,
        processing,
        errors,
        clearErrors,
        setError
    } = useForm({
        nama_aplikasi: '',
        deskripsi: '',
        logo_url: '',
        logo_file: null,
        icon_material: 'apps',
        warna_icon: '#3b82f6',
        portal_url: '',
        login_callback_url: '',
        open_in_new_tab: true,
        is_global_visibility: true,
        sort_order: 0,
        is_active: true,
        selected_roles: []
    });

    const bukaModalTambah = () => {
        reset();
        clearErrors();
        setSortError('');
        setEditMode(false);
        setSelectedAppId(null);
        
        let nextSort = 0;
        const sortedOrders = daftarAplikasi.map(a => a.sort_order).sort((a, b) => a - b);
        while (sortedOrders.includes(nextSort)) {
            nextSort++;
        }
        setData({
            nama_aplikasi: '',
            deskripsi: '',
            logo_url: '',
            logo_file: null,
            icon_material: 'apps',
            warna_icon: '#3b82f6',
            portal_url: '',
            login_callback_url: '',
            open_in_new_tab: true,
            is_global_visibility: true,
            sort_order: nextSort,
            is_active: true,
            selected_roles: []
        });

        setModalBuka(true);
    };

    const bukaModalEdit = (app) => {
        clearErrors();
        setSortError('');
        setEditMode(true);
        setSelectedAppId(app.id);
        
        setData({
            nama_aplikasi: app.nama_aplikasi,
            deskripsi: app.deskripsi || '',
            logo_url: app.logo_url || '',
            logo_file: null,
            icon_material: app.icon_material || 'apps',
            warna_icon: app.warna_icon || '#3b82f6',
            portal_url: app.portal_url,
            login_callback_url: app.login_callback_url || '',
            open_in_new_tab: app.open_in_new_tab ?? true,
            is_global_visibility: app.is_global_visibility,
            sort_order: app.sort_order,
            is_active: app.is_active,
            selected_roles: app.roles ? app.roles.map(r => r.id) : []
        });
        
        setModalBuka(true);
    };

    const handleSortOrderChange = (val) => {
        const sortVal = parseInt(val);
        if (isNaN(sortVal) || sortVal < 0) {
            setSortError('Urutan harus berupa angka dan tidak boleh negatif.');
            setData('sort_order', val);
            return;
        }
        
        const terpakai = daftarAplikasi.some(app => app.sort_order === sortVal && app.id !== selectedAppId);
        if (terpakai) {
            setSortError('Urutan (sort) sudah digunakan oleh aplikasi lain.');
        } else {
            setSortError('');
        }
        setData('sort_order', sortVal);
    };

    const tanganiSubmit = (e) => {
        e.preventDefault();

        const sortVal = parseInt(data.sort_order);
        if (isNaN(sortVal) || sortVal < 0) {
            setSortError('Urutan harus berupa angka dan tidak boleh negatif.');
            return;
        }

        const terpakai = daftarAplikasi.some(app => app.sort_order === sortVal && app.id !== selectedAppId);
        if (terpakai) {
            setSortError('Urutan (sort) sudah digunakan oleh aplikasi lain.');
            return;
        }

        if (editMode) {
            router.post(route('superadmin.aplikasi.perbarui', selectedAppId), {
                _method: 'PUT',
                ...data,
                logo_file: data.logo_file
            }, {
                onSuccess: () => {
                    setModalBuka(false);
                    reset();
                }
            });
        } else {
            post(route('superadmin.aplikasi.simpan'), {
                onSuccess: () => {
                    setModalBuka(false);
                    reset();
                }
            });
        }
    };

    const tanganiHapus = async (id, nama) => {
        const res = await Swal.fire({
            title: 'Hapus Aplikasi?',
            html: `Apakah Anda yakin ingin menghapus aplikasi <strong>"${nama}"</strong>?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: '🗑️ Ya, Hapus',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5', cancelButton: 'rounded-xl font-bold px-5 py-2.5' }
        });

        if (res.isConfirmed) {
            router.delete(route('superadmin.aplikasi.hapus', id));
        }
    };

    const handleRoleToggle = (roleId) => {
        const isChecked = data.selected_roles.includes(roleId);
        if (isChecked) {
            setData('selected_roles', data.selected_roles.filter(id => id !== roleId));
        } else {
            setData('selected_roles', [...data.selected_roles, roleId]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        if (data.logo_url) return;
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        if (data.logo_url) return;

        const file = e.dataTransfer.files[0];
        if (file) {
            validateAndSetFile(file);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            validateAndSetFile(file);
        }
    };

    const validateAndSetFile = (file) => {
        if (!file.type.startsWith('image/')) {
            Swal.fire({
                title: 'Format File Salah',
                text: 'File harus berupa berkas gambar (PNG, JPG, JPEG, GIF, SVG, WebP).',
                icon: 'warning',
                confirmButtonColor: '#0F91FC',
                customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5' }
            });
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            Swal.fire({
                title: 'Ukuran File Terlalu Besar',
                text: 'Ukuran maksimum adalah 10MB (akan otomatis dikompresi ke 5MB oleh server).',
                icon: 'warning',
                confirmButtonColor: '#0F91FC',
                customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5' }
            });
            return;
        }

        setData('logo_file', file);
    };

    return (
        <>
            <Head title="Aplikasi Portal - Superadmin SSO" />
            
            <div className="w-full max-w-6xl mx-auto space-y-6">
                
                {/* Header Pintar / Section Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                    <div className="flex items-start gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-[#0F91FC] dark:text-blue-400 flex items-center justify-center shadow-inner shrink-0">
                            <span className="material-symbols-rounded text-3xl">apps</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-extrabold text-[#081242] dark:text-white leading-tight">Aplikasi Portal</h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Aplikasi yang ditampilkan di halaman depan portal publik.</p>
                        </div>
                    </div>
                </div>

                {/* Tab Switcher / Navigation Buttons */}
                <div className="flex items-center gap-3 bg-slate-100/50 dark:bg-slate-900/50 p-1.5 rounded-2xl w-fit border border-slate-200/40 dark:border-slate-800/40">
                    <button
                        onClick={() => setAktifTab('kelola')}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all duration-300 ${
                            aktifTab === 'kelola'
                                ? 'bg-[#081242] dark:bg-[#0F91FC] text-white shadow-md'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                    >
                        <span className="material-symbols-rounded text-lg">apps</span>
                        Kelola Aplikasi
                    </button>
                    <button
                        onClick={() => setAktifTab('pratinjau')}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all duration-300 ${
                            aktifTab === 'pratinjau'
                                ? 'bg-[#081242] dark:bg-[#0F91FC] text-white shadow-md'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                        }`}
                    >
                        <span className="material-symbols-rounded text-lg">visibility</span>
                        Pratinjau Portal
                    </button>
                </div>

                {/* ================= VIEW 1: KELOLA APLIKASI ================= */}
                {aktifTab === 'kelola' && (
                    <div className="space-y-6">
                        <div className="flex justify-end">
                            <button 
                                onClick={bukaModalTambah}
                                className="bg-[#0F91FC] hover:bg-[#0a78d6] text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-[#0F91FC]/20 transition-all flex items-center gap-2"
                            >
                                <span className="material-symbols-rounded text-lg">add</span>
                                Daftarkan Aplikasi
                            </button>
                        </div>

                        <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                        <tr>
                                            <th className="px-4 py-3.5 rounded-l-xl font-bold">Aplikasi</th>
                                            <th className="px-4 py-3.5 font-bold">API Key (Client Secret)</th>
                                            <th className="px-4 py-3.5 font-bold">URL Portal</th>
                                            <th className="px-4 py-3.5 font-bold">Visibilitas</th>
                                            <th className="px-4 py-3.5 font-bold">Status</th>
                                            <th className="px-4 py-3.5 rounded-r-xl font-bold text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {daftarAplikasi && daftarAplikasi.length > 0 ? (
                                            daftarAplikasi.map((aplikasi, index) => (
                                                <tr key={index} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-4 py-4 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-3">
                                                        <div 
                                                            className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm overflow-hidden shrink-0"
                                                            style={{
                                                                backgroundColor: hexKeRgba(aplikasi.warna_icon, 0.1),
                                                                borderColor: hexKeRgba(aplikasi.warna_icon, 0.25),
                                                            }}
                                                        >
                                                            {aplikasi.logo_url ? (
                                                                <img src={aplikasi.logo_url} alt={aplikasi.nama_aplikasi} className="w-8 h-8 object-contain" />
                                                            ) : (
                                                                <span 
                                                                    className="material-symbols-rounded text-xl"
                                                                    style={{ color: aplikasi.warna_icon || '#3b82f6' }}
                                                                >
                                                                    {aplikasi.icon_material || 'apps'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <span className="block font-bold text-slate-800 dark:text-slate-100">{aplikasi.nama_aplikasi}</span>
                                                            <span className="block text-[10px] text-slate-400 dark:text-slate-500">Urutan: {aplikasi.sort_order}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                                                        {aplikasi.api_key}
                                                    </td>
                                                    <td className="px-4 py-4 text-xs text-[#0F91FC]">
                                                        <a href={aplikasi.portal_url} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1">
                                                            {aplikasi.portal_url}
                                                            <span className="material-symbols-rounded text-xs">open_in_new</span>
                                                        </a>
                                                    </td>
                                                    <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-400">
                                                        {aplikasi.is_global_visibility ? (
                                                            <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-[9px]">Global</span>
                                                        ) : (
                                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                                {aplikasi.roles && aplikasi.roles.map((r, i) => (
                                                                    <span key={i} className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-md text-[9px] font-semibold">{r.nama_role}</span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        {aplikasi.is_active ? (
                                                            <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider">Aktif</span>
                                                        ) : (
                                                            <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider">Nonaktif</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4 text-right">
                                                        <button 
                                                            onClick={() => bukaModalEdit(aplikasi)}
                                                            className="text-blue-500 hover:text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 p-2 rounded-xl transition-colors mx-0.5"
                                                            title="Edit Aplikasi"
                                                        >
                                                            <span className="material-symbols-rounded text-lg">edit</span>
                                                        </button>
                                                        <button 
                                                            onClick={() => tanganiHapus(aplikasi.id, aplikasi.nama_aplikasi)}
                                                            className="text-red-500 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 p-2 rounded-xl transition-colors mx-0.5"
                                                            title="Hapus Aplikasi"
                                                        >
                                                            <span className="material-symbols-rounded text-lg">delete</span>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="6" className="text-center py-8 text-slate-400">Belum ada aplikasi terdaftar.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* ================= VIEW 2: PRATINJAU PORTAL ================= */}
                {aktifTab === 'pratinjau' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {daftarAplikasi && daftarAplikasi.length > 0 ? (
                            daftarAplikasi.map((aplikasi, index) => (
                                <div key={index} className={`bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col justify-between hover:-translate-y-1 transition-transform duration-300 group ${!aplikasi.is_active ? 'opacity-50' : ''}`}>
                                    <div className="flex items-center gap-4 mb-6">
                                        <div 
                                             className="w-14 h-14 rounded-2xl border flex items-center justify-center shadow-inner overflow-hidden shrink-0"
                                             style={{
                                                 backgroundColor: hexKeRgba(aplikasi.warna_icon, 0.1),
                                                 borderColor: hexKeRgba(aplikasi.warna_icon, 0.25),
                                             }}
                                         >
                                            {aplikasi.logo_url ? (
                                                <img src={aplikasi.logo_url} alt={aplikasi.nama_aplikasi} className="w-10 h-10 object-contain" />
                                            ) : (
                                                <span 
                                                    className="material-symbols-rounded text-3xl"
                                                    style={{ color: aplikasi.warna_icon || '#3b82f6' }}
                                                >
                                                    {aplikasi.icon_material || 'apps'}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-slate-800 dark:text-white text-lg leading-tight flex items-center gap-2">
                                                {aplikasi.nama_aplikasi}
                                                {!aplikasi.is_active && (
                                                    <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider">Nonaktif</span>
                                                )}
                                            </h3>
                                            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 line-clamp-1">{aplikasi.deskripsi || 'Aplikasi terhubung ke portal SSO'}</p>
                                        </div>
                                    </div>
                                    <a 
                                        href={aplikasi.portal_url}
                                        target={aplikasi.open_in_new_tab ? "_blank" : "_self"}
                                        rel="noopener noreferrer"
                                        className="w-full bg-slate-50 dark:bg-slate-900 group-hover:bg-[#0F91FC] text-slate-700 dark:text-slate-200 group-hover:text-white font-bold py-3.5 px-4 rounded-2xl transition-all duration-300 text-center text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                                    >
                                        Buka Aplikasi
                                        {aplikasi.open_in_new_tab && (
                                            <span className="material-symbols-rounded text-base">open_in_new</span>
                                        )}
                                    </a>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full bg-white dark:bg-slate-800/80 rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-700/50 shadow-sm">
                                <span className="material-symbols-rounded text-5xl text-slate-400 mb-4">apps_outage</span>
                                <p className="text-slate-500 dark:text-slate-400 font-semibold">Belum ada aplikasi terdaftar.</p>
                            </div>
                        )}
                    </div>
                )}

            </div>

            {/* Modal Form Tambah/Edit */}
            {modalBuka && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden border border-slate-100 dark:border-slate-700/50 shadow-2xl transition-all my-8 md:my-12">
                        
                        {/* Header Modal */}
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700/50 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
                            <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">
                                {editMode ? 'Edit Aplikasi' : 'Daftarkan Aplikasi Baru'}
                            </h3>
                            <button 
                                onClick={() => setModalBuka(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <span className="material-symbols-rounded">close</span>
                            </button>
                        </div>

                        {/* Form Modal */}
                        <form onSubmit={tanganiSubmit} className="p-6 space-y-5">
                            
                            {/* Grid 1: Nama & Urutan */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                                        Nama Aplikasi <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0F91FC] py-3 px-4 transition-colors placeholder:text-slate-400"
                                        placeholder="contoh: Google Classroom"
                                        value={data.nama_aplikasi}
                                        onChange={e => setData('nama_aplikasi', e.target.value)}
                                        required
                                    />
                                    <InputError message={errors.nama_aplikasi} className="mt-1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                                        Urutan (sort)
                                    </label>
                                    <input 
                                        type="number"
                                        min="0"
                                        className={`w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border ${sortError || errors.sort_order ? 'border-red-500 focus:ring-red-500' : 'border-slate-200 dark:border-slate-700 focus:ring-[#0F91FC]'} rounded-xl focus:ring-2 py-3 px-4 transition-colors placeholder:text-slate-400`}
                                        value={data.sort_order}
                                        onChange={e => handleSortOrderChange(e.target.value)}
                                    />
                                    {(sortError || errors.sort_order) && (
                                        <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-semibold">{sortError || errors.sort_order}</p>
                                    )}
                                </div>
                            </div>

                            {/* Deskripsi Singkat */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                                    Deskripsi Singkat
                                </label>
                                <textarea 
                                    className="w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0F91FC] py-3 px-4 transition-colors placeholder:text-slate-400 h-20 resize-none"
                                    placeholder="Deskripsi singkat yang tampil di kartu portal..."
                                    value={data.deskripsi}
                                    onChange={e => setData('deskripsi', e.target.value)}
                                />
                                <InputError message={errors.deskripsi} className="mt-1" />
                            </div>

                            {/* Grid 2: URL Logo & Unggah File (Mutual Exclusivity) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-xs font-bold ${data.logo_file ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'} mb-1 uppercase tracking-wider`}>
                                        URL Logo <span className="text-[10px] text-slate-400">(opsional)</span>
                                    </label>
                                    <input 
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0F91FC] py-3 px-4 transition-colors placeholder:text-slate-400 disabled:opacity-40 disabled:cursor-not-allowed"
                                        placeholder="https://example.com/logo.png"
                                        value={data.logo_url}
                                        onChange={e => setData('logo_url', e.target.value)}
                                        disabled={!!data.logo_file}
                                    />
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                                        {data.logo_file ? 'Nonaktif karena logo diunggah' : 'Gunakan URL gambar publik.'}
                                    </span>
                                    <InputError message={errors.logo_url} className="mt-1" />
                                </div>
                                
                                <div>
                                    <label className={`block text-xs font-bold ${data.logo_url ? 'text-slate-300 dark:text-slate-600' : 'text-slate-500 dark:text-slate-400'} mb-1 uppercase tracking-wider`}>
                                        Unggah Logo <span className="text-[10px] text-slate-400">(opsional, maks 10MB)</span>
                                    </label>
                                    <div 
                                        onDragOver={handleDragOver}
                                        onDragLeave={handleDragLeave}
                                        onDrop={handleDrop}
                                        className={`relative border-2 border-dashed ${
                                            dragOver ? 'border-[#0F91FC] bg-blue-50/20' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
                                        } rounded-xl p-2.5 flex items-center justify-center text-center transition-all ${
                                            data.logo_url ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                                        }`}
                                    >
                                        <input 
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                            onChange={handleFileChange}
                                            disabled={!!data.logo_url}
                                        />
                                        <div className="flex items-center justify-between w-full px-2 text-slate-500 dark:text-slate-400 text-xs font-semibold">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-rounded text-lg text-[#0F91FC]">upload_file</span>
                                                {data.logo_file ? (
                                                    <span className="truncate max-w-[140px] font-bold text-slate-700 dark:text-slate-200">
                                                        {data.logo_file.name}
                                                    </span>
                                                ) : (
                                                    'Choice / Drag & Drop'
                                                )}
                                            </div>
                                            {data.logo_file && (
                                                <button 
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setData('logo_file', null);
                                                    }}
                                                    className="text-red-500 hover:text-red-700 p-1 flex items-center justify-center rounded-lg bg-red-50 dark:bg-red-950/30 shrink-0 z-10"
                                                    title="Hapus file"
                                                >
                                                    <span className="material-symbols-rounded text-sm">close</span>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                                        {data.logo_url ? 'Nonaktif karena URL logo terisi' : 'Format: PNG, JPG, JPEG, GIF, SVG, WebP. Maks 10MB.'}
                                    </span>
                                    <InputError message={errors.logo_file} className="mt-1" />
                                </div>
                            </div>

                            {/* Grid 3: Fallback Icon & Warna */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                                        Icon Material <span className="text-[10px] text-slate-400">(fallback)</span>
                                    </label>
                                    <input 
                                        type="text"
                                        className="w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0F91FC] py-3 px-4 transition-colors placeholder:text-slate-400"
                                        placeholder="apps"
                                        value={data.icon_material}
                                        onChange={e => setData('icon_material', e.target.value)}
                                    />
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">
                                        Lihat: <a href="https://fonts.google.com/icons" target="_blank" rel="noopener noreferrer" className="text-[#0F91FC] hover:underline font-bold">Material Icons</a>
                                    </span>
                                    <InputError message={errors.icon_material} className="mt-1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                                        Warna Icon (Tidak Terbatas)
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 shrink-0">
                                            <input 
                                                type="color"
                                                className="absolute inset-0 w-full h-full cursor-pointer border-0 p-0 scale-150"
                                                value={data.warna_icon}
                                                onChange={e => setData('warna_icon', e.target.value)}
                                            />
                                        </div>
                                        <input 
                                            type="text"
                                            maxLength={7}
                                            className="w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0F91FC] py-3 px-4 transition-colors font-mono"
                                            placeholder="#3b82f6"
                                            value={data.warna_icon}
                                            onChange={e => setData('warna_icon', e.target.value)}
                                        />
                                    </div>
                                    <InputError message={errors.warna_icon} className="mt-1" />
                                </div>
                            </div>

                            {/* Grid 4: URL Portal & URL Callback */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                                        URL Portal <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="url"
                                        className="w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0F91FC] py-3 px-4 transition-colors placeholder:text-slate-400"
                                        placeholder="https://app.example.com"
                                        value={data.portal_url}
                                        onChange={e => setData('portal_url', e.target.value)}
                                        required
                                    />
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">Tombol "Buka Portal" di kartu aplikasi.</span>
                                    <InputError message={errors.portal_url} className="mt-1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                                        URL Callback (Redirect URI) <span className="text-red-500">*</span>
                                    </label>
                                    <input 
                                        type="url"
                                        className="w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0F91FC] py-3 px-4 transition-colors placeholder:text-slate-400"
                                        placeholder="https://app.example.com/sso/callback"
                                        value={data.login_callback_url}
                                        onChange={e => setData('login_callback_url', e.target.value)}
                                        required
                                    />
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">Tujuan pengalihan SSO untuk mengirimkan token JWT.</span>
                                    <InputError message={errors.login_callback_url} className="mt-1" />
                                </div>
                            </div>

                            {/* Toggle: Buka di Tab Baru */}
                            <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                    <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">Buka di Tab Baru</span>
                                    <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Aktifkan agar aplikasi terbuka di tab browser baru saat ditekan.</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={data.open_in_new_tab}
                                        onChange={e => setData('open_in_new_tab', e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#081242] dark:peer-checked:bg-[#0F91FC]"></div>
                                </label>
                            </div>

                            {/* Target Visibilitas */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                                    Target Visibilitas
                                </label>
                                <select 
                                    className="w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0F91FC] py-3 px-4 transition-colors font-semibold"
                                    value={data.is_global_visibility ? 'global' : 'spesifik'}
                                    onChange={e => setData('is_global_visibility', e.target.value === 'global')}
                                >
                                    <option value="global">Global (Semua Peran)</option>
                                    <option value="spesifik">Spesifik (Peran Tertentu)</option>
                                </select>

                                {/* List Checkbox Peran */}
                                {!data.is_global_visibility && (
                                    <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl grid grid-cols-2 gap-3 max-h-42 overflow-y-auto">
                                        {daftarPeran && daftarPeran.map((role) => (
                                            <label key={role.id} className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                                                <input 
                                                    type="checkbox"
                                                    checked={data.selected_roles.includes(role.id)}
                                                    onChange={() => handleRoleToggle(role.id)}
                                                    className="w-4 h-4 rounded text-[#0F91FC] border-slate-300 focus:ring-[#0F91FC]"
                                                />
                                                {role.nama_role}
                                            </label>
                                        ))}
                                    </div>
                                )}
                                <InputError message={errors.selected_roles} className="mt-1" />
                            </div>

                            {/* Toggle: Aktifkan di portal */}
                            <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div>
                                    <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 font-bold">Aktifkan di portal</span>
                                    <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Nonaktifkan untuk menyembunyikan aplikasi sementara dari semua pengguna.</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="sr-only peer" 
                                        checked={data.is_active}
                                        onChange={e => setData('is_active', e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#081242] dark:peer-checked:bg-[#0F91FC]"></div>
                                </label>
                            </div>

                            {/* Footer Modal */}
                            <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-end gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setModalBuka(false)}
                                    className="py-3 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all text-xs uppercase tracking-widest"
                                >
                                    Batal
                                </button>
                                <button 
                                    type="submit"
                                    disabled={processing || !!sortError}
                                    className="py-3 px-5 bg-[#081242] hover:bg-slate-800 dark:bg-[#0F91FC] dark:hover:bg-[#0a78d6] text-white font-bold rounded-xl transition-all text-xs uppercase tracking-widest shadow-lg disabled:opacity-50"
                                >
                                    {editMode ? 'Perbarui' : 'Daftarkan'}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            )}
        </>
    );
}


IndeksAplikasi.layout = page => <TataLetakUtama children={page} title="Aplikasi Portal" />;
