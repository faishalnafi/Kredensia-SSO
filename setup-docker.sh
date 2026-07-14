#!/bin/bash
echo -e "\e[36m=== Portal SSO Sekolah - Docker Setup Wizard ===\e[0m"

# 1. Copy .env if not exists
if [ ! -f .env ]; then
    echo -e "\e[33mMembuat file .env dari .env.example...\e[0m"
    cp .env.example .env
fi

# 2. Build and start containers
echo -e "\e[33mMembangun dan menjalankan Docker containers...\e[0m"
docker compose up -d --build

# 3. Inform next steps
echo -e "\n\e[32mInstalasi Kontainer Selesai!\e[0m"
echo -e "\e[32mSilakan buka browser Anda dan kunjungi halaman setup interaktif:\e[0m"
echo -e "\e[36mhttp://localhost:8000/setup\e[0m"
echo -e "\e[32muntuk menyelesaikan migrasi database dan membuat akun Admin / Superadmin pertama kali.\e[0m\n"
