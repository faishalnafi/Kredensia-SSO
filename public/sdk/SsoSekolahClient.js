/**
 * ============================================================
 * SSO Sekolah - Client SDK untuk Node.js / JavaScript
 * Versi    : 1.0.0
 * Lisensi  : MIT / Open Source
 * ============================================================
 */

const https = require('https');
const http = require('http');

class SsoSekolahClient {
    /**
     * Inisialisasi Client SDK SSO Sekolah.
     * @param {string} baseUrl URL API Portal SSO (contoh: https://sso.sekolah.sch.id/api)
     * @param {string} apiKey API Key rahasia aplikasi Anda
     * @param {number} timeout Timeout HTTP dalam ms (default: 10000ms)
     */
    constructor(baseUrl, apiKey, timeout = 10000) {
        this.baseUrl = baseUrl.replace(/\/$/, '');
        this.apiKey = apiKey;
        this.timeout = timeout;
    }

    /** Uji koneksi & validitas API Key */
    async testConnection() {
        return this._request('GET', '/v1/test');
    }

    /** Ambil daftar pengguna / member */
    async getMembers(params = {}) {
        return this._request('GET', '/v1/members', params);
    }

    /** Ambil detail pengguna berdasarkan ID */
    async getMemberById(id) {
        return this._request('GET', `/v1/members/${id}`);
    }

    /** Ambil daftar kelas sekolah */
    async getKelas(params = {}) {
        return this._request('GET', '/v1/kelas', params);
    }

    /** Ambil daftar tahun pelajaran sekolah */
    async getTahunPelajaran(params = {}) {
        return this._request('GET', '/v1/tahun-pelajaran', params);
    }

    /** Ambil daftar peran / role */
    async getPeran() {
        return this._request('GET', '/v1/data/peran');
    }

    /** Ambil statistik agregat sistem */
    async getStatistik() {
        return this._request('GET', '/v1/data/statistik');
    }

    /** Dekode & Verifikasi Payload Token JWT SSO */
    static verifyJwtToken(jwtToken) {
        try {
            const parts = jwtToken.split('.');
            if (parts.length !== 3) return null;
            const payloadStr = Buffer.from(parts[1], 'base64').toString('utf8');
            const payload = JSON.parse(payloadStr);

            if (payload.exp && Math.floor(Date.now() / 1000) >= payload.exp) {
                return null; // Kedaluwarsa
            }
            return payload;
        } catch (err) {
            return null;
        }
    }

    /** Private HTTP client wrapper */
    async _request(method, path, params = {}) {
        const query = new URLSearchParams(params).toString();
        const urlStr = `${this.baseUrl}${path}${query ? '?' + query : ''}`;
        const url = new URL(urlStr);
        const transport = url.protocol === 'https:' ? https : http;

        return new Promise((resolve, reject) => {
            const options = {
                method,
                headers: {
                    'X-API-Key': this.apiKey,
                    'Accept': 'application/json',
                },
                timeout: this.timeout,
            };

            const req = transport.request(urlStr, options, (res) => {
                let body = '';
                res.on('data', (chunk) => body += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(body);
                        if (res.statusCode >= 400) {
                            return reject(new Error(json.pesan || `HTTP Error ${res.statusCode}`));
                        }
                        resolve(json);
                    } catch (e) {
                        reject(new Error(`Gagal membaca balasan JSON: ${body}`));
                    }
                });
            });

            req.on('error', (err) => reject(new Error(`Koneksi SSO Gagal: ${err.message}`)));
            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Koneksi HTTP ke SSO Timeout'));
            });
            req.end();
        });
    }
}

module.exports = SsoSekolahClient;
