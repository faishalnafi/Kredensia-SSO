#!/bin/sh
set -e

# Copy .env if not exists
if [ ! -f "/var/www/.env" ]; then
    echo "Copying .env.example to .env..."
    cp /var/www/.env.example /var/www/.env
fi

# Ensure storage directories exist and have proper permissions
mkdir -p /var/www/storage/framework/cache
mkdir -p /var/www/storage/framework/sessions
mkdir -p /var/www/storage/framework/views
mkdir -p /var/www/storage/logs
chmod -R 775 /var/www/storage
chmod -R 775 /var/www/bootstrap/cache

# Install dependencies
echo "Installing composer dependencies..."
composer install --no-interaction --prefer-dist --optimize-autoloader

# Run key generate if empty
if [ -z "$(grep APP_KEY /var/www/.env | cut -d '=' -f2)" ]; then
    echo "Generating Application Key..."
    php artisan key:generate --ansi
fi

# SQLite DB setup if configured
DB_CONN=$(grep DB_CONNECTION /var/www/.env | cut -d '=' -f2)
if [ "$DB_CONN" = "sqlite" ]; then
    if [ ! -f "/var/www/database/database.sqlite" ]; then
        echo "Creating SQLite database file..."
        touch /var/www/database/database.sqlite
    fi
fi

# Install Node.js modules and compile assets
echo "Installing NPM dependencies..."
npm install

echo "Compiling Vite production assets..."
npm run build

# Start supervisord process manager
echo "Starting Nginx and PHP-FPM..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
