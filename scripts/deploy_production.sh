#!/usr/bin/env bash
# ==============================================================================
# SCRIPT DE DÉPLOIEMENT & MIGRATION PRODUCTION — KORYXA SERVICE IA
# Cible : Serveur VPS Netcup (jek-netcup)
# ==============================================================================

set -euo pipefail

echo "================================================================="
echo "🚀 Démarrage du Déploiement KORYXA Service IA sur jek-netcup"
echo "================================================================="

# 1. Vérification de l'environnement
if [ ! -f ".env" ]; then
    echo "⚠️ Fichier .env absent. Copie depuis .env.example..."
    cp .env.example .env
    echo "👉 Veuillez ajuster les variables sensibles dans .env avant de relancer."
    exit 1
fi

# 2. Récupération des dernières modifications de code
echo "📦 Mise à jour du code source..."
git fetch origin
git pull origin main --ff-only

# 3. Construction des conteneurs Docker (Backend Python + Frontend Next.js)
echo "🔨 Construction des images Docker..."
docker compose build --parallel

# 4. Exécution des migrations de base de données Alembic
echo "🗄️ Application des migrations Alembic (Phase 1 : Stocks, GPS & Présences)..."
docker compose run --rm backend alembic upgrade head

# 5. Redémarrage propre des services
echo "🔄 Redémarrage des conteneurs en production..."
docker compose up -d postgres backend frontend

# 6. Vérification de l'état de santé (Healthchecks)
echo "🩺 Vérification de l'état de santé des services..."
sleep 5

docker compose ps

echo "Vérification Backend API Live..."
curl -f http://localhost:8080/api/v1/health/live || { echo "❌ Échec du healthcheck Live"; exit 1; }

echo "Vérification Backend API Ready..."
curl -f http://localhost:8080/api/v1/health/ready || { echo "❌ Échec du healthcheck Ready"; exit 1; }

echo ""
echo "================================================================="
echo "✅ DÉPLOIEMENT TERMINÉ AVEC SUCCÈS SUR LE SERVEUR !"
echo "================================================================="
echo "• Backend API : http://localhost:8080/api/v1"
echo "• Frontend Cockpit : http://localhost:3000/espace"
echo "• Caisse Express POS : http://localhost:3000/espace/caisse"
echo "• Borne de Pointage : http://localhost:3000/espace/presence/borne"
echo "• N8N Workflows : backend/app/integrations/n8n_workflows/"
echo "================================================================="
