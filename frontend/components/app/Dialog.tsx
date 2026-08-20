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
          "app-dialog transition-all duration-150",
          isFullscreen &&
            "!fixed !inset-0 !w-screen !h-screen !max-w-none !max-h-none !rounded-none !m-0 !border-0 !z-50 !overflow-y-auto !p-4 sm:!p-8"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
      >
        <header className="flex items-start justify-between gap-4 pb-3 mb-4 border-b border-border/70">
          <div>
            <span className="app-eyebrow">Saisie & Gestion</span>
            <h2 id="dialog-title" className="text-lg sm:text-xl font-bold text-foreground tracking-tight m-0">
              {title}
            </h2>
            {description ? <p className="text-xs text-muted-foreground mt-0.5">{description}</p> : null}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {allowFullscreen && (
              <button
                type="button"
                className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer border border-border/60"
                onClick={() => setIsFullscreen((prev) => !prev)}
                title={isFullscreen ? "Quitter le plein écran" : "Agrandir en plein écran"}
                aria-label={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
              >
                {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
              </button>
            )}
            <button
              type="button"
              className="app-icon-button"
              onClick={onClose}
              aria-label="Fermer"
            >
              <X size={19} />
            </button>
          </div>
        </header>
        {children}
      </section>
    </div>
  );
}

export function FormError({ children }: { children?: string }) {
  return children ? <p className="app-form-error" role="alert">{children}</p> : null;
}

