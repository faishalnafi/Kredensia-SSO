import React from 'react';
import { Head } from '@inertiajs/react';
import TataLetakUtama from '@/Layouts/TataLetakUtama';

export default function ComingSoon({ title = 'Segera Hadir', ikon = 'construction', deskripsi }) {
    return (
        <div className="w-full min-h-[calc(100vh-10rem)] flex flex-col justify-center items-center py-12 px-4 text-center max-w-xl mx-auto my-auto select-none">
            <Head title={`${title} - SingleSignOn`} />

            <div className="w-28 h-28 bg-white dark:bg-slate-800 rounded-3xl shadow-xl flex items-center justify-center mb-8 border border-slate-200/80 dark:border-slate-700/80 transition-transform duration-500 hover:scale-105">
                <span className="material-symbols-rounded text-6xl text-[#0F91FC]">
                    {ikon}
                </span>
            </div>

            <div className="flex items-center justify-center gap-2 mb-4">
                <span className="bg-blue-50 dark:bg-blue-950/60 text-[#0F91FC] border border-blue-200 dark:border-blue-800/60 text-xs px-4 py-1.5 rounded-full font-extrabold uppercase tracking-widest flex items-center gap-2 shadow-sm">
                    <span className="material-symbols-rounded text-base">schedule</span>
                    SEDANG DALAM PENGEMBANGAN
                </span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black text-slate-800 dark:text-white tracking-tight mb-4 leading-tight">
                {title} <br />
                <span className="text-[#0F91FC]">Segera Hadir</span>
            </h1>

            <p className="text-slate-500 dark:text-slate-400 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
                {deskripsi || `Halaman ${title} saat ini masih dalam tahap perancangan dan pengembangan untuk seluruh civitas sekolah.`}
            </p>
        </div>
    );
}

ComingSoon.layout = page => <TataLetakUtama children={page} title={page.props.title || 'Segera Hadir'} />;
