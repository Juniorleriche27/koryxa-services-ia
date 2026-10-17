import { describe, expect, it } from 'vitest';
import { buildCommandEntries, selectCommandEntries, type CommandAction, type CommandAlert } from '@/components/grand-siege/command-center-data';

const actions: CommandAction[] = [
  { id: 'a1', title: 'Paiement à vérifier', description: null, priority: 'normal', status: 'todo', due_date: '2026-10-12', updated_at: '2026-10-10' },
  { id: 'a2', title: 'Dossier terminé', description: null, priority: 'critical', status: 'completed', due_date: '2026-10-01', updated_at: '2026-10-10' },
  { id: 'a3', title: 'Contacter le fournisseur', description: null, priority: 'high', status: 'blocked', due_date: '2026-10-30', updated_at: '2026-10-10' },
];
const alerts: CommandAlert[] = [
  { id: 'r1', title: 'Pièce manquante', explanation: 'Vérification nécessaire', priority: 'critical', status: 'open', created_at: '2026-10-12' },
  { id: 'r2', title: 'Signal résolu', explanation: 'Déjà traité', priority: 'critical', status: 'resolved', created_at: '2026-10-12' },
];

describe('CAURI — centre de commandement', () => {
  it('ne montre que les alertes et actions non clôturées', () => {
    const result = buildCommandEntries(actions, alerts, '2026-10-16');
    expect(result.map(e => e.id)).toEqual(['action:a1', 'alert:r1', 'action:a3']);
  });
  it('repère les échéances dépassées et préserve les accès métier', () => {
    const result = buildCommandEntries(actions, alerts, '2026-10-16');
    expect(result[0].overdue).toBe(true);
    expect(result.find(e => e.type === 'alert')?.href).toBe('/espace/radar');
    expect(result.find(e => e.type === 'action')?.href).toBe('/espace/actions');
  });
  it('filtre les priorités sans inventer d’alertes', () => {
    const result = buildCommandEntries(actions, alerts, '2026-10-16');
    expect(selectCommandEntries(result, 'urgent').length).toBe(3);
    expect(buildCommandEntries([], [], '2026-10-16')).toEqual([]);
  });
});
