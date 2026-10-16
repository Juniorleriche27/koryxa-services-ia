# CAURI — Phase 3 backend : garde-fous Cora et cohérence analytique

## Corrections implémentées

- **Séparation conversation / action métier** : `/api/v1/ai/chat` est une route accessible avec une permission de lecture. Les instructions en langage naturel pour créer une vente ou une dépense ne déclenchent plus d'écriture. Cora renvoie explicitement au registre correspondant, pour une saisie soumise à ses contrôles d'autorisation et à sa validation métier. Aucun `action_executed` n'est annoncé sans action.
- **Agents spécialisés** : FinanceAgent et SalesRecoveryAgent ne lancent plus de création de dépense/vente au seul déclenchement d'une phrase lorsqu'ils sont sollicités par leur méthode `process`.
- **Convergence des calculs** : Cora conserve `collect_financial_registers` comme source des montants de vente, créances et dépenses ; les représentations monétaires de nombreux messages ont été débarrassées des conversions binaires `float` intermédiaires au profit de la représentation `Decimal`.
- **Rétrocompatibilité** : les formats AIChatResponse et les routes métier directes restent inchangés. Les autres routes de création vente/dépense restent disponibles via leurs permissions.

## Test d'intégration

`tests/test_cora_phase3_guard.py` : création d'organisation, demandes de vente et dépense au chatbot, vérification qu'aucune écriture de registre n'est créée et qu'une navigation ciblée est proposée.

## Points non certifiés, à poursuivre dans les chantiers transversaux

- Les méthodes internes `_try_record_sale` et `_try_record_expense` existent toujours et restent accessibles à du code Python interne ; elles devront être remplacées par un **workflow de confirmation** séparé avec permission `registers:manage`, contrôle de payload, preuve du consentement et clé d'idempotence. Ne pas les appeler directement depuis une route de simple lecture.
- L'orchestrateur possède encore plusieurs branches historiques de formulation et d'analyse directe. Unifier ces branches au catalogue de métriques v1 avec identité, période, devise, version de formule, source et état de validité exige une refactorisation progressive avec davantage de jeux de tests.
- Les réponses du LLM ne sont pas encore validées systématiquement contre les valeurs officielles. Pour les futures réponses réglementées/financières, une vérification post-génération doit empêcher les contradictions chiffrées et préserver les limites des indicateurs.
- Tracer les actions proposées, le contexte d'autorisation et la provenance des calculs dans un journal d'audit dédié.
- Le chemin de configuration Knowlia du `BaseSpecializedAgent` peut créer un assistant à la première requête : il s'agit d'un effet de bord de configuration distinct de la création de registres, à isoler/autoriser ultérieurement.

Aucun frontend, commit, push, restart ou déploiement dans cette étape.
