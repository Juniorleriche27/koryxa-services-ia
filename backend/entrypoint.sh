#!/bin/sh
set -eu
alembic upgrade head
WORKERS=${UVICORN_WORKERS:-2}
exec uvicorn app.main:app --host 0.0.0.0 --port 8080 --workers "$WORKERS" --timeout-keep-alive 65
