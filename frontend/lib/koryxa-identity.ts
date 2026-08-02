// This must match the canonical project slug stored in KORYXA Admin.
import { koryxaAdminApiUrl } from "@/lib/koryxa-admin-url";

export const SERVICE_IA_PROJECT_SLUG = "service-ia";

export type KoryxaIdentity = {
  koryxaUserId: string;
  clerkUserId: string;
  email: string;
  fullName?: string | null;
  userStatus: string;
  projectAccess: {
    projectSlug: string;
    projectName?: string | null;
    role?: string | null;
    status: string;
  };
};

type IdentityResponse = {
  koryxa_user_id?: string;
  clerk_user_id?: string;
  email?: string;
  full_name?: string | null;
  user_status?: string;
  project_access?: {
    project_slug?: string;
    project_name?: string | null;
    role?: string | null;
    status?: string;
  };
  detail?: unknown;
  error?: unknown;
};

export async function resolveKoryxaIdentity(params: {
  clerkUserId: string;
  email: string;
  fullName?: string | null;
}): Promise<KoryxaIdentity> {
  const bridgeKey = (process.env.KORYXA_IDENTITY_BRIDGE_KEY || "").trim();
  if (!bridgeKey) throw new Error("KORYXA Identity bridge is not configured.");

  const response = await fetch(koryxaAdminApiUrl("identity/resolve"), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-KORYXA-IDENTITY-KEY": bridgeKey,
    },
    body: JSON.stringify({
      clerk_user_id: params.clerkUserId,
      email: params.email,
      full_name: params.fullName ?? null,
      project_slug: SERVICE_IA_PROJECT_SLUG,
    }),
    cache: "no-store",
  });

  const data = (await response.json().catch(() => ({}))) as IdentityResponse;
  if (!response.ok || !data.koryxa_user_id || !data.email) {
    const detail = typeof data.detail === "string" ? data.detail : typeof data.error === "string" ? data.error : `KORYXA Identity responded with ${response.status}`;
    throw new Error(detail);
  }

  // Authentication is established by Clerk and the identity bridge. As in
  // CoraBiz, authorization of each operation belongs to the target API; do not
  // reject the whole workspace while project access metadata is synchronizing.
  const accessStatus = data.project_access?.status ?? "none";

  return {
    koryxaUserId: data.koryxa_user_id,
    clerkUserId: data.clerk_user_id ?? params.clerkUserId,
    email: data.email,
    fullName: data.full_name ?? null,
    userStatus: data.user_status ?? "active",
    projectAccess: {
      projectSlug: data.project_access?.project_slug ?? SERVICE_IA_PROJECT_SLUG,
      projectName: data.project_access?.project_name ?? null,
      role: data.project_access?.role ?? null,
      status: accessStatus,
    },
  };
}
