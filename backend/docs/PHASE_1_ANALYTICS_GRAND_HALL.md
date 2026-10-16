# CAURI — Phase 1 backend : contrat analytique et Grand Hall

## Périmètre

**Backend uniquement.** Les composants frontend, leurs routes, CSS et données d'affichage ne sont pas modifiés. Aucune migration, aucun déploiement et aucun push dans cette phase.

### Services réutilisés

- `financial_metrics.summarize_registers` et `collect_financial_registers` : règles métier de ventes/dépenses validées et paiements.
- `financial_summary.fetch_summary` : snapshot commun utilisé par le dashboard et l'orchestrateur.
- `finance_ledger.account_balances` : solde des comptes déclarés (non rapproché bancairement).
- `radar_scoring.radar_quality_score` : score sur l'ensemble des alertes ouvertes.

Les règles de calcul restent dans les services métier, pas dans les routes API.

## Contrat universel d'indicateur v1

`app.services.analytics_contract.MetricResult` : `code`, `value`, `unit`, `currency`, `period`, `organization_id`, `formula_version`, `status`, `reason`, `sources`, `calculated_at`.

- Valeurs monétaires : `Decimal` en Python, **chaînes décimales** dans la nouvelle API JSON. Les anciennes API restent inchangées pour préserver la compatibilité.
- `0` est une valeur calculée, distincte de `null`.
- `null` exige un statut non calculable (`incomplet`, `incompatible`, `non_applicable`, `obsolete`, `erreur`).
- `exact_decimal` refuse les `float`, NaN et Infinity. `round_money` utilise `ROUND_HALF_UP` explicite.
- Les valeurs monétaires restent liées à une devise unique : les agrégats multidevises non convertis sont indisponibles.

## Contrat API Grand Hall v1

`GET /api/v1/grand-hall` : authentification organisationnelle existante et permission `registers:read` obligatoire. Résultat filtré par l'entreprise courante, sans paramètre permettant de choisir arbitrairement une autre entreprise.

Champs : `schema_version`, `organization_id`, `generated_at`, `period`, `metrics`, `radar`, `operations`, `alerts`, `refresh`.

- `metrics` : dictionnaire d'indicateurs versionnés avec leur statut, raison éventuelle et valeur sérialisée exactement.
- `radar` : score de qualité des données, non score de rentabilité ; calcul sur **toutes** les alertes ouvertes, sans pagination.
- `operations` : volumes de ventes, offres, procédures, fournisseurs, stock, présence.
- `alerts.open_count` : nombre d'alertes ouvertes dans le même périmètre que le score.
- `refresh.strategy = on_demand` : actualisation au chargement. Ni WebSocket ni SSE imposés.

Le front peut continuer à appeler l'endpoint `/dashboard` historique pendant l'intégration du Grand Hall.

## Intégrité et cycle de vie des écritures — état Phase 1

Les validations existantes sont conservées : statuts des documents, paiements partiels, exclusion des remboursements, isolation par organisation, montants positifs pour les mouvements, transferts à deux jambes atomiques, contrôle applicatif des sources déjà enregistrées.

**Points à durcir lors d'une migration dédiée, à valider avant production :** contrainte transactionnelle DB contre deux créations simultanées portant la même référence source, gestion des paiements fractionnés avec identifiant d'événement de paiement, écritures de correction auditables pour les soldes anciens. Ces limitations ne sont pas masquées par le nouveau contrat.

## Critères d'acceptation

Tests unitaires : statut + valeur, conversion sans float, arrondi, incompatibilité des montants, absence d'imputation monétaire fictive. Tests API : version, isolation multi-organisations, authentification et permission. Tests existants du backend conservés.

Pas de migration de schéma dans cette livraison locale.
