import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../Contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [terbuka, setTerbuka] = useState(false);
    const dropdownRef = useRef(null);

    // Menutup dropdown saat klik di luar area
    useEffect(() => {
        const tanganiKlikLuar = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setTerbuka(false);
            }
        };

        const tanganiEscape = (event) => {
            if (event.key === 'Escape') {
                setTerbuka(false);
            }
        };

        if (terbuka) {
            document.addEventListener('mousedown', tanganiKlikLuar);
            document.addEventListener('keydown', tanganiEscape);
        }

        return () => {
            document.removeEventListener('mousedown', tanganiKlikLuar);
            document.removeEventListener('keydown', tanganiEscape);
        };
    }, [terbuka]);

    // Icon Sistem setengah lingkaran persis seperti Gambar 2
    const IkonSistem = ({ className = 'w-5 h-5' }) => (
        <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="9" />
            <path d="M12 3a9 9 0 0 0 0 18z" fill="currentColor" />
        </svg>
    );

    const opsiTema = [
        {
            kunci: 'light',
            label: 'Terang',
            ikon: <Sun className="w-5 h-5 shrink-0" />,
        },
        {
            kunci: 'dark',
            label: 'Gelap',
            ikon: <Moon className="w-5 h-5 shrink-0" />,
        },
        {
            kunci: 'system',
            label: 'Sistem',
            ikon: <IkonSistem className="w-5 h-5 shrink-0" />,
        },
    ];

    // Dapatkan ikon tema aktif untuk tombol pemicu
    const dapatkanIkonAktif = () => {
        if (theme === 'dark') {
            return <Moon className="w-5 h-5" />;
        }
        if (theme === 'system') {
            return <IkonSistem className="w-5 h-5" />;
        }
        return <Sun className="w-5 h-5" />;
    };

    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            {/* Tombol Pemicu Tema Ikon Tunggal */}
            <button
                type="button"
                onClick={() => setTerbuka((prev) => !prev)}
                className="w-10 h-10 rounded-full hover:bg-white/15 active:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer border border-transparent focus:outline-none focus:ring-2 focus:ring-white/40"
                aria-label="Pilih Mode Tampilan"
                aria-expanded={terbuka}
                title="Pilih Mode Tampilan (Terang / Gelap / Sistem)"
            >
                {dapatkanIkonAktif()}
            </button>

            {/* Menu Dropdown Tema (Persis Gambar 2) */}
            {terbuka && (
                <div
                    className="absolute right-0 top-full mt-2 w-36 sm:w-40 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-2xl shadow-xl shadow-slate-900/15 border border-slate-200/90 dark:border-slate-700/80 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                    role="menu"
                    aria-orientation="vertical"
                >
                    <div className="space-y-0.5">
                        {opsiTema.map((opsi) => {
                            const apakahAktif = theme === opsi.kunci;
                            return (
                                <button
                                    key={opsi.kunci}
                                    type="button"
                                    onClick={() => {
                                        setTheme(opsi.kunci);
                                        setTerbuka(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-xl transition-colors text-left ${
                                        apakahAktif
                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-[#0F91FC] dark:text-blue-400 font-bold'
                                            : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60 font-medium'
                                    }`}
                                    role="menuitem"
                                >
                                    {opsi.ikon}
                                    <span>{opsi.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

