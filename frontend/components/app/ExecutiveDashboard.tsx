"use client";

import { useState } from "react";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Plus,
  Play,
  Printer,
  ReceiptText,
  Tag,
  FileCheck2,
  Zap,
  Sparkles,
  Search,
  Wallet,
  Building,
} from "lucide-react";
import { StatusPill } from "./Ui";
import { formatMoney, formatDate, formatLabel } from "./RegistersTable";
import { OperationalAuditReport, OperationalAuditData } from "./OperationalAuditReport";

interface SummaryData {
  total_sales_count: number;
  total_sales_amount: number | string;
  total_paid_amount: number | string;
  total_unpaid_amount: number | string;
  total_partial_amount: number | string;
  offers_count: number;
  procedures_count: number;
  expenses_count?: number;
  suppliers_count?: number;
  total_expenses_paid?: number | string;
  total_expenses_unpaid?: number | string;
  net_cash_position?: number | string;
  projected_30d_cash?: number | string;
  estimated_gross_margin?: number | string;
  primary_currency: string;
  recent_sales: Array<{
    id: string;
    reference: string;
    sale_date: string;
    client_name?: string | null;
    item_label: string;
    total_amount: string;
    currency: string;
    payment_status: string;
  }>;
}


interface AlertItem {
  id: string;
  title: string;
  explanation: string;
  priority: string;
  dimension: string;
  status: string;
  confidence: number;
}

interface ActionItem {
  id: string;
  title: string;
  status: string;
  priority: string;
  responsible_user_id?: string | null;
  due_date?: string | null;
}

interface ExecutiveDashboardProps {
  summary: SummaryData | null;
  alerts: AlertItem[];
  actions: ActionItem[];
  organizationName: string;
  onOpenCreate: (kind: "offers" | "sales" | "procedures") => void;
  onTriggerRadar: () => void;
  radarRunning: boolean;
  onResolveAlert: (id: string) => void;
  onCreateActionFromAlert: (alert: AlertItem) => void;
}

