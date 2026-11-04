import { NextResponse, type NextRequest } from "next/server";

function backendUrl() {
  return (
    process.env.SERVICE_IA_API_URL ||
    process.env.NEXT_PUBLIC_SERVICE_IA_API_URL ||
    "http://127.0.0.1:8080/api/v1"
  )
    .trim()
    .replace(/\/$/, "");
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const cleanToken = encodeURIComponent(token.trim());

  const apiBase = backendUrl();
  const target = `${apiBase}/public/documents/${cleanToken}`;

  try {
    const headers = new Headers();
    const proxySecret = (process.env.SERVICE_IA_PROXY_SECRET || "").trim();
    if (proxySecret) {
      headers.set("X-Koryxa-Proxy-Secret", proxySecret);
    }

    const response = await fetch(target, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: { message: "Erreur de communication avec la Mémoire Opérationnelle." } },
      { status: 502 }
    );
  }
}
