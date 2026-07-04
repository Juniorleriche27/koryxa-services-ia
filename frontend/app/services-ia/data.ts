export type ServiceIaBlock = "revenu" | "productivite" | "digital";

export type ServiceIaItem = {
  slug: string;
  block: ServiceIaBlock;
  title: string;
  shortLabel: string;
  summary: string;
  outcomes: string[];
};

export type ServiceIaQuestionInput = "text" | "textarea" | "radio" | "checkbox" | "select";

export type ServiceIaQuestionOption = {
  value: string;
  label: string;
};

export type ServiceIaQuestion = {
  key: string;
  label: string;
  input: ServiceIaQuestionInput;
  required?: boolean;
  placeholder?: string;
  helper?: string;
  options?: ServiceIaQuestionOption[];
};

export type ServiceIaDetailContent = {
  heroTitle?: string;
  introduction: string[];
  scenarioTitle?: string;
  scenario: string[];
  scenarioHighlights?: string[];
  deliveryTitle?: string;
  delivery: string;
  deliverablesTitle?: string;
  deliverables?: string[];
  resultTitle?: string;
  result: string;
  audienceTitle?: string;
  audience?: string;
};

export const SERVICE_IA_BLOCKS: Array<{ id: ServiceIaBlock; title: string; subtitle: string }> = [
  {
    id: "revenu",
    title: "Bloc 1: Faites plus d'argent avec vos donnees",
    subtitle: "Pilotage, prediction, optimisation des marges.",
  },
  {
    id: "productivite",
    title: "Bloc 2: Travaillez moins, produisez plus",
    subtitle: "Automatisation, assistants IA, flux operationnels.",
  },
  {
    id: "digital",
    title: "Bloc 3: Presence digitale et systeme",
    subtitle: "Sites, apps, systeme integre et securite des donnees.",
  },
];

export const SERVICE_IA_ITEMS: ServiceIaItem[] = [
  {
    slug: "maitrisez-vos-chiffres",
    block: "revenu",
    shortLabel: "Pilotage business",
    title: "Maitrisez vos chiffres en temps reel",
    summary: "Tableaux de bord ventes, marges et stocks avec alertes utiles pour decider vite.",
    outcomes: ["Visibilite quotidienne des KPI", "Alertes automatiques", "Decision guidee par les faits"],
  },
  {
    slug: "vendez-plus-par-prediction",
    block: "revenu",
    shortLabel: "Prediction ventes",
    title: "Vendez plus en predisant ce qui marche",
    summary: "Prevoir la demande, identifier les clients a risque et optimiser votre offre.",
    outcomes: ["Forecast demande", "Segmentation clients", "Priorisation commerciale"],
  },
  {
    slug: "reduisez-vos-couts",
    block: "revenu",
    shortLabel: "Optimisation couts",
    title: "Reduisez vos couts, gardez les marges",
    summary: "Diagnostic des pertes et simulation de scenarios avant changement.",
    outcomes: ["Cartographie des pertes", "Plan d'economie 10-30%", "Simulation d'impact"],
  },
  {
    slug: "assistant-ia-metier",
    block: "productivite",
    shortLabel: "Assistant IA",
    title: "Un assistant IA qui execute avec vous",
    summary: "Assistant 24/7 pour support client, demandes internes et operations recurrentes.",
    outcomes: ["Reponse continue", "Gain de temps equipe", "Qualite de service stable"],
  },
  {
    slug: "robots-automatisation",
    block: "productivite",
    shortLabel: "Automatisation",
    title: "Des robots qui suppriment le travail mecanique",
    summary: "Automatisation des saisies, formulaires, controles et synchronisations.",
    outcomes: ["Moins d'erreurs humaines", "Taches repetitives eliminees", "Execution plus rapide"],
  },
  {
    slug: "optimisez-vos-process",
    block: "productivite",
    shortLabel: "Workflow",
    title: "Organisez votre flux pour aller plus vite",
    summary: "Reconfiguration des etapes metier pour enlever le gaspillage et accelerer les cycles.",
    outcomes: ["Delais reduits", "Roles clarifies", "Flux operationnel simplifie"],
  },
  {
    slug: "site-web-intelligent",
    block: "digital",
    shortLabel: "Web intelligent",
    title: "Site web intelligent",
    summary: "Presence digitale professionnelle pour vendre, informer et capter des leads 24/7.",
    outcomes: ["Site rapide et responsive", "Conversion amelioree", "Base technique evolutive"],
  },
  {
    slug: "application-mobile",
    block: "digital",
    shortLabel: "Mobile",
    title: "Application mobile",
    summary: "Application Android/iOS adaptee a vos usages metier, meme avec contraintes terrain.",
    outcomes: ["Usage partout", "Mode offline selon besoin", "Process metier mobile"],
  },
  {
    slug: "systeme-entreprise-integre",
    block: "digital",
    shortLabel: "Systeme integre",
    title: "Tout votre entreprise dans un seul systeme",
    summary: "Centralisation ventes, achats, stock, finance et pilotage dans un systeme unifie.",
    outcomes: ["Donnees unifiees", "Operations tracees", "Rapports centralises"],
  },
  {
    slug: "securite-sauvegarde-donnees",
    block: "digital",
    shortLabel: "Securite data",
    title: "Donnees protegees et toujours disponibles",
    summary: "Sauvegarde, securite d'acces, reprise et monitoring pour eviter les pertes critiques.",
    outcomes: ["Sauvegardes fiables", "Acces securise", "Continuite de service"],
  },
];

