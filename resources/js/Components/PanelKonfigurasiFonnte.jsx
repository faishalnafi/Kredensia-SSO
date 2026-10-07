import React, { useState } from 'react';
import InputError from '@/Components/InputError';
import Swal from 'sweetalert2';

const TEMPLATE_BAWAAN = "*[{aplikasi} - VERIFIKASI KEAMANAN]*\n\nHalo *{nama}*,\nKode OTP verifikasi masuk Anda adalah:\n\n*{otp}*\n\nKode ini berlaku selama *{menit} menit* (hingga {waktu} WIB). Jangan berikan kode ini kepada siapa pun.";

const DAFTAR_VARIABEL = [
    { tag: '{otp}', label: 'Kode OTP 6 Digit', contoh: '849201' },
    { tag: '{nama}', label: 'Nama Pengguna', contoh: 'Budi Santoso, S.Pd.' },
    { tag: '{email}', label: 'Email Pengguna', contoh: 'budi@sekolah.sch.id' },
    { tag: '{no_telp}', label: 'No. Telepon', contoh: '081234567890' },
    { tag: '{aplikasi}', label: 'Nama Aplikasi', contoh: 'SSO Sekolah' },
    { tag: '{menit}', label: 'Masa Berlaku (Menit)', contoh: '10' },
    { tag: '{waktu}', label: 'Jam Kadaluarsa', contoh: '14:30' },
];

