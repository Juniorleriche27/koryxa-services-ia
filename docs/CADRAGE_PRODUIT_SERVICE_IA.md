# Cadrage général — KORYXA Service IA

## 1. Statut du projet

KORYXA Service IA conserve la première orientation validée :

> Construire une mémoire opérationnelle intelligente pour aider les entreprises à enregistrer, structurer, vérifier et exploiter leurs informations quotidiennes.

Le produit repose sur deux fonctions principales :

- **Registre** : saisir, importer et organiser les données métier ;
- **Radar** : mesurer leur qualité, détecter les anomalies et proposer des actions vérifiables.

Le projet KORYXA Virtual Director est séparé et ne fait pas partie de ce périmètre.

## 2. Rôle de Knowlia

Knowlia existe déjà comme moteur indépendant, avec son propre backend, son repo GitHub et son déploiement serveur.

KORYXA Service IA ne reconstruit pas Knowlia.

Knowlia peut être utilisé pour :

- l'ingestion documentaire ;
- l'extraction de contenu ;
- la mémoire documentaire ;
- la recherche avec sources ;
- l'analyse sémantique ;
- la détection de contradictions ;
- les recommandations contextualisées ;
- les agents et workflows IA existants.

KORYXA Service IA possède son propre backend métier.

Toute fonctionnalité métier absente et nécessaire à Service IA est ajoutée dans le backend de Service IA, pas dans Knowlia.

## 3. Problème traité

Dans de nombreuses petites et moyennes entreprises, les informations sont dispersées entre :

- cahiers ;
- fichiers Excel ;
- messages WhatsApp ;
- notes vocales ;
- documents Word ou PDF ;
- logiciels partiellement utilisés ;
- mémoire du dirigeant ;
- mémoire des employés ;
- procédures transmises oralement.

Le problème n'est pas uniquement de retrouver un document. Souvent, l'information officielle n'existe pas, n'est pas à jour ou se contredit selon les sources.

## 4. Vision produit

KORYXA Service IA aide une entreprise à construire progressivement sa mémoire opérationnelle pendant qu'elle travaille.

Le produit doit permettre de :

1. enregistrer les informations importantes ;
2. importer les données existantes ;
3. relier les registres, documents et captures ;
4. mesurer la qualité de la mémoire de l'entreprise ;
5. détecter les informations manquantes, obsolètes ou contradictoires ;
6. proposer des actions correctives ;
7. conserver les sources, validations et historiques.

## 5. Positionnement

KORYXA Service IA n'est pas :

- un chatbot généraliste ;
- une copie de ChatGPT ou NotebookLM ;
- un ERP complet ;
- un CRM complet ;
- un logiciel comptable certifié ;
- un tableur générique ;
- un simple espace documentaire.

KORYXA Service IA est :

> Une mémoire opérationnelle intelligente qui transforme les données dispersées de l'entreprise en informations structurées, vérifiables et exploitables.

## 6. Promesse commerciale

### Promesse principale

KORYXA Service IA transforme les ventes, tarifs, procédures et connaissances dispersées de l'entreprise en une mémoire structurée, vérifiable et exploitable.

### Formulation marché

KORYXA Service IA aide les entreprises à passer d'une organisation orale et dispersée à une organisation structurée, sans imposer un logiciel compliqué.

## 7. Utilisateurs ciblés

### Dirigeant

Il veut :

- savoir ce qui se passe ;
- identifier les données manquantes ;
- suivre les ventes ;
- repérer les anomalies ;
- conserver les connaissances de l'entreprise ;
- réduire sa dépendance à certaines personnes.

### Responsable opérationnel

Il veut :

- documenter les procédures ;
- attribuer les responsabilités ;
- vérifier que les informations sont à jour ;
- résoudre les contradictions ;
- suivre les actions demandées.

### Employé

Il veut :

- saisir rapidement une information ;
- retrouver une procédure ;
- connaître le bon tarif ;
- signaler un incident ;
- transmettre une information sans formulaire complexe.

### Consultant ou accompagnateur

Il veut :

- configurer le produit chez plusieurs entreprises ;
- mesurer leur niveau de structuration ;
- formaliser leurs activités ;
- suivre les recommandations de Radar.

## 8. Architecture fonctionnelle

Le produit synchronise trois familles de connaissances.

