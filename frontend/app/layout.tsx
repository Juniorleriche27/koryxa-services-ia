import "./globals.css";
import "./cauri-workspace-premium.css";
import "./cauri-commerce-premium.css";
import "./cauri-finances-premium.css";
import "./cauri-operations-premium.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { DM_Sans, Playfair_Display } from "next/font/google";
import RouteShell from "@/components/layout/RouteShell";

const sans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const display = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });

export const metadata: Metadata = {
  title: { default: "CAURI — Grand Siège", template: "%s | CAURI" },
  description: "CAURI, siège numérique pour la gestion, le pilotage et les décisions de votre entreprise.",
  applicationName: "CAURI",
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://cauri.koryxa.fr"),
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CAURI",
  },
  icons: {
    icon: [
      { url: "/icons/cauri-icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/cauri-icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/icons/cauri-apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "CAURI — Grand Siège",
    description: "CAURI, siège numérique pour la gestion, le pilotage et les décisions de votre entreprise.",
    url: "/",
    siteName: "CAURI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CAURI — Grand Siège",
    description: "CAURI, siège numérique pour la gestion, le pilotage et les décisions de votre entreprise.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#047857",
  interactiveWidget: "resizes-content",
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
