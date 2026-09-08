import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";

// Matchers
const isPublicProjectRequest = (pathname: string) =>
  pathname === "/api/service-ia/requests" || pathname.startsWith("/api/service-ia/requests/");

const isServiceIaApi = createRouteMatcher(["/api/service-ia(.*)"]);
const isEspaceRoute = createRouteMatcher(["/espace(.*)"]);

export default clerkMiddleware(async (auth, request: NextRequest) => {
  const url = request.nextUrl.clone();
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host") || "";
  const pathname = url.pathname;

  // Détection du domaine entreprise.koryxa.fr
  const isEntrepriseDomain = host.startsWith("entreprise.") || host.includes("entreprise.koryxa.fr");

  // 1. Gestion des APIs
  if (isServiceIaApi(request)) {
    if (isPublicProjectRequest(pathname)) {
      return NextResponse.next();
    }
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: { message: "Authentification KORYXA requise." } }, { status: 401 });
    }
    return NextResponse.next();
  }

  // 2. Gestion sur le domaine entreprise.koryxa.fr
  if (isEntrepriseDomain) {
    // Vérification de l'authentification pour tout le domaine entreprise
    const { userId } = await auth();
    if (!userId) {
      const signInUrl = new URL("https://accounts.koryxa.fr/sign-in");
      signInUrl.searchParams.set("redirect_url", request.url);
      return NextResponse.redirect(signInUrl);
    }

    // Réécriture racine vers /espace
    if (pathname === "/" || pathname === "") {
      url.pathname = "/espace";
      return NextResponse.rewrite(url);
    }

    // Si le chemin ne commence pas par /espace et n'est pas une ressource statique, on réécrit vers /espace/*
    if (!pathname.startsWith("/espace") && !pathname.startsWith("/_next") && !pathname.startsWith("/api")) {
      url.pathname = `/espace${pathname}`;
      return NextResponse.rewrite(url);
    }

    return NextResponse.next();
  }

  // 3. Gestion sur le domaine public (service-ia.koryxa.fr)
  if (isEspaceRoute(request)) {
    const { userId } = await auth();
    if (!userId) {
      const signInUrl = new URL("https://accounts.koryxa.fr/sign-in");
      signInUrl.searchParams.set("redirect_url", request.url);
      return NextResponse.redirect(signInUrl);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public files (images, svg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)",
  ],
};
