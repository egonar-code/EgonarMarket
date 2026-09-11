#!/usr/bin/env bash
set -u

cd "$(dirname "$0")/.."

export NODE_ENV="${NODE_ENV:-development}"
export PORT="${PORT:-3000}"
export PREVIEW_PORT="${PREVIEW_PORT:-8080}"
export JWT_SECRET="${JWT_SECRET:-egonarmarket-local-dev-secret}"
export ADMIN_EMAIL="${ADMIN_EMAIL:-admin@egonarmarket.sn}"
export ADMIN_PASSWORD="${ADMIN_PASSWORD:-EgonarDev2026!}"
export POSTGRES_DB="${POSTGRES_DB:-egonarmarket}"
export POSTGRES_USER="${POSTGRES_USER:-egonar}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-egonar_password}"

# Keep the local source tree clean: dependencies are regenerated when absent
# and are ignored by Git via .gitignore.
if [ ! -d node_modules/express ]; then
  npm install --no-audit --no-fund >/tmp/egonarmarket-npm-install.log 2>&1 || true
fi

# Always expose the storefront preview, even if PostgreSQL/API startup fails.
if ! curl -fsS "http://127.0.0.1:${PREVIEW_PORT}/" >/dev/null 2>&1; then
  nohup node scripts/preview-server.js >/tmp/egonarmarket-preview.log 2>&1 &
fi

# Reuse an existing local PostgreSQL container when present.
if docker ps --format '{{.Names}}' | grep -qx 'egonarmarket-db'; then
  :
elif docker ps -a --format '{{.Names}}' | grep -qx 'egonarmarket-db'; then
  docker start egonarmarket-db >/dev/null 2>&1 || true
else
  docker compose up -d postgres >/dev/null 2>&1 || true
fi

# Wait until PostgreSQL accepts connections; preview remains available if it does not.
DB_READY=0
for i in $(seq 1 30); do
  if docker exec egonarmarket-db pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; then
    DB_READY=1
    break
  fi
  sleep 1
done

if [ "$DB_READY" -eq 1 ]; then
  DB_HOST="$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' egonarmarket-db 2>/dev/null || true)"
  if [ -n "$DB_HOST" ]; then
    export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${DB_HOST}:5432/${POSTGRES_DB}"
    npm run db:init >/tmp/egonarmarket-db-init.log 2>&1 || true
  fi
fi

# Start the API when possible. Never take the storefront preview down because the API is unavailable.
if ! curl -fsS "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1; then
  if [ -n "${DATABASE_URL:-}" ]; then
    nohup node apps/api/src/server.js >/tmp/egonarmarket.log 2>&1 &
  fi
fi

# Give the API a few seconds to bind, but do not fail the Codespace bootstrap if it cannot.
for i in $(seq 1 20); do
  if curl -fsS "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1; then
    echo "EgonarMarket API disponible sur http://localhost:${PORT}"
    break
  fi
  sleep 1
done

if curl -fsS "http://127.0.0.1:${PREVIEW_PORT}/" >/dev/null 2>&1; then
  echo "Aperçu boutique disponible sur http://localhost:${PREVIEW_PORT}"
fi

exit 0
