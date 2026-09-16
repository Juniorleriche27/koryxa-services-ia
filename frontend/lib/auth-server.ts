import { auth, clerkClient } from "@clerk/nextjs/server";
import { unstable_cache } from "next/cache";

import { resolveKoryxaIdentity, type KoryxaIdentity } from "@/lib/koryxa-identity";

export type ServiceIaIdentity = KoryxaIdentity;

// In-memory runtime cache to eliminate repeated Clerk network calls within serverless executions
const clerkUserCache = new Map<string, { email: string; fullName: string | null; expiresAt: number }>();

const resolveCachedKoryxaIdentity = unstable_cache(
  async (clerkUserId: string, email: string, fullName: string | null) =>
    resolveKoryxaIdentity({ clerkUserId, email, fullName }),
  ["service-ia-identity-v5"],
  { revalidate: 900 }, // 15 minutes cache
);

export async function requireServiceIaIdentity(): Promise<ServiceIaIdentity> {
  const authContext = await auth();
  if (!authContext.userId) throw new Error("UNAUTHENTICATED");

  const cached = clerkUserCache.get(authContext.userId);
  if (cached && cached.expiresAt > Date.now()) {
    return resolveCachedKoryxaIdentity(authContext.userId, cached.email, cached.fullName);
  }

  // Fast path: Extract email directly from verified Clerk sessionClaims
  // This eliminates a 400-800ms external HTTP request to api.clerk.com on every cold invocation
  const claims = authContext.sessionClaims as Record<string, any> | null;
  const claimEmail = (
    claims?.email ||
    claims?.primary_email ||
    claims?.email_address ||
    (Array.isArray(claims?.emails) ? claims?.emails[0] : null)
  )?.toString().trim().toLowerCase();
  const claimFullName = (claims?.full_name || claims?.name || null)?.toString();

  if (claimEmail) {
    clerkUserCache.set(authContext.userId, {
      email: claimEmail,
      fullName: claimFullName,
      expiresAt: Date.now() + 15 * 60 * 1000,
    });
    return resolveCachedKoryxaIdentity(authContext.userId, claimEmail, claimFullName);
  }

  // Fallback to clerk.users.getUser only if email is not present in claims
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(authContext.userId);
  const email = (user.primaryEmailAddress?.emailAddress || user.emailAddresses[0]?.emailAddress || "")
    .trim()
    .toLowerCase();
  if (!email) throw new Error("KORYXA Identity user has no email address.");

  clerkUserCache.set(authContext.userId, {
    email,
    fullName: user.fullName,
    expiresAt: Date.now() + 15 * 60 * 1000,
  });

  return resolveCachedKoryxaIdentity(authContext.userId, email, user.fullName);
}
