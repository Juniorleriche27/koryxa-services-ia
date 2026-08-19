export type BusinessCategory =
  | "retail"
  | "services"
  | "hospitality"
  | "crafts"
  | "association";

export interface BusinessCategoryConfig {
  id: BusinessCategory;
  name: string;
  shortName: string;
  emoji: string;
  badge: string;
  description: string;
  registers: {
    offers: { title: string; subtitle: string; singular: string };
    sales: { title: string; subtitle: string; singular: string };
    expenses: { title: string; subtitle: string; singular: string };
    suppliers: { title: string; subtitle: string; singular: string };
    procedures: { title: string; subtitle: string; singular: string };
    attendance: { title: string; subtitle: string; singular: string };
  };
}

export const BUSINESS_CATEGORIES: Record<BusinessCategory, BusinessCategoryConfig> = {
  retail: {
    id: "retail",
    name: "Commerce, Négoce & Distribution",
    shortName: "Commerce",
    emoji: "🛍️",
    badge: "Commerce & Distribution",
    description: "Boutiques, Supérettes, Grossistes, Magasins, Prêt-à-porter, Cosmétique, Import-Export",
    registers: {
      offers: {
        title: "Produits & Stocks",
        subtitle: "Gérez votre catalogue d'articles, prix de vente et niveaux de stock physique",
        singular: "Produit",
      },
      sales: {
        title: "Ventes & Caisse",
        subtitle: "Encaissez vos clients, suivez le tiroir-caisse et le recouvrement des créances",
        singular: "Vente",
      },
      expenses: {
        title: "Achats & Dépenses",
        subtitle: "Suivez vos achats de marchandises et frais d'exploitation du magasin",
        singular: "Dépense / Achat",
      },
      suppliers: {
        title: "Fournisseurs & Grossistes",
        subtitle: "Vos grossistes, importateurs et distributeurs réguliers",
        singular: "Fournisseur",
      },
      procedures: {
        title: "Procédures du Magasin",
        subtitle: "Règles d'ouverture de caisse, retours d'articles et tenue des rayons",
        singular: "Procédure",
      },
      attendance: {
        title: "Pointage des Vendeurs",
        subtitle: "Suivi des présences et ponctualité de l'équipe commerciale sur place",
        singular: "Pointage",
      },
    },
  },
  services: {
    id: "services",
    name: "Services, Conseil & Agences",
    shortName: "Services",
    emoji: "💼",
    badge: "Services & Conseil",
    description: "Cabinets de conseil, Agences web, Bureaux d'études, Formations, Freelances, Prestataires",
    registers: {
      offers: {
        title: "Offres & Prestations",
        subtitle: "Vos forfaits, expertises, tarifs journaliers et prestations de services",
        singular: "Offre / Forfait",
      },
      sales: {
        title: "Ventes & Facturation",
        subtitle: "Suivez vos contrats signés, factures émises et règlements clients",
        singular: "Facture / Contrat",
      },
      expenses: {
        title: "Frais d'exploitation",
        subtitle: "Suivez vos charges professionnelles, licences et sous-traitances",
        singular: "Frais",
      },
      suppliers: {
        title: "Prestataires & Partenaires",
        subtitle: "Vos sous-traitants, freelances et partenaires de service",
        singular: "Prestataire",
      },
      procedures: {
        title: "Méthodes & SOP",
        subtitle: "Processus opérationnels et standards de délivrance des projets",
        singular: "Méthode",
      },
      attendance: {
        title: "Présence Équipe",
        subtitle: "Suivi du temps et des présences des consultants et collaborateurs",
        singular: "Présence",
      },
    },
  },
  hospitality: {
    id: "hospitality",
    name: "Restauration, Hôtellerie & Loisirs",
    shortName: "Restauration",
    emoji: "🍽️",
    badge: "Restauration & Loisirs",
    description: "Restaurants, Maquis, Cafés, Salons de thé, Traiteurs, Hôtels, Événementiel",
    registers: {
      offers: {
        title: "Menu & Carte",
        subtitle: "Vos plats, boissons, formules et ingrédients en stock",
        singular: "Plat / Article",
      },
      sales: {
        title: "Commandes & Additions",
        subtitle: "Encaissements en salle, livraisons et tickets du jour",
        singular: "Addition / Commande",
      },
      expenses: {
        title: "Approvisionnements",
        subtitle: "Achats au marché, brasseries et frais de cuisine",
        singular: "Achat Ingrédients",
      },
      suppliers: {
        title: "Fournisseurs Alimentaires",
        subtitle: "Vos brasseries, grossistes et maraîchers réguliers",
        singular: "Fournisseur Alimentaire",
      },
      procedures: {
        title: "Règles d'Hygiène & Service",
        subtitle: "Protocoles sanitaires, accueil client et tenue de la cuisine",
        singular: "Règle / Protocole",
      },
      attendance: {
        title: "Pointage Serveurs & Cuisine",
        subtitle: "Présence des brigades de cuisine et du personnel de salle",
        singular: "Pointage Équipe",
      },
    },
  },
  crafts: {
    id: "crafts",
    name: "Artisanat, Ateliers & Production",
    shortName: "Artisanat",
    emoji: "✂️",
    badge: "Artisanat & Atelier",
    description: "Ateliers de couture, Menuiserie, Imprimeries, Garages, Salons de beauté/coiffure",
    registers: {
      offers: {
        title: "Catalogue des Créations",
        subtitle: "Vos modèles, confections, réparations et matières premières",
        singular: "Création / Modèle",
      },
      sales: {
        title: "Commandes & Livraisons",
        subtitle: "Suivi des commandes sur-mesure, acomptes et soldes à la livraison",
        singular: "Commande Atelier",
      },
      expenses: {
        title: "Matières Premières",
        subtitle: "Tissus, bois, pièces mécaniques et consommables d'atelier",
        singular: "Achat Matière",
      },
      suppliers: {
        title: "Fournisseurs Matériaux",
        subtitle: "Vos quincailleries, grossistes tissus et marchands de fournitures",
        singular: "Fournisseur Matériaux",
      },
      procedures: {
        title: "Fiches Techniques & Fabrication",
        subtitle: "Gammes de confection, contrôle qualité et entretien machines",
        singular: "Fiche Technique",
      },
      attendance: {
        title: "Pointage Artisans & Ouvriers",
        subtitle: "Présence à l'atelier et relevé des heures travaillées",
        singular: "Pointage Ouvrier",
      },
    },
  },
  association: {
    id: "association",
    name: "Associations, Fondations & ONG",
    shortName: "Association",
    emoji: "🤝",
    badge: "Association & ONG",
    description: "Organisations non gouvernementales, Fondations, Communautés, Clubs, Fédérations",
    registers: {
      offers: {
        title: "Membres & Adhésions",
        subtitle: "Grille des cotisations annuelles, forfaits membres et dons types",
        singular: "Type d'Adhésion",
      },
      sales: {
        title: "Dons & Recettes",
        subtitle: "Enregistrement des dons, cotisations encaissées et subventions",
        singular: "Don / Cotisation",
      },
      expenses: {
        title: "Dépenses & Projets",
        subtitle: "Frais de mission, actions sur le terrain et subventions accordées",
        singular: "Dépense Projet",
      },
      suppliers: {
        title: "Bailleurs & Partenaires",
        subtitle: "Organismes de financement, ONG partenaires et prestataires",
        singular: "Partenaire / Bailleur",
      },
      procedures: {
        title: "Statuts & Gouvernance",
        subtitle: "Règlement intérieur, tenue des assemblées et comités",
        singular: "Règlement / Statut",
      },
      attendance: {
        title: "Présence Bénévoles & Équipe",
        subtitle: "Feuilles de présence aux assemblées générales et réunions de projet",
        singular: "Présence Membre",
      },
    },
  },
};

export function getBusinessCategoryConfig(category?: string | null): BusinessCategoryConfig {
  if (category && category in BUSINESS_CATEGORIES) {
    return BUSINESS_CATEGORIES[category as BusinessCategory];
  }
  return BUSINESS_CATEGORIES.retail;
}
