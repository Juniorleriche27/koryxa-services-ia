import { afterEach, describe, expect, it, vi } from "vitest";

import {
  serviceIaFetch,
  setActiveCacheTenant,
  getActiveCacheTenant,
  getPersistedCache,
  setPersistedCache,
  clearPersistedCache,
} from "@/lib/service-ia/api";

afterEach(() => {
  vi.unstubAllGlobals();
  clearPersistedCache();
  setActiveCacheTenant(null);
});

describe("serviceIaFetch read cache", () => {
  it("deduplicates concurrent and repeated reads", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ name: "KORYXA" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const path = `/organizations/current?test=${crypto.randomUUID()}`;

    const [first, second] = await Promise.all([
      serviceIaFetch<{ name: string }>(path),
      serviceIaFetch<{ name: string }>(path),
    ]);
    const third = await serviceIaFetch<{ name: string }>(path);

    expect(first.name).toBe("KORYXA");
    expect(second).toEqual(first);
    expect(third).toEqual(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("invalidates cached reads after a mutation", async () => {
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) =>
      new Response(JSON.stringify(init?.method === "PATCH" ? { updated: true } : { value: 1 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const path = `/registers/offers?test=${crypto.randomUUID()}`;

    await serviceIaFetch(path);
    await serviceIaFetch(path, { method: "PATCH", body: JSON.stringify({ name: "Audit" }) });
    await serviceIaFetch(path);

    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

describe("multi-tenant cache isolation", () => {
  it("isolates persisted cache between different tenants", () => {
    const path = "/registers/sales";
    const dataOrgA = [{ id: "sale-1", amount: 15000 }];
    const dataOrgB = [{ id: "sale-2", amount: 99000 }];

    setActiveCacheTenant("org-alpha");
    setPersistedCache(path, dataOrgA);

    expect(getPersistedCache(path)).toEqual(dataOrgA);

    // Switch to another tenant: must NOT see Org Alpha data
    setActiveCacheTenant("org-beta");
    expect(getPersistedCache(path)).toBeNull();

    setPersistedCache(path, dataOrgB);
    expect(getPersistedCache(path)).toEqual(dataOrgB);

    // Switch back to Org Alpha: must see its own data
    setActiveCacheTenant("org-alpha");
    expect(getPersistedCache(path)).toEqual(dataOrgA);
  });

  it("purges in-memory read cache when switching tenants", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ tenantScope: getActiveCacheTenant() }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    const path = "/dashboard/summary";

    setActiveCacheTenant("org-alpha");
    const readA = await serviceIaFetch<{ tenantScope: string }>(path);
    expect(readA.tenantScope).toBe("org-alpha");

    // Repeat read in same tenant: hits cache, fetch not called again
    await serviceIaFetch<{ tenantScope: string }>(path);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Switch tenant: cache is purged, new fetch must be made
    setActiveCacheTenant("org-beta");
    const readB = await serviceIaFetch<{ tenantScope: string }>(path);
    expect(readB.tenantScope).toBe("org-beta");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
