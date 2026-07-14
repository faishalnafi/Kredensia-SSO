<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Instalasi Awal - Portal SSO Sekolah</title>
    
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
<body class="bg-slate-950 text-slate-100 min-h-screen flex items-center justify-center relative overflow-hidden antialiased py-10 px-4">

    <!-- Ornamen Background Glassmorphism -->
    <div class="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div class="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#0F91FC]/10 blur-[120px]"></div>
        <div class="absolute bottom-[-20%] left-[-10%] w-[40%] h-[40%] rounded-full bg-emerald-500/10 blur-[120px]"></div>
    </div>

    <!-- Main Container Card -->
    <main class="relative z-10 w-full max-w-lg bg-slate-900/80 backdrop-blur-lg rounded-3xl border border-slate-800 shadow-2xl p-6 md:p-8 space-y-6">
        
        <!-- Header -->
        <div class="text-center space-y-2">
            <div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#0F91FC] to-[#0a78d6] flex items-center justify-center text-white font-bold mx-auto shadow-lg shadow-[#0F91FC]/25 mb-4">
                <span class="material-symbols-rounded text-2xl">install_desktop</span>
            </div>
            <h1 class="text-xl font-extrabold text-white tracking-tight">Portal SSO Sekolah</h1>
            <p class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Setup Wizard & Migrasi Pertama</p>
        </div>

        <!-- Step 1: Pre-install Checks -->
        <div id="step-checks" class="space-y-4">
            <div class="border border-slate-800 rounded-2xl p-4 bg-slate-950/40 space-y-3">
                <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Pemeriksaan Sistem
                </h3>
                
                <div class="space-y-2">
                    <div class="flex items-center justify-between text-xs py-1">
                        <span class="text-slate-400 flex items-center gap-1.5">
                            <span class="material-symbols-rounded text-sm text-slate-500">terminal</span>
                            Versi PHP
                        </span>
                        <span class="font-mono font-bold text-white">{{ $phpVersion }}</span>
                    </div>

                    <div class="flex items-center justify-between text-xs py-1 border-t border-slate-800/40">
                        <span class="text-slate-400 flex items-center gap-1.5">
                            <span class="material-symbols-rounded text-sm text-slate-500">database</span>
                            Koneksi Database
                        </span>
                        @if($dbKoneksiOk)
                            <span class="inline-flex items-center gap-1 text-emerald-400 font-bold">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                Terhubung
                            </span>
                        @else
                            <span class="inline-flex items-center gap-1 text-rose-400 font-bold">
                                <span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
                                Gagal
                            </span>
                        @endif
                    </div>
                </div>

                @if(!$dbKoneksiOk)
                    <div class="p-3 bg-rose-950/20 border border-rose-900/30 rounded-xl text-[11px] text-rose-400 leading-relaxed font-mono">
                        {{ $dbPesan }}
                    </div>
                @endif
            </div>

            @if($sudahTermigrasi)
                <div class="p-3 bg-amber-950/20 border border-amber-900/30 rounded-xl text-xs text-amber-400 flex items-start gap-2.5">
                    <span class="material-symbols-rounded text-lg text-amber-500 shrink-0 mt-0.5">warning</span>
                    <span><b>Perhatian:</b> Database sudah terisi data. Jika Anda melanjutkan instalasi, sistem akan **menghapus semua data lama (migrate:fresh)** dan menggantinya dengan akun instalasi awal.</span>
                </div>
            @endif

            <button
                onclick="mulaiInstalasi()"
                @if(!$dbKoneksiOk) disabled @endif
                class="w-full py-3 bg-[#0F91FC] hover:bg-[#0a78d6] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#0F91FC]/20 flex items-center justify-center gap-2"
            >
                <span class="material-symbols-rounded text-sm">play_arrow</span>
                Mulai Jalankan Instalasi
            </button>
        </div>

        <!-- Step 2: Progress (Hidden at start) -->
        <div id="step-progress" class="hidden space-y-4">
            <div class="border border-slate-800 rounded-2xl p-5 bg-slate-950/60 min-h-[140px] flex flex-col justify-center items-center text-center space-y-4">
                <!-- Loader spinner -->
                <div class="w-8 h-8 rounded-full border-2 border-slate-700 border-t-[#0F91FC] animate-spin"></div>
                <div class="space-y-1">
                    <h4 class="text-xs font-bold text-white uppercase tracking-widest" id="progress-title">Memproses Database...</h4>
                    <p class="text-[11px] text-slate-400" id="progress-desc">Menjalankan migrasi tabel-tabel portal SSO Sekolah.</p>
                </div>
            </div>
        </div>

        <!-- Step 3: Success Credentials (Hidden at start) -->
        <div id="step-success" class="hidden space-y-5">
            <div class="border border-emerald-900/30 rounded-2xl p-4 bg-emerald-950/10 space-y-3">
                <div class="flex items-center gap-2 text-emerald-400">
                    <span class="material-symbols-rounded">check_circle</span>
                    <h3 class="text-xs font-bold uppercase tracking-widest">Instalasi Berhasil</h3>
                </div>
                <p class="text-xs text-slate-350 leading-relaxed">
                    Database berhasil dimigrasi secara bersih. Akun awal Admin dan Superadmin telah dibuat dengan data berikut:
                </p>

                <!-- Credentials Display -->
                <div class="space-y-2 font-mono text-[11px]">
                    <div class="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                        <span class="text-[#0F91FC] font-bold block">[ 1. Akun Super Admin ]</span>
                        <div>Email: <span class="text-white select-all">superadmin@faishalnafi.com</span></div>
                        <div>Sandi: <span class="text-white select-all">superadmin</span></div>
                    </div>
                    
                    <div class="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1">
                        <span class="text-emerald-400 font-bold block">[ 2. Akun Admin ]</span>
                        <div>Email: <span class="text-white select-all">admin@faishalnafi.com</span></div>
                        <div>Sandi: <span class="text-white select-all">admin</span></div>
                    </div>
                </div>
            </div>

            <a
                href="/otentikasi"
                class="w-full py-3 bg-[#0F91FC] hover:bg-[#0a78d6] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-[#0F91FC]/25 flex items-center justify-center gap-2"
            >
                <span class="material-symbols-rounded text-sm">login</span>
                Masuk ke Portal SSO
            </a>
        </div>

    </main>

    <!-- AJAX Script -->
    <script>
        async function mulaiInstalasi() {
            const stepChecks = document.getElementById('step-checks');
            const stepProgress = document.getElementById('step-progress');
            const stepSuccess = document.getElementById('step-success');

            const progressTitle = document.getElementById('progress-title');
            const progressDesc = document.getElementById('progress-desc');

            // 1. Ganti tampilan ke progress
            stepChecks.classList.add('hidden');
            stepProgress.classList.remove('hidden');

            try {
                // Jalankan request instalasi ke server
                const response = await fetch('/setup/jalankan', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': '{{ csrf_token() }}'
                    }
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    // Berhasil
                    stepProgress.classList.add('hidden');
                    stepSuccess.classList.remove('hidden');
                } else {
                    // Gagal
                    alert('Gagal: ' + (data.message || 'Kesalahan tidak diketahui'));
                    // Kembalikan ke step 1
                    stepProgress.classList.add('hidden');
                    stepChecks.classList.remove('hidden');
                }
            } catch (err) {
                alert('Koneksi Gagal: ' + err.message);
                stepProgress.classList.add('hidden');
                stepChecks.classList.remove('hidden');
            }
        }
    </script>
</body>
</html>
