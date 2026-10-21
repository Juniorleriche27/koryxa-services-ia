import type { ReactNode } from "react";
import styles from "./CauriEditorial.module.css";

/** Shared private workspace header. Heading, description and actions stay on one surface. */
export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <header className={`app-page-header kx-workspace-header ${styles.header} ${styles.page}`}>
      <div className={`kx-workspace-header-copy ${styles.copy}`}>
        <span className={`app-eyebrow ${styles.eyebrow}`}>{eyebrow}</span>
        <h1 className={styles.title}>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {action && <div className={`app-page-action kx-workspace-header-action ${styles.action}`}>{action}</div>}
    </header>
  );
}
