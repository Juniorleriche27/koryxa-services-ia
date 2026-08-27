#!/usr/bin/env bash
set -euo pipefail

# ==============================================================================
# INSTALLATION DU CRON DE SAUVEGARDE QUOTIDIENNE KORYXA (02:00 UTC)
# ==============================================================================

CRON_FILE="/etc/cron.d/koryxa-backup"
BACKUP_SCRIPT="/opt/apps/koryxa-services-ia-backend/scripts/backup_supabase.sh"
LOG_FILE="/var/log/koryxa_backup.log"

if [[ $EUID -eq 0 ]]; then
  chmod +x "${BACKUP_SCRIPT}"
  echo "[+] Configuration de la tâche cron système à 02:00 UTC dans ${CRON_FILE}..."
  cat <<EOF > "${CRON_FILE}"
# /etc/cron.d/koryxa-backup : Sauvegarde quotidienne chiffrée Supabase
CRON_TZ=UTC
SHELL=/bin/bash
PATH=/usr/local/sbin:/usr/local/bin:/sbin:/bin:/usr/sbin:/usr/bin

0 2 * * * root /bin/bash ${BACKUP_SCRIPT} >> ${LOG_FILE} 2>&1
EOF
  chmod 0644 "${CRON_FILE}"
  touch "${LOG_FILE}"
  chmod 0640 "${LOG_FILE}"
  echo "[✓] Tâche cron système installée avec succès (CRON_TZ=UTC, 02:00 UTC)."
else
  echo "[+] Configuration de la tâche cron utilisateur (CRON_TZ=UTC, 02:00 UTC)..."
  chmod +x "${BACKUP_SCRIPT}"
  crontab -l 2>/dev/null | grep -v 'backup_supabase.sh' | {
    cat
    echo "CRON_TZ=UTC"
    echo "0 2 * * * /bin/bash ${BACKUP_SCRIPT} >> /tmp/koryxa_backup.log 2>&1"
  } | crontab -
  echo "[✓] Tâche cron utilisateur installée avec succès (02:00 UTC)."
fi
