import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import TataLetakUtama from '@/Layouts/TataLetakUtama';
import axios from 'axios';
import Swal from 'sweetalert2';

export default function ServerDown({ aplikasiInfo }) {
    const [sedangPing, setSedangPing] = useState(false);
    const [infoStatus, setInfoStatus] = useState(aplikasiInfo || {});

    // Uji ulang koneksi ke server aplikasi
    const ujiUlangKoneksi = () => {
        setSedangPing(true);
        const storedLat = sessionStorage.getItem('sso_user_lat');
        const storedLng = sessionStorage.getItem('sso_user_lng');

        axios.post(route('aplikasi.ping'), {
            app_id: infoStatus.id || infoStatus.app_id,
            latitude: storedLat ? parseFloat(storedLat) : null,
            longitude: storedLng ? parseFloat(storedLng) : null,
        })
        .then((res) => {
            if (res.data.online) {
                Swal.fire({
                    icon: 'success',
                    title: 'Server Sudah Online! 🟢',
                    text: `Server aplikasi ${res.data.nama_aplikasi} telah merespon (200 OK). Mengalihkan Anda...`,
                    timer: 2000,
                    showConfirmButton: false,
                }).then(() => {
                    if (res.data.open_in_new_tab) {
                        window.open(res.data.target_url, '_blank');
                        window.location.href = route('dasbor');
                    } else {
                        window.location.href = res.data.target_url;
                    }
                });
            } else {
                setInfoStatus((prev) => ({
                    ...prev,
                    status_code: res.data.status_code || 502,
                    response_time_ms: res.data.response_time_ms || 0,
                    pesan: res.data.pesan,
                }));

                Swal.fire({
                    icon: 'error',
                    title: 'Server Masih Offline 🔴',
                    text: `Server aplikasi ${infoStatus.nama_aplikasi} belum merespon. Silakan coba beberapa saat lagi.`,
                    confirmButtonColor: '#0F91FC',
                    customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5' }
                });
            }
        })
        .catch(() => {
            Swal.fire({
                icon: 'error',
                title: 'Koneksi Gagal',
                text: 'Tidak dapat menghubungi server portal SSO.',
                confirmButtonColor: '#0F91FC',
                customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5' }
            });
        })
        .finally(() => {
            setSedangPing(false);
        });
    };

    // Buka paksa aplikasi meskipun server offline
    const bukaPaksa = () => {
        Swal.fire({
            title: '⚠️ Peringatan Akses Paksa',
            text: `Server aplikasi ${infoStatus.nama_aplikasi} terdeteksi offline/down. Apakah Anda yakin ingin tetap membuka URL aplikasi secara langsung?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#0F91FC',
            cancelButtonColor: '#64748b',
            confirmButtonText: 'Ya, Tetap Buka',
            cancelButtonText: 'Batal',
            customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5', cancelButton: 'rounded-xl font-bold px-5 py-2.5' }
        }).then((result) => {
            if (result.isConfirmed) {
                const targetUrl = infoStatus.target_url || infoStatus.portal_url;
                if (infoStatus.open_in_new_tab) {
                    window.open(targetUrl, '_blank', 'noopener,noreferrer');
                } else {
                    window.location.href = targetUrl;
                }
            }
        });
    };

    const hostDomain = infoStatus.portal_url 
        ? new URL(infoStatus.portal_url).hostname 
        : 'server-tujuan';

    return (
        <>
            <Head title={`Server Down - ${infoStatus.nama_aplikasi || 'Aplikasi Offline'}`} />

            <div className="w-full max-w-4xl mx-auto py-6 space-y-6">
                
                {/* Cloudflare Style Container */}
                <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-3xl p-6 sm:p-10 border border-red-200/80 dark:border-red-900/50 shadow-2xl space-y-8">
                    
                    {/* Header Peringatan Cloudflare Style */}
                    <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 border-b border-slate-100 dark:border-slate-700/60 pb-6 text-center sm:text-left">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/10">
                                <span className="material-symbols-rounded text-4xl">cloud_off</span>
                            </div>
                            <div>
                                <span className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 text-xs font-black uppercase tracking-widest inline-block mb-1">
                                    Error {infoStatus.status_code || 502} &bull; Bad Gateway / Host Offline
                                </span>
                                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-white leading-tight">
                                    Server {infoStatus.nama_aplikasi || 'Aplikasi'} Tidak Merespon
                                </h1>
                            </div>
                        </div>
                        <span className="text-xs text-slate-400 dark:text-slate-500 font-mono shrink-0">
                            Cloudflare Health Check Protocol
                        </span>
                    </div>

                    {/* Visual Grafis Diagram Koneksi 3 Node (Cloudflare Style) */}
                    <div className="bg-slate-50 dark:bg-slate-900/80 rounded-2xl p-6 border border-slate-200/70 dark:border-slate-700/70 shadow-inner">
                        <h3 className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest text-center mb-6">
                            Status Alur Koneksi Jaringan (Network Hop Graph)
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center text-center">
                            
                            {/* Node 1: Browser Pengguna */}
                            <div className="flex flex-col items-center space-y-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-emerald-900/50 shadow-sm">
                                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                    <span className="material-symbols-rounded text-2xl">laptop_chromebook</span>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-800 dark:text-white">Browser Anda</h4>
                                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                                        Bekerja (200 OK)
                                    </span>
                                </div>
                            </div>

                            {/* Node 2: Portal SSO Sekolah */}
                            <div className="flex flex-col items-center space-y-2 p-3 bg-white dark:bg-slate-800 rounded-xl border border-emerald-200 dark:border-emerald-900/50 shadow-sm">
                                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                    <span className="material-symbols-rounded text-2xl">verified_user</span>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-slate-800 dark:text-white">Portal SSO Sekolah</h4>
                                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block"></span>
                                        Aktif (200 OK)
                                    </span>
                                </div>
                            </div>

                            {/* Node 3: Server Aplikasi Tujuan (OFFLINE) */}
                            <div className="flex flex-col items-center space-y-2 p-3 bg-red-50 dark:bg-red-950/40 rounded-xl border border-red-300 dark:border-red-800/80 shadow-sm animate-pulse">
                                <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center">
                                    <span className="material-symbols-rounded text-2xl">dns</span>
                                </div>
                                <div>
                                    <h4 className="text-xs font-bold text-red-700 dark:text-red-300 truncate max-w-[150px]">
                                        {infoStatus.nama_aplikasi || 'Server Aplikasi'}
                                    </h4>
                                    <span className="text-[11px] font-extrabold text-red-600 dark:text-red-400 flex items-center justify-center gap-1">
                                        <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
                                        Host Error / Offline
                                    </span>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Informasi Rincian Diagnosa Diagnostik */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <span className="material-symbols-rounded text-lg text-amber-500">troubleshoot</span>
                            Diagnosa & Informasi Teknis Kendala
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
                                <span className="text-slate-400 block mb-0.5 font-medium">Aplikasi Tujuan:</span>
                                <span className="font-extrabold text-slate-700 dark:text-slate-200">{infoStatus.nama_aplikasi || '-'}</span>
                            </div>
                            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
                                <span className="text-slate-400 block mb-0.5 font-medium">Domain Server Host:</span>
                                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{hostDomain}</span>
                            </div>
                            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
                                <span className="text-slate-400 block mb-0.5 font-medium">Kode Respon HTTP:</span>
                                <span className="font-extrabold text-red-600 dark:text-red-400">HTTP {infoStatus.status_code || 502} (Bad Gateway / Timeout)</span>
                            </div>
                            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700/60">
                                <span className="text-slate-400 block mb-0.5 font-medium">Waktu Respon Latensi:</span>
                                <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{infoStatus.response_time_ms || 4000} ms (Connection Timeout)</span>
                            </div>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-2">
                            Portal SSO telah melakukan pengujian kesehatan jaringan (*Health Check Ping*) ke server aplikasi tujuan. Namun, server aplikasi tidak memberikan balasan HTTP 200 OK dalam batas waktu yang ditentukan. Kemungkinan server aplikasi tersebut sedang dalam pemeliharaan rutin (*maintenance*), kendala jaringan internal, atau layanan web server mati.
                        </p>
                    </div>

                    {/* Tombol Aksi Kontrol */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-700/60">
                        <Link
                            href={route('dasbor')}
                            className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700/50 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-rounded text-base">arrow_back</span>
                            Kembali ke Dasbor Katalog
                        </Link>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={bukaPaksa}
                                className="px-4 py-2.5 rounded-xl border border-amber-300 dark:border-amber-700/60 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-bold hover:bg-amber-100 transition-all flex items-center gap-1.5"
                            >
                                <span className="material-symbols-rounded text-base">warning</span>
                                Buka Paksa URL
                            </button>

                            <button
                                type="button"
                                onClick={ujiUlangKoneksi}
                                disabled={sedangPing}
                                className="px-5 py-2.5 rounded-xl bg-[#0F91FC] hover:bg-[#0a78d6] text-white text-xs font-extrabold shadow-lg shadow-[#0F91FC]/25 transition-all flex items-center gap-2 disabled:opacity-60 cursor-pointer"
                            >
                                {sedangPing ? (
                                    <>
                                        <span className="material-symbols-rounded text-base animate-spin">progress_activity</span>
                                        Menguji Server...
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-rounded text-base">sync</span>
                                        Uji Ulang Kesehatan Server
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                </div>

            </div>
        </>
    );
}

ServerDown.layout = (page) => <TataLetakUtama children={page} title="Peringatan Server Aplikasi Offline" />;
