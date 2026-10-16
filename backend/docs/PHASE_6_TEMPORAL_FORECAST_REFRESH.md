# CAURI — Phase 6 : temporalité, prévisions, tendances, actualisation

## Implémentations backend

- **Chantier 17** : `services/temporal_analytics.py` définit des fenêtres de dates semi-ouvertes `[start, end)`, une période précédente de même durée, des comparaisons de valeurs monétaires en `Decimal` et une consultation **isolée par entreprise**. L'API `GET /api/v1/analytics/temporal?start=YYYY-MM-DD&end=YYYY-MM-DD` nécessite `registers:read`. Les ventes sont rattachées à `sale_date`, les dépenses à `expense_date` : **ces dates ne constituent pas une preuve de date d'encaissement ou de décaissement**.
- **Chantier 18** : `projection_scenarios()` prend des flux constatés exhaustifs, un solde de départ justifié et une durée d'observation positive. En leur absence, l'état est `incomplet`. Les scénarios prudents/centraux/favorables sont **illustratifs**, avec hypothèses ±20 % explicitement exposées, sans intervalle statistique de confiance ni probabilité. Les projections ne sont pas automatiquement activées sur les simples registres commerciaux.
- **Chantier 19** : `trend_signals()` détecte des variations observées de plus de 20 % par rapport à une référence strictement positive ; chaque signal est une observation et n'affirme jamais une cause ou un risque prouvé. Seules les séries monodevise comparables déclenchent un signal.
- **Chantier 35** : le contrat additif Grand Hall `refresh` publie la stratégie `on_demand`, l'horodatage, une fréquence recommandée de 60 secondes, le rafraîchissement manuel possible et des événements indicatifs d'invalidation. **Aucun cache, worker, webhook, WebSocket ou SSE effectif n'est installé** ; les événements sont informatifs pour l'intégration future.

## Limites et prochaines corrections

1. Les agrégats temporels partagent les règles d'admissibilité des registres actuels. Le statut actuel est `registers_only` pour les registres cohérents, et les périodes vides ne doivent pas être confondues avec une devise observée.
2. Les périodes historiques sont calculées à partir de la **date du document**, pas des événements de paiement : ne pas utiliser ces comparaisons comme une analyse des flux de trésorerie datés.
3. La comparabilité vérifie la cohérence de devise sur les deux périodes. Aucun taux de change implicite n'est introduit.
4. Les scénarios ne deviennent calculables qu'avec `complete=True` et des intrants exacts ; le backend n'invente pas un solde de départ à partir de `cash_movement_net`.
5. Les risques métier avancés (concentration clients, dérive des charges, retard de recouvrement, probabilités) nécessitent des séries validées, davantage de données structurées et des tests métier.
6. La politique d'actualisation est **un contrat**, pas encore un système automatique d'invalidation : à mesurer et à mettre en œuvre plus tard suivant la charge et les besoins de l'équipe frontend.

## Validation

`PYTHONPATH=/workspace/.cauri-test-deps python3 -m pytest -q --disable-warnings --maxfail=1`

Les cas testés couvrent bornes temporelles, année bissextile, période précédente, division par zéro, refus de flottants, prévisions conditionnelles, tendances et isolation tenant.

Aucun changement frontend, commit, push, migration ou déploiement.
