# CAURI — Remédiation de l'audit Codex, 16 octobre 2026

## Incidents de sécurité P0/P1

- `POST /telegram/webhook` historique reste **403** sans exception. Le routage `?org_id=...` n'autorise plus aucune action.
- Les bots personnalisés peuvent utiliser **uniquement** `POST /telegram/webhook/{integration_id}` configuré depuis l'application par un membre autorisé. L'entreprise est dérivée de la configuration serveur ; `X-Telegram-Bot-Api-Secret-Token` est contrôlé en temps constant via un HMAC lié au bot et à la clé serveur. Le secret lui-même n'est ni stocké ni affiché dans les réponses.
- L'activation du bot n'est effectuée qu'après `getMe` et `setWebhook` confirmés par Telegram ; les configurations héritées ne sont pas activées automatiquement. Déduplication persistante et contrainte unique `(integration_config_id, update_id)`.
- Les utilisateurs qui écrivent au bot doivent être actifs et liés à l'entreprise. Un code de liaison d'une autre entreprise n'est pas accepté.
- Le traitement du langage naturel Telegram ne crée plus de vente, dépense, offre ou procédure ; il redirige vers une confirmation via le registre CAURI. Les agents Cora Finance et Ventes ne disposent plus de méthode métier de création activable depuis un chat.
- Les chiffres Telegram ont une source canonique `financial_summary`, ceux de Radar `financial_metrics`; aucune « trésorerie nette » bancaire n'est fabriquée à partir des déclarations.
- Les rôles `system`, `tool` et `developer` envoyés par les clients du chat sont refusés.

**Important :** le token du bot officiel anciennement présent dans le dépôt a été retiré du code par le commit `3f7f81a`, mais demeure historiquement exposé. Il faut le **révoquer et en régénérer un auprès de Telegram** avant toute reprise du bot officiel. La nouvelle interface personnalisée doit recevoir les identifiants via le flux authentifié ; aucun token ne doit être inséré dans Git. Aucun webhook historique ne doit être réactivé.

## Cohérence, intégrité et fiabilité

- `GET /radar/rules` ne crée plus de lignes SQL ; les règles par défaut sont projetées avec identifiants/horodatages nuls tant qu'elles n'ont pas été enregistrées. Attention à la compatibilité des consommateurs historiques.
- Radar groupe ses recherches de doublons par clé candidate au lieu de systématiquement tester chaque paire. Les cas configurés avec seuil réduit sont préservés par des clés candidates supplémentaires. Le nombre d'étapes des procédures est agrégé par une seule requête plutôt qu'une requête par procédure.
- Migration `0019` : activation de webhook désactivée par défaut + table anti-rejeu Telegram. Migration `0020` : FK composites `(organization_id,id)` garantissant les appartenances CashMovement→CashAccount et CostClassification→Expense. Les contraintes applicatives historiques restent en place.
- Audits réels de la base de production **en lecture seule** : zéro anomalie interentreprises et zéro référence orpheline sur les deux relations.

## Vérifications effectivement exécutées

- Suite complète backend : `123 passed`, deux avertissements non bloquants, dernière exécution avant l'ultime déploiement.
- Tests API Telegram : secret manquant ou faux rejeté, ancien webhook rejeté, activation sécurisée et anti-rejeu, code de liaison interentreprises refusé.
- Tests Radar : régression, détection indexée et `GET /rules` strictement sans écriture.
- PostgreSQL 16 **isolé** : migrations complètes jusqu'à `20261016_0020` réussies ; rejet par FK d'un mouvement interentreprises ; deux `RadarService.run()` concurrentes aboutissent à deux rapports mais une seule alerte.
- Sauvegarde chiffrée réelle : vérification SHA256 puis restauration **du schéma public uniquement** sur PostgreSQL 17 isolé avec rôles de compatibilité ; 11 organisations, 12 membres, 15 ventes, 2 dépenses et 9 alertes Radar accessibles. Migrations vers `0020` réussies sur copie restaurée ; downgrade 1 migration et réapplication à `0020` réussis.
- **Limite** : une restauration **intégrale Supabase** sur PostgreSQL standard a échoué à cause de l'extension `supabase_vault` absente et des rôles Supabase. Il faut utiliser un environnement de restauration Supabase équivalent pour certifier la reprise de toutes les fonctionnalités hors schéma public.

## Risques et obligations résiduels

1. Révoquer le jeton Telegram officiel anciennement présent dans Git. Ne pas le réutiliser.
2. Les bots personnalisés existants restent désactivés après migration ; chaque administrateur doit reconnecter son bot depuis CAURI. Une API simulée avec mock ne vaut pas test E2E auprès de Telegram.
3. Les traitements analytiques historiques parcourent encore les registres par entreprise et nécessiteront pagination/agrégation SQL et benchmarks à gros volume. Optimisation des candidats Radar appliquée, pas d'affirmation p95/p99 de production.
4. Le contrat Dashboard historique sérialise encore certains Decimal en floats afin de ne pas casser le frontend existant ; le Grand Hall utilise les chaînes exactes. Faire une migration contractuelle versionnée avec l'équipe frontend.
5. Les postes de coûts exhaustifs, le bilan comptable et la trésorerie rapprochée restent indisponibles tant que les sources de preuves ne sont pas complètes. Pas de résultats financiers inventés.
6. Tester périodiquement une reprise **Supabase complète** et automatiser des tests PostgreSQL concurrentiels en CI avant de parler de certification universelle.
7. La traçabilité financière immuable sur toutes les voies de mutation est un chantier distinct ; le journal d'état Radar existe déjà et ses tests passent.

## Consignes de livraison

Ne commiter que `backend/`. Sauvegarde chiffrée vérifiée avant migration. Docker Compose démarre avec `alembic upgrade head` automatique ; valider migrations, version du commit sur liveness, readiness, statut Docker et endpoints après redémarrage. Ne jamais exposer les jetons et clés dans les logs.
