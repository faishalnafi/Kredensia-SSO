import React, { useState, useEffect, useRef } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import TataLetakUtama from '@/Layouts/TataLetakUtama';
import InputError from '@/Components/InputError';
import Swal from 'sweetalert2';

/**
 * Halaman Manajemen Kunci API (General Access) — Superadmin SSO
 * 
 * Mendukung copy token langsung dari baris tabel list kunci API,
 * kustomisasi prefix key, dan pengeditan nama aplikasi/domain.
 */
export default function IndeksKunciApi({ daftarKunci = [], kunciBaru = null }) {

    const [modalBuka, setModalBuka] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [cari, setCari] = useState('');
    const [modalKunciBaru, setModalKunciBaru] = useState(false);
    const [kunciBaruTampil, setKunciBaruTampil] = useState('');
    const [sudahDisalin, setSudahDisalin] = useState(false);
    const [copyStates, setCopyStates] = useState({});
    const [konfirmasiHapus, setKonfirmasiHapus] = useState(null);
    const [konfirmasiRegenerasi, setKonfirmasiRegenerasi] = useState(null);
    const kunciRef = useRef(null);

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
        nama_aplikasi: '',
        domain_diizinkan: '',
        prefix: 'sso',
        is_active: true,
    });

    // Jika ada kunci baru dari flash session, tampilkan modal show-once
    useEffect(() => {
        if (kunciBaru) {
            setKunciBaruTampil(kunciBaru);
            setModalKunciBaru(true);
        }
    }, [kunciBaru]);

    const bukaModalTambah = () => {
        reset();
        clearErrors();
        setEditMode(false);
        setSelectedId(null);
        setModalBuka(true);
    };

    const bukaModalEdit = (kunci) => {
        clearErrors();
        setEditMode(true);
        setSelectedId(kunci.id);
        setData({
            nama_aplikasi: kunci.nama_aplikasi,
            domain_diizinkan: kunci.domain_diizinkan,
            prefix: kunci.prefix,
            is_active: kunci.is_active,
        });
        setModalBuka(true);
    };

    const tanganiSubmit = (e) => {
        e.preventDefault();
        if (editMode) {
            put(route('superadmin.kunci-api.perbarui', selectedId), {
                onSuccess: () => {
                    setModalBuka(false);
                    reset();
                }
            });
        } else {
            post(route('superadmin.kunci-api.simpan'), {
                onSuccess: () => {
                    setModalBuka(false);
                    reset();
                }
            });
        }
    };

    const tanganiHapus = (id) => {
        destroy(route('superadmin.kunci-api.hapus', id), {
            preserveScroll: true,
            onSuccess: () => setKonfirmasiHapus(null),
        });
    };

    const tanganiRegenerasi = (id) => {
        router.post(route('superadmin.kunci-api.regenerasi', id), {}, {
            preserveScroll: true,
            onSuccess: () => setKonfirmasiRegenerasi(null),
        });
    };

    const salinTeks = (teks, key) => {
        navigator.clipboard.writeText(teks).then(() => {
            setCopyStates(prev => ({ ...prev, [key]: true }));
            setTimeout(() => {
                setCopyStates(prev => ({ ...prev, [key]: false }));
            }, 2000);
        }).catch(() => {
            Swal.fire({
                title: 'Gagal Menyalin',
                text: 'Gagal menyalin token ke papan klip.',
                icon: 'error',
                confirmButtonColor: '#0F91FC',
                customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5' }
            });
        });
    };

    const salinKunciBaru = async () => {
        try {
            await navigator.clipboard.writeText(kunciBaruTampil);
            setSudahDisalin(true);
            setTimeout(() => setSudahDisalin(false), 3000);
        } catch {
            kunciRef.current?.select();
            document.execCommand('copy');
            setSudahDisalin(true);
            setTimeout(() => setSudahDisalin(false), 3000);
        }
    };

    // Filter pencarian client-side
    const kunciTerfilter = daftarKunci.filter(k =>
        k.nama_aplikasi.toLowerCase().includes(cari.toLowerCase()) ||
        k.prefix.toLowerCase().includes(cari.toLowerCase()) ||
        k.domain_diizinkan.toLowerCase().includes(cari.toLowerCase())
    );

    return (
        <>
            <Head title="Kunci API - SSO Sekolah" />

            <div className="w-full max-w-6xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Kunci API</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Kelola kunci API untuk integrasi data oleh aplikasi pihak ketiga.</p>
                    </div>

                    <div className="flex gap-2">
                        <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                <span className="material-symbols-rounded text-lg">search</span>
                            </span>
                            <input
                                type="text"
                                placeholder="Cari kunci API..."
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
                            Buat Kunci
                        </button>
                    </div>
                </div>

                {/* Ringkasan Statistik */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#0F91FC]/10 dark:bg-[#0F91FC]/20 flex items-center justify-center">
                                <span className="material-symbols-rounded text-[#0F91FC] text-xl">key</span>
                            </div>
                            <div>
                                <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{daftarKunci.length}</p>
                                <p className="text-xs text-slate-400 font-medium">Total Kunci</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
                                <span className="material-symbols-rounded text-emerald-500 text-xl">check_circle</span>
                            </div>
                            <div>
                                <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{daftarKunci.filter(k => k.is_active).length}</p>
                                <p className="text-xs text-slate-400 font-medium">Kunci Aktif</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
                                <span className="material-symbols-rounded text-amber-500 text-xl">sync</span>
                            </div>
                            <div>
                                <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{daftarKunci.filter(k => k.terakhir_digunakan_raw).length}</p>
                                <p className="text-xs text-slate-400 font-medium">Pernah Digunakan</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabel Daftar Kunci API */}
                <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-700/50">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700/50">
                                <tr>
                                    <th className="px-6 py-4 font-bold">Nama Aplikasi</th>
                                    <th className="px-6 py-4 font-bold">Domain yang Diizinkan</th>
                                    <th className="px-6 py-4 font-bold">Prefix</th>
                                    <th className="px-6 py-4 font-bold">API Key</th>
                                    <th className="px-6 py-4 font-bold">Status</th>
                                    <th className="px-6 py-4 font-bold">Terakhir Digunakan</th>
                                    <th className="px-6 py-4 font-bold text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {kunciTerfilter.length > 0 ? (
                                    kunciTerfilter.map((kunci) => (
                                        <tr key={kunci.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">
                                                {kunci.nama_aplikasi}
                                            </td>
                                            <td className="px-6 py-4">
                                                {kunci.domain_diizinkan === '*' ? (
                                                    <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2.5 py-0.5 rounded text-[10px] font-bold font-mono">Semua Domain (*)</span>
                                                ) : (
                                                    <code className="text-xs text-slate-600 dark:text-slate-300 font-mono">{kunci.domain_diizinkan}</code>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded text-xs font-bold font-mono">
                                                    {kunci.prefix}
                                                </span>
                                            </td>
                                            {/* API Key Column with Copy Button */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-slate-100 dark:bg-slate-900/60 px-3 py-1.5 rounded-xl font-mono text-xs text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
                                                        {kunci.kunci_api.length > 25 ? kunci.kunci_api.slice(0, 22) + '...' : kunci.kunci_api}
                                                    </span>
                                                    <button
                                                        onClick={() => salinTeks(kunci.kunci_api, 'key_' + kunci.id)}
                                                        className="text-slate-400 hover:text-[#0F91FC] p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all shrink-0"
                                                        title="Salin Kunci API"
                                                    >
                                                        <span className="material-symbols-rounded text-sm">
                                                            {copyStates['key_' + kunci.id] ? 'check' : 'content_copy'}
                                                        </span>
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {kunci.is_active ? (
                                                    <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                        Aktif
                                                    </span>
                                                ) : (
                                                    <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                        Nonaktif
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-xs text-slate-500 dark:text-slate-400">
                                                {kunci.terakhir_digunakan || <span className="text-slate-400">Belum pernah</span>}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => bukaModalEdit(kunci)}
                                                        className="text-blue-500 hover:text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 p-2 rounded-xl transition-colors"
                                                        title="Edit Kunci"
                                                    >
                                                        <span className="material-symbols-rounded text-lg">edit</span>
                                                    </button>
                                                    <button
                                                        onClick={() => setKonfirmasiRegenerasi(kunci.id)}
                                                        className="text-amber-500 hover:text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-500/10 p-2 rounded-xl transition-colors"
                                                        title="Regenerasi Kunci"
                                                    >
                                                        <span className="material-symbols-rounded text-lg">autorenew</span>
                                                    </button>
                                                    <button
                                                        onClick={() => setKonfirmasiHapus(kunci.id)}
                                                        className="text-red-500 hover:text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 p-2 rounded-xl transition-colors"
                                                        title="Hapus Kunci"
                                                    >
                                                        <span className="material-symbols-rounded text-lg">delete</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="text-center py-16 text-slate-400">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-700/30 flex items-center justify-center">
                                                    <span className="material-symbols-rounded text-3xl text-slate-300 dark:text-slate-600">key_off</span>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-sm">Belum ada kunci API</p>
                                                    <p className="text-xs mt-1">Buat kunci API pertama untuk memulai integrasi data.</p>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Panduan Singkat */}
                    <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                        <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                            <span className="material-symbols-rounded text-sm">info</span>
                            Panduan Integrasi REST API
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-500 dark:text-slate-400">
                            <div className="flex gap-2">
                                <span className="material-symbols-rounded text-[#0F91FC] text-sm mt-0.5">looks_one</span>
                                <span>Buat kunci API untuk aplikasi klien dan simpan token dengan aman.</span>
                            </div>
                            <div className="flex gap-2">
                                <span className="material-symbols-rounded text-[#0F91FC] text-sm mt-0.5">looks_two</span>
                                <span>Kirim request dengan header <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded font-mono">Authorization: Bearer &lt;kunci&gt;</code> ke <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded font-mono">GET /api/v1/data/pengguna</code></span>
                            </div>
                            <div className="flex gap-2">
                                <span className="material-symbols-rounded text-[#0F91FC] text-sm mt-0.5">looks_3</span>
                                <span>Mendukung filter query parameter seperti <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded font-mono">?peran=guru</code> atau <code className="bg-slate-200 dark:bg-slate-700 px-1 rounded font-mono">?diperbarui_sejak=2026-01-01</code>.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ============================================================ */}
            {/* Modal Buat/Edit Kunci API                                    */}
            {/* ============================================================ */}
            {modalBuka && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700/50 relative">

                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                {editMode ? 'Edit Pengaturan Kunci API' : 'Generate API Key Baru'}
                            </h3>
                            <button
                                onClick={() => setModalBuka(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                            >
                                <span className="material-symbols-rounded">close</span>
                            </button>
                        </div>

                        <form onSubmit={tanganiSubmit} className="space-y-5">
                            {/* Nama Aplikasi */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Nama Aplikasi <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.nama_aplikasi}
                                    onChange={e => setData('nama_aplikasi', e.target.value)}
                                    placeholder="contoh: CBT Exam System"
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white transition-all"
                                    required
                                />
                                <InputError message={errors.nama_aplikasi} className="mt-2" />
                            </div>

                            {/* Prefix Key */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Prefix Key <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    maxLength={5}
                                    value={data.prefix}
                                    onChange={e => setData('prefix', e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                                    placeholder="contoh: sso"
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white transition-all"
                                    required
                                />
                                <span className="block text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                                    Maksimal 5 karakter alfanumerik. Prefix ini akan menjadi awalan kunci (contoh: <code className="font-bold">{data.prefix || 'sso'}_...</code>).
                                </span>
                                <InputError message={errors.prefix} className="mt-2" />
                            </div>

                            {/* Domain yang Diizinkan */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
                                    Domain yang Diizinkan <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.domain_diizinkan}
                                    onChange={e => setData('domain_diizinkan', e.target.value)}
                                    placeholder="contoh: cbt.sekolah.sch.id"
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white transition-all"
                                    required
                                />
                                <span className="block text-xs text-slate-400 dark:text-slate-500 mt-1.5">
                                    Hanya request dari domain ini yang diterima. Gunakan <code className="bg-slate-100 dark:bg-slate-900 px-1 rounded font-mono font-bold">*</code> untuk semua domain (development only).
                                </span>
                                <InputError message={errors.domain_diizinkan} className="mt-2" />
                            </div>

                            {/* Status Aktif (hanya di mode edit) */}
                            {editMode && (
                                <div className="flex items-center justify-between py-2">
                                    <div>
                                        <span className="block text-sm font-bold text-slate-700 dark:text-slate-300">Status Aktif</span>
                                        <span className="block text-xs text-slate-400">Kunci nonaktif akan ditolak oleh server secara otomatis.</span>
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

                            {/* Alert Penting */}
                            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl text-xs text-amber-700 dark:text-amber-400 leading-relaxed flex items-start gap-2.5">
                                <span className="material-symbols-rounded text-lg text-amber-500 mt-0.5">warning</span>
                                <span>
                                    <b>Penting:</b> API key hanya ditampilkan satu kali saat dibuat. Simpan key dengan aman sebelum menutup notifikasi.
                                </span>
                            </div>

                            {/* Tombol Aksi */}
                            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-700/50">
                                <button
                                    type="button"
                                    onClick={() => setModalBuka(false)}
                                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-5 py-2.5 rounded-xl bg-[#030947] hover:bg-[#02052c] text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-[#030947]/20 disabled:opacity-50 flex items-center gap-2"
                                >
                                    <span className="material-symbols-rounded text-sm">key</span>
                                    {processing ? 'Memproses...' : editMode ? 'Perbarui' : 'Generate Key'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* Modal Show-Once Kunci Baru                                   */}
            {/* ============================================================ */}
            {modalKunciBaru && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700/50 relative">

                        {/* Ikon Sukses */}
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                <span className="material-symbols-rounded text-emerald-500 text-3xl">check_circle</span>
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-slate-800 dark:text-white text-center mb-2">
                            Kunci API Berhasil Dibuat!
                        </h3>

                        {/* Peringatan */}
                        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl text-xs text-amber-700 dark:text-amber-400 leading-relaxed mb-4 flex items-start gap-2">
                            <span className="material-symbols-rounded text-sm mt-0.5">warning</span>
                            <span><b>Penting:</b> Salin kunci ini sekarang. Kunci ini <b>tidak akan ditampilkan lagi</b> setelah modal ini ditutup.</span>
                        </div>

                        {/* Kunci */}
                        <div className="relative mb-4">
                            <input
                                ref={kunciRef}
                                type="text"
                                value={kunciBaruTampil}
                                readOnly
                                className="w-full bg-slate-900 dark:bg-slate-950 text-emerald-400 font-mono text-xs px-4 py-3.5 rounded-xl border border-slate-700 pr-24 select-all"
                                onClick={e => e.target.select()}
                            />
                            <button
                                onClick={salinKunciBaru}
                                className={`absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    sudahDisalin
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-slate-700 hover:bg-slate-600 text-white'
                                }`}
                            >
                                {sudahDisalin ? '✓ Disalin' : 'Salin'}
                            </button>
                        </div>

                        {/* Contoh Penggunaan */}
                        <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 mb-4 border border-slate-100 dark:border-slate-700/50">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Contoh Request (cURL)</p>
                            <code className="text-xs text-slate-600 dark:text-slate-300 block break-all leading-relaxed font-mono">
                                curl -H "Authorization: Bearer {kunciBaruTampil}" \<br/>
                                &nbsp;&nbsp;{window.location.origin}/api/v1/data/pengguna
                            </code>
                        </div>

                        <button
                            onClick={() => {
                                setModalKunciBaru(false);
                                setKunciBaruTampil('');
                                setSudahDisalin(false);
                            }}
                            className="w-full py-3 rounded-xl bg-[#030947] hover:bg-[#02052c] text-white font-bold text-sm transition-colors shadow-lg shadow-[#030947]/20"
                        >
                            Saya Sudah Menyalin Kunci
                        </button>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* Modal Konfirmasi Hapus                                       */}
            {/* ============================================================ */}
            {konfirmasiHapus && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700/50">
                        <div className="flex justify-center mb-4">
                            <div className="w-14 h-14 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                                <span className="material-symbols-rounded text-red-500 text-2xl">delete_forever</span>
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white text-center mb-2">Hapus Kunci API?</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
                            Semua aplikasi yang menggunakan kunci ini akan kehilangan akses secara permanen. Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setKonfirmasiHapus(null)}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => tanganiHapus(konfirmasiHapus)}
                                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-red-500/20"
                            >
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================ */}
            {/* Modal Konfirmasi Regenerasi                                  */}
            {/* ============================================================ */}
            {konfirmasiRegenerasi && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700/50">
                        <div className="flex justify-center mb-4">
                            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                <span className="material-symbols-rounded text-amber-500 text-2xl">autorenew</span>
                            </div>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white text-center mb-2">Regenerasi Kunci?</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
                            Kunci lama akan langsung tidak berlaku. Semua aplikasi yang menggunakan kunci lama harus memperbarui ke kunci baru.
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setKonfirmasiRegenerasi(null)}
                                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => tanganiRegenerasi(konfirmasiRegenerasi)}
                                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-lg shadow-amber-500/20"
                            >
                                Ya, Regenerasi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

IndeksKunciApi.layout = page => <TataLetakUtama children={page} title="Kunci API" />;
