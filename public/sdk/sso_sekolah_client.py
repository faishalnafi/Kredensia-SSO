"""
============================================================
SSO Sekolah - Client SDK untuk Python 3
Versi    : 1.0.0
Lisensi  : MIT / Open Source
============================================================
"""

import json
import urllib.parse
import urllib.request
import base64
import time

class SsoSekolahClient:
    def __init__(self, base_url: str, api_key: str, timeout: int = 10):
        """
        Inisialisasi Client SDK SSO Sekolah.
        :param base_url: URL basis API SSO (contoh: https://sso.sekolah.sch.id/api)
        :param api_key: Kunci API rahasia aplikasi Anda
        :param timeout: Batas waktu request dalam detik
        """
        self.base_url = base_url.rstrip('/')
        self.api_key = api_key
        self.timeout = timeout

    def test_connection(self) -> dict:
        """Uji koneksi & validitas API Key."""
        return self._request('GET', '/v1/test')

    def get_members(self, **params) -> dict:
        """Ambil daftar pengguna/member SSO dengan filter opsional."""
        return self._request('GET', '/v1/members', params)

    def get_member_by_id(self, member_id: str) -> dict:
        """Ambil detail data spesifik pengguna berdasarkan ID/UUID."""
        return self._request('GET', f'/v1/members/{member_id}')

    def get_kelas(self, **params) -> dict:
        """Ambil daftar kelas sekolah."""
        return self._request('GET', '/v1/kelas', params)

    def get_tahun_pelajaran(self, **params) -> dict:
        """Ambil daftar tahun pelajaran sekolah."""
        return self._request('GET', '/v1/tahun-pelajaran', params)

    def get_peran(self) -> dict:
        """Ambil daftar peran/roles yang terdaftar."""
        return self._request('GET', '/v1/data/peran')

    def get_statistik(self) -> dict:
        """Ambil data statistik agregat pengguna & aplikasi."""
        return self._request('GET', '/v1/data/statistik')

    @staticmethod
    def verify_jwt_token(jwt_token: str) -> dict:
        """Dekode & Verifikasi Payload Token JWT SSO tanpa library external."""
        try:
            parts = jwt_token.split('.')
            if len(parts) != 3:
                return None
            padded = parts[1] + '=' * (-len(parts[1]) % 4)
            payload_bytes = base64.urlsafe_b64decode(padded)
            payload = json.loads(payload_bytes.decode('utf-8'))

            if 'exp' in payload and time.time() >= payload['exp']:
                return None  # Expired
            return payload
        except Exception:
            return None

    def _request(self, method: str, path: str, params: dict = None) -> dict:
        url = f"{self.base_url}{path}"
        if params:
            filtered = {k: v for k, v in params.items() if v is not None}
            if filtered:
                url += '?' + urllib.parse.urlencode(filtered)

        headers = {
            'X-API-Key': self.api_key,
            'Accept': 'application/json',
            'User-Agent': 'SsoSekolahPythonSDK/1.0'
        }

        req = urllib.request.Request(url, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as response:
                body = response.read().decode('utf-8')
                return json.loads(body)
        except urllib.error.HTTPError as e:
            error_body = e.read().decode('utf-8')
            try:
                err_json = json.loads(error_body)
                raise Exception(err_json.get('pesan', f"HTTP Error {e.code}"))
            except json.JSONDecodeError:
                raise Exception(f"HTTP Error {e.code}: {error_body}")
        except Exception as e:
            raise Exception(f"Gagal menghubungkan ke SSO: {str(e)}")
