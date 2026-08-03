import { auth, clerkClient } from "@clerk/nextjs/server";
import { unstable_cache } from "next/cache";

import { resolveKoryxaIdentity, type KoryxaIdentity } from "@/lib/koryxa-identity";

export type ServiceIaIdentity = KoryxaIdentity;

const resolveCachedServiceIdentity = unstable_cache(
  async (clerkUserId: string) => {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(clerkUserId);
    const email = (user.primaryEmailAddress?.emailAddress || user.emailAddresses[0]?.emailAddress || "")
      .trim()
      .toLowerCase();
    if (!email) throw new Error("KORYXA Identity user has no email address.");
    return resolveKoryxaIdentity({ clerkUserId, email, fullName: user.fullName });
  },
  ["service-ia-identity-v2"],
  { revalidate: 60 },
);

export async function requireServiceIaIdentity(): Promise<ServiceIaIdentity> {
  const authContext = await auth();
  if (!authContext.userId) throw new Error("UNAUTHENTICATED");

  return resolveCachedServiceIdentity(authContext.userId);
}
