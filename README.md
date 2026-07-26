# Merchant Wallet & Settlement Dashboard

A merchant wallet and settlement dashboard for a fintech platform — Vue 3 + TypeScript + Tailwind frontend, lightweight Laravel 12 backend.

> Take-home assessment for Kudi Systems — Senior Software Engineer (Frontend).

## Quick start (Docker)

```bash
docker compose up --build
```

Then open http://localhost:5173 and log in with:

- **Email:** `admin@kudi.test`
- **Password:** `password`

The backend self-configures on first boot (env, app key, SQLite database, migrations, seed data).

## Manual setup

Requirements: PHP ≥ 8.2, Composer, Node ≥ 20.

```bash
# Backend
cd backend
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate --seed
php artisan serve            # http://localhost:8000

# Frontend (second terminal)
cd frontend
npm install
cp .env.example .env
npm run dev                  # http://localhost:5173
```

## Documentation

See [docs/](docs/) for design decisions and API summary. Assumptions, tools used, and known limitations are documented below as the project progresses.

*(README is a work in progress — completed in the delivery phase.)*
