import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import TataLetakUtama from '@/Layouts/TataLetakUtama';
import InputError from '@/Components/InputError';

export default function IndeksTahunPelajaran({ daftarTahunPelajaran }) {
    const [modalBuka, setModalBuka] = useState(false);
    const [modeEdit, setModeEdit] = useState(false);
    const [targetId, setTargetId] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        tahun_mulai: new Date().getFullYear(),
        tahun_selesai: new Date().getFullYear() + 1,
        semester: 'Ganjil',
        is_aktif: false,
    });

    const bukaModalTambah = () => {
        clearErrors();
        reset();
        setModeEdit(false);
        setModalBuka(true);
    };

    const bukaModalEdit = (item) => {
        clearErrors();
        setData({
            tahun_mulai: item.tahun_mulai,
            tahun_selesai: item.tahun_selesai,
            semester: item.semester,
            is_aktif: item.is_aktif,
        });
        setTargetId(item.id);
        setModeEdit(true);
        setModalBuka(true);
    };

    const simpanTahunPelajaran = (e) => {
        e.preventDefault();
        
        // Cek rute yang sesuai berdasarkan peran user saat ini
        const userRolePath = window.location.pathname.startsWith('/superadmin') ? 'superadmin' : 'admin';

        if (modeEdit) {
            put(route(`${userRolePath}.tahun-pelajaran.update`, targetId), {
                onSuccess: () => {
                    setModalBuka(false);
                    reset();
                }
            });
        } else {
            post(route(`${userRolePath}.tahun-pelajaran.store`), {
                onSuccess: () => {
                    setModalBuka(false);
                    reset();
                }
            });
        }
    };

    const tanganiHapus = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus tahun pelajaran ini? Semua data kelas yang terikat juga akan terhapus.')) {
            const userRolePath = window.location.pathname.startsWith('/superadmin') ? 'superadmin' : 'admin';
            destroy(route(`${userRolePath}.tahun-pelajaran.destroy`, id));
        }
    };

    const tetapkanAktif = (id) => {
        const userRolePath = window.location.pathname.startsWith('/superadmin') ? 'superadmin' : 'admin';
        router.post(route(`${userRolePath}.tahun-pelajaran.aktif`, id));
    };

    const totalTahun = daftarTahunPelajaran.length;
    const tahunAktif = daftarTahunPelajaran.find(item => item.is_aktif);

    return (
        <>
            <Head title="Manajemen Tahun Pelajaran" />

            <div className="space-y-6">
                {/* Header Utama */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">
                            MANAJEMEN TAHUN PELAJARAN
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Kelola periode akademik aktif dan semester berjalan di sekolah.
                        </p>
                    </div>
                    <button
                        onClick={bukaModalTambah}
                        className="flex items-center gap-2 px-5 py-3 bg-[#0F91FC] hover:bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all select-none"
                    >
                        <span className="material-symbols-rounded text-lg">add</span>
                        Tambah Tahun Pelajaran
                    </button>
                </div>

                {/* Bento Grid Statistik */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Item 1: Periode Aktif */}
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between h-40">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-blue-100 mb-1">Periode Aktif Saat Ini</p>
                                <h3 className="text-2xl font-black tracking-tight">
                                    {tahunAktif ? `${tahunAktif.tahun_mulai}/${tahunAktif.tahun_selesai}` : 'Belum Set'}
                                </h3>
                            </div>
                            <span className="material-symbols-rounded text-3xl text-blue-200">calendar_today</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-bold uppercase tracking-wider">
                                Semester {tahunAktif ? tahunAktif.semester : '-'}
                            </span>
                        </div>
                    </div>

                    {/* Item 2: Total Tahun Pelajaran */}
                    <div className="bg-white/65 dark:bg-slate-900/65 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-xl flex flex-col justify-between h-40">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Total Periode</p>
                                <h3 className="text-3xl font-black text-slate-800 dark:text-white">{totalTahun}</h3>
                            </div>
                            <span className="material-symbols-rounded text-3xl text-slate-400 dark:text-slate-600">history</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Total riwayat tahun ajaran terdaftar.</p>
                    </div>

                    {/* Item 3: Status Penjadwalan */}
                    <div className="bg-white/65 dark:bg-slate-900/65 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-xl flex flex-col justify-between h-40">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Status Sistem</p>
                                <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Sinkron & Siap
                                </h3>
                            </div>
                            <span className="material-symbols-rounded text-3xl text-slate-400 dark:text-slate-600">cloud_done</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Tersinkronisasi otomatis dengan portal aplikasi belajar.</p>
                    </div>
                </div>

                {/* Tabel Riwayat Tahun Pelajaran */}
                <div className="bg-white/65 dark:bg-slate-900/65 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-xl">
                    <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50">
                        <h2 className="font-extrabold text-slate-800 dark:text-white text-base">Riwayat Periode Akademik</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200/50 dark:border-slate-800/50 text-xs font-bold uppercase text-slate-400 dark:text-slate-500">
                                    <th className="px-6 py-4">Tahun Pelajaran</th>
                                    <th className="px-6 py-4">Semester</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/30 dark:divide-slate-800/30 text-sm">
                                {daftarTahunPelajaran.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                                            {item.tahun_mulai}/{item.tahun_selesai}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-semibold text-slate-600 dark:text-slate-350">{item.semester}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.is_aktif ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-bold">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                    Aktif
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full text-xs font-bold">
                                                    Tidak Aktif
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end items-center gap-2">
                                                {!item.is_aktif && (
                                                    <button
                                                        onClick={() => tetapkanAktif(item.id)}
                                                        className="px-3 py-1.5 hover:bg-emerald-500/10 text-emerald-500 rounded-xl text-xs font-bold transition-all"
                                                        title="Set Aktif"
                                                    >
                                                        Aktifkan
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => bukaModalEdit(item)}
                                                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-[#0F91FC] dark:hover:text-[#ff6b39] rounded-xl transition-all"
                                                    title="Edit"
                                                >
                                                    <span className="material-symbols-rounded text-lg">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => tanganiHapus(item.id)}
                                                    className="p-2 hover:bg-rose-500/10 text-rose-500 rounded-xl transition-all"
                                                    title="Hapus"
                                                >
                                                    <span className="material-symbols-rounded text-lg">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {totalTahun === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 font-bold">
                                            Belum ada data tahun pelajaran.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Modal Tambah/Edit */}
            {modalBuka && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5">
                        <div className="flex justify-between items-center">
                            <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">
                                {modeEdit ? 'Edit Tahun Pelajaran' : 'Tambah Tahun Pelajaran'}
                            </h3>
                            <button
                                onClick={() => setModalBuka(false)}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-xl transition-all"
                            >
                                <span className="material-symbols-rounded text-lg">close</span>
                            </button>
                        </div>

                        <form onSubmit={simpanTahunPelajaran} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Tahun Mulai</label>
                                    <input
                                        type="number"
                                        min="2000"
                                        max="2100"
                                        value={data.tahun_mulai}
                                        onChange={e => {
                                            const val = parseInt(e.target.value) || 0;
                                            setData(prev => ({
                                                ...prev,
                                                tahun_mulai: val,
                                                tahun_selesai: val + 1
                                            }));
                                        }}
                                        className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#0F91FC] text-sm"
                                        required
                                    />
                                    <InputError message={errors.tahun_mulai} className="mt-1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Tahun Selesai</label>
                                    <input
                                        type="number"
                                        min="2000"
                                        max="2100"
                                        value={data.tahun_selesai}
                                        onChange={e => setData('tahun_selesai', parseInt(e.target.value) || 0)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#0F91FC] text-sm"
                                        required
                                    />
                                    <InputError message={errors.tahun_selesai} className="mt-1" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Semester</label>
                                <select
                                    value={data.semester}
                                    onChange={e => setData('semester', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#0F91FC] text-sm"
                                    required
                                >
                                    <option value="Ganjil">Ganjil</option>
                                    <option value="Genap">Genap</option>
                                </select>
                                <InputError message={errors.semester} className="mt-1" />
                            </div>

                            <div className="flex items-center gap-3 py-2">
                                <input
                                    type="checkbox"
                                    id="is_aktif"
                                    checked={data.is_aktif}
                                    onChange={e => setData('is_aktif', e.target.checked)}
                                    className="rounded border-gray-300 dark:border-slate-700 text-[#0F91FC] focus:ring-[#0F91FC]"
                                />
                                <label htmlFor="is_aktif" className="text-xs font-bold text-slate-650 dark:text-slate-300 uppercase tracking-wider select-none cursor-pointer">
                                    Jadikan Tahun Pelajaran Aktif
                                </label>
                                <InputError message={errors.is_aktif} className="mt-1" />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setModalBuka(false)}
                                    className="flex-1 py-3 border border-slate-200 dark:border-slate-750 text-slate-650 dark:text-slate-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 py-3 bg-[#0F91FC] hover:bg-blue-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-blue-500/20"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

IndeksTahunPelajaran.layout = (page) => (
    <TataLetakUtama children={page} title="Manajemen Tahun Pelajaran" />
);
