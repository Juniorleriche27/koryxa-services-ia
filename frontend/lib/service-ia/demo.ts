import type { CorrectiveAction, Metric, RadarAlert, RegisterItem } from "./types";

export const metrics: Metric[] = [
  { label: "Complétude", value: "82%", detail: "+7 points ce mois", tone: "positive" },
  { label: "Fraîcheur", value: "74%", detail: "6 éléments à réviser", tone: "warning" },
  { label: "Cohérence", value: "91%", detail: "2 contradictions", tone: "positive" },
  { label: "Traçabilité", value: "88%", detail: "4 validations en attente", tone: "neutral" },
];

export const offers: RegisterItem[] = [
  { id: "1", title: "Audit digital PME", subtitle: "Conseil", status: "Validé", meta: "Mis à jour aujourd’hui", value: "150 000 XOF" },
  { id: "2", title: "Formation IA équipe", subtitle: "Formation", status: "À vérifier", meta: "Expire dans 12 jours", value: "350 000 XOF" },
  { id: "3", title: "Automatisation commerciale", subtitle: "Automatisation", status: "Brouillon", meta: "Responsable non défini", value: "Sur devis" },
];

export const sales: RegisterItem[] = [
  { id: "1", title: "V-2026-0184", subtitle: "Kalo Distribution", status: "Payée", meta: "2 août 2026", value: "650 000 XOF" },
  { id: "2", title: "V-2026-0183", subtitle: "Atelier Nimba", status: "Partielle", meta: "1 août 2026", value: "280 000 XOF" },
  { id: "3", title: "V-2026-0182", subtitle: "Client non renseigné", status: "À vérifier", meta: "31 juillet 2026", value: "95 000 XOF" },
];

export const procedures: RegisterItem[] = [
  { id: "1", title: "Accueil d’un nouveau client", subtitle: "Opérations", status: "Validée", meta: "5 étapes · Révision octobre" },
  { id: "2", title: "Validation d’un tarif exceptionnel", subtitle: "Commercial", status: "À réviser", meta: "Responsable : Aïcha" },
  { id: "3", title: "Traitement des réclamations", subtitle: "Support", status: "Brouillon", meta: "Aucune étape" },
];

export const alerts: RadarAlert[] = [
  { id: "1", title: "Montant incohérent", explanation: "La vente V-2026-0183 diffère du calcul attendu de 45 000 XOF.", priority: "Haute", dimension: "Cohérence", status: "Ouverte" },
  { id: "2", title: "Procédure à réviser", explanation: "La procédure de validation tarifaire a dépassé sa date de révision.", priority: "Haute", dimension: "Fraîcheur", status: "Reconnue" },
  { id: "3", title: "Client manquant", explanation: "Une vente exige l’identification du client selon la configuration actuelle.", priority: "Normale", dimension: "Complétude", status: "Ouverte" },
];

export const actions: CorrectiveAction[] = [
  { id: "1", title: "Vérifier la vente V-2026-0183", status: "En cours", priority: "Haute", responsible_user_id: "Mariam", due_date: "2026-08-04" },
  { id: "2", title: "Réviser la procédure tarifaire", status: "À faire", priority: "Haute", responsible_user_id: "Aïcha", due_date: "2026-08-06" },
  { id: "3", title: "Compléter les informations client", status: "Bloquée", priority: "Normale", responsible_user_id: "Ibrahim", due_date: "2026-08-03" },
];
