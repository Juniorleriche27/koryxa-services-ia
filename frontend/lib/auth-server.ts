import { auth, clerkClient } from "@clerk/nextjs/server";
import { unstable_cache } from "next/cache";

import { resolveKoryxaIdentity, type KoryxaIdentity } from "@/lib/koryxa-identity";

export type ServiceIaIdentity = KoryxaIdentity;

// In-memory runtime cache to eliminate repeated Clerk network calls within serverless executions
const clerkUserCache = new Map<string, { email: string; fullName: string | null; expiresAt: number }>();

const resolveCachedKoryxaIdentity = unstable_cache(
  async (clerkUserId: string, email: string, fullName: string | null) =>
    resolveKoryxaIdentity({ clerkUserId, email, fullName }),
  ["service-ia-identity-v4"],
  { revalidate: 180 }, // 3 minutes cache
);

export async function requireServiceIaIdentity(): Promise<ServiceIaIdentity> {
  const authContext = await auth();
  if (!authContext.userId) throw new Error("UNAUTHENTICATED");

  const cached = clerkUserCache.get(authContext.userId);
  if (cached && cached.expiresAt > Date.now()) {
    return resolveCachedKoryxaIdentity(authContext.userId, cached.email, cached.fullName);
  }

  // Clerk reads request headers internally, so it must remain outside the
  // Next.js cache scope. Only the header-independent KORYXA bridge is cached.
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(authContext.userId);
  const email = (user.primaryEmailAddress?.emailAddress || user.emailAddresses[0]?.emailAddress || "")
    .trim()
    .toLowerCase();
  if (!email) throw new Error("KORYXA Identity user has no email address.");

  clerkUserCache.set(authContext.userId, {
    email,
    fullName: user.fullName,
    expiresAt: Date.now() + 3 * 60 * 1000,
  });

  return resolveCachedKoryxaIdentity(authContext.userId, email, user.fullName);
}
