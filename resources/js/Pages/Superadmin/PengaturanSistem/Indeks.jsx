import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import TataLetakUtama from '@/Layouts/TataLetakUtama';
import InputError from '@/Components/InputError';

export default function PengaturanSistem({ pengaturan, callbackUri }) {
    const [logoPreview, setLogoPreview] = useState(pengaturan.logo_primer_url || 'https://support.nafii.my.id/icon/domains.png');
    const [faviconPreview, setFaviconPreview] = useState(pengaturan.favicon_url || 'https://support.nafii.my.id/icon/domains.png');
    const [logoError, setLogoError] = useState(false);
    const [faviconError, setFaviconError] = useState(false);
    const [statusSalin, setStatusSalin] = useState(false);

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
    });

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

    return (
        <>
            <Head title="Pengaturan Sistem - SSO Sekolah" />
            
            <form onSubmit={tanganiSubmit} className="w-full max-w-4xl mx-auto space-y-6">
                
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