export default function PanelKonfigurasiFonnte({
    data,
    setData,
    errors = {},
    defaultTemplate = TEMPLATE_BAWAAN,
    namaAplikasi = 'SSO Sekolah',
    tampilkanTombolSimpanMandiri = false,
    sedangMenyimpan = false,
    onSimpanMandiri = null,
}) {
    const [tampilToken, setTampilToken] = useState(false);
    const [sedangCekDevice, setSedangCekDevice] = useState(false);
    const [infoDevice, setInfoDevice] = useState(null);
    const [nomorUji, setNomorUji] = useState('');
    const [sedangUjiKirim, setSedangUjiKirim] = useState(false);
    const [hasilUji, setHasilUji] = useState(null);

    const sisipkanVariabel = (tag) => {
        const nilaiSaatIni = data.wa_fonnte_message_template || '';
        setData('wa_fonnte_message_template', `${nilaiSaatIni}${nilaiSaatIni.endsWith(' ') || nilaiSaatIni === '' ? '' : ' '}${tag}`);
    };

    const resetTemplateDefault = () => {
        setData('wa_fonnte_message_template', defaultTemplate || TEMPLATE_BAWAAN);
    };

    const renderPratinjauPesan = () => {
        const mentah = data.wa_fonnte_message_template || defaultTemplate || TEMPLATE_BAWAAN;
        return mentah
            .replace(/\{\{?otp\}\}?/g, '849201')
            .replace(/\{\{?nama\}\}?/g, 'Budi Santoso, S.Pd.')
            .replace(/\{\{?email\}\}?/g, 'budi@sekolah.sch.id')
            .replace(/\{\{?no_telp\}\}?/g, nomorUji || '081234567890')
            .replace(/\{\{?aplikasi\}\}?/g, namaAplikasi || 'SSO Sekolah')
            .replace(/\{\{?menit(_berlaku)?\}\}?/g, '10')
            .replace(/\{\{?waktu\}\}?/g, '14:30');
    };

    const tanganiCekDevice = async () => {
        if (!data.wa_fonnte_token || data.wa_fonnte_token.trim() === '') {
            Swal.fire({
                title: 'Token Belum Diisi',
                text: 'Masukkan Token API Perangkat Fonnte (Authorization) terlebih dahulu untuk memeriksa status koneksi.',
                icon: 'warning',
                confirmButtonColor: '#0F91FC',
                customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5' },
            });
            return;
        }

        setSedangCekDevice(true);
        setInfoDevice(null);

        try {
            const response = await window.axios.post(route('superadmin.two-factor.fonnte.cek-device'), {
                wa_fonnte_token: data.wa_fonnte_token,
            });
            const res = response.data;
            setInfoDevice(res);

            if (res?.perangkat?.nomor && !data.wa_fonnte_sender) {
                setData('wa_fonnte_sender', String(res.perangkat.nomor));
            }
        } catch (err) {
            const pesanError = err?.response?.data?.pesan || err?.message || 'Gagal memeriksa status perangkat Fonnte.';
            setInfoDevice({
                berhasil: false,
                pesan: pesanError,
                perangkat: err?.response?.data?.perangkat || {},
            });
        } finally {
            setSedangCekDevice(false);
        }
    };

    const tanganiUjiKirim = async () => {
        if (!nomorUji || nomorUji.trim() === '') {
            Swal.fire({
                title: 'Nomor Tujuan Kosong',
                text: 'Masukkan nomor WhatsApp tujuan (contoh: 08123456789) untuk menerima pesan OTP simulasi.',
                icon: 'warning',
                confirmButtonColor: '#0F91FC',
                customClass: { popup: 'rounded-3xl', confirmButton: 'rounded-xl font-bold px-5 py-2.5' },
            });
            return;
        }

        setSedangUjiKirim(true);
        setHasilUji(null);

        try {
            const response = await window.axios.post(route('superadmin.two-factor.fonnte.uji-kirim'), {
                nomor_tujuan: nomorUji.trim(),
                wa_fonnte_api_url: data.wa_fonnte_api_url,
                wa_fonnte_token: data.wa_fonnte_token,
                wa_fonnte_country_code: data.wa_fonnte_country_code,
                wa_fonnte_delay: data.wa_fonnte_delay,
                wa_fonnte_typing: data.wa_fonnte_typing,
                wa_fonnte_message_template: data.wa_fonnte_message_template,
            });

            setHasilUji({
                berhasil: true,
                pesan: response.data?.pesan || 'Pesan uji coba berhasil dikirim ke antrean Fonnte!',
                otp: response.data?.otp_simulasi,
                detail: response.data?.detail,
            });
        } catch (err) {
            setHasilUji({
                berhasil: false,
                pesan: err?.response?.data?.pesan || err?.response?.data?.message || 'Gagal mengirim pesan uji coba ke Fonnte.',
                detail: err?.response?.data?.detail || null,
            });
        } finally {
            setSedangUjiKirim(false);
        }
    };

    return (
        <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 lg:p-8 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-6">
            {/* Header Panel Fonnte */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-700/50">
                <div className="flex items-start gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/50 flex items-center justify-center shrink-0">
                        <span className="material-symbols-rounded text-2xl">chat</span>
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">
                                Konfigurasi API WhatsApp Gateway (Fonnte)
                            </h3>
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                                Dinamis Tanpa Hardcode
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            Atur kredensial API Fonnte (<a href="https://fonnte.com" target="_blank" rel="noreferrer" className="text-[#0F91FC] hover:underline font-semibold">fonnte.com</a>), nomor perangkat pengirim, parameter pengiriman, serta template pesan OTP WhatsApp secara fleksibel.
                        </p>
                    </div>
                </div>

                {/* Sakelar Aktifkan Gateway Fonnte */}
                <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {data.wa_fonnte_enabled ? 'Gateway Aktif' : 'Gateway Nonaktif'}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={Boolean(data.wa_fonnte_enabled)}
                            onChange={(e) => setData('wa_fonnte_enabled', e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className="w-12 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5.5 after:w-5.5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-500"></div>
                    </label>
                </div>
            </div>

            {/* Grid Konfigurasi Kredensial & Parameter API Fonnte */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Endpoint URL API Fonnte */}
                <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Endpoint URL API Fonnte <span className="text-rose-500">*</span>
                        </label>
                        {data.wa_fonnte_api_url !== 'https://api.fonnte.com/send' && (
                            <button
                                type="button"
                                onClick={() => setData('wa_fonnte_api_url', 'https://api.fonnte.com/send')}
                                className="text-[11px] font-bold text-[#0F91FC] hover:underline cursor-pointer"
                            >
                                Reset ke Default
                            </button>
                        )}
                    </div>
                    <input
                        type="url"
                        value={data.wa_fonnte_api_url || ''}
                        onChange={(e) => setData('wa_fonnte_api_url', e.target.value)}
                        placeholder="https://api.fonnte.com/send"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm font-mono focus:border-[#0F91FC] focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-400">
                        Standar resmi Fonnte: <code className="text-slate-600 dark:text-slate-300">https://api.fonnte.com/send</code>
                    </p>
                    <InputError message={errors.wa_fonnte_api_url} />
                </div>

                {/* Nomor WhatsApp Pengirim / Device */}
                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Nomor WhatsApp Pengirim (Device)
                    </label>
                    <input
                        type="text"
                        value={data.wa_fonnte_sender || ''}
                        onChange={(e) => setData('wa_fonnte_sender', e.target.value)}
                        placeholder="Contoh: 081234567890 / 6281234567890"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm font-mono focus:border-[#0F91FC] focus:outline-none"
                    />
                    <p className="text-[11px] text-slate-400">
                        Nomor perangkat WhatsApp yang ditautkan pada akun Fonnte (otomatis terisi saat klik Cek Perangkat).
                    </p>
                    <InputError message={errors.wa_fonnte_sender} />
                </div>

                {/* Token API Perangkat Fonnte (Authorization) */}
                <div className="md:col-span-2 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Token API Perangkat Fonnte (<code className="text-[#0F91FC]">Authorization</code> Header) <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2.5">
                        <div className="relative flex-1">
                            <input
                                type={tampilToken ? 'text' : 'password'}
                                value={data.wa_fonnte_token || ''}
                                onChange={(e) => setData('wa_fonnte_token', e.target.value)}
                                placeholder="Masukkan Device Token dari menu Devices di dashboard Fonnte"
                                className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm font-mono focus:border-[#0F91FC] focus:outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => setTampilToken(!tampilToken)}
                                className="absolute inset-y-0 right-0 px-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                                title={tampilToken ? 'Sembunyikan Token' : 'Tampilkan Token'}
                            >
                                <span className="material-symbols-rounded text-lg">
                                    {tampilToken ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={tanganiCekDevice}
                            disabled={sedangCekDevice}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 transition-all cursor-pointer shrink-0 disabled:opacity-50"
                        >
                            <span className={`material-symbols-rounded text-base ${sedangCekDevice ? 'animate-spin' : ''}`}>
                                {sedangCekDevice ? 'sync' : 'perm_phone_msg'}
                            </span>
                            {sedangCekDevice ? 'Memeriksa Fonnte...' : 'Cek Status Perangkat Fonnte'}
                        </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                        Salin <b>Token</b> dari menu <b>Devices</b> di <a href="https://md.fonnte.com/new/device.php" target="_blank" rel="noreferrer" className="text-[#0F91FC] hover:underline">Dashboard Fonnte</a>. Dikirimkan pada header HTTP <code className="text-slate-600 dark:text-slate-300">Authorization: TOKEN</code>.
                    </p>
                    <InputError message={errors.wa_fonnte_token} />

                    {/* Hasil Cek Status Perangkat Fonnte */}
                    {infoDevice && (
                        <div className={`mt-3 p-4 rounded-2xl border text-xs space-y-2 ${
                            infoDevice.berhasil && infoDevice.perangkat?.terhubung
                                ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200'
                                : infoDevice.berhasil
                                ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200'
                                : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60 text-rose-900 dark:text-rose-200'
                        }`}>
                            <div className="flex items-center gap-2 font-bold">
                                <span className="material-symbols-rounded text-base">
                                    {infoDevice.berhasil && infoDevice.perangkat?.terhubung ? 'check_circle' : infoDevice.berhasil ? 'warning' : 'error'}
                                </span>
                                <span>{infoDevice.pesan}</span>
                            </div>

                            {infoDevice.berhasil && infoDevice.perangkat && (
                                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
                                    <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-black/5 dark:border-white/5">
                                        <div className="text-[10px] uppercase text-slate-400 font-bold">Nama Device</div>
                                        <div className="font-extrabold text-slate-800 dark:text-white truncate">{infoDevice.perangkat.nama}</div>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-black/5 dark:border-white/5">
                                        <div className="text-[10px] uppercase text-slate-400 font-bold">Nomor WA</div>
                                        <div className="font-extrabold font-mono text-slate-800 dark:text-white truncate">{infoDevice.perangkat.nomor}</div>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-black/5 dark:border-white/5">
                                        <div className="text-[10px] uppercase text-slate-400 font-bold">Status Koneksi</div>
                                        <div className="font-extrabold uppercase text-slate-800 dark:text-white">{infoDevice.perangkat.status_koneksi}</div>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-black/5 dark:border-white/5">
                                        <div className="text-[10px] uppercase text-slate-400 font-bold">Paket</div>
                                        <div className="font-extrabold text-slate-800 dark:text-white">{infoDevice.perangkat.paket}</div>
                                    </div>
                                    <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-900/60 border border-black/5 dark:border-white/5">
                                        <div className="text-[10px] uppercase text-slate-400 font-bold">Sisa Kuota</div>
                                        <div className="font-extrabold text-slate-800 dark:text-white">{infoDevice.perangkat.kuota_tersisa} Pesan</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Parameter Pengiriman Fonnte: Country Code, Delay, Typing */}
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                    {/* Country Code */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Kode Negara (<code className="text-[#0F91FC]">countryCode</code>)
                        </label>
                        <input
                            type="text"
                            value={data.wa_fonnte_country_code || ''}
                            onChange={(e) => setData('wa_fonnte_country_code', e.target.value)}
                            placeholder="62"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm font-mono focus:border-[#0F91FC] focus:outline-none"
                        />
                        <p className="text-[11px] text-slate-400">
                            Default <code className="text-slate-600 dark:text-slate-300">62</code> (Indonesia). Mengubah awalan <code className="text-slate-600 dark:text-slate-300">08xx</code> otomatis di sisi Fonnte.
                        </p>
                        <InputError message={errors.wa_fonnte_country_code} />
                    </div>

                    {/* Delay */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Jeda Kirim (<code className="text-[#0F91FC]">delay</code> detik)
                        </label>
                        <input
                            type="text"
                            value={data.wa_fonnte_delay || ''}
                            onChange={(e) => setData('wa_fonnte_delay', e.target.value)}
                            placeholder="1 atau 1-3"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-sm font-mono focus:border-[#0F91FC] focus:outline-none"
                        />
                        <p className="text-[11px] text-slate-400">
                            Jeda pengiriman dalam detik (contoh: <code className="text-slate-600 dark:text-slate-300">1</code> atau acak <code className="text-slate-600 dark:text-slate-300">1-3</code>).
                        </p>
                        <InputError message={errors.wa_fonnte_delay} />
                    </div>

                    {/* Typing Indicator */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Efek Mengetik (<code className="text-[#0F91FC]">typing</code>)
                        </label>
                        <div
                            onClick={() => setData('wa_fonnte_typing', !data.wa_fonnte_typing)}
                            className={`px-4 py-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                                data.wa_fonnte_typing
                                    ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/30'
                                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900'
                            }`}
                        >
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                {data.wa_fonnte_typing ? 'Aktif (Sedang mengetik...)' : 'Nonaktif'}
                            </span>
                            <span className={`material-symbols-rounded text-lg ${data.wa_fonnte_typing ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {data.wa_fonnte_typing ? 'toggle_on' : 'toggle_off'}
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                            Menampilkan indikator sedang mengetik sebelum pesan masuk.
                        </p>
                    </div>
                </div>
            </div>

            {/* Editor Template Pesan OTP WhatsApp & Live Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                {/* Kolom Kiri: Editor Template */}
                <div className="lg:col-span-7 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                                Template Pesan OTP WhatsApp (<code className="text-[#0F91FC]">message</code>) <span className="text-rose-500">*</span>
                            </label>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                                Klik badge variabel di bawah untuk menyisipkan data dinamis ke dalam pesan:
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={resetTemplateDefault}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        >
                            <span className="material-symbols-rounded text-sm">restart_alt</span>
                            Reset Template Bawaan
                        </button>
                    </div>

                    {/* Tombol Chip Variabel Placeholder */}
                    <div className="flex flex-wrap gap-1.5">
                        {DAFTAR_VARIABEL.map((v) => (
                            <button
                                key={v.tag}
                                type="button"
                                onClick={() => sisipkanVariabel(v.tag)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-[#0F91FC] dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/50 transition-all cursor-pointer"
                                title={`Sisipkan ${v.label} (Contoh: ${v.contoh})`}
                            >
                                <span className="font-mono">{v.tag}</span>
                                <span className="text-[10px] text-slate-400 dark:text-slate-400 font-normal">({v.label})</span>
                            </button>
                        ))}
                    </div>

                    <textarea
                        rows={6}
                        value={data.wa_fonnte_message_template || ''}
                        onChange={(e) => setData('wa_fonnte_message_template', e.target.value)}
                        placeholder={TEMPLATE_BAWAAN}
                        className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-white text-xs sm:text-sm font-mono leading-relaxed focus:border-[#0F91FC] focus:outline-none"
                    />
                    <InputError message={errors.wa_fonnte_message_template} />
                </div>

                {/* Kolom Kanan: Pratinjau WhatsApp & Uji Kirim Langsung */}
                <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                    {/* Pratinjau Bubble Chat WhatsApp */}
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Pratinjau Pesan di WhatsApp Penerima
                        </label>
                        <div className="p-4 rounded-2xl bg-[#efeae2] dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/70 shadow-inner">
                            <div className="bg-white dark:bg-emerald-950/70 rounded-2xl rounded-tl-none p-3.5 shadow-sm border border-slate-100 dark:border-emerald-800/40 space-y-1.5">
                                <div className="flex items-center justify-between text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                    <span>{data.wa_fonnte_sender || 'Gateway WhatsApp Sekolah'}</span>
                                    <span>Sekarang</span>
                                </div>
                                <div className="text-xs text-slate-800 dark:text-slate-100 whitespace-pre-wrap leading-relaxed font-sans">
                                    {renderPratinjauPesan()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Kotak Uji Kirim Pesan WhatsApp */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/60 space-y-2.5">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-rounded text-emerald-600 text-lg">send_to_mobile</span>
                            <span className="text-xs font-extrabold text-slate-800 dark:text-white">
                                Uji Kirim Pesan OTP WhatsApp (Fonnte)
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={nomorUji}
                                onChange={(e) => setNomorUji(e.target.value)}
                                placeholder="No. WA Tujuan (0812xxxx)"
                                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white text-xs font-mono focus:border-[#0F91FC] focus:outline-none"
                            />
                            <button
                                type="button"
                                onClick={tanganiUjiKirim}
                                disabled={sedangUjiKirim}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer shrink-0 disabled:opacity-50"
                            >
                                <span className="material-symbols-rounded text-sm">send</span>
                                {sedangUjiKirim ? 'Mengirim...' : 'Uji Kirim'}
                            </button>
                        </div>

                        {hasilUji && (
                            <div className={`p-2.5 rounded-xl text-[11px] font-semibold flex items-start gap-2 ${
                                hasilUji.berhasil
                                    ? 'bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                    : 'bg-rose-100/80 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                            }`}>
                                <span className="material-symbols-rounded text-sm shrink-0 mt-0.5">
                                    {hasilUji.berhasil ? 'check_circle' : 'error'}
                                </span>
                                <div>
                                    <div>{hasilUji.pesan}</div>
                                    {hasilUji.otp && (
                                        <div className="mt-0.5 font-mono text-[10px] opacity-80">
                                            Kode OTP Simulasi: <b>{hasilUji.otp}</b>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {tampilkanTombolSimpanMandiri && onSimpanMandiri && (
                <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-700/50">
                    <button
                        type="button"
                        onClick={onSimpanMandiri}
                        disabled={sedangMenyimpan}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                    >
                        <span className="material-symbols-rounded text-lg">save</span>
                        {sedangMenyimpan ? 'Menyimpan Konfigurasi Fonnte...' : 'Simpan Konfigurasi WhatsApp Fonnte'}
                    </button>
                </div>
            )}
        </div>
    );
}
