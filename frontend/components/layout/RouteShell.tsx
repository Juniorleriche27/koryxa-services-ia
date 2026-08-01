"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import Footer from "@/components/layout/footer";
import PublicHeader from "@/components/layout/PublicHeader";

export default function RouteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <div className="public-shell relative flex min-h-screen flex-col overflow-x-clip bg-[var(--kx-page)] text-slate-950">
      <PublicHeader />
      <main
        id="page-content"
        tabIndex={-1}
        className={isHome ? "relative flex-1" : "relative flex-1 px-4 py-10 sm:px-6 lg:px-8 lg:py-14"}
      >
        <div className={isHome ? "w-full" : "mx-auto w-full max-w-[var(--marketing-max-w)]"}>
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
