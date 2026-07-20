<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dokumentasi API - SSO Sekolah</title>
    <link rel="icon" type="image/png" href="{{ $favicon ?? '/favicon.ico' }}" />
    
    <!-- Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    
    <!-- Google Fonts Inter -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    
    <!-- Material Symbols Icons -->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
    
    <style>
        body {
            font-family: 'Inter', sans-serif;
        }
        .material-symbols-rounded {
            font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24
        }
    </style>
</head>
<body class="bg-slate-900 text-slate-100 min-h-screen relative overflow-x-hidden antialiased">

    <!-- Ornamen Background Glassmorphism -->
    <div class="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div class="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] rounded-full bg-[#0F91FC]/10 blur-[100px]"></div>
        <div class="absolute bottom-[-10%] left-[-5%] w-[30%] h-[30%] rounded-full bg-emerald-500/10 blur-[100px]"></div>
    </div>

    <!-- Header Section -->
    <header class="relative z-10 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0">
        <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0F91FC] to-[#0a78d6] flex items-center justify-center text-white font-bold shadow-lg shadow-[#0F91FC]/30">
                    <span class="material-symbols-rounded text-xl">vpn_key</span>
                </div>
                <div>
                    <h1 class="text-base font-extrabold tracking-tight text-white">Kredensia ID</h1>
                    <p class="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">SSO Portal API Docs</p>
                </div>
            </div>
            <a href="/" class="text-xs font-bold text-slate-400 hover:text-white transition-all flex items-center gap-1">
                <span class="material-symbols-rounded text-sm">arrow_back</span>
                Kembali ke Portal
            </a>
        </div>
    </header>

    <!-- Main Container -->
    <main class="relative z-10 max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-6">

        <!-- Left Side: Daftar Isi -->
        <div class="lg:col-span-1">
            <div class="sticky top-24 bg-slate-800/80 backdrop-blur-md rounded-3xl p-5 border border-slate-700/50 shadow-lg space-y-4">
                <h3 class="text-xs font-bold text-slate-500 uppercase tracking-widest px-3">
                    Daftar Isi
                </h3>
                <nav class="space-y-1" id="nav-list">
                    <button onclick="scrollKe('autentikasi')" class="nav-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all bg-[#0F91FC]/20 text-sky-400" data-target="autentikasi">
                        <span class="material-symbols-rounded text-lg shrink-0">lock</span>
                        <span>1. Autentikasi</span>
                    </button>
                    <button onclick="scrollKe('base-url')" class="nav-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all text-slate-400 hover:bg-slate-700/30" data-target="base-url">
                        <span class="material-symbols-rounded text-lg shrink-0">link</span>
                        <span>2. Base URL</span>
                    </button>
                    <button onclick="scrollKe('endpoints')" class="nav-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all text-slate-400 hover:bg-slate-700/30" data-target="endpoints">
                        <span class="material-symbols-rounded text-lg shrink-0">code</span>
                        <span>3. Endpoints</span>
                    </button>
                    <button onclick="scrollKe('error-handling')" class="nav-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all text-slate-400 hover:bg-slate-700/30" data-target="error-handling">
                        <span class="material-symbols-rounded text-lg shrink-0">info</span>
                        <span>4. Error Handling</span>
                    </button>
                    <button onclick="scrollKe('contoh-implementasi')" class="nav-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all text-slate-400 hover:bg-slate-700/30" data-target="contoh-implementasi">
                        <span class="material-symbols-rounded text-lg shrink-0">terminal</span>
                        <span>5. Contoh Implementasi</span>
                    </button>
                    <button onclick="scrollKe('simulasi-api')" class="nav-btn w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-sm font-semibold transition-all text-slate-400 hover:bg-slate-700/30 border-t border-slate-700/50 pt-3 mt-2" data-target="simulasi-api">
                        <span class="material-symbols-rounded text-lg shrink-0 text-sky-400">play_circle</span>
                        <span class="text-sky-400">Simulasi API (Live)</span>
                    </button>
                </nav>
            </div>
        </div>

        <!-- Right Side: Content Sections -->
        <div class="lg:col-span-3 space-y-8 pb-20">

            <!-- Section 1: Autentikasi -->
            <section id="autentikasi" class="bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-700/50 shadow-md space-y-6">
                <div class="flex items-center gap-3 border-b border-slate-700/50 pb-4">
                    <div class="w-8 h-8 rounded-lg bg-[#0F91FC]/20 flex items-center justify-center text-sky-400 font-extrabold text-sm">
                        1
                    </div>
                    <h2 class="text-xl font-bold text-white">Autentikasi</h2>
                </div>
                <p class="text-sm text-slate-300 leading-relaxed">
                    Setiap request ke API harus menyertakan **API Key** melalui HTTP header. API key didapatkan dari admin panel SSO di menu **Kunci API**.
                </p>

                <!-- Headers Table -->
                <div class="overflow-x-auto rounded-2xl border border-slate-700/50">
                    <table class="w-full text-left text-sm text-slate-300">
                        <thead class="text-xs uppercase bg-slate-900/50 text-slate-500 font-bold border-b border-slate-700/50">
                            <tr>
                                <th class="px-6 py-3">Header</th>
                                <th className="px-6 py-3">Tipe</th>
                                <th className="px-6 py-3">Keterangan</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-700/50">
                            <tr>
                                <td class="px-6 py-4 font-mono font-bold text-xs text-sky-400">X-API-Key</td>
                                <td class="px-6 py-4 text-xs font-semibold">string</td>
                                <td class="px-6 py-4 text-xs text-red-400 font-bold">Wajib. API Key yang diperoleh dari panel manajemen kunci.</td>
                            </tr>
                            <tr>
                                <td class="px-6 py-4 font-mono text-xs text-slate-500">Authorization</td>
                                <td class="px-6 py-4 text-xs font-semibold text-slate-500">string</td>
                                <td class="px-6 py-4 text-xs text-slate-500">Alternatif. format <code class="font-mono bg-slate-900 px-1 rounded">Bearer &lt;token&gt;</code>.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Domain Verification -->
                <div class="space-y-3">
                    <h4 class="text-sm font-bold text-slate-250">Verifikasi Domain</h4>
                    <p class="text-xs text-slate-400 leading-relaxed">
                        Selain memvalidasi API key, sistem juga memverifikasi **domain pengirim request** melalui header `Origin` atau `Referer`. Domain pengirim harus cocok dengan domain yang Anda daftarkan saat men-generate API key di panel admin.
                    </p>
                    <div class="p-3 bg-amber-950/20 border border-amber-900/30 rounded-xl text-xs text-amber-400 flex items-start gap-2.5">
                        <span class="material-symbols-rounded text-lg text-amber-500 shrink-0 mt-0.5">lightbulb</span>
                        <span><b>Tips:</b> Untuk request server-to-server (backend), domain dicocokkan dengan domain terdaftar. Gunakan domain wildcard <code class="font-mono bg-slate-900 px-1 rounded font-bold text-amber-300">*</code> saat development untuk menonaktifkan verifikasi domain.</span>
                    </div>
                </div>
            </section>

            <!-- Section 2: Base URL -->
            <section id="base-url" class="bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-700/50 shadow-md space-y-6">
                <div class="flex items-center gap-3 border-b border-slate-700/50 pb-4">
                    <div class="w-8 h-8 rounded-lg bg-[#0F91FC]/20 flex items-center justify-center text-sky-400 font-extrabold text-sm">
                        2
                    </div>
                    <h2 class="text-xl font-bold text-white">Base URL</h2>
                </div>
                <p class="text-sm text-slate-300 leading-relaxed">
                    Seluruh endpoint API dapat diakses melalui base URL produksi berikut:
                </p>

                <div class="relative">
                    <pre class="bg-slate-950 text-sky-400 font-mono text-sm px-5 py-4 rounded-2xl border border-slate-800 pr-16 select-all overflow-x-auto" id="baseurl-text">https://portal.kredensia.id/api/v1</pre>
                    <button onclick="salinBaseUrl()" id="baseurl-btn" class="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-slate-800 hover:bg-slate-700 text-slate-300">
                        Salin
                    </button>
                </div>
            </section>

            <!-- Section 3: Endpoints -->
            <section id="endpoints" class="bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-700/50 shadow-md space-y-8">
                <div class="flex items-center gap-3 border-b border-slate-700/50 pb-4">
                    <div class="w-8 h-8 rounded-lg bg-[#0F91FC]/20 flex items-center justify-center text-sky-400 font-extrabold text-sm">
                        3
                    </div>
                    <h2 class="text-xl font-bold text-white">Endpoints</h2>
                </div>

                <!-- Endpoint 1: Test Koneksi -->
                <div class="space-y-4 border-b border-slate-700/50 pb-6">
                    <div class="flex items-center gap-3 flex-wrap">
                        <span class="bg-emerald-950/40 text-emerald-400 font-mono text-xs font-extrabold px-2.5 py-1 rounded-md">GET</span>
                        <code class="font-mono text-sm font-bold text-white">/api/v1/test</code>
                    </div>
                    <p class="text-xs text-slate-400 leading-relaxed">
                        Endpoint sederhana untuk mengetes koneksi API dan memastikan API key + verifikasi domain sudah benar. Cocok dipakai sebagai health-check oleh aplikasi pendukung.
                    </p>

                    <!-- Request Code Block -->
                    <div class="space-y-2">
                        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Contoh Request (cURL)</span>
                        <div class="relative font-mono">
                            <pre class="bg-slate-950 text-slate-300 text-xs px-5 py-4 rounded-2xl border border-slate-800 overflow-x-auto pr-16 leading-relaxed" id="curl-test-text">curl -X GET "https://portal.kredensia.id/api/v1/test" \
  -H "X-API-Key: YOUR_API_KEY_HERE"</pre>
                            <button onclick="salinSeksi('curl-test-text', 'copy-test-btn')" id="copy-test-btn" class="absolute right-3 top-3 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 rounded-md transition-all">Copy</button>
                        </div>
                    </div>

                    <!-- Response Code Block -->
                    <div class="space-y-2">
                        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Contoh Response (200 OK)</span>
                        <pre class="bg-slate-950 text-slate-300 font-mono text-xs px-5 py-4 rounded-2xl border border-slate-800 overflow-x-auto leading-relaxed">
{
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
}</pre>
                    </div>
                </div>

                <!-- Endpoint 2: Daftar Members -->
                <div class="space-y-4">
                    <div class="flex items-center gap-3 flex-wrap">
                        <span class="bg-emerald-950/40 text-emerald-400 font-mono text-xs font-extrabold px-2.5 py-1 rounded-md">GET</span>
                        <code class="font-mono text-sm font-bold text-white">/api/v1/members</code>
                    </div>
                    <p class="text-xs text-slate-400 leading-relaxed">
                        Mengambil seluruh data member yang terdaftar di database SSO.
                    </p>

                    <!-- Parameters Table -->
                    <div class="space-y-2">
                        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Query Parameters (Opsional)</span>
                        <div class="overflow-x-auto rounded-2xl border border-slate-700/50">
                            <table class="w-full text-left text-xs text-slate-300">
                                <thead class="bg-slate-900/50 text-slate-500 border-b border-slate-700/50 font-bold uppercase tracking-wider">
                                    <tr>
                                        <th class="px-4 py-3">Parameter</th>
                                        <th class="px-4 py-3">Tipe</th>
                                        <th class="px-4 py-3">Default</th>
                                        <th class="px-4 py-3">Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-slate-700/50">
                                    <tr>
                                        <td class="px-4 py-3 font-mono font-bold text-sky-400">search</td>
                                        <td class="px-4 py-3">string</td>
                                        <td class="px-4 py-3">—</td>
                                        <td class="px-4 py-3 text-slate-400">Cari berdasarkan nama lengkap, NIK, NISN, NIS, NIP, atau email.</td>
                                    </tr>
                                    <tr>
                                        <td class="px-4 py-3 font-mono font-bold text-sky-400">email</td>
                                        <td class="px-4 py-3">string</td>
                                        <td class="px-4 py-3">—</td>
                                        <td class="px-4 py-3 text-slate-400">Cari spesifik berdasarkan Google Email member.</td>
                                    </tr>
                                    <tr>
                                        <td class="px-4 py-3 font-mono font-bold text-sky-400">role</td>
                                        <td class="px-4 py-3">string</td>
                                        <td class="px-4 py-3">—</td>
                                        <td class="px-4 py-3 text-slate-400">Filter role sistem (contoh: siswa, guru, tendik, alumni, keluar).</td>
                                    </tr>
                                    <tr>
                                        <td class="px-4 py-3 font-mono font-bold text-sky-400">page</td>
                                        <td class="px-4 py-3">integer</td>
                                        <td class="px-4 py-3">1</td>
                                        <td class="px-4 py-3 text-slate-400">Nomor halaman data pagination.</td>
                                    </tr>
                                    <tr>
                                        <td class="px-4 py-3 font-mono font-bold text-sky-400">per_page</td>
                                        <td class="px-4 py-3">integer</td>
                                        <td class="px-4 py-3">50</td>
                                        <td class="px-4 py-3 text-slate-400">Jumlah data per halaman (maksimal 100).</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- Request Code Block -->
                    <div class="space-y-2 font-mono">
                        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Contoh Request (cURL)</span>
                        <div class="relative">
                            <pre class="bg-slate-950 text-slate-300 text-xs px-5 py-4 rounded-2xl border border-slate-800 overflow-x-auto pr-16 leading-relaxed" id="curl-members-text">curl -X GET "https://portal.kredensia.id/api/v1/members?role=siswa&page=1&per_page=10" \
  -H "X-API-Key: YOUR_API_KEY_HERE"</pre>
                            <button onclick="salinSeksi('curl-members-text', 'copy-mem-btn')" id="copy-mem-btn" class="absolute right-3 top-3 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] font-bold text-slate-300 rounded-md transition-all">Copy</button>
                        </div>
                    </div>

                    <!-- Response Code Block -->
                    <div class="space-y-2">
                        <span class="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Contoh Response (200 OK)</span>
                        <pre class="bg-slate-950 text-slate-300 font-mono text-xs px-5 py-4 rounded-2xl border border-slate-800 overflow-x-auto leading-relaxed">
{
  "success": true,
  "data": [
    {
      "id": "998df9a8-e123-4567-8910-abcdef123456",
      "nama_lengkap": "Nafi' Mukhtar",
      "email": "nafi@kredensia.id",
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
}</pre>
                    </div>

                    <div class="p-3 bg-slate-900/40 border border-slate-700/50 rounded-xl text-xs text-slate-400 leading-relaxed">
                        <b>Catatan Role keluar:</b> Dipakai untuk siswa mutasi/keluar (non-aktif). Data masih bisa diakses via API, namun user tidak dapat login/claim akun sampai admin mengembalikan role menjadi siswa.
                    </div>
                </div>
            </section>

            <!-- Section 4: Error Handling -->
            <section id="error-handling" class="bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-700/50 shadow-md space-y-6">
                <div class="flex items-center gap-3 border-b border-slate-700/50 pb-4">
                    <div class="w-8 h-8 rounded-lg bg-[#0F91FC]/20 flex items-center justify-center text-sky-400 font-extrabold text-sm">
                        4
                    </div>
                    <h2 class="text-xl font-bold text-white">Error Handling</h2>
                </div>
                <p class="text-sm text-slate-300 leading-relaxed">
                    API menggunakan format status code HTTP standar untuk mengindikasikan keberhasilan atau kegagalan request.
                </p>

                <div class="space-y-4">
                    <div class="flex gap-4 items-start">
                        <span class="bg-red-950/40 text-red-400 font-bold px-2 py-1 rounded text-xs w-16 text-center font-mono">401</span>
                        <div class="space-y-1">
                            <h4 class="text-sm font-bold text-white">Unauthorized</h4>
                            <p class="text-xs text-slate-450">Header Kunci API (`X-API-Key` atau `Authorization`) tidak disertakan, format tidak valid, atau nilai token tidak cocok dengan database.</p>
                        </div>
                    </div>
                    <div class="flex gap-4 items-start">
                        <span class="bg-red-950/40 text-red-400 font-bold px-2 py-1 rounded text-xs w-16 text-center font-mono">403</span>
                        <div class="space-y-1">
                            <h4 class="text-sm font-bold text-white">Forbidden</h4>
                            <p class="text-xs text-slate-450">Domain pengirim (Origin/Referer) tidak sesuai dengan domain terdaftar pada kunci API tersebut, atau kunci API dinonaktifkan.</p>
                        </div>
                    </div>
                    <div class="flex gap-4 items-start">
                        <span class="bg-red-950/40 text-red-400 font-bold px-2 py-1 rounded text-xs w-16 text-center font-mono">404</span>
                        <div class="space-y-1">
                            <h4 class="text-sm font-bold text-white">Not Found</h4>
                            <p class="text-xs text-slate-450">Resource yang diminta (misal: ID member) tidak ditemukan di database.</p>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Section 5: Contoh Implementasi -->
            <section id="contoh-implementasi" class="bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 border border-slate-700/50 shadow-md space-y-6">
                <div class="flex items-center gap-3 border-b border-slate-700/50 pb-4">
                    <div class="w-8 h-8 rounded-lg bg-[#0F91FC]/20 flex items-center justify-center text-sky-400 font-extrabold text-sm">
                        5
                    </div>
                    <h2 class="text-xl font-bold text-white">Contoh Implementasi</h2>
                </div>

                {/* PHP Example */}
                <div class="space-y-2">
                    <span class="text-xs font-bold text-slate-400 block">Klien S2S (PHP - cURL)</span>
                    <pre class="bg-slate-950 text-emerald-400 font-mono text-xs px-5 py-4 rounded-2xl border border-slate-800 overflow-x-auto leading-relaxed" id="php-code">
&lt;?php

$apiKey = 'YOUR_API_KEY_HERE';
$url = 'https://portal.kredensia.id/api/v1/members?role=siswa';

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
    print_r($data['data']);
} else {
    echo "Gagal menarik data. Status: " . $statusCode;
}</pre>
                </div>
            </section>

            <!-- Section 6: Simulasi API (Live Panel) -->
            <section id="simulasi-api" class="bg-gradient-to-br from-[#081242] to-[#030947] text-white rounded-3xl p-6 lg:p-8 shadow-xl space-y-6">
                <div class="border-b border-white/10 pb-4">
                    <h2 class="text-xl font-bold flex items-center gap-2">
                        <span class="material-symbols-rounded text-sky-400">play_circle</span>
                        Simulasi API Terintegrasi
                    </h2>
                    <p class="text-xs text-slate-350 mt-1">Tes fungsionalitas dan domain verifikasi langsung dari browser Anda.</p>
                </div>

                <form id="simulasi-form" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="space-y-3">
                        <div>
                            <label class="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-1.5">
                                API Key Anda
                            </label>
                            <input
                                type="text"
                                id="sim-key"
                                placeholder="Ketik atau tempel kunci API Anda"
                                class="w-full bg-slate-950/50 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#0F91FC] font-mono"
                            />
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-1.5">
                                Endpoint
                            </label>
                            <select
                                id="sim-endpoint"
                                class="w-full bg-slate-950/50 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#0F91FC]"
                            >
                                <option value="/api/v1/test">GET /api/v1/test (Koneksi)</option>
                                <option value="/api/v1/members">GET /api/v1/members (Semua Member)</option>
                            </select>
                        </div>

                        <div>
                            <label class="block text-xs font-bold text-slate-300 uppercase tracking-widest mb-1.5">
                                Query Params <span class="text-slate-400 font-normal">(Opsional)</span>
                            </label>
                            <input
                                type="text"
                                id="sim-params"
                                placeholder="Contoh: role=siswa&per_page=5"
                                class="w-full bg-slate-950/50 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#0F91FC] font-mono"
                            />
                        </div>

                        <button
                            type="submit"
                            id="sim-submit"
                            class="w-full py-2.5 bg-[#0F91FC] hover:bg-[#0a78d6] text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            <span class="material-symbols-rounded text-sm">send</span>
                            Kirim Request
                        </button>
                    </div>

                    <!-- Response simulation results -->
                    <div class="space-y-2">
                        <span class="text-xs font-bold text-slate-300 uppercase tracking-widest block">Response Output</span>
                        <div class="bg-slate-950/60 rounded-2xl border border-white/10 p-4 min-h-[180px] max-h-[300px] overflow-y-auto font-mono text-xs text-emerald-400">
                            <div class="space-y-3" id="sim-response-output">
                                <span class="text-slate-500 italic block mt-10 text-center">Response akan muncul di sini setelah Anda mengklik Kirim Request.</span>
                            </div>
                        </div>
                    </div>
                </form>
            </section>
        </div>
    </main>

    <script>
        // Setup Dynamic Base URL
        const origin = window.location.origin;
        const apiBaseUrl = origin + '/api';

        document.getElementById('baseurl-text').innerText = apiBaseUrl + '/v1';
        document.getElementById('curl-test-text').innerText = `curl -X GET "` + apiBaseUrl + `/v1/test" \\\n  -H "X-API-Key: YOUR_API_KEY_HERE"`;
        document.getElementById('curl-members-text').innerText = `curl -X GET "` + apiBaseUrl + `/v1/members?role=siswa&page=1&per_page=10" \\\n  -H "X-API-Key: YOUR_API_KEY_HERE"`;
        
        const phpCodeNode = document.getElementById('php-code');
        phpCodeNode.innerHTML = phpCodeNode.innerHTML.replace('https://portal.kredensia.id/api', apiBaseUrl);

        function scrollKe(id) {
            const el = document.getElementById(id);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }

            // Update active state in nav
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('bg-[#0F91FC]/20', 'text-sky-400');
                btn.classList.add('text-slate-400', 'hover:bg-slate-700/30');
            });

            const currentBtn = document.querySelector(`[data-target="${id}"]`);
            if (currentBtn) {
                currentBtn.classList.remove('text-slate-400', 'hover:bg-slate-700/30');
                currentBtn.classList.add('bg-[#0F91FC]/20', 'text-sky-400');
            }
        }

        function salinBaseUrl() {
            const text = apiBaseUrl + '/v1';
            navigator.clipboard.writeText(text).then(() => {
                const btn = document.getElementById('baseurl-btn');
                btn.innerText = 'Disalin ✓';
                btn.classList.add('bg-emerald-500', 'text-white');
                setTimeout(() => {
                    btn.innerText = 'Salin';
                    btn.classList.remove('bg-emerald-500', 'text-white');
                }, 2000);
            });
        }

        function salinSeksi(textId, btnId) {
            const rawText = document.getElementById(textId).innerText;
            navigator.clipboard.writeText(rawText).then(() => {
                const btn = document.getElementById(btnId);
                btn.innerText = 'Copied ✓';
                btn.classList.add('bg-emerald-500', 'text-white');
                setTimeout(() => {
                    btn.innerText = 'Copy';
                    btn.classList.remove('bg-emerald-500', 'text-white');
                }, 2000);
            });
        }

        // Live Simulation AJAX Script
        document.getElementById('simulasi-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const apiKey = document.getElementById('sim-key').value;
            const endpoint = document.getElementById('sim-endpoint').value;
            const params = document.getElementById('sim-params').value;
            const submitBtn = document.getElementById('sim-submit');
            const outputArea = document.getElementById('sim-response-output');

            submitBtn.disabled = true;
            submitBtn.innerText = 'Mengirim...';
            outputArea.innerHTML = '<span class="text-sky-400 italic animate-pulse block text-center mt-10">Menghubungi API server...</span>';

            const headers = { 'Accept': 'application/json' };
            if (apiKey) {
                headers['X-API-Key'] = apiKey;
            }

            const url = origin + endpoint + (params ? '?' + params : '');

            try {
                const response = await fetch(url, { method: 'GET', headers });
                const data = await response.json();
                
                outputArea.innerHTML = `
                    <div class="space-y-3">
                        <div>
                            <span class="text-slate-500 block">// Status Code</span>
                            <span class="font-bold \${response.ok ? 'text-emerald-400' : 'text-rose-450'}">\${response.status} \${response.statusText}</span>
                        </div>
                        <div>
                            <span class="text-slate-500 block">// Response Body</span>
                            <pre class="text-emerald-400 overflow-x-auto whitespace-pre-wrap">\${JSON.stringify(data, null, 2)}</pre>
                        </div>
                    </div>
                `;
            } catch (err) {
                outputArea.innerHTML = `
                    <div class="text-rose-400">
                        <span class="font-bold block">// Connection Failed</span>
                        <span>\${err.message}</span>
                    </div>
                `;
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerText = 'Kirim Request';
            }
        });
    </script>
</body>
</html>
