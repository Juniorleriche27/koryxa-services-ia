// The browser only calls the same-origin gateway. Trusted identity headers and
// the backend secret are added server-side after KORYXA Identity validation.
const API_BASE = "/api/service-ia";
const READ_CACHE_TTL_MS = 30_000;
const readCache = new Map<string, { value: unknown; expiresAt: number }>();
const pendingReads = new Map<string, Promise<unknown>>();
let cacheVersion = 0;

export class ServiceIaApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function serviceIaFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method || "GET").toUpperCase();
  const cacheable = method === "GET" && !init.body;
  if (cacheable) {
    const cached = readCache.get(path);
    if (cached && cached.expiresAt > Date.now()) return cached.value as T;
    if (cached) readCache.delete(path);
    const pending = pendingReads.get(path);
    if (pending) return pending as Promise<T>;
  } else {
    cacheVersion += 1;
    readCache.clear();
  }

  const execute = async (): Promise<T> => {
    const isForm = init.body instanceof FormData;
    const response = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        ...(isForm ? {} : { "Content-Type": "application/json" }),
        ...init.headers,
      },
      cache: "no-store",
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => null);
      throw new ServiceIaApiError(
        payload?.error?.message ?? "Une erreur est survenue",
        response.status,
      );
    }
    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  };

  if (!cacheable) return execute();
  const version = cacheVersion;
  const pending = execute().then(value => {
    if (version === cacheVersion) {
      readCache.set(path, { value, expiresAt: Date.now() + READ_CACHE_TTL_MS });
    }
    return value;
  }).finally(() => pendingReads.delete(path));
  pendingReads.set(path, pending);
  return pending;
}
