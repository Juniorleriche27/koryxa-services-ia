# CAURI — Vérification et correction des points 2 à 5

Date : 2026-10-16. Environnements d'écriture : conteneurs PostgreSQL jetables uniquement.

## 2. PostgreSQL concurrent et intégrité

- Migration d'une base vide jusqu'à `20261016_0021` : réussie.
- Deux appels concurrents au service Radar : deux runs, une seule alerte : réussi.
- Référence financière interentreprises : refusée par la FK PostgreSQL : réussi.
- Journal financier : UPDATE et DELETE refusés par trigger PostgreSQL : réussi.
- Gate reproductible : `scripts/validate_postgres_release.sh`.

## 3. Restauration

- Archive : dernière sauvegarde chiffrée quotidienne du 2026-10-16.
- SHA-256 : valide.
- Restauration atomique du schéma public sur PostgreSQL 17 isolé : réussie après création
  des rôles de compatibilité `anon`, `authenticated`, `service_role`.
- Volumétrie restaurée : 11 organisations, 12 membres, 15 ventes, 2 dépenses,
  1 offre, 0 expéditeur WhatsApp.
- Version restaurée : `20261013_0018`.
- Upgrade jusqu'à `0021`, downgrade vers `0020`, puis retour à `0021` : réussis.
- Le script emploie maintenant `ON_ERROR_STOP=1` et `--single-transaction`; une erreur ne
  peut plus être annoncée comme une restauration réussie.

## 4. Capacité analytique

- Budget configurable `SERVICE_IA_MAX_ANALYTICS_RECORDS`, défaut 50 000 par registre.
- Les requêtes historiques sont bornées à `limite + 1` après comptage tenant-scoped.
- Au-delà de la limite, le statut est `analytics_capacity_exceeded` et tous les totaux
  monétaires potentiellement partiels valent `null`.
- L'analytique temporelle applique la même fermeture prudente.
- Cette protection garantit la sûreté mémoire et l'absence de chiffres partiels trompeurs;
  elle ne remplace pas un entrepôt analytique pour les entreprises dépassant le budget.

## 5. Traçabilité financière

- Nouvelle table `financial_audit_events`, écrite dans la même transaction métier.
- Couverture : créations/modifications/paiements/archivages de ventes et dépenses, imports
  et annulations d'import financiers, comptes, soldes d'ouverture, mouvements, deux jambes
  de transfert et classifications de coûts.
- Trigger PostgreSQL interdisant UPDATE et DELETE.
- Payload JSON sérialisé sans conversion monétaire en float.

## Validation applicative finale

- Suite complète isolée : **126 tests réussis**, 2 avertissements non bloquants
  (dépréciation Starlette et cache en lecture seule).
- Durée : 83,99 secondes.
- Sources montées en lecture seule ; base SQLite et dépendances de test dans `/tmp` du conteneur.
- `git diff --check` et compilation Python : réussis.
