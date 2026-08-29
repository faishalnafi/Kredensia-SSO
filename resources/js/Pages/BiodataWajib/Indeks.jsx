import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import TataLetakUtama from '@/Layouts/TataLetakUtama';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import InputError from '@/Components/InputError';

export default function IndeksBiodataWajib({ user, peran = [] }) {
    const { data, setData, post, processing, errors } = useForm({
        nama_lengkap: user?.nama_lengkap || '',
        jk: user?.jk || '',
        tgl_lahir: user?.tgl_lahir || '',
        nik: user?.nik || '',
        nip_nis: user?.nip_nis || '',
        no_telp: user?.no_telp || '',
        alamat: user?.alamat || '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('biodata.simpan'));
    };

    const labelNipNis = peran.includes('Guru') ? 'NIP' : 'NISN';

    return (
        <>
            <Head title="Pengisian Biodata Wajib" />

            <div className="max-w-4xl mx-auto space-y-6">

                {/* ─── Peringatan Banner Glassmorphism ─── */}
                <div className="bg-gradient-to-r from-amber-500/90 via-orange-500/90 to-red-500/90 dark:from-amber-600/90 dark:to-red-600/90 text-white rounded-3xl p-6 lg:p-8 shadow-xl shadow-amber-500/10 backdrop-blur-xl relative overflow-hidden">
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
                        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                    </div>
                    <div className="relative flex items-start gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center shrink-0 shadow-md">
                            <span className="material-symbols-rounded text-3xl">badge</span>
                        </div>
                        <div>
                            <h2 className="text-xl lg:text-2xl font-extrabold tracking-tight">
                                Pengisian Biodata Wajib
                            </h2>
                            <p className="mt-1 text-amber-50 text-sm leading-relaxed max-w-2xl">
                                Selamat datang di portal SSO! Untuk mengaktifkan seluruh menu dan layanan aplikasi, 
                                Anda <strong>wajib melengkapi seluruh bidang biodata</strong> di bawah ini secara akurat.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ─── Informasi Akun Saat Ini ─── */}
                <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#0F91FC]/10 dark:bg-[#0F91FC]/20 flex items-center justify-center text-[#0F91FC]">
                            <span className="material-symbols-rounded text-xl">account_circle</span>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Terdaftar Sebagai</p>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                                {user?.email} ({peran.join(', ') || 'Pengguna'})
                            </p>
                        </div>
                    </div>
                    {user?.kelas && (
                        <div className="px-4 py-2 bg-slate-100 dark:bg-slate-900 rounded-2xl text-xs font-semibold text-slate-600 dark:text-slate-400">
                            Kelas: <span className="text-[#0F91FC] font-bold">{user.kelas.nama_kelas}</span> ({user.kelas.jurusan})
                        </div>
                    )}
                </div>

                {/* ─── Formulir Pengisian Biodata ─── */}
                <form onSubmit={handleSubmit} className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-3xl p-6 lg:p-8 shadow-xl space-y-6">
                    <div className="border-b border-slate-200/50 dark:border-slate-800/50 pb-4 mb-2">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-rounded text-[#0F91FC]">edit_square</span>
                            Data Diri Utama
                        </h3>
                        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                            Semua bidang bertanda <span className="text-red-500 font-bold">*</span> wajib diisi dengan benar.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Nama Lengkap */}
                        <div className="md:col-span-2">
                            <InputLabel htmlFor="nama_lengkap" value="Nama Lengkap *" />
                            <TextInput
                                id="nama_lengkap"
                                type="text"
                                className="mt-1 block w-full"
                                value={data.nama_lengkap}
                                onChange={(e) => setData('nama_lengkap', e.target.value)}
                                required
                                placeholder="Masukkan nama lengkap Anda..."
                            />
                            <InputError message={errors.nama_lengkap} className="mt-1" />
                        </div>

                        {/* NIK */}
                        <div>
                            <InputLabel htmlFor="nik" value="NIK (Nomor Induk Kependudukan) *" />
                            <TextInput
                                id="nik"
                                type="text"
                                maxLength={16}
                                className="mt-1 block w-full"
                                value={data.nik}
                                onChange={(e) => setData('nik', e.target.value)}
                                required
                                placeholder="16 digit NIK..."
                            />
                            <InputError message={errors.nik} className="mt-1" />
                        </div>

                        {/* NIP / NISN */}
                        <div>
                            <InputLabel htmlFor="nip_nis" value={`${labelNipNis} *`} />
                            <TextInput
                                id="nip_nis"
                                type="text"
                                className="mt-1 block w-full"
                                value={data.nip_nis}
                                onChange={(e) => setData('nip_nis', e.target.value)}
                                required
                                placeholder={`Masukkan ${labelNipNis}...`}
                            />
                            <InputError message={errors.nip_nis} className="mt-1" />
                        </div>

                        {/* Jenis Kelamin */}
                        <div>
                            <InputLabel htmlFor="jk" value="Jenis Kelamin *" />
                            <select
                                id="jk"
                                className="mt-1 block w-full border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 focus:border-[#0F91FC] dark:focus:border-[#0F91FC] focus:ring-[#0F91FC] dark:focus:ring-[#0F91FC] rounded-md shadow-sm text-sm"
                                value={data.jk}
                                onChange={(e) => setData('jk', e.target.value)}
                                required
                            >
                                <option value="">-- Pilih Jenis Kelamin --</option>
                                <option value="L">Laki-laki</option>
                                <option value="P">Perempuan</option>
                            </select>
                            <InputError message={errors.jk} className="mt-1" />
                        </div>

                        {/* Tanggal Lahir */}
                        <div>
                            <InputLabel htmlFor="tgl_lahir" value="Tanggal Lahir *" />
                            <TextInput
                                id="tgl_lahir"
                                type="date"
                                className="mt-1 block w-full"
                                value={data.tgl_lahir}
                                onChange={(e) => setData('tgl_lahir', e.target.value)}
                                required
                            />
                            <InputError message={errors.tgl_lahir} className="mt-1" />
                        </div>

                        {/* Nomor Telepon / WA */}
                        <div className="md:col-span-2">
                            <InputLabel htmlFor="no_telp" value="Nomor Telepon / WhatsApp *" />
                            <TextInput
                                id="no_telp"
                                type="text"
                                className="mt-1 block w-full"
                                value={data.no_telp}
                                onChange={(e) => setData('no_telp', e.target.value)}
                                required
                                placeholder="Contoh: 081234567890"
                            />
                            <InputError message={errors.no_telp} className="mt-1" />
                        </div>

                        {/* Alamat Lengkap */}
                        <div className="md:col-span-2">
                            <InputLabel htmlFor="alamat" value="Alamat Lengkap *" />
                            <textarea
                                id="alamat"
                                rows={3}
                                className="mt-1 block w-full border-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 focus:border-[#0F91FC] dark:focus:border-[#0F91FC] focus:ring-[#0F91FC] dark:focus:ring-[#0F91FC] rounded-md shadow-sm text-sm p-3"
                                value={data.alamat}
                                onChange={(e) => setData('alamat', e.target.value)}
                                required
                                placeholder="Tuliskan jalan, RT/RW, kelurahan, kecamatan, dan kota/kabupaten..."
                            />
                            <InputError message={errors.alamat} className="mt-1" />
                        </div>

                    </div>

                    {/* Tombol Simpan & Aktifkan */}
                    <div className="pt-4 border-t border-slate-200/50 dark:border-slate-800/50 flex items-center justify-end gap-4">
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-[#0F91FC] to-[#0a78d6] text-white font-extrabold rounded-2xl shadow-lg shadow-[#0F91FC]/30 hover:shadow-[#0F91FC]/50 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                        >
                            <span className="material-symbols-rounded text-xl">
                                {processing ? 'hourglass_top' : 'task_alt'}
                            </span>
                            {processing ? 'Menyimpan...' : 'Simpan & Aktifkan Seluruh Akses Menu'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

IndeksBiodataWajib.layout = (page) => (
    <TataLetakUtama children={page} title="Lengkapi Biodata Wajib" />
);