export const SERVICE_IA_MARKETING_POINTS: Array<{ label: string; value: string }> = [
  { label: "Offres executees", value: "10 services" },
  { label: "Delai de qualification", value: "72h" },
  { label: "Mode de delivery", value: "Equipe dediee" },
  { label: "Pilotage", value: "Transparence totale" },
];

export const SERVICE_IA_DETAIL_CONTENT: Record<string, ServiceIaDetailContent> = {
  "maitrisez-vos-chiffres": {
    heroTitle: "Pilotage Business — Maitrisez vos chiffres en temps reel",
    introduction: [
      "Beaucoup d'entreprises prennent encore leurs decisions a partir de cahiers, de fichiers Excel disperses, de messages WhatsApp ou de souvenirs approximatifs.",
      "Resultat : le dirigeant ne sait pas toujours combien il vend reellement, quels produits rapportent le plus, ou l'argent se perd, ni quelles decisions prendre rapidement.",
      "Avec le service Pilotage Business, KORYXA transforme vos donnees de vente, de stock, de marge et de depenses en tableaux de bord simples, lisibles et utiles. L'objectif n'est pas seulement d'afficher des chiffres, mais d'aider le dirigeant a decider vite et avec des preuves.",
    ],
    scenarioTitle: "Mise en situation",
    scenario: [
      "Une boutique vend des boissons, des produits alimentaires et des articles divers. Chaque soir, les ventes sont notees dans un cahier ou envoyees par WhatsApp.",
      "Le proprietaire pense que certains produits marchent bien, mais il ne sait pas precisement lesquels generent la meilleure marge. Il continue donc a acheter beaucoup de produits peu rentables, pendant que les produits les plus demandes sont souvent en rupture.",
      "KORYXA peut centraliser ces donnees, creer un tableau de bord et montrer clairement ce qui doit etre surveille chaque jour pour mieux piloter l'activite.",
    ],
    scenarioHighlights: [
      "Les produits les plus vendus",
      "Les produits les plus rentables",
      "Les periodes ou les ventes montent ou baissent",
      "Les ruptures frequentes",
      "Les depenses qui reduisent la marge",
      "Les alertes importantes a suivre",
    ],
    deliveryTitle: "Ce que KORYXA livre",
    delivery:
      "Un systeme de pilotage adapte a votre activite : tableau de bord, indicateurs cles, alertes, rapports simples et lecture claire de la performance.",
    deliverablesTitle: "Livrables",
    deliverables: [
      "Tableau de bord adapte a votre activite",
      "Indicateurs cles de vente, marge, stock et depenses",
      "Alertes utiles pour les decisions prioritaires",
      "Rapports simples et lisibles",
    ],
    resultTitle: "Resultat attendu",
    result:
      "Le dirigeant sait ou l'entreprise gagne, ou elle perd, quels produits renforcer, quels couts surveiller et quelles decisions prendre en priorite.",
    audienceTitle: "Pour qui",
    audience:
      "Commerces, distributeurs, PME, activites avec ventes, stock, marge ou suivi de depenses a piloter plus finement.",
  },
  "vendez-plus-par-prediction": {
    heroTitle: "Prediction Ventes — Vendez plus en anticipant la demande",
    introduction: [
      "Beaucoup d'entreprises vendent sans reellement prevoir. Elles reagissent au lieu d'anticiper. Resultat : ruptures de stock sur les produits qui marchent, surstock sur ceux qui ne partent pas, et pertes de chiffre d'affaires.",
      "Le service Prediction Ventes permet d'utiliser les donnees passees, comme les ventes, les periodes et les comportements clients, pour estimer ce qui va se passer demain, la semaine prochaine ou le mois prochain.",
      "L'objectif n'est pas de deviner parfaitement, mais de reduire fortement l'incertitude et de mieux preparer les decisions.",
    ],
    scenarioTitle: "Mise en situation",
    scenario: [
      "Un vendeur de boissons constate qu'en fin de semaine ou pendant certaines periodes, comme la chaleur, les fetes ou les evenements, la demande explose. Mais comme il n'anticipe pas, il tombe souvent en rupture au moment ou il pourrait vendre le plus.",
      "A l'inverse, il lui arrive d'acheter trop de produits qui ne se vendent pas rapidement, ce qui immobilise sa tresorerie.",
      "Avec KORYXA, ses donnees de vente sont analysees pour detecter des tendances utiles a la preparation des achats, du stock et des actions commerciales.",
    ],
    scenarioHighlights: [
      "Quels produits montent a certaines periodes",
      "Quels jours sont les plus forts",
      "Quels clients ou segments achetent le plus",
      "Quelles variations sont recurrentes",
      "Estimation des ventes a venir",
      "Recommandation de stock et priorisation des produits a pousser",
    ],
    deliveryTitle: "Ce que KORYXA fait",
    delivery:
      "KORYXA transforme vos donnees historiques en projections exploitables. Il ne s'agit pas seulement d'un graphique, mais d'un outil d'aide a la decision qui oriente vos achats, vos stocks et vos actions commerciales.",
    deliverablesTitle: "Livrables",
    deliverables: [
      "Previsions de ventes a court terme et moyen terme",
      "Recommandations de stock",
      "Segmentation simple des clients",
      "Alertes sur les risques de rupture ou de surstock",
    ],
    resultTitle: "Resultat attendu",
    result:
      "Moins de ruptures, moins de gaspillage, meilleure utilisation de la tresorerie et augmentation du chiffre d'affaires grace a une meilleure anticipation.",
    audienceTitle: "Pour qui",
    audience:
      "Commerces, distributeurs, PME, vendeurs en gros ou detail, et toute structure qui gere des produits ou des ventes regulieres.",
  },
  "reduisez-vos-couts": {
    heroTitle: "Optimisation Couts — Reduisez vos pertes, gardez vos marges",
    introduction: [
      "Beaucoup d'entreprises perdent de l'argent sans s'en rendre compte. Ce ne sont pas toujours de grosses erreurs, mais une accumulation de petites inefficacites : depenses inutiles, processus mal organises, pertes invisibles.",
      "Le service Optimisation Couts permet d'identifier ces pertes et de simuler des scenarios pour ameliorer la rentabilite sans forcement augmenter les ventes.",
    ],
    scenarioTitle: "Mise en situation",
    scenario: [
      "Une petite entreprise pense que son probleme est un manque de clients. Pourtant, en analysant ses donnees, on decouvre des depenses regulieres non controlees, des achats mal optimises, du gaspillage de produits et du temps perdu dans des taches inutiles.",
      "Avant meme de chercher a vendre plus, il est possible d'ameliorer la situation en reduisant ces pertes.",
      "Avec KORYXA, les flux financiers et operationnels sont analyses pour repondre a des questions concretes sur l'origine des couts et l'impact des decisions.",
    ],
    scenarioHighlights: [
      "Ou part l'argent exactement",
      "Quelles depenses n'apportent pas de valeur",
      "Quels processus coutent trop cher",
      "Que se passe-t-il si on change telle ou telle decision",
    ],
    deliveryTitle: "Ce que KORYXA fait",
    delivery:
      "KORYXA realise un diagnostic des couts et identifie les zones de perte. Ensuite, il propose des scenarios d'optimisation avec estimation d'impact.",
    deliverablesTitle: "Livrables",
    deliverables: [
      "Cartographie des couts et des pertes",
      "Identification des inefficacites",
      "Scenarios d'optimisation",
      "Estimation des economies possibles",
    ],
    resultTitle: "Resultat attendu",
    result:
      "Reduction des couts inutiles, amelioration des marges et meilleure gestion des ressources sans necessairement augmenter le volume d'activite.",
    audienceTitle: "Pour qui",
    audience:
      "PME, commerces, structures avec depenses regulieres, entreprises en difficulte de rentabilite ou en phase d'optimisation.",
  },
  "assistant-ia-metier": {
    heroTitle: "Assistant IA — Un assistant qui execute avec vous",
    introduction: [
      "Beaucoup d'entreprises perdent du temps sur des taches repetitives : repondre aux clients, traiter des demandes internes, organiser des informations ou suivre des operations simples.",
      "Ces taches ne sont pas complexes, mais elles consomment enormement de temps humain.",
      "Le service Assistant IA permet de deleguer une partie de ces actions a un assistant intelligent qui travaille en continu, sans fatigue, avec une logique coherente.",
    ],
    scenarioTitle: "Mise en situation",
    scenario: [
      "Une petite entreprise recoit chaque jour des messages WhatsApp ou des emails : demandes de prix, questions sur les produits, suivi de commandes ou demandes internes.",
      "Le dirigeant ou l'equipe repond manuellement a tout. Resultat : lenteur, oublis, fatigue et parfois perte de clients.",
      "Avec KORYXA, un assistant IA est configure pour repondre automatiquement aux questions frequentes, orienter les clients, traiter certaines demandes simples et assister l'equipe dans les taches internes.",
    ],
    scenarioHighlights: [
      "Reponse automatique aux questions frequentes",
      "Orientation des clients",
      "Traitement de certaines demandes simples",
      "Assistance de l'equipe dans les taches internes",
    ],
    deliveryTitle: "Ce que KORYXA fait",
    delivery:
      "KORYXA met en place un assistant adapte a votre activite, connecte a vos informations et capable d'interagir avec vos clients ou votre equipe.",
    deliverablesTitle: "Livrables",
    deliverables: [
      "Assistant IA configure",
      "Base de reponses personnalisees",
      "Integration avec WhatsApp, web ou outils internes",
      "Suivi des interactions",
    ],
    resultTitle: "Resultat attendu",
    result:
      "Reduction du temps de reponse, amelioration de la qualite de service et gain de temps pour l'equipe.",
    audienceTitle: "Pour qui",
    audience:
      "PME, services clients, commerces et structures recevant beaucoup de demandes repetitives.",
  },
  "robots-automatisation": {
    heroTitle: "Automatisation — Supprimez le travail mecanique",
    introduction: [
      "Dans beaucoup d'entreprises, certaines taches sont encore faites a la main : recopier des donnees, remplir des formulaires, verifier des informations, envoyer des rapports ou synchroniser des fichiers.",
      "Ces taches n'apportent pas de valeur strategique, mais elles prennent du temps et generent des erreurs.",
      "Le service Automatisation vise a supprimer ce travail mecanique en mettant en place des processus automatiques.",
    ],
    scenarioTitle: "Mise en situation",
    scenario: [
      "Une entreprise recoit des commandes via plusieurs canaux, comme WhatsApp, email ou formulaire. Ensuite, une personne recopie les informations, met a jour un fichier, informe l'equipe et prepare le suivi.",
      "Ce processus est lent, repetitif et source d'erreurs.",
      "Avec KORYXA, ces etapes sont automatisees : les donnees sont captees automatiquement, structurees et stockees, les bonnes personnes sont notifiees et les actions suivantes sont declenchees.",
    ],
    scenarioHighlights: [
      "Capture automatique des donnees",
      "Structuration et stockage des informations",
      "Notification des bonnes personnes",
      "Declenchement automatique des actions suivantes",
    ],
    deliveryTitle: "Ce que KORYXA fait",
    delivery:
      "KORYXA identifie les taches repetitives et met en place des automatisations adaptees a votre flux de travail.",
    deliverablesTitle: "Livrables",
    deliverables: [
      "Processus automatises",
      "Connexions entre outils comme emails, formulaires et fichiers",
      "Reduction des taches manuelles",
      "Systeme de declenchement automatique",
    ],
    resultTitle: "Resultat attendu",
    result:
      "Moins d'erreurs, execution plus rapide et liberation du temps humain pour des taches a plus forte valeur.",
    audienceTitle: "Pour qui",
    audience:
      "Entreprises avec beaucoup de taches repetitives, operations administratives ou gestion de flux d'informations.",
  },
  "optimisez-vos-process": {
    heroTitle: "Workflow — Organisez votre flux pour aller plus vite",
    introduction: [
      "Meme sans probleme de ventes ou de donnees, beaucoup d'entreprises sont freinees par une mauvaise organisation interne. Les taches ne sont pas claires, les responsabilites sont floues et les processus sont inefficaces.",
      "Le service Workflow permet de structurer les etapes de travail pour gagner en vitesse, en clarte et en efficacite.",
    ],
    scenarioTitle: "Mise en situation",
    scenario: [
      "Dans une entreprise, une demande arrive, personne ne sait exactement qui doit la traiter, elle passe de personne en personne, prend du retard et parfois elle est oubliee.",
      "Ce n'est pas un probleme de competence, mais un probleme d'organisation.",
      "Avec KORYXA, le flux est repense : chaque etape est definie, chaque role est clair, chaque tache a un responsable et le suivi devient visible.",
    ],
    scenarioHighlights: [
      "Chaque etape est definie",
      "Chaque role est clair",
      "Chaque tache a un responsable",
      "Le suivi est visible",
    ],
    deliveryTitle: "Ce que KORYXA fait",
    delivery:
      "KORYXA analyse votre fonctionnement actuel et restructure vos processus pour eliminer les blocages et les pertes de temps.",
    deliverablesTitle: "Livrables",
    deliverables: [
      "Cartographie des processus",
      "Organisation claire des etapes",
      "Attribution des roles",
      "Systeme de suivi des taches",
    ],
    resultTitle: "Resultat attendu",
    result:
      "Reduction des delais, meilleure coordination, moins de confusion et meilleure performance globale.",
    audienceTitle: "Pour qui",
    audience:
      "Entreprises en croissance, equipes desorganisees et structures avec plusieurs intervenants sur les memes taches.",
  },
  "site-web-intelligent": {
    heroTitle: "Site Web Intelligent — Votre presence digitale qui travaille pour vous",
    introduction: [
      "Beaucoup d'entreprises ont un site web, mais il ne sert presque a rien. Il est statique, peu visite, ne convertit pas et ne genere pas de clients.",
      "Le service Site Web Intelligent vise a transformer votre site en un veritable outil commercial actif : capter des prospects, informer efficacement et convertir.",
    ],
    scenarioTitle: "Mise en situation",
    scenario: [
      "Une entreprise a une page Facebook et parfois un site web. Les clients posent des questions en message prive. Il n'y a pas de systeme structure pour presenter clairement les offres, recuperer les contacts et guider le client vers une action.",
      "Resultat : des opportunites sont perdues.",
      "Avec KORYXA, le site est concu pour orienter le visiteur, les offres sont structurees et comprehensibles, des mecanismes de capture sont integres, et un assistant peut guider le visiteur.",
    ],
    scenarioHighlights: [
      "Presentation claire des offres",
      "Parcours visiteur oriente vers l'action",
      "Formulaires et mecanismes de capture de leads",
      "Possibilite d'integrer un assistant IA",
    ],
    deliveryTitle: "Ce que KORYXA fait",
    delivery:
      "KORYXA concoit un site oriente resultats, pas juste esthetique. Chaque element a un role : informer, convaincre et convertir.",
    deliverablesTitle: "Livrables",
    deliverables: [
      "Site web professionnel et responsive",
      "Structure orientee conversion",
      "Integration de formulaires et capture de leads",
      "Possibilite d'integrer un assistant IA",
    ],
    resultTitle: "Resultat attendu",
    result:
      "Plus de visibilite, plus de credibilite, plus de prospects et plus de clients.",
    audienceTitle: "Pour qui",
    audience:
      "PME, entrepreneurs, commerces et structures sans presence digitale efficace.",
  },
  "application-mobile": {
    heroTitle: "Application Mobile — Votre activite accessible partout",
    introduction: [
      "Dans beaucoup de contextes africains, le mobile est le principal outil. Pourtant, peu d'entreprises disposent d'applications adaptees a leurs realites terrain.",
      "Le service Application Mobile permet de creer des outils simples, utilisables partout, meme avec des contraintes comme une connexion faible, la mobilite ou le travail terrain.",
    ],
    scenarioTitle: "Mise en situation",
    scenario: [
      "Une entreprise gere ses operations via appels, messages et fichiers. Les equipes terrain n'ont pas d'outil structure pour remonter des informations, suivre les activites ou acceder aux donnees importantes.",
      "Cela cree des pertes d'information et un manque de suivi.",
      "Avec KORYXA, une application adaptee est developpee, les equipes peuvent travailler depuis le terrain, les donnees sont centralisees et certaines fonctionnalites peuvent fonctionner meme hors ligne.",
    ],
    scenarioHighlights: [
      "Remontee d'informations depuis le terrain",
      "Suivi des activites en mobilite",
      "Acces rapide aux donnees importantes",
      "Fonctionnalites possibles meme hors ligne",
    ],
    deliveryTitle: "Ce que KORYXA fait",
    delivery:
      "KORYXA concoit des applications simples, utiles et adaptees aux usages reels, pas des applications complexes inutiles.",
    deliverablesTitle: "Livrables",
    deliverables: [
      "Application Android et/ou iOS",
      "Interface adaptee aux utilisateurs",
      "Fonctionnalites metier specifiques",
      "Synchronisation des donnees",
    ],
    resultTitle: "Resultat attendu",
    result:
      "Meilleure organisation terrain, acces rapide a l'information et reduction des pertes de donnees.",
    audienceTitle: "Pour qui",
    audience:
      "Entreprises avec equipes terrain, ONG, projets et structures mobiles.",
  },
  "systeme-entreprise-integre": {
    heroTitle: "Systeme Integre — Toute votre entreprise dans un seul systeme",
    introduction: [
      "Beaucoup d'entreprises utilisent plusieurs outils separes : les ventes d'un cote, le stock ailleurs, la finance dans un autre fichier et le suivi dans WhatsApp.",
      "Resultat : desorganisation, incoherences et perte d'information.",
      "Le service Systeme Integre permet de centraliser toutes les operations dans un seul systeme coherent.",
    ],
    scenarioTitle: "Mise en situation",
    scenario: [
      "Une entreprise vend des produits. Les ventes sont notees a part, le stock est suivi dans un autre fichier et la comptabilite est ailleurs.",
      "Quand le dirigeant veut une vision globale, il doit tout recomposer manuellement.",
      "Avec KORYXA, les donnees sont centralisees, les informations deviennent coherentes et chaque action impacte le systeme global.",
    ],
    scenarioHighlights: [
      "Donnees centralisees",
      "Informations coherentes entre les modules",
      "Impact global de chaque action",
      "Vision transversale de l'activite",
    ],
    deliveryTitle: "Ce que KORYXA fait",
    delivery:
      "KORYXA construit un systeme unifie qui relie les differentes fonctions de l'entreprise.",
    deliverablesTitle: "Livrables",
    deliverables: [
      "Plateforme centralisee",
      "Modules connectes comme vente, stock et finance",
      "Donnees unifiees",
      "Rapports consolides",
    ],
    resultTitle: "Resultat attendu",
    result:
      "Vision globale de l'entreprise, meilleure prise de decision et reduction des erreurs liees a la dispersion.",
    audienceTitle: "Pour qui",
    audience:
      "PME en croissance et entreprises utilisant plusieurs outils non connectes.",
  },
  "securite-sauvegarde-donnees": {
    heroTitle: "Securite Data — Vos donnees protegees et disponibles",
    introduction: [
      "Beaucoup d'entreprises sous-estiment les risques lies aux donnees : pertes, acces non autorises, absence de sauvegarde. Pourtant, une perte de donnees peut paralyser toute l'activite.",
      "Le service Securite Data vise a proteger, sauvegarder et garantir la disponibilite des informations critiques.",
    ],
    scenarioTitle: "Mise en situation",
    scenario: [
      "Une entreprise garde ses donnees sur un ordinateur ou dans des fichiers non securises. Un probleme survient : panne, suppression accidentelle ou acces non autorise.",
      "Resultat : perte d'informations importantes, parfois irreversible.",
      "Avec KORYXA, les donnees sont sauvegardees regulierement, les acces sont controles, les systemes sont surveilles et des mecanismes de reprise sont mis en place.",
    ],
    scenarioHighlights: [
      "Sauvegardes regulieres",
      "Acces controles",
      "Surveillance des systemes",
      "Mecanismes de reprise apres incident",
    ],
    deliveryTitle: "Ce que KORYXA fait",
    delivery:
      "KORYXA securise votre infrastructure de donnees pour eviter les pertes critiques et garantir la continuite.",
    deliverablesTitle: "Livrables",
    deliverables: [
      "Systeme de sauvegarde",
      "Gestion des acces",
      "Surveillance des donnees",
      "Plan de reprise",
    ],
    resultTitle: "Resultat attendu",
    result:
      "Donnees protegees, continuite de service et reduction des risques majeurs.",
    audienceTitle: "Pour qui",
    audience:
      "Toute entreprise manipulant des donnees importantes, comme les clients, les ventes ou les finances.",
  },
};

