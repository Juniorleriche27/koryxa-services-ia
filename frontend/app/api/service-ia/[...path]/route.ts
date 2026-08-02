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
    headers.set("X-Tenant-ID", identity.projectAccess.projectSlug);
    headers.set("X-User-ID", identity.koryxaUserId);
    headers.set("X-Koryxa-Source", "koryxa-services-ia");
    headers.set("X-Koryxa-Auth-Provider", "koryxa-identity");
    headers.set("X-Koryxa-Role", identity.projectAccess.role || "member");
    headers.set("X-Koryxa-Permissions", "service-ia:read,service-ia:write");
    headers.set("X-Koryxa-Proxy-Secret", proxySecret);

    const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.arrayBuffer();
    const response = await fetch(target, { method: request.method, headers, body, cache: "no-store" });
    const responseHeaders = new Headers({ "cache-control": "no-store" });
    const contentType = response.headers.get("content-type");
    if (contentType) responseHeaders.set("content-type", contentType);
    return new NextResponse(response.body, { status: response.status, headers: responseHeaders });
  } catch (error) {
    const unauthenticated = error instanceof Error && error.message === "UNAUTHENTICATED";
    return NextResponse.json(
      { error: { message: unauthenticated ? "Authentification KORYXA requise." : "Accès KORYXA refusé." } },
      { status: unauthenticated ? 401 : 403 },
    );
  }
}

export const GET = forward;
export const POST = forward;
export const PATCH = forward;
export const PUT = forward;
export const DELETE = forward;
