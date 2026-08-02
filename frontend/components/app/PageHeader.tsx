export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="app-page-header"><div><span className="app-eyebrow">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action && <div className="app-page-action">{action}</div>}</div>;
}
