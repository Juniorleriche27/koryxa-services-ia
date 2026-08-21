import { ClerkProvider } from "@clerk/nextjs";
import { AppShell } from "@/components/app/AppShell";
import { I18nProvider } from "@/lib/i18n";

export default function EspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <I18nProvider>
        <AppShell>{children}</AppShell>
      </I18nProvider>
    </ClerkProvider>
  );
}
