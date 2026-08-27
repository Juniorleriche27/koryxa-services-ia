# Politique de Confidentialité, Gouvernance des Données & Conformité KORYXA

## 1. Introduction & Périmètre
La présente politique décrit les mesures techniques et organisationnelles garantissant la confidentialité, l'intégrité et la conformité du **Service IA KORYXA** dédié aux TPE et PME africaines.

## 2. Principes Fondamentaux de Traitement
- **Isolation Multi-Tenant Absolue** : Chaque organisation bénéficie d'un cloisonnement étanche au niveau base de données (`tenant_id`), stockage de fichiers et mémoire applicative.
- **Minimisation des Données** : Seules les métadonnées nécessaires à la saisie comptable et opérationnelle sont extraites (montant, date, client, mode de règlement).
- **Non-persistance des Audios Bruts** : Les flux audio vocaux sont transcrits en mémoire et supprimés immédiatement après extraction des entités.
- **Filtrage Strict des Expéditeurs WhatsApp** : Seuls les numéros déclarés au format E.164 par les administrateurs ont le droit d'enregistrer des opérations ou de formuler des requêtes.

## 3. Sous-Traitants & Partenaires Techniques
| Sous-Traitant | Rôle | Localisation | Sécurité |
|---|---|---|---|
| **Supabase** | Base de Données PostgreSQL gérée | Union Européenne / Francfort | Chiffrement au repos, TLS forcé (sslmode=require) |
| **Meta Cloud API** | API Officielle WhatsApp Business | UE / USA | Chiffrement de bout en bout et signature HMAC-SHA256 |
| **Knowlia** | Moteur IA & Embeddings Vectoriels | Réseau Interne Privé | Pas d'entraînement public sur les données client |

## 4. Droits des Utilisateurs (RGPD & Lois Informatique et Libertés)
- **Droit d'Accès et d'Export** : L'administrateur peut exporter l'intégralité des registres au format CSV/JSON (`/api/v1/imports/export/sales`).
- **Droit à l'Effacement** : Toute organisation supprimée entraîne la purge en cascade (`CASCADE`) de ses données, membres, registres et sessions WhatsApp.
