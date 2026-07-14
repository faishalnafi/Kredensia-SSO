Write-Host "=== Portal SSO Sekolah - Docker Setup Wizard ===" -ForegroundColor Cyan

# 1. Salin .env jika belum ada
if (-not (Test-Path .env)) {
    Write-Host "Membuat file .env dari .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
}

# 2. Build dan jalankan container
Write-Host "Membangun dan menjalankan Docker containers..." -ForegroundColor Yellow
docker compose up -d --build

# 3. Informasikan langkah selanjutnya
Write-Host "`nInstalasi Kontainer Selesai!" -ForegroundColor Green
Write-Host "Silakan buka browser Anda dan kunjungi halaman setup interaktif:" -ForegroundColor Green
Write-Host "http://localhost:8000/setup" -ForegroundColor Cyan -Bold
Write-Host "untuk menyelesaikan migrasi database dan membuat akun Admin / Superadmin pertama kali.`n" -ForegroundColor Green
