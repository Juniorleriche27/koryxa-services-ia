const CANONICAL_ADMIN_API_HOST = "api.admin.koryxa.fr";

export function koryxaAdminApiUrl(path: string): string {
  const configured = (
    process.env.KORYXA_ADMIN_API_URL ||
    process.env.NEXT_PUBLIC_KORYXA_ADMIN_API_URL ||
    `https://${CANONICAL_ADMIN_API_HOST}`
  ).trim();

  const url = new URL(configured);
  if (url.hostname === "admin.koryxa.fr") url.hostname = CANONICAL_ADMIN_API_HOST;

  const basePath = url.pathname.replace(/\/+$/, "").replace(/\/api\/v1$/, "");
  url.pathname = `${basePath}/api/v1/${path.replace(/^\/+/, "")}`;
  url.search = "";
  url.hash = "";
  return url.toString();
}
