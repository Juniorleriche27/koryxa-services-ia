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
    "tagline": "Un site qui présente clairement votre valeur, rassure vos prospects et transforme les visites en prises de contact.",
    "summary": "KORYXA conçoit des sites professionnels sur mesure pour les entreprises qui veulent inspirer confiance, mieux expliquer leur activité et générer des opportunités commerciales depuis mobile comme depuis ordinateur.",
    "problems": [
      "Votre entreprise paraît moins crédible que la qualité réelle de vos services",
      "Les visiteurs ne comprennent pas rapidement ce que vous proposez ni à qui vous vous adressez",
      "Votre site actuel est lent, daté, difficile à modifier ou peu lisible sur mobile",
      "Les demandes arrivent sans contexte, ou n’arrivent pas du tout",
      "Vos offres, réalisations et preuves de confiance sont dispersées sur plusieurs canaux"
    ],
    "outcomes": [
      "Une image professionnelle cohérente avec votre positionnement",
      "Un message compris en quelques secondes par vos visiteurs",
      "Un parcours clair vers l’appel, WhatsApp, la prise de rendez-vous ou le formulaire",
      "Un site rapide, accessible et parfaitement utilisable sur mobile",
      "Une base éditoriale et technique que votre entreprise peut faire évoluer"
    ],
    "features": [
      "Architecture de pages adaptée à votre activité et à vos cibles",
      "Accueil orienté valeur, preuves et conversion",
      "Pages services détaillées avec appels à l’action dédiés",
      "Présentation de l’entreprise, de l’équipe et des réalisations",
      "Formulaires qualifiants, boutons WhatsApp, téléphone ou rendez-vous",
      "Référencement technique de base et métadonnées sociales",
      "Performance mobile, accessibilité et sécurité essentielles",
      "Administration simple des contenus selon le besoin",
      "Connexion à vos outils de mesure, CRM ou messagerie"
    ],
    "audiences": [
      "PME qui veulent professionnaliser leur présence numérique",
      "Cabinets, consultants, agences et professions de service",
      "Entreprises locales qui dépendent des appels, rendez-vous ou demandes de devis",
      "Organisations qui lancent une nouvelle marque, activité ou implantation",
      "Structures qui ont dépassé les limites d’un site bricolé ou vieillissant"
    ],
    "deliverables": [
      "Atelier de cadrage sur l’activité, les cibles et les objectifs commerciaux",
      "Arborescence complète et parcours de conversion",
      "Direction visuelle et maquettes des pages prioritaires",
      "Développement responsive des pages validées",
      "Intégration des contenus fournis ou accompagnement à leur structuration",
      "Formulaires, appels à l’action et connexions convenues",
      "Optimisation performance, SEO technique et accessibilité de base",
      "Mise en production, documentation et prise en main"
    ],
    "process": [
      ["01", "Positionnement", "Nous clarifions votre activité, vos cibles, vos offres prioritaires et l’action attendue sur le site."],
      ["02", "Architecture & contenu", "Nous organisons les pages, les messages, les preuves et les parcours avant de dessiner l’interface."],
      ["03", "Design sur mesure", "Nous créons une direction visuelle fidèle à votre marque, d’abord pensée pour le mobile."],
      ["04", "Développement", "Nous intégrons les pages, les formulaires, les performances et les connexions nécessaires."],
      ["05", "Recette & lancement", "Nous testons les écrans, les liens, les formulaires et le référencement avant la mise en ligne."],
      ["06", "Transmission", "Nous vous remettons la documentation, les accès utiles et les recommandations d’évolution."]
    ],
    "faqs": [
      ["Combien de pages sont incluses ?", "Le nombre de pages dépend de votre activité et des parcours nécessaires. Nous le définissons après l’arborescence, sans ajouter des pages inutiles."],
      ["Pouvez-vous rédiger les textes du site ?", "Oui. Nous pouvons structurer, réécrire ou produire les contenus à partir d’entretiens et de documents existants. Ce besoin est évalué séparément."],
      ["Le site sera-t-il facile à modifier ?", "Oui, lorsque le projet nécessite une gestion régulière des contenus. Nous choisissons une administration adaptée à votre équipe et vous formons à son utilisation."],
      ["Le référencement Google est-il inclus ?", "Le socle technique, les métadonnées, la structure des titres, la performance et l’indexation sont prévus. Une stratégie SEO éditoriale continue constitue une prestation complémentaire."],
      ["Pouvez-vous connecter WhatsApp, un CRM ou un outil de rendez-vous ?", "Oui. Les connexions nécessaires sont définies au cadrage pour que les demandes arrivent directement dans votre processus commercial."],
      ["Quel délai faut-il prévoir ?", "Un site professionnel standard demande généralement plusieurs semaines. Le planning exact dépend du nombre de pages, des contenus, des validations et des intégrations."],
      ["Que se passe-t-il après la mise en ligne ?", "Nous pouvons assurer la maintenance, les sauvegardes, les mises à jour et les améliorations dans le cadre d’un accompagnement distinct."]
    ]
  },
  {
    "slug": "ecommerce-marketplace",
    "pillarSlug": "web-ecommerce",
    "pillarTitle": "Web & E-commerce",
    "title": "E-commerce & marketplace",
    "tagline": "Une expérience d’achat fluide, un back-office maîtrisable et une architecture prête à soutenir votre croissance.",
    "summary": "KORYXA conçoit des boutiques en ligne et marketplaces sur mesure, adaptées à vos produits, vos moyens de paiement, votre logistique, vos vendeurs et votre modèle économique.",
    "problems": [
      "Votre boutique actuelle ralentit la vente ou crée des abandons de panier",
      "Le catalogue, les variantes, les stocks et les commandes deviennent difficiles à gérer",
      "Les paiements ou moyens de livraison ne correspondent pas à vos marchés",
      "Vous manquez de visibilité sur les ventes, la marge et le comportement des clients",
      "Votre projet de marketplace nécessite des rôles vendeurs, commissions et validations",
      "Les outils existants ne couvrent pas vos règles métier ou vos intégrations"
    ],
    "outcomes": [
      "Un parcours d’achat clair du catalogue jusqu’au paiement",
      "Une gestion fiable des produits, stocks, commandes et clients",
      "Des paiements et modes de livraison adaptés à vos zones de vente",
      "Un espace administrateur réellement utilisable par vos équipes",
      "Des indicateurs commerciaux utiles pour piloter l’activité",
      "Une architecture capable d’évoluer vers plusieurs vendeurs, pays ou canaux"
    ],
    "features": [
      "Catalogue produits, catégories, variantes, attributs et médias",
      "Recherche, filtres, tri, recommandations et produits associés",
      "Panier, codes promotionnels, taxes et frais dynamiques",
      "Paiement en ligne, mobile money ou paiement à la livraison selon le marché",
      "Gestion des commandes, statuts, remboursements et factures",
      "Gestion des stocks, seuils d’alerte et disponibilité",
      "Comptes clients, adresses, historique et listes de souhaits",
      "Livraison, retrait, zones, transporteurs et suivi",
      "Back-office commercial avec statistiques et exports",
      "Marketplace multi-vendeurs, commissions, onboarding et validation si nécessaire",
      "Connexion CRM, ERP, comptabilité, logistique ou outils marketing",
      "Sécurité, performance mobile et optimisation du tunnel d’achat"
    ],
    "audiences": [
      "Commerçants et marques qui veulent vendre directement en ligne",
      "Entreprises avec un catalogue complexe ou plusieurs points de vente",
      "Grossistes et distributeurs avec des règles tarifaires spécifiques",
      "Porteurs de marketplaces verticales ou locales",
      "Organisations qui vendent des produits physiques, numériques ou abonnements",
      "Entreprises qui doivent connecter commerce, stock, livraison et finance"
    ],
    "deliverables": [
      "Cadrage du modèle économique, du catalogue et des opérations",
      "Cartographie du parcours client et des rôles administratifs",
      "Architecture fonctionnelle du catalogue, panier, paiement et livraison",
      "Direction visuelle et maquettes des écrans critiques",
      "Développement de la boutique ou marketplace responsive",
      "Configuration des paiements, taxes, promotions et règles de livraison",
      "Back-office de gestion adapté aux équipes",
      "Intégrations convenues avec les systèmes existants",
      "Tests du tunnel de commande, sécurité et performance",
      "Mise en production, documentation et formation opérationnelle"
    ],
    "process": [
      ["01", "Modèle commercial", "Nous clarifions ce qui est vendu, à qui, dans quelles zones et avec quelles règles de prix, commissions ou abonnements."],
      ["02", "Opérations", "Nous détaillons le catalogue, les stocks, les paiements, la livraison, les retours et les responsabilités internes."],
      ["03", "Parcours d’achat", "Nous concevons la recherche, la fiche produit, le panier et le paiement pour réduire les frictions."],
      ["04", "Back-office", "Nous définissons les écrans nécessaires pour gérer produits, commandes, clients, vendeurs et indicateurs."],
      ["05", "Construction", "Nous développons le commerce, les intégrations et les automatismes par lots testables."],
      ["06", "Recette métier", "Nous testons les scénarios réels : achat, échec de paiement, rupture, remboursement, livraison et litiges."],
      ["07", "Lancement", "Nous préparons les données, la formation des équipes, la surveillance et le plan d’amélioration après ouverture."]
    ],
    "faqs": [
      ["Boutique en ligne ou marketplace : quelle différence ?", "Une boutique vend généralement les produits d’une seule entreprise. Une marketplace accueille plusieurs vendeurs, avec des règles d’inscription, de commission, de validation et de paiement plus complexes."],
      ["Pouvez-vous intégrer Mobile Money et le paiement à la livraison ?", "Oui, selon les prestataires disponibles sur vos marchés. Nous validons les moyens de paiement, les contraintes techniques et les règles de confirmation au cadrage."],
      ["Comment gérez-vous les stocks et variantes ?", "Nous modélisons les produits, tailles, couleurs, unités, dépôts et seuils selon votre fonctionnement. Une connexion à un ERP ou outil de stock peut être ajoutée."],
      ["Peut-on gérer plusieurs pays et monnaies ?", "Oui. Cela implique de cadrer monnaies, taxes, langues, prix, paiements, transporteurs et obligations locales pour chaque zone."],
      ["Le site peut-il gérer des vendeurs indépendants ?", "Oui. Nous pouvons prévoir onboarding, validation, catalogue vendeur, commissions, commandes, reversements et suivi des performances."],
      ["Pouvez-vous reprendre une boutique existante ?", "Oui. Nous auditons les données, commandes, comptes clients, SEO et intégrations avant de définir une migration progressive et vérifiable."],
      ["Comment réduisez-vous les abandons de panier ?", "Nous travaillons la clarté des prix, la vitesse, la confiance, le mobile, le nombre d’étapes, les moyens de paiement et les messages d’erreur du tunnel."],
      ["Que se passe-t-il après le lancement ?", "Nous pouvons suivre les performances, corriger les incidents, améliorer le tunnel, ajouter des fonctionnalités et accompagner les opérations dans la durée."]
    ]
  },
  {
    "slug": "landing-page-conversion",
    "pillarSlug": "web-ecommerce",
    "pillarTitle": "Web & E-commerce",
    "title": "Landing page & conversion",
    "tagline": "Une page conçue pour une campagne, une audience et une action précise — sans distraction inutile.",
    "summary": "KORYXA conçoit des landing pages orientées conversion pour lancer une offre, capter des prospects, vendre un produit, remplir un événement ou tester rapidement un marché.",
    "problems": [
      "Votre trafic publicitaire arrive sur une page trop générale",
      "L’offre n’est pas comprise rapidement ou manque de preuves",
      "Les visiteurs hésitent au moment de remplir le formulaire ou d’acheter",
      "Vous ne savez pas précisément d’où viennent les conversions",
      "La page est lente sur mobile et fait perdre des campagnes payantes",
      "Vous lancez une offre sans disposer d’un support de validation rapide"
    ],
    "outcomes": [
      "Une proposition de valeur comprise en quelques secondes",
      "Un parcours focalisé sur une seule action principale",
      "Des preuves et réponses aux objections intégrées au bon moment",
      "Un formulaire ou tunnel réduit au strict nécessaire",
      "Un suivi fiable des sources, clics et conversions",
      "Une base prête pour tester les messages, offres et variantes"
    ],
    "features": [
      "Architecture de conversion adaptée à l’offre et à la source de trafic",
      "Hero avec promesse, bénéfice principal et appel à l’action",
      "Sections bénéfices, preuves, démonstration et objections",
      "Formulaire qualifiant ou paiement simplifié",
      "Témoignages, chiffres, garanties et éléments de confiance",
      "Version mobile prioritaire et chargement rapide",
      "Tracking des campagnes, événements et conversions",
      "Connexion CRM, email, calendrier, paiement ou automatisation",
      "Pages de confirmation et scénarios de suivi",
      "Préparation de variantes pour A/B testing si le volume le permet"
    ],
    "audiences": [
      "Équipes marketing qui lancent des campagnes payantes",
      "Entreprises qui testent une nouvelle offre ou un nouveau marché",
      "Organisateurs d’événements, formations ou webinaires",
      "Commerciaux qui veulent générer des demandes qualifiées",
      "Marques qui lancent un produit, une précommande ou une liste d’attente",
      "Structures qui veulent améliorer le rendement d’un trafic existant"
    ],
    "deliverables": [
      "Cadrage de l’offre, de l’audience et de l’action de conversion",
      "Analyse de la source de trafic et des objections principales",
      "Structure de page et hiérarchie des messages",
      "Rédaction ou optimisation des messages clés selon le périmètre",
      "Direction visuelle et maquette mobile/desktop",
      "Développement responsive de la landing page",
      "Formulaire, paiement ou prise de rendez-vous selon le besoin",
      "Tracking des événements et conversions convenus",
      "Page de confirmation et scénario post-conversion",
      "Recette, mise en ligne et recommandations d’optimisation"
    ],
    "process": [
      ["01", "Objectif de conversion", "Nous définissons l’unique action attendue : contact, inscription, achat, réservation ou candidature."],
      ["02", "Audience & trafic", "Nous clarifions qui arrive, depuis quel canal, avec quel niveau d’intention et quelles objections."],
      ["03", "Offre & message", "Nous structurons la promesse, les bénéfices, les preuves, l’urgence et les réponses aux hésitations."],
      ["04", "Prototype", "Nous dessinons le parcours mobile, le formulaire et les interactions avant développement."],
      ["05", "Production", "Nous développons une page rapide, accessible et connectée aux outils nécessaires."],
      ["06", "Mesure", "Nous configurons les événements utiles : clic CTA, début de formulaire, envoi, paiement ou réservation."],
      ["07", "Optimisation", "Après collecte de données suffisantes, nous améliorons les points de friction et testons les variantes pertinentes."]
    ],
    "faqs": [
      ["Quelle différence avec une page d’accueil ?", "Une landing page répond à une campagne et une action précises. Elle limite les distractions, adapte le message au trafic et mesure directement la conversion."],
      ["Pouvez-vous aussi rédiger le contenu ?", "Oui. Nous pouvons travailler la promesse, les bénéfices, les preuves, les objections et les appels à l’action à partir de votre offre et de vos données."],
      ["Faut-il une page différente pour chaque campagne ?", "Pas toujours. Une page peut couvrir plusieurs campagnes proches, mais des audiences ou promesses très différentes nécessitent souvent des variantes dédiées."],
      ["Pouvez-vous connecter le formulaire à notre CRM ?", "Oui. Nous pouvons transmettre les leads, déclencher des emails, créer des tâches commerciales ou enrichir un workflow existant."],
      ["Peut-on vendre directement depuis la landing page ?", "Oui, pour une offre simple. Nous cadrons paiement, facture, confirmation, conditions et suivi avant de choisir le tunnel approprié."],
      ["Quand faut-il faire un A/B test ?", "Lorsque le trafic est suffisant pour produire un résultat fiable. Sans volume, nous privilégions l’analyse qualitative et l’amélioration progressive."],
      ["Quels indicateurs faut-il suivre ?", "Selon l’objectif : taux de conversion, coût par lead, coût d’acquisition, taux de complétion, rendez-vous pris, ventes ou revenu par visite."],
      ["Combien de temps faut-il pour lancer une landing page ?", "Le délai dépend surtout de la maturité de l’offre, des contenus, des preuves et des intégrations. Une page simple peut être produite plus rapidement qu’un site complet."]
    ]
  },
  {
    "slug": "refonte-optimisation",
    "pillarSlug": "web-ecommerce",
    "pillarTitle": "Web & E-commerce",
    "title": "Refonte & optimisation",
    "tagline": "Moderniser sans perdre ce qui fonctionne déjà : trafic, contenus, référencement, données et habitudes métier.",
    "summary": "KORYXA accompagne la refonte de sites existants avec une approche fondée sur l’audit, la priorisation, la migration maîtrisée et l’amélioration mesurable de l’expérience, de la performance et de la conversion.",
    "problems": [
      "Le site paraît daté et affaiblit la crédibilité de l’entreprise",
      "La navigation, les contenus ou les formulaires sont devenus difficiles à utiliser",
      "Les performances mobiles dégradent l’expérience et le référencement",
      "Le site accumule des correctifs sans cohérence globale",
      "Les équipes craignent de perdre le trafic, les contenus ou les données pendant la refonte",
      "Personne ne sait quelles améliorations auront réellement le plus d’impact"
    ],
    "outcomes": [
      "Une vision claire de ce qu’il faut conserver, corriger, supprimer ou reconstruire",
      "Une expérience modernisée sans rupture inutile pour les utilisateurs",
      "Une migration préparée pour protéger les URLs, contenus et signaux SEO utiles",
      "Des performances et parcours prioritaires améliorés de manière mesurable",
      "Un socle technique plus stable, maintenable et évolutif",
      "Une feuille de route priorisée selon l’impact, le risque et l’effort"
    ],
    "features": [
      "Audit UX, UI, contenus, conversion et accessibilité",
      "Audit technique, performance, sécurité et maintenabilité",
      "Analyse SEO des pages, URLs, métadonnées et contenus existants",
      "Cartographie des parcours et points de friction",
      "Inventaire des contenus, intégrations et données à migrer",
      "Priorisation des améliorations par impact et complexité",
      "Nouvelle architecture de l’information et nouveaux parcours",
      "Refonte visuelle alignée avec la marque et les objectifs commerciaux",
      "Plan de redirections et stratégie de migration",
      "Recette comparative avant/après",
      "Suivi post-lancement et correction des écarts critiques"
    ],
    "audiences": [
      "Entreprises dont le site ne reflète plus le niveau réel de l’activité",
      "Équipes marketing limitées par un CMS ou une architecture vieillissante",
      "Organisations qui préparent un repositionnement ou une nouvelle identité",
      "Sites qui perdent du trafic, de la vitesse ou des conversions",
      "Structures qui doivent migrer sans interrompre leurs opérations",
      "Entreprises qui veulent améliorer progressivement avant une refonte complète"
    ],
    "deliverables": [
      "Audit consolidé UX, UI, SEO, performance, conversion et technique",
      "Inventaire des pages, contenus, données et intégrations existants",
      "Matrice conserver / corriger / supprimer / reconstruire",
      "Feuille de route priorisée avec risques et dépendances",
      "Nouvelle arborescence et parcours utilisateurs",
      "Direction visuelle et maquettes des écrans critiques",
      "Développement ou optimisation des lots validés",
      "Plan de migration, sauvegarde et redirections",
      "Recette fonctionnelle, responsive, SEO et performance",
      "Rapport de comparaison avant/après et suivi post-lancement"
    ],
    "process": [
      ["01", "Diagnostic", "Nous collectons les données disponibles, analysons le site et échangeons avec les équipes qui l’utilisent."],
      ["02", "Inventaire", "Nous listons pages, contenus, intégrations, formulaires, données et dépendances à protéger."],
      ["03", "Priorisation", "Nous classons les chantiers selon leur impact utilisateur, commercial, SEO et technique."],
      ["04", "Nouvelle expérience", "Nous redéfinissons l’architecture, les parcours et l’interface sans casser les usages utiles."],
      ["05", "Production progressive", "Nous construisons par lots testables pour limiter les risques et faciliter les validations."],
      ["06", "Migration", "Nous préparons sauvegardes, redirections, transferts de contenus, données et connexions."],
      ["07", "Recette comparative", "Nous comparons l’ancien et le nouveau sur les parcours, le SEO, les formulaires et les performances."],
      ["08", "Suivi post-lancement", "Nous surveillons les erreurs, redirections, conversions et signaux techniques après mise en ligne."]
    ],
    "faqs": [
      ["Faut-il tout refaire ?", "Non. Une refonte sérieuse commence par identifier ce qui fonctionne déjà. Certaines parties peuvent être conservées, optimisées ou migrées plutôt que reconstruites."],
      ["Comment éviter de perdre le référencement ?", "Nous préparons l’inventaire des URLs, les redirections, les métadonnées, les contenus prioritaires et les contrôles après lancement. Le risque ne disparaît jamais totalement, mais il peut être fortement réduit."],
      ["Pouvez-vous améliorer le site sans refonte complète ?", "Oui. Lorsque le socle le permet, nous pouvons prioriser des optimisations UX, performance, conversion ou contenu avant d’engager une reconstruction plus large."],
      ["Que devient le contenu existant ?", "Chaque contenu est évalué : conserver, réécrire, fusionner, archiver ou supprimer. La migration n’est pas un simple copier-coller."],
      ["Comment traitez-vous les intégrations existantes ?", "Nous recensons formulaires, CRM, paiements, analytics, outils métier et scripts avant de décider lesquels conserver, remplacer ou reconnecter."],
      ["Peut-on lancer la nouvelle version progressivement ?", "Oui, selon l’architecture. Une approche par lots ou par sections réduit parfois le risque, mais elle doit être compatible avec les dépendances techniques et SEO."],
      ["Comment mesurez-vous l’amélioration ?", "Nous comparons des indicateurs avant/après : vitesse, erreurs, complétion des parcours, conversion, visibilité SEO, stabilité et capacité des équipes à gérer le site."],
      ["Que se passe-t-il si un problème apparaît après le lancement ?", "Nous prévoyons une période de surveillance et de correction des écarts critiques. Les modalités dépendent du périmètre de maintenance retenu."]
    ]
  },
  {
    "slug": "reservation-portail-client",
    "pillarSlug": "web-ecommerce",
    "pillarTitle": "Web & E-commerce",
    "title": "Réservation & portail client",
    "tagline": "Un espace où vos clients réservent, paient, retrouvent leurs documents et suivent leurs demandes sans solliciter votre équipe à chaque étape.",
    "summary": "KORYXA conçoit des systèmes de réservation et portails clients adaptés à vos disponibilités, ressources, règles métier, paiements, rappels, documents et niveaux d’accès.",
    "problems": [
      "Les réservations sont gérées manuellement par téléphone, WhatsApp ou tableur",
      "Les disponibilités réelles sont difficiles à maintenir entre équipes, lieux et ressources",
      "Les annulations, reports et absences créent des pertes de temps ou de revenu",
      "Les clients demandent régulièrement les mêmes documents, statuts ou informations",
      "Les paiements, acomptes et confirmations ne sont pas reliés au parcours de réservation",
      "Les équipes manquent d’une vision commune sur les dossiers, rendez-vous et échanges"
    ],
    "outcomes": [
      "Un parcours de réservation disponible en continu sur mobile et ordinateur",
      "Des créneaux fiables calculés selon vos règles, ressources et capacités",
      "Des confirmations, rappels et changements de statut automatisés",
      "Un espace client sécurisé pour suivre, payer, déposer ou récupérer des documents",
      "Moins de tâches répétitives pour les équipes opérationnelles",
      "Une meilleure traçabilité des demandes, réservations et interactions"
    ],
    "features": [
      "Calendrier de disponibilités par service, ressource, lieu ou collaborateur",
      "Règles de durée, capacité, délai minimum, temps tampon et récurrence",
      "Réservation, report, annulation et liste d’attente",
      "Acompte, paiement complet, solde ou paiement sur place",
      "Emails, SMS ou WhatsApp de confirmation et de rappel",
      "Comptes clients avec historique, statuts et préférences",
      "Dépôt, validation et téléchargement de documents",
      "Formulaires préalables et collecte d’informations métier",
      "Back-office pour équipes, rôles et permissions",
      "Tableaux de bord sur réservations, occupation, annulations et revenus",
      "Connexion agenda, CRM, paiement, facturation ou outil métier",
      "Journal d’activité, sécurité des accès et protection des données"
    ],
    "audiences": [
      "Cabinets, centres de soins et professionnels sur rendez-vous",
      "Centres de formation, coachs et consultants",
      "Hôtels, espaces, salles et activités de loisirs",
      "Ateliers, services techniques et entreprises d’intervention",
      "Structures qui gèrent des dossiers clients et documents récurrents",
      "Organisations qui doivent coordonner plusieurs équipes, lieux ou ressources"
    ],
    "deliverables": [
      "Cadrage des parcours client, équipe et administrateur",
      "Modélisation des services, ressources, disponibilités et règles de réservation",
      "Architecture des comptes, rôles, statuts et permissions",
      "Maquettes des parcours réservation, paiement et portail client",
      "Développement responsive du système et du back-office",
      "Configuration des notifications, rappels et scénarios d’annulation",
      "Intégration des paiements et outils convenus",
      "Gestion sécurisée des documents et informations client",
      "Tests des conflits, reports, absences, paiements et droits d’accès",
      "Mise en production, documentation et formation des équipes"
    ],
    "process": [
      ["01", "Parcours métier", "Nous décrivons comment une demande devient une réservation, un rendez-vous ou un dossier client."],
      ["02", "Règles de disponibilité", "Nous modélisons horaires, ressources, capacités, délais, indisponibilités et exceptions."],
      ["03", "Comptes & permissions", "Nous définissons ce que voient et modifient clients, équipes, responsables et administrateurs."],
      ["04", "Paiement & engagement", "Nous cadrons acompte, solde, remboursement, annulation et conditions de réservation."],
      ["05", "Expérience utilisateur", "Nous concevons un parcours mobile simple pour réserver, payer, modifier et retrouver ses informations."],
      ["06", "Automatisations", "Nous configurons confirmations, rappels, relances, documents et mises à jour de statut."],
      ["07", "Construction & intégrations", "Nous développons le portail et connectons agendas, CRM, paiement ou outils métier."],
      ["08", "Recette opérationnelle", "Nous testons conflits de créneaux, droits, reports, annulations, paiements et notifications."],
      ["09", "Déploiement & adoption", "Nous formons les équipes, préparons les données et suivons les premiers usages."]
    ],
    "faqs": [
      ["Peut-on gérer plusieurs lieux ou collaborateurs ?", "Oui. Les disponibilités peuvent dépendre d’un lieu, d’une équipe, d’un équipement ou d’une combinaison de ressources."],
      ["Comment évitez-vous les doubles réservations ?", "Le moteur contrôle les ressources et contraintes avant confirmation. Les synchronisations externes sont également prises en compte lorsque cela est nécessaire."],
      ["Peut-on demander un acompte ?", "Oui. Nous pouvons prévoir acompte, paiement total, solde ultérieur, paiement sur place et règles d’annulation associées."],
      ["Les clients peuvent-ils modifier ou annuler eux-mêmes ?", "Oui, selon les délais et conditions que vous définissez. Certaines actions peuvent nécessiter une validation interne."],
      ["Que peut contenir le portail client ?", "Historique, prochaines réservations, factures, documents, messages, formulaires, statuts de dossier et actions autorisées."],
      ["Peut-on envoyer des rappels WhatsApp ou SMS ?", "Oui, selon les prestataires disponibles et les règles de consentement. Les canaux et coûts sont cadrés avant intégration."],
      ["Comment protégez-vous les documents et données clients ?", "Nous appliquons authentification, permissions, journalisation, chiffrement en transit et règles de conservation adaptées au contexte."],
      ["Peut-on connecter Google Calendar, Outlook ou un CRM ?", "Oui. Nous évaluons les APIs, les règles de synchronisation et les conflits possibles avant de choisir l’intégration."],
      ["Le portail peut-il évoluer vers une application ?", "Oui. Une architecture bien conçue peut ensuite alimenter une application mobile ou d’autres canaux sans refaire toute la logique métier."]
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
