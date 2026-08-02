# Audit de la sidebar — MVP 1

Référence : cadrage produit historique `docs/CADRAGE_PRODUIT_SERVICE_IA.md` (commit `8758dde`) et contrats du backend Service IA.

| Menu | Lecture | Commandes MVP | État après audit |
| --- | --- | --- | --- |
| Vue d’ensemble | métriques, alertes, actions | navigation vers les traitements | conforme |
| Offres & tarifs | liste et recherche | création manuelle | corrigé |
| Ventes | liste et recherche | création manuelle | corrigé |
| Procédures | liste et recherche | création avec étapes | corrigé |
| Imports | CSV/XLSX, aperçu | confirmation, erreurs, export CSV | corrigé |
| Documents | liste par élément | ajout de pièce jointe | corrigé |
| Radar | alertes | lancer, résoudre, convertir en action | corrigé |
| Validations | propositions | accepter ou rejeter | disponible ; correction libre à enrichir |
| Actions | kanban | créer, démarrer, terminer | corrigé |
| Organisation | organisation et membres | inviter, changer un rôle | corrigé |
| Paramètres | règles Radar | activer/désactiver, priorité | corrigé |

## Écarts nécessitant un second lot

- modification et archivage depuis les listes de registres ;
- justification saisie et valeur corrigée dans les validations ;
- commentaires et preuves de résolution dans les actions ;
- suspension de membre et révocation d’invitation ;
- modification manuelle du mapping de colonnes et historique des imports ;
- sélection d’un registre depuis Documents sans recopier son identifiant.

L’historique des imports n’a actuellement aucun endpoint de lecture dans le backend. Les autres opérations disposent déjà d’un contrat backend et peuvent être ajoutées au prochain lot frontend.
