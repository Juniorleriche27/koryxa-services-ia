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

    // Run all data fetches in parallel concurrently in a single roundtrip
    const paths = {
      organization: "organizations/current",
      summary: "registers/summary",
      alerts: "radar/alerts",
      actions: "workflow/actions",
    } as const;

    const entries = await Promise.all(
      Object.entries(paths).map(async ([key, path]) => {
        const response = await fetch(`${apiBase}/${path}`, { headers, cache: "no-store" });
        if (response.status === 404 && key === "organization") {
          return [key, null] as const;
        }
        if (!response.ok) {
          throw new Error(`${path} responded with ${response.status}`);
        }
        return [key, await response.json()] as const;
      }),
    );
    const dataMap = Object.fromEntries(entries);

    // Auto-provision only if organization is genuinely missing (first visit)
    let organization = dataMap.organization;
    if (!organization) {
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
      const orgRes = await fetch(`${apiBase}/organizations/current`, {
        headers,
        cache: "no-store",
      });
      if (orgRes.ok) {
        organization = await orgRes.json();
      }
    }

    return NextResponse.json(
      {
        summary: dataMap.summary,
        alerts: dataMap.alerts,
        actions: dataMap.actions,
        organization: organization || { name: "Organisation KORYXA" },
      },
      {
        headers: { "Cache-Control": "private, no-store" },
      },
    );
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
