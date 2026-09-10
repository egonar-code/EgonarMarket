#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

# The app and PostgreSQL run in the same Compose network. This avoids
# localhost/container networking problems inside GitHub Codespaces.
export POSTGRES_DB="${POSTGRES_DB:-egonarmarket}"
export POSTGRES_USER="${POSTGRES_USER:-egonar}"
export POSTGRES_PASSWORD="${POSTGRES_PASSWORD:-egonar_password}"

# Reconcile the complete local stack. Existing containers are reused/recreated
# safely from the current Compose definition; PostgreSQL data stays in volume.
docker compose up -d --build postgres app

# Wait for the web service to answer before declaring the preview ready.
for i in $(seq 1 30); do
  if curl -fsS "http://127.0.0.1:3000/api/health" >/dev/null 2>&1; then
    echo "EgonarMarket prêt : http://localhost:3000"
    exit 0
  fi
  sleep 1
done

echo "EgonarMarket : les conteneurs sont démarrés mais l'API n'est pas encore prête."
docker compose ps
exit 1
