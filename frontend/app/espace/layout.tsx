import { ClerkProvider } from "@clerk/nextjs";
import { AppShell } from "@/components/app/AppShell";
export default function EspaceLayout({ children }: { children: React.ReactNode }) {
  return <ClerkProvider><AppShell>{children}</AppShell></ClerkProvider>;
}
