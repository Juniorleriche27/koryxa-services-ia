# CAURI — Phase 8 : qualité API, observation et préparation de la livraison

**Périmètre : backend seulement, pas de modification frontend, pas de commit/push/deploy.** Les phases 1–7 restent conservées dans la copie de travail.

## Réalisé et vérifié

- **27 — Performance (instrumentation)** : mesure `perf_counter` du traitement du Grand Hall et en-tête `Server-Timing: grand_hall;dur=...` ; avertissement serveur si la durée dépasse 1000 ms, sans inclure nom, ID d'entreprise ou chiffres financiers dans le log. Il ne s'agit pas encore d'une optimisation mesurée des requêtes SQL.
- **28 — Tests** : `tests/test_phase8_release_contract.py` couvre deux entreprises, l'authentification, le contrat v1 du Grand Hall, le catalogue des départements, la compatibilité de `/dashboard`, les en-têtes de version/cache et la mesure de durée. La suite complète backend passe : 112 tests.
- **29 — Observation** : journalisation des traitements lents Grand Hall ; aucune plateforme externe de métriques ou suivi distribué ajouté.
- **30 — Contrat API** : réponse versionnée Grand Hall, entête `X-Analytics-Schema: 1.0`, `Cache-Control: private, no-store` afin de ne jamais partager un rendu tenant via un cache. L'API dashboard historique est conservée.
- **31 — Compatibilité cockpit (backend)** : les API historiques continuent de répondre. Le frontend n'a pas été modifié ni testé dans cette phase : la vérification UX reste confiée à l'équipe frontend.
- **32 — Procédure de livraison** : checklist ci-dessous ; aucun changement de production engagé.
- **38 — Grand Hall** : validation backend du profil organisationnel et des six départements avec leurs permissions ; l'intégration de la navigation immersive appartient à l'équipe frontend.

## Contrôles bloquants avant mise en production

1. **Intégrité transactionnelle** : la déduplication concurrente de paiements/alertes et le journal immuable des corrections/transitions ne sont pas encore garantis par une contrainte DB complète. Décider la migration et vérifier sa compatibilité avant exécution.
2. **Finance avancée** : formules de phase 5 testées mais éléments probants de coûts exhaustifs, bilan et mouvements rapprochés encore insuffisants pour leur calcul automatique ; ne pas annoncer des résultats fictifs.
3. **Historique/périodes** : les périodes temporelles utilisent `sale_date` et `expense_date`, pas les dates réelles de règlement. Les prévisions ne sont pas des probabilités certifiées.
4. **Radar** : `quality_certified` reste `false`. Un score 100 signifie absence d'alertes actives connues, pas absence de risque ; la couverture effective des lignes analysées et l'historique immuable ne sont pas certifiés.
5. **Cora** : les conversations sont protégées des créations directes de ventes/dépenses dans les chemins corrigés. Une refonte du workflow de confirmation, ainsi que des tests exhaustifs d'actions, restent nécessaires.
6. **Sécurité** : audit systématique des routes, workers, permissions multi-entreprises et contrats départementaux. Les nouveaux tests d'isolation ne constituent pas un audit de sécurité indépendant.
7. **Performance** : établir une baseline p50/p95/p99, plan SQL/EXPLAIN, index et test sous charge représentative ; ne pas introduire de cache partagé sans politique d'invalidation tenant.
8. **Contrat frontend** : faire valider par l'équipe frontend les noms de départements, routes, payload `grand-hall` et le mécanisme d'actualisation avant activation de navigation immersive.
9. **Livraison Git** : séparer les changements backend des fichiers frontend modifiés en parallèle ; revue du diff, tests complets, sauvegarde et plan de retour arrière. Pas de commit/push tant que la consigne actuelle l'interdit.
10. **Déploiement** : contrôler migrations Alembic, sauvegarder, valider les fonctionnalités avec authentification, sonder health/readiness et endpoints, puis monitorer la production avec accord explicite.

## Commande de validation

`PYTHONPATH=/workspace/.cauri-test-deps python3 -m pytest -q --disable-warnings --maxfail=1`

Résultat constaté à la rédaction : **112 réussis, 2 avertissements**. Le code est resté local dans le workspace backend.
