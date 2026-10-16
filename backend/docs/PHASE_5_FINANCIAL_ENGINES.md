# CAURI — Phase 5 : moteurs financiers spécialisés (backend)

## Livraison locale, sans publication

Le service pur `app/services/financial_analysis.py` implémente des formules conditionnelles avec `Decimal`, contrats `MetricResult` et contrôles de validité explicites. `financial_summary.fetch_summary` expose désormais un champ additif `financial_analysis`, sans retirer ni modifier les indicateurs historiques. Aucun fichier frontend, aucune migration appliquée, aucun commit, push ou déploiement.

## Chantiers

**12. Rentabilité** : marge brute = revenus - coût des ventes ; taux de marge brute = marge brute / revenus × 100 ; contribution = revenus - charges variables ; résultat d'exploitation = produits - charges d'exploitation. Condition impérative : `costs_complete=True` et toutes les entrées du calcul présentes. Sans certificat de périmètre, valeur `null` et statut `incomplet`. Le champ « résultat net » n'est pas calculé : taxes/intérêts/autres éléments manquent au modèle.

**13. Seuil de rentabilité** : charges fixes / ((revenus - charges variables) / revenus) ; progression = revenus / seuil × 100. La contribution doit être strictement positive. Sinon : `non_applicable` plutôt qu'un point mort artificiel. Une contribution nulle, un revenu nul ou une charge fixe nulle sont des cas limites qui restent traités prudemment. La projection est monodevise et mono-période.

**14. Trésorerie** : le moteur des comptes déjà présent (`finance_ledger`) conserve les soldes déclarés par compte, avec dates, sens des mouvements, transferts équilibrés et absence de rapprochement bancaire. La nouvelle analyse n'assimile jamais le flux des registres à la trésorerie bancaire. La notion de trésorerie utilisable exige une validation indépendante.

**15. Structure financière** : FRNG = ressources stables - emplois stables ; BFR = actifs circulants d'exploitation - passifs circulants d'exploitation ; trésorerie nette comptable = FRNG - BFR. Condition : `balance_sheet_complete=True` et postes concernés renseignés. Il n'existe pas encore de registre bilan complet dans CAURI : ces résultats ne sont pas automatiquement activés.

**16. Autonomie** : consommation nette journalière = (sorties - entrées) / nombre de jours observés, puis autonomie = trésorerie utilisable / consommation nette journalière positive. Condition : `cash_flows_complete=True`, historique exhaustif et période représentative, trésorerie utilisable justifiée. Consommation nulle ou négative : autonomie `non_applicable`, jamais « illimitée ».

## API et contrat

Le champ additif `financial_analysis` du résumé utilisé par `/api/v1/dashboard` donne les indicateurs calculables ou non, avec formule version `5.1`, statut, unité, période, organisation, cause et sources. `/api/v1/grand-hall` conserve pour l'instant son contrat v1 et n'expose que sa projection préexistante des indicateurs : l'extension détaillée devra être versionnée et validée avec l'équipe frontend.

**Important :** pour des organisations disposant seulement des registres commerciaux et d'une classification partielle des dépenses, les indicateurs avancés restent `null`. La simple existence d'un montant ne prouve pas l'exhaustivité des coûts, des postes de bilan ou des décaissements récurrents.

## Risques ouverts à traiter avant activation de valeurs réelles

1. Prévoir une source vérifiable pour les coûts de vente, la classification exhaustive et le rattachement des coûts aux périodes.
2. Prévoir un schéma de bilan versionné, un registre de ressources/emplois stables, les actifs/passifs circulants et leur période.
3. Permettre les rapprochements, corrections, encaissements dédupliqués et la certification de l'historique de trésorerie représentatif.
4. Construire une interface de collecte de preuves pour ces périmètres, sans auto-validation artificielle.
5. Définir les règles de devises et des variantes sectorielles avant toute agrégation interdevises.
6. Réexaminer le cas du seuil nul et l'arrondi des ratios pour que le contrat utilisateur reflète bien les attentes métier.

## Vérifications

`PYTHONPATH=/workspace/.cauri-test-deps python3 -m pytest -q --disable-warnings --maxfail=1`

Tests dédiés `tests/test_financial_analysis_phase5.py` : statut incomplet, marge, contribution, point mort, FRNG/BFR, résultat comptable, consommation journalière, autonomie, impossibilité de division par zéro, refus des montants invalides et maintien de Decimal.
