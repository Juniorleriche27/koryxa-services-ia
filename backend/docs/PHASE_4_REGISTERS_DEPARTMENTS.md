# CAURI — Phase 4 backend : registres et départements

## Développé

- Registres (`financial_metrics.py`) : un paiement négatif, supérieur au total, ou contradictoire avec le statut (par exemple `unpaid` avec `paid_amount > 0`) marque les agrégats dépendants du paiement **incomplets**, au lieu d'être plafonné silencieusement et présenté comme fiable. Le CA documentaire admissible reste indépendant de cette anomalie si la devise est comparable.
- Catalogue institutionnel statique `services/departments.py`, fondé sur les modules et routes existants ; six regroupements : direction, commerce, finances, opérations, organisation, Radar. Ces noms restent à valider avec le frontend avant de devenir des noms produit définitifs.
- Endpoint **GET `/api/v1/departments`** : résout l'organisation active et l'adhésion active via le RBAC existant. Renvoie `schema_version`, `organization_id` et, pour chaque département, `id`, `label`, `path`, `modules`, `required_permission`, `available`, `allowed`. Aucun nouveau système de permissions.
- Tests de calcul, statut et isolation multi-entreprises ajoutés dans `tests/test_phase4_departments_and_registers.py`.

## Limites connues / suite de chantier

- Le catalogue v1 déclare la disponibilité des modules existants, sans tester dynamiquement l'activation par abonnement, intégration ou configuration propre à l'entreprise : le frontend ne doit pas confondre `available=true` avec une vérification de tous les services externes.
- Le catalogue ne remplace **jamais** les contrôles des endpoints : `allowed` renseigne la navigation, pas une autorisation d'exécution.
- L'association exacte des routes UX et des départements devra être validée conjointement avec l'équipe frontend (celle-ci travaille en parallèle). Aucun fichier frontend n'est modifié.
- Le moteur de revenus n'implémente pas encore un grand livre de paiements/avoirs versionné ; les doubles représentations facture/reçu, taxes, remises et périodes d'imputation nécessitent une modélisation et une migration dédiées pour être complètement certifiées.
- Les créances par tranches d'ancienneté et les classifications approfondies des dépenses devront être ajoutées avec des contrats et tests indépendants.

## Vérification

`PYTHONPATH=/workspace/.cauri-test-deps python3 -m pytest -q --disable-warnings --maxfail=1`

Aucun commit/push/déploiement/migration de production. Les phases 1-3 et les fichiers frontend externes restent intacts.
