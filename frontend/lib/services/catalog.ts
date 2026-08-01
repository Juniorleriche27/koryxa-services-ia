export type ServiceFaq = readonly [string, string];
export type ServiceStep = readonly [string, string, string];
export type ServiceDefinition = {
  slug: string; pillarSlug: string; pillarTitle: string; title: string; tagline: string; summary: string;
  problems: string[]; outcomes: string[]; features: string[]; audiences: string[]; deliverables: string[];
  process: ServiceStep[]; faqs: ServiceFaq[];
};

export const servicePillars = [
  {
    "slug": "web-ecommerce",
    "title": "Web & E-commerce",
    "description": "Des expériences web rapides, élégantes et conçues pour convertir.",
    "services": [
      "site-web-professionnel",
      "ecommerce-marketplace",
      "landing-page-conversion",
      "refonte-optimisation",
      "reservation-portail-client"
    ]
  },
  {
    "slug": "applications-saas",
    "title": "Applications & SaaS",
    "description": "Des produits numériques fiables, maintenables et prêts à évoluer.",
    "services": [
      "application-metier",
      "mvp-produit-saas",
      "crm-erp-sur-mesure",
      "portail-espace-prive",
      "application-mobile-pwa"
    ]
  },
  {
    "slug": "intelligence-artificielle",
    "title": "Intelligence artificielle",
    "description": "Des systèmes IA utiles, contextualisés et intégrés à vos opérations.",
    "services": [
      "assistant-ia-metier",
      "chatbot-support-vente",
      "agent-ia-autonome",
      "rag-base-connaissances",
      "agent-vocal-ia"
    ]
  },
  {
    "slug": "automatisation-integrations",
    "title": "Automatisation & Intégrations",
    "description": "Des workflows connectés qui libèrent du temps et réduisent les erreurs.",
    "services": [
      "automatisation-processus",
      "integration-crm-erp",
      "whatsapp-email-messaging",
      "connecteurs-api-webhooks",
      "devis-facturation-relances"
    ]
  },
  {
    "slug": "data-infrastructure",
    "title": "Data & Infrastructure",
    "description": "Une base technique robuste pour exploiter vos données et sécuriser vos services.",
    "services": [
      "dashboard-business-intelligence",
      "centralisation-qualite-donnees",
      "cloud-devops-deploiement",
      "securite-sauvegardes",
      "api-architecture-backend"
    ]
  },
  {
    "slug": "conseil-maintenance-formation",
    "title": "Conseil, maintenance & formation",
    "description": "Un accompagnement durable pour décider, progresser et maintenir la qualité.",
    "services": [
      "audit-strategie-numerique",
      "audit-ia-feuille-de-route",
      "maintenance-support",
      "formation-ia-automatisation",
      "accompagnement-produit-technique"
    ]
  }
] as const;

