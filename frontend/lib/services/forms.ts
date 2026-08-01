import type { ServiceDefinition } from "@/lib/services/catalog";

export type FormOption = { value: string; label: string };
export type FormField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "radio" | "checkbox" | "url";
  required?: boolean;
  placeholder?: string;
  helper?: string;
  options?: FormOption[];
  visibleWhen?: { key: string; equals: string };
};
export type ServiceFormConfig = {
  serviceSlug: string;
  intro: string;
  projectType: string;
  questions: FormField[];
};

const yesNo: FormOption[] = [{ value: "oui", label: "Oui" }, { value: "non", label: "Non" }];
const commonGoal: FormField = { key: "objectif", label: "Quel résultat concret attendez-vous ?", type: "textarea", required: true, placeholder: "Décrivez le résultat attendu pour votre entreprise." };

const pillarQuestions: Record<string, FormField[]> = {
  "web-ecommerce": [
    { key: "site_existant", label: "Avez-vous déjà un site ?", type: "radio", required: true, options: yesNo },
    { key: "url_site", label: "Adresse du site existant", type: "url", placeholder: "https://...", visibleWhen: { key: "site_existant", equals: "oui" } },
    { key: "fonctionnalites_web", label: "Fonctionnalités importantes", type: "checkbox", required: true, options: [
      { value: "presentation", label: "Présentation de l’activité" }, { value: "catalogue", label: "Catalogue ou boutique" },
      { value: "paiement", label: "Paiement en ligne" }, { value: "reservation", label: "Réservation / rendez-vous" },
      { value: "espace_client", label: "Espace client" }, { value: "multilingue", label: "Multilingue" }
    ]},
    { key: "contenus_disponibles", label: "Disposez-vous déjà des textes, images et éléments de marque ?", type: "select", required: true, options: [
      { value: "complets", label: "Oui, tout est prêt" }, { value: "partiels", label: "Partiellement" }, { value: "aucun", label: "Non, il faut les produire" }
    ]}, commonGoal
  ],
  "applications-saas": [
    { key: "utilisateurs", label: "Qui utilisera principalement la solution ?", type: "checkbox", required: true, options: [
      { value: "equipe", label: "Équipe interne" }, { value: "clients", label: "Clients" }, { value: "partenaires", label: "Partenaires" }, { value: "public", label: "Grand public" }
    ]},
    { key: "plateformes", label: "Plateformes attendues", type: "checkbox", required: true, options: [
      { value: "web", label: "Application web" }, { value: "android", label: "Android" }, { value: "ios", label: "iOS" }, { value: "pwa", label: "PWA installable" }
    ]},
    { key: "roles", label: "Faut-il plusieurs rôles et niveaux d’accès ?", type: "radio", required: true, options: yesNo },
    { key: "fonctions_metier", label: "Quelles actions principales doivent être possibles ?", type: "textarea", required: true, placeholder: "Ex. gérer des dossiers, suivre des commandes, facturer..." }, commonGoal
  ],
  "intelligence-artificielle": [
    { key: "mission_ia", label: "Quelle mission principale confier à l’IA ?", type: "textarea", required: true, placeholder: "Ex. répondre aux clients, analyser des documents, préparer des rapports..." },
    { key: "canaux_ia", label: "Où l’IA doit-elle intervenir ?", type: "checkbox", required: true, options: [
      { value: "site", label: "Site web" }, { value: "whatsapp", label: "WhatsApp" }, { value: "email", label: "Email" }, { value: "interne", label: "Outil interne" }, { value: "telephone", label: "Téléphone" }
    ]},
    { key: "donnees_ia", label: "Quelles sources l’IA devra-t-elle utiliser ?", type: "checkbox", required: true, options: [
      { value: "documents", label: "Documents / PDF" }, { value: "crm", label: "CRM" }, { value: "base", label: "Base de données" }, { value: "site", label: "Contenu du site" }, { value: "api", label: "API métier" }
    ]},
    { key: "validation_humaine", label: "Une validation humaine est-elle requise avant certaines actions ?", type: "radio", required: true, options: yesNo }, commonGoal
  ],
  "automatisation-integrations": [
    { key: "processus_actuel", label: "Décrivez le processus actuel étape par étape", type: "textarea", required: true, placeholder: "Décrivez ce qui se passe aujourd’hui, de l’entrée à la sortie." },
    { key: "outils_connecter", label: "Quels outils doivent être connectés ?", type: "text", required: true, placeholder: "Ex. Gmail, WhatsApp, Airtable, CRM, ERP..." },
    { key: "frequence", label: "À quelle fréquence ce processus est-il exécuté ?", type: "select", required: true, options: [
      { value: "temps_reel", label: "En temps réel" }, { value: "quotidien", label: "Chaque jour" }, { value: "hebdo", label: "Chaque semaine" }, { value: "ponctuel", label: "Ponctuellement" }
    ]},
    { key: "validation_processus", label: "Faut-il une validation humaine dans le workflow ?", type: "radio", required: true, options: yesNo }, commonGoal
  ],
  "data-infrastructure": [
    { key: "sources_data", label: "Quelles sont vos sources de données ou systèmes actuels ?", type: "textarea", required: true, placeholder: "Bases, fichiers, outils cloud, serveurs..." },
    { key: "volume", label: "Quel volume ou niveau de charge estimez-vous ?", type: "select", required: true, options: [
      { value: "faible", label: "Faible / démarrage" }, { value: "moyen", label: "Moyen / activité régulière" }, { value: "eleve", label: "Élevé / critique" }, { value: "inconnu", label: "À évaluer" }
    ]},
    { key: "contraintes", label: "Contraintes particulières", type: "checkbox", options: [
      { value: "securite", label: "Sécurité renforcée" }, { value: "haute_dispo", label: "Haute disponibilité" }, { value: "local", label: "Hébergement local" }, { value: "conformite", label: "Conformité spécifique" }, { value: "migration", label: "Migration existante" }
    ]},
    { key: "incident", label: "Existe-t-il un incident ou une urgence actuelle ?", type: "radio", required: true, options: yesNo }, commonGoal
  ],
  "conseil-maintenance-formation": [
    { key: "type_accompagnement", label: "Quel accompagnement recherchez-vous ?", type: "checkbox", required: true, options: [
      { value: "audit", label: "Audit" }, { value: "strategie", label: "Stratégie / feuille de route" }, { value: "maintenance", label: "Maintenance" }, { value: "support", label: "Support" }, { value: "formation", label: "Formation" }
    ]},
    { key: "public_concerne", label: "Qui est concerné ?", type: "text", required: true, placeholder: "Ex. direction, équipe commerciale, équipe technique..." },
    { key: "existant", label: "Décrivez les outils, produits ou systèmes déjà en place", type: "textarea", required: true },
    { key: "format", label: "Format préféré", type: "select", required: true, options: [
      { value: "ponctuel", label: "Mission ponctuelle" }, { value: "mensuel", label: "Accompagnement mensuel" }, { value: "atelier", label: "Atelier / formation" }, { value: "a_definir", label: "À définir ensemble" }
    ]}, commonGoal
  ]
};

