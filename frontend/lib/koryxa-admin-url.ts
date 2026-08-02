const CANONICAL_ADMIN_API_HOST = "api.admin.koryxa.fr";

export function koryxaAdminApiUrl(path: string): string {
  return `https://${CANONICAL_ADMIN_API_HOST}/api/v1/${path.replace(/^\/+/, "")}`;
}
