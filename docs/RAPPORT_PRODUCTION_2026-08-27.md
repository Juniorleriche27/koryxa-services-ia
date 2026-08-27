# Rapport de sécurisation et mise en production — 27 août 2026

## Verdict

Le service IA est validé pour le périmètre déployé après correction des blocages critiques constatés lors du contre-audit. La validation finale exige simultanément : qualité backend, tests backend, frontend, migrations reproductibles, conteneur sain, API publique joignable et alignement du commit Git avec l'image en production.

## Bilan des huit chantiers

1. **Sécurité multi-tenant et autorisations** — filtrage strict par `tenant_id`, suppression de l'auto-promotion du créateur en `OWNER`, permissions `CONTRIBUTOR` limitées et tests d'isolation dédiés.
2. **Assainissement et reproductibilité** — dépendances Python verrouillées, image Python épinglée, image applicative identifiée par commit Git et contrôles automatisés dans la CI.
3. **Base de données et migrations** — suppression du DDL applicatif au runtime, réparation de la chaîne Alembic, migration complète depuis une base vide et `alembic check` sans dérive.
4. **Qualité, tests et CI/CD** — Ruff, mypy, pytest, ESLint, Vitest, audit npm et build Next.js intégrés aux contrôles de livraison.
5. **Résilience et protection contre les abus** — limitation des requêtes, plafonnement des fichiers vocaux, deux workers, limites CPU/mémoire/PID et healthchecks de disponibilité réelle.
6. **Secrets, chiffrement et durcissement** — secrets proxy et chiffrement obligatoirement distincts, chiffrement Fernet, système de fichiers du conteneur en lecture seule, capacités Linux supprimées et `no-new-privileges`.
7. **Exploitation, observabilité et sauvegardes** — endpoints live/ready, commit exposé dans le diagnostic live, logs Docker rotatifs, sauvegarde PostgreSQL avant migration et contrôle public post-déploiement.
8. **Gouvernance IA, confidentialité et conformité** — suppression des fallbacks inter-organisation, webhook Meta signé obligatoirement, webhook interne protégé par secret et refus explicite des organisations inconnues.

## Preuves de validation

- Backend : Ruff sans erreur ; mypy sans erreur sur 98 fichiers ; 52 tests réussis.
- Frontend : ESLint sans erreur ; 10 tests Vitest réussis ; build Next.js de production réussi ; audit npm avec zéro vulnérabilité.
- Base : migration Alembic complète sur base jetable ; 25 tables obtenues ; révision `20260819_0011` ; aucune opération manquante détectée.
- Déploiement : le script refuse une configuration Compose invalide, sauvegarde PostgreSQL, applique et contrôle les migrations, attend l'état `healthy`, puis contrôle les endpoints interne et public.

## Procédure de retour arrière

Conserver le volume PostgreSQL et la sauvegarde générée dans `backups/`. Restaurer l'image immuable précédente, vérifier la compatibilité de sa révision Alembic, puis contrôler `/api/v1/health/live` et `/api/v1/health/ready`. Une restauration de données doit toujours être testée sur une base séparée avant remplacement de la base active.

## Réserves d'exploitation

Le statut vert atteste le code, le schéma, le conteneur et l'accès public au moment de la livraison. La supervision externe, la rotation périodique des secrets et les exercices de restauration restent des activités continues d'exploitation, et non un état définitivement acquis.
