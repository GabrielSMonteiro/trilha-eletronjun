#!/usr/bin/env bash
set -euo pipefail

# Ensure DATABASE_URL is set
if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set. Export DATABASE_URL or run with it in environment."
  echo "Example: export DATABASE_URL=\"postgres://user:pass@localhost:5432/dbname\""
  exit 1
fi

MIGRATIONS_DIR="./supabase/migrations"

if [ ! -d "$MIGRATIONS_DIR" ]; then
  echo "Migrations directory not found: $MIGRATIONS_DIR"
  exit 1
fi

shopt -s nullglob
for f in "$MIGRATIONS_DIR"/*.sql; do
  echo "Applying $f"
  psql "$DATABASE_URL" -f "$f"
done

echo "All migrations applied."
