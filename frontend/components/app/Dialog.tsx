"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

export function Dialog({ title, description, open, onClose, children }: {
  title: string;
  description?: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const close = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open, onClose]);
  if (!open) return null;
  return <div className="app-dialog-layer" role="presentation" onMouseDown={event => event.target === event.currentTarget && onClose()}>
    <section className="app-dialog" role="dialog" aria-modal="true" aria-labelledby="dialog-title">
      <header><div><span className="app-eyebrow">Saisie</span><h2 id="dialog-title">{title}</h2>{description ? <p>{description}</p> : null}</div><button type="button" className="app-icon-button" onClick={onClose} aria-label="Fermer"><X size={19}/></button></header>
      {children}
    </section>
  </div>;
}

export function FormError({ children }: { children?: string }) {
  return children ? <p className="app-form-error" role="alert">{children}</p> : null;
}
