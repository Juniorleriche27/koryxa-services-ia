#!/usr/bin/env bash
# Repeatable release gate for an explicitly disposable PostgreSQL database.
set -euo pipefail

if [[ -z "${CAURI_ISOLATED_TEST_DSN:-}" ]]; then
  echo "CAURI_ISOLATED_TEST_DSN is required" >&2
  exit 2
fi
database_name="${CAURI_ISOLATED_TEST_DSN##*/}"
database_name="${database_name%%\?*}"
case "${database_name,,}" in
  *test*|*validation*|*isolated*) ;;
  *) echo "Refusing non-disposable database name" >&2; exit 2 ;;
esac

export SERVICE_IA_ENVIRONMENT=test
export SERVICE_IA_DATABASE_URL="${CAURI_ISOLATED_TEST_DSN/postgresql:\/\//postgresql+asyncpg:\/\/}"
export PYTHONPATH="${PWD}${PYTHONPATH:+:${PYTHONPATH}}"
alembic upgrade head
python tests/manual_postgres_fk_probe.py
python tests/manual_postgres_radar_concurrency.py
python tests/manual_postgres_financial_audit.py
printf 'POSTGRES_RELEASE_GATE_OK database=%s head=%s\n' \
  "$database_name" "$(alembic current 2>/dev/null | awk '{print $1}')"
