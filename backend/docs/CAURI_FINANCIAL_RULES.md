# CAURI — règles de calcul du cockpit et de Cora

Mise à jour : 2026-10-13. Périmètre : espace privé « Mémoire opérationnelle ».

## Source de vérité

- `app/services/financial_metrics.py`: `collect_financial_registers`, `summarize_registers`, `_paid_amount`.
- `app/services/financial_summary.py`: complète les métriques financières avec les indicateurs opérationnels, sans les redéfinir.
- Appels consommateurs : `/dashboard`, `/registers/summary`, `/registers/cashflow-summary`, agent financier et orchestrateur Cora.

## Filtres et période

Les totaux portent sur **l'historique complet** des documents, et ne représentent **ni le jour courant ni un mois de dépenses**. Les totaux `sales_records_count`, `excluded_sales_count` et `pending_validation_sales_count` permettent de voir combien de documents n'entrent pas dans le chiffre d'affaires sans modifier les données ; le cockpit renvoie vers la liste des ventes pour leur vérification. Sont incluses les ventes non archivées de l'organisation, validées, de type `invoice` ou `receipt`, sauf statuts de paiement `cancelled` et `refunded` ; les dépenses non archivées et validées, hors paiements annulés/remboursés. Toutes les lectures SQL appliquent `organization_id` avant l'agrégation.

**Attention :** l'historique ne permet pas de reconstruire un état à une date passée à partir des soldes de paiement actuels. L'évolution historique nécessiterait une comptabilisation des mouvements datés et rapprochement de remboursements et avoirs. Les factures et reçus distincts ne sont pas automatiquement dédupliqués ; un identifiant d'origine serait nécessaire pour garantir la non-duplication commerciale dans tous les cas.

## Formules justifiables

- Ventes validées : somme des `total_amount` des ventes filtrées.
- Encaissements déclarés : somme des `paid_amount`, plafonnée individuellement au montant du document.
- Créance restante : vente − montant payé ; classification `due_date` en échue, future, échéance aujourd'hui ou sans échéance.
- Décaissements déclarés : somme des `paid_amount` des dépenses correspondantes.
- Dépenses restant à régler : somme des `amount - paid_amount`.
- Taux de recouvrement : paiements déclarés / ventes validées × 100, si ventes > 0 et enregistrements cohérents.
- Panier moyen : ventes validées / nombre de documents retenus, si nombre > 0.
- `cash_movement_net` : encaissements déclarés − dépenses réglées. Ce **n'est pas** un solde de caisse ni un bénéfice.

Un document marqué intégralement `paid` avec un montant `paid_amount` contradictoire rend les agrégats d'encaissement **non fiables**. Les champs associés sont alors `null`, jamais remplis artificiellement. Une donnée multi-devise ne donne jamais lieu à une somme dans une seule monnaie sans taux de conversion fiable.

## Indicateurs non calculables

`net_cash_position` (trésorerie réelle), `estimated_gross_margin`, `gross_margin_rate`, `break_even_point`, `break_even_progress`, `daily_burn_rate`, `cash_runway_days`, `working_capital` et `projected_30d_cash` retournent `null` jusqu'à disponibilité des **données nécessaires** : soldes initiaux, mouvement bancaire/caisse, coût des marchandises vendues, charges fixes et variables, horizon historique documenté, autres créances/dettes et postes du bilan. Les valeurs `0`, `100%`, `999 jours` ne sont pas des solutions de remplacement.

## Explicabilité de Cora/Radar

Cora et le cockpit doivent décrire le caractère opérationnel et partiel des registres. Un bon ratio d'encaissement ou un `cash_movement_net` positif ne prouve pas la rentabilité, une trésorerie positive ou le dépassement du point mort. Une créance sans échéance dépassée n'est pas désignée automatiquement comme impayée.

Le score Radar affiché par le cockpit évalue des **alertes de qualité des données**, pas la rentabilité : pondérations 35% complétude, 25% fraîcheur, 25% cohérence, 15% traçabilité ; pénalités respectives 8/8/10/6 par alerte, plafonds 30/25/25/20. Le code existant est conservé ; l'absence d'alertes ouvertes n'est pas une certification financière.

## Contrôles et limites restantes

Tests `tests/test_financial_metrics.py`, tests historiques des registres et dépenses. Validation TypeScript et ESLint dans le frontend. Les tests sont exécutés sur SQLite isolé (`/tmp/koryxa_test.db`), sans connexion aux données de production.

Certaines tâches futures exigent une validation fonctionnelle et potentiellement une migration **non destructive** : journal des mouvements et remboursements, rapprochement des statuts historiques contradictoires, bilan et classification de coûts, cohérence des documents facture/reçu et extraction comptable par période. La correction courante ne fabrique pas ces données et ne modifie aucune vente de production.

## Extension du journal de trésorerie — octobre 2026

La migration additive `20261013_0018` introduit trois tables, sans reprise forcée des données historiques :

- `finance_cash_accounts` : un compte par organisation, devise, solde d'ouverture **facultatif** et date du constat ; un compte sans solde d'ouverture ne produit pas de solde calculé ;
- `finance_cash_movements` : entrées/sorties datées, montant positif, catégorie, compte, organisation et auteur déclaré. Les transferts génèrent obligatoirement deux écritures opposées dans la même devise ;
- `finance_cost_classifications` : classification humaine des dépenses (fixe/variable/inconnue et directe/indirecte/inconnue), avec auteur de dernière mise à jour. Aucune classification automatique des anciens montants.

Les endpoints `/api/v1/finance/accounts`, `/finance/movements`, `/finance/transfers`, `/finance/expenses/{id}/classification` et `/finance/cost-coverage` sont protégés par les permissions existantes des registres et le contexte `organization_id`.

La page privée `/espace/finance` permet de renseigner les comptes et soldes d'ouverture, les mouvements datés, les transferts équilibrés et les classifications. Les soldes déduits du journal sont toujours présentés comme **déclarés et non rapprochés**, et ne prouvent pas une trésorerie consolidée certifiée.

**Important :** la synchronisation automatique des paiements de ventes/dépenses avec le journal financier n'est pas mise en place ; des mouvements bancaires distincts doivent être rapprochés et les doublons contrôlés avant agrégation consolidée. Le calcul de marge comptable, du point mort, d'un fonds de roulement net global et de l'autonomie de trésorerie demeure `null` tant que les pièces justificatives, coûts exhaustifs, postes de bilan et période d'observation ne permettent pas un calcul défendable.

## Déploiement — 13 octobre 2026

L'API et son schéma ont été mis en production avec la migration `20261013_0018`. Deux sauvegardes chiffrées et vérifiées ont été réalisées avant la migration, sans suppression des archives antérieures. Le backend Docker a été reconstruit et vérifié sain (`health/live` et `health/ready` HTTP 200). Le frontend a été déployé directement via Vercel sur `https://cauri.koryxa.fr`, avec accès protégé par Clerk/Vercel. Les tests backend, TypeScript, ESLint et le build Next.js ont été passés avant publication. Aucun commit ni push Git n'a été effectué. L'accès utilisateur authentifié et le rapprochement comptable ne sont pas certifiés par les seuls tests de déploiement.
