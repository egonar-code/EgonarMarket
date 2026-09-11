#!/usr/bin/env bash
set -u

cd "$(dirname "$0")/.."

export NODE_ENV="${NODE_ENV:-development}"
export PORT="${PORT:-3000}"
export JWT_SECRET="${JWT_SECRET:-egonarmarket-local-dev-secret}"
export ADMIN_EMAIL="${ADMIN_EMAIL:-admin@egonarmarket.sn}"
export ADMIN_PASSWORD="${ADMIN_PASSWORD:-EgonarDev2026!}"
export POSTGRES_DB="${POSTGRES_DB:-egonarmarket}"
export POSTGRES_USER="${POSTGRES_USER:-egonar}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-egonar_password}"

log="/tmp/egonarmarket.log"
: > "$log"

# Try the real PostgreSQL-backed app first, but never block the shop preview on Docker/database problems.
DB_READY=0
if command -v docker >/dev/null 2>&1; then
  if docker ps --format '{{.Names}}' | grep -qx 'egonarmarket-db'; then
    :
  elif docker ps -a --format '{{.Names}}' | grep -qx 'egonarmarket-db'; then
    docker start egonarmarket-db >/dev/null 2>&1 || true
  else
    docker compose up -d postgres >/dev/null 2>&1 || true
  fi
  for i in $(seq 1 30); do
    if docker exec egonarmarket-db pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
      DB_READY=1
      break
    fi
    sleep 1
  done
fi

if [ "$DB_READY" -eq 1 ]; then
  DB_HOST="$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' egonarmarket-db 2>/dev/null || true)"
  if [ -n "$DB_HOST" ]; then
    export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${DB_HOST}:5432/${POSTGRES_DB}"
    if npm run db:init >>"$log" 2>&1; then
      nohup node apps/api/src/server.js >>"$log" 2>&1 &
      SERVER_PID=$!
      for i in $(seq 1 20); do
        if curl -fsS "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1; then
          echo "EgonarMarket démarré sur http://localhost:${PORT}" >>"$log"
          exit 0
        fi
        if ! kill -0 "$SERVER_PID" >/dev/null 2>&1; then
          break
        fi
        sleep 1
      done
    fi
  fi
fi

# Fallback: a self-contained preview keeps port 3000 usable even when Docker/PostgreSQL is unavailable.
pkill -f 'node apps/api/src/(server|preview-server)\.js' >/dev/null 2>&1 || true
nohup node apps/api/src/preview-server.js >>"$log" 2>&1 &
PREVIEW_PID=$!
for i in $(seq 1 15); do
  if curl -fsS "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1; then
    echo "EgonarMarket aperçu démarré sur http://localhost:${PORT}" >>"$log"
    exit 0
  fi
  if ! kill -0 "$PREVIEW_PID" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "EgonarMarket n'a pas pu démarrer. Voir $log" >&2
cat "$log" >&2 || true
exit 1