### 8.1 Données structurées

- ventes ;
- offres et tarifs ;
- procédures ;
- décisions ;
- incidents ;
- responsabilités ;
- actions.

### 8.2 Documents

- PDF ;
- Word ;
- Excel ;
- présentations ;
- contrats ;
- brochures ;
- rapports ;
- manuels internes.

### 8.3 Captures rapides

- notes textuelles ;
- photos ;
- documents ;
- imports ;
- futures notes vocales ;
- formulaires courts.

## 9. Backend propre à Service IA

Le backend Service IA porte les fonctions métier suivantes :

- organisations ;
- membres ;
- rôles et permissions ;
- registres ;
- ventes ;
- offres et tarifs ;
- procédures ;
- décisions et incidents ;
- imports et exports ;
- validations ;
- conflits ;
- alertes ;
- recommandations ;
- actions correctives ;
- historique et journal d'audit ;
- tableaux de bord ;
- synchronisation ;
- connecteur serveur vers Knowlia.

## 10. Principes de données

Chaque enregistrement doit conserver au minimum :

- identifiant ;
- organisation ;
- titre ou référence ;
- auteur ;
- responsable ;
- date de création ;
- date de modification ;
- source ;
- statut ;
- niveau de confiance ;
- date de dernière vérification ;
- pièces jointes ;
- commentaires ;
- historique.

### Statuts communs

- brouillon ;
- à vérifier ;
- validé ;
- obsolète ;
- archivé ;
- en conflit.

## 11. Knowlia Radar

Radar mesure au minimum :

### Complétude

L'information nécessaire existe-t-elle ?

### Fraîcheur

L'information a-t-elle été vérifiée récemment ?

### Cohérence

Les différentes sources disent-elles la même chose ?

### Traçabilité

L'information possède-t-elle une source, un auteur, une date, une validation et un historique ?

### Utilisation

L'information est-elle réellement consultée, appliquée ou mise à jour ?

Les scores doivent toujours être accompagnés d'actions concrètes. Un chiffre seul ne suffit pas.

## 12. Validation humaine

Toute information importante proposée par Knowlia ou Radar reste à vérifier jusqu'à validation humaine.

Le produit doit permettre de :

- accepter ;
- corriger ;
- rejeter ;
- voir la source ;
- voir l'ancienne valeur ;
- ajouter une justification ;
- conserver l'identité du validateur ;
- conserver la date de validation.

Aucune donnée critique ne doit être modifiée silencieusement.

---

# MVP 1 — Pilote opérationnel

## 13. Objectif du MVP 1

Le MVP 1 doit démontrer cette histoire :

1. une entreprise crée son espace ;
2. elle importe ses offres et ses ventes depuis Excel ou CSV ;
3. elle enregistre ou formalise une procédure ;
4. elle ajoute un document commercial ou opérationnel ;
5. Knowlia analyse le document ;
6. Radar détecte une information manquante, obsolète ou contradictoire ;
7. l'utilisateur consulte les preuves ;
8. il valide la correction ;
9. une action est créée ;
10. l'alerte est résolue et le score évolue.

## 14. Périmètre du MVP 1

### 14.1 Organisations et membres

- création d'une organisation ;
- invitation de membres ;
- rôles simples : propriétaire, responsable, contributeur ;
- isolation stricte des données ;
- permissions de base par module.

### 14.2 Trois registres

#### Offres et tarifs

- nom de l'offre ;
- description ;
- catégorie ;
- prix ;
- devise ;
- unité de facturation ;
- conditions ;
- inclusions et exclusions ;
- responsable ;
- statut ;
- date d'effet ;
- date d'expiration ;
- document associé.

#### Ventes

- date ;
- référence ;
- client ;
- offre ou service ;
- quantité ;
- prix unitaire ;
- réduction ;
- montant total ;
- devise ;
- mode de paiement ;
- état du paiement ;
- vendeur ;
- canal ;
- commentaire ;
- justificatif facultatif.

#### Procédures

- titre ;
- objectif ;
- service concerné ;
- déclencheur ;
- responsable ;
- participants ;
- étapes ;
- outils ;
- documents ;
- risques ;
- résultat attendu ;
- version ;
- statut ;
- date de validation ;
- prochaine révision.

### 14.3 Import et export

