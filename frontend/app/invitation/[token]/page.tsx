import { ClerkProvider } from "@clerk/nextjs";

import InvitationAcceptance from "@/components/invitations/InvitationAcceptance";

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  return (
    <ClerkProvider>
      <InvitationAcceptance token={token} />
    </ClerkProvider>
  );
}
