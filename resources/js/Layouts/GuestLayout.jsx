import ApplicationLogo from '@/Components/ApplicationLogo';
import ThemeToggle from '@/Components/ThemeToggle';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function GuestLayout({ children }) {
    const { settings } = usePage().props;
    const [logoGagal, setLogoGagal] = useState(false);

    return (
        <div className="flex min-h-screen flex-col items-center bg-gray-150 dark:bg-gray-950 pt-6 sm:justify-center sm:pt-0 transition-colors">
            <div className="absolute top-4 right-4">
                <ThemeToggle />
            </div>

            <div className="flex flex-col items-center gap-3 mb-6 select-none">
                <Link href="/">
                    <img 
                        src={(!logoGagal && settings?.logo_primer_url) ? settings.logo_primer_url : 'https://support.nafii.my.id/icon/domains.png'} 
                        alt={settings?.nama_aplikasi || 'Logo'} 
                        className="h-16 w-16 object-contain shadow-sm rounded-2xl p-1 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
                        onError={() => setLogoGagal(true)}
                    />
                </Link>
                {settings?.nama_aplikasi && (
                    <span className="text-lg font-black text-[#081242] dark:text-white uppercase tracking-wider">
                        {settings.nama_aplikasi}
                    </span>
                )}
            </div>

            <div className="mt-6 w-full overflow-hidden bg-white dark:bg-gray-800 px-6 py-4 shadow-md sm:max-w-md sm:rounded-lg transition-colors text-gray-900 dark:text-gray-100">
                {children}
            </div>
        </div>
    );
}