- import CSV ;
- import XLSX ;
- détection des colonnes ;
- association colonne vers champ ;
- aperçu avant validation ;
- validation des types ;
- rapport d'erreurs ;
- détection simple des doublons ;
- export CSV ;
- historique des imports.

### 14.4 Documents et Knowlia

- ajout de PDF, Word ou Excel ;
- liaison à une offre ou une procédure ;
- envoi serveur à serveur vers Knowlia ;
- récupération des sources et informations candidates ;
- statut d'analyse ;
- validation humaine des propositions ;
- journal des erreurs de synchronisation.

### 14.5 Radar déterministe

Le MVP commence par des règles simples, explicables et configurables.

Radar ne doit pas sanctionner automatiquement. Il signale un problème possible et fournit une justification.

## 15. Règles Radar du MVP — Ventes

### 15.1 Vente sans client

Cette alerte n'est déclenchée que lorsque :

- le type de vente exige l'identification d'un client ;
- ou l'organisation a configuré le client comme champ obligatoire ;
- ou la vente dépasse un seuil nécessitant une traçabilité nominative.

Une vente au comptoir ou anonyme peut être autorisée selon les règles de l'entreprise.

**Niveau initial recommandé :** anomalie de complétude.

### 15.2 Vente sans mode de paiement

Cette alerte dépend de l'état de la transaction.

Elle est pertinente lorsque :

- la vente est marquée payée ou partiellement payée ;
- mais aucun mode de paiement n'est renseigné.

Elle n'est pas nécessairement pertinente lorsque :

- la vente est encore non payée ;
- la vente est annulée ;
- le paiement sera défini plus tard selon le processus métier.

**Niveau initial recommandé :** anomalie de complétude conditionnelle.

### 15.3 Vente non payée depuis un certain délai

Cette règle doit utiliser :

- une date d'échéance explicite ;
- ou un délai de paiement configuré par l'organisation ;
- ou les conditions de l'offre concernée.

Exemple : une vente n'est pas en retard simplement parce qu'elle est non payée depuis trois jours si le contrat accorde trente jours.

**Niveau initial recommandé :** alerte d'échéance configurable.

### 15.4 Montant incohérent

Le système ne doit pas utiliser une notion vague d'incohérence.

Il doit comparer le montant enregistré à une formule explicable, par exemple :

`quantité × prix unitaire - réduction + frais configurés`

Une tolérance doit être prévue pour :

- les arrondis ;
- les taxes ou frais non gérés dans le MVP ;
- les remises exceptionnelles validées ;
- les ventes importées depuis un système externe.

**Niveau initial recommandé :** anomalie calculée avec détail du calcul.

### 15.5 Doublon probable

Le système ne doit jamais supprimer ou fusionner automatiquement deux ventes.

Il peut proposer un doublon probable selon une combinaison de critères :

- même référence ;
- même client ;
- même date ou période proche ;
- même offre ;
- même montant ;
- même vendeur ;
- même justificatif.

Le résultat doit afficher un niveau de confiance et demander une validation humaine.

**Niveau initial recommandé :** suspicion de doublon, jamais certitude automatique.

## 16. Règles Radar du MVP — Procédures

### 16.1 Procédure sans responsable

Cette règle est pertinente pour une procédure active ou destinée à être appliquée.

Une procédure encore en brouillon peut être signalée comme incomplète, mais ne doit pas recevoir la même priorité qu'une procédure validée sans responsable.

**Niveau initial recommandé :** complétude, priorité renforcée si la procédure est active.

### 16.2 Procédure non validée

Une procédure en brouillon n'est pas automatiquement anormale.

L'alerte est déclenchée lorsque :

- elle doit entrer en application sans validation ;
- elle reste à vérifier au-delà d'un délai configurable ;
- elle est utilisée par l'équipe alors qu'elle n'est pas validée ;
- elle a été modifiée après sa dernière validation.

**Niveau initial recommandé :** alerte de gouvernance conditionnelle.

### 16.3 Procédure jamais révisée

Cette formulation doit être remplacée par une règle de révision échue.

La règle utilise :

- la date de prochaine révision ;
- ou une fréquence configurée ;
- ou un seuil défini par type de procédure.

Une procédure récemment créée n'a pas besoin d'être révisée immédiatement.

**Niveau initial recommandé :** alerte de fraîcheur.

