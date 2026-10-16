# CAURI — Phase 7 : sécurité, gouvernance, devises et siège institutionnel

## Livré localement (backend seulement)

- Ch. 23 : isolation multi-organisation existante conservée dans les dépendances `get_current_organization`, `get_current_member` et les API Grand Hall/départements. Test d'intégration pour deux organisations et projection contextualisée.
- Ch. 24 : inventaire versionné des formules connues dans `phase7_governance.FORMULA_CATALOGUE` avec source, unité, périmètre et expression. `financial_provenance` expose la version de formule, l'entreprise, la devise et la famille source, sans prétendre tracer les écritures individuelles.
- Ch. 25 : contrôle strict du format devise ISO dans le contrat de provenance. Aucune somme ni conversion implicite de devises n'est introduite ; les garde-fous multi-devises existants restent en place.
- Ch. 26 : introduction d'un contrat explicite de provenance **au niveau formule** (`trace_kind=formula_metadata_not_transaction_audit`). Ne pas confondre avec la piste d'audit transactionnelle complète, encore absente.
- Ch. 36 : enrichissement non destructif du catalogue `/api/v1/departments` avec `access_status`, `availability_reason` et `availability_scope=backend_module_only`. Le champ `allowed` continue d'utiliser les mêmes `ROLE_PERMISSIONS`, sans autoriser une action côté route.
- Ch. 37 : projection du profil de l'organisation active dans `/api/v1/grand-hall.organization_profile`. Champs autorisés : nom, secteur, activité, pays, présence du logo, horodatage de mise à jour du logo et état d'onboarding. Exclusion délibérée de la clé de stockage du logo, identifiant tenant, coordonnées privées et données personnelles.

## Limitations explicites et travaux ultérieurs

1. Les protections multi-tenant et les tests réalisés ne démontrent pas à eux seuls une absence universelle de fuite dans toutes les intégrations et jobs. Un audit exhaustif des routes, workers et caches reste nécessaire.
2. Le catalogue de formules est une première version statique : il faut ensuite le raccorder automatiquement à chaque définition calculée et ajouter des références individuelles aux opérations.
3. Aucun service de change, taux historique daté ou registre de conversion multidevise n'est déployé. Les valeurs en devises différentes continuent de rester incomparables en l'absence de conversion prouvée.
4. La piste d'audit immuable des modifications, auteurs, corrections, versions de règles et réponses Cora nécessite un stockage et un schéma dédiés.
5. Les champs d'activation des départements par contrat/entreprise ne sont pas modélisés : `available=true` signifie uniquement que le module backend existe, pas que toute intégration externe est disponible.
6. L'équipe frontend doit valider les noms et destinations des départements et l'utilisation du profil Grand Hall avant activation UX.

## Vérifications

`PYTHONPATH=/workspace/.cauri-test-deps python3 -m pytest -q --disable-warnings --maxfail=1`

Aucune modification frontend, aucun commit, push, déploiement ou migration appliquée dans cette phase.
