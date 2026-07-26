#!/bin/sh
set -e

# Self-configure on first boot so `docker compose up` needs no manual steps.
if [ ! -f .env ]; then
    cp .env.example .env
fi

if ! grep -q '^APP_KEY=base64' .env; then
    php artisan key:generate --force
fi

touch database/database.sqlite

php artisan migrate --force --seed

exec php artisan serve --host=0.0.0.0 --port=8000
