export type BusinessCategory =
  | "retail"
  | "services"
  | "hospitality"
  | "crafts"
  | "association";

export interface ActivationStep {
  id: string;
  title: string;
  description: string;
  exampleText?: string;
  actionLabel: string;
  actionType: "voice" | "navigate" | "radar" | "pos" | "copilot";
  actionHref?: string;
}

export interface ActivationGuideConfig {
  welcomeTitle: string;
  welcomeDescription: string;
  steps: ActivationStep[];
}

export interface BusinessCategoryConfig {
  id: BusinessCategory;
  name: string;
  shortName: string;
  emoji: string;
  badge: string;
  description: string;
  activationGuide: ActivationGuideConfig;
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
    activationGuide: {
      welcomeTitle: "Bienvenue dans le cockpit de votre commerce !",
      welcomeDescription: "Complétez ces 4 étapes simples pour automatiser vos ventes et votre tiroir-caisse en quelques minutes.",
      steps: [
        {
          id: "step-voice",
          title: "Dictez votre 1ère vente au comptoir",
          description: "Utilisez la reconnaissance vocale IA pour enregistrer une vente en 3 secondes sans taper au clavier.",
          exampleText: "Exemple : 'Vente de 2 robes à 15000 francs au client Marc'",
          actionLabel: "🎙️ Ouvrir la Dictée Vocale",
          actionType: "voice",
        },
        {
          id: "step-catalog",
          title: "Enregistrez un premier produit ou stock",
          description: "Ajoutez vos articles phares avec leur prix de vente, coût d'achat et seuil d'alerte de réapprovisionnement.",
          actionLabel: "📦 Gérer le Catalogue",
          actionType: "navigate",
          actionHref: "/espace/offres",
        },
        {
          id: "step-radar",
          title: "Lancez un diagnostic Radar Sentinelle",
          description: "L'IA analyse instantanément la cohérence de vos encaissements, vos marges et vos relances d'impayés.",
          actionLabel: "🛡️ Scanner avec Radar",
          actionType: "radar",
          actionHref: "/espace/radar",
        },
        {
          id: "step-team",
          title: "Activez la borne de pointage des vendeurs",
          description: "Affichez le QR code de présence sécurisé à l'entrée du magasin ou invitez un collaborateur.",
          actionLabel: "👥 Ouvrir la Borne QR",
          actionType: "navigate",
          actionHref: "/espace/presence/borne",
        },
      ],
    },
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
    activationGuide: {
      welcomeTitle: "Bienvenue dans le cockpit de votre cabinet / agence !",
      welcomeDescription: "Configurez votre facturation et le suivi de vos missions en 4 étapes clés.",
      steps: [
        {
          id: "step-voice",
          title: "Dictez votre 1er contrat ou prestation",
          description: "Enregistrez une mission ou une facture d'honoraires signée en dictant simplement les modalités.",
          exampleText: "Exemple : 'Contrat de maintenance web à 250000 francs pour la société Alpha'",
          actionLabel: "🎙️ Dicter une Prestation",
          actionType: "voice",
        },
        {
          id: "step-catalog",
          title: "Définissez vos forfaits et expertises",
          description: "Structurez votre catalogue d'offres de services, taux journaliers et forfaits d'intervention.",
          actionLabel: "💼 Gérer les Prestations",
          actionType: "navigate",
          actionHref: "/espace/offres",
        },
        {
          id: "step-radar",
          title: "Auditez vos créances et rentabilité Radar",
          description: "Visualisez les factures en attente de règlement et générez des relances automatiques par WhatsApp.",
          actionLabel: "🛡️ Lancer l'Audit Radar",
          actionType: "radar",
          actionHref: "/espace/radar",
        },
        {
          id: "step-team",
          title: "Invitez vos consultants & collaborateurs",
          description: "Donnez des accès sécurisés à vos équipes et suivez les présences et temps d'intervention.",
          actionLabel: "👥 Gérer l'Équipe",
          actionType: "navigate",
          actionHref: "/espace/organisation",
        },
      ],
    },
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
    activationGuide: {
      welcomeTitle: "Bienvenue dans le cockpit de votre établissement !",
      welcomeDescription: "Prenez en main la gestion de vos commandes, votre carte et vos encaissements de salle.",
      steps: [
        {
          id: "step-voice",
          title: "Dictez une commande de table ou addition",
          description: "Enregistrez instantanément les consommations de vos clients à la voix en quelques secondes.",
          exampleText: "Exemple : 'Commande table 4 : 3 menus du jour et 2 boissons à 18000 francs'",
          actionLabel: "🎙️ Dicter une Commande",
          actionType: "voice",
        },
        {
          id: "step-catalog",
          title: "Paramétrez votre carte & menus",
          description: "Renseignez vos plats, boissons et formules avec leur prix et contrôle des stocks d'ingrédients.",
          actionLabel: "🍽️ Gérer la Carte",
          actionType: "navigate",
          actionHref: "/espace/offres",
        },
        {
          id: "step-radar",
          title: "Contrôlez l'audit de caisse du jour avec Radar",
          description: "Vérifiez le total encaissé par mode de paiement (Espèces, Wave, MoMo) et les écarts de caisse.",
          actionLabel: "🛡️ Clôture & Audit Radar",
          actionType: "radar",
          actionHref: "/espace/radar",
        },
        {
          id: "step-team",
          title: "Activez le pointage de brigade (Salle & Cuisine)",
          description: "Mettez en place la borne QR Code pour suivre la ponctualité des serveurs et cuisiniers.",
          actionLabel: "🕒 Borne de Pointage",
          actionType: "navigate",
          actionHref: "/espace/presence/borne",
        },
      ],
    },
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
    activationGuide: {
      welcomeTitle: "Bienvenue dans le cockpit de votre atelier !",
      welcomeDescription: "Gérez vos confections, acomptes clients et matières premières en 4 étapes simples.",
      steps: [
        {
          id: "step-voice",
          title: "Dictez une commande d'atelier ou devis",
          description: "Enregistrez les commandes de vos clients avec l'acompte versé et le solde restant à la livraison.",
          exampleText: "Exemple : 'Commande robe sur-mesure à 45000 francs avec acompte de 20000 francs'",
          actionLabel: "🎙️ Dicter une Commande",
          actionType: "voice",
        },
        {
          id: "step-catalog",
          title: "Enregistrez vos créations & matières",
          description: "Ajoutez vos modèles, réparations types et suivez le stock de fournitures d'atelier.",
          actionLabel: "✂️ Gérer le Catalogue",
          actionType: "navigate",
          actionHref: "/espace/offres",
        },
        {
          id: "step-radar",
          title: "Auditez les acomptes et livraisons Radar",
          description: "Contrôlez les encaissements en attente de livraison et la marge nette de vos créations.",
          actionLabel: "🛡️ Audit Radar Atelier",
          actionType: "radar",
          actionHref: "/espace/radar",
        },
        {
          id: "step-team",
          title: "Activez le pointage d'équipe d'atelier",
          description: "Suivez la présence des artisans et ouvriers à l'atelier via la borne de pointage.",
          actionLabel: "📍 Pointage Atelier",
          actionType: "navigate",
          actionHref: "/espace/presence/borne",
        },
      ],
    },
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
    activationGuide: {
      welcomeTitle: "Bienvenue dans le cockpit de votre organisation !",
      welcomeDescription: "Garantissez la transparence financière et la mobilisation de vos membres en 4 étapes.",
      steps: [
        {
          id: "step-voice",
          title: "Dictez un don ou une adhésion reçue",
          description: "Enregistrez les contributions et cotisations perçues avec délivrance immédiate de reçu.",
          exampleText: "Exemple : 'Cotisation annuelle de 30000 francs reçue du membre Paul'",
          actionLabel: "🎙️ Dicter une Cotisation",
          actionType: "voice",
        },
        {
          id: "step-catalog",
          title: "Configurez vos types d'adhésions & projets",
          description: "Définissez les grilles de dons, types de membres et lignes de projets d'impact.",
          actionLabel: "🤝 Types d'Adhésions",
          actionType: "navigate",
          actionHref: "/espace/offres",
        },
        {
          id: "step-radar",
          title: "Certifiez la conformité & gouvernance Radar",
          description: "Auditez la transparence des comptes et la traçabilité des dépenses de mission.",
          actionLabel: "🛡️ Audit de Gouvernance",
          actionType: "radar",
          actionHref: "/espace/radar",
        },
        {
          id: "step-team",
          title: "Feuille de présence des bénévoles",
          description: "Activez le QR Code de présence pour vos réunions, assemblées générales et missions terrain.",
          actionLabel: "📋 Présence Bénévoles",
          actionType: "navigate",
          actionHref: "/espace/presence/borne",
        },
      ],
    },
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
