#!/usr/bin/env bash
set -u
cd "$(dirname "$0")/.."

export NODE_ENV="${NODE_ENV:-development}"
export PORT="${PORT:-3000}"
export JWT_SECRET="${JWT_SECRET:-egonarmarket-local-dev-secret}"
export ADMIN_EMAIL="${ADMIN_EMAIL:-admin@egonarmarket.sn}"
export ADMIN_PASSWORD="${ADMIN_PASSWORD:-EgonDev2026!}"
export POSTGRES_DB="${POSTGRES_DB:-egonarmarket}"
export POSTGRES_USER="${POSTGRES_USER:-egonar}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-egonar_password}"

if [ ! -d node_modules/express ]; then
  npm install --no-audit --no-fund >/tmp/egonarmarket-npm-install.log 2>&1 || true
fi

DB_HOST="$(docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' egonarmarket-db 2>/dev/null || true)"
if [ -z "$DB_HOST" ]; then
  echo "PostgreSQL egonarmarket-db est introuvable. Lancez d'abord scripts/codespace-bootstrap.sh."
  exit 1
fi
export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${DB_HOST}:5432/${POSTGRES_DB}"

npm run db:init >/tmp/egonarmarket-db-init.log 2>&1 || true

pkill -f "apps/api/src/server.js" >/dev/null 2>&1 || true
NODE_OPTIONS="--require=$(pwd)/apps/api/src/egonar-ai-preload.js" nohup node apps/api/src/server.js >/tmp/egonarmarket-ai.log 2>&1 &

for i in $(seq 1 20); do
  if curl -fsS "http://127.0.0.1:${PORT}/api/health" >/dev/null 2>&1; then
    echo "EgonarMarket AI disponible sur http://localhost:${PORT}"
    exit 0
  fi
  sleep 1
done

cat /tmp/egonarmarket-ai.log
exit 1
