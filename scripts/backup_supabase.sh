#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# SCRIPT DE SAUVEGARDE AUTOMATISÉE SUPABASE (KORYXA PRODUCTION)
# ==============================================================================

BACKUP_DIR="${BACKUP_DIR:-/var/backups/koryxa-supabase}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILENAME="koryxa_supabase_backup_${TIMESTAMP}.sql.gz"
BACKUP_FILE="${BACKUP_DIR}/${BACKUP_FILENAME}"
ENCRYPTED_FILE="${BACKUP_FILE}.enc"
CHECKSUM_FILE="${BACKUP_FILE}.sha256"

mkdir -p "${BACKUP_DIR}"

if [[ -z "${SUPABASE_DATABASE_URL:-}" ]]; then
  if [[ -f "/opt/env/koryxa-services-ia-backend.env" ]]; then
    # shellcheck disable=SC1091
    source "/opt/env/koryxa-services-ia-backend.env"
  fi
fi

DB_URL="${SUPABASE_DATABASE_URL:-${SERVICE_IA_DATABASE_URL:-}}"

if [[ -z "${DB_URL}" ]]; then
  echo "[-] ERREUR : Aucune URL de base de données (SUPABASE_DATABASE_URL) configurée." >&2
  exit 1
fi

echo "[+] Démarrage de la sauvegarde Supabase vers ${BACKUP_FILE}..."

# Export PostgreSQL avec compression gzip
pg_dump --dbname="${DB_URL}" --format=plain --no-owner --no-acl | gzip -9 > "${BACKUP_FILE}"

# Calcul de l'empreinte SHA-256
sha256sum "${BACKUP_FILE}" > "${CHECKSUM_FILE}"

# Chiffrement optionnel si clé présente
if [[ -n "${BACKUP_ENCRYPTION_KEY:-}" ]]; then
  echo "[+] Chiffrement AES-256 du fichier de sauvegarde..."
  openssl enc -aes-256-cbc -pbkdf2 -salt -in "${BACKUP_FILE}" -out "${ENCRYPTED_FILE}" -pass pass:"${BACKUP_ENCRYPTION_KEY}"
  rm -f "${BACKUP_FILE}"
  echo "[+] Sauvegarde chiffrée : ${ENCRYPTED_FILE}"
else
  echo "[+] Sauvegarde standard : ${BACKUP_FILE}"
fi

# Nettoyage des anciennes sauvegardes selon politique de rétention
echo "[+] Nettoyage des sauvegardes antérieures à ${RETENTION_DAYS} jours..."
find "${BACKUP_DIR}" -name "koryxa_supabase_backup_*" -type f -mtime +"${RETENTION_DAYS}" -delete

echo "[✓] Sauvegarde Supabase terminée avec succès !"
