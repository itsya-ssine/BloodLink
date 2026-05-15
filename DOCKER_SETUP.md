# Docker Setup for BloodLink Backend

This Docker setup provides a complete development environment with PHP 8.1 and PostgreSQL 15.

## Prerequisites

- Docker and Docker Compose installed on your system
  - [Docker Desktop](https://www.docker.com/products/docker-desktop) (includes Docker Compose)
  - Or install Docker Engine and Docker Compose separately

## Quick Start

1. **Start the containers:**
   ```bash
   docker-compose up -d
   ```

2. **Verify services are running:**
   ```bash
   docker-compose ps
   ```

3. **Access the API:**
   - API Base URL: `http://localhost:8000/api`
   - Config endpoint: `http://localhost:8000/config.js.php`

4. **View logs:**
   ```bash
   docker-compose logs -f php
   docker-compose logs -f postgres
   ```

The database container is exposed on host port `5433` to avoid conflicts with any local PostgreSQL instance.

## Database Management

### Reset Database
```bash
docker-compose down
docker volume rm bloodlink_postgres_data
docker-compose up -d
```

### Connect to PostgreSQL
```bash
docker-compose exec postgres psql -U postgres -d bloodlink
```

### Run SQL Scripts
```bash
docker-compose exec postgres psql -U postgres -d bloodlink -f /path/to/script.sql
```

## Frontend Configuration

When running the frontend (e.g., on port 3000), it will automatically communicate with the backend at `http://localhost:8000/api`.

Ensure your frontend is configured to point to the correct API URL based on your docker-compose environment variables.

## Stopping and Cleanup

**Stop containers (data persists):**
```bash
docker-compose stop
```

**Start containers again:**
```bash
docker-compose start
```

**Remove containers and volumes (deletes data):**
```bash
docker-compose down -v
```

## Troubleshooting

### Database Connection Failed
- Check that PostgreSQL is running: `docker-compose ps postgres`
- Verify connection credentials in `docker-compose.yml` environment variables
- Wait for database to be ready (healthcheck takes ~10 seconds)

### PHP Returns 403 Forbidden
- Check file permissions: `docker-compose exec php chown -R www-data:www-data /var/www/html`
- Verify Apache mod_rewrite is enabled

### Port Already in Use
- Change ports in `docker-compose.yml`:
  - PHP: Change `8000:80`
   - PostgreSQL: Change `5433:5432`

## Environment Variables

See `docker-compose.yml` services section for all configured environment variables. To override:

1. Create a `.env.docker` file in the project root
2. Or modify `docker-compose.yml` directly
3. Or pass environment variables: `docker-compose up -e VAR=value`

## Development Workflow

The project directory is mounted as a volume, so:
- Edit PHP files locally and changes are reflected immediately
- No rebuild needed for code changes
- Only rebuild if you need to change dependencies or the PHP image

```bash
# Rebuild image if dependencies changed
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```
