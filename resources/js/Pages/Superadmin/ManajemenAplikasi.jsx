import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import TataLetakUtama from '@/Layouts/TataLetakUtama';
import InputError from '@/Components/InputError';
import Swal from 'sweetalert2';


export default function ManajemenAplikasi({ daftarAplikasi, daftarPeran, apiKeyBaru }) {
    const [modalBuka, setModalBuka] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedAppId, setSelectedAppId] = useState(null);
    const [aktifTab, setAktifTab] = useState('kelola');
    const [dragOver, setDragOver] = useState(false);
    const [sortError, setSortError] = useState('');
    const [showOnceBuka, setShowOnceBuka] = useState(false);
    const [copyState, setCopyState] = useState({});
    const [secretTerlihat, setSecretTerlihat] = useState({});
    const [kataKunci, setKataKunci] = useState('');
    const [sematanIds, setSematanIds] = useState(() => {
        try {
            const tersimpan = localStorage.getItem('sso_pinned_apps');
            return tersimpan ? JSON.parse(tersimpan) : [];
        } catch (e) {
            return [];
        }
    });

    const toggleSecret = (id) => {
        setSecretTerlihat(prev => ({ ...prev, [id]: !prev[id] }));
    };

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

    const tanganiSemat = (id) => {
        let baru;
        if (sematanIds.includes(id)) {
            baru = sematanIds.filter((x) => x !== id);
        } else {
            baru = [id, ...sematanIds.filter((x) => x !== id)];
        }
        setSematanIds(baru);
        try {
            localStorage.setItem('sso_pinned_apps', JSON.stringify(baru));
        } catch (e) {
            console.error('Gagal menyimpan sematan:', e);
        }
    };

    const aplikasiTersaring = (daftarAplikasi || []).filter((app) => {
        if (!kataKunci.trim()) return true;
        const q = kataKunci.toLowerCase();
        return (
            (app.nama_aplikasi && app.nama_aplikasi.toLowerCase().includes(q)) ||
            (app.deskripsi && app.deskripsi.toLowerCase().includes(q))
        );
    });

    const aplikasiTerurut = [...aplikasiTersaring].sort((a, b) => {
        const idxA = sematanIds.indexOf(a.id);
        const idxB = sematanIds.indexOf(b.id);
        const isPinnedA = idxA !== -1;
        const isPinnedB = idxB !== -1;

        if (isPinnedA && isPinnedB) {
            return idxA - idxB;
        }
        if (isPinnedA) return -1;
        if (isPinnedB) return 1;

        return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });

    const {
        data,
        setData,
        post,
        put,
        reset,
        processing,
        errors,
        clearErrors
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

    // Otomatis buka modal Show Once jika ada api_key_baru dari server
    useEffect(() => {
        if (apiKeyBaru) {
            setShowOnceBuka(true);
        }
    }, [apiKeyBaru]);

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

    const pathPrefix = window.location.pathname.startsWith('/superadmin') ? 'superadmin' : 'admin';

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
            router.post(route(`${pathPrefix}.aplikasi.perbarui`, selectedAppId), {
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
            post(route(`${pathPrefix}.aplikasi.simpan`), {
                onSuccess: () => {
                    setModalBuka(false);
                    reset();
                },
                forceFormData: true,
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
            router.delete(route(`${pathPrefix}.aplikasi.hapus`, id));
        }
    };

    const tanganiRegenerateSecret = async (id, nama) => {
        const res = await Swal.fire({
            title: 'Generate Ulang Client Secret?',
            html: `Apakah Anda yakin ingin men-generate ulang Client Secret untuk <strong>"${nama}"</strong>?<br/><span style="font-size:0.85rem;color:#ef4444;margin-top:6px;display:block;">Kunci lama akan langsung tidak berlaku dan integrasi sistem eksternal tersebut akan terputus sampai Anda memasukkan kunci baru.</span>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: '⚡ Ya, Generate Ulang',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#f59e0b',
            cancelButtonColor: '#6b7280',
            customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5', cancelButton: 'rounded-xl font-bold px-5 py-2.5' }
        });

        if (res.isConfirmed) {
            router.post(route(`${pathPrefix}.aplikasi.regenerate`, id));
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

    // Fungsi utilitas untuk menyalin teks ke clipboard
    const salinTeks = (teks, key) => {
        navigator.clipboard.writeText(teks).then(() => {
            setCopyState(prev => ({ ...prev, [key]: true }));
            setTimeout(() => {
                setCopyState(prev => ({ ...prev, [key]: false }));
            }, 2000);
        }).catch(err => {
            Swal.fire({
                title: 'Gagal Menyalin',
                text: 'Gagal menyalin teks: ' + err,
                icon: 'error',
                confirmButtonColor: '#0F91FC',
                customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5' }
            });
        });
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

                {/* Tab Switcher & Kolom Pencarian (Gambar 3) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

                    {/* Kolom Pencarian (Gambar 3) */}
                    <div className="relative w-full sm:w-72 shrink-0">
                        <span className="material-symbols-rounded absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
                            search
                        </span>
                        <input 
                            type="text"
                            value={kataKunci}
                            onChange={(e) => setKataKunci(e.target.value)}
                            placeholder="Cari aplikasi..."
                            className="w-full bg-white dark:bg-slate-800/90 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-2xl pl-10 pr-9 py-2.5 text-xs font-semibold focus:ring-2 focus:ring-[#0F91FC] focus:border-transparent transition-all placeholder:text-slate-400 shadow-sm"
                        />
                        {kataKunci && (
                            <button 
                                onClick={() => setKataKunci('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                            >
                                <span className="material-symbols-rounded text-sm">close</span>
                            </button>
                        )}
                    </div>
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

                        {/* Tabel Aplikasi */}
                        <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                        <tr>
                                            <th className="px-4 py-3.5 rounded-l-xl font-bold">Aplikasi</th>
                                            <th className="px-4 py-3.5 font-bold">Kredensial Integrasi (RBAC)</th>
                                            <th className="px-4 py-3.5 font-bold">Tautan URL</th>
                                            <th className="px-4 py-3.5 font-bold">Visibilitas</th>
                                            <th className="px-4 py-3.5 font-bold">Status</th>
                                            <th className="px-4 py-3.5 rounded-r-xl font-bold text-right">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {aplikasiTerurut && aplikasiTerurut.length > 0 ? (
                                            aplikasiTerurut.map((aplikasi, index) => (
                                                <tr key={index} className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="px-4 py-4 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-3">
                                                         <div 
                                                             className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-sm overflow-hidden shrink-0 transition-all duration-300"
                                                             style={{
                                                                 backgroundColor: hexKeRgba(aplikasi.warna_icon, 0.16),
                                                                 borderColor: hexKeRgba(aplikasi.warna_icon, 0.35),
                                                                 boxShadow: `0 3px 10px -1px ${hexKeRgba(aplikasi.warna_icon, 0.22)}`,
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
                                                            <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                                                                {aplikasi.nama_aplikasi}
                                                                {sematanIds.includes(aplikasi.id) && (
                                                                    <span className="material-symbols-rounded text-sm text-amber-500 fill-current" title="Tersemat Favorit">push_pin</span>
                                                                )}
                                                            </span>
                                                            <span className="block text-[10px] text-slate-400 dark:text-slate-500">Urutan: {aplikasi.sort_order}</span>
                                                        </div>
                                                    </td>

                                                    {/* Kredensial Integrasi */}
                                                    <td className="px-4 py-4 text-xs font-mono">
                                                        {aplikasi.login_callback_url ? (
                                                            <div className="space-y-1 max-w-[240px]">
                                                                <div className="flex items-center justify-between gap-1 bg-slate-50 dark:bg-slate-900/60 p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">ID:</span>
                                                                    <span className="truncate text-[11px] font-semibold text-slate-700 dark:text-slate-300">{aplikasi.id}</span>
                                                                    <button onClick={() => salinTeks(aplikasi.id, `id_${aplikasi.id}`)} className="text-slate-400 hover:text-[#0F91FC] transition-colors p-0.5 shrink-0" title="Salin Client ID">
                                                                        <span className="material-symbols-rounded text-xs">{copyState[`id_${aplikasi.id}`] ? 'check' : 'content_copy'}</span>
                                                                    </button>
                                                                </div>
                                                                <div className="flex items-center justify-between gap-1 bg-slate-50 dark:bg-slate-900/60 p-1.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                                                                    <span className="text-[10px] text-slate-400 font-bold uppercase">Secret:</span>
                                                                    <span className="truncate text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                                                                        {secretTerlihat[aplikasi.id] ? (aplikasi.api_key || '••••••••••••••••••••••••••••••••••••••••') : '••••••••••••••••••••••••••••••••••••••••'}
                                                                    </span>
                                                                    <div className="flex items-center shrink-0 gap-0.5">
                                                                        <button 
                                                                            onClick={() => toggleSecret(aplikasi.id)} 
                                                                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5" 
                                                                            title={secretTerlihat[aplikasi.id] ? "Sembunyikan Secret" : "Tampilkan Secret"}
                                                                        >
                                                                            <span className="material-symbols-rounded text-xs">
                                                                                {secretTerlihat[aplikasi.id] ? 'visibility_off' : 'visibility'}
                                                                            </span>
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => salinTeks(aplikasi.api_key, `sec_${aplikasi.id}`)} 
                                                                            className="text-slate-400 hover:text-[#0F91FC] transition-colors p-0.5" 
                                                                            title="Salin Client Secret"
                                                                        >
                                                                            <span className="material-symbols-rounded text-xs">
                                                                                {copyState[`sec_${aplikasi.id}`] ? 'check' : 'content_copy'}
                                                                            </span>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="italic text-slate-400 text-[11px]">Bukan Aplikasi SSO (-)</span>
                                                        )}
                                                    </td>

                                                    {/* Tautan URL */}
                                                    <td className="px-4 py-4 text-xs">
                                                        <div className="space-y-1 max-w-[200px]">
                                                            <div>
                                                                <span className="text-[10px] text-slate-400 font-bold uppercase block">Portal:</span>
                                                                <a href={aplikasi.portal_url} target="_blank" rel="noopener noreferrer" className="text-[#0F91FC] hover:underline font-semibold flex items-center gap-1 truncate text-[11px]">
                                                                    <span className="truncate">{aplikasi.portal_url}</span>
                                                                    <span className="material-symbols-rounded text-xs shrink-0">open_in_new</span>
                                                                </a>
                                                            </div>
                                                            <div>
                                                                <span className="text-[10px] text-slate-400 font-bold uppercase block">Callback:</span>
                                                                {aplikasi.login_callback_url ? (
                                                                    <a href={aplikasi.login_callback_url} target="_blank" rel="noopener noreferrer" className="text-slate-600 dark:text-slate-300 hover:underline font-medium flex items-center gap-1 truncate text-[11px]">
                                                                        <span className="truncate">{aplikasi.login_callback_url}</span>
                                                                        <span className="material-symbols-rounded text-xs shrink-0">open_in_new</span>
                                                                    </a>
                                                                ) : (
                                                                    <span className="italic text-slate-400 text-[11px]">Bukan SSO (-)</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>

                                                    {/* Visibilitas */}
                                                    <td className="px-4 py-4 text-xs text-slate-600 dark:text-slate-400">
                                                        {aplikasi.is_global_visibility ? (
                                                            <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2.5 py-1 rounded-full font-bold uppercase tracking-wider text-[9px]">Global</span>
                                                        ) : (
                                                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                                {aplikasi.roles && aplikasi.roles.length > 0 ? (
                                                                    aplikasi.roles.map((role, idx) => (
                                                                        <span key={idx} className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-md text-[9px] font-semibold">
                                                                            {role.nama_role}
                                                                        </span>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-slate-400 italic text-[11px]">Tidak ada peran</span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </td>

                                                    {/* Status */}
                                                    <td className="px-4 py-4">
                                                        {aplikasi.is_active ? (
                                                            <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider">Aktif</span>
                                                        ) : (
                                                            <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider">Nonaktif</span>
                                                        )}
                                                    </td>

                                                    {/* Aksi */}
                                                    <td className="px-4 py-4 text-right">
                                                        <button
                                                            onClick={() => tanganiSemat(aplikasi.id)}
                                                            className={`p-2 rounded-xl transition-colors mx-0.5 ${sematanIds.includes(aplikasi.id) ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/30' : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                                            title={sematanIds.includes(aplikasi.id) ? "Lepas Sematan" : "Sematkan Aplikasi"}
                                                        >
                                                            <span className={`material-symbols-rounded text-lg ${sematanIds.includes(aplikasi.id) ? 'fill-current' : ''}`}>push_pin</span>
                                                        </button>
                                                        {aplikasi.login_callback_url && (
                                                            <button
                                                                onClick={() => tanganiRegenerateSecret(aplikasi.id, aplikasi.nama_aplikasi)}
                                                                className="text-amber-500 hover:text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 p-2 rounded-xl transition-colors mx-0.5"
                                                                title="Generate Ulang Secret Key (Client Secret)"
                                                            >
                                                                <span className="material-symbols-rounded text-lg">key_visualizer</span>
                                                            </button>
                                                        )}
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
                                                <td colSpan="6" className="text-center py-8 text-slate-400">
                                                    {kataKunci ? `Tidak ditemukan aplikasi cocok dengan "${kataKunci}".` : 'Belum ada aplikasi terdaftar.'}
                                                </td>
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
                        {aplikasiTerurut && aplikasiTerurut.length > 0 ? (
                            aplikasiTerurut.map((aplikasi, index) => {
                                const tersemat = sematanIds.includes(aplikasi.id);
                                return (
                                    <div 
                                        key={index} 
                                        className={`bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm flex flex-col justify-between hover:-translate-y-1.5 hover:shadow-xl transition-all duration-300 group ${!aplikasi.is_active ? 'opacity-50' : ''}`}
                                    >
                                        <div>
                                            {/* Baris Atas: Ikon Aplikasi (Kiri) & Tombol Pin (Kanan) */}
                                            <div className="flex items-start justify-between gap-4 mb-4">
                                                <div 
                                                    className="w-14 h-14 rounded-2xl border flex items-center justify-center shadow-inner overflow-hidden shrink-0 transition-all duration-300"
                                                    style={{
                                                        backgroundColor: hexKeRgba(aplikasi.warna_icon, 0.16),
                                                        borderColor: hexKeRgba(aplikasi.warna_icon, 0.35),
                                                        boxShadow: `0 4px 14px -2px ${hexKeRgba(aplikasi.warna_icon, 0.22)}`,
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

                                                {/* Tombol Pin / Sematan Favorit */}
                                                <button
                                                    type="button"
                                                    onClick={() => tanganiSemat(aplikasi.id)}
                                                    className={`p-2 rounded-xl transition-all duration-300 ${
                                                        tersemat 
                                                            ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-500 border border-amber-200 dark:border-amber-800/60 shadow-sm scale-105' 
                                                            : 'text-slate-300 dark:text-slate-600 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-700/50 opacity-60 hover:opacity-100'
                                                    }`}
                                                    title={tersemat ? "Lepas sematan favorit" : "Sematkan ke favorit"}
                                                >
                                                    <span className={`material-symbols-rounded text-xl ${tersemat ? 'fill-current' : ''}`}>
                                                        push_pin
                                                    </span>
                                                </button>
                                            </div>

                                            {/* Judul Aplikasi (Gambar 2) */}
                                            <h3 className="font-extrabold text-slate-800 dark:text-white text-lg leading-tight mb-2 flex items-center gap-2">
                                                {aplikasi.nama_aplikasi}
                                                {!aplikasi.is_active && (
                                                    <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider">Nonaktif</span>
                                                )}
                                            </h3>

                                            {/* Deskripsi Lengkap Tanpa Terpotong (Gambar 2) */}
                                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
                                                {aplikasi.deskripsi || 'Aplikasi resmi sekolah yang terintegrasi dengan Single Sign-On.'}
                                            </p>
                                        </div>

                                        {/* Action Link: Panah miring (tab baru) vs panah lurus kanan (tab sama) (Gambar 2) */}
                                        <div className="pt-4 border-t border-slate-100 dark:border-slate-700/40">
                                            <a 
                                                href={aplikasi.login_callback_url ? route('login', { client_id: aplikasi.id }) : aplikasi.portal_url}
                                                target={aplikasi.open_in_new_tab ? "_blank" : "_self"}
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-200 group-hover:text-[#0F91FC] transition-colors"
                                            >
                                                {aplikasi.open_in_new_tab ? (
                                                    <span className="material-symbols-rounded text-base text-[#0F91FC]">open_in_new</span>
                                                ) : (
                                                    <span className="material-symbols-rounded text-base text-[#0F91FC]">login</span>
                                                )}
                                                <span>Buka Aplikasi</span>
                                            </a>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="col-span-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-12 text-center border border-slate-100 dark:border-slate-700/50 shadow-sm">
                                <div className="w-16 h-16 rounded-full bg-amber-100/50 dark:bg-amber-950/30 flex items-center justify-center mx-auto mb-4">
                                    <span className="material-symbols-rounded text-3xl text-amber-600 dark:text-amber-500">
                                        {kataKunci ? 'search_off' : 'apps_outage'}
                                    </span>
                                </div>
                                <h3 className="font-extrabold text-slate-800 dark:text-white text-lg">
                                    {kataKunci ? 'Aplikasi Tidak Ditemukan' : 'Belum Ada Aplikasi Terdaftar'}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto mt-2 leading-relaxed">
                                    {kataKunci 
                                        ? `Tidak ditemukan aplikasi yang cocok dengan kata kunci "${kataKunci}".`
                                        : 'Belum ada aplikasi terdaftar di dalam sistem.'}
                                </p>
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
                                    <div className="flex gap-2 items-center">
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
                                        <div 
                                            className="w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 transition-all duration-300"
                                            style={{
                                                backgroundColor: hexKeRgba(data.warna_icon, 0.16),
                                                borderColor: hexKeRgba(data.warna_icon, 0.35),
                                                boxShadow: `0 4px 12px -1px ${hexKeRgba(data.warna_icon, 0.22)}`,
                                            }}
                                            title="Pratinjau langsung warna ikon"
                                        >
                                            <span className="material-symbols-rounded text-2xl" style={{ color: data.warna_icon || '#3b82f6' }}>
                                                {data.icon_material || 'apps'}
                                            </span>
                                        </div>
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
                                        URL Callback (Redirect URI) <span className="text-xs text-slate-400 font-medium">(opsional)</span>
                                    </label>
                                    <input 
                                        type="url"
                                        className="w-full bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#0F91FC] py-3 px-4 transition-colors placeholder:text-slate-400"
                                        placeholder="https://app.example.com/sso/callback"
                                        value={data.login_callback_url}
                                        onChange={e => setData('login_callback_url', e.target.value)}
                                    />
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 block">Tujuan pengalihan SSO untuk mengirimkan token JWT. Kosongkan jika bukan aplikasi SSO.</span>
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

            {/* Modal Peringatan (Show Once Modal) Kunci Rahasia */}
            {showOnceBuka && apiKeyBaru && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-white/90 dark:bg-slate-900/90 border border-amber-200 dark:border-amber-900/50 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-6">
                        
                        <div className="flex items-center gap-3 text-amber-600 dark:text-amber-500">
                            <span className="material-symbols-rounded text-4xl">warning</span>
                            <div>
                                <h4 className="font-extrabold text-lg">PENTING: Amankan Client Secret!</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Demi keamanan, kunci ini hanya ditampilkan sekali.</p>
                            </div>
                        </div>

                        {/* Peringatan Keras */}
                        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/30 p-4 rounded-2xl text-xs leading-relaxed text-amber-800 dark:text-amber-400 font-bold">
                            PENTING: Salin Client Secret ini sekarang. Kunci ini hanya ditampilkan satu kali demi keamanan dan tidak dapat dilihat kembali setelah Anda menutup jendela ini!
                        </div>

                        {/* Kotak Teks Kunci */}
                        <div className="space-y-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Client Secret (API Key)</span>
                            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 break-all select-all">
                                <span className="flex-1">{apiKeyBaru}</span>
                                <button
                                    onClick={() => salinTeks(apiKeyBaru, 'new_secret')}
                                    className="bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 p-2.5 rounded-xl shrink-0 transition-all text-[#0F91FC]"
                                    title="Salin Kunci Rahasia"
                                >
                                    <span className="material-symbols-rounded text-sm">
                                        {copyState['new_secret'] ? 'check' : 'content_copy'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Tombol Tutup */}
                        <div className="flex justify-end pt-2">
                            <button
                                onClick={() => {
                                    setShowOnceBuka(false);
                                    // Hapus flash session di state Inertia agar tidak memicu ulang
                                    router.reload({ only: ['apiKeyBaru'] });
                                }}
                                className="w-full sm:w-auto px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-2xl text-xs uppercase tracking-widest shadow-lg shadow-amber-600/20 transition-all"
                            >
                                Saya Sudah Menyalin & Menyimpannya
                            </button>
                        </div>

                    </div>
                </div>
            )}
        </>
    );
}


ManajemenAplikasi.layout = page => <TataLetakUtama children={page} title="Aplikasi Portal" />;