### 16.4 Procédure sans étapes

Cette règle est valide lorsqu'une procédure est censée décrire une séquence d'actions.

Elle peut être moins pertinente pour :

- une politique ;
- une règle simple ;
- une fiche de référence ;
- un principe général.

Le MVP doit donc distinguer le type de contenu ou limiter cette règle aux objets de type procédure opérationnelle.

**Niveau initial recommandé :** anomalie structurelle selon le type.

### 16.5 Responsable devenu inactif

Cette règle est pertinente lorsque :

- le responsable n'est plus membre actif ;
- son accès est suspendu ;
- il a quitté l'organisation ;
- il n'appartient plus à l'équipe concernée ;
- aucune personne de remplacement n'est définie.

L'alerte doit proposer de désigner un nouveau responsable, sans modifier automatiquement la procédure.

**Niveau initial recommandé :** alerte de responsabilité élevée pour les procédures actives.

## 17. Alertes et actions du MVP

Chaque alerte contient :

- type ;
- priorité ;
- règle déclenchée ;
- explication ;
- donnée concernée ;
- source ;
- niveau de confiance si nécessaire ;
- recommandation ;
- statut ;
- historique.

Une alerte peut devenir une action avec :

- titre ;
- responsable ;
- échéance ;
- priorité ;
- statut ;
- lien vers l'élément concerné ;
- commentaire de résolution.

### Statuts d'action

- à faire ;
- en cours ;
- terminée ;
- ignorée.

## 18. Tableau de bord du MVP

Le tableau de bord affiche :

- score général ;
- complétude ;
- fraîcheur ;
- cohérence ;
- alertes prioritaires ;
- actions en retard ;
- éléments à valider ;
- ventes récentes ;
- derniers changements.

Il doit répondre rapidement à quatre questions :

1. Qu'est-ce qui va bien ?
2. Qu'est-ce qui manque ?
3. Qu'est-ce qui se contredit ?
4. Quelle action faut-il prendre maintenant ?

## 19. Recherche du MVP

- recherche d'une offre ;
- recherche d'une vente ;
- recherche d'une procédure ;
- filtres par statut ;
- filtres par responsable ;
- filtres par date ;
- filtres par priorité ;
- filtres par niveau d'alerte.

La recherche conversationnelle avancée peut venir après stabilisation du MVP.

## 20. Hors périmètre du MVP 1

- décisions et incidents ;
- saisie vocale ;
- PWA hors connexion complète ;
- WhatsApp ;
- Mobile Money ;
- abonnement automatisé ;
- facturation réglementaire ;
- registres entièrement personnalisables ;
- assistant conversationnel complet ;
- Radar sémantique avancé ;
- intégrations nombreuses ;
- espace partenaires ;
- application mobile native ;
- gestion multi-établissements avancée.

## 21. Architecture recommandée du MVP

```text
Frontend Service IA — Next.js
        │
        ▼
Backend Service IA — FastAPI
        │
        ├── PostgreSQL
        │   organisations, membres, offres,
        │   ventes, procédures, alertes,
        │   actions, validations, historique
        │
        ├── Stockage de fichiers
        │
        └── Connecteur Knowlia
            documents, extraction, sources,
            contradictions et recommandations
```

## 22. Critères de réussite du MVP

Le MVP est considéré comme utile si une entreprise pilote peut :

- importer ses données sans ressaisie massive ;
- utiliser les trois registres quotidiennement ;
- comprendre chaque alerte ;
- corriger ou rejeter une alerte ;
- transformer une recommandation en action ;
- retrouver la source d'une information ;
- constater une amélioration de la qualité des données ;
- obtenir une première valeur dès l'installation.

## 23. Décision actuelle

Le cadrage général de KORYXA Service IA est conservé.

Le MVP 1 recommandé comprend :

- organisations et membres ;
- trois registres : offres, ventes et procédures ;
- import Excel et CSV ;
- documents ;
- connecteur Knowlia ;
- Radar déterministe ;
- validation humaine ;
- alertes ;
- actions ;
- historique ;
- tableau de bord ;
- recherche structurée.

Les règles Radar sur les ventes et les procédures sont validées avec les conditions et nuances décrites dans ce document. Elles ne doivent pas être implémentées comme des règles absolues ou punitives.