const YES_NO_OPTIONS: ServiceIaQuestionOption[] = [
  { value: "oui", label: "Oui" },
  { value: "non", label: "Non" },
];

const DEFAULT_QUESTION_SET: ServiceIaQuestion[] = [
  {
    key: "resultat_cible",
    label: "Quel resultat concret voulez-vous obtenir ?",
    input: "textarea",
    required: true,
    placeholder: "Ex: gain de temps, baisse des erreurs, croissance des ventes.",
  },
  {
    key: "blocage_actuel",
    label: "Quel est le principal blocage actuel ?",
    input: "textarea",
    required: true,
    placeholder: "Ex: process manuel, manque de suivi, outils non connectes.",
  },
  {
    key: "outils_actuels",
    label: "Quels outils utilisez-vous aujourd'hui ?",
    input: "text",
    required: false,
    placeholder: "Ex: Excel, ERP, CRM, WhatsApp.",
  },
];

export const SERVICE_IA_QUESTION_SET: Record<string, ServiceIaQuestion[]> = {
  "maitrisez-vos-chiffres": [
    {
      key: "frequence_pilotage",
      label: "A quelle frequence voulez-vous piloter vos KPI ?",
      input: "select",
      required: true,
      options: [
        { value: "quotidien", label: "Quotidien" },
        { value: "hebdomadaire", label: "Hebdomadaire" },
        { value: "mensuel", label: "Mensuel" },
      ],
    },
    {
      key: "kpi_prioritaires",
      label: "Quels KPI sont prioritaires ? (plusieurs choix possibles)",
      input: "checkbox",
      required: true,
      options: [
        { value: "ventes", label: "Ventes" },
        { value: "marge", label: "Marge" },
        { value: "stock", label: "Stock" },
        { value: "cash", label: "Cash" },
        { value: "clients", label: "Clients actifs" },
      ],
    },
    {
      key: "sources_donnees",
      label: "Vos donnees viennent de quelles sources ?",
      input: "checkbox",
      required: true,
      options: [
        { value: "excel", label: "Excel / Google Sheets" },
        { value: "erp", label: "ERP" },
        { value: "crm", label: "CRM" },
        { value: "caisse", label: "Caisse / POS" },
        { value: "autre", label: "Autre" },
      ],
    },
    {
      key: "alertes_metier",
      label: "Quelles alertes voulez-vous recevoir en priorite ?",
      input: "textarea",
      required: true,
      placeholder: "Ex: rupture stock, chute marge, retard recouvrement.",
    },
  ],
  "vendez-plus-par-prediction": [
    {
      key: "objectif_prediction",
      label: "Quel objectif principal visez-vous ?",
      input: "radio",
      required: true,
      options: [
        { value: "prevoir_ventes", label: "Prevoir les ventes" },
        { value: "fideliser_clients", label: "Fideliser les clients" },
        { value: "augmenter_panier", label: "Augmenter le panier moyen" },
      ],
    },
    {
      key: "canaux_vente",
      label: "Sur quels canaux vendez-vous ? (plusieurs choix)",
      input: "checkbox",
      required: true,
      options: [
        { value: "boutique", label: "Boutique physique" },
        { value: "ecommerce", label: "E-commerce" },
        { value: "whatsapp", label: "WhatsApp / reseaux sociaux" },
        { value: "b2b", label: "Commercial B2B" },
      ],
    },
    {
      key: "historique_donnees",
      label: "Avez-vous un historique de ventes exploitable ?",
      input: "radio",
      required: true,
      options: [
        { value: "oui", label: "Oui, propre" },
        { value: "partiel", label: "Partiel" },
        { value: "non", label: "Non / a structurer" },
      ],
    },
    {
      key: "decision_a_prendre",
      label: "Quelle decision devez-vous prendre avec cette prediction ?",
      input: "textarea",
      required: true,
      placeholder: "Ex: plan promos, allocation stock, relance commerciale.",
    },
  ],
  "reduisez-vos-couts": [
    {
      key: "zone_couts",
      label: "Quels postes de cout voulez-vous optimiser ?",
      input: "checkbox",
      required: true,
      options: [
        { value: "achats", label: "Achats" },
        { value: "logistique", label: "Logistique" },
        { value: "operations", label: "Operations" },
        { value: "rh", label: "RH" },
      ],
    },
    {
      key: "symptomes_perte",
      label: "Quels symptomes observez-vous ?",
      input: "checkbox",
      required: true,
      options: [
        { value: "retards", label: "Retards frequents" },
        { value: "erreurs", label: "Erreurs recurrentes" },
        { value: "surstock", label: "Surstock / immobilisation" },
        { value: "gaspillage", label: "Gaspillage operationnel" },
      ],
    },
    {
      key: "objectif_economie",
      label: "Quel objectif d'economie ciblez-vous ?",
      input: "select",
      required: true,
      options: [
        { value: "5_10", label: "5% a 10%" },
        { value: "10_20", label: "10% a 20%" },
        { value: "20_plus", label: "20% et plus" },
      ],
    },
    {
      key: "horizon_decision",
      label: "A quel horizon voulez-vous lancer les actions ?",
      input: "radio",
      required: true,
      options: [
        { value: "30j", label: "Sous 30 jours" },
        { value: "90j", label: "Sous 90 jours" },
        { value: "6m", label: "Sous 6 mois" },
      ],
    },
  ],
  "assistant-ia-metier": [
    {
      key: "assistant_canal",
      label: "Sur quels canaux l'assistant doit-il intervenir ?",
      input: "checkbox",
      required: true,
      options: [
        { value: "whatsapp", label: "WhatsApp" },
        { value: "telegram", label: "Telegram" },
        { value: "webchat", label: "Webchat" },
        { value: "email", label: "Email" },
      ],
    },
    {
      key: "assistant_missions",
      label: "Quelles missions donner a l'assistant ?",
      input: "checkbox",
      required: true,
      options: [
        { value: "support_client", label: "Support client" },
        { value: "faq", label: "FAQ / reponses standard" },
        { value: "prise_commande", label: "Prise de commande" },
        { value: "support_interne", label: "Support interne / RH" },
      ],
    },
    {
      key: "langue_service",
      label: "Langue principale de service",
      input: "select",
      required: true,
      options: [
        { value: "fr", label: "Francais" },
        { value: "en", label: "Anglais" },
        { value: "bi", label: "Bilingue" },
      ],
    },
    {
      key: "escalade_humaine",
      label: "Voulez-vous une escalade vers un humain sur les cas sensibles ?",
      input: "radio",
      required: true,
      options: YES_NO_OPTIONS,
    },
  ],
  "robots-automatisation": [
    {
      key: "taches_repetitives",
      label: "Quelles taches repetitives voulez-vous automatiser en priorite ?",
      input: "textarea",
      required: true,
      placeholder: "Ex: saisie facture, mise a jour CRM, relances email.",
    },
    {
      key: "systemes_connectes",
      label: "Quels systemes doivent etre connectes ?",
      input: "checkbox",
      required: true,
      options: [
        { value: "excel", label: "Excel / Sheets" },
        { value: "erp", label: "ERP" },
        { value: "crm", label: "CRM" },
        { value: "email", label: "Email" },
        { value: "api", label: "API metier" },
      ],
    },
    {
      key: "volume_journalier",
      label: "Volume journalier a traiter",
      input: "select",
      required: true,
      options: [
        { value: "moins_100", label: "Moins de 100 operations/jour" },
        { value: "100_500", label: "100 a 500 operations/jour" },
        { value: "500_plus", label: "Plus de 500 operations/jour" },
      ],
    },
    {
      key: "priorite_automatisation",
      label: "Priorite principale",
      input: "radio",
      required: true,
      options: [
        { value: "vitesse", label: "Gagner du temps" },
        { value: "qualite", label: "Reduire les erreurs" },
        { value: "cout", label: "Reduire les couts" },
      ],
    },
  ],
  "optimisez-vos-process": [
    {
      key: "process_cible",
      label: "Quel process voulez-vous optimiser ?",
      input: "text",
      required: true,
      placeholder: "Ex: vente -> livraison, onboarding client, support.",
    },
    {
      key: "blocages_process",
      label: "Quels blocages observez-vous ?",
      input: "checkbox",
      required: true,
      options: [
        { value: "attente", label: "Temps d'attente eleve" },
        { value: "validation", label: "Validation trop lente" },
        { value: "double_saisie", label: "Double saisie" },
        { value: "manque_visibilite", label: "Manque de visibilite" },
      ],
    },
    {
      key: "equipes_impliquees",
      label: "Equipes impliquees",
      input: "checkbox",
      required: true,
      options: [
        { value: "commercial", label: "Commercial" },
        { value: "operations", label: "Operations" },
        { value: "finance", label: "Finance" },
        { value: "support", label: "Support client" },
      ],
    },
    {
      key: "gain_attendu",
      label: "Gain attendu",
      input: "select",
      required: true,
      options: [
        { value: "delai", label: "Reduction delai" },
        { value: "qualite", label: "Amelioration qualite" },
        { value: "capacite", label: "Hausse capacite de traitement" },
      ],
    },
  ],
  "site-web-intelligent": [
    {
      key: "besoin_site",
      label: "Avez-vous besoin d'un nouveau site web ?",
      input: "radio",
      required: true,
      options: YES_NO_OPTIONS,
    },
    {
      key: "etat_site_existant",
      label: "Avez-vous deja un site a ameliorer ?",
      input: "radio",
      required: true,
      options: [
        { value: "pas_de_site", label: "Je n'ai pas encore de site" },
        { value: "ameliorer", label: "Oui, je veux l'ameliorer" },
        { value: "refonte", label: "Oui, je veux une refonte complete" },
      ],
    },
    {
      key: "secteur_activite",
      label: "Votre secteur d'activite",
      input: "text",
      required: true,
      placeholder: "Ex: sante, retail, education, logistique.",
    },
    {
      key: "type_site",
      label: "Type de site souhaite (plusieurs choix)",
      input: "checkbox",
      required: true,
      options: [
        { value: "vitrine", label: "Site vitrine" },
        { value: "ecommerce", label: "E-commerce" },
        { value: "reservation", label: "Reservation / prise RDV" },
        { value: "portail", label: "Portail client" },
      ],
    },
    {
      key: "domaine",
      label: "Nom de domaine souhaite (si deja choisi)",
      input: "text",
      required: false,
      placeholder: "Ex: monentreprise.com",
    },
  ],
  "application-mobile": [
    {
      key: "cible_app",
      label: "Qui utilisera principalement l'application ?",
      input: "checkbox",
      required: true,
      options: [
        { value: "equipes", label: "Equipes internes" },
        { value: "clients", label: "Clients" },
        { value: "partenaires", label: "Partenaires" },
      ],
    },
    {
      key: "plateformes",
      label: "Plateformes ciblees",
      input: "checkbox",
      required: true,
      options: [
        { value: "android", label: "Android" },
        { value: "ios", label: "iOS" },
        { value: "webapp", label: "Web app progressive" },
      ],
    },
    {
      key: "actions_cles",
      label: "Quelles actions critiques doivent etre possibles ?",
      input: "textarea",
      required: true,
      placeholder: "Ex: prise commande, suivi livraison, validation terrain.",
    },
    {
      key: "mode_offline",
      label: "Avez-vous besoin d'un mode offline ?",
      input: "radio",
      required: true,
      options: YES_NO_OPTIONS,
    },
  ],
  "systeme-entreprise-integre": [
    {
      key: "fonctions_unifier",
      label: "Quelles fonctions souhaitez-vous unifier ?",
      input: "checkbox",
      required: true,
      options: [
        { value: "ventes", label: "Ventes" },
        { value: "achats", label: "Achats" },
        { value: "stock", label: "Stock" },
        { value: "finance", label: "Finance" },
        { value: "rh", label: "RH" },
      ],
    },
    {
      key: "outils_fragmentes",
      label: "Quels outils utilisez-vous actuellement ?",
      input: "textarea",
      required: true,
      placeholder: "Ex: Excel, WhatsApp, logiciel local, ERP partiel.",
    },
    {
      key: "mode_deploiement",
      label: "Mode de deploiement prefere",
      input: "radio",
      required: true,
      options: [
        { value: "cloud", label: "Cloud" },
        { value: "local", label: "Sur serveur local" },
        { value: "hybride", label: "Hybride" },
      ],
    },
    {
      key: "priorite_systeme",
      label: "Priorite principale",
      input: "radio",
      required: true,
      options: [
        { value: "visibilite", label: "Mieux piloter l'activite" },
        { value: "fiabilite", label: "Fiabiliser les operations" },
        { value: "vitesse", label: "Accelerer les traitements" },
      ],
    },
  ],
  "securite-sauvegarde-donnees": [
    {
      key: "donnees_critique",
      label: "Quelles donnees sont les plus critiques ?",
      input: "checkbox",
      required: true,
      options: [
        { value: "clients", label: "Donnees clients" },
        { value: "finance", label: "Donnees financieres" },
        { value: "operations", label: "Donnees operations" },
        { value: "rh", label: "Donnees RH" },
      ],
    },
    {
      key: "strategie_backup",
      label: "Avez-vous deja une strategie de sauvegarde ?",
      input: "radio",
      required: true,
      options: [
        { value: "quotidienne", label: "Oui, quotidienne" },
        { value: "hebdo", label: "Oui, hebdomadaire" },
        { value: "ponctuelle", label: "Sauvegardes ponctuelles" },
        { value: "aucune", label: "Aucune strategie claire" },
      ],
    },
    {
      key: "incidents_connus",
      label: "Incidents deja rencontres",
      input: "checkbox",
      required: false,
      options: [
        { value: "perte", label: "Perte de donnees" },
        { value: "acces", label: "Acces non autorise" },
        { value: "ransomware", label: "Tentative ransomware" },
        { value: "aucun", label: "Aucun incident majeur" },
      ],
    },
    {
      key: "objectif_reprise",
      label: "Objectif de reprise apres incident",
      input: "select",
      required: true,
      options: [
        { value: "2h", label: "Moins de 2 heures" },
        { value: "24h", label: "Moins de 24 heures" },
        { value: "48h", label: "Moins de 48 heures" },
      ],
    },
  ],
};

export function getServiceIaBySlug(slug: string): ServiceIaItem | undefined {
  return SERVICE_IA_ITEMS.find((item) => item.slug === slug);
}

export function getServiceIaDetailContent(slug: string): ServiceIaDetailContent | undefined {
  return SERVICE_IA_DETAIL_CONTENT[slug];
}

export function getServiceQuestionSet(slug: string): ServiceIaQuestion[] {
  return SERVICE_IA_QUESTION_SET[slug] ?? DEFAULT_QUESTION_SET;
}

export function getQuestionOptionLabel(question: ServiceIaQuestion, value: string): string {
  return question.options?.find((opt) => opt.value === value)?.label ?? value;
}
