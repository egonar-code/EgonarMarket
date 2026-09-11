#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

export NODE_ENV="${NODE_ENV:-development}"
export PORT="${PORT:-3000}"
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

# Connect from the Codespace host to the running container by its Docker IP.
DB_HOST="$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' egonarmarket-db)"
if [ -z "$DB_HOST" ]; then
  echo "PostgreSQL container IP introuvable." >&2
  exit 1
fi
export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${DB_HOST}:5432/${POSTGRES_DB}"

# Initialize/update schema and development admin/products using the same DATABASE_URL.
npm run db:init

# Do not duplicate the server if it is already healthy.
if curl -fsS "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1; then
  echo "EgonarMarket est déjà démarré sur http://localhost:${PORT}"
  exit 0
fi

nohup node apps/api/src/server.js >/tmp/egonarmarket.log 2>&1 &
SERVER_PID=$!

# Give the API a few seconds to bind before declaring success.
for i in $(seq 1 20); do
  if curl -fsS "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1; then
    echo "EgonarMarket démarré sur http://localhost:${PORT}"
    exit 0
  fi
  if ! kill -0 "$SERVER_PID" >/dev/null 2>&1; then
    echo "Le serveur EgonarMarket s'est arrêté au démarrage." >&2
    cat /tmp/egonarmarket.log >&2 || true
    exit 1
  fi
  sleep 1
done

echo "Le serveur EgonarMarket n'est pas devenu disponible." >&2
cat /tmp/egonarmarket.log >&2 || true
exit 1
