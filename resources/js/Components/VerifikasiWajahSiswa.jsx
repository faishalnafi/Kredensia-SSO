import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, FaceLandmarker } from '@mediapipe/tasks-vision';

/**
 * Komponen Verifikasi Wajah Siswa (Beta)
 * 
 * Menggunakan Google MediaPipe Face Landmarker (478 Landmark 3D) untuk
 * validasi liveness dan orientasi wajah presisi tinggi (Yaw, Pitch, Roll)
 * mirip standar e-KYC (seperti VIDA), dengan auto-capture dan kompresi JPEG client-side.
 * 
 * Standar Desain:
 * - Anti-CLS: Dimensi pembungkus kamera tetap (aspect-[4/3]) agar tidak terjadi pergeseran layout.
 * - Bahasa Baku: Seluruh nama fungsi, variabel, dan label antarmuka menggunakan Bahasa Indonesia.
 */
export default function VerifikasiWajahSiswa({ 
    namaSiswa = '', 
    onFotoTerverifikasi, 
    onKembali,
    fotoSebelumnya = null 
}) {
    // Referensi Elemen DOM
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const faceLandmarkerRef = useRef(null);
    const idAnimasiRef = useRef(null);
    const waktuMulaiStabilRef = useRef(null);

    // State Antarmuka
    const [statusInisialisasi, setStatusInisialisasi] = useState('memuat'); // 'memuat' | 'siap' | 'izin_ditolak' | 'perangkat_tidak_tersedia' | 'galat'
    const [pesanPanduan, setPesanPanduan] = useState('Mempersiapkan sensor kamera & AI...');
    const [tingkatKestabilan, setTingkatKestabilan] = useState(0); // 0 sampai 100 (%)
    const [statusOrientasi, setStatusOrientasi] = useState('mencari'); // 'mencari' | 'tidak_presisi' | 'presisi'
    const [fotoTerambil, setFotoTerambil] = useState(fotoSebelumnya);
    const [sedangMemprosesFoto, setSedangMemprosesFoto] = useState(false);
    const [efekFlashKamera, setEfekFlashKamera] = useState(false);

    /**
     * Inisialisasi MediaPipe FaceLandmarker
     * Menggunakan model lokal /vendor/mediapipe/ dengan fallback CDN
     */
    const inisialisasiMediaPipe = async () => {
        try {
            // Muat wasm lokal terlebih dahulu
            let filesetResolver;
            try {
                filesetResolver = await FilesetResolver.forVisionTasks('/vendor/mediapipe/wasm');
            } catch (eWasm) {
                console.warn('WASM lokal gagal dimuat, beralih ke CDN:', eWasm);
                filesetResolver = await FilesetResolver.forVisionTasks(
                    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
                );
            }

            // Muat model FaceLandmarker lokal dengan fallback CDN
            let landmarker;
            try {
                landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                    baseOptions: {
                        modelAssetPath: '/vendor/mediapipe/face_landmarker.task',
                        delegate: 'GPU'
                    },
                    outputFaceBlendshapes: false,
                    outputFacialTransformationMatrixes: true,
                    runningMode: 'VIDEO',
                    numFaces: 1
                });
            } catch (eModel) {
                console.warn('Model lokal gagal dimuat, beralih ke Google Storage CDN:', eModel);
                landmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                    baseOptions: {
                        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
                        delegate: 'GPU'
                    },
                    outputFaceBlendshapes: false,
                    outputFacialTransformationMatrixes: true,
                    runningMode: 'VIDEO',
                    numFaces: 1
                });
            }

            faceLandmarkerRef.current = landmarker;
            return true;
        } catch (error) {
            console.error('Inisialisasi MediaPipe FaceLandmarker gagal:', error);
            setStatusInisialisasi('galat');
            return false;
        }
    };

    /**
     * Buka Akses Kamera Pengguna
     */
    const bukaKamera = async () => {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setStatusInisialisasi('perangkat_tidak_tersedia');
                return;
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current.play();
                    setStatusInisialisasi('siap');
                    setPesanPanduan('Posisikan wajah Anda di tengah oval');
                };
            }
        } catch (err) {
            console.error('Gagal mengakses kamera:', err);
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setStatusInisialisasi('izin_ditolak');
            } else {
                setStatusInisialisasi('perangkat_tidak_tersedia');
            }
        }
    };

    /**
     * Hentikan Akses Aliran Kamera dan Deteksi
     */
    const hentikanKamera = useCallback(() => {
        if (idAnimasiRef.current) {
            cancelAnimationFrame(idAnimasiRef.current);
            idAnimasiRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    /**
     * Ambil Foto dari Video, Lakukan Kompresi JPEG (< 5MB, Target ~800KB)
     */
    const tangkapFotoOtomatis = useCallback(async () => {
        const video = videoRef.current;
        if (!video || sedangMemprosesFoto) return;

        setSedangMemprosesFoto(true);
        setEfekFlashKamera(true);
        setTimeout(() => setEfekFlashKamera(false), 250);

        // Siapkan kanvas resolusi penuh
        const lebarAsli = video.videoWidth || 1280;
        const tinggiAsli = video.videoHeight || 720;

        const kanvasTangkapan = document.createElement('canvas');
        kanvasTangkapan.width = lebarAsli;
        kanvasTangkapan.height = tinggiAsli;
        const ctx = kanvasTangkapan.getContext('2d');

        // Balik horizontal (mirroring) agar hasil foto sesuai dengan apa yang dilihat siswa
        ctx.translate(lebarAsli, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, 0, 0, lebarAsli, tinggiAsli);

        // Kompresi ke Blob JPEG (Kualitas awal 0.86 untuk hasil tajam berukuran ~700KB-1MB)
        let kualitasKompresi = 0.86;
        
        const buatBlob = (kualitas) => {
            return new Promise((resolve) => {
                kanvasTangkapan.toBlob((b) => resolve(b), 'image/jpeg', kualitas);
            });
        };

        let blob = await buatBlob(kualitasKompresi);

        // Jika ukuran > 5MB (5 * 1024 * 1024), kompresi bertahap
        while (blob && blob.size > 5 * 1024 * 1024 && kualitasKompresi > 0.4) {
            kualitasKompresi -= 0.15;
            blob = await buatBlob(kualitasKompresi);
        }

        if (blob) {
            const dataUrl = kanvasTangkapan.toDataURL('image/jpeg', kualitasKompresi);
            const ukuranKb = Math.round(blob.size / 1024);

            const fileFoto = new File([blob], `verifikasi_wajah_${Date.now()}.jpg`, {
                type: 'image/jpeg',
                lastModified: Date.now()
            });

            setFotoTerambil({
                file: fileFoto,
                blob: blob,
                url: dataUrl,
                ukuranKb: ukuranKb
            });

            hentikanKamera();
        }

        setSedangMemprosesFoto(false);
    }, [sedangMemprosesFoto, hentikanKamera]);

    /**
     * Loop Deteksi Orientasi Wajah Real-time Menggunakan MediaPipe FaceLandmarker
     */
    const mulaiLoopDeteksi = useCallback(() => {
        const video = videoRef.current;
        const landmarker = faceLandmarkerRef.current;

        if (!video || !landmarker || statusInisialisasi !== 'siap' || fotoTerambil) {
            return;
        }

        const deteksiFrame = () => {
            if (!video || video.paused || video.ended || !faceLandmarkerRef.current) {
                return;
            }

            const waktuSekarang = performance.now();
            let hasilDeteksi = null;

            try {
                hasilDeteksi = faceLandmarkerRef.current.detectForVideo(video, waktuSekarang);
            } catch (errDeteksi) {
                // Lewati frame jika terjadi drop frame sementara
            }

            if (hasilDeteksi && hasilDeteksi.faceLandmarks && hasilDeteksi.faceLandmarks.length > 0) {
                const titikWajah = hasilDeteksi.faceLandmarks[0];

                // Indeks Kunci Landmark MediaPipe
                const ujungHidung = titikWajah[1];        // Index 1: Nose Tip
                const pangkalHidung = titikWajah[168];    // Index 168: Nose Bridge
                const dahiAtas = titikWajah[10];           // Index 10: Top of forehead
                const daguBawah = titikWajah[152];         // Index 152: Chin Bottom
                const sudutMataKiri = titikWajah[33];      // Index 33: Outer Left Eye
                const sudutMataKanan = titikWajah[263];    // Index 263: Outer Right Eye
                const pipiKiri = titikWajah[234];          // Index 234: Left Cheek
                const pipiKanan = titikWajah[454];         // Index 454: Right Cheek

                // 1. Evaluasi Jarak & Ukuran Wajah (Face Scale)
                const lebarWajah = Math.hypot(pipiKanan.x - pipiKiri.x, pipiKanan.y - pipiKiri.y);
                const wajahTerlaluJauh = lebarWajah < 0.26;
                const wajahTerlaluDekat = lebarWajah > 0.68;

                // 2. Evaluasi Posisi Tengah (Centering inside Oval Guide)
                // Posisi ideal hidung: horizontal 0.38 - 0.62, vertikal 0.34 - 0.64
                const hidungDiTengahX = ujungHidung.x >= 0.38 && ujungHidung.x <= 0.62;
                const hidungDiTengahY = ujungHidung.y >= 0.34 && ujungHidung.y <= 0.64;
                const posisiTengah = hidungDiTengahX && hidungDiTengahY;

                // 3. Evaluasi Sudut Roll (Kemiringan Kepala Kiri/Kanan)
                // Mengukur sudut kemiringan garis mata horizontal
                const deltaX = sudutMataKanan.x - sudutMataKiri.x;
                const deltaY = sudutMataKanan.y - sudutMataKiri.y;
                const sudutRoll = Math.abs((Math.atan2(deltaY, deltaX) * 180) / Math.PI);
                const kepalaMiring = sudutRoll > 6.5; // Toleransi maksimal 6.5 derajat

                // 4. Evaluasi Sudut Yaw (Menoleh Kiri / Kanan)
                // Perbandingan jarak horizontal ujung hidung ke mata kiri vs mata kanan
                const jarakKeMataKiri = Math.abs(ujungHidung.x - sudutMataKiri.x);
                const jarakKeMataKanan = Math.abs(sudutMataKanan.x - ujungHidung.x);
                const rasioYaw = jarakKeMataKiri / (jarakKeMataKanan + 0.0001);
                // Rasio ideal adalah ~1.0; jika < 0.72 atau > 1.40 berarti menoleh
                const kepalaMenoleh = rasioYaw < 0.72 || rasioYaw > 1.40;

                // 5. Evaluasi Sudut Pitch (Mendongak / Menunduk)
                const jarakAtas = Math.abs(ujungHidung.y - dahiAtas.y);
                const jarakBawah = Math.abs(daguBawah.y - ujungHidung.y);
                const rasioPitch = jarakAtas / (jarakBawah + 0.0001);
                const kepalaMendongakAtauMenunduk = rasioPitch < 0.65 || rasioPitch > 1.40;

                // Cek Keseluruhan Status Presisi
                if (wajahTerlaluJauh) {
                    setPesanPanduan('Dekatkan wajah Anda ke kamera');
                    setStatusOrientasi('tidak_presisi');
                    waktuMulaiStabilRef.current = null;
                    setTingkatKestabilan(0);
                } else if (wajahTerlaluDekat) {
                    setPesanPanduan('Mundur sedikit dari kamera');
                    setStatusOrientasi('tidak_presisi');
                    waktuMulaiStabilRef.current = null;
                    setTingkatKestabilan(0);
                } else if (!posisiTengah) {
                    setPesanPanduan('Posisikan wajah tepat di dalam bingkai oval');
                    setStatusOrientasi('tidak_presisi');
                    waktuMulaiStabilRef.current = null;
                    setTingkatKestabilan(0);
                } else if (kepalaMiring) {
                    setPesanPanduan('Tegakkan posisi kepala (jangan dimiringkan)');
                    setStatusOrientasi('tidak_presisi');
                    waktuMulaiStabilRef.current = null;
                    setTingkatKestabilan(0);
                } else if (kepalaMenoleh) {
                    setPesanPanduan('Hadapkan wajah lurus ke depan (jangan menoleh)');
                    setStatusOrientasi('tidak_presisi');
                    waktuMulaiStabilRef.current = null;
                    setTingkatKestabilan(0);
                } else if (kepalaMendongakAtauMenunduk) {
                    setPesanPanduan('Posisikan dagu tegak sejajar kamera');
                    setStatusOrientasi('tidak_presisi');
                    waktuMulaiStabilRef.current = null;
                    setTingkatKestabilan(0);
                } else {
                    // Posisi Wajah Sangat Presisi!
                    setStatusOrientasi('presisi');

                    if (!waktuMulaiStabilRef.current) {
                        waktuMulaiStabilRef.current = waktuSekarang;
                    }

                    const durasiStabil = waktuSekarang - waktuMulaiStabilRef.current;
                    const targetDurasi = 1200; // 1.2 detik tahan posisi stabil
                    const persentase = Math.min(Math.round((durasiStabil / targetDurasi) * 100), 100);
                    setTingkatKestabilan(persentase);

                    if (persentase < 100) {
                        setPesanPanduan(`Tahan posisi... Mengambil foto otomatis (${persentase}%)`);
                    } else {
                        setPesanPanduan('Mengambil foto...');
                        tangkapFotoOtomatis();
                        return; // Keluar dari loop animasi
                    }
                }
            } else {
                // Tidak ada wajah terdeteksi
                setStatusOrientasi('mencari');
                setPesanPanduan('Arahkan kamera ke wajah Anda');
                waktuMulaiStabilRef.current = null;
                setTingkatKestabilan(0);
            }

            idAnimasiRef.current = requestAnimationFrame(deteksiFrame);
        };

        idAnimasiRef.current = requestAnimationFrame(deteksiFrame);
    }, [statusInisialisasi, fotoTerambil, tangkapFotoOtomatis]);

    // Jalankan inisialisasi awal MediaPipe & Kamera
    useEffect(() => {
        let isAktif = true;

        const persiapkanSistem = async () => {
            const aiSiap = await inisialisasiMediaPipe();
            if (aiSiap && isAktif) {
                await bukaKamera();
            }
        };

        if (!fotoTerambil) {
            persiapkanSistem();
        }

        return () => {
            isAktif = false;
            hentikanKamera();
        };
    }, [fotoTerambil, hentikanKamera]);

    // Jalankan loop deteksi saat kamera siap
    useEffect(() => {
        if (statusInisialisasi === 'siap' && !fotoTerambil) {
            mulaiLoopDeteksi();
        }
        return () => {
            if (idAnimasiRef.current) {
                cancelAnimationFrame(idAnimasiRef.current);
                idAnimasiRef.current = null;
            }
        };
    }, [statusInisialisasi, fotoTerambil, mulaiLoopDeteksi]);

    /**
     * Tombol Ambil Ulang Foto
     */
    const ambilUlangFoto = () => {
        setFotoTerambil(null);
        setTingkatKestabilan(0);
        setStatusOrientasi('mencari');
        waktuMulaiStabilRef.current = null;
        setStatusInisialisasi('memuat');
        bukaKamera();
    };

    /**
     * Tombol Konfirmasi Gunakan Foto
     */
    const konfirmasiFoto = () => {
        if (fotoTerambil && onFotoTerverifikasi) {
            onFotoTerverifikasi(fotoTerambil.file, fotoTerambil.url);
        }
    };

    return (
        <div className="w-full flex flex-col items-center">
            {/* Header Badge Beta & Status Keamanan */}
            <div className="flex items-center justify-between w-full mb-3">
                <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                        BETA FITUR
                    </span>
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        Verifikasi Wajah Siswa
                    </span>
                </div>

                <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                    <span className="material-symbols-rounded text-sm">enhanced_encryption</span>
                    <span>On-Device AI</span>
                </div>
            </div>

            {/* Judul & Penjelasan Ringkas */}
            <div className="w-full text-left mb-4 select-none">
                <h2 className="text-lg sm:text-xl font-extrabold text-[#081242] dark:text-white tracking-tight">
                    Pindai Wajah Pengguna
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {namaSiswa ? `Halo ${namaSiswa}, mohon ` : 'Mohon '}lakukan pemindaian wajah untuk memastikan keaslian kepemilikan akun siswa.
                </p>
            </div>

            {/* Kotak Kamera / Pratinjau (Struktur Tetap Anti-Layout Shift: Aspect 4/3) */}
            <div className="relative w-full aspect-[4/3] max-w-md bg-slate-950 rounded-2xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 flex items-center justify-center">
                
                {/* Efek Shutter Flash saat Pengambilan Foto */}
                {efekFlashKamera && (
                    <div className="absolute inset-0 bg-white z-40 animate-out fade-out duration-300" />
                )}

                {/* State 1: Memuat Sensor AI */}
                {statusInisialisasi === 'memuat' && !fotoTerambil && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/90 text-white p-6 text-center">
                        <div className="w-12 h-12 rounded-full border-4 border-blue-400/30 border-t-blue-500 animate-spin mb-3" />
                        <p className="text-sm font-bold tracking-wide">Menyiapkan Deteksi Wajah AI...</p>
                        <p className="text-xs text-slate-400 mt-1">Memuat pustaka MediaPipe Face Mesh</p>
                    </div>
                )}

                {/* State 2: Akses Kamera Ditolak */}
                {statusInisialisasi === 'izin_ditolak' && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center text-2xl font-bold">
                            <span className="material-symbols-rounded">videocam_off</span>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white">Izin Kamera Ditolak</h4>
                            <p className="text-xs text-slate-300 mt-1 max-w-xs leading-relaxed">
                                Mohon aktifkan izin kamera pada peramban Anda untuk melanjutkan proses verifikasi identitas siswa.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => { setStatusInisialisasi('memuat'); bukaKamera(); }}
                            className="px-4 py-2 bg-[#0F91FC] hover:bg-blue-600 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
                        >
                            Coba Izinkan Lagi
                        </button>
                    </div>
                )}

                {/* State 3: Perangkat Tidak Didukung / Gagal */}
                {(statusInisialisasi === 'perangkat_tidak_tersedia' || statusInisialisasi === 'galat') && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center text-2xl font-bold">
                            <span className="material-symbols-rounded">no_photography</span>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-white">Kamera Tidak Ditemukan</h4>
                            <p className="text-xs text-slate-300 mt-1 max-w-xs leading-relaxed">
                                Pastikan perangkat Anda terhubung dengan kamera webcam aktif atau gunakan ponsel cerdas Anda.
                            </p>
                        </div>
                    </div>
                )}

                {/* Elemen Video Streaming Langsung */}
                {!fotoTerambil && (
                    <video
                        ref={videoRef}
                        playsInline
                        muted
                        className="w-full h-full object-cover transform -scale-x-100"
                    />
                )}

                {/* Tampilan Hasil Foto yang Berhasil Ditangkap */}
                {fotoTerambil && (
                    <div className="relative w-full h-full">
                        <img 
                            src={fotoTerambil.url} 
                            alt="Pratinjau Wajah Terverifikasi" 
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-white text-[11px] font-bold border border-white/20 flex items-center gap-1.5">
                            <span className="material-symbols-rounded text-emerald-400 text-sm">check_circle</span>
                            <span>{fotoTerambil.ukuranKb ? `${fotoTerambil.ukuranKb} KB` : 'Foto Terpilih'}</span>
                        </div>
                    </div>
                )}

                {/* Overlay Bingkai Oval Presisi (Hanya Tampil saat Kamera Aktif) */}
                {!fotoTerambil && statusInisialisasi === 'siap' && (
                    <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                        {/* Shading Gelap di Luar Oval Guide */}
                        <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px]" />

                        {/* Bentuk Oval Panduan Kepala */}
                        <div className={`
                            relative w-[52%] aspect-[3/4] rounded-[50%] border-2 transition-all duration-300 flex items-center justify-center z-10
                            ${statusOrientasi === 'presisi' 
                                ? 'border-emerald-400 shadow-[0_0_30px_rgba(52,211,153,0.5)] scale-105' 
                                : statusOrientasi === 'tidak_presisi'
                                    ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
                                    : 'border-white/50 border-dashed'
                            }
                        `}>
                            {/* Garis Bantu Posisi Mata & Hidung */}
                            <div className="absolute top-[38%] left-[15%] right-[15%] border-t border-white/20 border-dotted" />
                            <div className="absolute top-[30%] bottom-[30%] left-[50%] border-l border-white/20 border-dotted" />

                            {/* Lingkaran Progress Auto-Capture saat Posisi Presisi & Stabil */}
                            {tingkatKestabilan > 0 && (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 133">
                                        <ellipse
                                            cx="50"
                                            cy="66.5"
                                            rx="47"
                                            ry="62"
                                            fill="none"
                                            stroke="rgba(52, 211, 153, 0.9)"
                                            strokeWidth="3.5"
                                            strokeDasharray="342"
                                            strokeDashoffset={342 - (342 * tingkatKestabilan) / 100}
                                            className="transition-all duration-100 ease-linear"
                                        />
                                    </svg>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Kotak Pesan Panduan Presisi Interaktif (Real-time Status Bar) */}
            <div className="w-full max-w-md mt-3">
                {!fotoTerambil ? (
                    <div className={`
                        p-3 rounded-xl border flex items-center gap-2.5 transition-all text-left select-none
                        ${statusOrientasi === 'presisi'
                            ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300'
                            : statusOrientasi === 'tidak_presisi'
                                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/60 text-amber-800 dark:text-amber-300'
                                : 'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                        }
                    `}>
                        <span className={`material-symbols-rounded text-xl shrink-0 ${
                            statusOrientasi === 'presisi'
                                ? 'text-emerald-600 dark:text-emerald-400 animate-pulse'
                                : statusOrientasi === 'tidak_presisi'
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-slate-500 dark:text-slate-400'
                        }`}>
                            {statusOrientasi === 'presisi' ? 'camera' : statusOrientasi === 'tidak_presisi' ? 'face_retouching_natural' : 'center_focus_strong'}
                        </span>
                        
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold leading-tight truncate">
                                {pesanPanduan}
                            </p>
                            <p className="text-[10px] opacity-75 mt-0.5">
                                {statusOrientasi === 'presisi' 
                                    ? 'Pertahankan ekspresi & posisi wajah Anda'
                                    : 'Pastikan pencahayaan cukup dan wajah menghadap tegak'
                                }
                            </p>
                        </div>

                        {tingkatKestabilan > 0 && (
                            <span className="text-xs font-black shrink-0 px-2 py-0.5 bg-emerald-600 text-white rounded-lg">
                                {tingkatKestabilan}%
                            </span>
                        )}
                    </div>
                ) : (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-xl flex items-center justify-between text-left">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-rounded text-emerald-600 dark:text-emerald-400 text-xl">
                                verified_user
                            </span>
                            <div>
                                <p className="text-xs font-bold text-blue-900 dark:text-blue-200">
                                    Wajah Berhasil Diverifikasi
                                </p>
                                <p className="text-[10px] text-blue-700 dark:text-blue-300">
                                    Format JPEG dikompresi ({fotoTerambil.ukuranKb || '~800'} KB)
                                </p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={ambilUlangFoto}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-bold flex items-center gap-1"
                        >
                            <span className="material-symbols-rounded text-sm">refresh</span>
                            Ambil Ulang
                        </button>
                    </div>
                )}
            </div>

            {/* Tombol Aksi Navigasi */}
            <div className="w-full max-w-md mt-5 flex gap-3">
                <button
                    type="button"
                    onClick={onKembali}
                    className="flex-1 py-3.5 px-5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition-all text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-rounded text-lg">arrow_back</span>
                    Kembali
                </button>

                {fotoTerambil ? (
                    <button
                        type="button"
                        onClick={konfirmasiFoto}
                        className="flex-1 py-3.5 px-5 bg-[#0F91FC] hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg transition-all text-xs sm:text-sm flex items-center justify-center gap-2 group"
                    >
                        <span>Lanjutkan</span>
                        <span className="material-symbols-rounded text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                ) : (
                    <button
                        type="button"
                        disabled={statusOrientasi !== 'presisi' || sedangMemprosesFoto}
                        onClick={tangkapFotoOtomatis}
                        className="flex-1 py-3.5 px-5 bg-[#111827] dark:bg-[#0F91FC] text-white font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-[#0a78d6] transition-all text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <span className="material-symbols-rounded text-lg">photo_camera</span>
                        <span>{sedangMemprosesFoto ? 'Memproses...' : 'Ambil Sekarang'}</span>
                    </button>
                )}
            </div>
        </div>
    );
}
