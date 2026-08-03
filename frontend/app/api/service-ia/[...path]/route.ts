import { NextResponse, type NextRequest } from "next/server";

import { requireServiceIaIdentity } from "@/lib/auth-server";

const ALLOWED_METHODS = new Set(["GET", "POST", "PATCH", "PUT", "DELETE"]);
const BLOCKED_REQUEST_HEADERS = new Set([
  "connection",
  "content-length",
  "cookie",
  "host",
  "transfer-encoding",
  "x-koryxa-auth-provider",
  "x-koryxa-permissions",
  "x-koryxa-proxy-secret",
  "x-koryxa-role",
  "x-koryxa-source",
  "x-tenant-id",
  "x-user-email",
  "x-user-id",
]);

function backendUrl() {
  return (process.env.SERVICE_IA_API_URL || process.env.NEXT_PUBLIC_SERVICE_IA_API_URL || "")
    .trim()
    .replace(/\/$/, "");
}

async function forward(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  if (!ALLOWED_METHODS.has(request.method)) {
    return NextResponse.json({ error: { message: "Méthode indisponible." } }, { status: 405 });
  }

  const apiBase = backendUrl();
  const proxySecret = (process.env.SERVICE_IA_PROXY_SECRET || "").trim();
  if (!apiBase || !proxySecret) {
    return NextResponse.json({ error: { message: "Passerelle Service IA non configurée." } }, { status: 503 });
  }

  try {
    const identity = await requireServiceIaIdentity();
    const { path } = await context.params;
    const cleanPath = path.join("/").replace(/^\/+/, "");
    if (!cleanPath || cleanPath.includes("..")) {
      return NextResponse.json({ error: { message: "Chemin API invalide." } }, { status: 400 });
    }

    const sourceUrl = new URL(request.url);
    const target = new URL(`${apiBase}/${cleanPath}`);
    target.search = sourceUrl.search;

    const headers = new Headers();
    for (const [key, value] of request.headers) {
      if (!BLOCKED_REQUEST_HEADERS.has(key.toLowerCase())) headers.set(key, value);
    }
    const tenantId = `service-ia-${identity.koryxaUserId}`;
    headers.set("X-Tenant-ID", tenantId);
    headers.set("X-User-ID", identity.koryxaUserId);
    headers.set("X-User-Email", identity.email);
    headers.set("X-Koryxa-Source", "koryxa-services-ia");
    headers.set("X-Koryxa-Auth-Provider", "koryxa-identity");
    headers.set("X-Koryxa-Role", identity.projectAccess.role || "member");
    headers.set("X-Koryxa-Permissions", "service-ia:read,service-ia:write");
    headers.set("X-Koryxa-Proxy-Secret", proxySecret);

    const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer();
    let response = await fetch(target, { method: request.method, headers, body, cache: "no-store" });

    // Provision only after a genuine missing-organization response. Healthy
    // requests no longer pay for an organization preflight on every API call.
    if (response.status === 404 && cleanPath !== "invitations/accept") {
      const organizationResponse = await fetch(`${apiBase}/organizations/current`, {
        headers,
        cache: "no-store",
      });
      if (organizationResponse.status === 404) {
        const provisionHeaders = new Headers(headers);
        provisionHeaders.set("content-type", "application/json");
        const slugSuffix = identity.koryxaUserId.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const provisionResponse = await fetch(`${apiBase}/organizations`, {
          method: "POST",
          headers: provisionHeaders,
          body: JSON.stringify({
            name: identity.fullName?.trim() || identity.email.split("@")[0] || "Organisation KORYXA",
            slug: `service-ia-${slugSuffix}`.slice(0, 100),
          }),
          cache: "no-store",
        });
        if (!provisionResponse.ok && provisionResponse.status !== 409) {
          throw new Error(`Service IA provisioning responded with ${provisionResponse.status}`);
        }
        response = await fetch(target, { method: request.method, headers, body, cache: "no-store" });
      }
    }

    const backendCacheControl = response.headers.get("cache-control");
    const responseHeaders = new Headers({
      "cache-control": request.method === "GET" && cleanPath.endsWith("/logo") && backendCacheControl
        ? backendCacheControl
        : "no-store",
    });
    const contentType = response.headers.get("content-type");
    if (contentType) responseHeaders.set("content-type", contentType);
    return new NextResponse(response.body, { status: response.status, headers: responseHeaders });
  } catch (error) {
    const unauthenticated = error instanceof Error && error.message === "UNAUTHENTICATED";
    console.error("Service IA gateway request failed", {
      path: request.nextUrl.pathname,
      reason: error instanceof Error ? error.message : "Unknown gateway error",
    });
    return NextResponse.json(
      { error: { message: unauthenticated ? "Authentification KORYXA requise." : "Service KORYXA temporairement indisponible." } },
      { status: unauthenticated ? 401 : 502 },
    );
  }
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const PUT = forward;
export const DELETE = forward;