const serviceOverrides: Record<string, FormField[]> = {
  "site-web-professionnel": [
    { key: "objectif_site", label: "Quel est l’objectif principal du futur site ?", type: "radio", required: true, options: [
      { value: "credibilite", label: "Renforcer la crédibilité de l’entreprise" },
      { value: "prospects", label: "Générer des demandes de devis ou contacts" },
      { value: "presentation", label: "Présenter clairement les services" },
      { value: "lancement", label: "Lancer une nouvelle activité ou marque" },
      { value: "recrutement", label: "Attirer des candidats ou partenaires" }
    ]},
    { key: "site_existant", label: "Avez-vous déjà un site internet ?", type: "radio", required: true, options: yesNo },
    { key: "url_site", label: "Adresse du site actuel", type: "url", required: true, placeholder: "https://...", visibleWhen: { key: "site_existant", equals: "oui" } },
    { key: "raison_nouveau_site", label: "Qu’est-ce qui ne fonctionne plus dans le site actuel ?", type: "textarea", required: true, placeholder: "Image, contenus, mobile, lenteur, absence de demandes...", visibleWhen: { key: "site_existant", equals: "oui" } },
    { key: "publics_cibles", label: "Qui souhaitez-vous convaincre en priorité ?", type: "textarea", required: true, placeholder: "Décrivez vos clients, prospects, partenaires ou candidats prioritaires." },
    { key: "services_prioritaires", label: "Quels services ou offres doivent être mis en avant ?", type: "textarea", required: true, placeholder: "Listez les offres les plus importantes commercialement." },
    { key: "actions_attendues", label: "Quelles actions les visiteurs doivent-ils pouvoir réaliser ?", type: "checkbox", required: true, options: [
      { value: "devis", label: "Demander un devis" },
      { value: "contact", label: "Envoyer une demande de contact" },
      { value: "appel", label: "Appeler directement" },
      { value: "whatsapp", label: "Contacter sur WhatsApp" },
      { value: "rendez_vous", label: "Prendre rendez-vous" },
      { value: "documents", label: "Télécharger un document" },
      { value: "candidature", label: "Déposer une candidature" }
    ]},
    { key: "pages_souhaitees", label: "Quelles pages imaginez-vous déjà ?", type: "checkbox", required: true, options: [
      { value: "accueil", label: "Accueil" },
      { value: "entreprise", label: "À propos / entreprise" },
      { value: "services", label: "Services" },
      { value: "realisations", label: "Réalisations / références" },
      { value: "equipe", label: "Équipe" },
      { value: "actualites", label: "Actualités / blog" },
      { value: "carrieres", label: "Carrières" },
      { value: "contact", label: "Contact" }
    ]},
    { key: "identite_visuelle", label: "Votre identité visuelle est-elle prête ?", type: "select", required: true, options: [
      { value: "complete", label: "Oui : logo, couleurs et règles sont prêts" },
      { value: "partielle", label: "Partiellement : nous avons quelques éléments" },
      { value: "a_creer", label: "Non : il faut définir la direction visuelle" }
    ]},
    { key: "contenus", label: "Où en sont les contenus du site ?", type: "select", required: true, options: [
      { value: "prets", label: "Textes et images prêts" },
      { value: "a_retravailler", label: "Contenus existants à retravailler" },
      { value: "a_produire", label: "Contenus à produire" }
    ]},
    { key: "integrations_site", label: "Quelles connexions sont nécessaires ?", type: "checkbox", options: [
      { value: "analytics", label: "Mesure d’audience" },
      { value: "crm", label: "CRM" },
      { value: "newsletter", label: "Newsletter" },
      { value: "agenda", label: "Prise de rendez-vous" },
      { value: "whatsapp", label: "WhatsApp" },
      { value: "recrutement", label: "Outil de recrutement" },
      { value: "aucune", label: "Aucune pour le moment" }
    ]},
    { key: "gestion_contenu", label: "Souhaitez-vous modifier vous-même les contenus après livraison ?", type: "radio", required: true, options: yesNo },
    { key: "exemples_sites", label: "Avez-vous des sites de référence ou concurrents à nous montrer ?", type: "textarea", placeholder: "Ajoutez les liens et précisez ce que vous appréciez ou souhaitez éviter." },
    { key: "critere_reussite", label: "Dans six mois, qu’est-ce qui vous fera dire que le site est une réussite ?", type: "textarea", required: true, placeholder: "Plus de demandes qualifiées, meilleure image, meilleure compréhension des offres..." }
  ],
  "reservation-portail-client": [
    { key: "type_service_reservation", label: "Que vos clients doivent-ils pouvoir réserver ou suivre ?", type: "checkbox", required: true, options: [
      { value: "rendez_vous", label: "Rendez-vous individuel" },
      { value: "cours", label: "Cours ou session collective" },
      { value: "ressource", label: "Salle, équipement ou ressource" },
      { value: "hebergement", label: "Hébergement ou séjour" },
      { value: "intervention", label: "Intervention ou service à domicile" },
      { value: "dossier", label: "Dossier ou demande client" }
    ]},
    { key: "profils_utilisateurs", label: "Quels profils utiliseront la plateforme ?", type: "checkbox", required: true, options: [
      { value: "clients", label: "Clients" },
      { value: "collaborateurs", label: "Collaborateurs / intervenants" },
      { value: "responsables", label: "Responsables d’équipe" },
      { value: "partenaires", label: "Partenaires externes" },
      { value: "administrateurs", label: "Administrateurs" }
    ]},
    { key: "volume_reservations", label: "Quel volume de réservations ou dossiers prévoyez-vous par mois ?", type: "select", required: true, options: [
      { value: "moins_100", label: "Moins de 100" },
      { value: "100_1000", label: "100 à 1 000" },
      { value: "1000_10000", label: "1 000 à 10 000" },
      { value: "10000_plus", label: "Plus de 10 000" },
      { value: "inconnu", label: "À estimer" }
    ]},
    { key: "ressources_gerees", label: "Quelles ressources déterminent les disponibilités ?", type: "checkbox", required: true, options: [
      { value: "collaborateurs", label: "Collaborateurs" },
      { value: "lieux", label: "Lieux / salles" },
      { value: "equipements", label: "Équipements" },
      { value: "capacite", label: "Capacité d’accueil" },
      { value: "stock", label: "Stock ou unités disponibles" },
      { value: "aucune", label: "Aucune ressource particulière" }
    ]},
    { key: "regles_disponibilite", label: "Quelles règles de disponibilité faut-il gérer ?", type: "textarea", required: true, placeholder: "Horaires, durées, temps tampon, jours fermés, délais minimum, récurrence, exceptions..." },
    { key: "multi_lieux", label: "Le service fonctionne-t-il sur plusieurs lieux ou zones ?", type: "radio", required: true, options: yesNo },
    { key: "details_lieux", label: "Décrivez les lieux ou zones concernés", type: "textarea", required: true, placeholder: "Adresses, zones d’intervention, capacités et contraintes.", visibleWhen: { key: "multi_lieux", equals: "oui" } },
    { key: "paiement_reservation", label: "Quel paiement doit être associé à la réservation ?", type: "checkbox", required: true, options: [
      { value: "aucun", label: "Aucun paiement en ligne" },
      { value: "acompte", label: "Acompte" },
      { value: "total", label: "Paiement complet" },
      { value: "solde", label: "Acompte puis solde" },
      { value: "sur_place", label: "Paiement sur place" },
      { value: "abonnement", label: "Forfait ou abonnement" }
    ]},
    { key: "moyens_paiement_portail", label: "Quels moyens de paiement souhaitez-vous proposer ?", type: "checkbox", required: true, options: [
      { value: "carte", label: "Carte bancaire" },
      { value: "mobile_money", label: "Mobile Money" },
      { value: "virement", label: "Virement" },
      { value: "wallet", label: "Crédit ou portefeuille interne" },
      { value: "aucun", label: "Aucun paiement en ligne" }
    ]},
    { key: "regles_annulation", label: "Quelles règles de report, annulation et remboursement doivent s’appliquer ?", type: "textarea", required: true, placeholder: "Délais, pénalités, remboursement, validation manuelle, nombre de reports..." },
    { key: "notifications", label: "Quelles notifications sont nécessaires ?", type: "checkbox", required: true, options: [
      { value: "confirmation", label: "Confirmation immédiate" },
      { value: "rappel", label: "Rappels avant rendez-vous" },
      { value: "modification", label: "Modification ou annulation" },
      { value: "paiement", label: "Paiement ou solde" },
      { value: "document", label: "Document manquant ou disponible" },
      { value: "statut", label: "Changement de statut" },
      { value: "relance", label: "Relance après absence" }
    ]},
    { key: "canaux_notification", label: "Par quels canaux ?", type: "checkbox", required: true, options: [
      { value: "email", label: "Email" },
      { value: "sms", label: "SMS" },
      { value: "whatsapp", label: "WhatsApp" },
      { value: "push", label: "Notification push" },
      { value: "interne", label: "Notification dans le portail" }
    ]},
    { key: "fonctionnalites_portail", label: "Que doit contenir l’espace client ?", type: "checkbox", required: true, options: [
      { value: "reservations", label: "Réservations passées et futures" },
      { value: "documents", label: "Documents à déposer ou télécharger" },
      { value: "factures", label: "Factures et paiements" },
      { value: "dossier", label: "Statut d’un dossier" },
      { value: "messages", label: "Messages et échanges" },
      { value: "profil", label: "Profil et préférences" },
      { value: "formulaires", label: "Formulaires à compléter" }
    ]},
    { key: "documents_sensibles", label: "Le portail doit-il gérer des documents ou données sensibles ?", type: "radio", required: true, options: yesNo },
    { key: "types_documents", label: "Quels documents ou données sensibles ?", type: "textarea", required: true, placeholder: "Pièces d’identité, dossiers médicaux, contrats, justificatifs...", visibleWhen: { key: "documents_sensibles", equals: "oui" } },
    { key: "integrations_reservation", label: "Quelles intégrations sont nécessaires ?", type: "checkbox", required: true, options: [
      { value: "google_calendar", label: "Google Calendar" },
      { value: "outlook", label: "Microsoft Outlook" },
      { value: "crm", label: "CRM" },
      { value: "paiement", label: "Prestataire de paiement" },
      { value: "facturation", label: "Facturation / comptabilité" },
      { value: "erp", label: "ERP ou outil métier" },
      { value: "signature", label: "Signature électronique" },
      { value: "aucune", label: "Aucune intégration" }
    ]},
    { key: "systeme_existant_reservation", label: "Utilisez-vous déjà un système de réservation ou un portail ?", type: "radio", required: true, options: yesNo },
    { key: "outil_existant_reservation", label: "Quel outil utilisez-vous et que faut-il reprendre ?", type: "textarea", required: true, placeholder: "Nom de l’outil, comptes, réservations, documents, historiques...", visibleWhen: { key: "systeme_existant_reservation", equals: "oui" } },
    { key: "gestion_interne", label: "Comment les équipes gèrent-elles aujourd’hui les réservations ou dossiers ?", type: "textarea", required: true, placeholder: "Téléphone, WhatsApp, tableur, agenda, logiciel métier..." },
    { key: "critere_reussite_portail", label: "Quel résultat opérationnel définira la réussite du projet ?", type: "textarea", required: true, placeholder: "Moins d’appels, moins d’absences, meilleur taux d’occupation, paiements plus rapides..." }
  ],
  "refonte-optimisation": [
    { key: "url_site_refonte", label: "Quelle est l’adresse du site à auditer ?", type: "url", required: true, placeholder: "https://..." },
    { key: "raison_refonte", label: "Qu’est-ce qui déclenche la refonte maintenant ?", type: "checkbox", required: true, options: [
      { value: "image", label: "Image devenue datée" },
      { value: "conversion", label: "Manque de demandes ou ventes" },
      { value: "mobile", label: "Mauvaise expérience mobile" },
      { value: "performance", label: "Lenteur ou instabilité" },
      { value: "seo", label: "Baisse ou faiblesse du référencement" },
      { value: "cms", label: "Administration difficile" },
      { value: "repositionnement", label: "Nouvelle marque ou nouveau positionnement" },
      { value: "technique", label: "Technologie devenue bloquante" }
    ]},
    { key: "anciennete_site", label: "Depuis quand le site actuel est-il en ligne ?", type: "select", required: true, options: [
      { value: "moins_2", label: "Moins de 2 ans" },
      { value: "2_5", label: "2 à 5 ans" },
      { value: "5_8", label: "5 à 8 ans" },
      { value: "8_plus", label: "Plus de 8 ans" },
      { value: "inconnu", label: "Je ne sais pas" }
    ]},
    { key: "plateforme_actuelle", label: "Sur quelle technologie ou plateforme fonctionne le site ?", type: "text", required: true, placeholder: "WordPress, Shopify, Webflow, développement sur mesure..." },
    { key: "objectifs_refonte", label: "Quels résultats attendez-vous de la refonte ?", type: "checkbox", required: true, options: [
      { value: "credibilite", label: "Améliorer l’image et la crédibilité" },
      { value: "leads", label: "Générer plus de demandes" },
      { value: "ventes", label: "Augmenter les ventes" },
      { value: "mobile", label: "Améliorer le mobile" },
      { value: "seo", label: "Protéger ou développer le SEO" },
      { value: "autonomie", label: "Rendre les équipes autonomes" },
      { value: "performance", label: "Améliorer vitesse et stabilité" },
      { value: "evolution", label: "Préparer de nouvelles fonctionnalités" }
    ]},
    { key: "donnees_disponibles", label: "Quelles données de performance sont disponibles ?", type: "checkbox", required: true, options: [
      { value: "analytics", label: "Analytics / trafic" },
      { value: "search_console", label: "Search Console / SEO" },
      { value: "heatmaps", label: "Heatmaps ou enregistrements" },
      { value: "crm", label: "Données CRM / leads" },
      { value: "ventes", label: "Données de ventes" },
      { value: "feedback", label: "Retours utilisateurs" },
      { value: "aucune", label: "Aucune donnée exploitable" }
    ]},
    { key: "pages_critiques", label: "Quelles pages ou parcours sont les plus importants ?", type: "textarea", required: true, placeholder: "Accueil, services, catalogue, formulaire, espace client, paiement..." },
    { key: "problemes_utilisateurs", label: "Quels problèmes les utilisateurs ou équipes signalent-ils ?", type: "textarea", required: true, placeholder: "Difficulté à trouver une information, erreurs, lenteur, formulaires abandonnés..." },
    { key: "contenus_migration", label: "Quels contenus doivent être repris ?", type: "checkbox", required: true, options: [
      { value: "pages", label: "Pages institutionnelles" },
      { value: "articles", label: "Articles / actualités" },
      { value: "produits", label: "Produits ou offres" },
      { value: "medias", label: "Images, vidéos et documents" },
      { value: "comptes", label: "Comptes utilisateurs" },
      { value: "donnees", label: "Données métier" },
      { value: "aucun", label: "Aucun contenu à reprendre" }
    ]},
    { key: "integrations_existantes", label: "Quelles intégrations doivent être conservées ou remplacées ?", type: "checkbox", required: true, options: [
      { value: "crm", label: "CRM" },
      { value: "paiement", label: "Paiement" },
      { value: "newsletter", label: "Newsletter" },
      { value: "analytics", label: "Analytics / tracking" },
      { value: "erp", label: "ERP / outil métier" },
      { value: "agenda", label: "Prise de rendez-vous" },
      { value: "api", label: "API ou connecteurs" },
      { value: "aucune", label: "Aucune intégration" }
    ]},
    { key: "contraintes_seo", label: "Le site génère-t-il déjà du trafic organique important ?", type: "radio", required: true, options: yesNo },
    { key: "pages_seo", label: "Quelles pages ou requêtes SEO sont à protéger en priorité ?", type: "textarea", required: true, placeholder: "Pages les plus visitées, mots-clés, zones géographiques...", visibleWhen: { key: "contraintes_seo", equals: "oui" } },
    { key: "identite_refonte", label: "L’identité visuelle change-t-elle également ?", type: "select", required: true, options: [
      { value: "non", label: "Non, elle doit être conservée" },
      { value: "ajustement", label: "Elle doit être modernisée" },
      { value: "complete", label: "Une nouvelle identité est prévue" },
      { value: "a_definir", label: "À définir" }
    ]},
    { key: "mode_lancement", label: "Quel mode de lancement envisagez-vous ?", type: "select", required: true, options: [
      { value: "remplacement", label: "Remplacement complet en une fois" },
      { value: "progressif", label: "Migration progressive par sections" },
      { value: "optimisation", label: "Optimisations avant refonte complète" },
      { value: "a_definir", label: "À définir après audit" }
    ]},
    { key: "contraintes_calendrier", label: "Existe-t-il une date, campagne ou période à éviter ?", type: "textarea", required: true, placeholder: "Lancement de marque, haute saison, événement, clôture..." },
    { key: "equipe_validation", label: "Qui participe aux validations ?", type: "textarea", required: true, placeholder: "Direction, marketing, IT, commerce, communication..." },
    { key: "critere_reussite_refonte", label: "Quels indicateurs permettront de valider la réussite de la refonte ?", type: "textarea", required: true, placeholder: "Vitesse, trafic SEO, conversion, autonomie, baisse des erreurs..." }
  ],
  "landing-page-conversion": [
    { key: "objectif_conversion", label: "Quelle est l’action principale attendue ?", type: "radio", required: true, options: [
      { value: "lead", label: "Recevoir une demande qualifiée" },
      { value: "rendez_vous", label: "Obtenir une prise de rendez-vous" },
      { value: "inscription", label: "Générer une inscription" },
      { value: "achat", label: "Vendre directement" },
      { value: "reservation", label: "Obtenir une réservation" },
      { value: "liste_attente", label: "Constituer une liste d’attente" }
    ]},
    { key: "offre_promue", label: "Quelle offre ou campagne la page doit-elle soutenir ?", type: "textarea", required: true, placeholder: "Décrivez l’offre, son prix éventuel, sa durée et son principal bénéfice." },
    { key: "audience_cible", label: "À qui la campagne s’adresse-t-elle précisément ?", type: "textarea", required: true, placeholder: "Profil, secteur, situation, besoin, niveau de connaissance de l’offre..." },
    { key: "source_trafic", label: "D’où viendra principalement le trafic ?", type: "checkbox", required: true, options: [
      { value: "meta_ads", label: "Meta Ads" },
      { value: "google_ads", label: "Google Ads" },
      { value: "linkedin_ads", label: "LinkedIn Ads" },
      { value: "email", label: "Email / newsletter" },
      { value: "reseaux", label: "Réseaux sociaux organiques" },
      { value: "partenaires", label: "Partenaires / affiliation" },
      { value: "qr", label: "QR code / campagne physique" },
      { value: "autre", label: "Autre canal" }
    ]},
    { key: "volume_trafic", label: "Quel volume de visiteurs prévoyez-vous par mois ?", type: "select", required: true, options: [
      { value: "moins_500", label: "Moins de 500" },
      { value: "500_5000", label: "500 à 5 000" },
      { value: "5000_50000", label: "5 000 à 50 000" },
      { value: "50000_plus", label: "Plus de 50 000" },
      { value: "inconnu", label: "À estimer" }
    ]},
    { key: "promesse_actuelle", label: "Quelle promesse utilisez-vous actuellement ?", type: "textarea", required: true, placeholder: "La phrase ou idée principale présentée à vos prospects." },
    { key: "objections", label: "Quelles sont les principales hésitations avant de passer à l’action ?", type: "textarea", required: true, placeholder: "Prix, confiance, délai, risque, complexité, comparaison..." },
    { key: "preuves_disponibles", label: "Quelles preuves pouvez-vous montrer ?", type: "checkbox", required: true, options: [
      { value: "temoignages", label: "Témoignages clients" },
      { value: "cas_clients", label: "Études de cas" },
      { value: "chiffres", label: "Résultats chiffrés" },
      { value: "logos", label: "Logos clients ou partenaires" },
      { value: "demo", label: "Démonstration ou aperçu" },
      { value: "garantie", label: "Garantie ou engagement" },
      { value: "aucune", label: "Aucune preuve prête pour le moment" }
    ]},
    { key: "formulaire_champs", label: "Quelles informations doivent être demandées au prospect ?", type: "checkbox", required: true, options: [
      { value: "nom", label: "Nom" },
      { value: "email", label: "Email" },
      { value: "telephone", label: "Téléphone" },
      { value: "entreprise", label: "Entreprise" },
      { value: "budget", label: "Budget" },
      { value: "besoin", label: "Description du besoin" },
      { value: "questions_qualification", label: "Questions de qualification" }
    ]},
    { key: "destination_leads", label: "Où doivent arriver les conversions ?", type: "checkbox", required: true, options: [
      { value: "email", label: "Email" },
      { value: "crm", label: "CRM" },
      { value: "agenda", label: "Outil de rendez-vous" },
      { value: "paiement", label: "Paiement" },
      { value: "whatsapp", label: "WhatsApp" },
      { value: "automation", label: "Automatisation / workflow" }
    ]},
    { key: "tracking_existant", label: "Avez-vous déjà des outils de mesure en place ?", type: "checkbox", options: [
      { value: "ga4", label: "Google Analytics 4" },
      { value: "gtm", label: "Google Tag Manager" },
      { value: "meta_pixel", label: "Meta Pixel" },
      { value: "linkedin_insight", label: "LinkedIn Insight Tag" },
      { value: "crm", label: "Tracking CRM" },
      { value: "aucun", label: "Aucun" }
    ]},
    { key: "page_existante", label: "Existe-t-il déjà une landing page à améliorer ?", type: "radio", required: true, options: yesNo },
    { key: "url_landing", label: "Adresse de la page existante", type: "url", required: true, placeholder: "https://...", visibleWhen: { key: "page_existante", equals: "oui" } },
    { key: "performance_actuelle", label: "Quels résultats obtenez-vous actuellement ?", type: "textarea", required: true, placeholder: "Trafic, taux de conversion, coût par lead, ventes...", visibleWhen: { key: "page_existante", equals: "oui" } },
    { key: "assets_disponibles", label: "Quels éléments sont déjà prêts ?", type: "checkbox", required: true, options: [
      { value: "textes", label: "Textes" },
      { value: "visuels", label: "Visuels" },
      { value: "video", label: "Vidéo" },
      { value: "temoignages", label: "Témoignages" },
      { value: "identite", label: "Identité visuelle" },
      { value: "aucun", label: "Rien n’est encore prêt" }
    ]},
    { key: "variation_test", label: "Souhaitez-vous préparer plusieurs variantes à tester ?", type: "radio", required: true, options: yesNo },
    { key: "kpi_conversion", label: "Quel indicateur définira le succès de la campagne ?", type: "textarea", required: true, placeholder: "Ex. 100 leads qualifiés, coût par lead inférieur à..., 30 ventes..." }
  ],
  "ecommerce-marketplace": [
    { key: "modele_commercial", label: "Quel modèle souhaitez-vous mettre en place ?", type: "radio", required: true, options: [
      { value: "boutique", label: "Boutique d’une seule entreprise" },
      { value: "marketplace", label: "Marketplace avec plusieurs vendeurs" },
      { value: "b2b", label: "Commerce B2B / grossiste" },
      { value: "abonnement", label: "Produits ou services par abonnement" },
      { value: "mixte", label: "Modèle mixte à définir" }
    ]},
    { key: "produits_vendus", label: "Que souhaitez-vous vendre ?", type: "checkbox", required: true, options: [
      { value: "physiques", label: "Produits physiques" },
      { value: "numeriques", label: "Produits numériques" },
      { value: "services", label: "Services ou réservations" },
      { value: "abonnements", label: "Abonnements" },
      { value: "billetterie", label: "Billets ou accès" }
    ]},
    { key: "nombre_produits", label: "Combien de références prévoyez-vous au lancement ?", type: "select", required: true, options: [
      { value: "moins_50", label: "Moins de 50" },
      { value: "50_500", label: "50 à 500" },
      { value: "500_5000", label: "500 à 5 000" },
      { value: "5000_plus", label: "Plus de 5 000" }
    ]},
    { key: "nombre_vendeurs", label: "Combien de vendeurs prévoyez-vous au lancement ?", type: "select", required: true, visibleWhen: { key: "modele_commercial", equals: "marketplace" }, options: [
      { value: "moins_10", label: "Moins de 10" },
      { value: "10_100", label: "10 à 100" },
      { value: "100_plus", label: "Plus de 100" }
    ]},
    { key: "gestion_catalogue", label: "Comment le catalogue sera-t-il alimenté ?", type: "checkbox", required: true, options: [
      { value: "manuel", label: "Saisie manuelle dans le back-office" },
      { value: "import", label: "Import CSV / tableur" },
      { value: "erp", label: "Synchronisation ERP ou logiciel de stock" },
      { value: "vendeurs", label: "Ajout par les vendeurs" },
      { value: "api", label: "Alimentation par API" }
    ]},
    { key: "variantes", label: "Vos produits ont-ils des variantes complexes ?", type: "textarea", required: true, placeholder: "Tailles, couleurs, conditionnements, unités, options personnalisées..." },
    { key: "zones_vente", label: "Dans quelles zones souhaitez-vous vendre ?", type: "text", required: true, placeholder: "Pays, régions, villes ou zones de livraison." },
    { key: "monnaies", label: "Quelles monnaies doivent être acceptées ?", type: "text", required: true, placeholder: "Ex. EUR, USD, XOF, CDF..." },
    { key: "paiements", label: "Quels moyens de paiement souhaitez-vous proposer ?", type: "checkbox", required: true, options: [
      { value: "carte", label: "Carte bancaire" },
      { value: "mobile_money", label: "Mobile Money" },
      { value: "virement", label: "Virement bancaire" },
      { value: "livraison", label: "Paiement à la livraison" },
      { value: "wallet", label: "Portefeuille / crédit interne" },
      { value: "autre", label: "Autre moyen à étudier" }
    ]},
    { key: "livraison", label: "Comment les commandes seront-elles livrées ?", type: "checkbox", required: true, options: [
      { value: "transporteurs", label: "Transporteurs externes" },
      { value: "livraison_interne", label: "Équipe de livraison interne" },
      { value: "retrait", label: "Retrait en point de vente" },
      { value: "numerique", label: "Livraison numérique" },
      { value: "a_definir", label: "À définir" }
    ]},
    { key: "stock_existant", label: "Utilisez-vous déjà un outil de stock, ERP ou caisse ?", type: "radio", required: true, options: yesNo },
    { key: "outil_stock", label: "Quel outil utilisez-vous ?", type: "text", required: true, placeholder: "Nom de l’ERP, logiciel de caisse ou gestion de stock.", visibleWhen: { key: "stock_existant", equals: "oui" } },
    { key: "regles_marketplace", label: "Décrivez les règles vendeurs et commissions", type: "textarea", required: true, placeholder: "Inscription, validation, commission, reversement, responsabilités...", visibleWhen: { key: "modele_commercial", equals: "marketplace" } },
    { key: "site_existant_ecommerce", label: "Existe-t-il déjà une boutique ou des données à migrer ?", type: "radio", required: true, options: yesNo },
    { key: "migration_ecommerce", label: "Quelles données doivent être reprises ?", type: "checkbox", required: true, visibleWhen: { key: "site_existant_ecommerce", equals: "oui" }, options: [
      { value: "produits", label: "Produits et médias" },
      { value: "clients", label: "Comptes clients" },
      { value: "commandes", label: "Historique des commandes" },
      { value: "seo", label: "URLs et référencement" },
      { value: "promotions", label: "Promotions et règles tarifaires" }
    ]},
    { key: "volume_commandes", label: "Quel volume de commandes visez-vous par mois ?", type: "select", required: true, options: [
      { value: "moins_100", label: "Moins de 100" },
      { value: "100_1000", label: "100 à 1 000" },
      { value: "1000_10000", label: "1 000 à 10 000" },
      { value: "10000_plus", label: "Plus de 10 000" },
      { value: "inconnu", label: "À estimer" }
    ]},
    { key: "indicateurs", label: "Quels indicateurs voulez-vous suivre en priorité ?", type: "checkbox", required: true, options: [
      { value: "ca", label: "Chiffre d’affaires" },
      { value: "conversion", label: "Taux de conversion" },
      { value: "panier", label: "Panier moyen" },
      { value: "abandon", label: "Abandon de panier" },
      { value: "marge", label: "Marge" },
      { value: "vendeurs", label: "Performance des vendeurs" },
      { value: "stock", label: "Rotation et ruptures de stock" }
    ]},
    { key: "critere_reussite_ecommerce", label: "Quel résultat commercial définira la réussite du projet ?", type: "textarea", required: true, placeholder: "Volume de ventes, réduction des erreurs, nouveaux marchés, autonomie des équipes..." }
  ],
  "agent-vocal-ia": [{ key: "volume_appels", label: "Volume mensuel estimé d’appels", type: "select", required: true, options: [
    { value: "moins_500", label: "Moins de 500" }, { value: "500_5000", label: "500 à 5 000" }, { value: "5000_plus", label: "Plus de 5 000" }
  ]}],
  "cloud-devops-deploiement": [{ key: "environnements", label: "Quels environnements sont concernés ?", type: "checkbox", required: true, options: [
    { value: "dev", label: "Développement" }, { value: "staging", label: "Préproduction" }, { value: "prod", label: "Production" }
  ]}],
  "formation-ia-automatisation": [{ key: "participants", label: "Nombre estimé de participants", type: "select", required: true, options: [
    { value: "1_5", label: "1 à 5" }, { value: "6_20", label: "6 à 20" }, { value: "20_plus", label: "Plus de 20" }
  ]}]
};

export function getServiceFormConfig(service: ServiceDefinition): ServiceFormConfig {
  return {
    serviceSlug: service.slug,
    intro: `Ce formulaire est dédié au service « ${service.title} ». Vos réponses permettent de préparer un cadrage réellement adapté.`,
    projectType: service.pillarTitle,
    questions: ["site-web-professionnel", "ecommerce-marketplace", "landing-page-conversion", "refonte-optimisation", "reservation-portail-client"].includes(service.slug)
      ? serviceOverrides[service.slug]
      : [...(serviceOverrides[service.slug] ?? []), ...(pillarQuestions[service.pillarSlug] ?? [commonGoal])]
  };
}
