import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import TataLetakUtama from '@/Layouts/TataLetakUtama';
import InputError from '@/Components/InputError';

export default function IndeksKelas({ daftarKelas, daftarTahunPelajaran, daftarGuru }) {
    const [modalBuka, setModalBuka] = useState(false);
    const [modeEdit, setModeEdit] = useState(false);
    const [targetId, setTargetId] = useState(null);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        nama_kelas: '',
        tingkat: 'X',
        tahun_pelajaran_id: daftarTahunPelajaran.find(item => item.is_aktif)?.id || daftarTahunPelajaran[0]?.id || '',
        wali_kelas_id: '',
    });

    const bukaModalTambah = () => {
        clearErrors();
        reset();
        // Set default tahun pelajaran aktif jika ada
        const tahunAktif = daftarTahunPelajaran.find(item => item.is_aktif);
        if (tahunAktif) {
            setData('tahun_pelajaran_id', tahunAktif.id);
        }
        setModeEdit(false);
        setModalBuka(true);
    };

    const bukaModalEdit = (item) => {
        clearErrors();
        setData({
            nama_kelas: item.nama_kelas,
            tingkat: item.tingkat,
            tahun_pelajaran_id: item.tahun_pelajaran_id,
            wali_kelas_id: item.wali_kelas_id || '',
        });
        setTargetId(item.id);
        setModeEdit(true);
        setModalBuka(true);
    };

    const simpanKelas = (e) => {
        e.preventDefault();
        
        // Cek rute yang sesuai berdasarkan peran user saat ini
        const userRolePath = window.location.pathname.startsWith('/superadmin') ? 'superadmin' : 'admin';

        if (modeEdit) {
            put(route(`${userRolePath}.kelas.update`, targetId), {
                onSuccess: () => {
                    setModalBuka(false);
                    reset();
                }
            });
        } else {
            post(route(`${userRolePath}.kelas.store`), {
                onSuccess: () => {
                    setModalBuka(false);
                    reset();
                }
            });
        }
    };

    const tanganiHapus = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus kelas ini?')) {
            const userRolePath = window.location.pathname.startsWith('/superadmin') ? 'superadmin' : 'admin';
            destroy(route(`${userRolePath}.kelas.destroy`, id));
        }
    };

    // Statistik Bento Grid
    const totalKelas = daftarKelas.length;
    const kelasTanpaWali = daftarKelas.filter(item => !item.wali_kelas_id).length;
    const kelasPerTingkat = {
        X: daftarKelas.filter(item => item.tingkat === 'X').length,
        XI: daftarKelas.filter(item => item.tingkat === 'XI').length,
        XII: daftarKelas.filter(item => item.tingkat === 'XII').length,
    };

    return (
        <>
            <Head title="Manajemen Kelas" />

            <div className="space-y-6">
                {/* Header Utama */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black tracking-tight text-slate-800 dark:text-white">
                            MANAJEMEN KELAS
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Kelola ruang kelas, tingkat pendidikan, dan penugasan wali kelas.
                        </p>
                    </div>
                    <button
                        onClick={bukaModalTambah}
                        className="flex items-center gap-2 px-5 py-3 bg-[#0F91FC] hover:bg-blue-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-blue-500/20 transition-all select-none"
                    >
                        <span className="material-symbols-rounded text-lg">add</span>
                        Tambah Kelas Baru
                    </button>
                </div>

                {/* Bento Grid Statistik */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    {/* Item 1: Total Kelas */}
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-xl flex flex-col justify-between h-36">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-indigo-100 mb-1">Total Kelas</p>
                                <h3 className="text-3xl font-black tracking-tight">{totalKelas}</h3>
                            </div>
                            <span className="material-symbols-rounded text-3xl text-indigo-200">meeting_room</span>
                        </div>
                        <p className="text-xs text-indigo-200">Seluruh kelas terdaftar.</p>
                    </div>

                    {/* Item 2: Tingkat X */}
                    <div className="bg-white/65 dark:bg-slate-900/65 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-xl flex flex-col justify-between h-36">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Tingkat X</p>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white">{kelasPerTingkat.X} Kelas</h3>
                            </div>
                            <span className="font-extrabold text-lg text-slate-400 dark:text-slate-600">10</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Kelas tingkat pertama.</p>
                    </div>

                    {/* Item 3: Tingkat XI & XII */}
                    <div className="bg-white/65 dark:bg-slate-900/65 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-xl flex flex-col justify-between h-36">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Tingkat XI / XII</p>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white">
                                    {kelasPerTingkat.XI} / {kelasPerTingkat.XII} Kelas
                                </h3>
                            </div>
                            <span className="font-extrabold text-lg text-slate-400 dark:text-slate-600">11-12</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Kelas tingkat menengah & akhir.</p>
                    </div>

                    {/* Item 4: Kelas Tanpa Wali */}
                    <div className="bg-white/65 dark:bg-slate-900/65 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-xl flex flex-col justify-between h-36">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">Tanpa Wali Kelas</p>
                                <h3 className={`text-2xl font-black ${kelasTanpaWali > 0 ? 'text-amber-500' : 'text-slate-800 dark:text-white'}`}>
                                    {kelasTanpaWali} Kelas
                                </h3>
                            </div>
                            <span className="material-symbols-rounded text-3xl text-slate-400 dark:text-slate-600">person_off</span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Memerlukan penugasan guru.</p>
                    </div>
                </div>

                {/* Tabel Kelas */}
                <div className="bg-white/65 dark:bg-slate-900/65 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-xl">
                    <div className="p-6 border-b border-slate-200/50 dark:border-slate-800/50">
                        <h2 className="font-extrabold text-slate-800 dark:text-white text-base">Daftar Kelas Aktif</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200/50 dark:border-slate-800/50 text-xs font-bold uppercase text-slate-400 dark:text-slate-500">
                                    <th className="px-6 py-4">Nama Kelas</th>
                                    <th className="px-6 py-4">Tingkat</th>
                                    <th className="px-6 py-4">Tahun Pelajaran</th>
                                    <th className="px-6 py-4">Wali Kelas</th>
                                    <th className="px-6 py-4 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/30 dark:divide-slate-800/30 text-sm">
                                {daftarKelas.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">
                                            {item.nama_kelas}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-350">
                                                Tingkat {item.tingkat}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-350">
                                            {item.tahun_pelajaran ? `${item.tahun_pelajaran.tahun_mulai}/${item.tahun_pelajaran.tahun_selesai} (${item.tahun_pelajaran.semester})` : '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.wali_kelas ? (
                                                <span className="font-semibold text-slate-800 dark:text-white flex items-center gap-2">
                                                    <span className="material-symbols-rounded text-sm text-[#0F91FC]">account_circle</span>
                                                    {item.wali_kelas.nama_lengkap}
                                                </span>
                                            ) : (
                                                <span className="text-xs text-amber-500 font-bold bg-amber-500/10 px-2 py-0.5 rounded-lg">
                                                    Belum Ada Wali
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end items-center gap-2">
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
                                {totalKelas === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 font-bold">
                                            Belum ada data kelas terdaftar.
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
                                {modeEdit ? 'Edit Data Kelas' : 'Tambah Kelas Baru'}
                            </h3>
                            <button
                                onClick={() => setModalBuka(false)}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-xl transition-all"
                            >
                                <span className="material-symbols-rounded text-lg">close</span>
                            </button>
                        </div>

                        <form onSubmit={simpanKelas} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Nama Kelas</label>
                                <input
                                    type="text"
                                    placeholder="Contoh: XII RPL 1, 10-A, dsb."
                                    value={data.nama_kelas}
                                    onChange={e => setData('nama_kelas', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#0F91FC] text-sm"
                                    required
                                />
                                <InputError message={errors.nama_kelas} className="mt-1" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Tingkat</label>
                                    <select
                                        value={data.tingkat}
                                        onChange={e => setData('tingkat', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#0F91FC] text-sm"
                                        required
                                    >
                                        <option value="X">X (10)</option>
                                        <option value="XI">XI (11)</option>
                                        <option value="XII">XII (12)</option>
                                    </select>
                                    <InputError message={errors.tingkat} className="mt-1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Tahun Pelajaran</label>
                                    <select
                                        value={data.tahun_pelajaran_id}
                                        onChange={e => setData('tahun_pelajaran_id', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#0F91FC] text-sm"
                                        required
                                    >
                                        <option value="" disabled>Pilih Tahun Ajaran</option>
                                        {daftarTahunPelajaran.map(item => (
                                            <option key={item.id} value={item.id}>
                                                {item.tahun_mulai}/{item.tahun_selesai} ({item.semester})
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.tahun_pelajaran_id} className="mt-1" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">Wali Kelas (Opsional)</label>
                                <select
                                    value={data.wali_kelas_id}
                                    onChange={e => setData('wali_kelas_id', e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-gray-200 dark:border-slate-700 rounded-xl py-3 px-4 focus:ring-2 focus:ring-[#0F91FC] text-sm"
                                >
                                    <option value="">-- Pilih Guru Wali Kelas --</option>
                                    {daftarGuru.map(guru => (
                                        <option key={guru.id} value={guru.id}>
                                            {guru.nama_lengkap} (NIP: {guru.nip_nis || 'Tidak Ada'})
                                        </option>
                                    ))}
                                </select>
                                <InputError message={errors.wali_kelas_id} className="mt-1" />
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

IndeksKelas.layout = (page) => (
    <TataLetakUtama children={page} title="Manajemen Kelas" />
);
