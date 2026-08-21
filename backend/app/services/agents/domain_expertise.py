# ruff: noqa: E501
from __future__ import annotations

from typing import Any

DOMAIN_EXPERTISE: dict[str, dict[str, Any]] = {
    "education": {
        "sector_label": "Établissement Scolaire, Université & Centre de Formation",
        "role_finance": "Intendant Financier & Trésorier Scolaire",
        "role_sales": "Responsable des Inscriptions & Recouvrement des Écolages",
        "role_radar": "Sentinelle Pédagogique & Conformité Administrative",
        "role_ops": "Coordinateur des Procédures & Règlements Scolaires",
        "core_concepts": [
            "Frais de scolarité, inscriptions et réinscriptions",
            "Échéancier des tranches (Rentrée, Trimestre 1, Trimestre 2, Trimestre 3)",
            "Vacations et rémunérations des enseignants et intervenants",
            "Frais annexes (Cantine, transport scolaire, manuels, tenues scolaires)",
            "Effectif par classe / filière et taux de rétention des élèves",
        ],
        "kpi_rules": (
            "1. Taux de Recouvrement des Écolages : Surveiller activement les impayés avant les périodes d'examens et de remise des bulletins.\n"
            "2. Couverture des Vacations : S'assurer que le solde de caisse couvre les heures de cours prestées par les enseignants vacataires.\n"
            "3. Trésorerie d'Intersaison : Alerter sur le matelas de sécurité nécessaire pour couvrir les mois de vacances (juillet-août-septembre).\n"
            "4. Communication Diplomatique : Rédiger des relances respectueuses, chaleureuses mais fermes à destination des parents d'élèves."
        ),
        "example_relance": (
            "Chers parents de l'élève {eleve}, nous vous remercions pour votre confiance envers notre établissement. "
            "Sauf erreur de notre part, le règlement de la {tranche} d'un montant de {montant} reste en attente. "
            "Nous vous prions de bien vouloir régulariser auprès du secrétariat ou par Mobile Money d'ici le {date} afin d'assurer la continuité des cours. Cordialement, La Direction."
        ),
    },
    "retail": {
        "sector_label": "Commerce de Détail, Boutique, Épicerie & Distribution",
        "role_finance": "Directeur Administratif & Financier Commerce",
        "role_sales": "Chef des Ventes & Recouvrement Commercial",
        "role_radar": "Auditeur des Stocks & Sécurité Caisse",
        "role_ops": "Gestionnaire des Processus Magasin & Logistique",
        "core_concepts": [
            "Rotation des stocks et démarque inconnue",
            "Marge commerciale sur coût d'achat (Coût des marchandises vendues)",
            "Panier moyen client et fréquence de passage en caisse",
            "Crédits clients de proximité et délais de règlement fournisseurs",
            "Ruptures sur références phares (Top 20/80)",
        ],
        "kpi_rules": (
            "1. Marge Brute : Maintenir une marge supérieure au seuil d'équilibre des charges fixes.\n"
            "2. Rotation des Stocks : Éviter le surstockage sur les articles à faible rotation qui immobilise la trésorerie.\n"
            "3. Rapprochement de Caisse Quotidien : Vérifier l'écart entre le tiroir-caisse physique et les ventes enregistrées."
        ),
        "example_relance": (
            "Bonjour {client}, nous vous contactons concernant votre facture {ref} de {montant} échue le {date}. "
            "Merci de procéder au règlement en boutique ou par virement pour maintenir votre encours ouvert. Excellente journée."
        ),
    },
    "services": {
        "sector_label": "Prestations de Services, Cabinet Conseil, Agence & Ingénierie",
        "role_finance": "Contrôleur de Gestion & Trésorerie Services",
        "role_sales": "Directeur du Développement & Recouvrement B2B",
        "role_radar": "Auditeur de Rentabilité des Missions & Délais",
        "role_ops": "Manager des Livrables & Méthodes Opérationnelles",
        "core_concepts": [
            "Taux Journalier Moyen (TJM) et rentabilité des forfaits",
            "Encaissement d'acomptes de démarrage (30% à 50% à la commande)",
            "Délais de paiement B2B (30 jours fin de mois) et DSO",
            "Facturation des avenants en cas de dépassement de périmètre",
        ],
        "kpi_rules": (
            "1. Règle d'or de l'Acompte : Ne jamais démarrer une mission sans acompte encaissé.\n"
            "2. Recouvrement B2B Proactif : Relancer à J-5 de l'échéance puis à J+2 avec la facture en pièce jointe.\n"
            "3. Rentabilité des Contrats : Surveiller le temps passé par rapport au budget facturé."
        ),
        "example_relance": (
            "Bonjour {client}, nous espérons que les livrables transmis vous apportent entière satisfaction. "
            "Nous vous rappelons que la facture {ref} d'un montant de {montant} arrive à échéance le {date}. "
            "Notre RIB reste à votre disposition pour le virement. Bien cordialement."
        ),
    },
    "hospitality": {
        "sector_label": "Restauration, Fast-food, Bar, Café & Hôtellerie",
        "role_finance": "Gestionnaire des Marges & Ratios de Restauration",
        "role_sales": "Maître d'Hôtel & Responsable Fidélisation",
        "role_radar": "Contrôleur des Pertes, Coulage & Hygiène",
        "role_ops": "Responsable des Fiches Techniques & Service en Salle",
        "core_concepts": [
            "Ratio Food Cost (Coût matière première idéalement entre 28% et 35%)",
            "Marge sur boissons (généralement > 70%)",
            "Ticket moyen par couvert (midi vs soir)",
            "Gestion des denrées périssables et anti-gaspillage",
        ],
        "kpi_rules": (
            "1. Contrôle Quotidien des Recettes : Encaisser immédiatement chaque addition.\n"
            "2. Optimisation des Achats : Négocier les approvisionnements réguliers au marché pour minimiser les pertes."
        ),
        "example_relance": (
            "Bonjour {client}, suite à votre événement privatisé dans notre établissement, nous vous transmettons le récapitulatif du solde restant de {montant}. Merci pour votre visite !"
        ),
    },
    "crafts": {
        "sector_label": "Artisanat, BTP, Menuiserie, Couture & Fabrication",
        "role_finance": "Économiste de la Construction & Rentabilité d'Atelier",
        "role_sales": "Chargé d'Affaires & Encaissements de Chantiers",
        "role_radar": "Contrôleur des Délais, Retenues & Sécurité",
        "role_ops": "Conducteur de Travaux & Fiches de Fabrication",
        "core_concepts": [
            "Acompte d'approvisionnement matière (minimum 40%)",
            "Facturation aux étapes d'avancement du chantier",
            "Règlement final à la livraison de l'ouvrage",
            "Suivi rigoureux du coût des matières (bois, fer, ciment, tissus)",
        ],
        "kpi_rules": (
            "1. Sécurisation des Achats Matières : Ne jamais engager les achats de matériaux sur fonds propres sans acompte client.\n"
            "2. Réception de Travaux : Faire signer le procès-verbal de réception pour déclencher le solde final."
        ),
        "example_relance": (
            "Bonjour {client}, les travaux de votre chantier sont désormais achevés conformément au devis validé. "
            "Le solde de livraison de {montant} est désormais payable. Nous vous remercions pour votre collaboration."
        ),
    },
}


def get_domain_expertise(sector_key: str | None) -> dict[str, Any]:
    if not sector_key:
        return DOMAIN_EXPERTISE["retail"]
    key = sector_key.lower().strip()
    if any(w in key for w in ["educ", "ecole", "scol", "school", "form"]):
        return DOMAIN_EXPERTISE["education"]
    if any(w in key for w in ["serv", "cons", "agenc", "freel"]):
        return DOMAIN_EXPERTISE["services"]
    if any(w in key for w in ["hosp", "rest", "bar", "cafe", "hotel"]):
        return DOMAIN_EXPERTISE["hospitality"]
    if any(w in key for w in ["craft", "art", "btp", "prod", "atel", "cout"]):
        return DOMAIN_EXPERTISE["crafts"]
    return DOMAIN_EXPERTISE.get(key, DOMAIN_EXPERTISE["retail"])
