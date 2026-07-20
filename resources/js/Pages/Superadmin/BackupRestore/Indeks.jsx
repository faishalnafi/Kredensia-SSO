import React, { useState, useRef } from 'react';
import { Head, useForm } from '@inertiajs/react';
import TataLetakUtama from '@/Layouts/TataLetakUtama';
import Swal from 'sweetalert2';

/**
 * Halaman Backup & Restore Data — Khusus Superadmin
 * Menyediakan:
 * - Unduh backup JSON lengkap seluruh data sistem
 * - Restore data dari file JSON backup
 * - Informasi ringkasan data yang di-backup
 */
export default function IndeksBackupRestore({ ringkasan }) {
    const [sedangUnduh, setSedangUnduh] = useState(false);
    const [berkasRestore, setBerkasRestore] = useState(null);
    const refInputBerkas = useRef(null);

    const { post, processing, errors, reset } = useForm({});

    const urlUnduh  = route('superadmin.backup-restore.unduh');
    const urlRestore = route('superadmin.backup-restore.restore');

    /* ─── Handler Unduh Backup ─── */
    const mulaiUnduhBackup = async () => {
        const konfirmasi = await Swal.fire({
            title: 'Unduh Backup Sistem',
            html: `
                <p style="color:#6b7280;font-size:0.85rem;line-height:1.6;">
                    Sistem akan mengunduh <strong>seluruh data</strong> dalam format JSON terenkripsi.
                    File ini mencakup semua pengguna, kelas, tahun pelajaran, dan peran yang terdaftar.
                </p>
            `,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: '⬇️ Unduh Sekarang',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#0F91FC',
            cancelButtonColor: '#6b7280',
            customClass: {
                popup: 'rounded-3xl',
                confirmButton: 'rounded-xl font-bold px-5 py-2.5',
                cancelButton: 'rounded-xl font-bold px-5 py-2.5',
            }
        });

        if (!konfirmasi.isConfirmed) return;

        setSedangUnduh(true);

        // Trigger download langsung via <a> element
        const tautan = document.createElement('a');
        tautan.href = urlUnduh;
        tautan.download = '';
        document.body.appendChild(tautan);
        tautan.click();
        document.body.removeChild(tautan);

        setTimeout(() => {
            setSedangUnduh(false);
            Swal.fire({
                title: '✅ Backup Berhasil Diunduh',
                text: 'File JSON backup telah tersimpan di folder unduhan Anda.',
                icon: 'success',
                confirmButtonText: 'Baik',
                confirmButtonColor: '#10b981',
                customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5' }
            });
        }, 1200);
    };

    /* ─── Handler Restore ─── */
    const prosesRestore = async (e) => {
        e.preventDefault();

        if (!berkasRestore) {
            Swal.fire({
                title: 'File Belum Dipilih',
                text: 'Pilih file JSON backup terlebih dahulu.',
                icon: 'warning',
                confirmButtonColor: '#f59e0b',
                customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5' }
            });
            return;
        }

        const konfirmasi = await Swal.fire({
            title: '⚠️ Konfirmasi Restore',
            html: `
                <p style="color:#6b7280;font-size:0.85rem;line-height:1.6;">
                    Data dari file backup akan <strong>ditimpa ke dalam sistem</strong>. 
                    Pastikan file ini berasal dari sistem yang sama. Proses ini bisa memakan beberapa saat.
                </p>
                <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:8px 12px;margin-top:12px;font-size:0.8rem;color:#92400e;">
                    <strong>📁 File:</strong> ${berkasRestore.name}
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: '🔄 Ya, Restore Sekarang',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#f59e0b',
            cancelButtonColor: '#6b7280',
            allowOutsideClick: false,
            customClass: {
                popup: 'rounded-3xl',
                confirmButton: 'rounded-xl font-bold px-5 py-2.5',
                cancelButton: 'rounded-xl font-bold px-5 py-2.5',
            }
        });

        if (!konfirmasi.isConfirmed) return;

        Swal.fire({
            title: 'Sedang Merestore Data...',
            html: '<p style="color:#6b7280;font-size:0.85rem;">Mohon tunggu, proses restore sedang berjalan.</p>',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => Swal.showLoading(),
        });

        // Kirim menggunakan FormData manual karena Inertia useForm tidak handle file dengan baik di kasus ini
        const formData = new FormData();
        formData.append('file_backup', berkasRestore);
        formData.append('_method', 'POST');

        try {
            const res = await fetch(urlRestore, {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json',
                },
                body: formData,
            });

            if (res.ok) {
                Swal.fire({
                    title: '✅ Restore Berhasil',
                    text: 'Data berhasil dipulihkan dari file backup.',
                    icon: 'success',
                    confirmButtonText: 'Baik',
                    confirmButtonColor: '#10b981',
                    customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5' }
                });
                setBerkasRestore(null);
                if (refInputBerkas.current) refInputBerkas.current.value = '';
            } else {
                const json = await res.json().catch(() => ({}));
                const pesan = json?.errors?.file_backup?.[0] || json?.message || 'Terjadi kesalahan saat restore.';
                Swal.fire({
                    title: 'Restore Gagal',
                    text: pesan,
                    icon: 'error',
                    confirmButtonText: 'Tutup',
                    confirmButtonColor: '#ef4444',
                    customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5' }
                });
            }
        } catch (err) {
            Swal.fire({
                title: 'Gagal Terhubung',
                text: 'Tidak dapat menghubungi server. Periksa koneksi Anda.',
                icon: 'error',
                confirmButtonText: 'Tutup',
                confirmButtonColor: '#ef4444',
                customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5' }
            });
        }
    };

    const kartuRingkasan = [
        { ikon: 'group',               label: 'Pengguna',       nilai: ringkasan.pengguna,        warna: 'text-[#0F91FC]',  bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/30' },
        { ikon: 'admin_panel_settings', label: 'Peran',          nilai: ringkasan.peran,           warna: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-950/30 border-violet-100 dark:border-violet-900/30' },
        { ikon: 'meeting_room',         label: 'Kelas',          nilai: ringkasan.kelas,           warna: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/30' },
        { ikon: 'calendar_month',       label: 'Tahun Pelajaran', nilai: ringkasan.tahun_pelajaran, warna: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/30' },
        { ikon: 'key',                  label: 'Kunci API',      nilai: ringkasan.kunci_api,       warna: 'text-rose-500',   bg: 'bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/30' },
    ];

    return (
        <>
            <Head title="Backup & Restore Data" />

            <div className="max-w-5xl mx-auto space-y-8">

                {/* ─── Header ─── */}
                <div className="bg-gradient-to-r from-[#081242] via-[#0a1e6e] to-[#0F91FC] rounded-3xl p-6 lg:p-8 text-white shadow-2xl shadow-[#0F91FC]/20 relative overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-10 -right-10 w-52 h-52 bg-white/5 rounded-full blur-3xl" />
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
                    </div>
                    <div className="relative flex items-start gap-5">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                            <span className="material-symbols-rounded text-3xl">cloud_sync</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-extrabold tracking-tight">Backup & Restore Data</h2>
                            <p className="mt-2 text-blue-100 text-sm leading-relaxed max-w-2xl">
                                Unduh salinan lengkap seluruh data sistem dalam format JSON terenkripsi, atau pulihkan data dari file backup yang tersimpan.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ─── Grid Ringkasan ─── */}
                <div>
                    <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Data yang Akan Di-backup</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {kartuRingkasan.map((k, i) => (
                            <div key={i} className={`rounded-2xl p-4 border ${k.bg} space-y-2`}>
                                <span className={`material-symbols-rounded text-2xl ${k.warna}`}>{k.ikon}</span>
                                <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{k.nilai.toLocaleString('id-ID')}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{k.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ─── Panel Unduh Backup ─── */}
                <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#0F91FC]/10 dark:bg-[#0F91FC]/20 rounded-xl flex items-center justify-center text-[#0F91FC]">
                            <span className="material-symbols-rounded text-xl">download</span>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">Unduh Backup JSON</h3>
                            <p className="text-xs text-slate-400 dark:text-slate-500">Snapshot penuh seluruh data sistem saat ini</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 space-y-2 text-xs text-slate-500 dark:text-slate-400">
                        <p className="flex items-center gap-2"><span className="material-symbols-rounded text-base text-emerald-500">check_circle</span> Seluruh pengguna beserta relasi peran dan kelas</p>
                        <p className="flex items-center gap-2"><span className="material-symbols-rounded text-base text-emerald-500">check_circle</span> Data kelas dan tahun pelajaran</p>
                        <p className="flex items-center gap-2"><span className="material-symbols-rounded text-base text-emerald-500">check_circle</span> Daftar peran/role</p>
                        <p className="flex items-center gap-2"><span className="material-symbols-rounded text-base text-amber-500">info</span> Kunci rahasia API akan di-redaksi demi keamanan</p>
                    </div>

                    <button
                        onClick={mulaiUnduhBackup}
                        disabled={sedangUnduh}
                        className="flex items-center gap-3 px-6 py-3.5 bg-[#0F91FC] hover:bg-[#0a78d6] disabled:opacity-50 text-white font-extrabold rounded-2xl transition-all shadow-lg shadow-[#0F91FC]/25 hover:-translate-y-0.5 active:translate-y-0 text-sm"
                    >
                        <span className="material-symbols-rounded text-xl">
                            {sedangUnduh ? 'hourglass_top' : 'cloud_download'}
                        </span>
                        {sedangUnduh ? 'Menyiapkan File...' : 'Unduh Backup Sekarang'}
                    </button>
                </div>

                {/* ─── Panel Restore ─── */}
                <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/30 rounded-xl flex items-center justify-center text-amber-500">
                            <span className="material-symbols-rounded text-xl">restore</span>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">Restore dari File Backup</h3>
                            <p className="text-xs text-slate-400 dark:text-slate-500">Pulihkan data dari file JSON backup sebelumnya</p>
                        </div>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-2xl p-4 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2.5">
                        <span className="material-symbols-rounded text-base shrink-0 mt-0.5">warning</span>
                        <span>
                            <strong>Perhatian:</strong> Restore akan menimpa data yang sudah ada dengan data dari file backup. 
                            Akun Super Admin yang sudah ada tidak akan tertimpa untuk mencegah kehilangan akses.
                        </span>
                    </div>

                    <form onSubmit={prosesRestore} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest mb-2">
                                Pilih File Backup JSON
                            </label>
                            <div
                                className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center cursor-pointer hover:border-[#0F91FC] dark:hover:border-[#0F91FC] transition-colors"
                                onClick={() => refInputBerkas.current?.click()}
                            >
                                {berkasRestore ? (
                                    <div className="space-y-1">
                                        <span className="material-symbols-rounded text-3xl text-emerald-500">check_circle</span>
                                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{berkasRestore.name}</p>
                                        <p className="text-xs text-slate-400">{(berkasRestore.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <span className="material-symbols-rounded text-3xl text-slate-300 dark:text-slate-600">upload_file</span>
                                        <p className="text-sm text-slate-400 dark:text-slate-500">Klik untuk memilih file <code className="bg-slate-100 dark:bg-slate-900 px-1.5 rounded font-mono">.json</code></p>
                                        <p className="text-xs text-slate-300 dark:text-slate-600">Ukuran maksimal: 50 MB</p>
                                    </div>
                                )}
                            </div>
                            <input
                                ref={refInputBerkas}
                                type="file"
                                accept=".json,application/json"
                                className="hidden"
                                onChange={e => setBerkasRestore(e.target.files[0] || null)}
                            />
                            {errors.file_backup && (
                                <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                                    <span className="material-symbols-rounded text-base">error</span>
                                    {errors.file_backup}
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={!berkasRestore || processing}
                            className="flex items-center gap-3 px-6 py-3.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-extrabold rounded-2xl transition-all shadow-lg shadow-amber-500/25 hover:-translate-y-0.5 active:translate-y-0 text-sm"
                        >
                            <span className="material-symbols-rounded text-xl">
                                {processing ? 'hourglass_top' : 'restore'}
                            </span>
                            {processing ? 'Merestore...' : 'Restore Data dari File'}
                        </button>
                    </form>
                </div>

                {/* ─── Info Format File ─── */}
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-5 border border-slate-100 dark:border-slate-800/50 space-y-3">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Format File Backup</h4>
                    <pre className="text-xs font-mono text-slate-500 dark:text-slate-400 overflow-x-auto leading-relaxed">{`{
  "meta": { "versi": "1.0", "dibuat_pada": "...", "aplikasi": "Kredensia SSO" },
  "pengguna":        [ {...}, ... ],
  "peran":           [ {...}, ... ],
  "kelas":           [ {...}, ... ],
  "tahun_pelajaran": [ {...}, ... ],
  "kunci_api":       [ {...}, ... ]
}`}</pre>
                </div>

            </div>
        </>
    );
}

IndeksBackupRestore.layout = page => (
    <TataLetakUtama children={page} title="Backup & Restore Data" />
);
