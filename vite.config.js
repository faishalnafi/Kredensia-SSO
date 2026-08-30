import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            injectRegister: 'auto',
            workbox: {
                skipWaiting: true,
                clientsClaim: true,
                globDirectory: 'public',
                globPatterns: [
                    'build/assets/*.{js,css}',
                    'images/*.{png,jpg,jpeg,svg}',
                    'favicon.ico',
                    'robots.txt'
                ],
                navigateFallback: '/',
                navigateFallbackDenylist: [/^\/api/, /^\/auth/, /^\/sanctum/, /^\/setup/, /^\/logout/, /^\/superadmin/, /^\/admin/, /^\/dasbor/],
            },
            manifest: {
                name: 'SSO Sekolah',
                short_name: 'SSOSekolah',
                description: 'Portal Otentikasi Terpusat SSO Sekolah',
                theme_color: '#0F91FC',
                background_color: '#ffffff',
                display: 'standalone',
                icons: [
                    {
                        src: '/favicon.ico',
                        sizes: '64x64 32x32 24x24 16x16',
                        type: 'image/x-icon'
                    }
                ]
            }
        })
    ],
});