export function ExecutiveDashboard({
  summary,
  alerts,
  actions,
  organizationName,
  onOpenCreate,
  onTriggerRadar,
  radarRunning,
  onResolveAlert,
  onCreateActionFromAlert,
}: ExecutiveDashboardProps) {
  const [showReport, setShowReport] = useState(false);
  const [reportGeneratedAt] = useState(() => new Date());

  const openAlerts = alerts.filter(
    (a) => a.status !== "resolved" && a.status !== "ignored"
  );
  const activeActions = actions.filter(
    (a) => a.status !== "completed" && a.status !== "ignored"
  );

  const currency = summary?.primary_currency || "XOF";
  const totalSales = Number(summary?.total_sales_amount) || 0;
  const totalPaid = Number(summary?.total_paid_amount) || 0;
  const totalUnpaid = Number(summary?.total_unpaid_amount) || 0;

  // Radar score calculation based on alerts and data volume
  const completenessDeduction = Math.min(
    30,
    openAlerts.filter((a) => a.dimension === "completeness").length * 8
  );
  const freshnessDeduction = Math.min(
    25,
    openAlerts.filter((a) => a.dimension === "freshness").length * 8
  );
  const consistencyDeduction = Math.min(
    25,
    openAlerts.filter((a) => a.dimension === "consistency").length * 10
  );
  const traceabilityDeduction = Math.min(
    20,
    openAlerts.filter((a) => a.dimension === "traceability").length * 6
  );

  const completenessScore = Math.max(0, 100 - completenessDeduction);
  const freshnessScore = Math.max(0, 100 - freshnessDeduction);
  const consistencyScore = Math.max(0, 100 - consistencyDeduction);
  const traceabilityScore = Math.max(0, 100 - traceabilityDeduction);

  const globalHealthScore = Math.round(
    completenessScore * 0.35 +
      freshnessScore * 0.25 +
      consistencyScore * 0.25 +
      traceabilityScore * 0.15
  );

  // Prepare Printable Audit Data
  const auditData: OperationalAuditData = {
    organizationName: organizationName || "Entreprise KORYXA",
    generatedDate: new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "full",
      timeStyle: "short",
    }).format(reportGeneratedAt),
    reportRef: `AUDIT-${reportGeneratedAt.getFullYear()}-${String(reportGeneratedAt.getTime()).slice(-4)}`,
    summary: {
      totalSalesCount: summary?.total_sales_count || 0,
      totalSalesAmount: totalSales,
      totalPaidAmount: totalPaid,
      totalUnpaidAmount: totalUnpaid,
      totalPartialAmount: Number(summary?.total_partial_amount) || 0,
      offersCount: summary?.offers_count || 0,
      proceduresCount: summary?.procedures_count || 0,
      currency,
    },
    radarScores: {
      globalScore: globalHealthScore,
      completeness: completenessScore,
      freshness: freshnessScore,
      consistency: consistencyScore,
      traceability: traceabilityScore,
    },
    criticalAlerts: openAlerts.map((a) => ({
      id: a.id,
      title: a.title,
      explanation: a.explanation,
      priority: a.priority,
      dimension: a.dimension,
    })),
    recentSales: summary?.recent_sales || [],
  };

  return (
    <div className="kx-executive-container">
      {showReport && (
        <OperationalAuditReport
          data={auditData}
          onClose={() => setShowReport(false)}
        />
      )}

      {/* Top Banner with Executive Greeting and Fast CTA */}
      <div className="kx-executive-header">
        <div className="kx-executive-headline">
          <span className="app-eyebrow">Cockpit Décisionnel</span>
          <h1>Mémoire Opérationnelle du Dirigeant</h1>
          <p>
            Surveillez le chiffre d&apos;affaires vérifié, le recouvrement des créances et la qualité de structuration de <strong>{organizationName}</strong>.
          </p>
        </div>

        <div className="kx-executive-actions">
          <button
            className="app-button app-button-secondary kx-report-trigger-btn"
            onClick={() => setShowReport(true)}
            title="Consulter et imprimer le Bilan Opérationnel en PDF"
          >
            <Printer size={16} />
            <span>Bilan Opérationnel (PDF)</span>
          </button>
          <button
            className="app-button app-button-primary"
            onClick={() => onOpenCreate("sales")}
          >
            <Plus size={16} />
            <span>Nouvelle vente</span>
          </button>
        </div>
      </div>

      {/* Financial & Operational KPI Cards */}
      <section className="kx-kpi-grid">
        <article className="kx-kpi-card is-primary-kpi">
          <div className="kx-kpi-head">
            <span>Chiffre d&apos;Affaires</span>
            <TrendingUp size={18} className="kx-icon-emerald" />
          </div>
          <strong>{formatMoney(totalSales, currency)}</strong>
          <small>{summary?.total_sales_count || 0} ventes suivies</small>
        </article>

        <article className="kx-kpi-card is-success-kpi">
          <div className="kx-kpi-head">
            <span>Total Encaissé</span>
            <CheckCircle2 size={18} className="kx-icon-green" />
          </div>
          <strong>{formatMoney(totalPaid, currency)}</strong>
          <small>
            {totalSales > 0
              ? `${Math.round((totalPaid / totalSales) * 100)}% de recouvrement`
              : "0% encaissé"}
          </small>
        </article>

        <article className="kx-kpi-card is-warning-kpi">
          <div className="kx-kpi-head">
            <span>Créances en attente</span>
            <Clock size={18} className="kx-icon-orange" />
          </div>
          <strong>{formatMoney(totalUnpaid, currency)}</strong>
          <small>
            <Link href="/espace/ventes" className="kx-inline-link">
              Factures impayées →
            </Link>
          </small>
        </article>

        <article className="kx-kpi-card is-score-kpi">
          <div className="kx-kpi-head">
            <span>Score Radar KORYXA</span>
            <ShieldCheck size={18} className="kx-icon-blue" />
          </div>
          <div className="kx-kpi-score-val">
            <strong>{globalHealthScore}</strong>
            <span>/100</span>
          </div>
          <div className="app-meter">
            <i style={{ width: `${globalHealthScore}%` }} />
          </div>
        </article>
      </section>


      {/* Morning Briefing Banner */}
      <section className="kx-briefing-card">
        <div className="kx-briefing-icon">
          <Sparkles size={24} />
        </div>
        <div className="kx-briefing-content">
          <h3>Briefing Prioritaire du Dirigeant</h3>
          <p>
            {openAlerts.length > 0
              ? `Radar a identifié ${openAlerts.length} point(s) d'attention sur vos ventes et procédures. Résolvez en priorité les anomalies de paiement et les procédures sans responsable.`
              : "Excellente nouvelle : aucun conflit ni anomalie critique détectée aujourd'hui. Vos registres de vente et vos méthodes de travail sont bien synchronisés."}
          </p>
        </div>
        <div className="kx-briefing-action">
          <button
            className="app-button app-button-secondary"
            disabled={radarRunning}
            onClick={onTriggerRadar}
          >
            <Play size={15} />
            <span>{radarRunning ? "Analyse en cours…" : "Scanner avec Radar"}</span>
          </button>
        </div>
      </section>

      {/* Dual Panel : Radar Alerts & Active Actions */}
      <section className="app-grid-two">
        {/* Left Panel: Critical Radar Alerts */}
        <article className="app-panel">
          <div className="app-panel-head">
            <div>
              <span className="app-eyebrow">Sentinelle Opérationnelle</span>
              <h2>Alertes à Traiter ({openAlerts.length})</h2>
            </div>
            <Link href="/espace/radar" className="kx-panel-link">
              <span>Voir tout Radar</span>
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="app-alert-list">
            {openAlerts.slice(0, 4).map((alert) => (
              <div key={alert.id} className="app-alert kx-dashboard-alert">
                <div className="kx-alert-lead">
                  <AlertTriangle size={17} className="kx-alert-icon-svg" />
                </div>
                <div className="kx-alert-main">
                  <strong>{alert.title}</strong>
                  <p>{alert.explanation}</p>
                  <div className="app-alert-tags">
                    <span>{formatLabel(alert.dimension)}</span>
                    <StatusPill>{formatLabel(alert.priority)}</StatusPill>
                  </div>
                </div>
                <div className="kx-alert-quick-actions">
                  <button
                    className="app-button app-button-secondary kx-btn-xs"
                    onClick={() => onCreateActionFromAlert(alert)}
                    title="Transformer cette alerte en tâche corrective"
                  >
                    Action
                  </button>
                  <button
                    className="app-text-button kx-btn-xs"
                    onClick={() => onResolveAlert(alert.id)}
                    title="Marquer comme vérifié et résolu"
                  >
                    Résoudre
                  </button>
                </div>
              </div>
            ))}

            {openAlerts.length === 0 && (
              <div className="kx-empty-box">
                <CheckCircle2 size={32} className="kx-icon-green" />
                <strong>Aucune anomalie ouverte</strong>
                <p>Vos ventes et procédures respectent les règles de conformité définies.</p>
              </div>
            )}
          </div>
        </article>

        {/* Right Panel: Active Tasks & Recent Sales */}
        <div className="kx-right-column-stack">
          {/* Quick Actions Kanban summary */}
          <article className="app-panel">
            <div className="app-panel-head">
              <div>
                <span className="app-eyebrow">Exécution</span>
                <h2>Actions en Cours ({activeActions.length})</h2>
              </div>
              <Link href="/espace/actions" className="kx-panel-link">
                <span>Kanban</span>
                <ArrowRight size={15} />
              </Link>
            </div>

            <div className="app-action-list">
              {activeActions.slice(0, 3).map((act) => (
                <div key={act.id} className="app-action">
                  <Zap size={16} className="kx-icon-emerald" />
                  <div className="kx-action-main">
                    <strong>{act.title}</strong>
                    <span>Assignée à : {act.responsible_user_id || "Non assignée"} · Échéance : {formatDate(act.due_date)}</span>
                  </div>
                  <StatusPill>{formatLabel(act.status)}</StatusPill>
                </div>
              ))}

              {activeActions.length === 0 && (
                <div className="kx-empty-box kx-compact">
                  <p>Aucune action corrective urgente en cours.</p>
                </div>
              )}
            </div>
          </article>

          {/* Registries Summary Counter */}
          <article className="app-panel kx-registry-counters-panel">
            <div className="app-panel-head">
              <h2>Registres Actifs</h2>
            </div>
            <div className="kx-mini-registers-grid kx-five-grid">
              <Link href="/espace/ventes" className="kx-mini-register-item">
                <ReceiptText size={18} />
                <div>
                  <strong>{summary?.total_sales_count || 0}</strong>
                  <span>Ventes</span>
                </div>
              </Link>

              <Link href="/espace/depenses" className="kx-mini-register-item">
                <Wallet size={18} />
                <div>
                  <strong>{summary?.expenses_count || 0}</strong>
                  <span>Dépenses</span>
                </div>
              </Link>

              <Link href="/espace/fournisseurs" className="kx-mini-register-item">
                <Building size={18} />
                <div>
                  <strong>{summary?.suppliers_count || 0}</strong>
                  <span>Fournisseurs</span>
                </div>
              </Link>

              <Link href="/espace/offres" className="kx-mini-register-item">
                <Tag size={18} />
                <div>
                  <strong>{summary?.offers_count || 0}</strong>
                  <span>Tarifs & Offres</span>
                </div>
              </Link>

              <Link href="/espace/procedures" className="kx-mini-register-item">
                <FileCheck2 size={18} />
                <div>
                  <strong>{summary?.procedures_count || 0}</strong>
                  <span>Procédures</span>
                </div>
              </Link>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
