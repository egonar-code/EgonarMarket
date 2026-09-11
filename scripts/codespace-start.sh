#!/usr/bin/env bash
set -u
cd "$(dirname "$0")/.."
export NODE_ENV="${NODE_ENV:-development}"
export PORT="${PORT:-3000}"
export SUPPLIER_PORT="${SUPPLIER_PORT:-3001}"
export PREVIEW_PORT="${PREVIEW_PORT:-8080}"
export JWT_SECRET="${JWT_SECRET:-egonarmarket-local-dev-secret}"
export ADMIN_EMAIL="${ADMIN_EMAIL:-admin@egonarmarket.sn}"
export ADMIN_PASSWORD="${ADMIN_PASSWORD:-EgonarDev2026!}"
export POSTGRES_DB="${POSTGRES_DB:-egonarmarket}"
export POSTGRES_USER="${POSTGRES_USER:-egonar}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-egonar_password}"

if [ ! -d node_modules/express ]; then
  npm install --no-audit --no-fund >/tmp/egonarmarket-npm-install.log 2>&1 || true
fi

if ! curl -fsS "http://127.0.0.1:${PREVIEW_PORT}/" >/dev/null 2>&1; then
  nohup node scripts/preview-server.js >/tmp/egonarmarket-preview.log 2>&1 &
fi

# Recreate a crashed PostgreSQL container while preserving its named volume.
if docker ps -a --format '{{.Names}} {{.Status}}' | grep -q '^egonarmarket-db Exited'; then
  docker rm -f egonarmarket-db >/dev/null 2>&1 || true
fi
if ! docker ps --format '{{.Names}}' | grep -qx 'egonarmarket-db'; then
  docker compose up -d postgres >/dev/null 2>&1 || true
fi

DB_READY=0
for i in $(seq 1 45); do
  if docker exec egonarmarket-db pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then DB_READY=1; break; fi
  sleep 1
done

if [ "$DB_READY" -eq 1 ]; then
  DB_HOST="$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' egonarmarket-db 2>/dev/null || true)"
  if [ -n "$DB_HOST" ]; then
    export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${DB_HOST}:5432/${POSTGRES_DB}"
    npm run db:init >/tmp/egonarmarket-db-init.log 2>&1 || true
    docker exec egonarmarket-db psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS password_hash TEXT; ALTER TABLE suppliers ALTER COLUMN admin_id DROP NOT NULL;" >/tmp/egonarmarket-supplier-migration.log 2>&1 || true
  fi
fi

if ! curl -fsS "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1 && [ -n "${DATABASE_URL:-}" ]; then
  nohup node apps/api/src/server.js >/tmp/egonarmarket.log 2>&1 &
fi
if ! curl -fsS "http://127.0.0.1:${SUPPLIER_PORT}/api/health" >/dev/null 2>&1 && [ -n "${DATABASE_URL:-}" ]; then
  nohup node apps/api/src/supplier-server.js >/tmp/egonarmarket-supplier.log 2>&1 &
fi

for i in $(seq 1 20); do
  if curl -fsS "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1; then echo "EgonarMarket API disponible sur http://localhost:${PORT}"; break; fi
  sleep 1
done
for i in $(seq 1 20); do
  if curl -fsS "http://127.0.0.1:${SUPPLIER_PORT}/api/health" >/dev/null 2>&1; then echo "Portail fournisseurs disponible sur http://localhost:${SUPPLIER_PORT}"; break; fi
  sleep 1
done
if curl -fsS "http://127.0.0.1:${PREVIEW_PORT}/" >/dev/null 2>&1; then echo "Aperçu boutique disponible sur http://localhost:${PREVIEW_PORT}"; fi
exit 0