export const serviceCatalog: ServiceDefinition[] = [
  {
    "slug": "site-web-professionnel",
    "pillarSlug": "web-ecommerce",
    "pillarTitle": "Web & E-commerce",
    "title": "Site web professionnel",
    "tagline": "Une solution site web professionnel conçue autour de vos objectifs, de vos utilisateurs et de vos opérations.",
    "summary": "KORYXA conçoit votre projet de site web professionnel de la stratégie à la mise en production, avec une expérience premium et une architecture durable.",
    "problems": [
      "Outils dispersés ou insuffisamment adaptés",
      "Parcours utilisateurs complexes ou peu performants",
      "Tâches manuelles qui ralentissent les équipes",
      "Manque de visibilité sur les résultats"
    ],
    "outcomes": [
      "Un système clair et facile à utiliser",
      "Des opérations plus rapides et mieux structurées",
      "Une solution sécurisée et évolutive",
      "Des indicateurs utiles pour décider"
    ],
    "features": [
      "Conception sur mesure de votre site web professionnel",
      "Interface mobile-first et accessible",
      "Intégrations avec vos outils existants",
      "Gestion des rôles, données et automatisations",
      "Mesure des performances et amélioration continue",
      "Documentation et accompagnement à la prise en main"
    ],
    "audiences": [
      "PME et entreprises en croissance",
      "Indépendants et cabinets",
      "Startups et porteurs de projets",
      "Organisations et réseaux de partenaires"
    ],
    "deliverables": [
      "Cadrage fonctionnel et feuille de route",
      "Architecture UX et maquettes clés",
      "Développement et intégrations",
      "Tests, mise en production et documentation",
      "Session de transfert et plan d’évolution"
    ],
    "process": [
      [
        "01",
        "Cadrage",
        "Nous clarifions les objectifs, utilisateurs et contraintes."
      ],
      [
        "02",
        "Conception",
        "Nous définissons l’expérience, les données et l’architecture."
      ],
      [
        "03",
        "Réalisation",
        "Nous construisons par lots validables et testables."
      ],
      [
        "04",
        "Livraison",
        "Nous déployons, documentons et préparons la suite."
      ]
    ],
    "faqs": [
      [
        "Combien de temps faut-il ?",
        "Le délai dépend du périmètre. Après cadrage, nous proposons un planning par étapes avec des livrables visibles."
      ],
      [
        "Pouvez-vous reprendre un projet existant ?",
        "Oui. Nous commençons par un audit technique et UX avant de recommander une reprise, une refonte ou une migration."
      ],
      [
        "La solution peut-elle évoluer ?",
        "Oui. L’architecture, les composants et les données sont pensés pour permettre des évolutions progressives."
      ],
      [
        "Comment démarre la collaboration ?",
        "Une première demande contextualisée permet de comprendre le besoin, puis nous organisons un échange de cadrage."
      ]
    ]
  },
  {
    "slug": "ecommerce-marketplace",
    "pillarSlug": "web-ecommerce",
    "pillarTitle": "Web & E-commerce",
    "title": "E-commerce & marketplace",
    "tagline": "Une solution e-commerce & marketplace conçue autour de vos objectifs, de vos utilisateurs et de vos opérations.",
    "summary": "KORYXA conçoit votre projet de e-commerce & marketplace de la stratégie à la mise en production, avec une expérience premium et une architecture durable.",
    "problems": [
      "Outils dispersés ou insuffisamment adaptés",
      "Parcours utilisateurs complexes ou peu performants",
      "Tâches manuelles qui ralentissent les équipes",
      "Manque de visibilité sur les résultats"
    ],
    "outcomes": [
      "Un système clair et facile à utiliser",
      "Des opérations plus rapides et mieux structurées",
      "Une solution sécurisée et évolutive",
      "Des indicateurs utiles pour décider"
    ],
    "features": [
      "Conception sur mesure de votre e-commerce & marketplace",
      "Interface mobile-first et accessible",
      "Intégrations avec vos outils existants",
      "Gestion des rôles, données et automatisations",
      "Mesure des performances et amélioration continue",
      "Documentation et accompagnement à la prise en main"
    ],
    "audiences": [
      "PME et entreprises en croissance",
      "Indépendants et cabinets",
      "Startups et porteurs de projets",
      "Organisations et réseaux de partenaires"
    ],
    "deliverables": [
      "Cadrage fonctionnel et feuille de route",
      "Architecture UX et maquettes clés",
      "Développement et intégrations",
      "Tests, mise en production et documentation",
      "Session de transfert et plan d’évolution"
    ],
    "process": [
      [
        "01",
        "Cadrage",
        "Nous clarifions les objectifs, utilisateurs et contraintes."
      ],
      [
        "02",
        "Conception",
        "Nous définissons l’expérience, les données et l’architecture."
      ],
      [
        "03",
        "Réalisation",
        "Nous construisons par lots validables et testables."
      ],
      [
        "04",
        "Livraison",
        "Nous déployons, documentons et préparons la suite."
      ]
    ],
    "faqs": [
      [
        "Combien de temps faut-il ?",
        "Le délai dépend du périmètre. Après cadrage, nous proposons un planning par étapes avec des livrables visibles."
      ],
      [
        "Pouvez-vous reprendre un projet existant ?",
        "Oui. Nous commençons par un audit technique et UX avant de recommander une reprise, une refonte ou une migration."
      ],
      [
        "La solution peut-elle évoluer ?",
        "Oui. L’architecture, les composants et les données sont pensés pour permettre des évolutions progressives."
      ],
      [
        "Comment démarre la collaboration ?",
        "Une première demande contextualisée permet de comprendre le besoin, puis nous organisons un échange de cadrage."
      ]
    ]
  },
  {
    "slug": "landing-page-conversion",
    "pillarSlug": "web-ecommerce",
    "pillarTitle": "Web & E-commerce",
    "title": "Landing page & conversion",
    "tagline": "Une solution landing page & conversion conçue autour de vos objectifs, de vos utilisateurs et de vos opérations.",
    "summary": "KORYXA conçoit votre projet de landing page & conversion de la stratégie à la mise en production, avec une expérience premium et une architecture durable.",
    "problems": [
      "Outils dispersés ou insuffisamment adaptés",
      "Parcours utilisateurs complexes ou peu performants",
      "Tâches manuelles qui ralentissent les équipes",
      "Manque de visibilité sur les résultats"
    ],
    "outcomes": [
      "Un système clair et facile à utiliser",
      "Des opérations plus rapides et mieux structurées",
      "Une solution sécurisée et évolutive",
      "Des indicateurs utiles pour décider"
    ],
    "features": [
      "Conception sur mesure de votre landing page & conversion",
      "Interface mobile-first et accessible",
      "Intégrations avec vos outils existants",
      "Gestion des rôles, données et automatisations",
      "Mesure des performances et amélioration continue",
      "Documentation et accompagnement à la prise en main"
    ],
    "audiences": [
      "PME et entreprises en croissance",
      "Indépendants et cabinets",
      "Startups et porteurs de projets",
      "Organisations et réseaux de partenaires"
    ],
    "deliverables": [
      "Cadrage fonctionnel et feuille de route",
      "Architecture UX et maquettes clés",
      "Développement et intégrations",
      "Tests, mise en production et documentation",
      "Session de transfert et plan d’évolution"
    ],
    "process": [
      [
        "01",
        "Cadrage",
        "Nous clarifions les objectifs, utilisateurs et contraintes."
      ],
      [
        "02",
        "Conception",
        "Nous définissons l’expérience, les données et l’architecture."
      ],
      [
        "03",
        "Réalisation",
        "Nous construisons par lots validables et testables."
      ],
      [
        "04",
        "Livraison",
        "Nous déployons, documentons et préparons la suite."
      ]
    ],
    "faqs": [
      [
        "Combien de temps faut-il ?",
        "Le délai dépend du périmètre. Après cadrage, nous proposons un planning par étapes avec des livrables visibles."
      ],
      [
        "Pouvez-vous reprendre un projet existant ?",
        "Oui. Nous commençons par un audit technique et UX avant de recommander une reprise, une refonte ou une migration."
      ],
      [
        "La solution peut-elle évoluer ?",
        "Oui. L’architecture, les composants et les données sont pensés pour permettre des évolutions progressives."
      ],
      [
        "Comment démarre la collaboration ?",
        "Une première demande contextualisée permet de comprendre le besoin, puis nous organisons un échange de cadrage."
      ]
    ]
  },
  {
    "slug": "refonte-optimisation",
    "pillarSlug": "web-ecommerce",
    "pillarTitle": "Web & E-commerce",
    "title": "Refonte & optimisation",
    "tagline": "Une solution refonte & optimisation conçue autour de vos objectifs, de vos utilisateurs et de vos opérations.",
    "summary": "KORYXA conçoit votre projet de refonte & optimisation de la stratégie à la mise en production, avec une expérience premium et une architecture durable.",
    "problems": [
      "Outils dispersés ou insuffisamment adaptés",
      "Parcours utilisateurs complexes ou peu performants",
      "Tâches manuelles qui ralentissent les équipes",
      "Manque de visibilité sur les résultats"
    ],
    "outcomes": [
      "Un système clair et facile à utiliser",
      "Des opérations plus rapides et mieux structurées",
      "Une solution sécurisée et évolutive",
      "Des indicateurs utiles pour décider"
    ],
    "features": [
      "Conception sur mesure de votre refonte & optimisation",
      "Interface mobile-first et accessible",
      "Intégrations avec vos outils existants",
      "Gestion des rôles, données et automatisations",
      "Mesure des performances et amélioration continue",
      "Documentation et accompagnement à la prise en main"
    ],
    "audiences": [
      "PME et entreprises en croissance",
      "Indépendants et cabinets",
      "Startups et porteurs de projets",
      "Organisations et réseaux de partenaires"
    ],
    "deliverables": [
      "Cadrage fonctionnel et feuille de route",
      "Architecture UX et maquettes clés",
      "Développement et intégrations",
      "Tests, mise en production et documentation",
      "Session de transfert et plan d’évolution"
    ],
    "process": [
      [
        "01",
        "Cadrage",
        "Nous clarifions les objectifs, utilisateurs et contraintes."
      ],
      [
        "02",
        "Conception",
        "Nous définissons l’expérience, les données et l’architecture."
      ],
      [
        "03",
        "Réalisation",
        "Nous construisons par lots validables et testables."
      ],
      [
        "04",
        "Livraison",
        "Nous déployons, documentons et préparons la suite."
      ]
    ],
    "faqs": [
      [
        "Combien de temps faut-il ?",
        "Le délai dépend du périmètre. Après cadrage, nous proposons un planning par étapes avec des livrables visibles."
      ],
      [
        "Pouvez-vous reprendre un projet existant ?",
        "Oui. Nous commençons par un audit technique et UX avant de recommander une reprise, une refonte ou une migration."
      ],
      [
        "La solution peut-elle évoluer ?",
        "Oui. L’architecture, les composants et les données sont pensés pour permettre des évolutions progressives."
      ],
      [
        "Comment démarre la collaboration ?",
        "Une première demande contextualisée permet de comprendre le besoin, puis nous organisons un échange de cadrage."
      ]
    ]
  },
  {
    "slug": "reservation-portail-client",
    "pillarSlug": "web-ecommerce",
    "pillarTitle": "Web & E-commerce",
    "title": "Réservation & portail client",
    "tagline": "Une solution réservation & portail client conçue autour de vos objectifs, de vos utilisateurs et de vos opérations.",
    "summary": "KORYXA conçoit votre projet de réservation & portail client de la stratégie à la mise en production, avec une expérience premium et une architecture durable.",
    "problems": [
      "Outils dispersés ou insuffisamment adaptés",
      "Parcours utilisateurs complexes ou peu performants",
      "Tâches manuelles qui ralentissent les équipes",
      "Manque de visibilité sur les résultats"
    ],
    "outcomes": [
      "Un système clair et facile à utiliser",
      "Des opérations plus rapides et mieux structurées",
      "Une solution sécurisée et évolutive",
      "Des indicateurs utiles pour décider"
    ],
    "features": [
      "Conception sur mesure de votre réservation & portail client",
      "Interface mobile-first et accessible",
      "Intégrations avec vos outils existants",
      "Gestion des rôles, données et automatisations",
      "Mesure des performances et amélioration continue",
      "Documentation et accompagnement à la prise en main"
    ],
    "audiences": [
      "PME et entreprises en croissance",
      "Indépendants et cabinets",
      "Startups et porteurs de projets",
      "Organisations et réseaux de partenaires"
    ],
    "deliverables": [
      "Cadrage fonctionnel et feuille de route",
      "Architecture UX et maquettes clés",
      "Développement et intégrations",
      "Tests, mise en production et documentation",
      "Session de transfert et plan d’évolution"
    ],
    "process": [
      [
        "01",
        "Cadrage",
        "Nous clarifions les objectifs, utilisateurs et contraintes."
      ],
      [
        "02",
        "Conception",
        "Nous définissons l’expérience, les données et l’architecture."
      ],
      [
        "03",
        "Réalisation",
        "Nous construisons par lots validables et testables."
      ],
      [
        "04",
        "Livraison",
        "Nous déployons, documentons et préparons la suite."
      ]
    ],
    "faqs": [
      [
        "Combien de temps faut-il ?",
        "Le délai dépend du périmètre. Après cadrage, nous proposons un planning par étapes avec des livrables visibles."
      ],
      [
        "Pouvez-vous reprendre un projet existant ?",
        "Oui. Nous commençons par un audit technique et UX avant de recommander une reprise, une refonte ou une migration."
      ],
      [
        "La solution peut-elle évoluer ?",
        "Oui. L’architecture, les composants et les données sont pensés pour permettre des évolutions progressives."
      ],
      [
        "Comment démarre la collaboration ?",
        "Une première demande contextualisée permet de comprendre le besoin, puis nous organisons un échange de cadrage."
      ]
    ]
  },
  {
    "slug": "application-metier",
    "pillarSlug": "applications-saas",
    "pillarTitle": "Applications & SaaS",
    "title": "Application métier",
    "tagline": "Une solution application métier conçue autour de vos objectifs, de vos utilisateurs et de vos opérations.",
    "summary": "KORYXA conçoit votre projet de application métier de la stratégie à la mise en production, avec une expérience premium et une architecture durable.",
    "problems": [
      "Outils dispersés ou insuffisamment adaptés",
      "Parcours utilisateurs complexes ou peu performants",
      "Tâches manuelles qui ralentissent les équipes",
      "Manque de visibilité sur les résultats"
    ],
    "outcomes": [
      "Un système clair et facile à utiliser",
      "Des opérations plus rapides et mieux structurées",
      "Une solution sécurisée et évolutive",
      "Des indicateurs utiles pour décider"
    ],
    "features": [
      "Conception sur mesure de votre application métier",
      "Interface mobile-first et accessible",
      "Intégrations avec vos outils existants",
      "Gestion des rôles, données et automatisations",
      "Mesure des performances et amélioration continue",
      "Documentation et accompagnement à la prise en main"
    ],
    "audiences": [
      "PME et entreprises en croissance",
      "Indépendants et cabinets",
      "Startups et porteurs de projets",
      "Organisations et réseaux de partenaires"
    ],
    "deliverables": [
      "Cadrage fonctionnel et feuille de route",
      "Architecture UX et maquettes clés",
      "Développement et intégrations",
      "Tests, mise en production et documentation",
      "Session de transfert et plan d’évolution"
    ],
    "process": [
      [
        "01",
        "Cadrage",
        "Nous clarifions les objectifs, utilisateurs et contraintes."
      ],
      [
        "02",
        "Conception",
        "Nous définissons l’expérience, les données et l’architecture."
      ],
      [
        "03",
        "Réalisation",
        "Nous construisons par lots validables et testables."
      ],
      [
        "04",
        "Livraison",
        "Nous déployons, documentons et préparons la suite."
      ]
    ],
    "faqs": [
      [
        "Combien de temps faut-il ?",
        "Le délai dépend du périmètre. Après cadrage, nous proposons un planning par étapes avec des livrables visibles."
      ],
      [
        "Pouvez-vous reprendre un projet existant ?",
        "Oui. Nous commençons par un audit technique et UX avant de recommander une reprise, une refonte ou une migration."
      ],
      [
        "La solution peut-elle évoluer ?",
        "Oui. L’architecture, les composants et les données sont pensés pour permettre des évolutions progressives."
      ],
      [
        "Comment démarre la collaboration ?",
        "Une première demande contextualisée permet de comprendre le besoin, puis nous organisons un échange de cadrage."
      ]
    ]
  },
  {
    "slug": "mvp-produit-saas",
    "pillarSlug": "applications-saas",
    "pillarTitle": "Applications & SaaS",
    "title": "MVP & produit SaaS",
    "tagline": "Une solution mvp & produit saas conçue autour de vos objectifs, de vos utilisateurs et de vos opérations.",
    "summary": "KORYXA conçoit votre projet de mvp & produit saas de la stratégie à la mise en production, avec une expérience premium et une architecture durable.",
    "problems": [
      "Outils dispersés ou insuffisamment adaptés",
      "Parcours utilisateurs complexes ou peu performants",
      "Tâches manuelles qui ralentissent les équipes",
      "Manque de visibilité sur les résultats"
    ],
    "outcomes": [
      "Un système clair et facile à utiliser",
      "Des opérations plus rapides et mieux structurées",
      "Une solution sécurisée et évolutive",
      "Des indicateurs utiles pour décider"
    ],
    "features": [
      "Conception sur mesure de votre mvp & produit saas",
      "Interface mobile-first et accessible",
      "Intégrations avec vos outils existants",
      "Gestion des rôles, données et automatisations",
      "Mesure des performances et amélioration continue",
      "Documentation et accompagnement à la prise en main"
    ],
    "audiences": [
      "PME et entreprises en croissance",
      "Indépendants et cabinets",
      "Startups et porteurs de projets",
      "Organisations et réseaux de partenaires"
    ],
    "deliverables": [
      "Cadrage fonctionnel et feuille de route",
      "Architecture UX et maquettes clés",
      "Développement et intégrations",
      "Tests, mise en production et documentation",
      "Session de transfert et plan d’évolution"
    ],
    "process": [
      [
        "01",
        "Cadrage",
        "Nous clarifions les objectifs, utilisateurs et contraintes."
      ],
      [
        "02",
        "Conception",
        "Nous définissons l’expérience, les données et l’architecture."
      ],
      [
        "03",
        "Réalisation",
        "Nous construisons par lots validables et testables."
      ],
      [
        "04",
        "Livraison",
        "Nous déployons, documentons et préparons la suite."
      ]
    ],
    "faqs": [
      [
        "Combien de temps faut-il ?",
        "Le délai dépend du périmètre. Après cadrage, nous proposons un planning par étapes avec des livrables visibles."
      ],
      [
        "Pouvez-vous reprendre un projet existant ?",
        "Oui. Nous commençons par un audit technique et UX avant de recommander une reprise, une refonte ou une migration."
      ],
      [
        "La solution peut-elle évoluer ?",
        "Oui. L’architecture, les composants et les données sont pensés pour permettre des évolutions progressives."
      ],
      [
        "Comment démarre la collaboration ?",
        "Une première demande contextualisée permet de comprendre le besoin, puis nous organisons un échange de cadrage."
      ]
    ]
  },
  {
    "slug": "crm-erp-sur-mesure",
    "pillarSlug": "applications-saas",
    "pillarTitle": "Applications & SaaS",
    "title": "CRM & ERP sur mesure",
    "tagline": "Une solution crm & erp sur mesure conçue autour de vos objectifs, de vos utilisateurs et de vos opérations.",
    "summary": "KORYXA conçoit votre projet de crm & erp sur mesure de la stratégie à la mise en production, avec une expérience premium et une architecture durable.",
    "problems": [
      "Outils dispersés ou insuffisamment adaptés",
      "Parcours utilisateurs complexes ou peu performants",
      "Tâches manuelles qui ralentissent les équipes",
      "Manque de visibilité sur les résultats"
    ],
    "outcomes": [
      "Un système clair et facile à utiliser",
      "Des opérations plus rapides et mieux structurées",
      "Une solution sécurisée et évolutive",
      "Des indicateurs utiles pour décider"
    ],
    "features": [
      "Conception sur mesure de votre crm & erp sur mesure",
      "Interface mobile-first et accessible",
      "Intégrations avec vos outils existants",
      "Gestion des rôles, données et automatisations",
      "Mesure des performances et amélioration continue",
      "Documentation et accompagnement à la prise en main"
    ],
    "audiences": [
      "PME et entreprises en croissance",
      "Indépendants et cabinets",
      "Startups et porteurs de projets",
      "Organisations et réseaux de partenaires"
    ],
    "deliverables": [
      "Cadrage fonctionnel et feuille de route",
      "Architecture UX et maquettes clés",
      "Développement et intégrations",
      "Tests, mise en production et documentation",
      "Session de transfert et plan d’évolution"
    ],
    "process": [
      [
        "01",
        "Cadrage",
        "Nous clarifions les objectifs, utilisateurs et contraintes."
      ],
      [
        "02",
        "Conception",
        "Nous définissons l’expérience, les données et l’architecture."
      ],
      [
        "03",
        "Réalisation",
        "Nous construisons par lots validables et testables."
      ],
      [
        "04",
        "Livraison",
        "Nous déployons, documentons et préparons la suite."
      ]
    ],
    "faqs": [
      [
        "Combien de temps faut-il ?",
        "Le délai dépend du périmètre. Après cadrage, nous proposons un planning par étapes avec des livrables visibles."
      ],
      [
        "Pouvez-vous reprendre un projet existant ?",
        "Oui. Nous commençons par un audit technique et UX avant de recommander une reprise, une refonte ou une migration."
      ],
      [
        "La solution peut-elle évoluer ?",
        "Oui. L’architecture, les composants et les données sont pensés pour permettre des évolutions progressives."
      ],
      [
        "Comment démarre la collaboration ?",
        "Une première demande contextualisée permet de comprendre le besoin, puis nous organisons un échange de cadrage."
      ]
    ]
  },
  {
    "slug": "portail-espace-prive",
    "pillarSlug": "applications-saas",
    "pillarTitle": "Applications & SaaS",
    "title": "Portail & espace privé",
    "tagline": "Une solution portail & espace privé conçue autour de vos objectifs, de vos utilisateurs et de vos opérations.",
    "summary": "KORYXA conçoit votre projet de portail & espace privé de la stratégie à la mise en production, avec une expérience premium et une architecture durable.",
    "problems": [
      "Outils dispersés ou insuffisamment adaptés",
      "Parcours utilisateurs complexes ou peu performants",
      "Tâches manuelles qui ralentissent les équipes",
      "Manque de visibilité sur les résultats"
    ],
    "outcomes": [
      "Un système clair et facile à utiliser",
      "Des opérations plus rapides et mieux structurées",
      "Une solution sécurisée et évolutive",
      "Des indicateurs utiles pour décider"
    ],
    "features": [
      "Conception sur mesure de votre portail & espace privé",
      "Interface mobile-first et accessible",
      "Intégrations avec vos outils existants",
      "Gestion des rôles, données et automatisations",
      "Mesure des performances et amélioration continue",
      "Documentation et accompagnement à la prise en main"
    ],
    "audiences": [
      "PME et entreprises en croissance",
      "Indépendants et cabinets",
      "Startups et porteurs de projets",
      "Organisations et réseaux de partenaires"
    ],
    "deliverables": [
      "Cadrage fonctionnel et feuille de route",
      "Architecture UX et maquettes clés",
      "Développement et intégrations",
      "Tests, mise en production et documentation",
      "Session de transfert et plan d’évolution"
    ],
    "process": [
      [
        "01",
        "Cadrage",
        "Nous clarifions les objectifs, utilisateurs et contraintes."
      ],
      [
        "02",
        "Conception",
        "Nous définissons l’expérience, les données et l’architecture."
      ],
      [
        "03",
        "Réalisation",
        "Nous construisons par lots validables et testables."
      ],
      [
        "04",
        "Livraison",
        "Nous déployons, documentons et préparons la suite."
      ]
    ],
    "faqs": [
      [
        "Combien de temps faut-il ?",
        "Le délai dépend du périmètre. Après cadrage, nous proposons un planning par étapes avec des livrables visibles."
      ],
      [
        "Pouvez-vous reprendre un projet existant ?",
        "Oui. Nous commençons par un audit technique et UX avant de recommander une reprise, une refonte ou une migration."
      ],
      [
        "La solution peut-elle évoluer ?",
        "Oui. L’architecture, les composants et les données sont pensés pour permettre des évolutions progressives."
      ],
      [
        "Comment démarre la collaboration ?",
        "Une première demande contextualisée permet de comprendre le besoin, puis nous organisons un échange de cadrage."
      ]
    ]
  },
  {
    "slug": "application-mobile-pwa",
    "pillarSlug": "applications-saas",
    "pillarTitle": "Applications & SaaS",
    "title": "Application mobile & PWA",
    "tagline": "Une solution application mobile & pwa conçue autour de vos objectifs, de vos utilisateurs et de vos opérations.",
    "summary": "KORYXA conçoit votre projet de application mobile & pwa de la stratégie à la mise en production, avec une expérience premium et une architecture durable.",
    "problems": [
      "Outils dispersés ou insuffisamment adaptés",
      "Parcours utilisateurs complexes ou peu performants",
      "Tâches manuelles qui ralentissent les équipes",
      "Manque de visibilité sur les résultats"
    ],
    "outcomes": [
      "Un système clair et facile à utiliser",
      "Des opérations plus rapides et mieux structurées",
      "Une solution sécurisée et évolutive",
      "Des indicateurs utiles pour décider"
    ],
    "features": [
      "Conception sur mesure de votre application mobile & pwa",
      "Interface mobile-first et accessible",
      "Intégrations avec vos outils existants",
      "Gestion des rôles, données et automatisations",
      "Mesure des performances et amélioration continue",
      "Documentation et accompagnement à la prise en main"
    ],
    "audiences": [
      "PME et entreprises en croissance",
      "Indépendants et cabinets",
      "Startups et porteurs de projets",
      "Organisations et réseaux de partenaires"
    ],
    "deliverables": [
      "Cadrage fonctionnel et feuille de route",
      "Architecture UX et maquettes clés",
      "Développement et intégrations",
      "Tests, mise en production et documentation",
      "Session de transfert et plan d’évolution"
    ],
    "process": [
      [
        "01",
        "Cadrage",
        "Nous clarifions les objectifs, utilisateurs et contraintes."
      ],
      [
        "02",
        "Conception",
        "Nous définissons l’expérience, les données et l’architecture."
      ],
      [
        "03",
        "Réalisation",
        "Nous construisons par lots validables et testables."
      ],
      [
        "04",
        "Livraison",
        "Nous déployons, documentons et préparons la suite."
      ]
    ],
    "faqs": [
      [
        "Combien de temps faut-il ?",
        "Le délai dépend du périmètre. Après cadrage, nous proposons un planning par étapes avec des livrables visibles."
      ],
      [
        "Pouvez-vous reprendre un projet existant ?",
        "Oui. Nous commençons par un audit technique et UX avant de recommander une reprise, une refonte ou une migration."
      ],
      [
        "La solution peut-elle évoluer ?",
        "Oui. L’architecture, les composants et les données sont pensés pour permettre des évolutions progressives."
      ],
      [
        "Comment démarre la collaboration ?",
        "Une première demande contextualisée permet de comprendre le besoin, puis nous organisons un échange de cadrage."
      ]
    ]
  },
  {
    "slug": "assistant-ia-metier",
    "pillarSlug": "intelligence-artificielle",
    "pillarTitle": "Intelligence artificielle",
    "title": "Assistant IA métier",
    "tagline": "Une solution assistant ia métier conçue autour de vos objectifs, de vos utilisateurs et de vos opérations.",
    "summary": "KORYXA conçoit votre projet de assistant ia métier de la stratégie à la mise en production, avec une expérience premium et une architecture durable.",
    "problems": [
      "Outils dispersés ou insuffisamment adaptés",
      "Parcours utilisateurs complexes ou peu performants",
      "Tâches manuelles qui ralentissent les équipes",
      "Manque de visibilité sur les résultats"
    ],
    "outcomes": [
      "Un système clair et facile à utiliser",
      "Des opérations plus rapides et mieux structurées",
      "Une solution sécurisée et évolutive",
      "Des indicateurs utiles pour décider"
    ],
    "features": [
      "Conception sur mesure de votre assistant ia métier",
      "Interface mobile-first et accessible",
      "Intégrations avec vos outils existants",
      "Gestion des rôles, données et automatisations",
      "Mesure des performances et amélioration continue",
      "Documentation et accompagnement à la prise en main"
    ],
    "audiences": [
      "PME et entreprises en croissance",
      "Indépendants et cabinets",
      "Startups et porteurs de projets",
      "Organisations et réseaux de partenaires"
    ],
    "deliverables": [
      "Cadrage fonctionnel et feuille de route",
      "Architecture UX et maquettes clés",
      "Développement et intégrations",
      "Tests, mise en production et documentation",
      "Session de transfert et plan d’évolution"
    ],
    "process": [
      [
        "01",
        "Cadrage",
        "Nous clarifions les objectifs, utilisateurs et contraintes."
      ],
      [
        "02",
        "Conception",
        "Nous définissons l’expérience, les données et l’architecture."
      ],
      [
        "03",
        "Réalisation",
        "Nous construisons par lots validables et testables."
      ],
      [
        "04",
        "Livraison",
        "Nous déployons, documentons et préparons la suite."
      ]
    ],
    "faqs": [
      [
        "Combien de temps faut-il ?",
        "Le délai dépend du périmètre. Après cadrage, nous proposons un planning par étapes avec des livrables visibles."
      ],
      [
        "Pouvez-vous reprendre un projet existant ?",
        "Oui. Nous commençons par un audit technique et UX avant de recommander une reprise, une refonte ou une migration."
      ],
      [
        "La solution peut-elle évoluer ?",
        "Oui. L’architecture, les composants et les données sont pensés pour permettre des évolutions progressives."
      ],
      [
        "Comment démarre la collaboration ?",
        "Une première demande contextualisée permet de comprendre le besoin, puis nous organisons un échange de cadrage."
      ]
    ]
  },
  {
    "slug": "chatbot-support-vente",
    "pillarSlug": "intelligence-artificielle",
    "pillarTitle": "Intelligence artificielle",
    "title": "Chatbot support & vente",
    "tagline": "Une solution chatbot support & vente conçue autour de vos objectifs, de vos utilisateurs et de vos opérations.",
    "summary": "KORYXA conçoit votre projet de chatbot support & vente de la stratégie à la mise en production, avec une expérience premium et une architecture durable.",
    "problems": [
      "Outils dispersés ou insuffisamment adaptés",
      "Parcours utilisateurs complexes ou peu performants",
      "Tâches manuelles qui ralentissent les équipes",
      "Manque de visibilité sur les résultats"
    ],
    "outcomes": [
      "Un système clair et facile à utiliser",
      "Des opérations plus rapides et mieux structurées",
      "Une solution sécurisée et évolutive",
      "Des indicateurs utiles pour décider"
    ],
    "features": [
      "Conception sur mesure de votre chatbot support & vente",
      "Interface mobile-first et accessible",
      "Intégrations avec vos outils existants",
      "Gestion des rôles, données et automatisations",
      "Mesure des performances et amélioration continue",
      "Documentation et accompagnement à la prise en main"
    ],
    "audiences": [
      "PME et entreprises en croissance",
      "Indépendants et cabinets",
      "Startups et porteurs de projets",
      "Organisations et réseaux de partenaires"
    ],
    "deliverables": [
      "Cadrage fonctionnel et feuille de route",
      "Architecture UX et maquettes clés",
      "Développement et intégrations",
      "Tests, mise en production et documentation",
      "Session de transfert et plan d’évolution"
    ],
    "process": [
      [
        "01",
        "Cadrage",
        "Nous clarifions les objectifs, utilisateurs et contraintes."
      ],
      [
        "02",
        "Conception",
        "Nous définissons l’expérience, les données et l’architecture."
      ],
      [
        "03",
        "Réalisation",
        "Nous construisons par lots validables et testables."
      ],
      [
        "04",
        "Livraison",
        "Nous déployons, documentons et préparons la suite."
      ]
    ],
    "faqs": [
      [
        "Combien de temps faut-il ?",
        "Le délai dépend du périmètre. Après cadrage, nous proposons un planning par étapes avec des livrables visibles."
      ],
      [
        "Pouvez-vous reprendre un projet existant ?",
        "Oui. Nous commençons par un audit technique et UX avant de recommander une reprise, une refonte ou une migration."
      ],
      [
        "La solution peut-elle évoluer ?",
        "Oui. L’architecture, les composants et les données sont pensés pour permettre des évolutions progressives."
      ],
      [
        "Comment démarre la collaboration ?",
        "Une première demande contextualisée permet de comprendre le besoin, puis nous organisons un échange de cadrage."
      ]
    ]
  },
  {
    "slug": "agent-ia-autonome",
    "pillarSlug": "intelligence-artificielle",
    "pillarTitle": "Intelligence artificielle",
    "title": "Agent IA autonome",
    "tagline": "Une solution agent ia autonome conçue autour de vos objectifs, de vos utilisateurs et de vos opérations.",
    "summary": "KORYXA conçoit votre projet de agent ia autonome de la stratégie à la mise en production, avec une expérience premium et une architecture durable.",
    "problems": [
      "Outils dispersés ou insuffisamment adaptés",
      "Parcours utilisateurs complexes ou peu performants",
      "Tâches manuelles qui ralentissent les équipes",
      "Manque de visibilité sur les résultats"
    ],
    "outcomes": [
      "Un système clair et facile à utiliser",
      "Des opérations plus rapides et mieux structurées",
      "Une solution sécurisée et évolutive",
      "Des indicateurs utiles pour décider"
    ],
    "features": [
      "Conception sur mesure de votre agent ia autonome",
      "Interface mobile-first et accessible",
      "Intégrations avec vos outils existants",
      "Gestion des rôles, données et automatisations",
      "Mesure des performances et amélioration continue",
      "Documentation et accompagnement à la prise en main"
    ],
    "audiences": [
      "PME et entreprises en croissance",
      "Indépendants et cabinets",
      "Startups et porteurs de projets",
      "Organisations et réseaux de partenaires"
    ],
    "deliverables": [
      "Cadrage fonctionnel et feuille de route",
      "Architecture UX et maquettes clés",
      "Développement et intégrations",
      "Tests, mise en production et documentation",
      "Session de transfert et plan d’évolution"
    ],
    "process": [
      [
        "01",
        "Cadrage",
        "Nous clarifions les objectifs, utilisateurs et contraintes."
      ],
      [
        "02",
        "Conception",
        "Nous définissons l’expérience, les données et l’architecture."
      ],
      [
        "03",
        "Réalisation",
        "Nous construisons par lots validables et testables."
      ],
      [
        "04",
        "Livraison",
        "Nous déployons, documentons et préparons la suite."
      ]
    ],
    "faqs": [
      [
        "Combien de temps faut-il ?",
        "Le délai dépend du périmètre. Après cadrage, nous proposons un planning par étapes avec des livrables visibles."
      ],
      [
        "Pouvez-vous reprendre un projet existant ?",
        "Oui. Nous commençons par un audit technique et UX avant de recommander une reprise, une refonte ou une migration."
      ],
      [
        "La solution peut-elle évoluer ?",
        "Oui. L’architecture, les composants et les données sont pensés pour permettre des évolutions progressives."
      ],
      [
        "Comment démarre la collaboration ?",
        "Une première demande contextualisée permet de comprendre le besoin, puis nous organisons un échange de cadrage."
      ]
    ]
  },
  {
    "slug": "rag-base-connaissances",
    "pillarSlug": "intelligence-artificielle",
    "pillarTitle": "Intelligence artificielle",
    "title": "RAG & base de connaissances",
    "tagline": "Une solution rag & base de connaissances conçue autour de vos objectifs, de vos utilisateurs et de vos opérations.",
    "summary": "KORYXA conçoit votre projet de rag & base de connaissances de la stratégie à la mise en production, avec une expérience premium et une architecture durable.",
    "problems": [
      "Outils dispersés ou insuffisamment adaptés",
      "Parcours utilisateurs complexes ou peu performants",
      "Tâches manuelles qui ralentissent les équipes",
      "Manque de visibilité sur les résultats"
    ],
    "outcomes": [
      "Un système clair et facile à utiliser",
      "Des opérations plus rapides et mieux structurées",
      "Une solution sécurisée et évolutive",
      "Des indicateurs utiles pour décider"
    ],
    "features": [
      "Conception sur mesure de votre rag & base de connaissances",
      "Interface mobile-first et accessible",
      "Intégrations avec vos outils existants",
      "Gestion des rôles, données et automatisations",
      "Mesure des performances et amélioration continue",
      "Documentation et accompagnement à la prise en main"
    ],
    "audiences": [
      "PME et entreprises en croissance",
      "Indépendants et cabinets",
      "Startups et porteurs de projets",
      "Organisations et réseaux de partenaires"
    ],
    "deliverables": [
      "Cadrage fonctionnel et feuille de route",
      "Architecture UX et maquettes clés",
      "Développement et intégrations",
      "Tests, mise en production et documentation",
      "Session de transfert et plan d’évolution"
    ],
    "process": [
      [
        "01",
        "Cadrage",
        "Nous clarifions les objectifs, utilisateurs et contraintes."
      ],
      [
        "02",
        "Conception",
        "Nous définissons l’expérience, les données et l’architecture."
      ],
      [
        "03",
        "Réalisation",
        "Nous construisons par lots validables et testables."
      ],
      [
        "04",
        "Livraison",
        "Nous déployons, documentons et préparons la suite."
      ]
    ],
    "faqs": [
      [
        "Combien de temps faut-il ?",
        "Le délai dépend du périmètre. Après cadrage, nous proposons un planning par étapes avec des livrables visibles."
      ],
      [
        "Pouvez-vous reprendre un projet existant ?",
        "Oui. Nous commençons par un audit technique et UX avant de recommander une reprise, une refonte ou une migration."
      ],
      [
        "La solution peut-elle évoluer ?",
        "Oui. L’architecture, les composants et les données sont pensés pour permettre des évolutions progressives."
      ],
      [
        "Comment démarre la collaboration ?",
        "Une première demande contextualisée permet de comprendre le besoin, puis nous organisons un échange de cadrage."
      ]
    ]
  },
  {
    "slug": "agent-vocal-ia",
    "pillarSlug": "intelligence-artificielle",
    "pillarTitle": "Intelligence artificielle",
    "title": "Agent vocal IA",
    "tagline": "Une solution agent vocal ia conçue autour de vos objectifs, de vos utilisateurs et de vos opérations.",
    "summary": "KORYXA conçoit votre projet de agent vocal ia de la stratégie à la mise en production, avec une expérience premium et une architecture durable.",
    "problems": [
      "Outils dispersés ou insuffisamment adaptés",
      "Parcours utilisateurs complexes ou peu performants",
      "Tâches manuelles qui ralentissent les équipes",
      "Manque de visibilité sur les résultats"
    ],
    "outcomes": [
      "Un système clair et facile à utiliser",
      "Des opérations plus rapides et mieux structurées",
      "Une solution sécurisée et évolutive",
      "Des indicateurs utiles pour décider"
    ],
    "features": [
      "Conception sur mesure de votre agent vocal ia",
      "Interface mobile-first et accessible",
      "Intégrations avec vos outils existants",
      "Gestion des rôles, données et automatisations",
      "Mesure des performances et amélioration continue",
      "Documentation et accompagnement à la prise en main"
    ],
    "audiences": [
      "PME et entreprises en croissance",
      "Indépendants et cabinets",
      "Startups et porteurs de projets",
      "Organisations et réseaux de partenaires"
    ],
    "deliverables": [
      "Cadrage fonctionnel et feuille de route",
      "Architecture UX et maquettes clés",
      "Développement et intégrations",
      "Tests, mise en production et documentation",
      "Session de transfert et plan d’évolution"
    ],
    "process": [
      [
        "01",
        "Cadrage",
        "Nous clarifions les objectifs, utilisateurs et contraintes."
      ],
      [
        "02",
        "Conception",
        "Nous définissons l’expérience, les données et l’architecture."
      ],
      [
        "03",
        "Réalisation",
        "Nous construisons par lots validables et testables."
      ],
      [
        "04",
        "Livraison",
        "Nous déployons, documentons et préparons la suite."
      ]
    ],
    "faqs": [
      [
        "Combien de temps faut-il ?",
        "Le délai dépend du périmètre. Après cadrage, nous proposons un planning par étapes avec des livrables visibles."
      ],
      [
        "Pouvez-vous reprendre un projet existant ?",
        "Oui. Nous commençons par un audit technique et UX avant de recommander une reprise, une refonte ou une migration."
      ],
      [
        "La solution peut-elle évoluer ?",
        "Oui. L’architecture, les composants et les données sont pensés pour permettre des évolutions progressives."
      ],
      [
        "Comment démarre la collaboration ?",
        "Une première demande contextualisée permet de comprendre le besoin, puis nous organisons un échange de cadrage."
      ]
    ]
  },
  {
    "slug": "automatisation-processus",
    "pillarSlug": "automatisation-integrations",
    "pillarTitle": "Automatisation & Intégrations",
    "title": "Automatisation des processus",
    "tagline": "Une solution automatisation des processus conçue autour de vos objectifs, de vos utilisateurs et de vos opérations.",
    "summary": "KORYXA conçoit votre projet de automatisation des processus de la stratégie à la mise en production, avec une expérience premium et une architecture durable.",
    "problems": [
      "Outils dispersés ou insuffisamment adaptés",
      "Parcours utilisateurs complexes ou peu performants",
      "Tâches manuelles qui ralentissent les équipes",
      "Manque de visibilité sur les résultats"
    ],
    "outcomes": [
      "Un système clair et facile à utiliser",
      "Des opérations plus rapides et mieux structurées",
      "Une solution sécurisée et évolutive",
      "Des indicateurs utiles pour décider"
    ],
    "features": [
      "Conception sur mesure de votre automatisation des processus",
      "Interface mobile-first et accessible",
      "Intégrations avec vos outils existants",
      "Gestion des rôles, données et automatisations",
      "Mesure des performances et amélioration continue",
      "Documentation et accompagnement à la prise en main"
    ],
    "audiences": [
      "PME et entreprises en croissance",
      "Indépendants et cabinets",
      "Startups et porteurs de projets",
      "Organisations et réseaux de partenaires"
    ],
    "deliverables": [
      "Cadrage fonctionnel et feuille de route",
      "Architecture UX et maquettes clés",
      "Développement et intégrations",
      "Tests, mise en production et documentation",
      "Session de transfert et plan d’évolution"
    ],
    "process": [
      [
        "01",
        "Cadrage",
        "Nous clarifions les objectifs, utilisateurs et contraintes."
      ],
      [
        "02",
        "Conception",
        "Nous définissons l’expérience, les données et l’architecture."
      ],
      [
        "03",
        "Réalisation",
        "Nous construisons par lots validables et testables."
      ],
      [
        "04",
        "Livraison",
        "Nous déployons, documentons et préparons la suite."
      ]
    ],
    "faqs": [
      [
        "Combien de temps faut-il ?",
        "Le délai dépend du périmètre. Après cadrage, nous proposons un planning par étapes avec des livrables visibles."
      ],
      [
        "Pouvez-vous reprendre un projet existant ?",
        "Oui. Nous commençons par un audit technique et UX avant de recommander une reprise, une refonte ou une migration."
      ],
      [
        "La solution peut-elle évoluer ?",
        "Oui. L’architecture, les composants et les données sont pensés pour permettre des évolutions progressives."
      ],
      [
        "Comment démarre la collaboration ?",
        "Une première demande contextualisée permet de comprendre le besoin, puis nous organisons un échange de cadrage."
      ]
    ]
  },
  {
    "slug": "integration-crm-erp",
    "pillarSlug": "automatisation-integrations",
    "pillarTitle": "Automatisation & Intégrations",
    "title": "Intégration CRM & ERP",
    "tagline": "Une solution intégration crm & erp conçue autour de vos objectifs, de vos utilisateurs et de vos opérations.",
    "summary": "KORYXA conçoit votre projet de intégration crm & erp de la stratégie à la mise en production, avec une expérience premium et une architecture durable.",
    "problems": [
      "Outils dispersés ou insuffisamment adaptés",
      "Parcours utilisateurs complexes ou peu performants",
      "Tâches manuelles qui ralentissent les équipes",
      "Manque de visibilité sur les résultats"
    ],
    "outcomes": [
      "Un système clair et facile à utiliser",
      "Des opérations plus rapides et mieux structurées",
      "Une solution sécurisée et évolutive",
      "Des indicateurs utiles pour décider"
    ],
    "features": [
      "Conception sur mesure de votre intégration crm & erp",
      "Interface mobile-first et accessible",
      "Intégrations avec vos outils existants",
      "Gestion des rôles, données et automatisations",
      "Mesure des performances et amélioration continue",
      "Documentation et accompagnement à la prise en main"
    ],
    "audiences": [
      "PME et entreprises en croissance",
      "Indépendants et cabinets",
      "Startups et porteurs de projets",
      "Organisations et réseaux de partenaires"
    ],
    "deliverables": [
      "Cadrage fonctionnel et feuille de route",
      "Architecture UX et maquettes clés",
      "Développement et intégrations",
      "Tests, mise en production et documentation",
      "Session de transfert et plan d’évolution"
    ],
    "process": [
      [
        "01",
        "Cadrage",
        "Nous clarifions les objectifs, utilisateurs et contraintes."
      ],
      [
        "02",
        "Conception",
        "Nous définissons l’expérience, les données et l’architecture."
      ],
      [
        "03",
        "Réalisation",
        "Nous construisons par lots validables et testables."
      ],
      [
        "04",
        "Livraison",
        "Nous déployons, documentons et préparons la suite."
      ]
    ],
    "faqs": [
      [
        "Combien de temps faut-il ?",
        "Le délai dépend du périmètre. Après cadrage, nous proposons un planning par étapes avec des livrables visibles."
      ],
      [
        "Pouvez-vous reprendre un projet existant ?",
        "Oui. Nous commençons par un audit technique et UX avant de recommander une reprise, une refonte ou une migration."
      ],
      [
        "La solution peut-elle évoluer ?",
        "Oui. L’architecture, les composants et les données sont pensés pour permettre des évolutions progressives."
      ],
      [
        "Comment démarre la collaboration ?",
        "Une première demande contextualisée permet de comprendre le besoin, puis nous organisons un échange de cadrage."
      ]
    ]
  },
  {
    "slug": "whatsapp-email-messaging",
    "pillarSlug": "automatisation-integrations",
    "pillarTitle": "Automatisation & Intégrations",
    "title": "WhatsApp, email & messaging",
    "tagline": "Une solution whatsapp, email & messaging conçue autour de vos objectifs, de vos utilisateurs et de vos opérations.",
    "summary": "KORYXA conçoit votre projet de whatsapp, email & messaging de la stratégie à la mise en production, avec une expérience premium et une architecture durable.",
    "problems": [
      "Outils dispersés ou insuffisamment adaptés",
      "Parcours utilisateurs complexes ou peu performants",
      "Tâches manuelles qui ralentissent les équipes",
      "Manque de visibilité sur les résultats"
    ],
    "outcomes": [
      "Un système clair et facile à utiliser",
      "Des opérations plus rapides et mieux structurées",
      "Une solution sécurisée et évolutive",
      "Des indicateurs utiles pour décider"
    ],
    "features": [
      "Conception sur mesure de votre whatsapp, email & messaging",
      "Interface mobile-first et accessible",
      "Intégrations avec vos outils existants",
      "Gestion des rôles, données et automatisations",
      "Mesure des performances et amélioration continue",
      "Documentation et accompagnement à la prise en main"
    ],
    "audiences": [
      "PME et entreprises en croissance",
      "Indépendants et cabinets",
      "Startups et porteurs de projets",
      "Organisations et réseaux de partenaires"
    ],
    "deliverables": [
      "Cadrage fonctionnel et feuille de route",
      "Architecture UX et maquettes clés",
      "Développement et intégrations",
      "Tests, mise en production et documentation",
      "Session de transfert et plan d’évolution"
    ],
    "process": [
      [
        "01",
        "Cadrage",
        "Nous clarifions les objectifs, utilisateurs et contraintes."
      ],
      [
        "02",
        "Conception",
        "Nous définissons l’expérience, les données et l’architecture."
      ],
      [
        "03",
        "Réalisation",
        "Nous construisons par lots validables et testables."
      ],
      [
        "04",
        "Livraison",
        "Nous déployons, documentons et préparons la suite."
      ]
    ],
    "faqs": [
      [
        "Combien de temps faut-il ?",
        "Le délai dépend du périmètre. Après cadrage, nous proposons un planning par étapes avec des livrables visibles."
      ],
      [
        "Pouvez-vous reprendre un projet existant ?",
        "Oui. Nous commençons par un audit technique et UX avant de recommander une reprise, une refonte ou une migration."
      ],
      [
        "La solution peut-elle évoluer ?",
        "Oui. L’architecture, les composants et les données sont pensés pour permettre des évolutions progressives."
      ],
      [
        "Comment démarre la collaboration ?",
        "Une première demande contextualisée permet de comprendre le besoin, puis nous organisons un échange de cadrage."
      ]
    ]
  },
  {
    "slug": "connecteurs-api-webhooks",
    "pillarSlug": "automatisation-integrations",
    "pillarTitle": "Automatisation & Intégrations",
    "title": "Connecteurs API & webhooks",
    "tagline": "Une solution connecteurs api & webhooks conçue autour de vos objectifs, de vos utilisateurs et de vos opérations.",
    "summary": "KORYXA conçoit votre projet de connecteurs api & webhooks de la stratégie à la mise en production, avec une expérience premium et une architecture durable.",
    "problems": [
      "Outils dispersés ou insuffisamment adaptés",
      "Parcours utilisateurs complexes ou peu performants",
      "Tâches manuelles qui ralentissent les équipes",
      "Manque de visibilité sur les résultats"
    ],
    "outcomes": [
      "Un système clair et facile à utiliser",
      "Des opérations plus rapides et mieux structurées",
      "Une solution sécurisée et évolutive",
      "Des indicateurs utiles pour décider"
    ],
    "features": [
      "Conception sur mesure de votre connecteurs api & webhooks",
      "Interface mobile-first et accessible",
      "Intégrations avec vos outils existants",
      "Gestion des rôles, données et automatisations",
      "Mesure des performances et amélioration continue",
      "Documentation et accompagnement à la prise en main"
    ],
    "audiences": [
      "PME et entreprises en croissance",
      "Indépendants et cabinets",
      "Startups et porteurs de projets",
      "Organisations et réseaux de partenaires"
    ],
    "deliverables": [
      "Cadrage fonctionnel et feuille de route",
      "Architecture UX et maquettes clés",
      "Développement et intégrations",
      "Tests, mise en production et documentation",
      "Session de transfert et plan d’évolution"
    ],
    "process": [
      [
        "01",
        "Cadrage",
        "Nous clarifions les objectifs, utilisateurs et contraintes."
      ],
      [
        "02",
        "Conception",
        "Nous définissons l’expérience, les données et l’architecture."
      ],
      [
        "03",
        "Réalisation",
        "Nous construisons par lots validables et testables."
      ],
      [
        "04",
        "Livraison",
        "Nous déployons, documentons et préparons la suite."
      ]
    ],
    "faqs": [
      [
        "Combien de temps faut-il ?",
        "Le délai dépend du périmètre. Après cadrage, nous proposons un planning par étapes avec des livrables visibles."
      ],
      [
        "Pouvez-vous reprendre un projet existant ?",
        "Oui. Nous commençons par un audit technique et UX avant de recommander une reprise, une refonte ou une migration."
      ],
      [
        "La solution peut-elle évoluer ?",
        "Oui. L’architecture, les composants et les données sont pensés pour permettre des évolutions progressives."
      ],
      [
        "Comment démarre la collaboration ?",
        "Une première demande contextualisée permet de comprendre le besoin, puis nous organisons un échange de cadrage."
      ]
    ]
  },
  {
    "slug": "devis-facturation-relances",
    "pillarSlug": "automatisation-integrations",
    "pillarTitle": "Automatisation & Intégrations",
    "title": "Devis, facturation & relances",
    "tagline": "Une solution devis, facturation & relances conçue autour de vos objectifs, de vos utilisateurs et de vos opérations.",
    "summary": "KORYXA conçoit votre projet de devis, facturation & relances de la stratégie à la mise en production, avec une expérience premium et une architecture durable.",
    "problems": [
      "Outils dispersés ou insuffisamment adaptés",
      "Parcours utilisateurs complexes ou peu performants",
      "Tâches manuelles qui ralentissent les équipes",
      "Manque de visibilité sur les résultats"
    ],
    "outcomes": [
      "Un système clair et facile à utiliser",
      "Des opérations plus rapides et mieux structurées",
      "Une solution sécurisée et évolutive",
      "Des indicateurs utiles pour décider"
    ],
    "features": [
      "Conception sur mesure de votre devis, facturation & relances",
      "Interface mobile-first et accessible",
      "Intégrations avec vos outils existants",
      "Gestion des rôles, données et automatisations",
      "Mesure des performances et amélioration continue",
      "Documentation et accompagnement à la prise en main"
    ],
    "audiences": [
      "PME et entreprises en croissance",
      "Indépendants et cabinets",
      "Startups et porteurs de projets",
      "Organisations et réseaux de partenaires"
    ],
    "deliverables": [
      "Cadrage fonctionnel et feuille de route",
      "Architecture UX et maquettes clés",
      "Développement et intégrations",
      "Tests, mise en production et documentation",
      "Session de transfert et plan d’évolution"
    ],
    "process": [
      [
        "01",
        "Cadrage",
        "Nous clarifions les objectifs, utilisateurs et contraintes."
      ],
      [
        "02",
        "Conception",
        "Nous définissons l’expérience, les données et l’architecture."
      ],
      [
        "03",
        "Réalisation",
        "Nous construisons par lots validables et testables."
      ],
      [
        "04",
        "Livraison",
        "Nous déployons, documentons et préparons la suite."
      ]
    ],
    "faqs": [
      [
        "Combien de temps faut-il ?",
        "Le délai dépend du périmètre. Après cadrage, nous proposons un planning par étapes avec des livrables visibles."
      ],
      [
        "Pouvez-vous reprendre un projet existant ?",
        "Oui. Nous commençons par un audit technique et UX avant de recommander une reprise, une refonte ou une migration."
      ],
      [
        "La solution peut-elle évoluer ?",
        "Oui. L’architecture, les composants et les données sont pensés pour permettre des évolutions progressives."
      ],
      [
        "Comment démarre la collaboration ?",
        "Une première demande contextualisée permet de comprendre le besoin, puis nous organisons un échange de cadrage."
      ]
    ]
  },
  {
    "slug": "dashboard-business-intelligence",
    "pillarSlug": "data-infrastructure",
    "pillarTitle": "Data & Infrastructure",
    "title": "Dashboard & business intelligence",
    "tagline": "Une solution dashboard & business intelligence conçue autour de vos objectifs, de vos utilisateurs et de vos opérations.",
    "summary": "KORYXA conçoit votre projet de dashboard & business intelligence de la stratégie à la mise en production, avec une expérience premium et une architecture durable.",
    "problems": [
      "Outils dispersés ou insuffisamment adaptés",
      "Parcours utilisateurs complexes ou peu performants",
      "Tâches manuelles qui ralentissent les équipes",
      "Manque de visibilité sur les résultats"
    ],
    "outcomes": [
      "Un système clair et facile à utiliser",
      "Des opérations plus rapides et mieux structurées",
      "Une solution sécurisée et évolutive",
      "Des indicateurs utiles pour décider"
    ],
    "features": [
      "Conception sur mesure de votre dashboard & business intelligence",
      "Interface mobile-first et accessible",
      "Intégrations avec vos outils existants",
      "Gestion des rôles, données et automatisations",
      "Mesure des performances et amélioration continue",
      "Documentation et accompagnement à la prise en main"
    ],
    "audiences": [
      "PME et entreprises en croissance",
      "Indépendants et cabinets",
      "Startups et porteurs de projets",
      "Organisations et réseaux de partenaires"
    ],
    "deliverables": [
      "Cadrage fonctionnel et feuille de route",
      "Architecture UX et maquettes clés",
      "Développement et intégrations",
      "Tests, mise en production et documentation",
      "Session de transfert et plan d’évolution"
    ],
    "process": [
      [
        "01",
        "Cadrage",
        "Nous clarifions les objectifs, utilisateurs et contraintes."
      ],
      [
        "02",
        "Conception",
        "Nous définissons l’expérience, les données et l’architecture."
      ],
      [
        "03",
        "Réalisation",
        "Nous construisons par lots validables et testables."
      ],
      [
        "04",
        "Livraison",
        "Nous déployons, documentons et préparons la suite."
      ]
    ],
    "faqs": [
      [
        "Combien de temps faut-il ?",
        "Le délai dépend du périmètre. Après cadrage, nous proposons un planning par étapes avec des livrables visibles."
      ],
      [
        "Pouvez-vous reprendre un projet existant ?",
        "Oui. Nous commençons par un audit technique et UX avant de recommander une reprise, une refonte ou une migration."
      ],
      [
        "La solution peut-elle évoluer ?",
        "Oui. L’architecture, les composants et les données sont pensés pour permettre des évolutions progressives."
      ],
      [
        "Comment démarre la collaboration ?",
        "Une première demande contextualisée permet de comprendre le besoin, puis nous organisons un échange de cadrage."
      ]
    ]
  },
  {
    "slug": "centralisation-qualite-donnees",
    "pillarSlug": "data-infrastructure",
    "pillarTitle": "Data & Infrastructure",
    "title": "Centralisation & qualité des données",
    "tagline": "Une solution centralisation & qualité des données conçue autour de vos objectifs, de vos utilisateurs et de vos opérations.",
    "summary": "KORYXA conçoit votre projet de centralisation & qualité des données de la stratégie à la mise en production, avec une expérience premium et une architecture durable.",
    "problems": [
      "Outils dispersés ou insuffisamment adaptés",
      "Parcours utilisateurs complexes ou peu performants",
      "Tâches manuelles qui ralentissent les équipes",
      "Manque de visibilité sur les résultats"
    ],
    "outcomes": [
      "Un système clair et facile à utiliser",
      "Des opérations plus rapides et mieux structurées",
      "Une solution sécurisée et évolutive",
      "Des indicateurs utiles pour décider"
    ],
    "features": [
      "Conception sur mesure de votre centralisation & qualité des données",
      "Interface mobile-first et accessible",
      "Intégrations avec vos outils existants",
      "Gestion des rôles, données et automatisations",
      "Mesure des performances et amélioration continue",
      "Documentation et accompagnement à la prise en main"
    ],
    "audiences": [
      "PME et entreprises en croissance",
      "Indépendants et cabinets",
      "Startups et porteurs de projets",
      "Organisations et réseaux de partenaires"
    ],
    "deliverables": [
      "Cadrage fonctionnel et feuille de route",
      "Architecture UX et maquettes clés",
      "Développement et intégrations",
      "Tests, mise en production et documentation",
      "Session de transfert et plan d’évolution"
    ],
    "process": [
      [
        "01",
        "Cadrage",
        "Nous clarifions les objectifs, utilisateurs et contraintes."
      ],
      [
        "02",
        "Conception",
        "Nous définissons l’expérience, les données et l’architecture."
      ],
      [
        "03",
        "Réalisation",
        "Nous construisons par lots validables et testables."
      ],
      [
        "04",
        "Livraison",
        "Nous déployons, documentons et préparons la suite."
      ]
    ],
    "faqs": [
      [
        "Combien de temps faut-il ?",
        "Le délai dépend du périmètre. Après cadrage, nous proposons un planning par étapes avec des livrables visibles."
      ],
      [
        "Pouvez-vous reprendre un projet existant ?",
        "Oui. Nous commençons par un audit technique et UX avant de recommander une reprise, une refonte ou une migration."
      ],
      [
        "La solution peut-elle évoluer ?",
        "Oui. L’architecture, les composants et les données sont pensés pour permettre des évolutions progressives."
      ],
      [
        "Comment démarre la collaboration ?",
        "Une première demande contextualisée permet de comprendre le besoin, puis nous organisons un échange de cadrage."
      ]
    ]
  },
  {
    "slug": "cloud-devops-deploiement",
    "pillarSlug": "data-infrastructure",
    "pillarTitle": "Data & Infrastructure",
    "title": "Cloud, DevOps & déploiement",
    "tagline": "Une solution cloud, devops & déploiement conçue autour de vos objectifs, de vos utilisateurs et de vos opérations.",
    "summary": "KORYXA conçoit votre projet de cloud, devops & déploiement de la stratégie à la mise en production, avec une expérience premium et une architecture durable.",
    "problems": [
      "Outils dispersés ou insuffisamment adaptés",
      "Parcours utilisateurs complexes ou peu performants",
      "Tâches manuelles qui ralentissent les équipes",
      "Manque de visibilité sur les résultats"
    ],
    "outcomes": [
      "Un système clair et facile à utiliser",
      "Des opérations plus rapides et mieux structurées",
      "Une solution sécurisée et évolutive",
      "Des indicateurs utiles pour décider"
    ],
    "features": [
      "Conception sur mesure de votre cloud, devops & déploiement",
      "Interface mobile-first et accessible",
      "Intégrations avec vos outils existants",
      "Gestion des rôles, données et automatisations",
      "Mesure des performances et amélioration continue",
      "Documentation et accompagnement à la prise en main"
    ],
    "audiences": [
      "PME et entreprises en croissance",
      "Indépendants et cabinets",
      "Startups et porteurs de projets",
      "Organisations et réseaux de partenaires"
    ],
    "deliverables": [
      "Cadrage fonctionnel et feuille de route",
      "Architecture UX et maquettes clés",
      "Développement et intégrations",
      "Tests, mise en production et documentation",
      "Session de transfert et plan d’évolution"
    ],
    "process": [
      [
        "01",
        "Cadrage",
        "Nous clarifions les objectifs, utilisateurs et contraintes."
      ],
      [
        "02",
        "Conception",
        "Nous définissons l’expérience, les données et l’architecture."
      ],
      [
        "03",
        "Réalisation",
        "Nous construisons par lots validables et testables."
      ],
      [
        "04",
        "Livraison",
        "Nous déployons, documentons et préparons la suite."
      ]
    ],
    "faqs": [
      [
        "Combien de temps faut-il ?",
        "Le délai dépend du périmètre. Après cadrage, nous proposons un planning par étapes avec des livrables visibles."
      ],
      [
        "Pouvez-vous reprendre un projet existant ?",
        "Oui. Nous commençons par un audit technique et UX avant de recommander une reprise, une refonte ou une migration."
      ],
      [
        "La solution peut-elle évoluer ?",
        "Oui. L’architecture, les composants et les données sont pensés pour permettre des évolutions progressives."
      ],
      [
        "Comment démarre la collaboration ?",
        "Une première demande contextualisée permet de comprendre le besoin, puis nous organisons un échange de cadrage."
      ]
    ]
  },
  {
    "slug": "securite-sauvegardes",
    "pillarSlug": "data-infrastructure",
    "pillarTitle": "Data & Infrastructure",
    "title": "Sécurité & sauvegardes",
    "tagline": "Une solution sécurité & sauvegardes conçue autour de vos objectifs, de vos utilisateurs et de vos opérations.",
    "summary": "KORYXA conçoit votre projet de sécurité & sauvegardes de la stratégie à la mise en production, avec une expérience premium et une architecture durable.",
    "problems": [
      "Outils dispersés ou insuffisamment adaptés",
      "Parcours utilisateurs complexes ou peu performants",
      "Tâches manuelles qui ralentissent les équipes",
      "Manque de visibilité sur les résultats"
    ],
    "outcomes": [
      "Un système clair et facile à utiliser",
      "Des opérations plus rapides et mieux structurées",
      "Une solution sécurisée et évolutive",
      "Des indicateurs utiles pour décider"
    ],
    "features": [
      "Conception sur mesure de votre sécurité & sauvegardes",
      "Interface mobile-first et accessible",
      "Intégrations avec vos outils existants",
      "Gestion des rôles, données et automatisations",
      "Mesure des performances et amélioration continue",
      "Documentation et accompagnement à la prise en main"
    ],
    "audiences": [
      "PME et entreprises en croissance",
      "Indépendants et cabinets",
      "Startups et porteurs de projets",
      "Organisations et réseaux de partenaires"
    ],
    "deliverables": [
      "Cadrage fonctionnel et feuille de route",
      "Architecture UX et maquettes clés",
      "Développement et intégrations",
      "Tests, mise en production et documentation",
      "Session de transfert et plan d’évolution"
    ],
    "process": [
      [
        "01",
        "Cadrage",
        "Nous clarifions les objectifs, utilisateurs et contraintes."
      ],
      [
        "02",
        "Conception",
        "Nous définissons l’expérience, les données et l’architecture."
      ],
      [
        "03",
        "Réalisation",
        "Nous construisons par lots validables et testables."
      ],
      [
        "04",
        "Livraison",
        "Nous déployons, documentons et préparons la suite."
      ]
    ],
    "faqs": [
      [
        "Combien de temps faut-il ?",
        "Le délai dépend du périmètre. Après cadrage, nous proposons un planning par étapes avec des livrables visibles."
      ],
      [
        "Pouvez-vous reprendre un projet existant ?",
        "Oui. Nous commençons par un audit technique et UX avant de recommander une reprise, une refonte ou une migration."
      ],
      [
        "La solution peut-elle évoluer ?",
        "Oui. L’architecture, les composants et les données sont pensés pour permettre des évolutions progressives."
      ],
      [
        "Comment démarre la collaboration ?",
        "Une première demande contextualisée permet de comprendre le besoin, puis nous organisons un échange de cadrage."
      ]
    ]
  },
  {
    "slug": "api-architecture-backend",
    "pillarSlug": "data-infrastructure",
    "pillarTitle": "Data & Infrastructure",
    "title": "API & architecture backend",
    "tagline": "Une solution api & architecture backend conçue autour de vos objectifs, de vos utilisateurs et de vos opérations.",
    "summary": "KORYXA conçoit votre projet de api & architecture backend de la stratégie à la mise en production, avec une expérience premium et une architecture durable.",
    "problems": [
      "Outils dispersés ou insuffisamment adaptés",
      "Parcours utilisateurs complexes ou peu performants",
      "Tâches manuelles qui ralentissent les équipes",
      "Manque de visibilité sur les résultats"
    ],
    "outcomes": [
      "Un système clair et facile à utiliser",
      "Des opérations plus rapides et mieux structurées",
      "Une solution sécurisée et évolutive",
      "Des indicateurs utiles pour décider"
    ],
    "features": [
      "Conception sur mesure de votre api & architecture backend",
      "Interface mobile-first et accessible",
      "Intégrations avec vos outils existants",
      "Gestion des rôles, données et automatisations",
      "Mesure des performances et amélioration continue",
      "Documentation et accompagnement à la prise en main"
    ],
    "audiences": [
      "PME et entreprises en croissance",
      "Indépendants et cabinets",
      "Startups et porteurs de projets",
      "Organisations et réseaux de partenaires"
    ],
    "deliverables": [
      "Cadrage fonctionnel et feuille de route",
      "Architecture UX et maquettes clés",
      "Développement et intégrations",
      "Tests, mise en production et documentation",
      "Session de transfert et plan d’évolution"
    ],
    "process": [
      [
        "01",
        "Cadrage",
        "Nous clarifions les objectifs, utilisateurs et contraintes."
      ],
      [
        "02",
        "Conception",
        "Nous définissons l’expérience, les données et l’architecture."
      ],
      [
        "03",
        "Réalisation",
        "Nous construisons par lots validables et testables."
      ],
      [
        "04",
        "Livraison",
        "Nous déployons, documentons et préparons la suite."
      ]
    ],
    "faqs": [
      [
        "Combien de temps faut-il ?",
        "Le délai dépend du périmètre. Après cadrage, nous proposons un planning par étapes avec des livrables visibles."
      ],
      [
        "Pouvez-vous reprendre un projet existant ?",
        "Oui. Nous commençons par un audit technique et UX avant de recommander une reprise, une refonte ou une migration."
      ],
      [
        "La solution peut-elle évoluer ?",
        "Oui. L’architecture, les composants et les données sont pensés pour permettre des évolutions progressives."
      ],
      [
        "Comment démarre la collaboration ?",
        "Une première demande contextualisée permet de comprendre le besoin, puis nous organisons un échange de cadrage."
      ]
    ]
  },
  {
    "slug": "audit-strategie-numerique",
    "pillarSlug": "conseil-maintenance-formation",
    "pillarTitle": "Conseil, maintenance & formation",
    "title": "Audit & stratégie numérique",
    "tagline": "Une solution audit & stratégie numérique conçue autour de vos objectifs, de vos utilisateurs et de vos opérations.",
    "summary": "KORYXA conçoit votre projet de audit & stratégie numérique de la stratégie à la mise en production, avec une expérience premium et une architecture durable.",
    "problems": [
      "Outils dispersés ou insuffisamment adaptés",
      "Parcours utilisateurs complexes ou peu performants",
      "Tâches manuelles qui ralentissent les équipes",
      "Manque de visibilité sur les résultats"
    ],
    "outcomes": [
      "Un système clair et facile à utiliser",
      "Des opérations plus rapides et mieux structurées",
      "Une solution sécurisée et évolutive",
      "Des indicateurs utiles pour décider"
    ],
    "features": [
      "Conception sur mesure de votre audit & stratégie numérique",
      "Interface mobile-first et accessible",
      "Intégrations avec vos outils existants",
      "Gestion des rôles, données et automatisations",
      "Mesure des performances et amélioration continue",
      "Documentation et accompagnement à la prise en main"
    ],
    "audiences": [
      "PME et entreprises en croissance",
      "Indépendants et cabinets",
      "Startups et porteurs de projets",
      "Organisations et réseaux de partenaires"
    ],
    "deliverables": [
      "Cadrage fonctionnel et feuille de route",
      "Architecture UX et maquettes clés",
      "Développement et intégrations",
      "Tests, mise en production et documentation",
      "Session de transfert et plan d’évolution"
    ],
    "process": [
      [
        "01",
        "Cadrage",
        "Nous clarifions les objectifs, utilisateurs et contraintes."
      ],
      [
        "02",
        "Conception",
        "Nous définissons l’expérience, les données et l’architecture."
      ],
      [
        "03",
        "Réalisation",
        "Nous construisons par lots validables et testables."
      ],
      [
        "04",
        "Livraison",
        "Nous déployons, documentons et préparons la suite."
      ]
    ],
    "faqs": [
      [
        "Combien de temps faut-il ?",
        "Le délai dépend du périmètre. Après cadrage, nous proposons un planning par étapes avec des livrables visibles."
      ],
      [
        "Pouvez-vous reprendre un projet existant ?",
        "Oui. Nous commençons par un audit technique et UX avant de recommander une reprise, une refonte ou une migration."
      ],
      [
        "La solution peut-elle évoluer ?",
        "Oui. L’architecture, les composants et les données sont pensés pour permettre des évolutions progressives."
      ],
      [
        "Comment démarre la collaboration ?",
        "Une première demande contextualisée permet de comprendre le besoin, puis nous organisons un échange de cadrage."
      ]
    ]
  },
  {
    "slug": "audit-ia-feuille-de-route",
    "pillarSlug": "conseil-maintenance-formation",
    "pillarTitle": "Conseil, maintenance & formation",
    "title": "Audit IA & feuille de route",
    "tagline": "Une solution audit ia & feuille de route conçue autour de vos objectifs, de vos utilisateurs et de vos opérations.",
    "summary": "KORYXA conçoit votre projet de audit ia & feuille de route de la stratégie à la mise en production, avec une expérience premium et une architecture durable.",
    "problems": [
      "Outils dispersés ou insuffisamment adaptés",
      "Parcours utilisateurs complexes ou peu performants",
      "Tâches manuelles qui ralentissent les équipes",
      "Manque de visibilité sur les résultats"
    ],
    "outcomes": [
      "Un système clair et facile à utiliser",
      "Des opérations plus rapides et mieux structurées",
      "Une solution sécurisée et évolutive",
      "Des indicateurs utiles pour décider"
    ],
    "features": [
      "Conception sur mesure de votre audit ia & feuille de route",
      "Interface mobile-first et accessible",
      "Intégrations avec vos outils existants",
      "Gestion des rôles, données et automatisations",
      "Mesure des performances et amélioration continue",
      "Documentation et accompagnement à la prise en main"
    ],
    "audiences": [
      "PME et entreprises en croissance",
      "Indépendants et cabinets",
      "Startups et porteurs de projets",
      "Organisations et réseaux de partenaires"
    ],
    "deliverables": [
      "Cadrage fonctionnel et feuille de route",
      "Architecture UX et maquettes clés",
      "Développement et intégrations",
      "Tests, mise en production et documentation",
      "Session de transfert et plan d’évolution"
    ],
    "process": [
      [
        "01",
        "Cadrage",
        "Nous clarifions les objectifs, utilisateurs et contraintes."
      ],
      [
        "02",
        "Conception",
        "Nous définissons l’expérience, les données et l’architecture."
      ],
      [
        "03",
        "Réalisation",
        "Nous construisons par lots validables et testables."
      ],
      [
        "04",
        "Livraison",
        "Nous déployons, documentons et préparons la suite."
      ]
    ],
    "faqs": [
      [
        "Combien de temps faut-il ?",
        "Le délai dépend du périmètre. Après cadrage, nous proposons un planning par étapes avec des livrables visibles."
      ],
      [
        "Pouvez-vous reprendre un projet existant ?",
        "Oui. Nous commençons par un audit technique et UX avant de recommander une reprise, une refonte ou une migration."
      ],
      [
        "La solution peut-elle évoluer ?",
        "Oui. L’architecture, les composants et les données sont pensés pour permettre des évolutions progressives."
      ],
      [
        "Comment démarre la collaboration ?",
        "Une première demande contextualisée permet de comprendre le besoin, puis nous organisons un échange de cadrage."
      ]
    ]
  },
  {
    "slug": "maintenance-support",
    "pillarSlug": "conseil-maintenance-formation",
    "pillarTitle": "Conseil, maintenance & formation",
    "title": "Maintenance & support",
    "tagline": "Une solution maintenance & support conçue autour de vos objectifs, de vos utilisateurs et de vos opérations.",
    "summary": "KORYXA conçoit votre projet de maintenance & support de la stratégie à la mise en production, avec une expérience premium et une architecture durable.",
    "problems": [
      "Outils dispersés ou insuffisamment adaptés",
      "Parcours utilisateurs complexes ou peu performants",
      "Tâches manuelles qui ralentissent les équipes",
      "Manque de visibilité sur les résultats"
    ],
    "outcomes": [
      "Un système clair et facile à utiliser",
      "Des opérations plus rapides et mieux structurées",
      "Une solution sécurisée et évolutive",
      "Des indicateurs utiles pour décider"
    ],
    "features": [
      "Conception sur mesure de votre maintenance & support",
      "Interface mobile-first et accessible",
      "Intégrations avec vos outils existants",
      "Gestion des rôles, données et automatisations",
      "Mesure des performances et amélioration continue",
      "Documentation et accompagnement à la prise en main"
    ],
    "audiences": [
      "PME et entreprises en croissance",
      "Indépendants et cabinets",
      "Startups et porteurs de projets",
      "Organisations et réseaux de partenaires"
    ],
    "deliverables": [
      "Cadrage fonctionnel et feuille de route",
      "Architecture UX et maquettes clés",
      "Développement et intégrations",
      "Tests, mise en production et documentation",
      "Session de transfert et plan d’évolution"
    ],
    "process": [
      [
        "01",
        "Cadrage",
        "Nous clarifions les objectifs, utilisateurs et contraintes."
      ],
      [
        "02",
        "Conception",
        "Nous définissons l’expérience, les données et l’architecture."
      ],
      [
        "03",
        "Réalisation",
        "Nous construisons par lots validables et testables."
      ],
      [
        "04",
        "Livraison",
        "Nous déployons, documentons et préparons la suite."
      ]
    ],
    "faqs": [
      [
        "Combien de temps faut-il ?",
        "Le délai dépend du périmètre. Après cadrage, nous proposons un planning par étapes avec des livrables visibles."
      ],
      [
        "Pouvez-vous reprendre un projet existant ?",
        "Oui. Nous commençons par un audit technique et UX avant de recommander une reprise, une refonte ou une migration."
      ],
      [
        "La solution peut-elle évoluer ?",
        "Oui. L’architecture, les composants et les données sont pensés pour permettre des évolutions progressives."
      ],
      [
        "Comment démarre la collaboration ?",
        "Une première demande contextualisée permet de comprendre le besoin, puis nous organisons un échange de cadrage."
      ]
    ]
  },
  {
    "slug": "formation-ia-automatisation",
    "pillarSlug": "conseil-maintenance-formation",
    "pillarTitle": "Conseil, maintenance & formation",
    "title": "Formation IA & automatisation",
    "tagline": "Une solution formation ia & automatisation conçue autour de vos objectifs, de vos utilisateurs et de vos opérations.",
    "summary": "KORYXA conçoit votre projet de formation ia & automatisation de la stratégie à la mise en production, avec une expérience premium et une architecture durable.",
    "problems": [
      "Outils dispersés ou insuffisamment adaptés",
      "Parcours utilisateurs complexes ou peu performants",
      "Tâches manuelles qui ralentissent les équipes",
      "Manque de visibilité sur les résultats"
    ],
    "outcomes": [
      "Un système clair et facile à utiliser",
      "Des opérations plus rapides et mieux structurées",
      "Une solution sécurisée et évolutive",
      "Des indicateurs utiles pour décider"
    ],
    "features": [
      "Conception sur mesure de votre formation ia & automatisation",
      "Interface mobile-first et accessible",
      "Intégrations avec vos outils existants",
      "Gestion des rôles, données et automatisations",
      "Mesure des performances et amélioration continue",
      "Documentation et accompagnement à la prise en main"
    ],
    "audiences": [
      "PME et entreprises en croissance",
      "Indépendants et cabinets",
      "Startups et porteurs de projets",
      "Organisations et réseaux de partenaires"
    ],
    "deliverables": [
      "Cadrage fonctionnel et feuille de route",
      "Architecture UX et maquettes clés",
      "Développement et intégrations",
      "Tests, mise en production et documentation",
      "Session de transfert et plan d’évolution"
    ],
    "process": [
      [
        "01",
        "Cadrage",
        "Nous clarifions les objectifs, utilisateurs et contraintes."
      ],
      [
        "02",
        "Conception",
        "Nous définissons l’expérience, les données et l’architecture."
      ],
      [
        "03",
        "Réalisation",
        "Nous construisons par lots validables et testables."
      ],
      [
        "04",
        "Livraison",
        "Nous déployons, documentons et préparons la suite."
      ]
    ],
    "faqs": [
      [
        "Combien de temps faut-il ?",
        "Le délai dépend du périmètre. Après cadrage, nous proposons un planning par étapes avec des livrables visibles."
      ],
      [
        "Pouvez-vous reprendre un projet existant ?",
        "Oui. Nous commençons par un audit technique et UX avant de recommander une reprise, une refonte ou une migration."
      ],
      [
        "La solution peut-elle évoluer ?",
        "Oui. L’architecture, les composants et les données sont pensés pour permettre des évolutions progressives."
      ],
      [
        "Comment démarre la collaboration ?",
        "Une première demande contextualisée permet de comprendre le besoin, puis nous organisons un échange de cadrage."
      ]
    ]
  },
  {
    "slug": "accompagnement-produit-technique",
    "pillarSlug": "conseil-maintenance-formation",
    "pillarTitle": "Conseil, maintenance & formation",
    "title": "Accompagnement produit & technique",
    "tagline": "Une solution accompagnement produit & technique conçue autour de vos objectifs, de vos utilisateurs et de vos opérations.",
    "summary": "KORYXA conçoit votre projet de accompagnement produit & technique de la stratégie à la mise en production, avec une expérience premium et une architecture durable.",
    "problems": [
      "Outils dispersés ou insuffisamment adaptés",
      "Parcours utilisateurs complexes ou peu performants",
      "Tâches manuelles qui ralentissent les équipes",
      "Manque de visibilité sur les résultats"
    ],
    "outcomes": [
      "Un système clair et facile à utiliser",
      "Des opérations plus rapides et mieux structurées",
      "Une solution sécurisée et évolutive",
      "Des indicateurs utiles pour décider"
    ],
    "features": [
      "Conception sur mesure de votre accompagnement produit & technique",
      "Interface mobile-first et accessible",
      "Intégrations avec vos outils existants",
      "Gestion des rôles, données et automatisations",
      "Mesure des performances et amélioration continue",
      "Documentation et accompagnement à la prise en main"
    ],
    "audiences": [
      "PME et entreprises en croissance",
      "Indépendants et cabinets",
      "Startups et porteurs de projets",
      "Organisations et réseaux de partenaires"
    ],
    "deliverables": [
      "Cadrage fonctionnel et feuille de route",
      "Architecture UX et maquettes clés",
      "Développement et intégrations",
      "Tests, mise en production et documentation",
      "Session de transfert et plan d’évolution"
    ],
    "process": [
      [
        "01",
        "Cadrage",
        "Nous clarifions les objectifs, utilisateurs et contraintes."
      ],
      [
        "02",
        "Conception",
        "Nous définissons l’expérience, les données et l’architecture."
      ],
      [
        "03",
        "Réalisation",
        "Nous construisons par lots validables et testables."
      ],
      [
        "04",
        "Livraison",
        "Nous déployons, documentons et préparons la suite."
      ]
    ],
    "faqs": [
      [
        "Combien de temps faut-il ?",
        "Le délai dépend du périmètre. Après cadrage, nous proposons un planning par étapes avec des livrables visibles."
      ],
      [
        "Pouvez-vous reprendre un projet existant ?",
        "Oui. Nous commençons par un audit technique et UX avant de recommander une reprise, une refonte ou une migration."
      ],
      [
        "La solution peut-elle évoluer ?",
        "Oui. L’architecture, les composants et les données sont pensés pour permettre des évolutions progressives."
      ],
      [
        "Comment démarre la collaboration ?",
        "Une première demande contextualisée permet de comprendre le besoin, puis nous organisons un échange de cadrage."
      ]
    ]
  }
];
export const getPillar = (slug: string) => servicePillars.find((pillar) => pillar.slug === slug);
export const getService = (pillarSlug: string, serviceSlug: string) => serviceCatalog.find((service) => service.pillarSlug === pillarSlug && service.slug === serviceSlug);
export const getPillarServices = (pillarSlug: string) => serviceCatalog.filter((service) => service.pillarSlug === pillarSlug);
