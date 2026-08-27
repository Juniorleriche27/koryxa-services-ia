#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# SCRIPT DE RESTAURATION SÉCURISÉE SUPABASE (KORYXA PRODUCTION / STAGING)
# ==============================================================================

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <backup_file_or_encrypted_file> [TARGET_DATABASE_URL]"
  echo "Exemple: $0 /var/backups/koryxa-supabase/koryxa_supabase_backup_20260827_120000.sql.gz.enc postgresql://...:5432/staging_db"
  exit 1
fi

BACKUP_INPUT="$1"
TARGET_DB_URL="${2:-${TARGET_DATABASE_URL:-}}"

if [[ -z "${TARGET_DB_URL}" ]]; then
  echo "[-] ERREUR : TARGET_DATABASE_URL obligatoire pour éviter toute restauration accidentelle sur la production." >&2
  exit 1
fi

TEMP_SQL_FILE="/tmp/koryxa_restore_$(date +%s).sql"

cleanup() {
  rm -f "${TEMP_SQL_FILE}"
}
trap cleanup EXIT

echo "[+] Préparation de la restauration depuis ${BACKUP_INPUT}..."

if [[ "${BACKUP_INPUT}" == *.enc ]]; then
  if [[ -z "${BACKUP_ENCRYPTION_KEY:-}" ]]; then
    echo -n "Entrez la clé de déchiffrement BACKUP_ENCRYPTION_KEY: "
    read -rs BACKUP_ENCRYPTION_KEY
    echo
  fi
  echo "[+] Déchiffrement AES-256 du backup..."
  openssl enc -d -aes-256-cbc -pbkdf2 -in "${BACKUP_INPUT}" -pass pass:"${BACKUP_ENCRYPTION_KEY}" | gunzip > "${TEMP_SQL_FILE}"
elif [[ "${BACKUP_INPUT}" == *.gz ]]; then
  gunzip -c "${BACKUP_INPUT}" > "${TEMP_SQL_FILE}"
else
  cp "${BACKUP_INPUT}" "${TEMP_SQL_FILE}"
fi

echo "[+] Application des schémas et données sur la base cible..."
if command -v psql >/dev/null 2>&1; then
  psql "${TARGET_DB_URL}" -v ON_ERROR_STOP=1 -f "${TEMP_SQL_FILE}"
  echo "[+] Vérification post-restauration..."
  psql "${TARGET_DB_URL}" -c "SELECT count(*) AS total_orgs FROM organizations;"
  psql "${TARGET_DB_URL}" -c "SELECT count(*) AS total_sales FROM sales;"
  psql "${TARGET_DB_URL}" -c "SELECT count(*) AS total_expenses FROM expenses;"
else
  docker run --rm --network host -v "${TEMP_SQL_FILE}:/restore.sql:ro" -e TARGET_DB_URL="${TARGET_DB_URL}" postgres:17-alpine sh -c 'psql "${TARGET_DB_URL}" -v ON_ERROR_STOP=1 -f /restore.sql'
  echo "[+] Vérification post-restauration..."
  docker run --rm --network host -e TARGET_DB_URL="${TARGET_DB_URL}" postgres:17-alpine sh -c 'psql "${TARGET_DB_URL}" -c "SELECT count(*) AS total_orgs FROM organizations;" && psql "${TARGET_DB_URL}" -c "SELECT count(*) AS total_sales FROM sales;" && psql "${TARGET_DB_URL}" -c "SELECT count(*) AS total_expenses FROM expenses;"'
fi

echo "[✓] Restauration validée avec succès sur la base cible !"
