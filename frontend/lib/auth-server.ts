import { auth, currentUser } from "@clerk/nextjs/server";

import { resolveKoryxaIdentity, type KoryxaIdentity } from "@/lib/koryxa-identity";

export type ServiceIaIdentity = KoryxaIdentity & { clerkToken: string | null };

export async function requireServiceIaIdentity(): Promise<ServiceIaIdentity> {
  const authContext = await auth();
  if (!authContext.userId) throw new Error("UNAUTHENTICATED");

  const user = await currentUser();
  const email = (user?.primaryEmailAddress?.emailAddress || user?.emailAddresses[0]?.emailAddress || "")
    .trim()
    .toLowerCase();
  if (!email) throw new Error("KORYXA Identity user has no email address.");

  const identity = await resolveKoryxaIdentity({
    clerkUserId: authContext.userId,
    email,
    fullName: user?.fullName,
  });
  return { ...identity, clerkToken: await authContext.getToken() };
}
