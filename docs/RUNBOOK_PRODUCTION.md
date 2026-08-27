# Runbook d'Exploitation & Production KORYXA

## 1. Architecture des Composants en Production
- **prod_koryxa_services_ia_api** : Backend FastAPI multi-workers Uvicorn.
- **koryxa-whatsapp-bridge** : Connecteur Baileys Multi-Device (Node 20 non-root).
- **Supabase** : Base PostgreSQL managée distante avec TLS forcé.
- **prod_caddy** : Reverse-proxy SSL automatique.

## 2. Sauvegardes & Restauration (Chantier 4)
- **Fréquence** : Quotidienne automatisée via cron à 02:00 UTC.
- **RPO Cible** : 1 heure.
- **RTO Cible** : 15 minutes.
- **Commande de Sauvegarde** :
  ```bash
  /opt/apps/koryxa-services-ia/scripts/backup_supabase.sh
  ```
- **Commande de Restauration Test** :
  ```bash
  /opt/apps/koryxa-services-ia/scripts/restore_supabase.sh /var/backups/koryxa-supabase/koryxa_supabase_backup_YYYYMMDD_HHMMSS.sql.gz.enc postgresql://...:5432/staging_db
  ```

## 3. Procédure de Rotation des Secrets (Chantier 6)
1. Générer de nouveaux secrets aléatoires (min 32 caractères) :
   ```bash
   openssl rand -hex 32
   ```
2. Mettre à jour `/opt/env/koryxa-services-ia-backend.env` (`SERVICE_IA_PROXY_SECRET`, `SERVICE_IA_ENCRYPTION_KEY`).
3. Redémarrer les services avec zéro interruption :
   ```bash
   docker-compose up -d --force-recreate
   ```

## 4. Procédure de Rollback d'Urgence
En cas d'incident critique sur un déploiement :
```bash
cd /opt/apps/koryxa-services-ia-backend
git checkout <PREVIOUS_COMMIT_SHA>
docker-compose build
docker-compose up -d --force-recreate
```
