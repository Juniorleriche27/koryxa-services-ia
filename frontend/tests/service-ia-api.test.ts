import { afterEach, describe, expect, it, vi } from "vitest";

import { serviceIaFetch } from "@/lib/service-ia/api";

afterEach(() => vi.unstubAllGlobals());

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
