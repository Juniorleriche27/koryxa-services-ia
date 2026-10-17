export type CommandPriority = 'low' | 'normal' | 'high' | 'critical';
export type CommandAction = { id: string; title: string; description: string | null; priority: CommandPriority; status: string; due_date: string | null; updated_at: string };
export type CommandAlert = { id: string; title: string; explanation: string; priority: CommandPriority; status: string; created_at: string };
export type CommandEntry = { id: string; type: 'action' | 'alert'; title: string; summary: string; priority: CommandPriority; date: string | null; href: string; overdue: boolean };

const PRIORITY_ORDER: Record<CommandPriority, number> = { critical: 0, high: 1, normal: 2, low: 3 };
export function priorityLabel(priority: CommandPriority): string {
  return ({ critical: 'Critique', high: 'Haute', normal: 'Normale', low: 'Basse' })[priority];
}

/** Nothing is invented; the actual workflow and radar records are the source of truth. */
export function buildCommandEntries(actions: readonly CommandAction[], alerts: readonly CommandAlert[], today: string): CommandEntry[] {
  const work = actions.filter(item => ['todo', 'in_progress', 'blocked'].includes(item.status)).map((item): CommandEntry => ({
    id: `action:${item.id}`, type: 'action', title: item.title, summary: item.description || 'Action à traiter',
    priority: item.priority, date: item.due_date, href: '/espace/actions', overdue: Boolean(item.due_date && item.due_date < today),
  }));
  const signals = alerts.filter(item => ['open', 'acknowledged'].includes(item.status)).map((item): CommandEntry => ({
    id: `alert:${item.id}`, type: 'alert', title: item.title, summary: item.explanation,
    priority: item.priority, date: item.created_at, href: '/espace/radar', overdue: false,
  }));
  return [...work, ...signals].sort((a,b) => Number(b.overdue) - Number(a.overdue) || PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.title.localeCompare(b.title, 'fr'));
}

export function selectCommandEntries(entries: readonly CommandEntry[], selection: 'all' | 'urgent', count = 5): CommandEntry[] {
  return entries.filter(item => selection === 'all' || item.overdue || item.priority === 'critical' || item.priority === 'high').slice(0, count);
}
