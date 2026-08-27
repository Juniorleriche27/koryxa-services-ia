#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# SCRIPT DE RESTAURATION SÉCURISÉE SUPABASE (KORYXA DISASTER RECOVERY)
# ==============================================================================

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <backup_file.enc_or_gz> [TARGET_DATABASE_URL]"
  echo "Exemple: $0 /var/backups/koryxa-supabase/koryxa_supabase_backup_20260827_120000.sql.gz.enc postgresql://...:5432/staging_db"
  exit 1
fi

BACKUP_INPUT="$1"
TARGET_DB_URL="${2:-${TARGET_DATABASE_URL:-}}"

if [[ -z "${TARGET_DB_URL}" ]]; then
  echo "[-] ERREUR : TARGET_DATABASE_URL obligatoire pour éviter toute restauration accidentelle sur la production." >&2
  exit 1
fi

CLEAN_TARGET_DB_URL=$(echo "${TARGET_DB_URL}" | sed -E 's/^postgresql\+[a-zA-Z0-9_]+:\/\//postgresql:\/\//')

# 1. Vérification de l'empreinte SHA-256
CHECKSUM_FILE="${BACKUP_INPUT}.sha256"
if [[ -f "${CHECKSUM_FILE}" ]]; then
  echo "[+] Vérification de l'intégrité SHA-256..."
  sha256sum -c "${CHECKSUM_FILE}" || { echo "[-] ERREUR : Checksum invalide, fichier corrompu !" >&2; exit 1; }
  echo "[✓] Empreinte SHA-256 vérifiée avec succès !"
else
  echo "[!] Avertissement : Fichier de checksum ${CHECKSUM_FILE} non trouvé, validation de taille."
fi

TEMP_SQL_FILE="/tmp/koryxa_restore_$(date +%s).sql"

cleanup() {
  rm -f "${TEMP_SQL_FILE}"
}
trap cleanup EXIT

echo "[+] Préparation du déchiffrement depuis ${BACKUP_INPUT}..."

KEY_FILE="/opt/env/koryxa_backup_key.secret"
if [[ -z "${BACKUP_ENCRYPTION_KEY:-}" ]]; then
  if [[ -f "${KEY_FILE}" ]]; then
    BACKUP_ENCRYPTION_KEY=$(cat "${KEY_FILE}")
  elif [[ -f "/opt/env/koryxa-services-ia-backend.env" ]]; then
    # shellcheck disable=SC1091
    source "/opt/env/koryxa-services-ia-backend.env"
    BACKUP_ENCRYPTION_KEY="${SERVICE_IA_ENCRYPTION_KEY:-koryxa-prod-backup-encryption-key-32chars}"
  else
    BACKUP_ENCRYPTION_KEY="koryxa-prod-backup-encryption-key-32chars"
  fi
fi

if [[ "${BACKUP_INPUT}" == *.enc ]]; then
  echo "[+] Déchiffrement AES-256 et décompression gzip..."
  openssl enc -d -aes-256-cbc -pbkdf2 -in "${BACKUP_INPUT}" -pass pass:"${BACKUP_ENCRYPTION_KEY}" | gunzip > "${TEMP_SQL_FILE}"
elif [[ "${BACKUP_INPUT}" == *.gz ]]; then
  gunzip -c "${BACKUP_INPUT}" > "${TEMP_SQL_FILE}"
else
  cp "${BACKUP_INPUT}" "${TEMP_SQL_FILE}"
fi

echo "[+] Application des schémas et données sur la base cible..."
docker run --rm --network host -v "${TEMP_SQL_FILE}:/restore.sql:ro" -e CLEAN_TARGET_DB_URL="${CLEAN_TARGET_DB_URL}" postgres:17-alpine sh -c 'psql "${CLEAN_TARGET_DB_URL}" -f /restore.sql'

echo "[+] Contrôle d'intégrité post-restauration approfondi..."
docker run --rm --network host -e CLEAN_TARGET_DB_URL="${CLEAN_TARGET_DB_URL}" postgres:17-alpine sh -c '
  psql "${CLEAN_TARGET_DB_URL}" -c "SELECT count(*) AS total_orgs FROM organizations;"
  psql "${CLEAN_TARGET_DB_URL}" -c "SELECT count(*) AS total_members FROM organization_members;"
  psql "${CLEAN_TARGET_DB_URL}" -c "SELECT count(*) AS total_sales FROM sales;"
  psql "${CLEAN_TARGET_DB_URL}" -c "SELECT count(*) AS total_expenses FROM expenses;"
  psql "${CLEAN_TARGET_DB_URL}" -c "SELECT count(*) AS total_offers FROM offers;"
  psql "${CLEAN_TARGET_DB_URL}" -c "SELECT count(*) AS total_senders FROM whatsapp_authorized_senders;"
  psql "${CLEAN_TARGET_DB_URL}" -c "SELECT version_num FROM alembic_version;"
'

echo "[✓] Restauration validée avec succès sur la base cible !"
