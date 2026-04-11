# BloodLink PHP Backend

A lightweight REST API for the BloodLink app using plain PHP + PDO (PostgreSQL).

## 1) Prerequisites

- PHP 8.1+
- PostgreSQL 13+
- `pdo_pgsql` extension enabled

## 2) Configure env

Copy `.env.example` to `.env` and edit values:

```bash
cp backend/.env.example backend/.env
```

Important variables:

- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS` for PostgreSQL
- `PUBLIC_API_BASE_URL` for frontend runtime API base URL
- `CORS_ALLOWED_ORIGINS` to allow frontend origins
- In `APP_ENV=development`, any `localhost` or `127.0.0.1` origin is allowed automatically

## 3) Create database schema

Use the schema in [../schema.sql](../schema.sql):

```bash
psql -U postgres -d bloodlink -f schema.sql
```

## 4) Run API

From project root:

```bash
php -S localhost:8080 -t backend/public
```

Base URL: `http://localhost:8080/api`

Frontend runtime config is served from:

- `http://localhost:8080/config.js.php`

## 5) Available endpoints

- `GET /api/` : API metadata
- `GET /api/health` : health check + DB ping
- `GET /api/global-stats`
- `GET /api/achievements`
- `GET /api/hospitals`
- `GET /api/hospitals/{id}`
- `GET /api/users/current`
- `PATCH /api/users/{id}`
- `GET /api/donations?user_id=1`
- `POST /api/donations`
- `GET /api/requests?urgency=critical`
- `POST /api/requests`

## 6) Request examples

Create request:

```bash
curl -X POST http://localhost:8080/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "patient_name":"Amina R.",
    "blood_type_code":"O-",
    "units_needed":2,
    "hospital_name":"CHU Ibn Rochd",
    "urgency_level":"critical",
    "contact_phone":"+212 6 99 88 77 66"
  }'
```

Create donation:

```bash
curl -X POST http://localhost:8080/api/donations \
  -H "Content-Type: application/json" \
  -d '{
    "donor_user_id":1,
    "hospital_name":"CHU Mohammed VI",
    "blood_type_code":"O+",
    "donated_at":"2026-04-11",
    "volume_ml":450,
    "status":"completed",
    "has_certificate":true
  }'
```
