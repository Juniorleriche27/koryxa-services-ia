const API_BASE = process.env.NEXT_PUBLIC_SERVICE_IA_API_URL ?? "http://localhost:8080/api/v1";

export class ServiceIaApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

function identityHeaders(): HeadersInit {
  if (typeof document === "undefined") return {};
  const tenant = document.documentElement.dataset.tenantId;
  const user = document.documentElement.dataset.userId;
  return {
    "X-Tenant-ID": tenant || "demo-tenant",
    "X-User-ID": user || "demo-user",
    "X-Koryxa-Source": "koryxa-services-ia",
  };
}

export async function serviceIaFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const isForm = init.body instanceof FormData;
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...identityHeaders(),
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
