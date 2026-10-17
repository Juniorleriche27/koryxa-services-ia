import type { DepartmentKey } from './departments';

export const CAURI_AI_OPEN_EVENT = 'cauri:open-intelligence';

/** User-editable, non-sensitive questions only. The backend resolves the current tenant context. */
export const INTELLIGENCE_PROMPTS: Readonly<Record<DepartmentKey | 'hall', string>> = {
  hall: 'Fais une synthèse de la situation de mon entreprise à partir des données auxquelles j’ai accès. Distingue les faits vérifiés des données manquantes et indique les priorités à examiner.',
  direction: 'Aide-moi à identifier les décisions de direction prioritaires à partir des données disponibles pour mon organisation. Indique les limites de l’analyse.',
  commerce: 'Aide-moi à examiner la situation commerciale de mon entreprise en utilisant uniquement les informations disponibles. Quelles ventes ou relances méritent mon attention ?',
  finances: 'Aide-moi à comprendre la situation financière de mon entreprise à partir des données accessibles, sans supposer de montants ni confondre les devises.',
  operations: 'Aide-moi à identifier les points de suivi dans les opérations, les procédures et les présences, selon les informations réellement disponibles.',
  organisation: 'Aide-moi à examiner la gestion des membres, des équipes et des présences, uniquement à partir des données auxquelles j’ai accès.',
  radar: 'Aide-moi à comprendre les alertes du Radar et les validations à examiner. Distingue bien alertes ouvertes et incidents résolus.',
};

export function createIntelligenceRequest(context: DepartmentKey | 'hall'): { prompt: string } {
  return { prompt: INTELLIGENCE_PROMPTS[context] };
}
