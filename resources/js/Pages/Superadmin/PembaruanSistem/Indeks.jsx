import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import TataLetakUtama from '@/Layouts/TataLetakUtama';
import InputError from '@/Components/InputError';
import Swal from 'sweetalert2';

export default function PembaruanSistem({ versiSekarang, infoServer, riwayatPembaruan = [] }) {
    const [dragOver, setDragOver] = useState(false);
    const [namaBerkas, setNamaBerkas] = useState('');
    const [ukuranBerkas, setUkuranBerkas] = useState('');

    const formPembaruan = useForm({
        berkas_zip: null,
    });

    const tanganiPilihanBerkas = (file) => {
        if (!file) return;

        if (!file.name.endsWith('.zip')) {
            Swal.fire({
                title: 'Format Berkas Salah',
                text: 'Hanya berkas kompresi .zip yang diperbolehkan untuk pembaruan sistem.',
                icon: 'warning',
                confirmButtonColor: '#0F91FC',
                customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5' }
            });
            return;
        }

        formPembaruan.setData('berkas_zip', file);
        setNamaBerkas(file.name);
        setUkuranBerkas(formatUkuran(file.size));
    };

    const tanganiDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            tanganiPilihanBerkas(e.dataTransfer.files[0]);
        }
    };

    const formatUkuran = (bytes) => {
        if (!bytes) return '0 B';
        const units = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return (bytes / Math.pow(1024, i)).toFixed(2) + ' ' + units[i];
    };

    const konfirmasiPembaruan = (e) => {
        e.preventDefault();

        if (!formPembaruan.data.berkas_zip) {
            Swal.fire({
                title: 'Berkas Belum Dipilih',
                text: 'Silakan pilih atau unggah berkas ZIP pembaruan terlebih dahulu.',
                icon: 'info',
                confirmButtonColor: '#0F91FC',
                customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5' }
            });
            return;
        }

        Swal.fire({
            title: 'Jalankan Pembaruan Sistem?',
            html: `Anda akan memperbarui portal SSO dengan berkas <strong>${namaBerkas}</strong> (${ukuranBerkas}).<br/><br/><span class="text-xs text-amber-600 bg-amber-50 p-2 rounded-lg block font-semibold">⚠️ Berkas aplikasi akan diperbarui secara otomatis & migrasi database akan dijalankan.</span>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: '🚀 Ya, Jalankan Pembaruan',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#0F91FC',
            cancelButtonColor: '#6b7280',
            customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5', cancelButton: 'rounded-xl font-bold px-5 py-2.5' }
        }).then((res) => {
            if (res.isConfirmed) {
                formPembaruan.post(route('superadmin.pembaruan.proses'), {
                    preserveScroll: true,
                    onSuccess: () => {
                        formPembaruan.reset();
                        setNamaBerkas('');
                        setUkuranBerkas('');
                    }
                });
            }
        });
    };

    return (
        <>
            <Head title="Pembaruan Sistem (Live Update)" />

            <div className="w-full max-w-6xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-2.5">
                            <span className="material-symbols-rounded text-3xl text-[#0F91FC]">system_update</span>
                            Pembaruan Sistem (Live Software Updater)
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                            Unggah berkas pembaruan (.zip) untuk memperbarui aplikasi tanpa perlu membuka terminal atau menghubungi server admin.
                        </p>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/40 px-4 py-2 rounded-2xl flex items-center gap-3 shrink-0">
                        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                        <div>
                            <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider block">Versi Saat Ini</span>
                            <span className="text-base font-extrabold text-slate-800 dark:text-slate-100 font-mono">v{versiSekarang}</span>
                        </div>
                    </div>
                </div>

                {/* Server Status Metrics - Bento Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Versi PHP</span>
                        <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200 text-sm font-mono">
                            <span className="material-symbols-rounded text-emerald-500 text-base">code</span>
                            <span>{infoServer.versi_php}</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Sistem Operasi</span>
                        <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200 text-sm">
                            <span className="material-symbols-rounded text-blue-500 text-base">computer</span>
                            <span>{infoServer.sistem_operasi}</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Batas Ukuran Upload</span>
                        <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200 text-sm font-mono">
                            <span className="material-symbols-rounded text-amber-500 text-base">upload_file</span>
                            <span>{infoServer.max_upload_size}</span>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 shadow-sm">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Sisa Ruang Disk</span>
                        <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-200 text-sm font-mono">
                            <span className="material-symbols-rounded text-purple-500 text-base">hard_drive</span>
                            <span>{infoServer.sisa_ruang_disk}</span>
                        </div>
                    </div>
                </div>

                {/* Main Content Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Form Unggah Berkas ZIP (Left 2 Columns) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-5">
                            <div>
                                <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                                    <span className="material-symbols-rounded text-[#0F91FC]">cloud_upload</span>
                                    Unggah Berkas Paket Pembaruan (.zip)
                                </h3>
                                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                    Pilih berkas kompresi ZIP paket rilis pembaruan. Sistem akan otomatis mengekstrak berkas, memperbarui logika aplikasi, serta menjalankan migrasi database & pembersihan cache.
                                </p>
                            </div>

                            <form onSubmit={konfirmasiPembaruan} className="space-y-4">
                                {/* Zone Dropdown Upload */}
                                <div
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={tanganiDrop}
                                    className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all cursor-pointer ${
                                        dragOver 
                                            ? 'border-[#0F91FC] bg-blue-50/50 dark:bg-blue-950/30' 
                                            : namaBerkas 
                                                ? 'border-emerald-400 bg-emerald-50/20 dark:bg-emerald-950/20' 
                                                : 'border-slate-200 dark:border-slate-700/70 hover:border-[#0F91FC] bg-slate-50/50 dark:bg-slate-900/50'
                                    }`}
                                    onClick={() => document.getElementById('berkas_zip_input').click()}
                                >
                                    <input 
                                        type="file"
                                        id="berkas_zip_input"
                                        accept=".zip"
                                        className="hidden"
                                        onChange={(e) => e.target.files && tanganiPilihanBerkas(e.target.files[0])}
                                    />

                                    {namaBerkas ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
                                                <span className="material-symbols-rounded text-3xl">folder_zip</span>
                                            </div>
                                            <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{namaBerkas}</span>
                                            <span className="text-xs text-slate-400 font-mono">Ukuran: {ukuranBerkas}</span>
                                            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-100/50 dark:bg-emerald-950/50 px-3 py-1 rounded-full mt-1">
                                                ✓ Berkas Siap Diperbarui
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[#0F91FC] flex items-center justify-center mb-1">
                                                <span className="material-symbols-rounded text-3xl">upload_file</span>
                                            </div>
                                            <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                                                Tarik & Lepaskan Berkas .ZIP Di Sini
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                atau klik untuk memilih berkas dari komputer Anda (Maksimal 100MB)
                                            </span>
                                        </div>
                                    )}
                                </div>
                                <InputError message={formPembaruan.errors.berkas_zip} className="mt-1" />

                                {/* Progress Bar Upload jika sedang diproses */}
                                {formPembaruan.progress && (
                                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                                        <div 
                                            className="bg-[#0F91FC] h-full transition-all duration-300 rounded-full" 
                                            style={{ width: `${formPembaruan.progress.percentage}%` }}
                                        ></div>
                                    </div>
                                )}

                                {/* Warning Notice */}
                                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 p-4 rounded-2xl flex items-start gap-3">
                                    <span className="material-symbols-rounded text-amber-600 shrink-0 text-xl mt-0.5">warning</span>
                                    <div className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
                                        <strong>Proteksi Berkas Sensitif:</strong> Berkas <code>.env</code>, kredensial database SQLite, folder <code>storage/</code>, dan file konfigurasi lokal dilindungi secara otomatis dan tidak akan tertimpa saat pembaruan berlangsung.
                                    </div>
                                </div>

                                {/* Submit Button */}
                                <div className="flex justify-end pt-2">
                                    <button
                                        type="submit"
                                        disabled={formPembaruan.processing || !namaBerkas}
                                        className="bg-[#0F91FC] hover:bg-[#0a78d6] disabled:opacity-50 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-[#0F91FC]/20 transition-all flex items-center gap-2"
                                    >
                                        <span className="material-symbols-rounded text-lg">system_update</span>
                                        <span>{formPembaruan.processing ? 'Memproses Pembaruan...' : 'Jalankan Pembaruan Sistem'}</span>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Right Column: Riwayat Audit & Instruction */}
                    <div className="space-y-6">
                        
                        {/* Card Riwayat Pembaruan */}
                        <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-4">
                            <h3 className="font-bold text-sm text-slate-800 dark:text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-700/50 pb-3">
                                <span className="material-symbols-rounded text-emerald-500 text-lg">history</span>
                                Riwayat Pembaruan Terakhir
                            </h3>

                            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                                {riwayatPembaruan && riwayatPembaruan.length > 0 ? (
                                    riwayatPembaruan.map((log) => (
                                        <div key={log.id} className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-700/50 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                                                    SUCCESS
                                                </span>
                                                <span className="text-[10px] text-slate-400 font-mono">
                                                    {new Date(log.created_at).toLocaleDateString('id-ID')}
                                                </span>
                                            </div>
                                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-tight">
                                                {log.aktivitas}
                                            </p>
                                            <span className="text-[10px] text-slate-400 block">
                                                Oleh: {log.user ? log.user.nama_lengkap : 'Superadmin'}
                                            </span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-6 text-slate-400 text-xs">
                                        Belum ada catatan riwayat pembaruan sistem.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Card Panduan Struktur Berkas ZIP */}
                        <div className="bg-slate-50 dark:bg-slate-900/60 rounded-3xl p-5 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
                            <h4 className="font-bold text-xs text-slate-700 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                                <span className="material-symbols-rounded text-[#0F91FC] text-base">info</span>
                                Struktur Berkas Paket ZIP
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                                Paket rilis ZIP harus mengikuti struktur direktori Laravel standar. Anda dapat menambahkan file <code>version.json</code> di root zip untuk mendaftarkan nomor versi baru:
                            </p>
                            <pre className="bg-slate-900 text-emerald-400 p-3 rounded-xl text-[10px] font-mono overflow-x-auto leading-relaxed">
{`{
  "version": "1.2.5",
  "name": "Update Fitur SSO & Pelacakan GPS",
  "date": "2026-08-06"
}`}
                            </pre>
                        </div>

                    </div>
                </div>

            </div>
        </>
    );
}

PembaruanSistem.layout = (page) => <TataLetakUtama children={page} title="Pembaruan Sistem (Live Updater)" />;
