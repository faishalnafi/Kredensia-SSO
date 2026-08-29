import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import TataLetakUtama from '@/Layouts/TataLetakUtama';
import Swal from 'sweetalert2';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function LogAktivitas({ daftarLog = { data: [], links: [] }, daftarArsip = [], filters }) {
    const [cari, setCari] = useState(filters.cari || '');
    const [modalArsipBuka, setModalArsipBuka] = useState(false);
    const [logPeta, setLogPeta] = useState(null);

    const mapContainerRef = useRef(null);
    const mapInstanceRef = useRef(null);

    // Inisialisasi peta Leaflet saat modal lokasi dibuka
    useEffect(() => {
        if (logPeta && mapContainerRef.current) {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }

            const lat = parseFloat(logPeta.latitude);
            const lng = parseFloat(logPeta.longitude);

            if (!isNaN(lat) && !isNaN(lng)) {
                const map = L.map(mapContainerRef.current).setView([lat, lng], 15);
                mapInstanceRef.current = map;

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    maxZoom: 19,
                    attribution: '© OpenStreetMap'
                }).addTo(map);

                const markerIcon = L.divIcon({
                    className: 'custom-leaflet-marker',
                    html: `<div style="background-color:#ef4444; width:30px; height:30px; border-radius:50%; border:3px solid white; box-shadow:0 4px 10px rgba(0,0,0,0.3); display:flex; align-items:center; justify-content:center; color:white;">
                             <span class="material-symbols-rounded" style="font-size:16px;">location_on</span>
                           </div>`,
                    iconSize: [30, 30],
                    iconAnchor: [15, 30],
                    popupAnchor: [0, -30]
                });

                const namaUser = logPeta.user ? logPeta.user.nama_lengkap : 'Tamu / Umum';
                L.marker([lat, lng], { icon: markerIcon })
                    .addTo(map)
                    .bindPopup(`<b>${namaUser}</b><br/>${logPeta.aktivitas}<br/><span style="font-size:11px; color:#64748b;">${lat.toFixed(5)}, ${lng.toFixed(5)}</span>`)
                    .openPopup();

                setTimeout(() => {
                    map.invalidateSize();
                }, 250);
            }
        }
    }, [logPeta]);

    const pathPrefix = window.location.pathname.startsWith('/superadmin') ? 'superadmin' : 'admin';

    const tanganiCari = (e) => {
        e.preventDefault();
        router.get(route(route().current()), { cari }, {
            preserveState: true,
            replace: true
        });
    };

    const tanganiArsipManual = async () => {
        if (!daftarLog.total || daftarLog.total === 0) {
            Swal.fire({
                title: 'Tabel Kosong',
                text: 'Tidak ada entri log di database yang perlu diarsipkan.',
                icon: 'info',
                confirmButtonColor: '#0F91FC',
                customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5' }
            });
            return;
        }

        const res = await Swal.fire({
            title: 'Arsipkan & Bersihkan Log?',
            html: `Seluruh <strong>${daftarLog.total} entri log</strong> saat ini akan diekspor ke berkas <strong>JSON</strong> di server dan tabel database akan dibersihkan.`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: '📦 Ya, Arsipkan Sekarang',
            cancelButtonText: 'Batal',
            confirmButtonColor: '#0F91FC',
            cancelButtonColor: '#6b7280',
            customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5', cancelButton: 'rounded-xl font-bold px-5 py-2.5' }
        });

        if (res.isConfirmed) {
            router.post(route(`${pathPrefix}.log.arsip`), {}, {
                preserveScroll: true,
                onSuccess: () => {
                    setModalArsipBuka(false);
                }
            });
        }
    };

    // Helper untuk format jenis badge aktivitas
    const dapatkanWarnaBadge = (aktivitas) => {
        const text = aktivitas.toLowerCase();
        if (text.includes('gagal') || text.includes('ditolak')) {
            return 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 border border-red-200/60 dark:border-red-800/40';
        }
        if (text.includes('google')) {
            return 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-400 border border-sky-200/60 dark:border-sky-800/40';
        }
        if (text.includes('membuka aplikasi') || text.includes('otentikasi sso') || text.includes('akses')) {
            return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/40';
        }
        if (text.includes('mendaftarkan') || text.includes('tambah') || text.includes('sukses')) {
            return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40';
        }
        if (text.includes('perbarui') || text.includes('ubah') || text.includes('regenerate') || text.includes('koreksi')) {
            return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40';
        }
        if (text.includes('hapus') || text.includes('mengakhiri') || text.includes('logout')) {
            return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40';
        }
        return 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60';
    };

    // Helper formatting waktu
    const formatWaktu = (dateString) => {
        if (!dateString) return '-';
        let dateVal = dateString;
        if (typeof dateString === 'string' && !dateString.includes('T') && !dateString.endsWith('Z')) {
            dateVal = dateString.replace(' ', 'T');
        }
        const d = new Date(dateVal);
        if (isNaN(d.getTime())) return String(dateString);
        return d.toLocaleString('id-ID', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    };

    return (
        <>
            <Head title="Log Aktivitas - SSO Sekolah" />
            
            <div className="w-full max-w-6xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white">Audit Trail</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">Pencatatan real-time. Otomatis diarsipkan ke berkas JSON & dibersihkan setiap tanggal 1 bulan baru.</p>
                    </div>
                    
                    {/* Management Action Buttons */}
                    <div className="flex items-center gap-2.5 shrink-0">
                        {/* Tombol Buka Modal Arsip JSON */}
                        <button
                            onClick={() => setModalArsipBuka(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md shadow-emerald-600/10 flex items-center gap-2"
                        >
                            <span className="material-symbols-rounded text-lg">folder_zip</span>
                            Unduh Log Bulanan ({daftarArsip.length})
                        </button>

                        {/* Tombol Manual Archive */}
                        <button
                            onClick={tanganiArsipManual}
                            className="bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-md flex items-center gap-2"
                            title="Ekspor log aktif ke JSON & bersihkan tabel database"
                        >
                            <span className="material-symbols-rounded text-lg">archive</span>
                            Arsipkan Sekarang
                        </button>
                    </div>
                </div>

                {/* Table Area */}
                <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-4">
                    
                    {/* Internal Table Header Bar (Filter & Search) */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                Daftar Aktivitas Real-time
                            </span>
                            <span className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold px-2.5 py-0.5 rounded-full">
                                {daftarLog.total || 0} Log
                            </span>
                        </div>

                        {/* Form Pencarian */}
                        <form onSubmit={tanganiCari} className="flex gap-2">
                            <div className="relative">
                                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <span className="material-symbols-rounded text-lg">search</span>
                                </span>
                                <input 
                                    type="text"
                                    placeholder="Cari log atau pengguna..."
                                    value={cari}
                                    onChange={e => setCari(e.target.value)}
                                    className="pl-10 pr-4 py-2 w-64 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-[#0F91FC] dark:text-white transition-all"
                                />
                            </div>
                            <button 
                                type="submit"
                                className="bg-[#0F91FC] hover:bg-[#0a78d6] text-white px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-md shadow-[#0F91FC]/10"
                            >
                                Cari
                            </button>
                        </form>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-700/50">
                        <table className="w-full text-left text-sm">
                            <thead className="text-xs text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700/50">
                                <tr>
                                    <th className="px-5 py-4 font-bold min-w-[140px]">Waktu</th>
                                    <th className="px-5 py-4 font-bold min-w-[180px]">Nama / Surel</th>
                                    <th className="px-5 py-4 font-bold min-w-[240px]">Aktivitas</th>
                                    <th className="px-5 py-4 font-bold min-w-[130px]">IP Address</th>
                                    <th className="px-5 py-4 font-bold min-w-[160px]">Koordinat GPS</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {daftarLog.data && daftarLog.data.length > 0 ? (
                                    daftarLog.data.map((log) => (
                                        <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                                            <td className="px-5 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs whitespace-nowrap">
                                                {formatWaktu(log.created_at)}
                                            </td>
                                            <td className="px-5 py-4 min-w-[180px]">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-700 dark:text-slate-200">
                                                        {log.user ? log.user.nama_lengkap : 'Tamu / Umum'}
                                                    </span>
                                                    <span className="text-xs text-slate-400 font-mono mt-0.5">
                                                        {log.email || 'Tidak tercatat'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 min-w-[240px]">
                                                <span className={`inline-block px-3 py-1.5 text-[11px] rounded-xl font-bold uppercase tracking-wider text-wrap break-words whitespace-normal leading-relaxed ${dapatkanWarnaBadge(log.aktivitas)}`}>
                                                    {log.aktivitas}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono text-xs truncate" title={log.user_agent}>
                                                {log.ip_address}
                                            </td>
                                            <td className="px-5 py-4 min-w-[280px]">
                                                 {log.latitude && log.longitude ? (
                                                     <div className="flex items-center gap-1.5 flex-wrap">
                                                         {/* 1. Latitude */}
                                                         <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-mono text-[11px] border border-slate-200 dark:border-slate-700">
                                                             <span className="text-[9px] text-slate-400 font-bold uppercase">Lat:</span>
                                                             <span>{Number(log.latitude).toFixed(5)}</span>
                                                         </span>

                                                         {/* 2. Longitude */}
                                                         <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md font-mono text-[11px] border border-slate-200 dark:border-slate-700">
                                                             <span className="text-[9px] text-slate-400 font-bold uppercase">Lng:</span>
                                                             <span>{Number(log.longitude).toFixed(5)}</span>
                                                         </span>

                                                         {/* 3. Tombol Koordinat Peta Leaflet */}
                                                         <button
                                                             type="button"
                                                             onClick={() => setLogPeta(log)}
                                                             className="inline-flex items-center gap-1 bg-[#0F91FC]/10 hover:bg-[#0F91FC]/20 text-[#0F91FC] border border-[#0F91FC]/30 px-2.5 py-0.5 rounded-md font-bold text-[11px] transition-all cursor-pointer"
                                                             title="Tampilkan peta lokasi interaktif Leaflet"
                                                         >
                                                             <span className="material-symbols-rounded text-xs text-red-500">location_on</span>
                                                             <span>Peta</span>
                                                         </button>
                                                     </div>
                                                 ) : (
                                                     <span className="text-slate-400 font-sans italic text-xs">Tanpa GPS</span>
                                                 )}
                                             </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-12 text-slate-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="material-symbols-rounded text-3xl">history_toggle_off</span>
                                                <span>Tidak ada riwayat log aktivitas yang ditemukan di database.</span>
                                                <span className="text-xs text-slate-400">Log bulan-bulan sebelumnya disimpan dalam arsip JSON.</span>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Info & Pagination Section */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                        <div className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                            {daftarLog.total > 0 ? (
                                <>Menampilkan <span className="font-bold text-slate-700 dark:text-slate-300">{daftarLog.from || 0}</span> - <span className="font-bold text-slate-700 dark:text-slate-300">{daftarLog.to || 0}</span> dari <span className="font-bold text-slate-700 dark:text-slate-300">{daftarLog.total}</span> entri log aktif</>
                            ) : (
                                'Tabel log database kosong'
                            )}
                        </div>

                        {daftarLog.links && daftarLog.links.length > 3 && (
                            <div className="flex flex-wrap gap-1 justify-center">
                                {daftarLog.links.map((link, index) => {
                                    if (link.url === null) {
                                        return (
                                            <span 
                                                key={index} 
                                                className="px-3.5 py-2 text-xs border border-slate-200 dark:border-slate-700/50 rounded-xl text-slate-300 dark:text-slate-600 cursor-not-allowed select-none"
                                                dangerouslySetInnerHTML={{ __html: link.label }}
                                            />
                                        );
                                    }
                                    return (
                                        <Link
                                            key={index}
                                            href={link.url}
                                            className={`px-3.5 py-2 text-xs border rounded-xl transition-all font-semibold ${
                                                link.active 
                                                    ? 'bg-[#0F91FC] border-[#0F91FC] text-white shadow-md shadow-[#0F91FC]/20' 
                                                    : 'border-slate-200 dark:border-slate-700/50 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 bg-white dark:bg-slate-800'
                                            }`}
                                            dangerouslySetInnerHTML={{ __html: link.label }}
                                        />
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Modal Unduh Arsip Bulanan (JSON) */}
            {modalArsipBuka && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl border border-slate-100 dark:border-slate-700/50 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-2xl">
                                    <span className="material-symbols-rounded text-2xl">folder_zip</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Arsip Log Bulanan (JSON)</h3>
                                    <p className="text-xs text-slate-400">Berkas log tersimpan otomatis di folder storage/logs/aktivitas/</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setModalArsipBuka(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <span className="material-symbols-rounded">close</span>
                            </button>
                        </div>

                        <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
                            {daftarArsip && daftarArsip.length > 0 ? (
                                daftarArsip.map((arsip, idx) => (
                                    <div 
                                        key={idx}
                                        className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-100 dark:border-slate-700/50 hover:border-emerald-500/30 transition-all"
                                    >
                                        <div className="flex items-center gap-3 truncate">
                                            <span className="material-symbols-rounded text-emerald-600 text-xl">description</span>
                                            <div className="truncate">
                                                <span className="font-bold text-sm text-slate-700 dark:text-slate-200 block truncate">
                                                    {arsip.label}
                                                </span>
                                                <span className="text-[11px] text-slate-400 font-mono">
                                                    {arsip.nama_file} • {arsip.ukuran} • Dibuat: {arsip.tanggal_dibuat}
                                                </span>
                                            </div>
                                        </div>
                                        <a
                                            href={route(`${pathPrefix}.log.unduh`, arsip.nama_file)}
                                            download
                                            className="bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
                                        >
                                            <span className="material-symbols-rounded text-base">download</span>
                                            Unduh JSON
                                        </a>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-slate-400">
                                    <span className="material-symbols-rounded text-3xl block mb-1">folder_off</span>
                                    <span className="text-sm">Belum ada berkas arsip log JSON. Berkas akan dibuat otomatis setiap tanggal 1 atau dengan tombol "Arsipkan Sekarang".</span>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-700/50">
                            <button
                                onClick={() => setModalArsipBuka(false)}
                                className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Peta Interaktif Leaflet */}
            {logPeta && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl border border-slate-100 dark:border-slate-700/50 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/50 pb-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-red-50 dark:bg-red-950/40 text-red-500 rounded-2xl">
                                    <span className="material-symbols-rounded text-2xl">location_on</span>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Lokasi Terdeteksi (Leaflet Map)</h3>
                                    <p className="text-xs text-slate-400">
                                        {logPeta.user ? logPeta.user.nama_lengkap : 'Tamu / Umum'} • {formatWaktu(logPeta.created_at)}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setLogPeta(null)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <span className="material-symbols-rounded">close</span>
                            </button>
                        </div>

                        {/* Wadah Peta Leaflet */}
                        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700/80 shadow-inner">
                            <div ref={mapContainerRef} className="w-full h-80 z-0"></div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                            <div className="text-xs font-mono text-slate-600 dark:text-slate-300">
                                📍 Lat: <span className="font-bold text-[#0F91FC]">{logPeta.latitude}</span> | Lng: <span className="font-bold text-[#0F91FC]">{logPeta.longitude}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href={`https://www.google.com/maps?q=${logPeta.latitude},${logPeta.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-400 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-blue-200/50 dark:border-blue-800/40"
                                >
                                    <span className="material-symbols-rounded text-sm">open_in_new</span>
                                    Google Maps
                                </a>
                                <button
                                    onClick={() => setLogPeta(null)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                                >
                                    Tutup
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

LogAktivitas.layout = page => <TataLetakUtama children={page} title="Log Aktivitas Sistem (Audit Trail)" />;
