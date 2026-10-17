/* CAURI command room: do not use the cross-session persisted generic read cache for tenant-bound dashboards. */
export class CommandDataError extends Error {
  constructor(public readonly status: number) {
    super(status === 403 ? 'Accès non autorisé' : status === 401 ? 'Session non autorisée' : 'Source indisponible');
  }
}

export async function fetchFreshCommandData<T>(path: string, signal: AbortSignal): Promise<T> {
  const response = await fetch(`/api/service-ia${path}`, { cache: 'no-store', signal, credentials: 'same-origin' });
  if (!response.ok) throw new CommandDataError(response.status);
  return response.json() as Promise<T>;
}
