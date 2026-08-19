# Guide de Déploiement & Mise en Production sur Serveur Netcup (`jek-netcup`)

Ce guide détaille la procédure de déploiement en production de **KORYXA Service IA** et son orchestration avec **Knowlia**, **OpenClaw** et **n8n**.

---

## 🏗️ Architecture Serveur

| Composant | Rôle & Port | Emplacement / Conteneur |
| :--- | :--- | :--- |
| **KORYXA Service IA Backend** | API FastAPI, Moteur de Stocks & Présences (`:8080`) | Docker `service_ia_backend` |
| **KORYXA Service IA Frontend** | Cockpit Next.js, Caisse POS, Borne QR (`:3000`) | Docker `service_ia_frontend` |
| **PostgreSQL 17** | Base de données relationnelle persistante | Docker `service_ia_postgres` |
| **Knowlia** | Cerveau IA partagé multi-projets (`:8093`) | `/opt/apps/knowlia` |
| **OpenClaw** | Passerelle WhatsApp & Assistants (`:8088`) | `/opt/apps/openclaw` |
| **n8n** | Moteur d'automatisation des flux (`:5678`) | `/opt/apps/n8n` |

---

## 🚀 Procédure de Déploiement en 1 Clic

Connectez-vous en SSH sur le VPS Netcup :

```bash
ssh root@jek-netcup
cd /opt/apps/koryxa-services-ia   # ou répertoire du projet
```

Exécutez le script de déploiement :

```bash
chmod +x scripts/deploy_production.sh
./scripts/deploy_production.sh
```

---

## 🗄️ Migrations de Base de Données

La migration `20260819_0011_phase1_business_stock_attendance.py` apporte :
- Les colonnes `business_category`, `latitude`, `longitude`, `geofence_radius_meters` dans `organizations`.
- Les colonnes `track_stock`, `stock_quantity`, `min_stock_alert`, `cost_price` dans `offers`.
- La table indexée `attendance_records` avec traçabilité GPS et horodatage.

Pour exécuter manuellement la migration si nécessaire :

```bash
docker compose run --rm backend alembic upgrade head
```

---

## ⚡ Importation des Flux n8n

Dans l'interface web de n8n (`http://jek-netcup:5678`) :
1. Cliquez sur **Workflows > Import from File**.
2. Importez les 2 workflows situés dans `backend/app/integrations/n8n_workflows/` :
   - `koryxa_bilan_soir_21h.json` : Déclenchement tous les soirs à 21h00 UTC pour envoyer le bilan exécutif au gérant.
   - `koryxa_relance_impayes_09h.json` : Déclenchement du lundi au vendredi à 09h00 UTC pour relancer les clients en retard de paiement.
3. Activez le bouton **Active** sur les deux flux.

---

## 📱 Connexion WhatsApp via OpenClaw

1. Rendez-vous sur `https://service-ia.koryxa.fr/espace/whatsapp`.
2. L'onglet **Scan QR Code (OpenClaw)** affiche le QR code de session.
3. Sur votre smartphone, ouvrez **WhatsApp > Appareils connectés > Connecter un appareil** et scannez le QR code.
4. Vos vendeurs et gérants peuvent immédiatement dicter leurs ventes par notes vocales ou messages !
