// The browser only calls the same-origin gateway. Trusted identity headers and
// the backend secret are added server-side after KORYXA Identity validation.
const API_BASE = "/api/service-ia";
const READ_CACHE_TTL_MS = 60_000;
const readCache = new Map<string, { value: unknown; expiresAt: number }>();
const pendingReads = new Map<string, Promise<unknown>>();
let cacheVersion = 0;
let currentTenantScope: string | null = null;

export class ServiceIaApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/**
 * Configure the active tenant/organization scope for cache isolation.
 * Automatically purges in-memory read cache when switching tenants to prevent cross-tenant data leaks.
 */
export function setActiveCacheTenant(tenantId: string | null): void {
  const normalized = tenantId?.trim() || null;
  if (currentTenantScope !== normalized) {
    readCache.clear();
    pendingReads.clear();
    currentTenantScope = normalized;
  }
}

export function getActiveCacheTenant(): string | null {
  return currentTenantScope;
}

function buildCacheKey(prefix: "koryxa_lcache" | "koryxa_cache", path: string, tenantId?: string | null): string {
  const scope = tenantId !== undefined ? (tenantId?.trim() || "global") : (currentTenantScope || "global");
  return `${prefix}:${scope}:${path}`;
}

export function getPersistedCache<T>(path: string, tenantId?: string | null): T | null {
  if (typeof window === "undefined") return null;
  const lKey = buildCacheKey("koryxa_lcache", path, tenantId);
  const sKey = buildCacheKey("koryxa_cache", path, tenantId);
  try {
    // Check localStorage first for instant hydration across reloads & visits
    const raw = window.localStorage.getItem(lKey) || window.sessionStorage.getItem(sKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.expiresAt && parsed.expiresAt > Date.now()) {
      return parsed.value as T;
    }
    window.localStorage.removeItem(lKey);
    window.sessionStorage.removeItem(sKey);
  } catch {
    // Ignore storage issues
  }
  return null;
}

export function setPersistedCache<T>(path: string, value: T, ttlMs = 600_000, tenantId?: string | null): void {
  if (typeof window === "undefined") return;
  const lKey = buildCacheKey("koryxa_lcache", path, tenantId);
  const sKey = buildCacheKey("koryxa_cache", path, tenantId);
  try {
    const payload = JSON.stringify({ value, expiresAt: Date.now() + ttlMs });
    window.localStorage.setItem(lKey, payload);
    window.sessionStorage.setItem(sKey, payload);
  } catch {
    // Ignore storage issues
  }
}

/**
 * Clears cached data.
 * If tenantId is provided, clears only keys for that specific tenant.
 * If tenantId is omitted, clears all koryxa cached data across all scopes (e.g. on logout).
 */
export function clearPersistedCache(tenantId?: string | null): void {
  if (typeof window === "undefined") return;
  try {
    readCache.clear();
    pendingReads.clear();

    const targetPrefix = tenantId ? `koryxa_lcache:${tenantId}:` : "koryxa_lcache:";
    const targetSessionPrefix = tenantId ? `koryxa_cache:${tenantId}:` : "koryxa_cache:";

    const keysToRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith(targetPrefix)) keysToRemove.push(k);
    }
    keysToRemove.forEach((k) => window.localStorage.removeItem(k));

    const sessionKeys: string[] = [];
    for (let i = 0; i < window.sessionStorage.length; i++) {
      const k = window.sessionStorage.key(i);
      if (k && k.startsWith(targetSessionPrefix)) sessionKeys.push(k);
    }
    sessionKeys.forEach((k) => window.sessionStorage.removeItem(k));
  } catch {
    // Ignore
  }
}

export async function serviceIaFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method || "GET").toUpperCase();
  const cacheable = method === "GET" && !init.body;
  const inMemoryKey = `${currentTenantScope || "global"}:${path}`;

  if (cacheable) {
    const cached = readCache.get(inMemoryKey);
    if (cached && cached.expiresAt > Date.now()) return cached.value as T;
    if (cached) readCache.delete(inMemoryKey);

    const persisted = getPersistedCache<T>(path);
    if (persisted) {
      readCache.set(inMemoryKey, { value: persisted, expiresAt: Date.now() + READ_CACHE_TTL_MS });
      return persisted;
    }

    const pending = pendingReads.get(inMemoryKey);
    if (pending) return pending as Promise<T>;
  } else {
    cacheVersion += 1;
    readCache.clear();
    clearPersistedCache(currentTenantScope);
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
    const json = (await response.json()) as T;
    if (cacheable) {
      setPersistedCache(path, json);
    }
    return json;
  };

  if (!cacheable) return execute();
  const version = cacheVersion;
  const pending = execute()
    .then((value) => {
      if (version === cacheVersion) {
        readCache.set(inMemoryKey, { value, expiresAt: Date.now() + READ_CACHE_TTL_MS });
      }
      return value;
    })
    .finally(() => pendingReads.delete(inMemoryKey));
  pendingReads.set(inMemoryKey, pending);
  return pending;
}
