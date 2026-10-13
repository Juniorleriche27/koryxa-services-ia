#!/usr/bin/env bash
# CAURI: immutable encrypted pre-migration backup. No cleanup of previous backups.
set -euo pipefail
umask 077
service_env_file="/opt/env/koryxa-services-ia-backend.env"
key_file="/opt/env/koryxa_backup_key.secret"
if [[ ! -f "$service_env_file" ]]; then echo 'ERROR: service environment unavailable' >&2; exit 2; fi
set -a
# Shell input is never echoed or included in command output.
# shellcheck disable=SC1090
source "$service_env_file"
set +a
connection="${SUPABASE_DATABASE_URL:-${SERVICE_IA_DATABASE_URL:-}}"
if [[ -z "$connection" ]]; then echo 'ERROR: database connection unavailable' >&2; exit 2; fi
connection="${connection/postgresql+asyncpg:/postgresql:}"
key="${BACKUP_ENCRYPTION_KEY:-}"
if [[ -z "$key" && -f "$key_file" ]]; then key="$(cat "$key_file")"; fi
if [[ -z "$key" ]]; then key="${SERVICE_IA_ENCRYPTION_KEY:-}"; fi
if [[ ${#key} -lt 16 ]]; then echo 'ERROR: backup encryption key unavailable' >&2; exit 2; fi
backup_dir="/opt/apps/koryxa-services-ia-backend/backups"
mkdir -p "$backup_dir"
file="$backup_dir/cauri_before_20261013_0018_$(date -u +%Y%m%dT%H%M%SZ).dump.enc"
# No unencrypted backup touches disk. Disable terminal echo and avoid printing credentials.
if ! docker run --rm --network host -e TARGET_DATABASE_URL="$connection" postgres:17-alpine \
    sh -c 'exec pg_dump --dbname="$TARGET_DATABASE_URL" --format=custom --no-owner --no-acl' \
    | openssl enc -aes-256-cbc -pbkdf2 -salt -out "$file" -pass "pass:$key"; then
    echo 'ERROR: database snapshot failed' >&2; exit 1
fi
if [[ ! -s "$file" ]]; then echo 'ERROR: empty encrypted snapshot' >&2; exit 1; fi
# Verify decryptability and pg_restore archive manifest without writing plaintext to disk.
if ! openssl enc -d -aes-256-cbc -pbkdf2 -in "$file" -pass "pass:$key" \
    | docker run --rm -i postgres:17-alpine pg_restore --list >/dev/null; then
    echo 'ERROR: backup verification failed' >&2; exit 1
fi
sha256sum "$file" >"$file.sha256"
chmod 600 "$file" "$file.sha256"
printf 'BACKUP_OK %s bytes\n' "$(stat -c %s "$file")"
printf 'BACKUP_PATH %s\n' "$file"
