#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# INSTALLATION DU CRON DE SAUVEGARDE QUOTIDIENNE KORYXA (02:00 UTC)
# ==============================================================================

CRON_FILE="/etc/cron.d/koryxa-backup"
BACKUP_SCRIPT="/opt/apps/koryxa-services-ia-backend/scripts/backup_supabase.sh"
LOG_FILE="/var/log/koryxa_backup.log"

if [[ $EUID -ne 0 ]]; then
  echo "[-] Ce script doit être exécuté en root (sudo $0)" >&2
  exit 1
fi

chmod +x "${BACKUP_SCRIPT}"

echo "[+] Configuration de la tâche cron quotidienne à 02:00 UTC dans ${CRON_FILE}..."

cat <<EOF > "${CRON_FILE}"
# /etc/cron.d/koryxa-backup : Sauvegarde quotidienne chiffrée Supabase
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

0 2 * * * root /bin/bash ${BACKUP_SCRIPT} >> ${LOG_FILE} 2>&1
EOF

chmod 0644 "${CRON_FILE}"
touch "${LOG_FILE}"
chmod 0640 "${LOG_FILE}"

echo "[✓] Tâche cron installée avec succès ! Les sauvegardes s'exécuteront tous les jours à 02:00 UTC."
