import { NextResponse } from "next/server";

const REQUEST_TIMEOUT_MS = 15_000;

function getAdminApiBase(): string | null {
  const value = (
    process.env.KORYXA_ADMIN_API_URL ||
    process.env.NEXT_PUBLIC_KORYXA_ADMIN_API_URL ||
    ""
  ).trim();
  return value ? value.replace(/\/+$/, "") : null;
}

export async function POST(request: Request) {
  const apiBase = getAdminApiBase();
  if (!apiBase) {
    return NextResponse.json(
      { detail: "Le service de réception KORYXA Admin n’est pas configuré." },
      { status: 503 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ detail: "Corps de requête invalide." }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${apiBase}/api/v1/service-ia/requests`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "User-Agent": request.headers.get("user-agent") || "koryxa-services-ia",
        "X-Forwarded-For": request.headers.get("x-forwarded-for") || "",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: controller.signal,
    });

    const body = await response.json().catch(() => ({
      detail: "Réponse invalide du service KORYXA Admin.",
    }));

    return NextResponse.json(body, { status: response.status });
  } catch (error) {
    const detail = error instanceof Error && error.name === "AbortError"
      ? "La réception de la demande a expiré. Réessayez."
      : "Le service KORYXA Admin est temporairement indisponible.";
    return NextResponse.json({ detail }, { status: 503 });
  } finally {
    clearTimeout(timeout);
  }
}
