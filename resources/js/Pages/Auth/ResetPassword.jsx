import React, { useState } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import InputError from '@/Components/InputError';

export default function ResetPassword({ token, email }) {
    const { props } = usePage();
    const settings = props?.settings;
    const [tampilkanSandi, setTampilkanSandi] = useState(false);
    const [tampilkanKonfirmasi, setTampilkanKonfirmasi] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        token: token || '',
        email: email || '',
        password: '',
        password_confirmation: '',
    });

    const tanganiSubmit = (e) => {
        e.preventDefault();
        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    const minimalKarakter = data.password.length >= 8;
    const cocokKonfirmasi = data.password.length > 0 && data.password === data.password_confirmation;

    return (
        <div className="min-h-screen w-full bg-[#F8FAFC] dark:bg-[#0B1120] flex items-center justify-center p-4 sm:p-6">
            <Head title={`Atur Ulang Kata Sandi - ${settings?.nama_aplikasi || 'SSO Sekolah'}`} />

            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xl p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#0F91FC]/10 dark:bg-[#0F91FC]/20 flex items-center justify-center text-[#0F91FC]">
                        <span className="material-symbols-rounded text-2xl">lock_reset</span>
                    </div>
                    <div>
                        <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            Buat Kata Sandi Baru
                        </h1>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            {settings?.nama_aplikasi || 'SSO Sekolah'} &bull; Pemulihan Akun Resmi
                        </p>
                    </div>
                </div>

                <form onSubmit={tanganiSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Alamat Surel (Email) Akun
                        </label>
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#0F91FC]"
                            required
                        />
                        <InputError message={errors.email} className="mt-1.5" />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Kata Sandi Baru
                        </label>
                        <div className="relative">
                            <input
                                type={tampilkanSandi ? 'text' : 'password'}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="Minimal 8 karakter"
                                className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-[#0F91FC]"
                                autoComplete="new-password"
                                autoFocus
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setTampilkanSandi(!tampilkanSandi)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <span className="material-symbols-rounded text-lg">
                                    {tampilkanSandi ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>
                        <InputError message={errors.password} className="mt-1.5" />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                            Konfirmasi Kata Sandi Baru
                        </label>
                        <div className="relative">
                            <input
                                type={tampilkanKonfirmasi ? 'text' : 'password'}
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                placeholder="Ulangi kata sandi baru"
                                className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white focus:outline-none focus:border-[#0F91FC]"
                                autoComplete="new-password"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setTampilkanKonfirmasi(!tampilkanKonfirmasi)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                            >
                                <span className="material-symbols-rounded text-lg">
                                    {tampilkanKonfirmasi ? 'visibility_off' : 'visibility'}
                                </span>
                            </button>
                        </div>
                        <InputError message={errors.password_confirmation} className="mt-1.5" />
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5 text-[11px]">
                        <div className={`flex items-center gap-1.5 font-semibold ${minimalKarakter ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                            <span className="material-symbols-rounded text-sm">{minimalKarakter ? 'check_circle' : 'radio_button_unchecked'}</span>
                            <span>Minimal 8 karakter</span>
                        </div>
                        <div className={`flex items-center gap-1.5 font-semibold ${cocokKonfirmasi ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                            <span className="material-symbols-rounded text-sm">{cocokKonfirmasi ? 'check_circle' : 'radio_button_unchecked'}</span>
                            <span>Konfirmasi kata sandi cocok</span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-3.5 px-5 bg-[#0F91FC] hover:bg-[#0a78d6] text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-[#0F91FC]/25 transition-all disabled:opacity-50"
                    >
                        {processing ? 'Menyimpan Kata Sandi...' : 'Simpan Kata Sandi Baru'}
                    </button>

                    <div className="text-center pt-2">
                        <Link
                            href="/otentikasi#masuk"
                            className="text-xs font-bold text-slate-500 hover:text-[#0F91FC] transition-colors inline-flex items-center gap-1"
                        >
                            <span className="material-symbols-rounded text-sm">arrow_back</span>
                            <span>Kembali ke Halaman Masuk</span>
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
