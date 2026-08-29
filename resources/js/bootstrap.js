import axios from 'axios';
window.axios = axios;

window.axios.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

const ambilCookieLokal = (name) => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
};

const latAwal = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('sso_user_lat') : null) || ambilCookieLokal('sso_user_lat');
const lngAwal = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('sso_user_lng') : null) || ambilCookieLokal('sso_user_lng');

if (latAwal) window.axios.defaults.headers.common['X-GPS-Latitude'] = latAwal;
if (lngAwal) window.axios.defaults.headers.common['X-GPS-Longitude'] = lngAwal;

import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

const connection = import.meta.env.VITE_BROADCAST_CONNECTION || 'reverb';

// Hanya inisialisasi Echo jika salah satu App Key didefinisikan di .env
if (import.meta.env.VITE_REVERB_APP_KEY || import.meta.env.VITE_PUSHER_APP_KEY) {
    if (connection === 'pusher') {
        window.Echo = new Echo({
            broadcaster: 'pusher',
            key: import.meta.env.VITE_PUSHER_APP_KEY,
            cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
            forceTLS: true
        });
    } else {
        window.Echo = new Echo({
            broadcaster: 'reverb',
            key: import.meta.env.VITE_REVERB_APP_KEY,
            wsHost: import.meta.env.VITE_REVERB_HOST,
            wsPort: import.meta.env.VITE_REVERB_PORT ?? 80,
            wssPort: import.meta.env.VITE_REVERB_PORT ?? 443,
            forceTLS: (import.meta.env.VITE_REVERB_SCHEME ?? 'https') === 'https',
            enabledTransports: ['ws', 'wss'],
        });
    }
}
