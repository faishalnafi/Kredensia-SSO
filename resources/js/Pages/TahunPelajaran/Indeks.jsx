import React, { useState, useMemo } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import TataLetakUtama from '@/Layouts/TataLetakUtama';
import InputError from '@/Components/InputError';

export default function IndeksTahunPelajaran({ daftarTahunPelajaran }) {
    const [modalBuka, setModalBuka] = useState(false);
    const [cariUtama, setCariUtama] = useState('');
    const [cariTabel, setCariTabel] = useState('');
    const [jumlahEntri, setJumlahEntri] = useState(25);
    const [halamanAktif, setHalamanAktif] = useState(1);

    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        tahun_mulai: new Date().getFullYear(),
        tahun_selesai: new Date().getFullYear() + 1,
        semester: 'Ganjil',
        is_aktif: false,
    });

    const bukaModalTambah = () => {
        clearErrors();
        reset();
        setModalBuka(true);
    };

    const simpanTahunPelajaran = (e) => {
        e.preventDefault();
        const userRolePath = window.location.pathname.startsWith('/superadmin') ? 'superadmin' : 'admin';

        post(route(`${userRolePath}.tahun-pelajaran.store`), {
            onSuccess: () => {
                setModalBuka(false);
                reset();
            }
        });
    };

    const tanganiHapus = (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus tahun pelajaran ini? Semua data kelas terkait akan ikut terhapus.')) {
            const userRolePath = window.location.pathname.startsWith('/superadmin') ? 'superadmin' : 'admin';
            router.delete(route(`${userRolePath}.tahun-pelajaran.destroy`, id));
        }
    };

    const tetapkanAktif = (id) => {
        const userRolePath = window.location.pathname.startsWith('/superadmin') ? 'superadmin' : 'admin';
        router.post(route(`${userRolePath}.tahun-pelajaran.aktif`, id));
    };

    const jalankanBulkUpdate = () => {
        if (confirm('Apakah Anda yakin ingin menyinkronkan dan melakukan pembaruan massal pada seluruh tahun pelajaran?')) {
            const userRolePath = window.location.pathname.startsWith('/superadmin') ? 'superadmin' : 'admin';
            router.post(route(`${userRolePath}.tahun-pelajaran.bulk-update`));
        }
    };

    // Filter data berdasarkan kata kunci pencarian
    const dataTersaring = useMemo(() => {
        return daftarTahunPelajaran.filter(item => {
            const matchUtama = item.tahun_pelajaran.toLowerCase().includes(cariUtama.toLowerCase());
            const matchTabel = item.tahun_pelajaran.toLowerCase().includes(cariTabel.toLowerCase());
            return matchUtama || matchTabel;
        });
    }, [daftarTahunPelajaran, cariUtama, cariTabel]);

    // Pagination
    const dataDipaginasi = useMemo(() => {
        const indexAwal = (halamanAktif - 1) * jumlahEntri;
        return dataTersaring.slice(indexAwal, indexAwal + jumlahEntri);
    }, [dataTersaring, halamanAktif, jumlahEntri]);

    const totalHalaman = Math.ceil(dataTersaring.length / jumlahEntri);

    return (
        <>
            <Head title="Tahun Pelajaran" />

            <div className="space-y-6">
                {/* Header Utama */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white">
                            Tahun Pelajaran
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Manajemen periode akademik aktif untuk sistem.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={jalankanBulkUpdate}
                            className="flex items-center gap-2 px-4 py-2.5 bg-[#B22222] hover:bg-red-800 text-white rounded-xl font-bold text-xs shadow-md transition-all select-none"
                        >
                            <span className="material-symbols-rounded text-sm">sync</span>
                            Bulk Update Tahun Pelajaran
                        </button>
                        <button
                            onClick={bukaModalTambah}
                            className="flex items-center gap-2 px-5 py-2.5 bg-[#000066] hover:bg-blue-950 text-white rounded-xl font-bold text-xs shadow-md transition-all select-none"
                        >
                            <span className="material-symbols-rounded text-sm">calendar_month</span>
                            Tambah Tahun Pelajaran
                        </button>
                    </div>
                </div>

                {/* Pencarian Lebar */}
                <div className="flex gap-2">
                    <div className="relative flex-grow">
                        <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                        <input
                            type="text"
                            placeholder="Cari tahun pelajaran..."
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
                    
                    {/* Tabel Data */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200/50 dark:border-slate-800/50 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                                    <th className="px-6 py-4 w-16">NO</th>
                                    <th className="px-6 py-4">TAHUN PELAJARAN</th>
                                    <th className="px-6 py-4">STATUS</th>
                                    <th className="px-6 py-4">DIBUAT PADA</th>
                                    <th className="px-6 py-4 text-center w-48">AKSI</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200/30 dark:divide-slate-800/30 text-sm">
                                {dataDipaginasi.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                                        <td className="px-6 py-4 font-bold text-slate-400 dark:text-slate-500">
                                            {(halamanAktif - 1) * jumlahEntri + index + 1}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-extrabold text-base text-slate-800 dark:text-white tracking-wide">
                                                {item.tahun_pelajaran}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {item.is_aktif ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-black uppercase tracking-wide">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                    AKTIF
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-400 rounded-full text-xs font-bold">
                                                    Tidak Aktif
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-slate-500 dark:text-slate-400">
                                            {item.dibuat_pada}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center items-center gap-3 h-8">
                                                {!item.is_aktif ? (
                                                    <>
                                                        <button
                                                            onClick={() => tetapkanAktif(item.id)}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-[#0F91FC] hover:bg-blue-600 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                                                        >
                                                            <span className="material-symbols-rounded text-sm">check</span>
                                                            Aktifkan
                                                        </button>
                                                        <button
                                                            onClick={() => tanganiHapus(item.id)}
                                                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-all"
                                                            title="Hapus Tahun Pelajaran"
                                                        >
                                                            <span className="material-symbols-rounded text-lg">delete</span>
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-slate-400 font-bold italic select-none">Sedang Aktif</span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {dataTersaring.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 font-bold">
                                            Tidak ada data tahun pelajaran yang cocok.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination & Dropdown size */}
                    <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-slate-200/50 dark:border-slate-800/50 text-xs font-bold text-slate-500 gap-4">
                        <div className="flex items-center gap-3">
                            <span>Menampilkan {Math.min(dataTersaring.length, (halamanAktif - 1) * jumlahEntri + 1)} - {Math.min(dataTersaring.length, halamanAktif * jumlahEntri)} dari {dataTersaring.length} tahun pelajaran</span>
                            <select
                                value={jumlahEntri}
                                onChange={e => {
                                    setJumlahEntri(parseInt(e.target.value));
                                    setHalamanAktif(1);
                                }}
                                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 text-slate-600 focus:ring-[#000066]"
                            >
                                <option value={10}>10 / hlm</option>
                                <option value={25}>25 / hlm</option>
                                <option value={50}>50 / hlm</option>
                            </select>
                        </div>
                        
                        {totalHalaman > 1 && (
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setHalamanAktif(prev => Math.max(1, prev - 1))}
                                    disabled={halamanAktif === 1}
                                    className="p-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40"
                                >
                                    «
                                </button>
                                <button
                                    onClick={() => setHalamanAktif(prev => Math.max(1, prev - 1))}
                                    disabled={halamanAktif === 1}
                                    className="p-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40"
                                >
                                    ‹
                                </button>
                                {[...Array(totalHalaman)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => setHalamanAktif(i + 1)}
                                        className={`w-7 h-7 flex items-center justify-center rounded-lg ${halamanAktif === i + 1 ? 'bg-[#000066] text-white' : 'border border-slate-200 dark:border-slate-800 text-slate-650'}`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setHalamanAktif(prev => Math.min(totalHalaman, prev + 1))}
                                    disabled={halamanAktif === totalHalaman}
                                    className="p-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40"
                                >
                                    ›
                                </button>
                                <button
                                    onClick={() => setHalamanAktif(prev => Math.min(totalHalaman, prev + 1))}
                                    disabled={halamanAktif === totalHalaman}
                                    className="p-1 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-40"
                                >
                                    »
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Tambah Tahun Pelajaran */}
            {modalBuka && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-5">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="font-extrabold text-lg text-slate-800 dark:text-white">
                                Tambah Tahun Pelajaran
                            </h3>
                            <button
                                onClick={() => setModalBuka(false)}
                                className="p-1 hover:bg-slate-150 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 rounded-xl transition-all"
                            >
                                <span className="material-symbols-rounded text-lg">close</span>
                            </button>
                        </div>

                        <form onSubmit={simpanTahunPelajaran} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-750 dark:text-slate-350 mb-1 uppercase tracking-wider">Tahun Mulai</label>
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
                                        className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/50 dark:border-slate-700/50 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#000066] text-sm"
                                        required
                                    />
                                    <InputError message={errors.tahun_mulai} className="mt-1" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-750 dark:text-slate-350 mb-1 uppercase tracking-wider">Tahun Selesai</label>
                                    <input
                                        type="number"
                                        min="2000"
                                        max="2100"
                                        value={data.tahun_selesai}
                                        onChange={e => setData('tahun_selesai', parseInt(e.target.value) || 0)}
                                        className="w-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/50 dark:border-slate-700/50 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-[#000066] text-sm"
                                        required
                                    />
                                    <InputError message={errors.tahun_selesai} className="mt-1" />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 py-2">
                                <input
                                    type="checkbox"
                                    id="is_aktif"
                                    checked={data.is_aktif}
                                    onChange={e => setData('is_aktif', e.target.checked)}
                                    className="rounded border-gray-300 dark:border-slate-700 text-[#000066] focus:ring-[#000066]"
                                />
                                <label htmlFor="is_aktif" className="text-xs font-bold text-slate-650 dark:text-slate-300 uppercase tracking-wider select-none cursor-pointer">
                                    Jadikan Tahun Pelajaran Aktif
                                </label>
                                <InputError message={errors.is_aktif} className="mt-1" />
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

IndeksTahunPelajaran.layout = (page) => (
    <TataLetakUtama children={page} title="Tahun Pelajaran" />
);
