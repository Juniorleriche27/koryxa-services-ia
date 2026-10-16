# CAURI — Revue globale backend des phases 1 à 8

État : revue et correctifs locaux, **non déployés**, **sans commit ni push**. Frontend géré par une autre équipe, aucun fichier frontend modifié.

## Correctifs supplémentaires après la phase 8

1. **Radar / concurrence PostgreSQL** : verrou transactionnel par organisation `tenant_transaction_lock(session, "radar_run", org)` avant les lectures / écritures d'une exécution Radar dans `services/radar.py`. Deux exécutions PostgreSQL d'une même entreprise sont sérialisées, tandis que deux entreprises peuvent être traitées séparément. Le lock est transactionnel ; tests unitaires valident la requête PostgreSQL et l'absence d'exécution sur SQLite. Un test réel avec deux connexions PostgreSQL reste nécessaire.
2. **Mouvements financiers concurrents** : la contrainte unique en base `(organization_id,source_kind,source_id,direction)` existait déjà. `POST /finance/movements` intercepte maintenant `IntegrityError`, annule la transaction et retourne HTTP 409. La création sans source reste distincte et n'est pas idempotente par défaut.

## Résultat de validation

- Suite complète backend après correctifs principaux : **112 réussis, 2 avertissements**.
- Nouveaux tests ciblés `test_release_blockers.py` : **2 réussis**.
- `git diff --check` : réussi.
- Aucun test du frontend lancé ; l'équipe frontend possède des changements en cours.

## Blocages encore ouverts avant certification / déploiement

- **Intégrité** : le verrou Radar est PostgreSQL uniquement. Vérifier le comportement réel avec deux transactions concurrentes et une création similaire. Garantir l'identité d'alerte au niveau base et tester les migrations sans écraser les alertes existantes.
- **Audit immuable** : les changements d'états d'alertes et corrections financières n'ont pas encore de journal d'événements complet (auteur, horodatage, ancien/nouvel état, source). Nécessite une conception et migration additive dédiée.
- **Finance avancée** : les formules sont conditionnelles ; coûts exhaustifs, bilan complet et rapprochements ne sont pas encore automatiquement établis par le modèle. Ne pas publier de bénéfices calculés avec des données non certifiées.
- **Cora** : les chemins de chat concernés n'écrivent plus dans les registres, mais les méthodes internes historiques restent à décommissionner derrière un workflow dédié à confirmation, permissions et idempotence.
- **Sécurité** : audit complet RBAC/tenant de toutes les routes, tâches et caches ; tests d'intégration avec différents rôles, volumes et sources externes.
- **Radar qualité** : couverture d'enregistrements analysés et calibration des règles contre des cas réels encore à faire. Le score n'est pas une certification financière.
- **Performance** : mesurer p50/p95/p99, profils SQL, tailles de données réalistes ; le `Server-Timing` seul ne permet pas de garantir la charge.
- **Multi-devises et historique** : conversions traçables avec taux datés et événement de paiement réellement daté à modéliser.
- **API et UX** : valider les contrats Grand Hall, départements et dates avec l'équipe frontend avant une publication commune.

## Préparation Git backend uniquement

Avant toute validation du commit, comparer exclusivement `backend/` au dernier HEAD ; faire une revue des fichiers nouveaux et existants, relancer la suite complète, documenter les migrations nécessaires et préparer un message de commit backend autonome. Ne **jamais** utiliser `git add .` ni inclure `frontend/` dans le staging : il est en cours de modification parallèle.

La présente revue n'est pas une attestation que les 38 chantiers sont intégralement terminés.
