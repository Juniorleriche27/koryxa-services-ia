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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  const cleanToken = encodeURIComponent(token.trim());

  const apiBase = backendUrl();
  const target = `${apiBase}/public/documents/${cleanToken}/pay`;

  try {
    const payload = await request.json();
    const headers = new Headers({
      "Content-Type": "application/json",
    });
    const proxySecret = (process.env.SERVICE_IA_PROXY_SECRET || "").trim();
    if (proxySecret) {
      headers.set("X-Koryxa-Proxy-Secret", proxySecret);
    }

    const response = await fetch(target, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: { message: "Erreur lors du traitement du paiement en 1-clic." } },
      { status: 502 }
    );
  }
}
