import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import TataLetakUtama from '@/Layouts/TataLetakUtama';

/**
 * Halaman Dokumentasi API Kustom (Bukan Swagger Default)
 * 
 * Sesuai dengan spesifikasi dan gambar yang dikirimkan pengguna:
 * - Dilengkapi dengan Daftar Isi (Autentikasi, Base URL, Endpoints, Error Handling, Contoh Implementasi).
 * - Desain premium terintegrasi dengan style aplikasi (glassmorphism/dark mode support).
 * - Dilengkapi dengan Panel Simulasi Interaktif untuk mengetes token API secara real-time.
 */
export default function DokumentasiApi() {
    const [seksiAktif, setSeksiAktif] = useState('autentikasi');
    const [salinStatus, setSalinStatus] = useState({});
    const [simulasiEndpoint, setSimulasiEndpoint] = useState('/api/v1/test');
    const [simulasiApiKey, setSimulasiApiKey] = useState('');
    const [simulasiParams, setSimulasiParams] = useState('');
    const [simulasiLoading, setSimulasiLoading] = useState(false);
    const [simulasiResponse, setSimulasiResponse] = useState(null);
    const [baseUrl, setBaseUrl] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setBaseUrl(window.location.origin + '/api');
        }
    }, []);

    const salinKeClipboard = (teks, key) => {
        navigator.clipboard.writeText(teks).then(() => {
            setSalinStatus(prev => ({ ...prev, [key]: true }));
            setTimeout(() => {
                setSalinStatus(prev => ({ ...prev, [key]: false }));
            }, 2000);
        });
    };

    const jalankanSimulasi = async (e) => {
        e.preventDefault();
        setSimulasiLoading(true);
        setSimulasiResponse(null);

        const headers = {
            'Accept': 'application/json',
        };

        if (simulasiApiKey) {
            headers['X-API-Key'] = simulasiApiKey;
        }

        const url = `${window.location.origin}${simulasiEndpoint}${simulasiParams ? '?' + simulasiParams : ''}`;

        try {
            const res = await fetch(url, { method: 'GET', headers });
            const data = await res.json();
            setSimulasiResponse({
                status: `${res.status} ${res.statusText}`,
                headers: Object.fromEntries(res.headers.entries()),
                body: data
            });
        } catch (err) {
            setSimulasiResponse({
                status: 'Error',
                body: { pesan: 'Gagal menghubungi server. Hubungkan server lokal atau periksa CORS.', detail: err.message }
            });
        } finally {
            setSimulasiLoading(false);
        }
    };

    const menuDaftarIsi = [
        { id: 'autentikasi', label: '1. Autentikasi', ikon: 'lock' },
        { id: 'base-url', label: '2. Base URL', ikon: 'link' },
        { id: 'endpoints', label: '3. Endpoints', ikon: 'code' },
        { id: 'error-handling', label: '4. Error Handling', ikon: 'info' },
        { id: 'contoh-implementasi', label: '5. Contoh Implementasi', ikon: 'terminal' },
        { id: 'simulasi-api', label: 'Simulasi API (Live)', ikon: 'play_circle' },
    ];

    const scrollKeSeksi = (id) => {
        setSeksiAktif(id);
        const elemen = document.getElementById(id);
        if (elemen) {
            elemen.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <>
            <Head title="Dokumentasi API - SSO Sekolah" />

            <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* Left Side: Daftar Isi */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6 bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-5 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-4">
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3">
                            Daftar Isi
                        </h3>
                        <nav className="space-y-1">
                            {menuDaftarIsi.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => scrollKeSeksi(item.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all ${
                                        seksiAktif === item.id
                                            ? 'bg-[#0F91FC]/10 text-[#0F91FC] dark:bg-[#0F91FC]/20 dark:text-sky-400'
                                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700/30'
                                    }`}
                                >
                                    <span className="material-symbols-rounded text-lg shrink-0">{item.ikon}</span>
                                    <span className="truncate">{item.label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* Right Side: Documentation Contents */}
                <div className="lg:col-span-3 space-y-8 pb-20">

                    {/* Section 1: Autentikasi */}
                    <section id="autentikasi" className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700/50 pb-4">
                            <div className="w-8 h-8 rounded-lg bg-[#0F91FC]/10 dark:bg-[#0F91FC]/20 flex items-center justify-center text-[#0F91FC] font-extrabold text-sm">
                                1
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Autentikasi</h2>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            Setiap request ke API harus menyertakan **API Key** melalui HTTP header. API key didapatkan dari admin panel SSO di menu **Kunci API**.
                        </p>

                        {/* Headers Table */}
                        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-700/50">
                            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                                <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 font-bold border-b border-slate-100 dark:border-slate-700/50">
                                    <tr>
                                        <th className="px-6 py-3">Header</th>
                                        <th className="px-6 py-3">Tipe</th>
                                        <th className="px-6 py-3">Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    <tr>
                                        <td className="px-6 py-4 font-mono font-bold text-xs text-[#0F91FC] dark:text-sky-400">X-API-Key</td>
                                        <td className="px-6 py-4 text-xs font-semibold">string</td>
                                        <td className="px-6 py-4 text-xs text-red-500 dark:text-red-400 font-bold">Wajib. API Key yang diperoleh dari panel manajemen kunci.</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 font-mono text-xs text-slate-400">Authorization</td>
                                        <td className="px-6 py-4 text-xs font-semibold text-slate-400">string</td>
                                        <td className="px-6 py-4 text-xs text-slate-400">Alternatif. format <code className="font-mono bg-slate-100 dark:bg-slate-900 px-1 rounded">Bearer &lt;token&gt;</code>.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Domain Verification */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Verifikasi Domain</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                Selain memvalidasi API key, sistem juga memverifikasi **domain pengirim request** melalui header `Origin` atau `Referer`. Domain pengirim harus cocok dengan domain yang Anda daftarkan saat men-generate API key di panel admin.
                            </p>
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2.5">
                                <span className="material-symbols-rounded text-lg text-amber-500 shrink-0 mt-0.5">lightbulb</span>
                                <span><b>Tips:</b> Untuk request server-to-server (backend), domain dicocokkan dengan domain terdaftar. Gunakan domain wildcard <code className="font-mono bg-amber-100 dark:bg-amber-900/40 px-1 rounded font-bold">*</code> saat development untuk menonaktifkan verifikasi domain.</span>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Base URL */}
                    <section id="base-url" className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700/50 pb-4">
                            <div className="w-8 h-8 rounded-lg bg-[#0F91FC]/10 dark:bg-[#0F91FC]/20 flex items-center justify-center text-[#0F91FC] font-extrabold text-sm">
                                2
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Base URL</h2>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            Seluruh endpoint API dapat diakses melalui base URL produksi berikut:
                        </p>

                        <div className="relative">
                            <pre className="bg-slate-900 text-sky-400 font-mono text-sm px-5 py-4 rounded-2xl border border-slate-700 pr-16 select-all overflow-x-auto">
                                {baseUrl}/v1
                            </pre>
                            <button
                                onClick={() => salinKeClipboard(`${baseUrl}/v1`, 'baseurl')}
                                className={`absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                    salinStatus['baseurl']
                                        ? 'bg-emerald-500 text-white'
                                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                }`}
                            >
                                {salinStatus['baseurl'] ? 'Disalin ✓' : 'Salin'}
                            </button>
                        </div>
                    </section>

                    {/* Section 3: Endpoints */}
                    <section id="endpoints" className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-8">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700/50 pb-4">
                            <div className="w-8 h-8 rounded-lg bg-[#0F91FC]/10 dark:bg-[#0F91FC]/20 flex items-center justify-center text-[#0F91FC] font-extrabold text-sm">
                                3
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Endpoints</h2>
                        </div>

                        {/* Endpoint 1: Test Koneksi */}
                        <div className="space-y-4 border-b border-slate-100 dark:border-slate-700/50 pb-6">
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-mono text-xs font-extrabold px-2.5 py-1 rounded-md">GET</span>
                                <code className="font-mono text-sm font-bold text-slate-700 dark:text-slate-200">/api/v1/test</code>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                Endpoint sederhana untuk mengetes koneksi API dan memastikan API key + verifikasi domain sudah benar. Cocok dipakai sebagai health-check oleh aplikasi pendukung.
                            </p>

                            {/* Request Code Block */}
                            <div className="space-y-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Contoh Request (cURL)</span>
                                <div className="relative">
                                    <pre className="bg-slate-900 text-slate-300 font-mono text-xs px-5 py-4 rounded-2xl border border-slate-700 overflow-x-auto pr-16 leading-relaxed">
{`curl -X GET "${baseUrl}/v1/test" \\
  -H "X-API-Key: YOUR_API_KEY_HERE"`}
                                    </pre>
                                    <button
                                        onClick={() => salinKeClipboard(`curl -X GET "${baseUrl}/v1/test" -H "X-API-Key: YOUR_API_KEY_HERE"`, 'curltest')}
                                        className="absolute right-3 top-3 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 rounded-md transition-all"
                                    >
                                        {salinStatus['curltest'] ? '✓' : 'Copy'}
                                    </button>
                                </div>
                            </div>

                            {/* Response Code Block */}
                            <div className="space-y-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Contoh Response (200 OK)</span>
                                <pre className="bg-slate-900 text-slate-300 font-mono text-xs px-5 py-4 rounded-2xl border border-slate-700 overflow-x-auto leading-relaxed">
{`{
  "success": true,
  "data": {
    "status": "ok",
    "server_time": "2026-07-13T09:40:12+07:00"
  },
  "meta": {
    "app_name": "CBT Exam System",
    "request_domain": "cbt.sekolah.sch.id",
    "request_domain_source": "origin",
    "origin": "https://cbt.sekolah.sch.id",
    "referer": null,
    "ip": "203.0.113.10"
  }
}`}
                                </pre>
                            </div>
                        </div>

                        {/* Endpoint 2: Daftar Members */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 flex-wrap">
                                <span className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 font-mono text-xs font-extrabold px-2.5 py-1 rounded-md">GET</span>
                                <code className="font-mono text-sm font-bold text-slate-700 dark:text-slate-200">/api/v1/members</code>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                Mengambil seluruh data member yang terdaftar di database SSO.
                            </p>

                            {/* Parameters Table */}
                            <div className="space-y-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Query Parameters (Opsional)</span>
                                <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                    <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-700/50 font-bold uppercase tracking-wider">
                                            <tr>
                                                <th className="px-4 py-3">Parameter</th>
                                                <th className="px-4 py-3">Tipe</th>
                                                <th className="px-4 py-3">Default</th>
                                                <th className="px-4 py-3">Keterangan</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                            <tr>
                                                <td className="px-4 py-3 font-mono font-bold text-[#0F91FC]">search</td>
                                                <td className="px-4 py-3">string</td>
                                                <td className="px-4 py-3">—</td>
                                                <td className="px-4 py-3 text-slate-500">Cari berdasarkan nama lengkap, NIK, NISN, NIS, NIP, atau email.</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 font-mono font-bold text-[#0F91FC]">email</td>
                                                <td className="px-4 py-3">string</td>
                                                <td className="px-4 py-3">—</td>
                                                <td className="px-4 py-3 text-slate-500">Cari spesifik berdasarkan Google Email member.</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 font-mono font-bold text-[#0F91FC]">role</td>
                                                <td className="px-4 py-3">string</td>
                                                <td className="px-4 py-3">—</td>
                                                <td className="px-4 py-3 text-slate-500">Filter role sistem (contoh: <code className="bg-slate-100 dark:bg-slate-900 px-1 rounded font-mono font-bold text-violet-500">siswa</code>, <code className="bg-slate-100 dark:bg-slate-900 px-1 rounded font-mono font-bold text-violet-500">guru</code>, <code className="bg-slate-100 dark:bg-slate-900 px-1 rounded font-mono font-bold text-violet-500">tendik</code>, <code className="bg-slate-100 dark:bg-slate-900 px-1 rounded font-mono font-bold text-violet-500">alumni</code>, <code className="bg-slate-100 dark:bg-slate-900 px-1 rounded font-mono font-bold text-violet-500">keluar</code>).</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 font-mono font-bold text-[#0F91FC]">page</td>
                                                <td className="px-4 py-3">integer</td>
                                                <td className="px-4 py-3">1</td>
                                                <td className="px-4 py-3 text-slate-500">Nomor halaman data pagination.</td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 font-mono font-bold text-[#0F91FC]">per_page</td>
                                                <td className="px-4 py-3">integer</td>
                                                <td className="px-4 py-3">50</td>
                                                <td className="px-4 py-3 text-slate-500">Jumlah data per halaman (maksimal 100).</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Request Code Block */}
                            <div className="space-y-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Contoh Request (cURL)</span>
                                <div className="relative">
                                    <pre className="bg-slate-900 text-slate-300 font-mono text-xs px-5 py-4 rounded-2xl border border-slate-700 overflow-x-auto pr-16 leading-relaxed">
{`curl -X GET "${baseUrl}/v1/members?role=siswa&page=1&per_page=10" \\
  -H "X-API-Key: YOUR_API_KEY_HERE"`}
                                    </pre>
                                    <button
                                        onClick={() => salinKeClipboard(`curl -X GET "${baseUrl}/v1/members?role=siswa&page=1&per_page=10" -H "X-API-Key: YOUR_API_KEY_HERE"`, 'curlmembers')}
                                        className="absolute right-3 top-3 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 rounded-md transition-all"
                                    >
                                        {salinStatus['curlmembers'] ? '✓' : 'Copy'}
                                    </button>
                                </div>
                            </div>

                            {/* Response Code Block */}
                            <div className="space-y-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Contoh Response (200 OK)</span>
                                <pre className="bg-slate-900 text-slate-300 font-mono text-xs px-5 py-4 rounded-2xl border border-slate-700 overflow-x-auto leading-relaxed">
{`{
  "success": true,
  "data": [
    {
      "id": "998df9a8-e123-4567-8910-abcdef123456",
      "nama_lengkap": "Nafi' Mukhtar",
      "email": "nafi@smage.sch.id",
      "nik": "3515012345670001",
      "nip_nis": "12345",
      "jk": "L",
      "no_telp": "081234567890",
      "tgl_lahir": "2008-05-12",
      "is_active": true,
      "claimed_at": "2026-07-11T12:00:00Z",
      "created_at": "2026-07-11T10:00:00Z",
      "updated_at": "2026-07-12T15:30:00Z",
      "roles": [
        {
          "id": "1",
          "nama_role": "Siswa"
        }
      ]
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "per_page": 10,
    "last_page": 1
  }
}`}
                                </pre>
                            </div>
                            
                            <div className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-700/50 rounded-xl text-xs text-slate-500 leading-relaxed">
                                <b>Catatan Role keluar:</b> Dipakai untuk siswa mutasi/keluar (non-aktif). Data masih bisa diakses via API, namun user tidak dapat login/claim akun sampai admin mengembalikan role menjadi siswa.
                            </div>
                        </div>
                    </section>

                    {/* Section 4: Error Handling */}
                    <section id="error-handling" className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700/50 pb-4">
                            <div className="w-8 h-8 rounded-lg bg-[#0F91FC]/10 dark:bg-[#0F91FC]/20 flex items-center justify-center text-[#0F91FC] font-extrabold text-sm">
                                4
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Error Handling</h2>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            API menggunakan format status code HTTP standar untuk mengindikasikan keberhasilan atau kegagalan request.
                        </p>

                        <div className="space-y-4">
                            <div className="flex gap-4 items-start">
                                <span className="bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 font-bold px-2 py-1 rounded text-xs w-16 text-center font-mono">401</span>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Unauthorized</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Header Kunci API (`X-API-Key` atau `Authorization`) tidak disertakan, format tidak valid, atau nilai token tidak cocok dengan data di database.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <span className="bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 font-bold px-2 py-1 rounded text-xs w-16 text-center font-mono">403</span>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Forbidden</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Domain pengirim (dideteksi dari header `Origin` atau `Referer`) tidak sesuai dengan domain terdaftar pada kunci API tersebut, atau kunci API dinonaktifkan oleh administrator.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start">
                                <span className="bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 font-bold px-2 py-1 rounded text-xs w-16 text-center font-mono">404</span>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Not Found</h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Resource yang diminta (misal: detail member berdasarkan ID) tidak ditemukan di database.</p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 5: Contoh Implementasi */}
                    <section id="contoh-implementasi" className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-6">
                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700/50 pb-4">
                            <div className="w-8 h-8 rounded-lg bg-[#0F91FC]/10 dark:bg-[#0F91FC]/20 flex items-center justify-center text-[#0F91FC] font-extrabold text-sm">
                                5
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Contoh Implementasi</h2>
                        </div>

                        {/* PHP Example */}
                        <div className="space-y-2">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 block">Klien S2S (PHP - cURL)</span>
                            <pre className="bg-slate-900 text-emerald-400 font-mono text-xs px-5 py-4 rounded-2xl border border-slate-700 overflow-x-auto leading-relaxed">
{`<?php

$apiKey = 'YOUR_API_KEY_HERE';
$url = '${baseUrl}/v1/members?role=siswa';

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'X-API-Key: ' . $apiKey,
    'Accept: application/json'
]);

$response = curl_exec($ch);
$statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($statusCode === 200) {
    $data = json_decode($response, true);
    print_r($data['data']); // array daftar siswa
} else {
    echo "Gagal menarik data. Status: " . $statusCode;
}`}
                            </pre>
                        </div>
                    </section>

                    {/* Section 6: Simulasi API (Live Panel) */}
                    <section id="simulasi-api" className="bg-gradient-to-br from-[#081242] to-[#030947] text-white rounded-3xl p-6 lg:p-8 shadow-xl shadow-slate-900/10 space-y-6">
                        <div className="border-b border-white/10 pb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <span className="material-symbols-rounded text-sky-400">play_circle</span>
                                Simulasi API Terintegrasi
                            </h2>
                            <p className="text-xs text-slate-300 mt-1">Tes fungsionalitas dan domain verifikasi langsung dari browser Anda.</p>
                        </div>

                        <form onSubmit={jalankanSimulasi} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-1.5">
                                        API Key Anda
                                    </label>
                                    <input
                                        type="text"
                                        value={simulasiApiKey}
                                        onChange={e => setSimulasiApiKey(e.target.value)}
                                        placeholder="Ketik atau tempel kunci API Anda"
                                        className="w-full bg-slate-950/50 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#0F91FC] font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-1.5">
                                        Endpoint
                                    </label>
                                    <select
                                        value={simulasiEndpoint}
                                        onChange={e => setSimulasiEndpoint(e.target.value)}
                                        className="w-full bg-slate-950/50 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#0F91FC]"
                                    >
                                        <option value="/api/v1/test">GET /api/v1/test (Koneksi)</option>
                                        <option value="/api/v1/members">GET /api/v1/members (Semua Member)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-1.5">
                                        Query Params <span className="text-slate-400 font-normal">(Opsional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={simulasiParams}
                                        onChange={e => setSimulasiParams(e.target.value)}
                                        placeholder="Contoh: role=siswa&per_page=5"
                                        className="w-full bg-slate-950/50 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#0F91FC] font-mono"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={simulasiLoading}
                                    className="w-full py-2.5 bg-[#0F91FC] hover:bg-[#0a78d6] disabled:opacity-50 text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#0F91FC]/20 flex items-center justify-center gap-2"
                                >
                                    <span className="material-symbols-rounded text-sm">send</span>
                                    {simulasiLoading ? 'Mengirim...' : 'Kirim Request'}
                                </button>
                            </div>

                            {/* Response simulation results */}
                            <div className="space-y-2">
                                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest block">Response Output</span>
                                <div className="bg-slate-950/60 rounded-2xl border border-white/10 p-4 min-h-[180px] max-h-[300px] overflow-y-auto font-mono text-xs text-emerald-400">
                                    {simulasiResponse ? (
                                        <div className="space-y-3">
                                            <div>
                                                <span className="text-slate-400 block">// Status Code</span>
                                                <span className={simulasiResponse.status.startsWith('200') ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                                    {simulasiResponse.status}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-slate-400 block">// Response Body</span>
                                                <pre className="text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                                                    {JSON.stringify(simulasiResponse.body, null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-slate-500 italic block mt-10 text-center">Response akan muncul di sini setelah Anda mengklik Kirim Request.</span>
                                    )}
                                </div>
                            </div>
                        </form>
                    </section>
                </div>
            </div>
        </>
    );
}

DokumentasiApi.layout = page => <TataLetakUtama children={page} title="Dokumentasi API & Integrasi SSO" />;
