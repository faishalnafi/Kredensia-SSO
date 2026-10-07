import React, { useState, useEffect } from 'react';
import { Head, useForm, router, usePage } from '@inertiajs/react';
import TataLetakUtama from '@/Layouts/TataLetakUtama';
import InputError from '@/Components/InputError';

export default function PengaturanSistem({ pengaturan, callbackUri, defaultEmailTemplates = {} }) {
    const { auth, flash } = usePage().props;
    const [logoPreview, setLogoPreview] = useState(pengaturan.logo_primer_url || 'https://support.nafii.my.id/icon/domains.png');
    const [faviconPreview, setFaviconPreview] = useState(pengaturan.favicon_url || 'https://support.nafii.my.id/icon/domains.png');
    const [logoError, setLogoError] = useState(false);
    const [faviconError, setFaviconError] = useState(false);
    const [statusSalin, setStatusSalin] = useState(false);

    // State untuk Konfigurasi Email Gmail & Template
    const [tabTemplateEmail, setTabTemplateEmail] = useState('otp'); // 'otp' | 'reset'
    const [tampilkanSandiSmtp, setTampilkanSandiSmtp] = useState(false);
    const [tampilkanKodeHtml, setTampilkanKodeHtml] = useState(false);
    const [tampilkanPreviewEmail, setTampilkanPreviewEmail] = useState(true);
    const [emailUjiCoba, setEmailUjiCoba] = useState(auth?.user?.email || '');
    const [sedangUjiEmail, setSedangUjiEmail] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        nama_aplikasi: pengaturan.nama_aplikasi || '',
        logo_primer: null,
        favicon: null,
        google_client_id: pengaturan.google_client_id || '',
        google_client_secret: pengaturan.google_client_secret || '',
        batas_request_per_menit: pengaturan.batas_request_per_menit ?? 2500,
        storage_provider: pengaturan.storage_provider || 'local',
        s3_key: pengaturan.s3_key || '',
        s3_secret: pengaturan.s3_secret || '',
        s3_bucket: pengaturan.s3_bucket || '',
        s3_region: pengaturan.s3_region || '',
        s3_endpoint: pengaturan.s3_endpoint || '',
        s3_use_path_style_endpoint: pengaturan.s3_use_path_style_endpoint ?? false,
        // Konfigurasi SMTP Gmail Pribadi & Template Email
        smtp_enabled: Boolean(pengaturan.smtp_enabled ?? false),
        smtp_host: pengaturan.smtp_host || 'smtp.gmail.com',
        smtp_port: pengaturan.smtp_port ?? 587,
        smtp_encryption: pengaturan.smtp_encryption || 'tls',
        smtp_username: pengaturan.smtp_username || '',
        smtp_password: pengaturan.smtp_password || '',
        smtp_from_address: pengaturan.smtp_from_address || '',
        smtp_from_name: pengaturan.smtp_from_name || pengaturan.nama_aplikasi || 'SSO Sekolah',
        email_otp_subject: pengaturan.email_otp_subject || defaultEmailTemplates?.otp_subject || 'Kode Verifikasi Keamanan (OTP) - {nama_aplikasi}',
        email_otp_message: pengaturan.email_otp_message || defaultEmailTemplates?.otp_message || '',
        email_otp_template: pengaturan.email_otp_template || defaultEmailTemplates?.otp_template || '',
        email_reset_subject: pengaturan.email_reset_subject || defaultEmailTemplates?.reset_subject || 'Permintaan Atur Ulang Kata Sandi - {nama_aplikasi}',
        email_reset_message: pengaturan.email_reset_message || defaultEmailTemplates?.reset_message || '',
        email_reset_template: pengaturan.email_reset_template || defaultEmailTemplates?.reset_template || '',
        email_custom_templates: Array.isArray(pengaturan.email_custom_templates) ? pengaturan.email_custom_templates : [],
    });

    // Sinkronkan tampilan ketika prop pengaturan diperbarui secara real-time dari perangkat lain
    useEffect(() => {
        if (!processing && !data.logo_primer && pengaturan?.logo_primer_url) {
            setLogoPreview(pengaturan.logo_primer_url);
        }
        if (!processing && !data.favicon && pengaturan?.favicon_url) {
            setFaviconPreview(pengaturan.favicon_url);
        }
    }, [pengaturan?.logo_primer_url, pengaturan?.favicon_url]);

    const tanganiLogoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('logo_primer', file);
            setLogoPreview(URL.createObjectURL(file));
            setLogoError(false); // Reset error status
        }
    };

    const tanganiFaviconChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('favicon', file);
            setFaviconPreview(URL.createObjectURL(file));
            setFaviconError(false); // Reset error status
        }
    };

    const salinCallbackUrl = () => {
        navigator.clipboard.writeText(callbackUri);
        setStatusSalin(true);
        setTimeout(() => setStatusSalin(false), 2000);
    };

    const tanganiSubmit = (e) => {
        e.preventDefault();
        // Gunakan post karena PHP terkadang memiliki masalah parsing multipart data pada metode PUT
        post(route('superadmin.pengaturan.perbarui'), {
            preserveScroll: true
        });
    };

    const indexTemplateKustomAktif = (data.email_custom_templates || []).findIndex(
        item => item.kode === tabTemplateEmail
    );
    const itemTemplateKustomAktif = indexTemplateKustomAktif >= 0
        ? data.email_custom_templates[indexTemplateKustomAktif]
        : null;

    const perbaruiFieldTemplateKustom = (index, field, nilai) => {
        const daftarBaru = [...(data.email_custom_templates || [])];
        if (!daftarBaru[index]) return;
        daftarBaru[index] = {
            ...daftarBaru[index],
            [field]: nilai,
        };
        setData('email_custom_templates', daftarBaru);
        if (field === 'kode') {
            setTabTemplateEmail(nilai);
        }
    };

    const tambahTemplateEmailBaru = () => {
        const urutan = (data.email_custom_templates || []).length + 1;
        const kodeBaru = `notifikasi_${urutan}`;
        const itemBaru = {
            kode: kodeBaru,
            label: `Template Baru ${urutan}`,
            subject: 'Notifikasi Sistem - {nama_aplikasi}',
            message: "Halo *{nama}*,\n\nIni adalah pesan notifikasi otomatis untuk akun SSO Anda ({email}).",
            template: defaultEmailTemplates?.general_template || defaultEmailTemplates?.otp_template || '',
        };
        setData('email_custom_templates', [...(data.email_custom_templates || []), itemBaru]);
        setTabTemplateEmail(kodeBaru);
    };

    const hapusTemplateKustom = (index) => {
        const daftarBaru = (data.email_custom_templates || []).filter((_, i) => i !== index);
        setData('email_custom_templates', daftarBaru);
        setTabTemplateEmail('otp');
    };

    const sisipkanPlaceholder = (fieldKey, placeholder) => {
        if (indexTemplateKustomAktif >= 0) {
            const pesanSekarang = itemTemplateKustomAktif?.message || '';
            perbaruiFieldTemplateKustom(
                indexTemplateKustomAktif,
                'message',
                `${pesanSekarang}${pesanSekarang.endsWith(' ') || pesanSekarang === '' ? '' : ' '}${placeholder}`
            );
            return;
        }
        const nilaiSaatIni = data[fieldKey] || '';
        setData(fieldKey, `${nilaiSaatIni}${nilaiSaatIni.endsWith(' ') || nilaiSaatIni === '' ? '' : ' '}${placeholder}`);
    };

    const resetTemplateKeDefault = (jenis) => {
        if (jenis === 'otp') {
            setData(prev => ({
                ...prev,
                email_otp_subject: defaultEmailTemplates?.otp_subject || 'Kode Verifikasi Keamanan (OTP) - {nama_aplikasi}',
                email_otp_message: defaultEmailTemplates?.otp_message || '',
                email_otp_template: defaultEmailTemplates?.otp_template || '',
            }));
        } else if (jenis === 'reset') {
            setData(prev => ({
                ...prev,
                email_reset_subject: defaultEmailTemplates?.reset_subject || 'Permintaan Atur Ulang Kata Sandi - {nama_aplikasi}',
                email_reset_message: defaultEmailTemplates?.reset_message || '',
                email_reset_template: defaultEmailTemplates?.reset_template || '',
            }));
        } else if (indexTemplateKustomAktif >= 0) {
            perbaruiFieldTemplateKustom(
                indexTemplateKustomAktif,
                'template',
                defaultEmailTemplates?.general_template || defaultEmailTemplates?.otp_template || ''
            );
        }
    };

    const kirimEmailUji = () => {
        if (!emailUjiCoba) return;
        setSedangUjiEmail(true);
        router.post(
            route('superadmin.pengaturan.uji-email'),
            {
                email_tujuan: emailUjiCoba,
                jenis_template: tabTemplateEmail,
            },
            {
                preserveScroll: true,
                onFinish: () => setSedangUjiEmail(false),
            }
        );
    };

    // Helper pratinjau live HTML email
    const bangunPreviewHtmlEmail = (jenis) => {
        const variabelContoh = {
            '{nama}': 'Ahmad Fauzi',
            '{email}': 'ahmad.fauzi@gmail.com',
            '{username}': 'ahmad_fauzi',
            '{uuid}': '9c82f1a0-1234-4b5c-89ab-001122334455',
            '{otp}': '482910',
            '{kode_otp}': '482910',
            '{token}': '482910',
            '{reset_url}': `${window.location.origin}/reset-password/contoh-token-pemulihan?email=ahmad.fauzi@gmail.com`,
            '{tautan_reset}': `${window.location.origin}/reset-password/contoh-token-pemulihan?email=ahmad.fauzi@gmail.com`,
            '{berlaku_menit}': jenis === 'otp' ? '10' : '60',
            '{nama_aplikasi}': data.nama_aplikasi || 'SSO Sekolah',
            '{tahun}': String(new Date().getFullYear()),
            '{waktu}': new Date().toLocaleString('id-ID'),
        };

        const gantiSemua = (teks, mapVar) => {
            let hasil = String(teks || '');
            Object.entries(mapVar).forEach(([kunci, nilai]) => {
                hasil = hasil.split(kunci).join(nilai);
            });
            return hasil;
        };

        let subjekMentah = data.email_otp_subject;
        let pesanMentah = data.email_otp_message;
        let htmlMentah = data.email_otp_template;

        if (jenis === 'reset') {
            subjekMentah = data.email_reset_subject;
            pesanMentah = data.email_reset_message;
            htmlMentah = data.email_reset_template;
        } else if (itemTemplateKustomAktif) {
            subjekMentah = itemTemplateKustomAktif.subject;
            pesanMentah = itemTemplateKustomAktif.message;
            htmlMentah = itemTemplateKustomAktif.template;
        }

        const subjekFinal = gantiSemua(subjekMentah, variabelContoh);
        const pesanFinal = gantiSemua(pesanMentah, variabelContoh);

        // Escape HTML dasar pada isi pesan lalu ubah *tebal* menjadi <strong> dan \n menjadi <br>
        const pesanAman = pesanFinal
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\*([^\*\n]+)\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br />');

        const htmlFinal = gantiSemua(htmlMentah, {
            ...variabelContoh,
            '{subjek}': subjekFinal,
            '{isi_pesan}': pesanAman,
        });

        return { subjekFinal, htmlFinal };
    };

    const previewAktif = bangunPreviewHtmlEmail(tabTemplateEmail);

    return (
        <>
            <Head title="Pengaturan Sistem - SSO Sekolah" />
            
            <form onSubmit={tanganiSubmit} className="w-full max-w-4xl mx-auto space-y-6">
                
                {/* Notifikasi Sukses / Error Uji Email */}
                {flash?.success && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 px-5 py-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-sm">
                        <span className="material-symbols-rounded text-lg text-emerald-600 dark:text-emerald-400">check_circle</span>
                        <span>{flash.success}</span>
                    </div>
                )}
                {errors?.uji_email && (
                    <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 px-5 py-3.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 shadow-sm">
                        <span className="material-symbols-rounded text-lg text-rose-600 dark:text-rose-400">error</span>
                        <span>{errors.uji_email}</span>
                    </div>
                )}

                {/* Panel Identitas Platform */}
                <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 lg:p-8 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Identitas Platform</h2>
                        <p className="text-xs text-slate-400 mt-1">Konfigurasi nama aplikasi, logo, dan favicon yang akan digunakan secara global pada sistem SSO.</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-2">
                                Nama Aplikasi <span className="text-red-500">*</span>
                            </label>
                            <input 
                                type="text" 
                                value={data.nama_aplikasi}
                                onChange={e => setData('nama_aplikasi', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white"
                                required
                            />
                            <p className="text-xs text-slate-400 mt-1.5">Nama ini akan digunakan pada judul halaman login dan navigasi sistem.</p>
                            <InputError message={errors.nama_aplikasi} className="mt-1" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                            {/* Logo Primer */}
                            <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-700/30 rounded-2xl p-5 space-y-3">
                                <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Logo Primer</span>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-2.5 flex items-center justify-center shadow-inner">
                                        {logoPreview && !logoError ? (
                                            <img 
                                                src={logoPreview} 
                                                onError={() => setLogoError(true)} 
                                                className="max-w-full max-h-full object-contain" 
                                                alt="Logo Primer" 
                                            />
                                        ) : (
                                            <span className="material-symbols-rounded text-2xl text-slate-400">
                                                image_not_supported
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <label className="relative inline-flex items-center justify-center px-4 py-2 bg-[#0F91FC]/10 hover:bg-[#0f91fc]/20 text-[#0F91FC] text-xs font-bold rounded-xl cursor-pointer transition-colors border border-transparent hover:border-[#0F91FC]/20">
                                            <span>Pilih Berkas</span>
                                            <input 
                                                type="file" 
                                                accept="image/*"
                                                onChange={tanganiLogoChange}
                                                className="sr-only" 
                                            />
                                        </label>
                                        <span className="block text-[10px] text-slate-400 mt-1">PNG, JPG (Maks. 5MB)</span>
                                    </div>
                                </div>
                                <InputError message={errors.logo_primer} className="mt-1" />
                            </div>

                            {/* Favicon */}
                            <div className="bg-slate-50/50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-700/30 rounded-2xl p-5 space-y-3">
                                <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Favicon</span>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-700 p-3.5 flex items-center justify-center shadow-inner">
                                        {faviconPreview && !faviconError ? (
                                            <img 
                                                src={faviconPreview} 
                                                onError={() => setFaviconError(true)} 
                                                className="max-w-full max-h-full object-contain" 
                                                alt="Favicon" 
                                            />
                                        ) : (
                                            <span className="material-symbols-rounded text-2xl text-slate-400">
                                                image_not_supported
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <label className="relative inline-flex items-center justify-center px-4 py-2 bg-[#0F91FC]/10 hover:bg-[#0f91fc]/20 text-[#0F91FC] text-xs font-bold rounded-xl cursor-pointer transition-colors border border-transparent hover:border-[#0F91FC]/20">
                                            <span>Pilih Berkas</span>
                                            <input 
                                                type="file" 
                                                accept="image/*,.ico"
                                                onChange={tanganiFaviconChange}
                                                className="sr-only" 
                                            />
                                        </label>
                                        <span className="block text-[10px] text-slate-400 mt-1">ICO, PNG (Maks. 1MB)</span>
                                    </div>
                                </div>
                                <InputError message={errors.favicon} className="mt-1" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Panel Konfigurasi Email (Gmail Pribadi / SMTP) & Template Pesan (OTP & Reset Sandi) */}
                <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 lg:p-8 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700/50">
                        <div>
                            <div className="flex items-center gap-2.5">
                                <span className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-800/50 flex items-center justify-center text-[#0F91FC]">
                                    <span className="material-symbols-rounded text-xl">mail</span>
                                </span>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Konfigurasi Email (Gmail Pribadi) & Template Pesan</h2>
                                    <p className="text-xs text-slate-400 mt-0.5">Gunakan akun Gmail pribadi (App Password) untuk mengirim kode OTP keamanan serta tautan Reset Kata Sandi.</p>
                                </div>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center gap-3 cursor-pointer select-none bg-slate-50 dark:bg-slate-900/60 px-4 py-2.5 rounded-2xl border border-slate-200/70 dark:border-slate-700">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                {data.smtp_enabled ? 'SMTP Gmail Aktif' : 'SMTP Nonaktif'}
                            </span>
                            <input
                                type="checkbox"
                                checked={data.smtp_enabled}
                                onChange={e => setData('smtp_enabled', e.target.checked)}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[10px] after:right-[18px] peer-checked:after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-[#0F91FC]"></div>
                        </label>
                    </div>

                    {/* Panduan Singkat Gmail App Password */}
                    <div className="bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/50 rounded-2xl p-4 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="font-bold text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                                <span className="material-symbols-rounded text-base">verified_user</span>
                                Cara Menggunakan Gmail Pribadi (Sandi Aplikasi / App Password 16 Karakter):
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setData(prev => ({
                                            ...prev,
                                            smtp_enabled: true,
                                            smtp_host: 'smtp.gmail.com',
                                            smtp_port: 587,
                                            smtp_encryption: 'tls',
                                        }));
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 text-[11px] font-bold text-[#0F91FC] hover:bg-blue-50 transition-colors"
                                >
                                    Preset Gmail TLS (587)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setData(prev => ({
                                            ...prev,
                                            smtp_enabled: true,
                                            smtp_host: 'smtp.gmail.com',
                                            smtp_port: 465,
                                            smtp_encryption: 'ssl',
                                        }));
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:bg-blue-50 transition-colors"
                                >
                                    Preset Gmail SSL (465)
                                </button>
                            </div>
                        </div>
                        <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                            <li>Buka pengaturan <strong>Akun Google Pribadi</strong> Anda &rarr; aktifkan <strong>Verifikasi 2 Langkah (2-Step Verification)</strong>.</li>
                            <li>Kunjungi halaman <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noreferrer" className="text-[#0F91FC] font-bold underline">Google App Passwords (myaccount.google.com/apppasswords)</a>, buat sandi aplikasi baru (misal: <em>SSO Sekolah</em>).</li>
                            <li>Salin <strong>16 karakter Sandi Aplikasi</strong> yang muncul, lalu tempelkan pada kolom <strong>App Password Gmail</strong> di bawah ini (spasi otomatis diabaikan).</li>
                        </ol>
                    </div>

                    {/* Grid Kredensial SMTP Gmail */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-1.5">
                                SMTP Host
                            </label>
                            <input
                                type="text"
                                value={data.smtp_host}
                                onChange={e => setData('smtp_host', e.target.value)}
                                placeholder="smtp.gmail.com"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white font-mono"
                            />
                            <InputError message={errors.smtp_host} className="mt-1" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-1.5">
                                Port SMTP
                            </label>
                            <input
                                type="number"
                                value={data.smtp_port}
                                onChange={e => setData('smtp_port', e.target.value)}
                                placeholder="587"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white font-mono"
                            />
                            <InputError message={errors.smtp_port} className="mt-1" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-1.5">
                                Enkripsi Keamanan
                            </label>
                            <select
                                value={data.smtp_encryption}
                                onChange={e => setData('smtp_encryption', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white"
                            >
                                <option value="tls">TLS / STARTTLS (Port 587 - Disarankan)</option>
                                <option value="ssl">SSL / TLS Implicit (Port 465)</option>
                                <option value="none">Tanpa Enkripsi (None)</option>
                            </select>
                            <InputError message={errors.smtp_encryption} className="mt-1" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-1.5">
                                Alamat Gmail Pengirim (Username)
                            </label>
                            <input
                                type="email"
                                value={data.smtp_username}
                                onChange={e => {
                                    const val = e.target.value;
                                    setData(prev => ({
                                        ...prev,
                                        smtp_username: val,
                                        smtp_from_address: prev.smtp_from_address ? prev.smtp_from_address : val,
                                    }));
                                }}
                                placeholder="nama.anda@gmail.com"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white font-mono"
                            />
                            <InputError message={errors.smtp_username} className="mt-1" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-1.5">
                                App Password Gmail (16 Digit)
                            </label>
                            <div className="relative">
                                <input
                                    type={tampilkanSandiSmtp ? 'text' : 'password'}
                                    value={data.smtp_password}
                                    onChange={e => setData('smtp_password', e.target.value)}
                                    placeholder="abcd efgh ijkl mnop"
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white font-mono"
                                />
                                <button
                                    type="button"
                                    onClick={() => setTampilkanSandiSmtp(!tampilkanSandiSmtp)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                >
                                    <span className="material-symbols-rounded text-base">
                                        {tampilkanSandiSmtp ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                            <InputError message={errors.smtp_password} className="mt-1" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-1.5">
                                Nama Pengirim (From Name)
                            </label>
                            <input
                                type="text"
                                value={data.smtp_from_name}
                                onChange={e => setData('smtp_from_name', e.target.value)}
                                placeholder="SSO Sekolah"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white"
                            />
                            <InputError message={errors.smtp_from_name} className="mt-1" />
                        </div>
                    </div>

                    {/* Bagian Editor Template & Isi Chat Email (Send OTP, Reset Kata Sandi, & Template Modular Baru) */}
                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700/50 space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                                    Kustomisasi Isi Chat & Kode Template Email (Modular)
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Atur template untuk <strong>Send OTP</strong>, <strong>Reset Kata Sandi</strong>, atau tambahkan template baru kapan saja tanpa perlu build ulang dari awal.
                                </p>
                            </div>

                            {/* Pemilih Tab Template: OTP, Reset Password, & Template Kustom */}
                            <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200/70 dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setTabTemplateEmail('otp')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                        tabTemplateEmail === 'otp'
                                            ? 'bg-white dark:bg-slate-800 text-[#0F91FC] shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                    }`}
                                >
                                    <span className="material-symbols-rounded text-sm">pin</span>
                                    <span>1. Send OTP (2FA)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setTabTemplateEmail('reset')}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                        tabTemplateEmail === 'reset'
                                            ? 'bg-white dark:bg-slate-800 text-[#0F91FC] shadow-sm'
                                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                    }`}
                                >
                                    <span className="material-symbols-rounded text-sm">lock_reset</span>
                                    <span>2. Reset Kata Sandi</span>
                                </button>
                                {(data.email_custom_templates || []).map((item, idx) => (
                                    <button
                                        key={`${item.kode}-${idx}`}
                                        type="button"
                                        onClick={() => setTabTemplateEmail(item.kode)}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                            tabTemplateEmail === item.kode
                                                ? 'bg-white dark:bg-slate-800 text-[#0F91FC] shadow-sm'
                                                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                                        }`}
                                    >
                                        <span className="material-symbols-rounded text-sm">drafts</span>
                                        <span>{item.label || item.kode}</span>
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={tambahTemplateEmailBaru}
                                    className="px-2.5 py-1.5 rounded-lg text-xs font-bold bg-[#0F91FC]/10 hover:bg-[#0F91FC]/20 text-[#0F91FC] transition-all flex items-center gap-1"
                                    title="Tambah konfigurasi template email baru"
                                >
                                    <span className="material-symbols-rounded text-sm">add</span>
                                    <span>Template Baru</span>
                                </button>
                            </div>
                        </div>

                        {/* Daftar Variabel Placeholder yang Dapat Diklik */}
                        <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-700/70 rounded-2xl p-3.5 space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                    Variabel Dinamis (Klik untuk menyisipkan ke Isi Chat / Pesan):
                                </span>
                                <button
                                    type="button"
                                    onClick={() => resetTemplateKeDefault(tabTemplateEmail)}
                                    className="text-[11px] font-bold text-amber-600 hover:text-amber-700 dark:text-amber-400 flex items-center gap-1"
                                >
                                    <span className="material-symbols-rounded text-sm">restart_alt</span>
                                    <span>Kembalikan Template ke Default</span>
                                </button>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                                {[
                                    { tag: '{nama}', ket: 'Nama Pengguna' },
                                    { tag: '{email}', ket: 'Email Pengguna' },
                                    { tag: '{username}', ket: 'Username' },
                                    { tag: '{otp}', ket: tabTemplateEmail === 'otp' ? 'Kode OTP 6 Digit' : 'Kode Token / OTP' },
                                    ...(tabTemplateEmail !== 'otp' ? [{ tag: '{reset_url}', ket: 'Tautan Aksi / Reset' }] : []),
                                    { tag: '{berlaku_menit}', ket: 'Masa Berlaku (Menit)' },
                                    { tag: '{nama_aplikasi}', ket: 'Nama Aplikasi' },
                                    { tag: '{waktu}', ket: 'Waktu Kirim' },
                                ].map(item => (
                                    <button
                                        key={item.tag}
                                        type="button"
                                        onClick={() =>
                                            sisipkanPlaceholder(
                                                tabTemplateEmail === 'otp' ? 'email_otp_message' : 'email_reset_message',
                                                item.tag
                                            )
                                        }
                                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#0F91FC] text-[11px] font-mono text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors"
                                        title={`Sisipkan ${item.tag} (${item.ket})`}
                                    >
                                        <span className="font-bold text-[#0F91FC]">{item.tag}</span>
                                        <span className="text-[10px] font-sans text-slate-400">{item.ket}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Form Editor Subjek, Isi Chat, dan Kode HTML sesuai Tab */}
                        {tabTemplateEmail === 'otp' ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-1.5">
                                        Subjek Email OTP
                                    </label>
                                    <input
                                        type="text"
                                        value={data.email_otp_subject}
                                        onChange={e => setData('email_otp_subject', e.target.value)}
                                        placeholder="Kode Verifikasi Keamanan (OTP) - {nama_aplikasi}"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white"
                                    />
                                    <InputError message={errors.email_otp_subject} className="mt-1" />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">
                                            Isi Chat / Pesan Utama Email OTP (<code className="text-[#0F91FC]">{'{isi_pesan}'}</code>)
                                        </label>
                                        <span className="text-[10px] text-slate-400">Gunakan *teks* untuk cetak tebal</span>
                                    </div>
                                    <textarea
                                        rows={5}
                                        value={data.email_otp_message}
                                        onChange={e => setData('email_otp_message', e.target.value)}
                                        placeholder="Masukkan isi pesan/chat untuk pengiriman OTP..."
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white leading-relaxed"
                                    />
                                    <InputError message={errors.email_otp_message} className="mt-1" />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">
                                            Kode Template HTML Email OTP
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setTampilkanKodeHtml(!tampilkanKodeHtml)}
                                            className="text-xs font-bold text-[#0F91FC] hover:underline flex items-center gap-1"
                                        >
                                            <span className="material-symbols-rounded text-sm">code</span>
                                            <span>{tampilkanKodeHtml ? 'Sembunyikan Editor Kode HTML' : 'Ubah Kode Template HTML'}</span>
                                        </button>
                                    </div>
                                    {tampilkanKodeHtml && (
                                        <div className="space-y-1.5">
                                            <textarea
                                                rows={12}
                                                value={data.email_otp_template}
                                                onChange={e => setData('email_otp_template', e.target.value)}
                                                className="w-full bg-slate-900 text-emerald-300 border border-slate-700 rounded-xl px-4 py-3 text-xs font-mono focus:outline-none focus:border-[#0F91FC] leading-relaxed"
                                            />
                                            <p className="text-[10px] text-slate-400">
                                                Pastikan menyertakan placeholder <code className="text-[#0F91FC] font-bold">{'{isi_pesan}'}</code> dan <code className="text-[#0F91FC] font-bold">{'{otp}'}</code> di dalam kode HTML Anda.
                                            </p>
                                        </div>
                                    )}
                                    <InputError message={errors.email_otp_template} className="mt-1" />
                                </div>
                            </div>
                        ) : tabTemplateEmail === 'reset' ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-1.5">
                                        Subjek Email Reset Kata Sandi
                                    </label>
                                    <input
                                        type="text"
                                        value={data.email_reset_subject}
                                        onChange={e => setData('email_reset_subject', e.target.value)}
                                        placeholder="Permintaan Atur Ulang Kata Sandi - {nama_aplikasi}"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white"
                                    />
                                    <InputError message={errors.email_reset_subject} className="mt-1" />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">
                                            Isi Chat / Pesan Utama Email Reset Kata Sandi (<code className="text-[#0F91FC]">{'{isi_pesan}'}</code>)
                                        </label>
                                        <span className="text-[10px] text-slate-400">Gunakan *teks* untuk cetak tebal</span>
                                    </div>
                                    <textarea
                                        rows={5}
                                        value={data.email_reset_message}
                                        onChange={e => setData('email_reset_message', e.target.value)}
                                        placeholder="Masukkan isi pesan/chat untuk pemulihan kata sandi..."
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white leading-relaxed"
                                    />
                                    <InputError message={errors.email_reset_message} className="mt-1" />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">
                                            Kode Template HTML Email Reset Kata Sandi
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setTampilkanKodeHtml(!tampilkanKodeHtml)}
                                            className="text-xs font-bold text-[#0F91FC] hover:underline flex items-center gap-1"
                                        >
                                            <span className="material-symbols-rounded text-sm">code</span>
                                            <span>{tampilkanKodeHtml ? 'Sembunyikan Editor Kode HTML' : 'Ubah Kode Template HTML'}</span>
                                        </button>
                                    </div>
                                    {tampilkanKodeHtml && (
                                        <div className="space-y-1.5">
                                            <textarea
                                                rows={12}
                                                value={data.email_reset_template}
                                                onChange={e => setData('email_reset_template', e.target.value)}
                                                className="w-full bg-slate-900 text-emerald-300 border border-slate-700 rounded-xl px-4 py-3 text-xs font-mono focus:outline-none focus:border-[#0F91FC] leading-relaxed"
                                            />
                                            <p className="text-[10px] text-slate-400">
                                                Pastikan menyertakan placeholder <code className="text-[#0F91FC] font-bold">{'{isi_pesan}'}</code> dan <code className="text-[#0F91FC] font-bold">{'{reset_url}'}</code> di dalam kode HTML Anda.
                                            </p>
                                        </div>
                                    )}
                                    <InputError message={errors.email_reset_template} className="mt-1" />
                                </div>
                            </div>
                        ) : itemTemplateKustomAktif ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-1.5">
                                            Kode Identifier Template (Slug)
                                        </label>
                                        <input
                                            type="text"
                                            value={itemTemplateKustomAktif.kode}
                                            onChange={e =>
                                                perbaruiFieldTemplateKustom(
                                                    indexTemplateKustomAktif,
                                                    'kode',
                                                    e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '_')
                                                )
                                            }
                                            placeholder="contoh: notifikasi_login"
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-[#0F91FC] dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">
                                                Nama Label Tab
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => hapusTemplateKustom(indexTemplateKustomAktif)}
                                                className="text-[11px] font-bold text-rose-500 hover:underline flex items-center gap-1"
                                            >
                                                <span className="material-symbols-rounded text-xs">delete</span>
                                                <span>Hapus Template Ini</span>
                                            </button>
                                        </div>
                                        <input
                                            type="text"
                                            value={itemTemplateKustomAktif.label}
                                            onChange={e => perbaruiFieldTemplateKustom(indexTemplateKustomAktif, 'label', e.target.value)}
                                            placeholder="Contoh: Notifikasi Login Baru"
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white"
                                        />
                                    </div>
                                </div>

                                <div className="bg-slate-900 text-slate-200 rounded-xl px-4 py-2.5 text-[11px] font-mono flex items-center justify-between gap-2">
                                    <span>
                                        Pemanggilan Backend: <code className="text-emerald-400">app(\App\Services\LayananEmail::class)-&gt;kirimDariKodeTemplate('{itemTemplateKustomAktif.kode}', $user, $variabel);</code>
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-1.5">
                                        Subjek Email ({itemTemplateKustomAktif.label})
                                    </label>
                                    <input
                                        type="text"
                                        value={itemTemplateKustomAktif.subject}
                                        onChange={e => perbaruiFieldTemplateKustom(indexTemplateKustomAktif, 'subject', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">
                                            Isi Chat / Pesan Utama (<code className="text-[#0F91FC]">{'{isi_pesan}'}</code>)
                                        </label>
                                        <span className="text-[10px] text-slate-400">Gunakan *teks* untuk cetak tebal</span>
                                    </div>
                                    <textarea
                                        rows={5}
                                        value={itemTemplateKustomAktif.message}
                                        onChange={e => perbaruiFieldTemplateKustom(indexTemplateKustomAktif, 'message', e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white leading-relaxed"
                                    />
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider">
                                            Kode Template HTML ({itemTemplateKustomAktif.label})
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setTampilkanKodeHtml(!tampilkanKodeHtml)}
                                            className="text-xs font-bold text-[#0F91FC] hover:underline flex items-center gap-1"
                                        >
                                            <span className="material-symbols-rounded text-sm">code</span>
                                            <span>{tampilkanKodeHtml ? 'Sembunyikan Editor Kode HTML' : 'Ubah Kode Template HTML'}</span>
                                        </button>
                                    </div>
                                    {tampilkanKodeHtml && (
                                        <textarea
                                            rows={12}
                                            value={itemTemplateKustomAktif.template}
                                            onChange={e => perbaruiFieldTemplateKustom(indexTemplateKustomAktif, 'template', e.target.value)}
                                            className="w-full bg-slate-900 text-emerald-300 border border-slate-700 rounded-xl px-4 py-3 text-xs font-mono focus:outline-none focus:border-[#0F91FC] leading-relaxed"
                                        />
                                    )}
                                </div>
                            </div>
                        ) : null}

                        {/* Pratinjau Visual Email (Live Preview) */}
                        <div className="border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden bg-slate-50/70 dark:bg-slate-900/40">
                            <div className="px-4 py-3 bg-slate-100/80 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
                                    <span className="material-symbols-rounded text-base text-[#0F91FC]">visibility</span>
                                    <span>Pratinjau Tampilan Email ({tabTemplateEmail}):</span>
                                    <span className="font-normal text-slate-500 dark:text-slate-400 truncate max-w-xs sm:max-w-md">
                                        {previewAktif.subjekFinal}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setTampilkanPreviewEmail(!tampilkanPreviewEmail)}
                                    className="text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400"
                                >
                                    {tampilkanPreviewEmail ? 'Sembunyikan' : 'Tampilkan'}
                                </button>
                            </div>
                            {tampilkanPreviewEmail && (
                                <div className="p-3 bg-slate-100 dark:bg-slate-950">
                                    <iframe
                                        title="Pratinjau Email"
                                        srcDoc={previewAktif.htmlFinal}
                                        className="w-full h-[420px] rounded-xl bg-white border border-slate-200 dark:border-slate-800"
                                        sandbox="allow-same-origin"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Baris Uji Coba Pengiriman Email */}
                        <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700/70 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="space-y-0.5">
                                <span className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                                    Uji Coba Pengiriman Email ({tabTemplateEmail === 'otp' ? 'Template OTP' : 'Template Reset Kata Sandi'})
                                </span>
                                <span className="block text-[11px] text-slate-400">
                                    Pastikan Anda telah menekan tombol <strong>Simpan Perubahan</strong> sebelum mengirim email uji coba.
                                </span>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <input
                                    type="email"
                                    value={emailUjiCoba}
                                    onChange={e => setEmailUjiCoba(e.target.value)}
                                    placeholder="Masukkan email tujuan uji coba"
                                    className="flex-1 sm:w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#0F91FC] dark:text-white"
                                />
                                <button
                                    type="button"
                                    disabled={sedangUjiEmail || !emailUjiCoba}
                                    onClick={kirimEmailUji}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 dark:bg-[#0F91FC] dark:hover:bg-[#0a78d6] text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
                                >
                                    <span className="material-symbols-rounded text-sm">send</span>
                                    <span>{sedangUjiEmail ? 'Mengirim...' : 'Kirim Uji Coba'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Panel Integrasi Google OAuth2 */}
                <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 lg:p-8 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Integrasi Google OAuth2</h2>
                        <p className="text-xs text-slate-400 mt-1">Konfigurasi ini memungkinkan pengguna untuk saling-taut akun dan login menggunakan Google Single Sign-On dengan mulus.</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-2">
                                Google Client ID
                            </label>
                            <input 
                                type="text" 
                                value={data.google_client_id}
                                onChange={e => setData('google_client_id', e.target.value)}
                                placeholder="Masukkan Google Client ID dari Google Cloud Console"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white font-mono"
                            />
                            <InputError message={errors.google_client_id} className="mt-1" />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-2">
                                Google Client Secret
                            </label>
                            <input 
                                type="password" 
                                value={data.google_client_secret}
                                onChange={e => setData('google_client_secret', e.target.value)}
                                placeholder="Masukkan Google Client Secret"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white font-mono"
                            />
                            <InputError message={errors.google_client_secret} className="mt-1" />
                        </div>

                        <div className="pt-2">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-2">
                                Authorized Redirect / Callback URI
                            </label>
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs font-mono text-[#0F91FC] overflow-x-auto select-all">
                                    {callbackUri}
                                </div>
                                <button 
                                    type="button"
                                    onClick={salinCallbackUrl}
                                    className={`px-4 py-3 font-bold rounded-xl text-xs transition-all flex items-center gap-1.5 ${
                                        statusSalin 
                                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                                            : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-350'
                                    }`}
                                >
                                    <span className="material-symbols-rounded text-sm">
                                        {statusSalin ? 'check_circle' : 'content_copy'}
                                    </span>
                                    <span>{statusSalin ? 'Tersalin' : 'Salin'}</span>
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2">Salin tautan di atas dan tempelkan pada kolom <strong>Authorized redirect URIs</strong> di pendaftaran Google Cloud Console.</p>
                        </div>
                    </div>
                </div>

                {/* Panel Keamanan & Kinerja Platform */}
                <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 lg:p-8 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Keamanan & Kinerja Platform</h2>
                        <p className="text-xs text-slate-400 mt-1">Konfigurasi pembatasan laju lalu lintas (Rate Limiting) untuk mengamankan server dari ancaman overload dan menjamin kestabilan sistem.</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-2">
                                Batas Request Per Menit <span className="text-red-500">*</span>
                            </label>
                            <input 
                                type="number" 
                                min="1"
                                max="100000"
                                value={data.batas_request_per_menit}
                                onChange={e => setData('batas_request_per_menit', e.target.value)}
                                placeholder="Contoh: 2500"
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white"
                                required
                            />
                            <p className="text-xs text-slate-400 mt-1.5">Membatasi jumlah permintaan (request) per menit untuk setiap alamat IP. Default: 2500 request.</p>
                            <InputError message={errors.batas_request_per_menit} className="mt-1" />
                        </div>
                    </div>
                </div>

                {/* Panel Integrasi Object Storage */}
                <div className="bg-white dark:bg-slate-800/80 backdrop-blur-md rounded-3xl p-6 lg:p-8 border border-slate-100 dark:border-slate-700/50 shadow-sm space-y-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Penyimpanan Media & Object Storage</h2>
                        <p className="text-xs text-slate-400 mt-1">Konfigurasi lokasi penyimpanan berkas (seperti avatar pengguna, logo aplikasi) ke penyimpanan lokal atau cloud storage.</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-2">
                                Provider Object Storage
                            </label>
                            <select 
                                value={data.storage_provider}
                                onChange={e => setData('storage_provider', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white"
                            >
                                <option value="local">Lokal (Server Disk / Storage Link)</option>
                                <option value="s3">AWS S3 (Amazon Web Services)</option>
                                <option value="gcs">Google Cloud Storage (GCS S3-Compliant)</option>
                                <option value="minio">MinIO Object Storage (Self-Hosted)</option>
                            </select>
                            <InputError message={errors.storage_provider} className="mt-1" />
                        </div>

                        {data.storage_provider !== 'local' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-700/50 pt-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-2">
                                        Access Key ID (API Key)
                                    </label>
                                    <input 
                                        type="text" 
                                        value={data.s3_key}
                                        onChange={e => setData('s3_key', e.target.value)}
                                        placeholder="Masukkan Access Key ID"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white font-mono"
                                    />
                                    <InputError message={errors.s3_key} className="mt-1" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-2">
                                        Secret Access Key
                                    </label>
                                    <input 
                                        type="password" 
                                        value={data.s3_secret}
                                        onChange={e => setData('s3_secret', e.target.value)}
                                        placeholder="Masukkan Secret Access Key"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white font-mono"
                                    />
                                    <InputError message={errors.s3_secret} className="mt-1" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-2">
                                        Nama Bucket (Wadah/Container)
                                    </label>
                                    <input 
                                        type="text" 
                                        value={data.s3_bucket}
                                        onChange={e => setData('s3_bucket', e.target.value)}
                                        placeholder="Contoh: sso-sekolah-bucket"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white"
                                    />
                                    <InputError message={errors.s3_bucket} className="mt-1" />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-2">
                                        Region
                                    </label>
                                    <input 
                                        type="text" 
                                        value={data.s3_region}
                                        onChange={e => setData('s3_region', e.target.value)}
                                        placeholder="Contoh: ap-southeast-3"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white"
                                    />
                                    <InputError message={errors.s3_region} className="mt-1" />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-350 uppercase tracking-wider mb-2">
                                        Custom Endpoint URL (Opsional)
                                    </label>
                                    <input 
                                        type="text" 
                                        value={data.s3_endpoint}
                                        onChange={e => setData('s3_endpoint', e.target.value)}
                                        placeholder="Contoh: http://minio-server.local:9000 atau https://storage.googleapis.com"
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#0F91FC] dark:text-white font-mono"
                                    />
                                    <InputError message={errors.s3_endpoint} className="mt-1" />
                                </div>

                                <div className="md:col-span-2 flex items-center justify-between py-2 border-t border-slate-100 dark:border-slate-700/50 pt-4">
                                    <div>
                                        <span className="block text-sm font-bold text-slate-700 dark:text-slate-300">
                                            Gunakan Path-Style Endpoint
                                        </span>
                                        <span className="block text-xs text-slate-400 mt-0.5">
                                            Aktifkan jika menggunakan MinIO atau beberapa provider S3 custom.
                                        </span>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer select-none">
                                        <input 
                                            type="checkbox"
                                            checked={data.s3_use_path_style_endpoint}
                                            onChange={e => setData('s3_use_path_style_endpoint', e.target.checked)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-[#0F91FC]"></div>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 pt-2">
                    <button 
                        type="submit"
                        disabled={processing}
                        className="bg-[#0F91FC] hover:bg-[#0a78d6] text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-[#0F91FC]/20 transition-all disabled:opacity-50"
                    >
                        {processing ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </div>
            </form>
        </>
    );
}


PengaturanSistem.layout = page => <TataLetakUtama children={page} title="Pengaturan Sistem Global" />;
