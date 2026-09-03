# Roadmap Peningkatan SSO Sekolah Menjadi IAM Setara Zitadel

**Status:** Draft · Disusun berdasarkan audit kondisi eksisting (lihat `project.md`, `prd.md`, `api.md`)

---

## Kondisi Saat Ini vs Target

| Area | Kondisi Sekarang | Target (Zitadel-class) |
|---|---|---|
| Token | JWT custom HS256, TTL 5 menit, tanpa refresh | OAuth2/OIDC standar: Authorization Code + PKCE, `access_token`, `refresh_token`, `id_token` |
| Discovery | Tidak ada | `/.well-known/openid-configuration` + JWKS (`/.well-known/jwks.json`) |
| Client Auth | `api_key` statis per `registered_apps` | `client_id` + `client_secret` per app, dengan `grant_types` & `scopes` |
| MFA | Tidak ada | TOTP (Google Authenticator) + WebAuthn/Passkey |
| RBAC | Role global by name (`roles`, `user_roles`) | Role + Permission granular per aplikasi (project-scoped, mirip Zitadel Project Roles) |
| Session | Laravel session standar + list sesi manual | Session management lengkap (device, IP, last active, revoke per sesi) — sebagian sudah ada di `/keamanan-akun/sesi` |
| Audit | `log_aktivitas` sederhana | Structured event log (actor, action, target, before/after, timestamp) |
| Password Policy | Validasi dasar (min 8, kombinasi karakter) | Kebijakan per-organisasi: expiry, riwayat password, lockout setelah N percobaan |
| Machine-to-Machine | API Key read-only | Client Credentials Grant (OAuth2) untuk service-to-service |
| Admin Console | Sudah ada (superadmin: user, role, app, api key, log) | Tambah: manajemen sesi per user, kebijakan keamanan per app, audit viewer terstruktur |

---

## Fase 1 — Fondasi OAuth2 / OIDC Server

> Ini fondasi paling kritikal. Tanpa ini, semua app klien masih bergantung pada JWT custom yang tidak kompatibel dengan library OIDC standar (Passport.js, NextAuth, Spring Security, dll).

- [ ] Migrasi skema `registered_apps`: tambah `client_secret_hash`, `grant_types` (json: `authorization_code`, `client_credentials`, `refresh_token`), `scopes` (json), `redirect_uris` (json array, bukan single `login_callback_url`).
  - *Kenapa:* Zitadel App bisa punya multiple redirect URI dan multiple grant type sekaligus; kolom tunggal saat ini tidak cukup.
- [ ] Buat tabel `oauth_authorization_codes` (code, client_id, user_id, redirect_uri, scope, code_challenge, code_challenge_method, expires_at, used_at).
  - *Kenapa:* Authorization Code Flow + PKCE wajib menyimpan code sekali-pakai dengan masa berlaku pendek (~60 detik).
- [ ] Buat tabel `oauth_access_tokens` dan `oauth_refresh_tokens` (id, client_id, user_id, scope, expires_at, revoked_at).
  - *Kenapa:* Access token perlu revocable dan auditable, tidak cukup hanya stateless JWT signature check.
- [ ] Endpoint `GET /oauth/authorize` — validasi `client_id`, `redirect_uri` (harus persis cocok, bukan sekadar host/port), `response_type=code`, `code_challenge` (PKCE wajib), `scope`, `state`.
  - *Kenapa:* Ini pengganti `/otentikasi?client_id=...` yang sekarang; menutup celah open-redirect lebih ketat dari implementasi saat ini.
- [ ] Endpoint `POST /oauth/token` — mendukung `grant_type=authorization_code` (tukar code+verifier jadi token) dan `grant_type=refresh_token`.
  - *Kenapa:* Standar OAuth2 RFC 6749 + RFC 7636 (PKCE).
- [ ] Ganti isi `id_token` menjadi JWT RS256 (asymmetric) agar bisa diverifikasi via JWKS publik tanpa membagikan secret ke klien.
  - *Kenapa:* HS256 shared-secret saat ini berisiko bocor ke banyak app; RS256 memisahkan signing key (privat, di server SSO) dari verification key (publik).
- [ ] Endpoint `GET /.well-known/openid-configuration` dan `GET /.well-known/jwks.json`.
  - *Kenapa:* Auto-discovery agar SDK klien standar (Auth0 SDK, NextAuth, dll) bisa langsung connect tanpa konfigurasi manual.
