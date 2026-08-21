export type SectorVocabulary = {
  salesTitle: string;
  salesDescription: string;
  newSaleButton: string;
  clientLabel: string;
  clientPlaceholder: string;
  itemLabel: string;
  itemPlaceholder: string;
  offersTitle: string;
  offersDescription: string;
  newOfferButton: string;
  expensesTitle: string;
  expensesDescription: string;
  beneficiaryLabel: string;
  beneficiaryPlaceholder: string;
  attendanceTitle: string;
  coraPersona: string;
  coraExamplePrompt: string;
};

const SECTOR_VOCABULARIES: Record<string, SectorVocabulary> = {
  education: {
    salesTitle: "Écolages & Recettes Scolaires",
    salesDescription: "Suivi des inscriptions, tranches de scolarité, cantine, transport et relances parents.",
    newSaleButton: "Encaisser un écolage",
    clientLabel: "Élève / Parent d'élève",
    clientPlaceholder: "Ex. Élève Mensah (Parent : M. Mensah +228 90 00 00 00)",
    itemLabel: "Motif d'écolage / Classe",
    itemPlaceholder: "Ex. 2ème Tranche Scolarité - 3ème A",
    offersTitle: "Classes, Niveaux & Grille Tarifaire",
    offersDescription: "Tarifs des tranches, frais d'inscription et forfaits scolaires par classe.",
    newOfferButton: "Ajouter une classe / Tarif",
    expensesTitle: "Vacations & Charges de l'Établissement",
    expensesDescription: "Règlement des professeurs, salaires du personnel, fournitures et entretien.",
    beneficiaryLabel: "Enseignant / Prestataire",
    beneficiaryPlaceholder: "Ex. Prof. Kouassi (Vacations Mathématiques)",
    attendanceTitle: "Pointage des Enseignants & Personnel",
    coraPersona: "Intendant & Gestionnaire Scolaire IA",
    coraExamplePrompt: "« Quel est le montant total des écolages impayés en classe de Terminale ? »",
  },
  retail: {
    salesTitle: "Ventes & Factures Clients",
    salesDescription: "Encaissements de caisse, facturation client et suivi des paiements reçus.",
    newSaleButton: "Nouvelle vente",
    clientLabel: "Client",
    clientPlaceholder: "Ex. Entreprise ABC ou Client Comptoir",
    itemLabel: "Article / Produit vendu",
    itemPlaceholder: "Ex. Sac de ciment 50kg, Huile 5L",
    offersTitle: "Catalogue Produits & Stocks",
    offersDescription: "Gestion des références d'articles, prix de vente et alertes de stock.",
    newOfferButton: "Ajouter un article",
    expensesTitle: "Achats & Dépenses d'Exploitation",
    expensesDescription: "Suivi des sorties de caisse, fournisseurs de marchandises et charges.",
    beneficiaryLabel: "Fournisseur / Bénéficiaire",
    beneficiaryPlaceholder: "Ex. Dépôt Général, Compagnie d'Énergie",
    attendanceTitle: "Pointage de l'Équipe Magasin",
    coraPersona: "Conseiller Commercial & Trésorerie IA",
    coraExamplePrompt: "« Fais-moi le point des ventes et de la caisse disponible aujourd'hui. »",
  },
  services: {
    salesTitle: "Facturations & Honoraires",
    salesDescription: "Devis validés, missions facturées et encaissements de prestations.",
    newSaleButton: "Nouvelle facture",
    clientLabel: "Client / Entreprise",
    clientPlaceholder: "Ex. Cabinet Conseil, Société Tech",
    itemLabel: "Prestation / Mission",
    itemPlaceholder: "Ex. Mission d'audit comptable, Développement web",
    offersTitle: "Prestations & Forfaits de Services",
    offersDescription: "Catalogue des forfaits, taux journaliers et grilles de missions.",
    newOfferButton: "Ajouter une prestation",
    expensesTitle: "Frais & Sous-traitance",
    expensesDescription: "Honoraires d'experts, outils logiciels et charges de structure.",
    beneficiaryLabel: "Sous-traitant / Prestataire",
    beneficiaryPlaceholder: "Ex. Consultant externe, Abonnement Cloud",
    attendanceTitle: "Pointage des Consultants & Équipe",
    coraPersona: "Conseiller de Direction & Finance IA",
    coraExamplePrompt: "« Quelles sont les factures clients en retard de paiement ce mois-ci ? »",
  },
  hospitality: {
    salesTitle: "Commandes & Additions",
    salesDescription: "Encaissements de salle, livraisons et additions clients.",
    newSaleButton: "Nouvelle commande / Addition",
    clientLabel: "Client / Table",
    clientPlaceholder: "Ex. Table 4, Client à emporter",
    itemLabel: "Plat / Boisson / Menu",
    itemPlaceholder: "Ex. Menu Dîner, Plat du jour",
    offersTitle: "Menu, Carte & Boissons",
    offersDescription: "Carte des plats, tarifs de bar et formules repas.",
    newOfferButton: "Ajouter au menu",
    expensesTitle: "Achats Marché & Ingrédients",
    expensesDescription: "Approvisionnement en vivres frais, boissons et gaz.",
    beneficiaryLabel: "Marchand / Fournisseur",
    beneficiaryPlaceholder: "Ex. Marché Central (Légumes), Brasserie",
    attendanceTitle: "Pointage Service & Cuisine",
    coraPersona: "Gestionnaire Restauration & Marge IA",
    coraExamplePrompt: "« Quel est le chiffre d'affaires et la marge du service de midi ? »",
  },
  crafts: {
    salesTitle: "Chantiers & Ventes d'Ouvrages",
    salesDescription: "Factures d'acompte, règlements de fin de chantier et travaux livrés.",
    newSaleButton: "Nouveau devis / Facture",
    clientLabel: "Client / Maître d'ouvrage",
    clientPlaceholder: "Ex. M. Lawson (Chantier Villa)",
    itemLabel: "Ouvrage / Travaux réalisés",
    itemPlaceholder: "Ex. Pose de toiture, Fabrication meuble",
    offersTitle: "Catalogue d'Ouvrages & Prestations",
    offersDescription: "Grille tarifaire des ouvrages sur-mesure et main d'œuvre.",
    newOfferButton: "Ajouter un ouvrage",
    expensesTitle: "Achats Matériaux & Quincaillerie",
    expensesDescription: "Bois, ciment, acier, outillage et frais d'atelier.",
    beneficiaryLabel: "Quincaillerie / Fournisseur",
    beneficiaryPlaceholder: "Ex. Quincaillerie du Port, Scierie",
    attendanceTitle: "Pointage Atelier & Chantiers",
    coraPersona: "Conducteur de Travaux & Rentabilité IA",
    coraExamplePrompt: "« Calcule la rentabilité du dernier chantier terminé. »",
  },
};

export function getSectorVocabulary(categoryOrSector?: string | null): SectorVocabulary {
  if (!categoryOrSector) return SECTOR_VOCABULARIES.retail;
  const key = categoryOrSector.toLowerCase().trim();
  if (key.includes("educ") || key.includes("ecole") || key.includes("scol") || key.includes("school") || key.includes("form")) {
    return SECTOR_VOCABULARIES.education;
  }
  if (key.includes("serv") || key.includes("cons") || key.includes("agenc") || key.includes("freel")) {
    return SECTOR_VOCABULARIES.services;
  }
  if (key.includes("hosp") || key.includes("rest") || key.includes("bar") || key.includes("cafe") || key.includes("hotel")) {
    return SECTOR_VOCABULARIES.hospitality;
  }
  if (key.includes("craft") || key.includes("art") || key.includes("btp") || key.includes("prod") || key.includes("atel")) {
    return SECTOR_VOCABULARIES.crafts;
  }
  return SECTOR_VOCABULARIES[key] || SECTOR_VOCABULARIES.retail;
}
