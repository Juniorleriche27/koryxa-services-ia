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

# 3. Construction de l'image immuable du backend
echo "🔨 Construction des images Docker..."
export GIT_COMMIT="$(git rev-parse --short HEAD)"
docker compose config --quiet
docker compose build backend

# 4. Sauvegarde avant migration
echo "💾 Sauvegarde PostgreSQL avant migration..."
mkdir -p backups
backup_file="backups/service_ia_$(date -u +%Y%m%dT%H%M%SZ).dump"
docker compose exec -T postgres pg_dump -U service_ia -d service_ia -Fc > "$backup_file"
test -s "$backup_file"

# 5. Migration et redémarrage contrôlé
echo "🗄️ Validation et application des migrations Alembic..."
docker compose run --rm backend alembic upgrade head
docker compose run --rm backend alembic check
echo "🔄 Redémarrage des conteneurs en production..."
docker compose up -d --no-build postgres backend

# 6. Vérification de l'état de santé (Healthchecks)
echo "🩺 Vérification de l'état de santé des services..."
for _ in $(seq 1 24); do
    status="$(docker inspect -f '{{.State.Health.Status}}' prod_koryxa_services_ia_api 2>/dev/null || true)"
    [ "$status" = "healthy" ] && break
    sleep 5
done
[ "${status:-}" = "healthy" ] || { docker compose logs --tail=100 backend; exit 1; }

echo "Vérification Backend API Live..."
docker compose exec -T backend python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/api/v1/health/live')"

echo "Vérification Backend API Ready..."
docker compose exec -T backend python -c "import urllib.request; urllib.request.urlopen('http://localhost:8080/api/v1/health/ready')"

echo "Vérification API publique..."
curl --fail --silent --show-error "${PUBLIC_API_URL%/}/health/live" >/dev/null

echo ""
echo "================================================================="
echo "✅ DÉPLOIEMENT TERMINÉ AVEC SUCCÈS SUR LE SERVEUR !"
echo "================================================================="
echo "• Backend API : ${PUBLIC_API_URL}"
echo "• Image : koryxa-services-ia-backend:${GIT_COMMIT}"
echo "• Sauvegarde : ${backup_file}"
echo "• N8N Workflows : backend/app/integrations/n8n_workflows/"
echo "================================================================="
