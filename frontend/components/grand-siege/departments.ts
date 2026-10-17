export type DepartmentKey = 'direction' | 'commerce' | 'finances' | 'operations' | 'organisation' | 'radar';
export type DepartmentSection = { label: string; href: string };
export type DepartmentDefinition = { id: DepartmentKey; name: string; mission: string; sections: readonly DepartmentSection[] };

/** Official backend department identifiers. AI is a transversal capability, not a department. */
export const DEPARTMENTS: readonly DepartmentDefinition[] = [
  { id: 'direction', name: 'Direction et pilotage', mission: 'Piloter les décisions et les actions stratégiques.', sections: [
    { label: 'Actions', href: '/espace/actions' },
    { label: 'Documents', href: '/espace/documents' },
    { label: 'Paramètres', href: '/espace/parametres' },
    { label: 'Abonnement', href: '/espace/parametres/facturation' },
    { label: 'Aide', href: '/espace/aide' },
  ] },
  { id: 'commerce', name: 'Commerce et ventes', mission: 'Développer les ventes et suivre les partenaires.', sections: [
    { label: 'Ventes', href: '/espace/ventes' },
    { label: 'Offres', href: '/espace/offres' },
    { label: 'Fournisseurs', href: '/espace/fournisseurs' },
    { label: 'WhatsApp', href: '/espace/whatsapp' },
  ] },
  { id: 'finances', name: 'Finances et trésorerie', mission: 'Suivre les mouvements, la trésorerie et les dépenses.', sections: [
    { label: 'Finances', href: '/espace/finance' },
    { label: 'Caisse', href: '/espace/caisse' },
    { label: 'Dépenses', href: '/espace/depenses' },
  ] },
  { id: 'operations', name: 'Opérations et procédures', mission: 'Suivre les procédures et les processus métier.', sections: [
    { label: 'Procédures', href: '/espace/procedures' },
    { label: 'Imports', href: '/espace/imports' },
  ] },
  { id: 'organisation', name: 'Membres et organisation', mission: 'Gérer les équipes, les présences et la structure de l’entreprise.', sections: [
    { label: 'Équipe', href: '/espace/equipe' },
    { label: 'Organisation', href: '/espace/organisation' },
    { label: 'Présences', href: '/espace/presence' },
    { label: 'Borne de présence', href: '/espace/presence/borne' },
  ] },
  { id: 'radar', name: 'Radar et contrôle', mission: 'Identifier les risques, les alertes et les validations.', sections: [
    { label: 'Radar', href: '/espace/radar' },
    { label: 'Validations', href: '/espace/validations' },
  ] },
] as const;

const routes = DEPARTMENTS.flatMap(department => department.sections.map(section => ({ department, section }))).sort((a, b) => b.section.href.length - a.section.href.length);
export function resolveDepartment(pathname: string): { department: DepartmentDefinition; section: DepartmentSection } | null {
  return routes.find(({ section }) => pathname === section.href || pathname.startsWith(`${section.href}/`)) ?? null;
}
