import React from 'react';
import { Head, Link } from '@inertiajs/react';

export default function ComingSoon({ title }) {
    return (
        <div className="bg-slate-50 dark:bg-slate-900 min-h-screen w-full flex flex-col justify-center items-center transition-colors overflow-hidden relative">
            <Head title={`${title || 'Segera Hadir'} - SingleSignOn`} />

            <style>{`
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-15px); }
                    100% { transform: translateY(0px); }
                }
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
            `}</style>

            {/* Background Ornamen */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-[#0F91FC]/5 dark:bg-[#0F91FC]/10 blur-3xl"></div>
                <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-emerald-500/5 dark:bg-emerald-500/10 blur-3xl"></div>
            </div>

            <div className="relative z-10 flex flex-col items-center justify-center p-8 text-center max-w-lg mx-auto">
                <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-3xl shadow-xl flex items-center justify-center mb-8 animate-float border border-slate-100 dark:border-slate-700">
                    <span className="material-symbols-rounded text-5xl text-[#0F91FC] dark:text-[#ff6b39]">
                        construction
                    </span>
                </div>

                <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[10px] px-3 py-1 rounded-full font-bold uppercase tracking-widest flex items-center gap-1">
                        <span className="material-symbols-rounded text-sm">schedule</span>
                        SEDANG DALAM PENGEMBANGAN
                    </span>
                </div>

                <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-4 text-[#081242] dark:text-white tracking-tight">
                    Segera <br /> Hadir.
                </h1>

                <p className="text-slate-500 dark:text-slate-400 text-sm mb-10 leading-relaxed max-w-sm mx-auto">
                    Halaman <strong className="text-slate-700 dark:text-slate-200">{title}</strong> saat ini masih dalam tahap pengembangan. Kami akan segera merilisnya untuk Anda.
                </p>

                <Link 
                    href={route('login')}
                    className="bg-[#111827] dark:bg-[#0F91FC] text-white font-bold py-4 px-8 rounded-xl hover:bg-slate-800 dark:hover:bg-[#e03d09] transition-all text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 group w-full sm:w-auto"
                >
                    <span className="material-symbols-rounded text-lg group-hover:-translate-x-1 transition-transform">arrow_back</span>
                    Kembali ke Halaman Masuk
                </Link>
            </div>
        </div>
    );
}
