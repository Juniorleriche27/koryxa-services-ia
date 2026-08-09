import { auth, clerkClient } from "@clerk/nextjs/server";
import { unstable_cache } from "next/cache";

import { resolveKoryxaIdentity, type KoryxaIdentity } from "@/lib/koryxa-identity";

export type ServiceIaIdentity = KoryxaIdentity;

const resolveCachedKoryxaIdentity = unstable_cache(
  async (clerkUserId: string, email: string, fullName: string | null) =>
    resolveKoryxaIdentity({ clerkUserId, email, fullName }),
  ["service-ia-identity-v3"],
  { revalidate: 300 },
);

const resolveCachedClerkProfile = unstable_cache(
  async (clerkUserId: string) => {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(clerkUserId);
    return {
      email: (
        user.primaryEmailAddress?.emailAddress ||
        user.emailAddresses[0]?.emailAddress ||
        ""
      )
        .trim()
        .toLowerCase(),
      fullName: user.fullName,
    };
  },
  ["service-ia-clerk-profile-v1"],
  { revalidate: 300 },
);

export async function requireServiceIaIdentity(): Promise<ServiceIaIdentity> {
  const authContext = await auth();
  if (!authContext.userId) throw new Error("UNAUTHENTICATED");

  // Clerk reads request headers internally, so it must remain outside the
  // Next.js cache scope. Only the header-independent KORYXA bridge is cached.
  const profile = await resolveCachedClerkProfile(authContext.userId);
  const email = profile.email;
  if (!email) throw new Error("KORYXA Identity user has no email address.");

  return resolveCachedKoryxaIdentity(authContext.userId, email, profile.fullName);
}
