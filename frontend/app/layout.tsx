import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { DM_Sans, Playfair_Display } from "next/font/google";
import Script from "next/script";
import RouteShell from "@/components/layout/RouteShell";

const sans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const display = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });

export const metadata: Metadata = {
  title: { default: "KORYXA — Mémoire & Pilotage Opérationnel", template: "%s | KORYXA" },
  description: "Plateforme d'entreprise, facturation, encaissement, stocks, présence et pilotage opérationnel KORYXA.",
  applicationName: "KORYXA",
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://service-ia.koryxa.fr"),
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "KORYXA",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "KORYXA — Mémoire & Pilotage Opérationnel",
    description: "Plateforme d'entreprise, facturation, encaissement, stocks, présence et pilotage opérationnel KORYXA.",
    url: "/",
    siteName: "KORYXA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KORYXA — Mémoire & Pilotage Opérationnel",
    description: "Plateforme d'entreprise, facturation, encaissement, stocks, présence et pilotage opérationnel KORYXA.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#047857",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={`${sans.variable} ${display.variable}`}>
      <head>
        <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      </head>
      <body className="min-h-screen overflow-x-hidden bg-[var(--kx-page)] text-slate-950 antialiased">
        <a href="#page-content" className="sr-only z-50 rounded bg-white px-3 py-2 text-[var(--kx-text)] focus:not-sr-only focus:absolute focus:left-4 focus:top-4">
          Aller au contenu
        </a>
        <RouteShell>{children}</RouteShell>
      </body>
    </html>
  );
}
