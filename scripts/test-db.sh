#!/usr/bin/env bash
# Applies the migrations to a throwaway local Postgres and runs the SQL tests, without the
# Supabase CLI or Docker. Needs a local Postgres 15+ server (PGHOST/PGPORT/PGUSER as usual).
# Supabase-only pieces (auth schema, roles, pg_cron, pg_net) are stubbed in tests/local_stub.sql.
# For the real thing use `supabase start && supabase db reset` (needs Docker).
set -euo pipefail
cd "$(dirname "$0")/../supabase"
DB="${DB:-petos_test}"
psql -v ON_ERROR_STOP=1 -q -d postgres -c "drop database if exists $DB" -c "create database $DB"
psql -v ON_ERROR_STOP=1 -q -d "$DB" -f tests/local_stub.sql
for f in migrations/*.sql; do
  echo "migrate $f"
  sed -E 's/^create extension if not exists (pg_cron|pg_net).*//' "$f" | psql -v ON_ERROR_STOP=1 -q -d "$DB" >/dev/null
done
psql -v ON_ERROR_STOP=1 -q -d "$DB" -f tests/rls_checks.sql && echo "rls checks ok"
psql -v ON_ERROR_STOP=1 -q -d "$DB" -f tests/lifecycle.sql
psql -v ON_ERROR_STOP=1 -q -d "$DB" -f tests/household.sql
