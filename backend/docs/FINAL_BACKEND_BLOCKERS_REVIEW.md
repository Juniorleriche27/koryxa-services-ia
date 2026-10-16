# CAURI — Revue complémentaire des garanties backend après les huit phases

État : corrections effectuées **localement**, aucun commit, push, frontend, redémarrage ou déploiement de production.

## Corrections effectivement implémentées

- Exécutions Radar PostgreSQL : verrou transactionnel par entreprise (`services/tenant_lock.py`, branché dans `RadarService.run`) pour sérialiser les recherches et créations d'alertes sur une organisation ; aucune portée inter-entreprise.
- Mouvements financiers : interception des conflits d'unicité existante côté `POST /finance/movements`, rollback et réponse HTTP 409 au lieu d'une erreur non contrôlée.
- Transition d'état Radar : **événement `AuditEvent` persistant dans la transaction de mise à jour**, avec organisation, alerte, auteur utilisateur, ancien et nouvel état ; aucune écriture d'audit supplémentaire si le statut ne change pas. Réutilisation de la table déjà disponible, aucune migration nécessaire pour ce point.
- API Radar : identité d'utilisateur transmise à `RadarService.update_alert`, sans utiliser de valeur arbitraire passée par le client.
- Nouveau test `tests/test_radar_audit_trail.py` : transition auditée une fois, identité vérifiée et refus de lecture/modification croisée de l'alerte.

## Vérification exécutée

`PYTHONPATH=/workspace/.cauri-test-deps python3 -m pytest -q --disable-warnings --maxfail=1`

**115 tests backend réussis, 2 avertissements** ; `git diff --check` réussi.

## Garanties non certifiées / travaux encore nécessaires avant production

1. **Concurrence PostgreSQL réelle** : tests avec plusieurs transactions et connexions simultanées, contre une base de test isolée. Le verrou et ses tests unitaires ne prouvent pas encore la résistance à tous les scénarios.
2. **Événements d'audit complets** : seuls les changements d'état Radar ont été instrumentés dans cette intervention. Les réouvertures automatiques, corrections financières, créations, suppressions et actions Cora nécessitent un inventaire des voies de mutation puis des événements persistés correspondants. `AuditEvent` est une table de journal applicatif ; son immutabilité ne repose pas encore sur des protections DB contre UPDATE/DELETE.
3. **Workflow Cora** : les chemins de conversation corrigés n'exécutent plus d'écritures métier directes. Les anciennes capacités internes de modification doivent rester inaccessibles à un endpoint de simple lecture, et la future confirmation explicite doit imposer autorisation, clé d'idempotence, validations et pistes d'audit avant activation.
4. **Moteur financier complet** : les formules conditionnelles sont testées, mais les sources structurées de coûts certifiés, postes de bilan et rapprochements financiers sont encore à développer. Aucun résultat non justifié ne doit être affiché.
5. **Devises et paiements datés** : conversions FX avec taux historiques vérifiables, rattachement des paiements à la vraie date d'encaissement et règles explicites de rapprochement non implémentés.
6. **Sécurité** : revue systématique de toutes les routes, permissions, workers, tâches planifiées et intégrations tierces nécessaire avant certification complète.
7. **Performance** : benchmark p50/p95/p99, requêtes SQL et tests de charge réels non exécutés ; instrumentation de durée déjà en place.
8. **Contrat Frontend** : les équipes doivent valider conjointement Grand Hall, catalogue de départements et mécanisme de rafraîchissement, sans inclure les modifications frontend en cours dans une livraison backend autonome.

## Livraison future

Préparer un lot Git ne contenant que `backend/` après revue, relancer la suite backend, valider les migrations sur environnement de préproduction, sauvegarder et approuver explicitement toute mise en production. **Pas de `git add .`** dans un dépôt où le frontend travaille en parallèle.

Ce rapport énumère les garanties confirmées et les limites ; il ne prétend pas avoir certifié l'ensemble des 38 chantiers.
