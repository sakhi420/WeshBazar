#!/usr/bin/env bash
# =============================================================================
# WeshBazar — local PostgreSQL provisioning (Linux / macOS / CI)
#
# Creates the development role and the development, test and shadow databases,
# and installs the pg_trgm extension required by marketplace search.
# Idempotent — safe to run multiple times.
#
# Usage:
#   PGSUPER=postgres scripts/setup-local-db.sh
# =============================================================================
set -euo pipefail

PG_SUPER_USER="${PGSUPER:-postgres}"
DB_HOST="${PGHOST:-localhost}"
DB_PORT="${PGPORT:-5432}"
APP_USER="${APP_USER:-weshbazar}"
APP_PASSWORD="${APP_PASSWORD:-weshbazar}"

psql_super() {
  psql -U "$PG_SUPER_USER" -h "$DB_HOST" -p "$DB_PORT" "$@"
}

# --- Role --------------------------------------------------------------------
if [ "$(psql_super -d postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='${APP_USER}'")" != "1" ]; then
  psql_super -d postgres -v ON_ERROR_STOP=1 -c "CREATE ROLE ${APP_USER} LOGIN PASSWORD '${APP_PASSWORD}'"
  echo "Created role '${APP_USER}'."
else
  echo "Role '${APP_USER}' already exists."
fi

# --- Databases ---------------------------------------------------------------
for db in weshbazar_dev weshbazar_test weshbazar_shadow; do
  if [ "$(psql_super -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='${db}'")" != "1" ]; then
    psql_super -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE ${db} OWNER ${APP_USER}"
    echo "Created database '${db}'."
  else
    echo "Database '${db}' already exists."
  fi

  # Extensions require superuser privileges.
  psql_super -d "$db" -v ON_ERROR_STOP=1 -c "CREATE EXTENSION IF NOT EXISTS pg_trgm"
done

echo ""
echo "Local PostgreSQL is ready."
echo "  Application URL : postgresql://${APP_USER}:${APP_PASSWORD}@${DB_HOST}:${DB_PORT}/weshbazar_dev"
echo "  Test URL        : postgresql://${APP_USER}:${APP_PASSWORD}@${DB_HOST}:${DB_PORT}/weshbazar_test"
echo "  Shadow URL      : postgresql://${APP_USER}:${APP_PASSWORD}@${DB_HOST}:${DB_PORT}/weshbazar_shadow"
