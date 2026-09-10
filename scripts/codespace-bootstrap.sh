#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

export NODE_ENV="${NODE_ENV:-development}"
export PORT="${PORT:-3000}"
export DATABASE_URL="${DATABASE_URL:-postgresql://egonar:egonar_password@127.0.0.1:5432/egonarmarket}"
export JWT_SECRET="${JWT_SECRET:-egonarmarket-local-dev-secret}"
export ADMIN_EMAIL="${ADMIN_EMAIL:-admin@egonarmarket.sn}"
export ADMIN_PASSWORD="${ADMIN_PASSWORD:-EgonarDev2026!}"
export POSTGRES_DB="${POSTGRES_DB:-egonarmarket}"
export POSTGRES_USER="${POSTGRES_USER:-egonar}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-egonar_password}"

# Reuse an existing local PostgreSQL container when present.
if docker ps --format '{{.Names}}' | grep -qx 'egonarmarket-db'; then
  :
elif docker ps -a --format '{{.Names}}' | grep -qx 'egonarmarket-db'; then
  docker start egonarmarket-db >/dev/null
else
  docker compose up -d postgres >/dev/null
fi

# Wait until PostgreSQL accepts connections.
for i in $(seq 1 30); do
  if docker exec egonarmarket-db pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

docker exec egonarmarket-db pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null

# Initialize/update schema and development admin/products.
npm run db:init

# Do not duplicate the server if it is already healthy.
if curl -fsS "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1; then
  exit 0
fi

nohup node apps/api/src/server.js >/tmp/egonarmarket.log 2>&1 &
echo "EgonarMarket démarré sur http://localhost:${PORT}"
