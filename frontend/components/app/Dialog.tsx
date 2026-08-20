"use client";

import { X, Maximize2, Minimize2 } from "lucide-react";
import { useEffect, useState } from "react";
import clsx from "clsx";

export function Dialog({
  title,
  description,
  open,
  onClose,
  allowFullscreen = true,
  children,
}: {
  title: string;
  description?: string;
  open: boolean;
  onClose: () => void;
  allowFullscreen?: boolean;
  children: React.ReactNode;
}) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!open) {
      setIsFullscreen(false);
      return;
    }
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className={clsx("app-dialog-layer", isFullscreen && "!p-0 !m-0 !bg-background")}
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        className={clsx(
          "app-dialog transition-all duration-150 relative",
          isFullscreen &&
            "!fixed !inset-0 !w-screen !h-screen !max-w-none !max-h-none !rounded-none !m-0 !border-0 !z-50 !overflow-y-auto !p-5 sm:!p-8 bg-background"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <header className="sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-30 pt-2 pb-3 mb-4 -mx-5 px-5 -mt-5 border-b border-border/80 flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1">
            <span className="app-eyebrow text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Saisie & Gestion
            </span>
            <h2 id="dialog-title" className="text-base sm:text-lg font-bold text-foreground tracking-tight m-0 truncate">
              {title}
            </h2>
            {description ? <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{description}</p> : null}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {allowFullscreen && (
              <button
                type="button"
                className="px-2.5 py-1.5 rounded-xl hover:bg-muted text-foreground transition cursor-pointer border border-border/80 flex items-center gap-1.5 text-xs font-bold shadow-2xs bg-card"
                onClick={() => setIsFullscreen((prev) => !prev)}
                title={isFullscreen ? "Quitter le mode plein écran" : "Agrandir en plein écran"}
                aria-label={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 size={15} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="hidden sm:inline">Réduire</span>
                  </>
                ) : (
                  <>
                    <Maximize2 size={15} className="text-emerald-600 dark:text-emerald-400" />
                    <span className="hidden sm:inline">Plein écran</span>
                  </>
                )}
              </button>
            )}
            <button
              type="button"
              className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer border border-border/60"
              onClick={onClose}
              aria-label="Fermer"
              title="Fermer"
            >
              <X size={18} />
            </button>
          </div>
        </header>
        <div className="pt-2">{children}</div>
      </section>
    </div>
  );
}

export function FormError({ children }: { children?: string }) {
  return children ? <p className="app-form-error" role="alert">{children}</p> : null;
}

