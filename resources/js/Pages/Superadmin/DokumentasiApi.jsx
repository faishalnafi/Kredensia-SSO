import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import TataLetakUtama from '@/Layouts/TataLetakUtama';

/**
 * Halaman Dokumentasi API Kustom — Kredensia SSO
 * Mencakup seluruh endpoint v1: Test, Members, Kelas, Tahun Pelajaran, Peran, Statistik.
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

        const headers = { 'Accept': 'application/json' };
        if (simulasiApiKey) headers['X-API-Key'] = simulasiApiKey;

        const url = `${window.location.origin}${simulasiEndpoint}${simulasiParams ? '?' + simulasiParams : ''}`;

        try {
            const res = await fetch(url, { method: 'GET', headers });
            const data = await res.json();
            setSimulasiResponse({
                status: `${res.status} ${res.statusText}`,
                body: data
            });
        } catch (err) {
            setSimulasiResponse({
                status: 'Error',
                body: { pesan: 'Gagal menghubungi server. Periksa koneksi atau CORS.', detail: err.message }
            });
        } finally {
            setSimulasiLoading(false);
        }
    };

    const menuDaftarIsi = [
        { id: 'autentikasi',         label: '1. Autentikasi',          ikon: 'lock' },
        { id: 'base-url',            label: '2. Base URL',              ikon: 'link' },
        { id: 'ep-test',             label: '3. Test Koneksi',          ikon: 'wifi_tethering' },
        { id: 'ep-members',          label: '4. Members (Pengguna)',     ikon: 'group' },
        { id: 'ep-kelas',            label: '5. Kelas',                 ikon: 'meeting_room' },
        { id: 'ep-tahun-pelajaran',  label: '6. Tahun Pelajaran',       ikon: 'calendar_month' },
        { id: 'ep-peran-statistik',  label: '7. Peran & Statistik',     ikon: 'bar_chart' },
        { id: 'error-handling',      label: '8. Error Handling',        ikon: 'info' },
        { id: 'contoh-implementasi', label: '9. Contoh Implementasi',   ikon: 'terminal' },
        { id: 'simulasi-api',        label: 'Simulasi API (Live)',       ikon: 'play_circle' },
    ];

    const scrollKeSeksi = (id) => {
        setSeksiAktif(id);
        const elemen = document.getElementById(id);
        if (elemen) elemen.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    /* ─── Komponen Badge Method ─── */
    const MethodBadge = ({ method = 'GET' }) => {
        const warna = method === 'GET'
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400';
        return (
            <span className={`font-mono text-xs font-extrabold px-2.5 py-1 rounded-md ${warna}`}>
                {method}
            </span>
        );
    };

    /* ─── Komponen Blok Kode ─── */
    const KodeBlok = ({ judul, kode, salinKey, warna = 'text-slate-300' }) => (
        <div className="space-y-2">
            {judul && <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{judul}</span>}
            <div className="relative">
                <pre className={`bg-slate-900 ${warna} font-mono text-xs px-5 py-4 rounded-2xl border border-slate-700 overflow-x-auto pr-16 leading-relaxed whitespace-pre`}>
                    {kode}
                </pre>
                <button
                    onClick={() => salinKeClipboard(kode, salinKey)}
                    className="absolute right-3 top-3 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 rounded-md transition-all"
                >
                    {salinStatus[salinKey] ? '✓' : 'Copy'}
                </button>
            </div>
        </div>
    );

    /* ─── Komponen Tabel Parameter ─── */
    const TabelParam = ({ params }) => (
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
                    {params.map((p, i) => (
                        <tr key={i}>
                            <td className="px-4 py-3 font-mono font-bold text-[#0F91FC]">{p.name}</td>
                            <td className="px-4 py-3">{p.tipe}</td>
                            <td className="px-4 py-3 text-slate-400">{p.default || '—'}</td>
                            <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{p.ket}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    /* ─── Judul Seksi ─── */
    const JudulSeksi = ({ nomor, judul }) => (
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700/50 pb-4">
            <div className="w-8 h-8 rounded-lg bg-[#0F91FC]/10 dark:bg-[#0F91FC]/20 flex items-center justify-center text-[#0F91FC] font-extrabold text-sm shrink-0">
                {nomor}
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{judul}</h2>
        </div>
    );

    /* ─── Kepala Endpoint ─── */
    const KepalaEndpoint = ({ method, path, deskripsi }) => (
        <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
                <MethodBadge method={method} />
                <code className="font-mono text-sm font-bold text-slate-700 dark:text-slate-200">{path}</code>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{deskripsi}</p>
        </div>
    );

    return (
        <>
            <Head title="Dokumentasi API - Kredensia SSO" />

            <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6">

                {/* ─── Daftar Isi (Kiri) ─── */}
                <div className="lg:col-span-1">
                    <div className="sticky top-6 bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-5 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-4 max-h-[calc(100vh-3rem)] overflow-y-auto">
                        <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3">Daftar Isi</h3>
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
                                    <span className="truncate text-xs">{item.label}</span>
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>

                {/* ─── Konten Utama (Kanan) ─── */}
                <div className="lg:col-span-3 space-y-8 pb-20">

                    {/* ══════════════════ 1. AUTENTIKASI ══════════════════ */}
                    <section id="autentikasi" className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-6">
                        <JudulSeksi nomor="1" judul="Autentikasi" />
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            Seluruh endpoint API dilindungi oleh <strong>API Key</strong> yang dikirimkan melalui HTTP header. 
                            Kunci API diperoleh dari halaman <strong>Kunci API</strong> pada panel admin.
                        </p>

                        <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-700/50">
                            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                                <thead className="text-xs uppercase bg-slate-50 dark:bg-slate-900/50 text-slate-400 font-bold border-b border-slate-100 dark:border-slate-700/50">
                                    <tr>
                                        <th className="px-6 py-3">Header</th>
                                        <th className="px-6 py-3">Tipe</th>
                                        <th className="px-6 py-3">Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                    <tr>
                                        <td className="px-6 py-4 font-mono font-bold text-xs text-[#0F91FC]">X-API-Key</td>
                                        <td className="px-6 py-4 text-xs font-semibold">string</td>
                                        <td className="px-6 py-4 text-xs text-red-500 dark:text-red-400 font-bold">Wajib. API Key dari panel manajemen kunci.</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 font-mono text-xs text-slate-400">Authorization</td>
                                        <td className="px-6 py-4 text-xs font-semibold text-slate-400">string</td>
                                        <td className="px-6 py-4 text-xs text-slate-400">Alternatif — format <code className="bg-slate-100 dark:bg-slate-900 px-1 rounded font-mono">Bearer &lt;token&gt;</code>.</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="space-y-3">
                            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Verifikasi Domain</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                Selain validasi kunci API, sistem memverifikasi <strong>domain pengirim</strong> dari header <code className="bg-slate-100 dark:bg-slate-900 px-1 rounded font-mono">Origin</code> atau <code className="bg-slate-100 dark:bg-slate-900 px-1 rounded font-mono">Referer</code>. Domain harus sesuai dengan domain terdaftar di kunci API.
                            </p>
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2.5">
                                <span className="material-symbols-rounded text-lg text-amber-500 shrink-0 mt-0.5">lightbulb</span>
                                <span><b>Tips Development:</b> Gunakan domain wildcard <code className="bg-amber-100 dark:bg-amber-900/40 px-1 rounded font-mono font-bold">*</code> saat generate kunci API untuk menonaktifkan verifikasi domain di lingkungan lokal/staging.</span>
                            </div>
                        </div>
                    </section>

                    {/* ══════════════════ 2. BASE URL ══════════════════ */}
                    <section id="base-url" className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-6">
                        <JudulSeksi nomor="2" judul="Base URL" />
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">Seluruh endpoint API berada di bawah base URL versi 1 berikut:</p>
                        <div className="relative">
                            <pre className="bg-slate-900 text-sky-400 font-mono text-sm px-5 py-4 rounded-2xl border border-slate-700 pr-20 select-all overflow-x-auto">
                                {baseUrl}/v1
                            </pre>
                            <button
                                onClick={() => salinKeClipboard(`${baseUrl}/v1`, 'baseurl')}
                                className={`absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${salinStatus['baseurl'] ? 'bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
                            >
                                {salinStatus['baseurl'] ? 'Disalin ✓' : 'Salin'}
                            </button>
                        </div>
                    </section>

                    {/* ══════════════════ 3. TEST KONEKSI ══════════════════ */}
                    <section id="ep-test" className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-6">
                        <JudulSeksi nomor="3" judul="Test Koneksi" />
                        <KepalaEndpoint
                            method="GET"
                            path="/api/v1/test"
                            deskripsi="Endpoint health-check untuk memverifikasi bahwa API key valid, domain dikenali, dan server berjalan normal."
                        />
                        <KodeBlok
                            judul="Contoh Request (cURL)"
                            salinKey="curl-test"
                            kode={`curl -X GET "${baseUrl}/v1/test" \\
  -H "X-API-Key: YOUR_API_KEY_HERE" \\
  -H "Accept: application/json"`}
                        />
                        <KodeBlok
                            judul="Contoh Response (200 OK)"
                            salinKey="res-test"
                            kode={`{
  "success": true,
  "data": {
    "status": "ok",
    "server_time": "2026-07-20T23:05:00+07:00"
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
                        />
                    </section>

                    {/* ══════════════════ 4. MEMBERS ══════════════════ */}
                    <section id="ep-members" className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-8">
                        <JudulSeksi nomor="4" judul="Members (Pengguna)" />

                        {/* GET /members */}
                        <div className="space-y-4 border-b border-slate-100 dark:border-slate-700/50 pb-8">
                            <KepalaEndpoint
                                method="GET"
                                path="/api/v1/members"
                                deskripsi="Mengambil daftar seluruh pengguna SSO beserta data kelas dan tahun pelajaran mereka. Mendukung filter dan paginasi."
                            />
                            <TabelParam params={[
                                { name: 'search',    tipe: 'string',  default: '—',  ket: 'Cari berdasarkan nama, NIK, NISN/NIP, atau email.' },
                                { name: 'email',     tipe: 'string',  default: '—',  ket: 'Filter tepat berdasarkan alamat email.' },
                                { name: 'role',      tipe: 'string',  default: '—',  ket: 'Filter berdasarkan nama peran (contoh: siswa, guru, tendik, alumni).' },
                                { name: 'kelas_id',  tipe: 'uuid',    default: '—',  ket: 'Filter pengguna berdasarkan UUID kelas tertentu.' },
                                { name: 'is_active', tipe: 'boolean', default: '—',  ket: 'Filter pengguna aktif (true) atau nonaktif (false).' },
                                { name: 'page',      tipe: 'integer', default: '1',  ket: 'Nomor halaman untuk paginasi.' },
                                { name: 'per_page',  tipe: 'integer', default: '50', ket: 'Jumlah data per halaman (maksimal 100).' },
                            ]} />
                            <KodeBlok
                                judul="Contoh Request — daftar siswa kelas tertentu"
                                salinKey="curl-members"
                                kode={`curl -X GET "${baseUrl}/v1/members?role=siswa&kelas_id=UUID_KELAS&per_page=30" \\
  -H "X-API-Key: YOUR_API_KEY_HERE" \\
  -H "Accept: application/json"`}
                            />
                            <KodeBlok
                                judul="Contoh Response (200 OK)"
                                salinKey="res-members"
                                kode={`{
  "success": true,
  "data": [
    {
      "id": "019f8046-2784-7043-80ff-c70115d4ada1",
      "nama_lengkap": "Nafi' Mukhtar",
      "email": "nafi@kredensia.id",
      "nik": "3515012345670001",
      "nip_nis": "12345678",
      "jk": "L",
      "no_telp": "081234567890",
      "tgl_lahir": "2008-05-12",
      "is_active": true,
      "claimed_at": "2026-07-11T12:00:00.000000Z",
      "created_at": "2026-07-11T10:00:00.000000Z",
      "updated_at": "2026-07-20T15:30:00.000000Z",
      "kelas_id": "01938abc-0000-7000-a000-000000000001",
      "roles": [{ "id": "uuid-role", "nama_role": "Siswa" }],
      "kelas": {
        "id": "01938abc-0000-7000-a000-000000000001",
        "nama_kelas": "XII IPA 1",
        "tingkat": "XII",
        "jurusan": "IPA",
        "tahun_pelajaran": {
          "id": "tp-uuid-001",
          "tahun_mulai": 2026,
          "tahun_selesai": 2027,
          "semester": "Ganjil",
          "is_aktif": true
        }
      }
    }
  ],
  "meta": { "total": 1, "page": 1, "per_page": 30, "last_page": 1 }
}`}
                            />
                        </div>

                        {/* GET /members/{id} */}
                        <div className="space-y-4">
                            <KepalaEndpoint
                                method="GET"
                                path="/api/v1/members/{id}"
                                deskripsi="Mengambil detail lengkap satu pengguna berdasarkan UUID-nya, termasuk relasi kelas dan tahun pelajaran."
                            />
                            <KodeBlok
                                judul="Contoh Request"
                                salinKey="curl-member-detail"
                                kode={`curl -X GET "${baseUrl}/v1/members/019f8046-2784-7043-80ff-c70115d4ada1" \\
  -H "X-API-Key: YOUR_API_KEY_HERE" \\
  -H "Accept: application/json"`}
                            />
                            <KodeBlok
                                judul="Contoh Response (404 Not Found)"
                                salinKey="res-member-404"
                                kode={`{
  "success": false,
  "pesan": "Member tidak ditemukan."
}`}
                            />
                        </div>
                    </section>

                    {/* ══════════════════ 5. KELAS ══════════════════ */}
                    <section id="ep-kelas" className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-8">
                        <JudulSeksi nomor="5" judul="Kelas" />

                        {/* GET /kelas */}
                        <div className="space-y-4 border-b border-slate-100 dark:border-slate-700/50 pb-8">
                            <KepalaEndpoint
                                method="GET"
                                path="/api/v1/kelas"
                                deskripsi="Mengambil daftar semua kelas beserta info tahun pelajaran, wali kelas, dan jumlah siswa."
                            />
                            <TabelParam params={[
                                { name: 'tahun_pelajaran_id', tipe: 'uuid',    default: '—',     ket: 'Filter kelas berdasarkan UUID tahun pelajaran.' },
                                { name: 'tingkat',            tipe: 'string',  default: '—',     ket: 'Filter berdasarkan tingkat kelas (contoh: X, XI, XII).' },
                                { name: 'aktif',              tipe: 'boolean', default: 'false', ket: 'Jika true, hanya menampilkan kelas pada tahun pelajaran yang aktif.' },
                            ]} />
                            <KodeBlok
                                judul="Contoh Request — hanya kelas aktif tingkat XII"
                                salinKey="curl-kelas"
                                kode={`curl -X GET "${baseUrl}/v1/kelas?aktif=true&tingkat=XII" \\
  -H "X-API-Key: YOUR_API_KEY_HERE" \\
  -H "Accept: application/json"`}
                            />
                            <KodeBlok
                                judul="Contoh Response (200 OK)"
                                salinKey="res-kelas"
                                kode={`{
  "success": true,
  "data": [
    {
      "id": "01938abc-0000-7000-a000-000000000001",
      "nama_kelas": "XII IPA 1",
      "tingkat": "XII",
      "jurusan": "IPA",
      "tahun_pelajaran_id": "tp-uuid-001",
      "wali_kelas_id": "guru-uuid-001",
      "created_at": "2026-07-01T00:00:00.000000Z",
      "jumlah_siswa": 36,
      "tahun_pelajaran": {
        "id": "tp-uuid-001",
        "tahun_mulai": 2026,
        "tahun_selesai": 2027,
        "semester": "Ganjil",
        "is_aktif": true
      },
      "wali_kelas": {
        "id": "guru-uuid-001",
        "nama_lengkap": "Aulia Zahra, S.Pd",
        "nip_nis": "197501012000121001"
      }
    }
  ],
  "meta": { "total": 1 }
}`}
                            />
                        </div>

                        {/* GET /kelas/{id} */}
                        <div className="space-y-4">
                            <KepalaEndpoint
                                method="GET"
                                path="/api/v1/kelas/{id}"
                                deskripsi="Detail satu kelas beserta daftar lengkap seluruh siswa yang terdaftar di dalamnya."
                            />
                            <KodeBlok
                                judul="Contoh Request"
                                salinKey="curl-kelas-detail"
                                kode={`curl -X GET "${baseUrl}/v1/kelas/01938abc-0000-7000-a000-000000000001" \\
  -H "X-API-Key: YOUR_API_KEY_HERE" \\
  -H "Accept: application/json"`}
                            />
                            <KodeBlok
                                judul="Contoh Response (200 OK)"
                                salinKey="res-kelas-detail"
                                kode={`{
  "success": true,
  "data": {
    "id": "01938abc-0000-7000-a000-000000000001",
    "nama_kelas": "XII IPA 1",
    "tingkat": "XII",
    "jurusan": "IPA",
    "jumlah_siswa": 2,
    "tahun_pelajaran": { "semester": "Ganjil", "is_aktif": true, ... },
    "wali_kelas": { "nama_lengkap": "Aulia Zahra, S.Pd", ... },
    "siswa": [
      {
        "id": "uuid-siswa-1",
        "nama_lengkap": "Ahmad Fauzi",
        "nip_nis": "12345",
        "jk": "L",
        "is_active": true,
        "roles": [{ "nama_role": "Siswa" }]
      }
    ]
  }
}`}
                            />
                        </div>
                    </section>

                    {/* ══════════════════ 6. TAHUN PELAJARAN ══════════════════ */}
                    <section id="ep-tahun-pelajaran" className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-8">
                        <JudulSeksi nomor="6" judul="Tahun Pelajaran" />

                        {/* GET /tahun-pelajaran */}
                        <div className="space-y-4 border-b border-slate-100 dark:border-slate-700/50 pb-8">
                            <KepalaEndpoint
                                method="GET"
                                path="/api/v1/tahun-pelajaran"
                                deskripsi="Mengambil seluruh tahun pelajaran yang tersedia beserta jumlah kelas di masing-masing tahun pelajaran."
                            />
                            <TabelParam params={[
                                { name: 'is_aktif', tipe: 'boolean', default: '—', ket: 'Jika true, hanya mengembalikan tahun pelajaran yang sedang aktif.' },
                            ]} />
                            <KodeBlok
                                judul="Contoh Request — ambil TP aktif saat ini"
                                salinKey="curl-tp"
                                kode={`curl -X GET "${baseUrl}/v1/tahun-pelajaran?is_aktif=true" \\
  -H "X-API-Key: YOUR_API_KEY_HERE" \\
  -H "Accept: application/json"`}
                            />
                            <KodeBlok
                                judul="Contoh Response (200 OK)"
                                salinKey="res-tp"
                                kode={`{
  "success": true,
  "data": [
    {
      "id": "tp-uuid-001",
      "tahun_mulai": 2026,
      "tahun_selesai": 2027,
      "semester": "Ganjil",
      "is_aktif": true,
      "created_at": "2026-07-01T00:00:00.000000Z",
      "kelas_count": 12,
      "label": "2026/2027 - Ganjil"
    }
  ],
  "meta": { "total": 1 }
}`}
                            />
                        </div>

                        {/* GET /tahun-pelajaran/{id} */}
                        <div className="space-y-4">
                            <KepalaEndpoint
                                method="GET"
                                path="/api/v1/tahun-pelajaran/{id}"
                                deskripsi="Detail satu tahun pelajaran beserta seluruh kelas yang dimilikinya termasuk wali kelas tiap kelas."
                            />
                            <KodeBlok
                                judul="Contoh Response (200 OK)"
                                salinKey="res-tp-detail"
                                kode={`{
  "success": true,
  "data": {
    "id": "tp-uuid-001",
    "tahun_mulai": 2026,
    "tahun_selesai": 2027,
    "semester": "Ganjil",
    "is_aktif": true,
    "label": "2026/2027 - Ganjil",
    "kelas": [
      {
        "id": "kelas-uuid-1",
        "nama_kelas": "XII IPA 1",
        "tingkat": "XII",
        "jurusan": "IPA",
        "wali_kelas": { "nama_lengkap": "Aulia Zahra, S.Pd", ... }
      }
    ]
  }
}`}
                            />
                        </div>
                    </section>

                    {/* ══════════════════ 7. PERAN & STATISTIK ══════════════════ */}
                    <section id="ep-peran-statistik" className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-8">
                        <JudulSeksi nomor="7" judul="Peran & Statistik" />

                        <div className="space-y-4 border-b border-slate-100 dark:border-slate-700/50 pb-8">
                            <KepalaEndpoint
                                method="GET"
                                path="/api/v1/data/peran"
                                deskripsi="Mengembalikan seluruh peran/role yang terdaftar di sistem beserta jumlah pengguna per peran."
                            />
                            <KodeBlok
                                judul="Contoh Response (200 OK)"
                                salinKey="res-peran"
                                kode={`{
  "success": true,
  "data": [
    { "id": "uuid-role", "nama_role": "Siswa", "is_active": true, "users_count": 452 },
    { "id": "uuid-role", "nama_role": "Guru",  "is_active": true, "users_count": 34 }
  ]
}`}
                            />
                        </div>

                        <div className="space-y-4">
                            <KepalaEndpoint
                                method="GET"
                                path="/api/v1/data/statistik"
                                deskripsi="Ringkasan statistik keseluruhan data di sistem SSO: pengguna, kelas, dan tahun pelajaran."
                            />
                            <KodeBlok
                                judul="Contoh Response (200 OK)"
                                salinKey="res-statistik"
                                kode={`{
  "success": true,
  "data": {
    "total_pengguna": 520,
    "total_pengguna_aktif": 498,
    "total_pengguna_terklaim": 412,
    "total_peran": 6,
    "total_kelas": 12,
    "total_tahun_pelajaran": 3,
    "tahun_pelajaran_aktif": "tp-uuid-001"
  }
}`}
                            />
                        </div>
                    </section>

                    {/* ══════════════════ 8. ERROR HANDLING ══════════════════ */}
                    <section id="error-handling" className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-6">
                        <JudulSeksi nomor="8" judul="Error Handling" />
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                            Semua response error mengikuti format JSON standar dengan field <code className="bg-slate-100 dark:bg-slate-900 px-1 rounded font-mono">success: false</code> dan <code className="bg-slate-100 dark:bg-slate-900 px-1 rounded font-mono">pesan</code>.
                        </p>
                        <div className="space-y-5">
                            {[
                                { kode: '401', warna: 'red', judul: 'Unauthorized', deskripsi: 'Header X-API-Key tidak disertakan, format tidak valid, atau kunci tidak ditemukan di database.' },
                                { kode: '403', warna: 'orange', judul: 'Forbidden', deskripsi: 'Domain pengirim (dari header Origin/Referer) tidak cocok dengan domain terdaftar di kunci API, atau kunci API dinonaktifkan.' },
                                { kode: '404', warna: 'red', judul: 'Not Found', deskripsi: 'Resource yang diminta (detail member, kelas, atau tahun pelajaran berdasarkan UUID) tidak ditemukan.' },
                                { kode: '500', warna: 'red', judul: 'Internal Server Error', deskripsi: 'Terjadi kesalahan tak terduga di sisi server. Laporkan ke administrator jika terjadi berulang kali.' },
                            ].map(({ kode, judul, deskripsi }) => (
                                <div key={kode} className="flex gap-4 items-start">
                                    <span className="bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400 font-bold px-2 py-1 rounded text-xs min-w-[3rem] text-center font-mono">
                                        {kode}
                                    </span>
                                    <div className="space-y-1">
                                        <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">{judul}</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">{deskripsi}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <KodeBlok
                            judul="Format Error Response"
                            salinKey="res-error"
                            kode={`// 401 Unauthorized
{ "success": false, "pesan": "API key tidak valid atau tidak ditemukan." }

// 403 Forbidden
{ "success": false, "pesan": "Domain tidak diizinkan untuk menggunakan kunci ini." }

// 404 Not Found
{ "success": false, "pesan": "Member tidak ditemukan." }`}
                        />
                    </section>

                    {/* ══════════════════ 9. CONTOH IMPLEMENTASI ══════════════════ */}
                    <section id="contoh-implementasi" className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-6">
                        <JudulSeksi nomor="9" judul="Contoh Implementasi" />

                        <KodeBlok
                            judul="PHP (cURL) — Ambil siswa kelas aktif"
                            salinKey="impl-php"
                            warna="text-emerald-400"
                            kode={`<?php

$apiKey  = 'YOUR_API_KEY_HERE';
$baseUrl = '${baseUrl}/v1';

// 1. Ambil tahun pelajaran aktif
$tpRes  = json_decode(file_get_contents($baseUrl . '/tahun-pelajaran?is_aktif=true', false, stream_context_create([
    'http' => ['header' => "X-API-Key: $apiKey\\r\\nAccept: application/json\\r\\n"]
])), true);
$tpId = $tpRes['data'][0]['id'] ?? null;

// 2. Ambil seluruh kelas pada tahun pelajaran aktif
$kelasRes = json_decode(file_get_contents($baseUrl . '/kelas?aktif=true', false, stream_context_create([
    'http' => ['header' => "X-API-Key: $apiKey\\r\\nAccept: application/json\\r\\n"]
])), true);

foreach ($kelasRes['data'] as $kelas) {
    echo $kelas['nama_kelas'] . ' — ' . $kelas['jumlah_siswa'] . ' siswa\\n';
}`}
                        />

                        <KodeBlok
                            judul="JavaScript (Fetch API) — Sinkronisasi pengguna SSO ke aplikasi lain"
                            salinKey="impl-js"
                            warna="text-sky-400"
                            kode={`const API_KEY = 'YOUR_API_KEY_HERE';
const BASE    = '${baseUrl}/v1';

async function ambilSiswaDariKelas(kelasId) {
    const res = await fetch(\`\${BASE}/members?kelas_id=\${kelasId}&role=siswa\`, {
        headers: { 'X-API-Key': API_KEY, 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(\`HTTP \${res.status}\`);
    const { data, meta } = await res.json();
    console.log(\`Total siswa: \${meta.total}\`, data);
    return data;
}

// Jalankan
ambilSiswaDariKelas('UUID_KELAS_ANDA');`}
                        />
                    </section>

                    {/* ══════════════════ SIMULASI API (LIVE) ══════════════════ */}
                    <section id="simulasi-api" className="bg-gradient-to-br from-[#081242] to-[#030947] text-white rounded-3xl p-6 lg:p-8 shadow-xl shadow-slate-900/10 space-y-6">
                        <div className="border-b border-white/10 pb-4">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <span className="material-symbols-rounded text-sky-400">play_circle</span>
                                Simulasi API Terintegrasi
                            </h2>
                            <p className="text-xs text-slate-300 mt-1">Tes endpoint secara langsung dari browser menggunakan kunci API Anda.</p>
                        </div>

                        <form onSubmit={jalankanSimulasi} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-1.5">API Key Anda</label>
                                    <input
                                        type="text"
                                        value={simulasiApiKey}
                                        onChange={e => setSimulasiApiKey(e.target.value)}
                                        placeholder="Ketik atau tempel kunci API Anda"
                                        className="w-full bg-slate-950/50 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#0F91FC] font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-1.5">Endpoint</label>
                                    <select
                                        value={simulasiEndpoint}
                                        onChange={e => setSimulasiEndpoint(e.target.value)}
                                        className="w-full bg-slate-950/50 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#0F91FC]"
                                    >
                                        <option value="/api/v1/test">GET /api/v1/test — Test Koneksi</option>
                                        <option value="/api/v1/members">GET /api/v1/members — Daftar Pengguna</option>
                                        <option value="/api/v1/kelas">GET /api/v1/kelas — Daftar Kelas</option>
                                        <option value="/api/v1/tahun-pelajaran">GET /api/v1/tahun-pelajaran — Tahun Pelajaran</option>
                                        <option value="/api/v1/data/peran">GET /api/v1/data/peran — Daftar Peran</option>
                                        <option value="/api/v1/data/statistik">GET /api/v1/data/statistik — Statistik Sistem</option>
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
                                        placeholder="Contoh: role=siswa&aktif=true&per_page=5"
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

                            <div className="space-y-2">
                                <span className="text-xs font-bold text-slate-300 uppercase tracking-widest block">Response Output</span>
                                <div className="bg-slate-950/60 rounded-2xl border border-white/10 p-4 min-h-[220px] max-h-[340px] overflow-y-auto font-mono text-xs">
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
                                        <span className="text-slate-500 italic block mt-16 text-center">Response akan muncul di sini setelah Anda mengklik Kirim Request.</span>
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
