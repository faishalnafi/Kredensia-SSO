import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import TataLetakUtama from '@/Layouts/TataLetakUtama';
import Swal from 'sweetalert2';

/**
 * Halaman Hapus Data Keseluruhan
 * Digunakan bersama oleh Superadmin dan Admin.
 * Alur wajib unduh JSON backup terlebih dahulu sebelum dapat menghapus data.
 */
export default function IndeksHapusData({ ringkasan, peranAdmin = [] }) {
    const { url } = usePage();
    const [sedangMemproses, setSedangMemproses] = useState(false);

    // Tentukan prefix rute berdasarkan URL halaman saat ini
    const prefixRute = url.startsWith('/admin') ? 'admin' : 'superadmin';

    const urlUnduhBackup  = route(`${prefixRute}.hapus-data.unduh-backup`);
    const urlProsesHapus  = route(`${prefixRute}.hapus-data.proses`);

    /**
     * Alur SweetAlert berlapis sebelum hapus data:
     * Step 1 — Peringatan + tombol Unduh JSON (wajib diklik)
     * Step 2 — Konfirmasi ketik "HAPUS SEMUA DATA" setelah download
     * Step 3 — Proses hapus
     */
    const mulaiArahHapus = async () => {
        // ═══ STEP 1: Informasi bahaya + wajib unduh backup ═══
        const step1 = await Swal.fire({
            title: '<span style="color:#ef4444;font-size:1.3rem;">⚠️ Zona Bahaya!</span>',
            html: `
                <div style="text-align:left;font-size:0.85rem;line-height:1.7;">
                    <p style="color:#374151;margin-bottom:12px;">Tindakan ini akan <strong style="color:#ef4444;">menghapus permanen</strong> seluruh data berikut dari sistem:</p>
                    <ul style="color:#6b7280;margin-left:1rem;margin-bottom:16px;">
                        <li>🧑‍🎓 <strong>${ringkasan.pengguna_terdampak}</strong> pengguna (Siswa, Guru, Tendik, dll.)</li>
                        <li>🏫 <strong>${ringkasan.kelas}</strong> data kelas</li>
                        <li>📅 <strong>${ringkasan.tahun_pelajaran}</strong> data tahun pelajaran</li>
                        <li>🔑 <strong>${ringkasan.peran_terdampak}</strong> peran non-sistem</li>
                    </ul>
                    <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:10px 14px;margin-bottom:14px;">
                        <strong style="color:#92400e;">✅ Data yang AMAN:</strong>
                        <p style="color:#78350f;margin:4px 0 0;">Akun Super Admin & Admin (<strong>${ringkasan.pengguna_aman} akun</strong>) dan Pengaturan Sistem tidak akan terhapus.</p>
                    </div>
                    <p style="color:#374151;font-weight:600;">Sebelum melanjutkan, <span style="color:#0F91FC;">unduh backup JSON</span> terlebih dahulu sebagai cadangan data Anda.</p>
                </div>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: '⬇️ Unduh Backup JSON Dulu',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#0F91FC',
            cancelButtonColor: '#6b7280',
            allowOutsideClick: false,
            allowEscapeKey: false,
            customClass: {
                popup: 'rounded-3xl shadow-2xl',
                confirmButton: 'rounded-xl font-bold px-5 py-2.5',
                cancelButton: 'rounded-xl font-bold px-5 py-2.5',
            }
        });

        if (!step1.isConfirmed) return;

        // ═══ Unduh file JSON backup secara otomatis ═══
        // Trigger download via <a> element agar tidak butuh tab baru
        const tautan = document.createElement('a');
        tautan.href = urlUnduhBackup;
        tautan.download = '';
        document.body.appendChild(tautan);
        tautan.click();
        document.body.removeChild(tautan);

        // Delay sebentar agar browser sempat mulai download
        await new Promise(res => setTimeout(res, 800));

        // ═══ STEP 2: Konfirmasi setelah unduh — ketik teks konfirmasi ═══
        const step2 = await Swal.fire({
            title: '<span style="color:#ef4444;font-size:1.1rem;">Konfirmasi Penghapusan Data</span>',
            html: `
                <div style="text-align:left;font-size:0.85rem;line-height:1.7;">
                    <div style="background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;padding:10px 14px;margin-bottom:16px;">
                        <strong style="color:#991b1b;">✅ Pastikan file JSON sudah terunduh</strong> sebelum melanjutkan. File backup berjudul <code>kredensia-pra-hapus-*.json</code>.
                    </div>
                    <p style="color:#374151;margin-bottom:8px;">Untuk mengkonfirmasi penghapusan, ketik teks berikut persis:</p>
                    <p style="font-family:monospace;background:#f1f5f9;border-radius:6px;padding:6px 10px;color:#0f172a;font-weight:bold;letter-spacing:0.05em;font-size:0.9rem;margin-bottom:12px;">HAPUS SEMUA DATA</p>
                </div>
            `,
            input: 'text',
            inputPlaceholder: 'Ketik: HAPUS SEMUA DATA',
            inputAttributes: {
                autocomplete: 'off',
                style: 'font-family:monospace;font-weight:bold;text-align:center;font-size:1rem;letter-spacing:0.05em;',
            },
            icon: 'error',
            showCancelButton: true,
            confirmButtonText: '🗑️ Ya, Hapus Sekarang',
            cancelButtonText: 'Batal, Simpan Data',
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            allowOutsideClick: false,
            allowEscapeKey: false,
            preConfirm: (teks) => {
                if (teks !== 'HAPUS SEMUA DATA') {
                    Swal.showValidationMessage('Teks konfirmasi tidak cocok! Ketik persis: <strong>HAPUS SEMUA DATA</strong>');
                    return false;
                }
                return teks;
            },
            customClass: {
                popup: 'rounded-3xl shadow-2xl',
                confirmButton: 'rounded-xl font-bold px-5 py-2.5',
                cancelButton: 'rounded-xl font-bold px-5 py-2.5',
            }
        });

        if (!step2.isConfirmed) return;

        // ═══ STEP 3: Kirim request DELETE ke server ═══
        setSedangMemproses(true);

        Swal.fire({
            title: 'Sedang Menghapus Data...',
            html: '<p style="color:#6b7280;font-size:0.85rem;">Mohon tunggu, proses penghapusan sedang berjalan.</p>',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => Swal.showLoading(),
        });

        router.delete(urlProsesHapus, {
            data: { konfirmasi: 'HAPUS SEMUA DATA' },
            onSuccess: () => {
                Swal.fire({
                    title: '✅ Data Berhasil Dihapus',
                    text: 'Seluruh data telah dihapus. Sistem kini dalam kondisi bersih.',
                    icon: 'success',
                    confirmButtonText: 'Baik',
                    confirmButtonColor: '#10b981',
                    customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5' }
                });
                setSedangMemproses(false);
            },
            onError: (errors) => {
                Swal.fire({
                    title: 'Gagal!',
                    text: errors.hapus || 'Terjadi kesalahan saat menghapus data.',
                    icon: 'error',
                    confirmButtonText: 'Tutup',
                    confirmButtonColor: '#ef4444',
                    customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5' }
                });
                setSedangMemproses(false);
            },
        });
    };

    const kartuRingkasan = [
        { ikon: 'group', label: 'Pengguna Terdampak', nilai: ringkasan.pengguna_terdampak, warna: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/30' },
        { ikon: 'meeting_room', label: 'Kelas', nilai: ringkasan.kelas, warna: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30 border-orange-100 dark:border-orange-900/30' },
        { ikon: 'calendar_month', label: 'Tahun Pelajaran', nilai: ringkasan.tahun_pelajaran, warna: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/30' },
        { ikon: 'admin_panel_settings', label: 'Akun Aman (tidak dihapus)', nilai: ringkasan.pengguna_aman, warna: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/30' },
    ];

    return (
        <>
            <Head title="Hapus Data Keseluruhan" />

            <div className="max-w-4xl mx-auto space-y-8">

                {/* ─── Header Bahaya ─── */}
                <div className="bg-gradient-to-r from-red-600 to-rose-700 rounded-3xl p-6 lg:p-8 text-white shadow-2xl shadow-red-500/20 relative overflow-hidden">
                    {/* Ornamen */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
                    </div>
                    <div className="relative flex items-start gap-5">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shrink-0 shadow-lg">
                            <span className="material-symbols-rounded text-3xl">delete_sweep</span>
                        </div>
                        <div>
                            <h2 className="text-2xl font-extrabold tracking-tight">Hapus Data Keseluruhan</h2>
                            <p className="mt-2 text-red-100 text-sm leading-relaxed max-w-2xl">
                                Fitur ini akan <strong className="text-white">menghapus permanen</strong> seluruh data pengguna, kelas, dan tahun pelajaran dari sistem. 
                                Tindakan ini <strong className="text-white">tidak dapat dibatalkan</strong>. 
                                Akun Super Admin dan Admin tetap aman.
                            </p>
                        </div>
                    </div>
                </div>

                {/* ─── Grid Ringkasan Data ─── */}
                <div>
                    <h3 className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">Ringkasan Data yang Terdampak</h3>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {kartuRingkasan.map((k, i) => (
                            <div key={i} className={`rounded-2xl p-4 border ${k.bg} space-y-2`}>
                                <span className={`material-symbols-rounded text-2xl ${k.warna}`}>{k.ikon}</span>
                                <p className="text-2xl font-extrabold text-slate-800 dark:text-white">{k.nilai.toLocaleString('id-ID')}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{k.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ─── Alur Prosedur ─── */}
                <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-5">
                    <h3 className="text-base font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <span className="material-symbols-rounded text-xl text-[#0F91FC]">route</span>
                        Prosedur Keamanan Wajib
                    </h3>
                    <div className="space-y-3">
                        {[
                            { no: 1, judul: 'Sistem Menampilkan Peringatan', ket: 'Informasi detail tentang data yang akan dihapus ditampilkan untuk dikonfirmasi.', warna: 'bg-blue-500' },
                            { no: 2, judul: 'Unduh Backup JSON Secara Otomatis', ket: 'File JSON berisi seluruh data akan diunduh ke komputer Anda sebagai cadangan.', warna: 'bg-[#0F91FC]' },
                            { no: 3, judul: 'Konfirmasi dengan Mengetik Teks', ket: 'Anda harus mengetik "HAPUS SEMUA DATA" untuk mengkonfirmasi tindakan ini.', warna: 'bg-orange-500' },
                            { no: 4, judul: 'Data Dihapus Secara Permanen', ket: 'Sistem memproses penghapusan. Akun admin tetap aman dan tidak terpengaruh.', warna: 'bg-red-500' },
                        ].map(item => (
                            <div key={item.no} className="flex items-start gap-4">
                                <div className={`w-7 h-7 ${item.warna} rounded-full flex items-center justify-center text-white text-xs font-extrabold shrink-0 mt-0.5 shadow-lg`}>
                                    {item.no}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{item.judul}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.ket}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ─── Zona Bahaya: Tombol Hapus ─── */}
                <div className="bg-red-50 dark:bg-red-950/20 border-2 border-red-200 dark:border-red-900/50 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-rounded text-2xl text-red-500">warning</span>
                        <h3 className="text-base font-extrabold text-red-700 dark:text-red-400">Zona Bahaya</h3>
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-300 leading-relaxed">
                        Dengan menekan tombol di bawah, Anda memulai prosedur penghapusan data yang <strong>tidak dapat dikembalikan</strong>.
                        Pastikan Anda sudah memiliki cadangan data sebelum melanjutkan.
                    </p>
                    <button
                        onClick={mulaiArahHapus}
                        disabled={sedangMemproses}
                        className="flex items-center gap-3 px-6 py-3.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold rounded-2xl transition-all shadow-lg shadow-red-500/30 hover:shadow-red-500/50 hover:-translate-y-0.5 active:translate-y-0 text-sm"
                    >
                        <span className="material-symbols-rounded text-xl">
                            {sedangMemproses ? 'hourglass_top' : 'delete_forever'}
                        </span>
                        {sedangMemproses ? 'Memproses...' : 'Mulai Prosedur Hapus Data'}
                    </button>
                </div>

            </div>
        </>
    );
}

IndeksHapusData.layout = page => (
    <TataLetakUtama children={page} title="Hapus Data Keseluruhan" />
);