- [ ] Endpoint `GET /oauth/userinfo` (Bearer access_token → profil user + roles).
  - *Kenapa:* Bagian dari spek OIDC UserInfo Endpoint.
- [ ] Endpoint `POST /oauth/revoke` dan `POST /oauth/introspect` (RFC 7009 & RFC 7662).
  - *Kenapa:* Memungkinkan app klien logout/cabut token secara eksplisit, dan memvalidasi token secara server-side.
- [ ] Pertahankan endpoint lama (`/otentikasi?client_id=`, JWT HS256) sebagai **legacy/deprecated** paralel selama masa transisi, tandai di `api.md`.
  - *Kenapa:* Beberapa app sekolah eksisting mungkin masih integrasi dengan flow lama; tidak boleh putus mendadak.

## Fase 2 — Client Credentials & Service Accounts

- [ ] Migrasi `kunci_api` menuju model `service_accounts` bergaya Zitadel (akun mesin dengan `client_id`/`client_secret`, bukan sekadar string API key).
  - *Kenapa:* API Key read-only saat ini tidak punya scope granular; service account dengan OAuth2 Client Credentials bisa dibatasi per-scope (`read:members`, `read:stats`, dst).
- [ ] Endpoint `POST /oauth/token` dengan `grant_type=client_credentials` untuk server-to-server tanpa user context.
  - *Kenapa:* Standar untuk integrasi backend murni (mis. sinkronisasi data siswa dari sistem akademik).
- [ ] Migrasikan endpoint `/api/v1/*` agar menerima `Authorization: Bearer <access_token>` hasil client_credentials, dengan `X-API-Key` tetap didukung sebagai legacy.
  - *Kenapa:* Kompatibilitas mundur untuk integrasi yang sudah ada di `api.md`.

## Fase 3 — Multi-Factor Authentication (MFA)

- [ ] Tabel `user_mfa_methods` (user_id, type: `totp`/`webauthn`, secret/credential_id terenkripsi, is_primary, created_at).
  - *Kenapa:* Satu user bisa punya lebih dari satu metode MFA (mis. TOTP + Passkey cadangan).
- [ ] Setup TOTP: generate secret + QR code (library `pragmarx/google2fa` atau setara), verifikasi 6-digit code, simpan recovery codes (hashed).
  - *Kenapa:* TOTP paling umum & tidak butuh hardware khusus.
- [ ] Setup WebAuthn/Passkey (library `web-auth/webauthn-lib`): registrasi credential browser/device, verifikasi saat login.
  - *Kenapa:* Passwordless & phishing-resistant, standar modern yang dipakai Zitadel.
- [ ] Middleware `auth.mfa` — paksa langkah verifikasi MFA setelah password benar, sebelum sesi penuh dibuat.
  - *Kenapa:* Mencegah bypass MFA lewat request langsung ke rute dashboard.
- [ ] Kebijakan MFA per role (mis. wajib untuk Superadmin & Admin, opsional untuk Guru/Siswa) via `pengaturan_sistem` atau tabel kebijakan baru.
  - *Kenapa:* Enterprise IAM biasanya mewajibkan MFA hanya untuk akun berprivilese tinggi agar tidak membebani user awam.

## Fase 4 — RBAC Granular Per Aplikasi (Project Roles ala Zitadel)

- [ ] Tabel baru `app_permissions` (app_id, permission_key, deskripsi) — didefinisikan oleh masing-masing aplikasi terdaftar.
  - *Kenapa:* Zitadel memisahkan "Role" (nama) dari "Permission/Action" (hak konkret); saat ini sistem hanya punya role global tanpa permission.
- [ ] Tabel `app_role_permissions` (pivot: role_id + app_id + permission_key).
  - *Kenapa:* Role yang sama (mis. "Guru") bisa punya permission berbeda di tiap aplikasi (mis. penuh di e-learning, read-only di e-rapor).
- [ ] Sertakan klaim `permissions` (bukan cuma `roles`) di dalam `id_token`/`userinfo`, terfilter sesuai `client_id` yang meminta.
  - *Kenapa:* App klien butuh cek permission granular, bukan cuma nama role, untuk otorisasi UI/API di sisi mereka.
