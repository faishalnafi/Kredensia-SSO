import React, { useEffect } from 'react';
import { Head } from '@inertiajs/react';

export default function Redirect({ url }) {
    useEffect(() => {
        if (url) {
            // Lakukan pengalihan penuh di sisi browser untuk melewati batasan CORS AJAX
            window.location.href = url;
        }
    }, [url]);

    return (
        <div className="min-h-screen bg-[#081242] flex items-center justify-center text-white font-sans">
            <Head title="Mengalihkan..." />
            
            <div className="text-center space-y-6 max-w-sm px-6">
                {/* Spinner Glassmorphic Premium */}
                <div className="relative w-20 h-20 mx-auto">
                    <div className="absolute inset-0 rounded-full border-4 border-white/5"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-t-[#0F91FC] border-r-[#0F91FC] animate-spin"></div>
                </div>
                
                <div className="space-y-2">
                    <h3 className="text-lg font-bold tracking-wide">Menghubungkan Sesi...</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                        Mohon tunggu sebentar, kami sedang mengalihkan Anda kembali ke aplikasi tujuan dengan aman.
                    </p>
                </div>
            </div>
        </div>
    );
}
