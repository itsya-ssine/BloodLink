# BloodLink — Backend Documentation

This document collects complete backend documentation for the BloodLink project (API, auth, database, env, and Docker setup).

## Overview

- Backend: Plain PHP + PDO (PostgreSQL)
- Entry: `backend/public/index.php`
- Autoload / env loader: `backend/src/bootstrap.php`
- DB connector: `backend/src/Database.php`
- Main auth logic: `backend/src/AuthService.php`

## Prerequisites

- PHP 8.1+
- PostgreSQL 13+
- `pdo_pgsql` extension for PHP
- Docker & Docker Compose (optional, recommended for development)

## Env configuration

Copy `.env.example` to `backend/.env` and edit variables:

- `DB_HOST` — database host (use `postgres` when running via Docker Compose)
- `DB_PORT` — database port (5432 inside container)
- `DB_NAME` — default `bloodlink`
- `DB_USER` / `DB_PASS` — database credentials
- `PUBLIC_API_BASE_URL` — frontend runtime base URL (used in emails & links)
- `SESSION_NAME`, `SESSION_SECURE_COOKIE`, `SESSION_SAMESITE` — session cookie settings
- `APP_URL`, `MAIL_FROM_ADDRESS`, `MAIL_FROM_NAME` — used for emails/links
- `MAIL_LOG_ONLY` — set `true` in development to log mail instead of sending
- `CORS_ALLOWED_ORIGINS` — comma separated allowed origins for CORS

The project includes `backend/.env.example` with default development values.

## Docker

A `docker-compose.yml` is provided at project root to run the backend + PostgreSQL. Key notes:

- PHP/Apache service serves `backend/public` on host port `8000` (container port 80).
- PostgreSQL service runs inside the container on port `5432` and is mapped to host port `5433` (avoid conflicts with a local DB).
- The DB schema and seeds are mounted into `/docker-entrypoint-initdb.d/` so initialization runs on first container start.

Quick commands:

```bash
# Start services
docker-compose up -d

# Show status
docker-compose ps

# View PHP logs
docker-compose logs -f php

# Connect to PostgreSQL from the postgres container
docker-compose exec postgres psql -U postgres -d bloodlink
```

If host port 5433 is occupied or you prefer another mapping, update `docker-compose.yml`.

## Database schema & seeds

- Schema: `database/schema.sql`
- Minimal seed: `database/seeds/seed.sql`
- Full dataset seed: `database/seeds/seed-all.sql`

The schema includes tables for `users`, `donations`, `blood_requests`, `hospitals`, `achievements`, and related tables. The `users` table contains auth fields (password hashes, verification tokens, 2FA fields, role, timestamps).

Example: to re-run seeds from inside the running postgres container:

```bash
docker-compose exec postgres psql -U postgres -d bloodlink -f /docker-entrypoint-initdb.d/01-schema.sql
# or run a seed file path you mounted
```

## Seeded test accounts

The minimal and full seeds include two useful accounts:

- Regular user:
  - Email: `yassine.elmajdoubi@email.com`
  - Role: `user`
- Admin user:
  - Email: `admin@bloodlink.local`
  - Role: `admin`

Passwords are stored as bcrypt hashes in the seeds; plain-text passwords are not in the repository. Use one of these approaches to obtain credentials:

- Register a new account via the UI or `POST /api/auth/register` (see below)
- Use the password-reset flow to set a new password for a seeded account (`POST /api/auth/password/forgot`)

In development, verification and reset links are returned in API responses and logged when `MAIL_LOG_ONLY=true`.

## API endpoints

All endpoints are mounted under `/api` (front controller: `backend/public/index.php`). Main endpoints:

- `GET /api/` — API metadata
- `GET /api/health` — DB ping
- `GET /api/global-stats`
- `GET /api/achievements`
- `GET /api/hospitals`
- `GET /api/hospitals/{id}`
- `GET /api/users/current` (via auth bootstrap)

Auth flows:
- `GET /api/auth/bootstrap` — return auth state + CSRF token
- `POST /api/auth/login` — login (body: email, password, optional two_factor_code)
- `POST /api/auth/logout`
- `POST /api/auth/register` — create a new user (see required fields)
- `GET|POST /api/auth/verify-email` — verify email (accepts `token` or `code`)
- `POST /api/auth/verify-email/request` — request a new verification code
- `POST /api/auth/password/forgot` — request password reset
- `GET|POST /api/auth/password/reset` — reset password (token required)
- `POST /api/auth/profile` (PATCH) — update profile (authenticated)
- `DELETE /api/auth/account` — delete account (authenticated)
- `POST /api/auth/2fa/setup` — start 2FA setup
- `POST /api/auth/2fa/confirm` — confirm 2FA setup
- `POST /api/auth/2fa/disable` — disable 2FA

