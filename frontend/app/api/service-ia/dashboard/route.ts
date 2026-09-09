import { NextResponse } from "next/server";

import { requireServiceIaIdentity } from "@/lib/auth-server";

// Pin Vercel function to Frankfurt — closest region to the Netcup VPS (Germany).
// This alone saves ~80-150 ms of cross-region latency on every cold call.
export const preferredRegion = "fra1";
export const runtime = "nodejs";

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
      { error: { message: "Passerelle Service IA non configuree." } },
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

    // Single round-trip: backend runs asyncio.gather() for all queries in parallel.
    // Previously 4 separate fetch() calls; now 1 TCP connection, 1 round-trip.
    const response = await fetch(`${apiBase}/dashboard`, {
      headers,
      cache: "no-store",
    });

    // Auto-provision org on first visit (404 = org not yet created for this user)
    if (response.status === 404) {
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
      // Retry dashboard after provisioning
      const retry = await fetch(`${apiBase}/dashboard`, { headers, cache: "no-store" });
      if (!retry.ok) {
        throw new Error(`dashboard retry responded with ${retry.status}`);
      }
      const data = await retry.json();
      return NextResponse.json(data, {
        headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=60" },
      });
    }

    if (!response.ok) {
      throw new Error(`dashboard responded with ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "private, max-age=10, stale-while-revalidate=60" },
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
