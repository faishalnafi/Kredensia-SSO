import React, { useState, useMemo } from 'react';
import { Head, useForm } from '@inertiajs/react';
import TataLetakUtama from '@/Layouts/TataLetakUtama';
import InputError from '@/Components/InputError';

export default function IndeksKelas({ daftarKelas, daftarTahunPelajaran }) {
    const [modalBuka, setModalBuka] = useState(false);
    const [modeEdit, setModeEdit] = useState(false);
    const [targetId, setTargetId] = useState(null);

    // State untuk Pencarian dan Pagination
    const [cariUtama, setCariUtama] = useState('');
    const [cariTabel, setCariTabel] = useState('');
    const [jumlahEntri, setJumlahEntri] = useState(25);
    const [halamanAktif, setHalamanAktif] = useState(1);

    const { data, setData, post, put, delete: destroy, processing, errors, reset, clearErrors } = useForm({
        nama_kelas: '',
        tingkat: '',
        jurusan: '',
        tahun_pelajaran_id: '',
    });

    const bukaModalTambah = () => {
        clearErrors();
        reset();
        // Pilih default tahun pelajaran aktif jika ada
        const aktif = daftarTahunPelajaran.find(item => item.is_aktif) || daftarTahunPelajaran[0];
        setData({
            nama_kelas: '',
            tingkat: '',
            jurusan: '',
            tahun_pelajaran_id: aktif ? aktif.id : '',
        });
        setModeEdit(false);
        setModalBuka(true);
    };

    const bukaModalEdit = (item) => {
        clearErrors();
        setData({
            nama_kelas: item.nama_kelas,
            tingkat: item.tingkat,
            jurusan: item.jurusan || '',
            tahun_pelajaran_id: item.tahun_pelajaran_id,
        });
        setTargetId(item.id);
        setModeEdit(true);
        setModalBuka(true);
    };

    const simpanKelas = (e) => {
        e.preventDefault();
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

    // Filter data berdasarkan kata kunci pencarian utama dan kata kunci pencarian tabel
    const dataTersaring = useMemo(() => {
        return daftarKelas.filter(item => {
            const namaMatches = item.nama_kelas.toLowerCase().includes(cariUtama.toLowerCase()) || 
                                item.nama_kelas.toLowerCase().includes(cariTabel.toLowerCase());
            const tingkatMatches = item.tingkat.toLowerCase().includes(cariUtama.toLowerCase()) || 
                                   item.tingkat.toLowerCase().includes(cariTabel.toLowerCase());
            const jurusanMatches = (item.jurusan || '').toLowerCase().includes(cariUtama.toLowerCase()) || 
                                   (item.jurusan || '').toLowerCase().includes(cariTabel.toLowerCase());
            return namaMatches || tingkatMatches || jurusanMatches;
        });
    }, [daftarKelas, cariUtama, cariTabel]);

    // Pagination
    const dataDipaginasi = useMemo(() => {
        const indexAwal = (halamanAktif - 1) * jumlahEntri;
        return dataTersaring.slice(indexAwal, indexAwal + jumlahEntri);
    }, [dataTersaring, halamanAktif, jumlahEntri]);

    const totalHalaman = Math.ceil(dataTersaring.length / jumlahEntri);

    return (
        <>
            <Head title="Data Kelas" />

            <div className="space-y-6">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white">
                            Data Kelas
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Kelola daftar kelas dan rombongan belajar.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => router.visit(window.location.pathname)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs border border-slate-200/50 dark:border-slate-700/50 shadow-sm transition-all select-none"
                        >
                            <span className="material-symbols-rounded text-sm text-[#0F91FC]">sync</span>
                            Sesuaikan Kelas
                        </button>
                        <button
                            onClick={bukaModalTambah}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#000066] hover:bg-blue-950 text-white rounded-xl font-bold text-xs shadow-md transition-all select-none"
                        >
                            <span className="material-symbols-rounded text-sm">add</span>
                            Tambah Kelas
                        </button>
                    </div>
                </div>

                {/* Pencarian Lebar */}
                <div className="flex gap-2">
                    <div className="relative flex-grow">
                        <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                        <input
                            type="text"
                            placeholder="Cari nama kelas, tingkat, atau jurusan..."
                            value={cariUtama}
                            onChange={e => setCariUtama(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-2xl py-3 pl-11 pr-4 focus:outline-none focus:ring-2 focus:ring-[#000066] text-sm shadow-sm"
                        />
                    </div>
                    <button
                        onClick={() => setCariTabel(cariUtama)}
                        className="px-6 py-3 bg-[#000066] hover:bg-blue-950 text-white rounded-2xl font-bold text-xs shadow-md transition-all"
                    >
                        Cari
                    </button>
                </div>

                {/* Kontainer Utama Tabel */}
                <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-xl p-6 space-y-4">
                    {/* Kontrol filter atas */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-bold text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                            <span>Tampilkan</span>
                            <select
                                value={jumlahEntri}
                                onChange={e => {
                                    setJumlahEntri(parseInt(e.target.value));
                                    setHalamanAktif(1);
                                }}
                                className="bg-slate-150 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1.5 focus:ring-[#000066]"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                            <span>entri</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span>Cari:</span>
                            <input
                                type="text"
                                placeholder="kata kunci pencarian"
                                value={cariTabel}
                                onChange={e => {
                                    setCariTabel(e.target.value);
                                    setHalamanAktif(1);
                                }}
                                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 focus:ring-[#000066] text-xs"
                            />
                        </div>
                    </div>

                    {/* Tabel Data */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200/50 dark:border-slate-800/50 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                                    <th className="px-6 py-4 w-16">NO</th>
                                    <th className="px-6 py-4">NAMA KELAS</th>
                                    <th className="px-6 py-4">TINGKAT</th>
                                    <th className="px-6 py-4">JURUSAN</th>
                                    <th className="px-6 py-4">JUMLAH SISWA</th>
                                    <th className="px-6 py-4 text-center w-32">AKSI</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/30 dark:divide-slate-800/30 text-sm">
                                {dataDipaginasi.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-400 dark:text-slate-500">
                                            {(halamanAktif - 1) * jumlahEntri + index + 1}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-500 flex items-center justify-center">
                                                    <span className="material-symbols-rounded text-base">school</span>
                                                </div>
                                                <span className="font-bold text-slate-800 dark:text-white uppercase">
                                                    {item.nama_kelas}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-black uppercase tracking-wide">
                                                {item.tingkat}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.jurusan ? (
                                                <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-black uppercase tracking-wide">
                                                    {item.jurusan}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 dark:text-slate-550 font-bold">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-300 rounded-full text-xs font-black">
                                                {item.siswa_count || 0} Siswa
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-center items-center gap-3">
                                                <button
                                                    onClick={() => bukaModalEdit(item)}
                                                    className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all"
                                                    title="Edit Kelas"
                                                >
                                                    <span className="material-symbols-rounded text-lg">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => tanganiHapus(item.id)}
                                                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all"
                                                    title="Hapus Kelas"
                                                >
                                                    <span className="material-symbols-rounded text-lg">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {dataTersaring.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 font-bold">
                                            Tidak ada data kelas yang cocok dengan pencarian.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination controls */}
                    {totalHalaman > 1 && (
                        <div className="flex justify-between items-center pt-4 border-t border-slate-200/50 dark:border-slate-800/50 text-xs font-bold text-slate-500">
                            <div>
                                Menampilkan {Math.min(dataTersaring.length, (halamanAktif - 1) * jumlahEntri + 1)} sampai {Math.min(dataTersaring.length, halamanAktif * jumlahEntri)} dari {dataTersaring.length} entri
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setHalamanAktif(prev => Math.max(1, prev - 1))}
                                    disabled={halamanAktif === 1}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-50"
                                >
                                    Sebelumnya
                                </button>
                                {[...Array(totalHalaman)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => setHalamanAktif(i + 1)}
                                        className={`px-3 py-1.5 rounded-lg ${halamanAktif === i + 1 ? 'bg-[#000066] text-white' : 'border border-slate-200 dark:border-slate-800 text-slate-650'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setHalamanAktif(prev => Math.min(totalHalaman, prev + 1))}
                                    disabled={halamanAktif === totalHalaman}
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-50"
                                >
                                    Selanjutnya
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal Tambah/Edit Kelas */}
            {modalBuka && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">
                                {modeEdit ? 'Edit Kelas' : 'Tambah Kelas'}
                            </h3>
                            <button
                                onClick={() => setModalBuka(false)}
                                className="p-1 hover:bg-slate-150 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-xl transition-all"
                            >
                                <span className="material-symbols-rounded text-lg">close</span>
                            </button>
                        </div>

                        <form onSubmit={simpanKelas} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-750 dark:text-slate-350 mb-1">
                                    Nama Kelas <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.nama_kelas}
                                    onChange={e => setData('nama_kelas', e.target.value)}
                                    className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/50 dark:border-slate-700/50 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#000066] text-sm"
                                    required
                                />
                                <InputError message={errors.nama_kelas} className="mt-1" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-750 dark:text-slate-350 mb-1">
                                        Tingkat
                                    </label>
                                    <select
                                        value={data.tingkat}
                                        onChange={e => setData('tingkat', e.target.value)}
                                        className="w-full bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/50 dark:border-slate-700/50 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#000066] text-sm"
                                        required
                                    >
                                        <option value="">-- Pilih --</option>
                                        <option value="X">X (Sepuluh)</option>
                                        <option value="XI">XI (Sebelas)</option>
                                        <option value="XII">XII (Dua Belas)</option>
                                    </select>
                                    <InputError message={errors.tingkat} className="mt-1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-750 dark:text-slate-350 mb-1">
                                        Jurusan
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="contoh: IPA, IPS"
                                        value={data.jurusan}
                                        onChange={e => setData('jurusan', e.target.value)}
                                        className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/50 dark:border-slate-700/50 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#000066] text-sm"
                                    />
                                    <InputError message={errors.jurusan} className="mt-1" />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setModalBuka(false)}
                                    className="px-4 py-2.5 text-xs font-bold text-slate-550 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-[#000066] hover:bg-blue-950 text-white rounded-xl text-xs font-bold shadow-md transition-all"
                                >
                                    <span className="material-symbols-rounded text-sm">save</span>
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
    <TataLetakUtama children={page} title="Data Kelas" />
);
