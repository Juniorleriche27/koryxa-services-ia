// The browser only calls the same-origin gateway. Trusted identity headers and
// the backend secret are added server-side after KORYXA Identity validation.
const API_BASE = "/api/service-ia";

export class ServiceIaApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function serviceIaFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
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
    throw new ServiceIaApiError(payload?.error?.message ?? "Une erreur est survenue", response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
