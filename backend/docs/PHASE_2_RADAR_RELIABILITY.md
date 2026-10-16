# CAURI — Phase 2 backend : fiabilisation Radar (chantiers 05–08)

## Modifications vérifiées

- **Score unique** : `radar_scoring.py` v2. `RadarService.scores()`, Dashboard, Grand Hall et `/radar/quality` utilisent la même formule pondérée. Le champ historique `RadarRun.scores` reste un dictionnaire des quatre dimensions pour la compatibilité.
- **Population complète** : les alertes `open` et `acknowledged` comptent dans les pénalités ; une simple prise en charge ne fait pas artificiellement remonter le score. Les règles explicitement désactivées sont exclues du score ; la quantité exclue est exposée.
- **Mesure d'audit** : `audit_status` (`not_executed`, `executed`), `last_audit_at`, `rules_total`, `rules_enabled`, `rule_coverage_ratio`, `freshness_status`. `quality_certified=false` demeure volontairement : l'exécution de Radar ne prouve pas que tous les registres ont été contrôlés.
- **Réexécution** : l'identité d'une anomalie est (règle, type, enregistrement), indépendamment des preuves mutables ; l'alerte est réutilisée, ses preuves actualisées. Une alerte `acknowledged` reste prise en charge ; une `resolved`/`ignored` redevient `open` si la règle détecte toujours l'anomalie.
- **Transitions** : seules les transitions prévues sont autorisées, un changement identique est idempotent. Les recherches et mises à jour restent filtrées par entreprise et permission.
- **API** : `GET /api/v1/radar/quality`, lecture protégée par `registers:read`, sans changement de schéma de base de données.

## Formule officielle

Pour chaque dimension : `S = 100 - min(plafond_dimension, alertes_actives * pénalité_dimension)`.
Score global : `arrondi(0,35 * complétude + 0,25 * fraîcheur + 0,25 * cohérence + 0,15 * traçabilité)`.

## Limites restant à concevoir avant certification exhaustive

1. Le cycle complet d'alertes n'a pas encore d'**historique immuable des transitions**, auteur, responsable ou date de clôture. Une migration dédiée, des permissions de workflow et des événements d'audit seront nécessaires ; rien n'a été appliqué en production.
2. Les 16 règles par défaut ont été inventoriées ; leur validation métier secteur par secteur, faux positifs et faux négatifs nécessite des corpus de référence représentatifs.
3. Le score n'est pas un certificat de santé de l'entreprise : la couverture des **règles activées** n'est pas la couverture effective de tous les enregistrements ; `quality_certified=false` le signale explicitement.
4. La déduplication est assurée en réexécution séquentielle ; la résistance aux **exécutions concurrentes** demande une sérialisation par entreprise/règle ou une contrainte de base sur l'identité stable. L'ancien index unique de fingerprint n'assure pas l'unicité de (règle,type,enregistrement) à lui seul.
5. Le score stocké sur un `RadarRun` reflète la situation à l'instant de son exécution ; le score de l'API reflète les alertes actuellement actives. C'est attendu et doit être indiqué côté client.

## Tests

`PYTHONPATH=/workspace/.cauri-test-deps python3 -m pytest -q --disable-warnings --maxfail=1`

Les tests `test_radar_phase2.py` couvrent notamment la réexécution, les états acquitté/résolu, la non-duplication, l'isolation par organisation, la cohérence des scores et le statut d'audit.

Aucun fichier frontend modifié par ce chantier, aucun commit, push ni déploiement.
