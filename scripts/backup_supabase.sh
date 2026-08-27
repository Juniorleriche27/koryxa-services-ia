#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# SCRIPT DE SAUVEGARDE AUTOMATISÉE SUPABASE (KORYXA PRODUCTION)
# ==============================================================================

BACKUP_DIR="${BACKUP_DIR:-/opt/backups/koryxa-supabase}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
TIMESTAMP=$(date -u +"%Y%m%d_%H%M%SZ")
BACKUP_FILENAME="koryxa_supabase_backup_${TIMESTAMP}.sql.gz"
RAW_FILE="${BACKUP_DIR}/${BACKUP_FILENAME}"
FINAL_FILE="${RAW_FILE}.enc"
CHECKSUM_FILE="${FINAL_FILE}.sha256"

mkdir -p "${BACKUP_DIR}"

# Chargement de l'environnement si nécessaire
if [[ -z "${SUPABASE_DATABASE_URL:-}" ]]; then
  if [[ -f "/opt/env/koryxa-services-ia-backend.env" ]]; then
    # shellcheck disable=SC1091
    source "/opt/env/koryxa-services-ia-backend.env"
  fi
fi

# Clé de chiffrement (OBLIGATOIRE, aucun fallback hardcodé autorisé)
KEY_FILE="/opt/env/koryxa_backup_key.secret"
BACKUP_ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"

if [[ -z "${BACKUP_ENCRYPTION_KEY}" ]]; then
  if [[ -f "${KEY_FILE}" ]]; then
    BACKUP_ENCRYPTION_KEY=$(cat "${KEY_FILE}")
  elif [[ -n "${SERVICE_IA_ENCRYPTION_KEY:-}" ]]; then
    BACKUP_ENCRYPTION_KEY="${SERVICE_IA_ENCRYPTION_KEY}"
  fi
fi

alert_failure() {
  local msg="$1"
  echo "[-] ERREUR SAUVEGARDE : ${msg}" >&2
  if [[ -n "${BACKUP_ALERT_WEBHOOK_URL:-}" ]]; then
    curl -s -X POST -H "Content-Type: application/json" -d "{\"text\":\"[ALERTE KORYXA] Échec sauvegarde Supabase : ${msg}\"}" "${BACKUP_ALERT_WEBHOOK_URL}" || true
  fi
}

if [[ -z "${BACKUP_ENCRYPTION_KEY}" || ${#BACKUP_ENCRYPTION_KEY} -lt 16 ]]; then
  alert_failure "Clé de chiffrement absente ou invalide (BACKUP_ENCRYPTION_KEY ou ${KEY_FILE} requise, min 16 chars)."
  exit 1
fi

DB_URL="${SUPABASE_DATABASE_URL:-${SERVICE_IA_DATABASE_URL:-}}"

if [[ -z "${DB_URL}" ]]; then
  alert_failure "Aucune URL de base de données (SUPABASE_DATABASE_URL) configurée."
  exit 1
fi

CLEAN_DB_URL=$(echo "${DB_URL}" | sed -E 's/^postgresql\+[a-zA-Z0-9_]+:\/\//postgresql:\/\//')

echo "[+] [${TIMESTAMP}] Démarrage de la sauvegarde Supabase vers ${RAW_FILE}..."

# Export PostgreSQL avec compression gzip (schéma public applicatif avec --clean --if-exists)
if command -v pg_dump >/dev/null 2>&1; then
  pg_dump --dbname="${CLEAN_DB_URL}" --format=plain --no-owner --no-acl --schema=public --clean --if-exists | gzip -9 > "${RAW_FILE}" || { alert_failure "Échec pg_dump local"; exit 1; }
else
  docker run --rm --network host -e CLEAN_DB_URL="${CLEAN_DB_URL}" postgres:17-alpine sh -c 'pg_dump --dbname="${CLEAN_DB_URL}" --format=plain --no-owner --no-acl --schema=public --clean --if-exists' | gzip -9 > "${RAW_FILE}" || { alert_failure "Échec pg_dump docker"; exit 1; }
fi

# Chiffrement AES-256 systématique
echo "[+] Chiffrement AES-256-CBC systématique de la sauvegarde..."
openssl enc -aes-256-cbc -pbkdf2 -salt -in "${RAW_FILE}" -out "${FINAL_FILE}" -pass pass:"${BACKUP_ENCRYPTION_KEY}"
rm -f "${RAW_FILE}"

# Calcul de l'empreinte SHA-256 sur l'archive chiffrée finale
sha256sum "${FINAL_FILE}" > "${CHECKSUM_FILE}"
echo "[+] Empreinte SHA-256 enregistrée : $(cat "${CHECKSUM_FILE}")"

# Copie hors serveur obligatoire si configurée
if [[ -n "${OFFSITE_BACKUP_DEST:-}" ]]; then
  echo "[+] Synchronisation hors site vers ${OFFSITE_BACKUP_DEST}..."
  rsync -avz "${FINAL_FILE}" "${CHECKSUM_FILE}" "${OFFSITE_BACKUP_DEST}" || {
    alert_failure "Échec de la synchronisation distante vers ${OFFSITE_BACKUP_DEST}"
    exit 1
  }
fi

# Nettoyage selon politique de rétention
echo "[+] Nettoyage des sauvegardes antérieures à ${RETENTION_DAYS} jours..."
find "${BACKUP_DIR}" -name "koryxa_supabase_backup_*" -type f -mtime +"${RETENTION_DAYS}" -delete

echo "[✓] Sauvegarde Supabase chiffrée et vérifiée avec succès : ${FINAL_FILE}"
