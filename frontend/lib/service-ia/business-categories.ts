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

const CATEGORY_TRANSLATIONS: Record<
  string,
  Record<
    BusinessCategory,
    {
      name: string;
      registers: {
        offers: { title: string; subtitle: string; singular: string };
        sales: { title: string; subtitle: string; singular: string };
        expenses: { title: string; subtitle: string; singular: string };
        suppliers: { title: string; subtitle: string; singular: string };
        procedures: { title: string; subtitle: string; singular: string };
        attendance: { title: string; subtitle: string; singular: string };
      };
    }
  >
> = {
  en: {
    retail: {
      name: "Retail & Distribution",
      registers: {
        offers: { title: "Products & Stock", subtitle: "Manage products, sales prices and stock levels", singular: "Product" },
        sales: { title: "Sales & Cash", subtitle: "Collect client payments and monitor cash balance", singular: "Sale" },
        expenses: { title: "Purchases & Expenses", subtitle: "Operating costs and supplier payouts", singular: "Expense" },
        suppliers: { title: "Suppliers & Wholesalers", subtitle: "Wholesale suppliers and distributors", singular: "Supplier" },
        procedures: { title: "Methods & SOP", subtitle: "Operational checklists and store procedures", singular: "Procedure" },
        attendance: { title: "Staff Attendance", subtitle: "Sales team QR clock-in and work presence", singular: "Attendance" },
      },
    },
    services: {
      name: "Services & Consulting",
      registers: {
        offers: { title: "Offers & Services", subtitle: "Service packages and consulting catalogue", singular: "Offer" },
        sales: { title: "Sales & Invoicing", subtitle: "Invoices, billing and client receivables", singular: "Invoice" },
        expenses: { title: "Operating Expenses", subtitle: "Software licenses, missions and office costs", singular: "Expense" },
        suppliers: { title: "Contractors & Partners", subtitle: "Subcontractors, partners and tools", singular: "Partner" },
        procedures: { title: "Methods & SOP", subtitle: "Client onboarding and delivery procedures", singular: "SOP" },
        attendance: { title: "Timesheets & Team", subtitle: "Daily presence and team activity tracking", singular: "Timesheet" },
      },
    },
    hospitality: {
      name: "Hospitality & Restaurant",
      registers: {
        offers: { title: "Menu & Beverages", subtitle: "Dishes, daily menus and bar drinks", singular: "Item" },
        sales: { title: "Orders & Bills", subtitle: "Table receipts and cash register", singular: "Order" },
        expenses: { title: "Food & Beverage Purchases", subtitle: "Fresh ingredients and stock costs", singular: "Purchase" },
        suppliers: { title: "Food Suppliers & Markets", subtitle: "Wholesale food markets and brewers", singular: "Supplier" },
        procedures: { title: "Hygiene & Recipe Cards", subtitle: "Kitchen recipes and health compliance", singular: "Recipe" },
        attendance: { title: "Shift & Service Staff", subtitle: "Kitchen and dining room shifts", singular: "Shift" },
      },
    },
    crafts: {
      name: "Crafts & Production",
      registers: {
        offers: { title: "Fabrication & Parts", subtitle: "Custom works and price catalogue", singular: "Item" },
        sales: { title: "Quotes & Job Invoices", subtitle: "Job site estimates and deposits", singular: "Quote" },
        expenses: { title: "Materials & Tooling", subtitle: "Raw materials and machine costs", singular: "Material" },
        suppliers: { title: "Trade Suppliers", subtitle: "Hardware and material merchants", singular: "Merchant" },
        procedures: { title: "Safety & Manufacturing", subtitle: "Manufacturing guides and site safety", singular: "Safety" },
        attendance: { title: "Site Clock-in", subtitle: "Daily site team clock-in", singular: "Clock-in" },
      },
    },
    association: {
      name: "Education & Non-Profit",
      registers: {
        offers: { title: "Members & Enrollments", subtitle: "School tuitions, member plans and dues", singular: "Tuition" },
        sales: { title: "Tuitions & Receipts", subtitle: "Collected fees, donations and grants", singular: "Receipt" },
        expenses: { title: "Project Expenses", subtitle: "Field operations and project expenses", singular: "Expense" },
        suppliers: { title: "Donors & Partners", subtitle: "Institutional funders and NGOs", singular: "Donor" },
        procedures: { title: "Governance & Bylaws", subtitle: "Internal regulations and committees", singular: "Rule" },
        attendance: { title: "Team & Volunteer Attendance", subtitle: "Meeting sheets and field presence", singular: "Presence" },
      },
    },
  },
  es: {
    retail: {
      name: "Comercio y Distribución",
      registers: {
        offers: { title: "Productos y Stock", subtitle: "Gestión de artículos y existencias físicas", singular: "Producto" },
        sales: { title: "Ventas y Caja", subtitle: "Cobros y control de tesorería diaria", singular: "Venta" },
        expenses: { title: "Compras y Gastos", subtitle: "Compras de mercancías y costes operativos", singular: "Gasto" },
        suppliers: { title: "Proveedores y Mayoristas", subtitle: "Mayoristas y distribuidores", singular: "Proveedor" },
        procedures: { title: "Métodos y SOP", subtitle: "Guías de venta y procedimientos", singular: "Procedimiento" },
        attendance: { title: "Asistencia de Vendedores", subtitle: "Fichaje QR y control de turnos", singular: "Asistencia" },
      },
    },
    services: {
      name: "Servicios y Consultoría",
      registers: {
        offers: { title: "Ofertas y Servicios", subtitle: "Catálogo de prestaciones y consultoría", singular: "Oferta" },
        sales: { title: "Ventas y Facturación", subtitle: "Facturas y cobro a clientes", singular: "Factura" },
        expenses: { title: "Gastos de Operación", subtitle: "Costes operativos y herramientas", singular: "Gasto" },
        suppliers: { title: "Prestadores y Socios", subtitle: "Subcontratistas y socios", singular: "Socio" },
        procedures: { title: "Métodos y SOP", subtitle: "Metodologías de entrega y soporte", singular: "SOP" },
        attendance: { title: "Control de Tiempos", subtitle: "Registro horario y actividad del equipo", singular: "Horas" },
      },
    },
    hospitality: {
      name: "Restauración y Hostelería",
      registers: {
        offers: { title: "Carta y Bebidas", subtitle: "Platos, menús y bebidas", singular: "Plato" },
        sales: { title: "Pedidos y Cuentas", subtitle: "Comandas y caja del restaurante", singular: "Comanda" },
        expenses: { title: "Compras de Alimentos", subtitle: "Ingredientes y bebidas al por mayor", singular: "Compra" },
        suppliers: { title: "Proveedores y Mercados", subtitle: "Mercados y distribuidores", singular: "Proveedor" },
        procedures: { title: "Higiene y Recetas", subtitle: "Fichas técnicas y normas de sanidad", singular: "Receta" },
        attendance: { title: "Turnos y Servicio", subtitle: "Fichaje de cocina y sala", singular: "Turno" },
      },
    },
    crafts: {
      name: "Artesanía y Obras",
      registers: {
        offers: { title: "Piezas y Obras", subtitle: "Obras por encargo y catálogo", singular: "Pieza" },
        sales: { title: "Presupuestos y Facturas", subtitle: "Presupuestos de obras y anticipos", singular: "Presupuesto" },
        expenses: { title: "Materiales y Herramientas", subtitle: "Materias primas y maquinaria", singular: "Material" },
        suppliers: { title: "Almacenes y Proveedores", subtitle: "Distribuidores de materiales", singular: "Proveedor" },
        procedures: { title: "Seguridad y Fabricación", subtitle: "Guías de taller y seguridad en obra", singular: "Guía" },
        attendance: { title: "Fichaje en Obra", subtitle: "Control de presencia de operarios", singular: "Fichaje" },
      },
    },
    association: {
      name: "Educación y Asociaciones",
      registers: {
        offers: { title: "Matrículas y Membresías", subtitle: "Planes escolares y cuotas de miembros", singular: "Matrícula" },
        sales: { title: "Ingresos y Cuotas", subtitle: "Cobro de cuotas, donaciones y ayudas", singular: "Ingreso" },
        expenses: { title: "Gastos de Proyectos", subtitle: "Gastos de misión y acciones de campo", singular: "Gasto" },
        suppliers: { title: "Donantes y Socios", subtitle: "Organismos de financiación y ONGs", singular: "Donante" },
        procedures: { title: "Estatutos y Normas", subtitle: "Reglamento interno y comités", singular: "Reglamento" },
        attendance: { title: "Asistencia y Voluntarios", subtitle: "Presencia en reuniones y clases", singular: "Presencia" },
      },
    },
  },
  pt: {
    retail: {
      name: "Comércio e Distribuição",
      registers: {
        offers: { title: "Produtos e Stock", subtitle: "Gestão de catálogo e níveis de stock", singular: "Produto" },
        sales: { title: "Vendas e Caixa", subtitle: "Recebimentos e controlo de caixa", singular: "Venda" },
        expenses: { title: "Compras e Despesas", subtitle: "Custos operacionais e pagamentos", singular: "Despesa" },
        suppliers: { title: "Fornecedores e Grossistas", subtitle: "Grossistas e distribuidores", singular: "Fornecedor" },
        procedures: { title: "Métodos e SOP", subtitle: "Procedimentos e rotinas da loja", singular: "Procedimento" },
        attendance: { title: "Presença da Equipa", subtitle: "Registo QR de presença dos vendedores", singular: "Presença" },
      },
    },
    services: {
      name: "Serviços e Consultoria",
      registers: {
        offers: { title: "Ofertas e Serviços", subtitle: "Catálogo de prestações e consultoria", singular: "Oferta" },
        sales: { title: "Vendas e Faturação", subtitle: "Faturação e cobranças a clientes", singular: "Fatura" },
        expenses: { title: "Despesas Operacionais", subtitle: "Custos correntes e ferramentas", singular: "Despesa" },
        suppliers: { title: "Prestadores e Parceiros", subtitle: "Subcontratados e fornecedores", singular: "Parceiro" },
        procedures: { title: "Métodos e SOP", subtitle: "Processos de entrega e qualidade", singular: "SOP" },
        attendance: { title: "Registo de Horas", subtitle: "Registo diário de atividade da equipa", singular: "Horas" },
      },
    },
    hospitality: {
      name: "Restauração e Hotelaria",
      registers: {
        offers: { title: "Ementa e Bebidas", subtitle: "Pratos, menus e bebidas de bar", singular: "Item" },
        sales: { title: "Pedidos e Contas", subtitle: "Comandas e fecho de caixa", singular: "Pedido" },
        expenses: { title: "Compras de Matérias-Primas", subtitle: "Alimentos frescos e bebidas", singular: "Compra" },
        suppliers: { title: "Fornecedores e Mercados", subtitle: "Mercados e distribuidores", singular: "Fornecedor" },
        procedures: { title: "Higiene e Fichas Técnicas", subtitle: "Fichas técnicas e regras de HACCP", singular: "Ficha" },
        attendance: { title: "Turnos e Escalas", subtitle: "Ponto de cozinha e sala", singular: "Turno" },
      },
    },
    crafts: {
      name: "Produção e Construção",
      registers: {
        offers: { title: "Peças e Obras", subtitle: "Trabalhos por medida e catálogo", singular: "Peça" },
        sales: { title: "Orçamentos e Obras", subtitle: "Orçamentos e autos de medição", singular: "Orçamento" },
        expenses: { title: "Materiais e Ferramentas", subtitle: "Matérias-primas e equipamentos", singular: "Material" },
        suppliers: { title: "Armazéns e Fornecedores", subtitle: "Distribuidores de materiais", singular: "Fornecedor" },
        procedures: { title: "Segurança e Produção", subtitle: "Segurança no trabalho e guias de fábrica", singular: "Guia" },
        attendance: { title: "Ponto em Obra", subtitle: "Registo diário de operários", singular: "Ponto" },
      },
    },
    association: {
      name: "Educação e Associações",
      registers: {
        offers: { title: "Propinas e Membros", subtitle: "Mensalidades escolares e quotas", singular: "Propina" },
        sales: { title: "Receitas e Mensalidades", subtitle: "Cobrança de mensalidades e donativos", singular: "Receita" },
        expenses: { title: "Despesas de Projetos", subtitle: "Ações de terreno e despesas do projeto", singular: "Despesa" },
        suppliers: { title: "Financiadores e Parceiros", subtitle: "Entidades financiadoras e ONGs", singular: "Financiador" },
        procedures: { title: "Estatutos e Normas", subtitle: "Regulamento interno e atas", singular: "Regulamento" },
        attendance: { title: "Presença e Voluntariado", subtitle: "Assiduidade a aulas e reuniões", singular: "Presença" },
      },
    },
  },
  ar: {
    retail: {
      name: "التجارة والتوزيع",
      registers: {
        offers: { title: "المنتجات والمخزون", subtitle: "إدارة قائمة الأصناف ومستويات المخزون", singular: "منتج" },
        sales: { title: "المبيعات والصندوق", subtitle: "تحصيل المبيعات ومتابعة النقد اليومي", singular: "عملية بيع" },
        expenses: { title: "المشتريات والمصروفات", subtitle: "تكاليف التشغيل ومشتريات البضاعة", singular: "مصروف" },
        suppliers: { title: "الموردون وتجار الجملة", subtitle: "تجار الجملة والموزعون", singular: "مورد" },
        procedures: { title: "إجراءات العمل القياسية", subtitle: "دليل العمليات وسياسات المتجر", singular: "إجراء" },
        attendance: { title: "حضور البائعين", subtitle: "تسجيل الحضور برمز QR للموظفين", singular: "حضور" },
      },
    },
    services: {
      name: "الخدمات والاستشارات",
      registers: {
        offers: { title: "العروض والخدمات", subtitle: "باقات الخدمات والاستشارات", singular: "عرض" },
        sales: { title: "المبيعات والفوترة", subtitle: "الفواتير وتحصيل مستحقات العملاء", singular: "فاتورة" },
        expenses: { title: "تكاليف التشغيل", subtitle: "المصروفات التشغيلية والاشتراكات", singular: "مصروف" },
        suppliers: { title: "الموردون والشركاء", subtitle: "المتعاقدون والشركاء", singular: "شريك" },
        procedures: { title: "إجراءات العمل القياسية", subtitle: "إجراءات تقديم الخدمات وضمان الجودة", singular: "إجراء" },
        attendance: { title: "تسجيل الساعات والدوام", subtitle: "متابعة أداء وحضور الفريق اليومي", singular: "ساعات عمل" },
      },
    },
    hospitality: {
      name: "المطاعم والضيافة",
      registers: {
        offers: { title: "قائمة الطعام والمشروبات", subtitle: "الأطباق والوجبات اليومية والمشروبات", singular: "صنف" },
        sales: { title: "الطلبات وفواتير الطاولات", subtitle: "حسابات الطاولات وصندوق المطعم", singular: "طلب" },
        expenses: { title: "مشتريات المواد الغذائية", subtitle: "المواد الطازجة والتموين", singular: "شراء" },
        suppliers: { title: "الموردون والأسواق", subtitle: "أسواق الجملة وموردو الأغذية", singular: "مورد" },
        procedures: { title: "معايير النظافة وإعداد الوصفات", subtitle: "بطاقات الوصفات ومعايير السلامة", singular: "وصفة" },
        attendance: { title: "ورديات العمل والخدمة", subtitle: "دوام طاقم المطبخ والصالة", singular: "وردية" },
      },
    },
    crafts: {
      name: "الحرف والإنتاج والمقاولات",
      registers: {
        offers: { title: "دليل القطع والأعمال", subtitle: "الأعمال حسب الطلب والمنتجات", singular: "قطعة" },
        sales: { title: "عروض الأسعار والفواتير", subtitle: "عقود الورش والدفعات المقدمة", singular: "عرض سعر" },
        expenses: { title: "المواد والمعدات", subtitle: "المواد الأولية وصيانة الآلات", singular: "مادة" },
        suppliers: { title: "الموردون والمتاجر", subtitle: "موردو المعدات ومواد البناء", singular: "مورد" },
        procedures: { title: "بطاقات التصنيع والسلامة", subtitle: "إرشادات السلامة في الورش والمواقع", singular: "إرشاد" },
        attendance: { title: "تسجيل دوام الورش والمواقع", subtitle: "متابعة حضور العمال في المواقع", singular: "دوام" },
      },
    },
    association: {
      name: "التعليم والجمعيات",
      registers: {
        offers: { title: "الاشتراكات والرسوم الدراسية", subtitle: "الأقساط المدرسية ورسوم العضوية", singular: "اشتراك" },
        sales: { title: "المتحصلات والرسوم", subtitle: "تحصيل الأقساط والتبرعات والمساعدات", singular: "متحصل" },
        expenses: { title: "نفقات المشاريع", subtitle: "نفقات الأنشطة والمهام الميدانية", singular: "نفقة" },
        suppliers: { title: "المانحون والشركاء", subtitle: "الجهات المانحة والمنظمات الشريكة", singular: "مانح" },
        procedures: { title: "اللوائح والحوكمة", subtitle: "النظام الداخلي ومحاضر الاجتماعات", singular: "لائحة" },
        attendance: { title: "حضور الفريق والمتطوعين", subtitle: "سجلات حضور الدروس والاجتماعات", singular: "حضور" },
      },
    },
  },
};

export function getBusinessCategoryConfig(category?: string | null, lang: string = "fr"): BusinessCategoryConfig {
  const catKey = (category && category in BUSINESS_CATEGORIES ? category : "retail") as BusinessCategory;
  const base = BUSINESS_CATEGORIES[catKey];

  if (lang && lang !== "fr" && CATEGORY_TRANSLATIONS[lang]?.[catKey]) {
    const tr = CATEGORY_TRANSLATIONS[lang][catKey];
    return {
      ...base,
      name: tr.name,
      registers: {
        offers: { ...base.registers.offers, ...tr.registers.offers },
        sales: { ...base.registers.sales, ...tr.registers.sales },
        expenses: { ...base.registers.expenses, ...tr.registers.expenses },
        suppliers: { ...base.registers.suppliers, ...tr.registers.suppliers },
        procedures: { ...base.registers.procedures, ...tr.registers.procedures },
        attendance: { ...base.registers.attendance, ...tr.registers.attendance },
      },
    };
  }

  return base;
}
