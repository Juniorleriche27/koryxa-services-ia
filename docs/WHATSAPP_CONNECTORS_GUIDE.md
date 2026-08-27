# Guide des Connecteurs WhatsApp KORYXA : Meta Cloud API vs Baileys QR Code

KORYXA propose deux options de connexion pour s'adapter à la taille et aux capacités techniques de chaque entreprise.

---

## ⚖️ Comparaison Détaillée

| Caractéristique | Option A : API Meta Cloud Officielle | Option B : Baileys QR Code |
|---|---|---|
| **Nature de la solution** | Officielle, certifiée par Meta | Alternative basée sur le protocole Web Multi-Device |
| **Stabilité** | Maximale (99.9% SLA) | Dépendante de la connexion du smartphone |
| **Numéro utilisé** | Ligne WhatsApp Business dédiée | N'importe quel numéro WhatsApp sur smartphone |
| **Coût d'utilisation** | Selon grille tarifaire Meta Conversations | Gratuit (hébergé sur votre instance) |
| **Procédure de connexion** | Saisie des identifiants (Token, Phone ID, WABA) | Scan d'un QR Code en 5 secondes |
| **Reconnexion** | Permanente via Token Système | Reconnexion automatique avec persistance de session |
| **Recommandation** | Entreprises à fort volume, e-commerce, réseaux | Artisans, commerçants indépendants, démarrage rapide |

---

## 🔒 Gestion des Numéros Autorisés (Chantier 1)

KORYXA intègre un contrôle des expéditeurs :
1. **Format Obligatoire** : Les numéros sont enregistrés au format international **E.164** (ex: `+2250708091011`).
2. **Rôles Habilités** : Seuls les utilisateurs `OWNER` et `MANAGER` de l'organisation peuvent ajouter, activer ou révoquer un numéro.
3. **Sécurité contre les Abus** : Tout message provenant d'un numéro non configuré est ignoré par le moteur métier :
   - Aucune vente ou dépense n'est enregistrée.
   - Aucun solde de caisse ou chiffre d'affaires n'est communiqué.
   - Une réponse neutre informe le contact de contacter l'administrateur.
