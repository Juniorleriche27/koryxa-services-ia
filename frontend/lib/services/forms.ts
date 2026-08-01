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
  "ecommerce-marketplace": [{ key: "nombre_produits", label: "Combien de produits ou vendeurs prévoyez-vous ?", type: "select", required: true, options: [
    { value: "moins_50", label: "Moins de 50" }, { value: "50_500", label: "50 à 500" }, { value: "500_plus", label: "Plus de 500" }
  ]}],
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
    questions: [...(serviceOverrides[service.slug] ?? []), ...(pillarQuestions[service.pillarSlug] ?? [commonGoal])]
  };
}
