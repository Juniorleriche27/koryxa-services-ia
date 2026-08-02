import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { DM_Sans, Playfair_Display } from "next/font/google";
import RouteShell from "@/components/layout/RouteShell";

const sans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const display = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });

export const metadata: Metadata = {
  title: { default: "KORYXA Service IA & Web", template: "%s" },
  description: "Sites web, applications, intelligence artificielle et automatisations pour les entreprises.",
  applicationName: "KORYXA Service IA & Web",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://services.koryxa.fr"),
  openGraph: {
    title: "KORYXA Service IA & Web",
    description: "Sites web, applications, intelligence artificielle et automatisations pour les entreprises.",
    url: "/",
    siteName: "KORYXA Service IA & Web",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KORYXA Service IA & Web",
    description: "Sites web, applications, intelligence artificielle et automatisations pour les entreprises.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#f8fbf8",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-screen overflow-x-hidden bg-[var(--kx-page)] text-slate-950 antialiased">
        <a href="#page-content" className="sr-only z-50 rounded bg-white px-3 py-2 text-[var(--kx-text)] focus:not-sr-only focus:absolute focus:left-4 focus:top-4">
          Aller au contenu
        </a>
        <RouteShell>{children}</RouteShell>
      </body>
    </html>
  );
}
