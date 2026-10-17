export type HallMetric = { value: string | null; currency?: string | null; status: string; reason?: string | null };

/** Monetary JSON values are decimal strings. Never coerce them through JS Number. */
export function formatHallMoney(metric: HallMetric | undefined): string {
  if (!metric || metric.status !== 'calculable' || metric.value == null || !metric.currency) return '—';
  const match = /^(-?)(\d+)(?:\.(\d+))?$/.exec(String(metric.value));
  if (!match || !/^[A-Z]{3}$/.test(metric.currency)) return '—';
  const [, sign, integer, fraction = ''] = match;
  // Monetary indicator cards present whole currency units, rounded half-up.
  const rounded = BigInt(integer) + (fraction.charAt(0) >= '5' ? BigInt(1) : BigInt(0));
  const displayed = (sign === '-' && rounded !== BigInt(0) ? '-' : '') + rounded.toLocaleString('fr-FR');
  return `${displayed} ${metric.currency}`;
}

export function hallMetricDetail(metric: HallMetric | undefined): string {
  if (!metric) return 'Indicateur indisponible';
  if (metric.status !== 'calculable') return metric.reason || `Indicateur ${metric.status}`;
  return 'Indicateur calculé à partir des registres disponibles';
}
