import React, { useState, useRef } from 'react';
import { Head, router } from '@inertiajs/react';
import TataLetakUtama from '@/Layouts/TataLetakUtama';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import axios from 'axios';

/**
 * Halaman Import Pengguna (Siswa & Guru).
 *
 * Fitur Utama:
 * - Dua tab terpisah: Import Siswa dan Import Guru
 * - Parsing file Excel/CSV di browser menggunakan SheetJS
 * - Batch processing via AJAX (10 baris per batch)
 * - Progress bar SweetAlert2 real-time
 * - Ringkasan hasil import (berhasil & gagal)
 */
export default function ImportPengguna({ adaTahunPelajaranAktif = true, tahunPelajaranAktif = null }) {
    const [tabAktif, setTabAktif] = useState('siswa');
    const [fileSiswa, setFileSiswa] = useState(null);
    const [fileGuru, setFileGuru] = useState(null);
    const [dataPratinjauSiswa, setDataPratinjauSiswa] = useState([]);
    const [dataPratinjauGuru, setDataPratinjauGuru] = useState([]);
    const [sedangMemproses, setSedangMemproses] = useState(false);

    const inputFileSiswaRef = useRef(null);
    const inputFileGuruRef = useRef(null);

    /**
     * Memverifikasi keberadaan tahun pelajaran aktif sebelum melakukan aksi import.
     */
    const meverifikasiTahunPelajaranAktif = () => {
        if (!adaTahunPelajaranAktif) {
            const userRolePath = window.location.pathname.startsWith('/superadmin') ? 'superadmin' : 'admin';
            Swal.fire({
                title: 'Tahun Pelajaran Belum Aktif!',
                text: 'Minimal harus ada 1 Tahun Pelajaran yang ditambahkan dan diaktifkan terlebih dahulu sebelum mengimpor data pengguna.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#000066',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Kelola Tahun Pelajaran',
                cancelButtonText: 'Batal'
            }).then((res) => {
                if (res.isConfirmed) {
                    router.visit(route(`${userRolePath}.tahun-pelajaran.index`));
                }
            });
            return false;
        }
        return true;
    };

    // Kolom yang diharapkan di template
    const kolomSiswa = ['nama_lengkap', 'nik', 'nip_nis', 'tgl_lahir', 'jk', 'no_telp', 'alamat', 'jenjang', 'kelas', 'jurusan'];
    const kolomGuru = ['nama_lengkap', 'nik', 'nip_nis', 'tgl_lahir', 'jk', 'no_telp', 'alamat', 'peran'];

    // Label tampilan kolom yang lebih ramah pengguna
    const labelKolomSiswa = {
        nama_lengkap: 'Nama Lengkap',
        nik: 'NIK',
        nip_nis: 'NISN',
        tgl_lahir: 'Tgl. Lahir',
        jk: 'JK',
        no_telp: 'No. Telp',
        alamat: 'Alamat',
        jenjang: 'Jenjang',
        kelas: 'Kelas',
        jurusan: 'Jurusan',
    };
    const labelKolomGuru = {
        nama_lengkap: 'Nama Lengkap',
        nik: 'NIK',
        nip_nis: 'NIP',
        tgl_lahir: 'Tgl. Lahir',
        jk: 'JK',
        no_telp: 'No. Telp',
        alamat: 'Alamat',
        peran: 'Peran',
    };

    /**
     * Membaca file Excel/CSV dan mengkonversi menjadi array objek.
     * Setiap baris data akan dipetakan ke header kolom yang sesuai.
     */
    const bacaFileExcel = (file, kolomYangDiharapkan) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = new Uint8Array(event.target.result);
                    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                    const namaSheet = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[namaSheet];

                    // Konversi sheet menjadi array of arrays (termasuk header)
                    const barisData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

                    if (barisData.length <= 1) {
                        reject(new Error('File kosong atau hanya berisi header.'));
                        return;
                    }

                    // Petakan header ke index kolom
                    const headerAsli = barisData[0].map(h => String(h).trim().toLowerCase());
                    const dataTerpetakan = [];

                    for (let i = 1; i < barisData.length; i++) {
                        const baris = barisData[i];
                        // Lewati baris kosong
                        if (!baris || baris.every(sel => sel === '' || sel === null || sel === undefined)) {
                            continue;
                        }

                        const objek = { _nomor_baris: i + 1 };
                        kolomYangDiharapkan.forEach(kolom => {
                            const indexKolom = headerAsli.indexOf(kolom.toLowerCase());
                            if (indexKolom !== -1 && indexKolom < baris.length) {
                                let nilai = baris[indexKolom];
                                // Handle Date objects dari SheetJS
                                if (nilai instanceof Date) {
                                    const tahun = nilai.getFullYear();
                                    const bulan = String(nilai.getMonth() + 1).padStart(2, '0');
                                    const hari = String(nilai.getDate()).padStart(2, '0');
                                    nilai = `${tahun}-${bulan}-${hari}`;
                                }
                                objek[kolom] = String(nilai ?? '').trim();
                            } else {
                                objek[kolom] = '';
                            }
                        });

                        dataTerpetakan.push(objek);
                    }

                    resolve(dataTerpetakan);
                } catch (err) {
                    reject(err);
                }
            };
            reader.onerror = () => reject(new Error('Gagal membaca file.'));
            reader.readAsArrayBuffer(file);
        });
    };

    /**
     * Handler ketika file siswa dipilih.
     * Membaca file dan menampilkan pratinjau data.
     */
    const tanganiPilihFileSiswa = async (e) => {
        if (!meverifikasiTahunPelajaranAktif()) {
            e.target.value = '';
            return;
        }
        const file = e.target.files[0];
        if (!file) return;

        setFileSiswa(file);
        try {
            const data = await bacaFileExcel(file, kolomSiswa);
            setDataPratinjauSiswa(data);
        } catch (err) {
            Swal.fire({
                title: 'Gagal Membaca File!',
                text: err.message,
                icon: 'error',
                confirmButtonColor: '#000066',
            });
            setFileSiswa(null);
            setDataPratinjauSiswa([]);
        }
    };

    /**
     * Handler ketika file guru dipilih.
     * Membaca file dan menampilkan pratinjau data.
     */
    const tanganiPilihFileGuru = async (e) => {
        if (!meverifikasiTahunPelajaranAktif()) {
            e.target.value = '';
            return;
        }
        const file = e.target.files[0];
        if (!file) return;

        setFileGuru(file);
        try {
            const data = await bacaFileExcel(file, kolomGuru);
            setDataPratinjauGuru(data);
        } catch (err) {
            Swal.fire({
                title: 'Gagal Membaca File!',
                text: err.message,
                icon: 'error',
                confirmButtonColor: '#000066',
            });
            setFileGuru(null);
            setDataPratinjauGuru([]);
        }
    };

    /**
     * Proses import batch dengan progress bar SweetAlert2.
     * Mengirim data dalam batch kecil (10 baris per request) ke endpoint API.
     */
    const prosesImportBatch = async (dataBaris, tipeImport) => {
        const userRolePath = window.location.pathname.startsWith('/superadmin') ? 'superadmin' : 'admin';
        const endpoint = tipeImport === 'siswa'
            ? `/${userRolePath}/manajemen-pengguna/import-batch-siswa`
            : `/${userRolePath}/manajemen-pengguna/import-batch-guru`;

        const ukuranBatch = 10;
        const totalBaris = dataBaris.length;
        const totalBatch = Math.ceil(totalBaris / ukuranBatch);

        let totalBerhasil = 0;
        let totalGagal = 0;
        let semuaError = [];

        setSedangMemproses(true);

        // Tampilkan SweetAlert2 dengan progress bar
        Swal.fire({
            title: `Mengimpor Data ${tipeImport === 'siswa' ? 'Siswa' : 'Guru'}...`,
            html: `
                <div style="text-align: center;">
                    <p style="margin-bottom: 12px; color: #64748b; font-size: 14px;">
                        Memproses <b id="swal-progres-angka">0</b> dari <b>${totalBaris}</b> data
                    </p>
                    <div style="background: #e2e8f0; border-radius: 999px; height: 12px; overflow: hidden; width: 100%;">
                        <div id="swal-progres-bar" style="background: linear-gradient(90deg, #000066, #0F91FC); height: 100%; width: 0%; border-radius: 999px; transition: width 0.3s ease;"></div>
                    </div>
                    <p style="margin-top: 8px; color: #94a3b8; font-size: 12px;" id="swal-progres-persen">0%</p>
                </div>
            `,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Ambil CSRF token dari meta tag
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

        for (let i = 0; i < totalBatch; i++) {
            const mulai = i * ukuranBatch;
            const akhir = Math.min(mulai + ukuranBatch, totalBaris);
            const batch = dataBaris.slice(mulai, akhir);

            try {
                const response = await axios.post(endpoint, { batch }, {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                        'Accept': 'application/json',
                    }
                });

                const hasil = response.data;
                totalBerhasil += hasil.berhasil || 0;
                totalGagal += hasil.gagal || 0;
                if (hasil.errors && hasil.errors.length > 0) {
                    semuaError = [...semuaError, ...hasil.errors];
                }
            } catch (err) {
                // Jika batch gagal total, tandai semua baris sebagai gagal
                totalGagal += batch.length;
                semuaError.push(`Batch ${i + 1}: ${err.response?.data?.message || err.message}`);
            }

            // Update progress bar
            const sudahDiproses = Math.min(akhir, totalBaris);
            const persentase = Math.round((sudahDiproses / totalBaris) * 100);

            const elAngka = document.getElementById('swal-progres-angka');
            const elBar = document.getElementById('swal-progres-bar');
            const elPersen = document.getElementById('swal-progres-persen');

            if (elAngka) elAngka.textContent = sudahDiproses;
            if (elBar) elBar.style.width = `${persentase}%`;
            if (elPersen) elPersen.textContent = `${persentase}%`;
        }

        setSedangMemproses(false);

        // Tampilkan ringkasan hasil
        const iconHasil = totalGagal === 0 ? 'success' : (totalBerhasil > 0 ? 'warning' : 'error');
        const judulHasil = totalGagal === 0
            ? 'Import Selesai!'
            : (totalBerhasil > 0 ? 'Import Selesai (Sebagian)' : 'Import Gagal!');

        let htmlHasil = `
            <div style="text-align: left; font-size: 14px;">
                <div style="display: flex; gap: 16px; margin-bottom: 16px;">
                    <div style="flex: 1; background: #ecfdf5; border-radius: 12px; padding: 16px; text-align: center;">
                        <div style="font-size: 28px; font-weight: 900; color: #059669;">${totalBerhasil}</div>
                        <div style="font-size: 12px; color: #6b7280; font-weight: 600;">Berhasil</div>
                    </div>
                    <div style="flex: 1; background: #fef2f2; border-radius: 12px; padding: 16px; text-align: center;">
                        <div style="font-size: 28px; font-weight: 900; color: #dc2626;">${totalGagal}</div>
                        <div style="font-size: 12px; color: #6b7280; font-weight: 600;">Gagal</div>
                    </div>
                </div>
        `;

        if (semuaError.length > 0) {
            htmlHasil += `
                <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 12px; max-height: 150px; overflow-y: auto; font-size: 12px; color: #991b1b;">
                    <strong>Detail Error:</strong><br/>
                    ${semuaError.map(e => `• ${e}`).join('<br/>')}
                </div>
            `;
        }

        htmlHasil += '</div>';

        Swal.fire({
            title: judulHasil,
            html: htmlHasil,
            icon: iconHasil,
            confirmButtonColor: '#000066',
            confirmButtonText: 'Tutup',
        }).then(() => {
            // Refresh halaman untuk melihat data terbaru
            if (totalBerhasil > 0) {
                router.reload();
            }
        });

        // Log aktivitas
        if (totalBerhasil > 0) {
            // Reset state file setelah import berhasil
            if (tipeImport === 'siswa') {
                setFileSiswa(null);
                setDataPratinjauSiswa([]);
                if (inputFileSiswaRef.current) inputFileSiswaRef.current.value = '';
            } else {
                setFileGuru(null);
                setDataPratinjauGuru([]);
                if (inputFileGuruRef.current) inputFileGuruRef.current.value = '';
            }
        }
    };

    /**
     * Handler tombol Import Siswa.
     * Menampilkan dialog konfirmasi sebelum memulai proses import batch.
     */
    const mulaiImportSiswa = () => {
        if (!meverifikasiTahunPelajaranAktif()) return;

        if (dataPratinjauSiswa.length === 0) {
            Swal.fire({
                title: 'Tidak Ada Data!',
                text: 'Silakan pilih file Excel/CSV yang berisi data siswa terlebih dahulu.',
                icon: 'warning',
                confirmButtonColor: '#000066',
            });
            return;
        }

        Swal.fire({
            title: `Import ${dataPratinjauSiswa.length} Data Siswa?`,
            text: 'Sistem akan memproses data secara bertahap. Kelas yang belum ada akan dibuat otomatis.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#000066',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Ya, Mulai Import!',
            cancelButtonText: 'Batal',
        }).then((result) => {
            if (result.isConfirmed) {
                prosesImportBatch(dataPratinjauSiswa, 'siswa');
            }
        });
    };

    /**
     * Handler tombol Import Guru.
     * Menampilkan dialog konfirmasi sebelum memulai proses import batch.
     */
    const mulaiImportGuru = () => {
        if (!meverifikasiTahunPelajaranAktif()) return;

        if (dataPratinjauGuru.length === 0) {
            Swal.fire({
                title: 'Tidak Ada Data!',
                text: 'Silakan pilih file Excel/CSV yang berisi data guru terlebih dahulu.',
                icon: 'warning',
                confirmButtonColor: '#000066',
            });
            return;
        }

        Swal.fire({
            title: `Import ${dataPratinjauGuru.length} Data Guru?`,
            text: 'Sistem akan memproses data secara bertahap. Peran yang belum ada akan dibuat otomatis.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#000066',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Ya, Mulai Import!',
            cancelButtonText: 'Batal',
        }).then((result) => {
            if (result.isConfirmed) {
                prosesImportBatch(dataPratinjauGuru, 'guru');
            }
        });
    };

    /**
     * Fungsi helper untuk mendapatkan path role pengguna dari URL saat ini.
     */
    const ambilRolePath = () => {
        return window.location.pathname.startsWith('/superadmin') ? 'superadmin' : 'admin';
    };

    return (
        <>
            <Head title="Import Pengguna" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-slate-800 dark:text-white">
                                Import Pengguna
                            </h1>
                            {tahunPelajaranAktif ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-black uppercase tracking-wide">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Sesi TP Aktif: {tahunPelajaranAktif}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-500/15 text-rose-600 dark:text-rose-400 rounded-full text-xs font-black uppercase tracking-wide">
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                    Belum Ada TP Aktif
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Import massal data siswa dan guru dari file Excel atau CSV.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <a
                            href={route(`${ambilRolePath()}.pengguna.template-siswa`)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all select-none"
                        >
                            <span className="material-symbols-rounded text-sm">download</span>
                            Template Siswa
                        </a>
                        <a
                            href={route(`${ambilRolePath()}.pengguna.template-guru`)}
                            className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-md transition-all select-none"
                        >
                            <span className="material-symbols-rounded text-sm">download</span>
                            Template Guru
                        </a>
                    </div>
                </div>

                {/* Tab Navigasi */}
                <div className="flex gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl">
                    <button
                        onClick={() => setTabAktif('siswa')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                            tabAktif === 'siswa'
                                ? 'bg-[#000066] text-white shadow-lg'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                        }`}
                    >
                        <span className="material-symbols-rounded text-base">school</span>
                        Import Siswa
                    </button>
                    <button
                        onClick={() => setTabAktif('guru')}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
                            tabAktif === 'guru'
                                ? 'bg-[#000066] text-white shadow-lg'
                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                        }`}
                    >
                        <span className="material-symbols-rounded text-base">person</span>
                        Import Guru
                    </button>
                </div>

                {/* Konten Tab Import Siswa */}
                {tabAktif === 'siswa' && (
                    <div className="space-y-6">
                        {/* Area Upload File */}
                        <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-xl p-6 space-y-4">
                            <div className="flex items-center gap-3 pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                                    <span className="material-symbols-rounded text-emerald-500">upload_file</span>
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-800 dark:text-white">Upload File Siswa</h3>
                                    <p className="text-xs text-slate-400">Format: .xlsx, .xls, .csv • Kolom wajib: nama_lengkap, nik, nip_nis, tgl_lahir</p>
                                </div>
                            </div>

                            <div
                                onClick={() => inputFileSiswaRef.current?.click()}
                                className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center cursor-pointer hover:border-[#000066] hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-all"
                            >
                                <span className="material-symbols-rounded text-4xl text-slate-300 dark:text-slate-600 mb-2 block">cloud_upload</span>
                                {fileSiswa ? (
                                    <div>
                                        <p className="font-bold text-slate-700 dark:text-slate-200">{fileSiswa.name}</p>
                                        <p className="text-xs text-slate-400 mt-1">{dataPratinjauSiswa.length} baris data terdeteksi</p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="font-bold text-slate-500 dark:text-slate-400">Klik untuk memilih file</p>
                                        <p className="text-xs text-slate-400 mt-1">atau seret dan lepas file Excel/CSV di sini</p>
                                    </div>
                                )}
                                <input
                                    ref={inputFileSiswaRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={tanganiPilihFileSiswa}
                                    className="hidden"
                                />
                            </div>

                            {dataPratinjauSiswa.length > 0 && (
                                <button
                                    onClick={mulaiImportSiswa}
                                    disabled={sedangMemproses}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#000066] hover:bg-blue-950 text-white rounded-2xl font-bold text-sm shadow-lg transition-all disabled:opacity-50"
                                >
                                    <span className="material-symbols-rounded text-base">rocket_launch</span>
                                    {sedangMemproses ? 'Sedang Memproses...' : `Mulai Import ${dataPratinjauSiswa.length} Siswa`}
                                </button>
                            )}
                        </div>

                        {/* Tabel Pratinjau Data Siswa */}
                        {dataPratinjauSiswa.length > 0 && (
                            <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-xl p-6">
                                <h3 className="font-extrabold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                    <span className="material-symbols-rounded text-[#0F91FC]">preview</span>
                                    Pratinjau Data ({dataPratinjauSiswa.length} baris)
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-200/50 dark:border-slate-800/50 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                                                <th className="px-4 py-3 w-12">NO</th>
                                                {kolomSiswa.map(k => (
                                                    <th key={k} className="px-4 py-3">{labelKolomSiswa[k]}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200/30 dark:divide-slate-800/30 text-xs">
                                            {dataPratinjauSiswa.slice(0, 50).map((baris, i) => (
                                                <tr key={i} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                                                    <td className="px-4 py-3 font-bold text-slate-400">{i + 1}</td>
                                                    {kolomSiswa.map(k => (
                                                        <td key={k} className="px-4 py-3 text-slate-700 dark:text-slate-300 max-w-[200px] truncate">
                                                            {baris[k] || <span className="text-slate-300 dark:text-slate-600">-</span>}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {dataPratinjauSiswa.length > 50 && (
                                        <p className="text-xs text-slate-400 text-center py-3 font-bold">
                                            ...dan {dataPratinjauSiswa.length - 50} baris lainnya (hanya menampilkan 50 baris pertama)
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Konten Tab Import Guru */}
                {tabAktif === 'guru' && (
                    <div className="space-y-6">
                        {/* Area Upload File */}
                        <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-xl p-6 space-y-4">
                            <div className="flex items-center gap-3 pb-4 border-b border-slate-200/50 dark:border-slate-800/50">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                                    <span className="material-symbols-rounded text-amber-500">upload_file</span>
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-800 dark:text-white">Upload File Guru</h3>
                                    <p className="text-xs text-slate-400">Format: .xlsx, .xls, .csv • Kolom wajib: nama_lengkap, nik, nip_nis, tgl_lahir</p>
                                </div>
                            </div>

                            <div
                                onClick={() => inputFileGuruRef.current?.click()}
                                className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 text-center cursor-pointer hover:border-[#000066] hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-all"
                            >
                                <span className="material-symbols-rounded text-4xl text-slate-300 dark:text-slate-600 mb-2 block">cloud_upload</span>
                                {fileGuru ? (
                                    <div>
                                        <p className="font-bold text-slate-700 dark:text-slate-200">{fileGuru.name}</p>
                                        <p className="text-xs text-slate-400 mt-1">{dataPratinjauGuru.length} baris data terdeteksi</p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="font-bold text-slate-500 dark:text-slate-400">Klik untuk memilih file</p>
                                        <p className="text-xs text-slate-400 mt-1">atau seret dan lepas file Excel/CSV di sini</p>
                                    </div>
                                )}
                                <input
                                    ref={inputFileGuruRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv"
                                    onChange={tanganiPilihFileGuru}
                                    className="hidden"
                                />
                            </div>

                            {dataPratinjauGuru.length > 0 && (
                                <button
                                    onClick={mulaiImportGuru}
                                    disabled={sedangMemproses}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#000066] hover:bg-blue-950 text-white rounded-2xl font-bold text-sm shadow-lg transition-all disabled:opacity-50"
                                >
                                    <span className="material-symbols-rounded text-base">rocket_launch</span>
                                    {sedangMemproses ? 'Sedang Memproses...' : `Mulai Import ${dataPratinjauGuru.length} Guru`}
                                </button>
                            )}
                        </div>

                        {/* Tabel Pratinjau Data Guru */}
                        {dataPratinjauGuru.length > 0 && (
                            <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-xl p-6">
                                <h3 className="font-extrabold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                                    <span className="material-symbols-rounded text-[#0F91FC]">preview</span>
                                    Pratinjau Data ({dataPratinjauGuru.length} baris)
                                </h3>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-200/50 dark:border-slate-800/50 text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-wider">
                                                <th className="px-4 py-3 w-12">NO</th>
                                                {kolomGuru.map(k => (
                                                    <th key={k} className="px-4 py-3">{labelKolomGuru[k]}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-200/30 dark:divide-slate-800/30 text-xs">
                                            {dataPratinjauGuru.slice(0, 50).map((baris, i) => (
                                                <tr key={i} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                                                    <td className="px-4 py-3 font-bold text-slate-400">{i + 1}</td>
                                                    {kolomGuru.map(k => (
                                                        <td key={k} className="px-4 py-3 text-slate-700 dark:text-slate-300 max-w-[200px] truncate">
                                                            {baris[k] || <span className="text-slate-300 dark:text-slate-600">-</span>}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                    {dataPratinjauGuru.length > 50 && (
                                        <p className="text-xs text-slate-400 text-center py-3 font-bold">
                                            ...dan {dataPratinjauGuru.length - 50} baris lainnya (hanya menampilkan 50 baris pertama)
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Panduan Format */}
                <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border border-slate-200/50 dark:border-slate-800/50 rounded-3xl overflow-hidden shadow-xl p-6">
                    <h3 className="font-extrabold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <span className="material-symbols-rounded text-amber-500">info</span>
                        Panduan Format Import
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6 text-xs text-slate-600 dark:text-slate-400">
                        <div className="space-y-3">
                            <h4 className="font-black text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                                <span className="material-symbols-rounded text-base">school</span>
                                Template Siswa
                            </h4>
                            <div className="space-y-1.5">
                                <p><span className="font-bold text-rose-500">*</span> <span className="font-bold">nama_lengkap</span> — Nama siswa (wajib)</p>
                                <p><span className="font-bold text-rose-500">*</span> <span className="font-bold">nik</span> — NIK 16 digit (wajib)</p>
                                <p><span className="font-bold text-rose-500">*</span> <span className="font-bold">nip_nis</span> — NISN siswa (wajib)</p>
                                <p><span className="font-bold text-rose-500">*</span> <span className="font-bold">tgl_lahir</span> — Format: YYYY-MM-DD (wajib)</p>
                                <p><span className="font-bold">jk</span> — L (Laki-laki) atau P (Perempuan)</p>
                                <p><span className="font-bold">no_telp</span> — Nomor telepon</p>
                                <p><span className="font-bold">alamat</span> — Alamat lengkap</p>
                                <p><span className="font-bold">jenjang</span> — Tingkat kelas, contoh: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">XII</code></p>
                                <p><span className="font-bold">kelas</span> — Nama kelas lengkap, contoh: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">XII IPA 1</code></p>
                                <p><span className="font-bold">jurusan</span> — Jurusan kelas, contoh: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">IPA</code></p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h4 className="font-black text-sm text-amber-600 dark:text-amber-400 flex items-center gap-2">
                                <span className="material-symbols-rounded text-base">person</span>
                                Template Guru
                            </h4>
                            <div className="space-y-1.5">
                                <p><span className="font-bold text-rose-500">*</span> <span className="font-bold">nama_lengkap</span> — Nama guru (wajib)</p>
                                <p><span className="font-bold text-rose-500">*</span> <span className="font-bold">nik</span> — NIK 16 digit (wajib)</p>
                                <p><span className="font-bold text-rose-500">*</span> <span className="font-bold">nip_nis</span> — NIP guru (wajib)</p>
                                <p><span className="font-bold text-rose-500">*</span> <span className="font-bold">tgl_lahir</span> — Format: YYYY-MM-DD (wajib)</p>
                                <p><span className="font-bold">jk</span> — L (Laki-laki) atau P (Perempuan)</p>
                                <p><span className="font-bold">no_telp</span> — Nomor telepon</p>
                                <p><span className="font-bold">alamat</span> — Alamat lengkap</p>
                                <p><span className="font-bold">peran</span> — Pisahkan dengan koma. Contoh: <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">Guru, Wali Kelas</code>. Kosongkan untuk default "Guru".</p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/50 rounded-2xl">
                        <p className="text-xs text-blue-700 dark:text-blue-300 font-bold flex items-start gap-2">
                            <span className="material-symbols-rounded text-sm mt-0.5">lightbulb</span>
                            <span>Sistem secara otomatis mendeteksi duplikasi berdasarkan <strong>NIK</strong> atau <strong>NIP/NISN</strong>. Jika data sudah ada, sistem hanya akan memperbarui informasi yang berubah tanpa membuat akun baru.</span>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

ImportPengguna.layout = (page) => (
    <TataLetakUtama children={page} title="Import Pengguna" />
);
