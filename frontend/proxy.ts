import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPrivatePage = createRouteMatcher(["/espace(.*)"]);
const isServiceIaApi = createRouteMatcher(["/api/service-ia(.*)"]);

function isPublicProjectRequest(pathname: string) {
  return pathname === "/api/service-ia/requests" || pathname.startsWith("/api/service-ia/requests/");
}

export default clerkMiddleware(async (auth, request) => {
  const isPrivateApi = isServiceIaApi(request) && !isPublicProjectRequest(request.nextUrl.pathname);
  if (!isPrivatePage(request) && !isPrivateApi) return;
  const { userId } = await auth();
  if (userId) return;

  if (isPrivateApi) {
    return NextResponse.json({ error: { message: "Authentification KORYXA requise." } }, { status: 401 });
  }

  const signInUrl = new URL("https://accounts.koryxa.fr/sign-in");
  signInUrl.searchParams.set("redirect_url", request.url);
  return NextResponse.redirect(signInUrl);
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