- [ ] UI Superadmin: halaman "Permission Aplikasi" per app di `manajemen-aplikasi`, dan mapping role→permission per app.
  - *Kenapa:* Tanpa UI, admin sekolah (non-teknis) tidak bisa mengelola RBAC granular ini.

## Fase 5 — Audit Trail Terstruktur

- [ ] Refactor `log_aktivitas` → event-sourced audit log: kolom `actor_id`, `actor_type` (user/service_account), `action` (kode standar mis. `user.login`, `app.created`, `role.permission_updated`), `target_type`, `target_id`, `metadata_before` (json), `metadata_after` (json), `ip`, `user_agent`.
  - *Kenapa:* Log saat ini bersifat naratif teks bebas; sulit dipakai untuk compliance/forensik. Zitadel mencatat semua perubahan sebagai event terstruktur.
- [ ] Endpoint admin `GET /superadmin/audit-log` dengan filter by actor, action, target, rentang tanggal.
  - *Kenapa:* Investigasi insiden keamanan butuh pencarian presisi, bukan cuma pencarian teks bebas seperti sekarang.
- [ ] Retensi & ekspor audit log (CSV/JSON) untuk kebutuhan compliance sekolah/dinas pendidikan.
  - *Kenapa:* Beberapa institusi butuh menyimpan bukti audit dalam jangka waktu tertentu.

## Fase 6 — Kebijakan Keamanan & Session Management Lanjutan

- [ ] Password policy dikonfigurasi di `pengaturan_sistem`: panjang minimum, kompleksitas, masa berlaku, jumlah riwayat password yang tidak boleh diulang.
  - *Kenapa:* Saat ini kebijakan password hardcoded di FormRequest; institusi berbeda punya kebutuhan kepatuhan berbeda.
- [ ] Account lockout setelah N percobaan gagal (di luar rate-limit IP yang sudah ada), dengan notifikasi email ke user.
  - *Kenapa:* Rate limit per IP+email saat ini bisa dilewati dengan mencoba banyak akun dari 1 IP atau 1 akun dari banyak IP; lockout per-akun menutup celah ini.
- [ ] Perkaya halaman "Keamanan Akun & Sesi" (`/keamanan-akun/sesi`) yang sudah ada dengan info device/browser (bukan cuma ID sesi) dan riwayat login (waktu, IP, lokasi perkiraan).
  - *Kenapa:* Fitur dasarnya sudah ada, tinggal diperkaya agar setara "Active Sessions" Zitadel.

## Fase 7 — Migrasi & Kompatibilitas

- [ ] Dokumentasikan peta migrasi di `api.md`: endpoint lama tetap aktif dengan label **Deprecated**, endpoint baru OIDC ditandai **Recommended**.
- [ ] Sediakan skrip migrasi `registered_apps` lama → skema client OAuth2 baru (auto-generate `client_secret`, isi `redirect_uris` dari `login_callback_url` lama).
- [ ] Update SDK resmi (`public/sdk/*.php`, `*.js`, `*.py`, `*.go`) agar mendukung flow OIDC baru sambil tetap backward-compatible dengan JWT lama.
- [ ] Rencana penghentian (sunset) flow JWT lama — target minimal 1 rilis minor setelah semua app internal migrasi.

---

## Urutan Eksekusi yang Disarankan

1. **Fase 1** (fondasi OIDC) — wajib duluan, semua fase lain bergantung pada skema client baru.
2. **Fase 4** (RBAC granular) — bisa paralel dengan Fase 1 karena beda area tabel.
3. **Fase 3** (MFA) — independen, bisa dikerjakan kapan saja setelah Fase 1 karena hanya menambah langkah di flow login.
4. **Fase 2** (Client Credentials) — setelah Fase 1 selesai (reuse infrastruktur token).
5. **Fase 5 & 6** (Audit + Kebijakan Keamanan) — penyempurnaan, bisa menyusul terakhir.
6. **Fase 7** (Migrasi) — berjalan terus-menerus sepanjang Fase 1–6 diimplementasikan.

> Catatan: setiap fase sebaiknya dipecah jadi task Plan tersendiri saat mulai implementasi, karena masing-masing menyentuh migration, model, controller, route, dan frontend React yang cukup besar untuk dikerjakan sekaligus.