Admin endpoints:
- `GET /api/admin/users` — list users (requires `role = 'admin'`)

Other application endpoints:
- `GET /api/donations?user_id={id}`
- `POST /api/donations`
- `GET /api/requests`
- `POST /api/requests`

All state-changing endpoints require a valid CSRF token sent in the `X-CSRF-Token` header and credentials (session cookie). The API returns a `csrf_token` in the auth bootstrap/login responses.

## Authentication & CSRF

- Sessions: server-side PHP session; cookie name set by `SESSION_NAME` in env.
- CSRF: `AuthService::csrfToken()` stores a 64-byte token in session. Clients must send `X-CSRF-Token` for non-GET requests. The client in this repo (`js/api.js`) saves the token and attaches it automatically.
- Email verification: `register()` generates a 6-digit verification code and saves a hash; the `verifyEmail()` endpoint consumes it.
- Password reset: `forgotPassword()` generates a reset token and email; `resetPassword()` applies it.
- Two-factor (TOTP): `setupTwoFactor()` returns a base32 secret and an otpauth:// URI; `confirmTwoFactor()` validates a TOTP code and enables 2FA; recovery codes are supported and stored hashed.

## How to create an account (quick)

1. Register (required fields):

```json
POST /api/auth/register
Content-Type: application/json
{
  "first_name":"Test",
  "last_name":"User",
  "email":"test@example.com",
  "password":"S3cur3P@ssw0rd",
  "password_confirmation":"S3cur3P@ssw0rd",
  "phone":"+212600000000",
  "blood_type_code":"O+",
  "date_of_birth":"1990-01-01",
  "gender":"Other",
  "weight_kg":53,
  "city":"Khouribga",
  "address":"Some address"
}
```

2. Check response/logs for verification code or link (in development `MAIL_LOG_ONLY=true` logs mail). Then verify:

```http
POST /api/auth/verify-email
Content-Type: application/json
{ "code": "123456" }
```

3. Login:

```http
POST /api/auth/login
Content-Type: application/json
{ "email":"test@example.com", "password":"S3cur3P@ssw0rd" }
```

If login succeeds the response includes a `csrf_token` and the server sets a session cookie. The client must send cookie + `X-CSRF-Token` header on subsequent state-changing requests.

## Tips for testing seeded accounts

- If you need to set a password for a seeded user, use the forgot-password flow to generate a reset link: `POST /api/auth/password/forgot` and then `POST /api/auth/password/reset` with the token and new password.
- In development the reset link is returned in the API response or logged.

## Notes on client integration

- `backend/public/config.js.php` serves runtime config (PUBLIC_API_BASE_URL) to the frontend.
- The repo includes a lightweight API client at `js/api.js` which performs bootstrap, sets CSRF token, and attaches `X-CSRF-Token` automatically for protected requests.

## Common troubleshooting

- `Invalid CSRF token` — ensure bootstrap/login returned a token and the client sends `X-CSRF-Token` header with requests. The repo's `js/api.js` already manages this; ensure the browser has the session cookie and the token is set.
- `Database unavailable` — check DB host in `backend/.env` (use `postgres` when running in Docker Compose). Ensure containers are on the same network and that the DB is healthy.
- Port conflicts — `docker-compose.yml` maps host `5433` → container `5432` for PostgreSQL and host `8000` → container `80` for the PHP app by default.

## Files of interest

- `backend/public/index.php` — routing/front controller
- `backend/public/config.js.php` — runtime config for frontend
- `backend/src/AuthService.php` — authentication logic
- `backend/src/Database.php` — PDO connection
- `database/schema.sql` — DB schema
- `database/seeds/seed.sql` and `database/seeds/seed-all.sql` — seeds
- `docker-compose.yml` — local development stack

## Contact / next steps

- To add automated tests for auth flows or to expose test credentials in a safe way, consider adding a test-only seed that sets a known password and is only applied in CI/dev.

---
Generated on: 2026-05-15
