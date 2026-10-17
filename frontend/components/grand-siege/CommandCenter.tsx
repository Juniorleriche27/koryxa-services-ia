"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, AlertTriangle, CheckCircle2, Clock3, RefreshCw, ShieldAlert } from 'lucide-react';
import { fetchFreshCommandData } from './fresh-command-data';
import { buildCommandEntries, priorityLabel, selectCommandEntries, type CommandAction, type CommandAlert } from './command-center-data';
import styles from './CommandCenter.module.css';

type Source<T> = { state: 'loading' | 'ready' | 'error'; items: T[] };
const initial = <T,>(): Source<T> => ({ state: 'loading', items: [] });

/** Operations view: the backend controls authorization and the contents of both feeds. */
export function CommandCenter() {
  const [actions, setActions] = useState<Source<CommandAction>>(initial());
  const [alerts, setAlerts] = useState<Source<CommandAlert>>(initial());
  const [filter, setFilter] = useState<'all' | 'urgent'>('all');
  const [revision, setRevision] = useState(0);
  const [checkedAt, setCheckedAt] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    Promise.allSettled([
      fetchFreshCommandData<CommandAction[]>('/workflow/actions', controller.signal),
      fetchFreshCommandData<CommandAlert[]>('/radar/alerts', controller.signal),
    ]).then(([actionResult, alertResult]) => {
      if (!active) return;
      setActions(actionResult.status === 'fulfilled' && Array.isArray(actionResult.value) ? { state: 'ready', items: actionResult.value } : { state: 'error', items: [] });
      setAlerts(alertResult.status === 'fulfilled' && Array.isArray(alertResult.value) ? { state: 'ready', items: alertResult.value } : { state: 'error', items: [] });
      setCheckedAt(new Date().toISOString());
    });
    return () => { active = false; controller.abort(); };
  }, [revision]);

  // Today's date uses the user's calendar timezone; only due dates are compared with it.
  const today = new Date().toLocaleDateString('en-CA');
  const entries = useMemo(() => buildCommandEntries(actions.items, alerts.items, today), [actions.items, alerts.items, today]);
  const visible = selectCommandEntries(entries, filter);
  const loading = actions.state === 'loading' || alerts.state === 'loading';
  const partial = actions.state === 'error' || alerts.state === 'error';
  const urgent = entries.filter(e => e.overdue || e.priority === 'critical' || e.priority === 'high').length;
  const unresolvedActions = actions.state === 'ready' ? actions.items.filter(a => ['todo', 'in_progress', 'blocked'].includes(a.status)).length : null;
  const unresolvedAlerts = alerts.state === 'ready' ? alerts.items.filter(a => ['open', 'acknowledged'].includes(a.status)).length : null;

  return (
    <section className={styles.zone} aria-label="Centre de commandement CAURI" id="centre-commandement">
      <header className={styles.header}>
        <div><span className={styles.eyebrow}>02 / SALLE DE COMMANDEMENT</span><h2>Priorités & signaux</h2><p>Les dossiers qui demandent votre attention, issus des registres CAURI.</p></div>
        <button type="button" className={styles.refresh} disabled={loading} onClick={() => { setActions(initial()); setAlerts(initial()); setRevision(r => r + 1); }}><RefreshCw size={15} aria-hidden="true" /> Actualiser</button>
      </header>
      <div className={styles.statusBar} role="status" aria-live="polite">
        <span className={styles.statusWord}>{loading ? 'Synchronisation des registres…' : partial ? 'Informations partielles — certains registres sont indisponibles' : 'Registres consultés'}</span>
        <span>{checkedAt ? `Vérifié à ${new Date(checkedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · Lecture à la demande` : 'Lecture à la demande'}</span>
      </div>
      <div className={styles.overview}>
        <div><span>Actions ouvertes</span><strong>{loading || unresolvedActions === null ? '—' : unresolvedActions.toLocaleString('fr-FR')}</strong><Link href="/espace/actions">Voir les actions <ArrowUpRight size={13} /></Link></div>
        <div><span>Alertes à traiter</span><strong>{loading || unresolvedAlerts === null ? '—' : unresolvedAlerts.toLocaleString('fr-FR')}</strong><Link href="/espace/radar">Ouvrir le Radar <ArrowUpRight size={13} /></Link></div>
        <div><span>Dossiers prioritaires</span><strong>{loading || partial ? '—' : urgent.toLocaleString('fr-FR')}</strong><small>Priorités hautes, critiques ou actions en retard</small></div>
      </div>
      <div className={styles.feedTitle}>
        <h3>À examiner</h3>
        <div className={styles.filters} role="group" aria-label="Filtrer les dossiers">
          <button className={filter === 'all' ? styles.active : ''} type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>Tous</button>
          <button className={filter === 'urgent' ? styles.active : ''} type="button" aria-pressed={filter === 'urgent'} onClick={() => setFilter('urgent')}>Prioritaires</button>
        </div>
      </div>
      {loading ? <div className={styles.empty} role="status">Chargement des dossiers en cours…</div> : visible.length ? (
        <div className={styles.feed}>
          {visible.map(item => <Link href={item.href} className={styles.entry} key={item.id}>
            <span className={styles.entryIcon}>{item.type === 'alert' ? <ShieldAlert size={18} aria-hidden="true" /> : <Clock3 size={18} aria-hidden="true" />}</span>
            <span className={styles.entryMain}><span className={styles.entryTitle}>{item.title}</span><span className={styles.entrySummary}>{item.summary}</span><span className={styles.entryMeta}>{item.type === 'alert' ? 'Signal Radar' : 'Action'} · {priorityLabel(item.priority)}{item.overdue ? ' · Échéance dépassée' : ''}</span></span>
            <ArrowUpRight size={18} aria-hidden="true" className={styles.entryArrow} />
          </Link>)}
        </div>
      ) : <div className={styles.empty}>{partial ? <><AlertTriangle size={19} aria-hidden="true" /> Données incomplètes. Consultez directement les départements pour vérifier les dossiers.</> : filter === 'urgent' ? <><CheckCircle2 size={19} aria-hidden="true" /> Aucun dossier prioritaire dans les registres consultés.</> : <><CheckCircle2 size={19} aria-hidden="true" /> Aucun dossier ouvert dans les registres consultés.</>}</div>}
      <footer className={styles.footer}><span>Un signal n’est pas une décision automatique : ouvrez son département pour examiner les détails.</span><Link href="/espace/validations">Consulter les validations <ArrowUpRight size={14} aria-hidden="true" /></Link></footer>
    </section>
  );
}
