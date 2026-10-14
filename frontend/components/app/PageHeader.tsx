import type { ReactNode } from "react";

/** Shared private workspace header. Heading, description and actions stay on one surface. */
export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <header className="app-page-header kx-workspace-header">
      <div className="kx-workspace-header-copy">
        <span className="app-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action && <div className="app-page-action kx-workspace-header-action">{action}</div>}
    </header>
  );
}
