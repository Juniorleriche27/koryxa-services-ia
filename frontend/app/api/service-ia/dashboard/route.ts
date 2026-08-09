import { NextResponse } from "next/server";

import { requireServiceIaIdentity } from "@/lib/auth-server";

function backendUrl() {
  return (process.env.SERVICE_IA_API_URL || process.env.NEXT_PUBLIC_SERVICE_IA_API_URL || "")
    .trim()
    .replace(/\/$/, "");
}

export async function GET() {
  const apiBase = backendUrl();
  const proxySecret = (process.env.SERVICE_IA_PROXY_SECRET || "").trim();
  if (!apiBase || !proxySecret) {
    return NextResponse.json(
      { error: { message: "Passerelle Service IA non configurée." } },
      { status: 503 },
    );
  }

  try {
    const identity = await requireServiceIaIdentity();
    const headers = new Headers({
      Accept: "application/json",
      "X-Tenant-ID": `service-ia-${identity.koryxaUserId}`,
      "X-User-ID": identity.koryxaUserId,
      "X-User-Email": identity.email,
      "X-Koryxa-Source": "koryxa-services-ia",
      "X-Koryxa-Auth-Provider": "koryxa-identity",
      "X-Koryxa-Role": identity.projectAccess.role || "member",
      "X-Koryxa-Permissions": "service-ia:read,service-ia:write",
      "X-Koryxa-Proxy-Secret": proxySecret,
    });

    let organizationResponse = await fetch(`${apiBase}/organizations/current`, {
      headers,
      cache: "no-store",
    });
    if (organizationResponse.status === 404) {
      const provisionHeaders = new Headers(headers);
      provisionHeaders.set("Content-Type", "application/json");
      const slugSuffix = identity.koryxaUserId
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const provisionResponse = await fetch(`${apiBase}/organizations`, {
        method: "POST",
        headers: provisionHeaders,
        body: JSON.stringify({
          name: identity.fullName?.trim() || identity.email.split("@")[0],
          slug: `service-ia-${slugSuffix}`.slice(0, 100),
        }),
        cache: "no-store",
      });
      if (!provisionResponse.ok && provisionResponse.status !== 409) {
        throw new Error(`organization provisioning responded with ${provisionResponse.status}`);
      }
      organizationResponse = await fetch(`${apiBase}/organizations/current`, {
        headers,
        cache: "no-store",
      });
    }
    if (!organizationResponse.ok) {
      throw new Error(`organizations/current responded with ${organizationResponse.status}`);
    }
    const organization = await organizationResponse.json();

    const paths = {
      summary: "registers/summary",
      alerts: "radar/alerts",
      actions: "workflow/actions",
    } as const;
    const entries = await Promise.all(
      Object.entries(paths).map(async ([key, path]) => {
        const response = await fetch(`${apiBase}/${path}`, { headers, cache: "no-store" });
        if (!response.ok) throw new Error(`${path} responded with ${response.status}`);
        return [key, await response.json()] as const;
      }),
    );
    return NextResponse.json({ ...Object.fromEntries(entries), organization }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    const unauthenticated = error instanceof Error && error.message === "UNAUTHENTICATED";
    console.error("Service IA dashboard request failed", {
      reason: error instanceof Error ? error.message : "Unknown dashboard error",
    });
    return NextResponse.json(
      {
        error: {
          message: unauthenticated
            ? "Authentification KORYXA requise."
            : "Service KORYXA temporairement indisponible.",
        },
      },
      { status: unauthenticated ? 401 : 502 },
    );
  }
}
