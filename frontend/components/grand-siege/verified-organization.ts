import { CommandDataError, fetchFreshCommandData } from './fresh-command-data';

const RETRY_DELAYS_MS = [750, 2000, 4500] as const;

export function isTransientOrganizationFailure(error: unknown): boolean {
  return error instanceof TypeError || (error instanceof CommandDataError && [500, 502, 503, 504].includes(error.status));
}

function waitBeforeRetry(delay: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, delay);
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

/** Recheck tenant identity on the server for every attempt. Never infer authorization from a previous session. */
export async function fetchVerifiedOrganization<T>(
  signal: AbortSignal,
  fetchIdentity: (signal: AbortSignal) => Promise<T> = (currentSignal) =>
    fetchFreshCommandData<T>('/organizations/current', currentSignal),
  retryDelays: readonly number[] = RETRY_DELAYS_MS,
): Promise<T> {
  for (let attempt = 0; ; attempt += 1) {
    if (signal.aborted) throw signal.reason ?? new DOMException('Aborted', 'AbortError');
    try {
      return await fetchIdentity(signal);
    } catch (error) {
      if (!isTransientOrganizationFailure(error) || signal.aborted || attempt >= retryDelays.length) throw error;
      await waitBeforeRetry(retryDelays[attempt], signal);
    }
  }
}
