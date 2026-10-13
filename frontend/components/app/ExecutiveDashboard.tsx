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
  Compass,
  Search,
  Wallet,
  Building,
  UserCheck,
} from "lucide-react";
import { StatusPill } from "./Ui";
import { formatMoney, formatDate, formatLabel } from "./RegistersTable";
import { OperationalAuditReport, OperationalAuditData } from "./OperationalAuditReport";
import { BusinessPerformanceCockpit } from "./BusinessPerformanceCockpit";
import { getBusinessCategoryConfig } from "@/lib/service-ia/business-categories";
import { useI18n } from "@/lib/i18n";

interface SummaryData {
  total_sales_count: number;
  total_sales_amount: number | string | null;
  total_paid_amount: number | string | null;
  total_unpaid_amount: number | string | null;
  total_partial_amount: number | string | null;
  offers_count: number;
  procedures_count: number;
  expenses_count?: number;
  suppliers_count?: number;
  total_expenses_paid?: number | string | null;
  total_expenses_unpaid?: number | string | null;
  net_cash_position?: number | string | null;
  cash_movement_net?: number | string | null;
  financial_data_status?: string;
  financial_warnings?: string[];
  sales_records_count?: number;
  excluded_sales_count?: number;
  pending_validation_sales_count?: number;
  projected_30d_cash?: number | string | null;
  estimated_gross_margin?: number | string | null;
  gross_margin_rate?: number | null;
  average_order_value?: number | string | null;
  break_even_point?: number | string | null;
  break_even_progress?: number | null;
  recovery_rate?: number | null;
  daily_burn_rate?: number | string | null;
  cash_runway_days?: number | null;
  working_capital?: number | string | null;
  primary_currency: string;
  recent_sales: Array<{
    id: string;
    reference: string;
    sale_date: string;
    client_name?: string | null;
    item_label: string;
    total_amount: string | number;
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
  organizationBusinessCategory?: string;
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
  organizationBusinessCategory,
  onOpenCreate,
  onTriggerRadar,
  radarRunning,
  onResolveAlert,
  onCreateActionFromAlert,
}: ExecutiveDashboardProps) {
  const { t, lang } = useI18n();
  const [showReport, setShowReport] = useState(false);
  const [reportGeneratedAt] = useState(() => new Date());
  const proConfig = getBusinessCategoryConfig(organizationBusinessCategory || "retail", lang);

  const openAlerts = alerts.filter(
    (a) => a.status !== "resolved" && a.status !== "ignored"
  );
  const activeActions = actions.filter(
    (a) => a.status !== "completed" && a.status !== "ignored"
  );

  const currency = summary?.primary_currency || "XOF";
  const totalSales = Number(summary?.total_sales_amount ?? 0);
  const totalPaid = Number(summary?.total_paid_amount ?? 0);
  const totalUnpaid = Number(summary?.total_unpaid_amount ?? 0);
  const totalExpensesPaid = Number(summary?.total_expenses_paid ?? 0);
  const totalExpensesUnpaid = Number(summary?.total_expenses_unpaid ?? 0);
  const netCash = summary?.cash_movement_net != null ? Number(summary.cash_movement_net) : null;
  const showFinancial = (key: number | string | null | undefined, amount: number) =>
    key == null ? "Non calculable" : formatMoney(amount, currency);
  const isFinancialUncertain = summary?.financial_data_status !== "registers_only";

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
          <span className="app-eyebrow">{t("dash_eyebrow")}</span>
          <h1>{t("dash_title")}</h1>
          <p>
            {t("dash_desc")} <strong>{organizationName}</strong>.
          </p>
        </div>

        <div className="kx-executive-actions">
          <button
            className="app-button app-button-secondary kx-report-trigger-btn"
            onClick={() => setShowReport(true)}
            disabled={isFinancialUncertain}
            aria-label={isFinancialUncertain ? "Rapport financier indisponible : registres incohérents" : "Consulter le bilan opérationnel"}
            title="Consulter et imprimer le Bilan Opérationnel en PDF"
          >
            <Printer size={16} />
            <span>{t("btn_pdf_report")}</span>
          </button>
          <button
            className="app-button app-button-primary"
            onClick={() => onOpenCreate("sales")}
          >
            <Plus size={16} />
            <span>{t("btn_new_sale")}</span>
          </button>
        </div>
      </div>

      {isFinancialUncertain && (
        <div role="status" className="mb-4 rounded-xl border border-amber-400/40 bg-amber-50 p-3 text-sm text-amber-950 dark:bg-amber-950/30 dark:text-amber-100">
          <strong>Données financières insuffisantes ou non comparables.</strong>
          <p>{summary?.financial_warnings?.join(" ") || "Vérifiez les montants payés et les devises des registres."}</p>
        </div>
      )}
      {(summary?.excluded_sales_count ?? 0) > 0 && (
        <div role="status" className="mb-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
          <strong>{summary?.excluded_sales_count} document(s) de vente hors chiffre d'affaires.</strong>
          <p>{summary?.pending_validation_sales_count ?? 0} à vérifier. Seules les ventes validées entrent dans le chiffre d’affaires.</p>
          <Link href="/espace/ventes" className="mt-1 inline-block font-semibold underline underline-offset-2">Examiner les ventes et leurs statuts</Link>
        </div>
      )}
      {!isFinancialUncertain && (
        <div className="kx-period-label mb-4"><span>Historique complet</span><span>Documents validés</span><span>Flux déclarés ≠ solde bancaire</span></div>
      )}
      {/* Financial & Operational KPI Cards */}
      <section data-tour="cockpit-score" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 mb-6">
        {/* 1. Chiffre d'Affaires Global */}
        <article className="kx-kpi-card is-primary-kpi">
          <div className="kx-kpi-head">
            <span>{t("kpi_turnover")}</span>
            <TrendingUp size={18} className="kx-icon-emerald" />
          </div>
          <strong className="kx-kpi-value">{showFinancial(summary?.total_sales_amount, totalSales)}</strong>
          <small>{summary?.total_sales_count || 0} {t("kpi_sales_followed")}</small>
        </article>

        {/* 2. Total Encaissé (Entrées d'argent) */}
        <article className="kx-kpi-card is-success-kpi">
          <div className="kx-kpi-head">
            <span>{t("kpi_total_collected")}</span>
            <CheckCircle2 size={18} className="kx-icon-green" />
          </div>
          <strong className="kx-kpi-value">{showFinancial(summary?.total_paid_amount, totalPaid)}</strong>
          <small>
            {summary?.recovery_rate != null ? `${summary.recovery_rate}% ${t("kpi_recovery_rate")}` : "Taux de recouvrement non calculable"}
          </small>
        </article>

        {/* 3. Dépenses & Décaissements (Sorties d'argent) */}
        <article className="kx-kpi-card is-warning-kpi">
          <div className="kx-kpi-head">
            <span>{t("kpi_expenses_paid")}</span>
            <TrendingDown size={18} className="text-rose-500" />
          </div>
          <strong className="kx-kpi-value text-rose-600 dark:text-rose-400">{summary?.total_expenses_paid == null ? "Non calculable" : `-${formatMoney(totalExpensesPaid, currency)}`}</strong>
          <small>
            <Link href="/espace/depenses" className="kx-inline-link">
              {summary?.expenses_count || 0} {t("kpi_expenses_link")}
            </Link>
          </small>
        </article>

        {/* 4. Solde Réel en Caisse (Trésorerie Restante) */}
        <article className="kx-kpi-card bg-emerald-500/10 border border-emerald-500/30">
          <div className="kx-kpi-head">
            <span className="font-bold text-emerald-800 dark:text-emerald-300">Flux net des registres</span>
            <Wallet size={18} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <strong className="kx-kpi-value text-emerald-900 dark:text-emerald-100 font-semibold">{netCash === null ? "Non calculable" : formatMoney(netCash, currency)}</strong>
          <small className="text-emerald-700 dark:text-emerald-300 font-semibold">
            Ne constitue pas un solde de caisse
          </small>
        </article>

        {/* 5. Créances Clients (Reste à encaisser) */}
        <article className="kx-kpi-card is-warning-kpi">
          <div className="kx-kpi-head">
            <span>{t("kpi_unpaid_debts")}</span>
            <Clock size={18} className="kx-icon-orange" />
          </div>
          <strong className={`kx-kpi-value ${totalUnpaid > 0 ? "text-amber-600 dark:text-amber-400" : ""}`}>{showFinancial(summary?.total_unpaid_amount, totalUnpaid)}</strong>
          <small>
            <Link href="/espace/ventes" className="kx-inline-link">
              {t("kpi_unpaid_link")}
            </Link>
          </small>
        </article>

        {/* 6. Score Radar KORYXA */}
        <article className="kx-kpi-card is-score-kpi">
          <div className="kx-kpi-head">
            <span>{t("kpi_radar_score")}</span>
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

      {/* Business Performance & Profitability Cockpit */}
      <BusinessPerformanceCockpit
        totalSales={totalSales}
        totalPaid={totalPaid}
        totalUnpaid={totalUnpaid}
        totalExpensesPaid={totalExpensesPaid}
        totalExpensesUnpaid={totalExpensesUnpaid}
        netCash={netCash ?? 0}
        totalSalesCount={summary?.total_sales_count || 0}
        currency={currency}
        estimatedGrossMargin={
          summary?.estimated_gross_margin != null
            ? Number(summary.estimated_gross_margin)
            : undefined
        }
        grossMarginRate={summary?.gross_margin_rate ?? null}
        financialDataStatus={summary?.financial_data_status}
        financialWarnings={summary?.financial_warnings ?? []}
        averageOrderValue={
          summary?.average_order_value != null
            ? Number(summary.average_order_value)
            : undefined
        }
        breakEvenPoint={
          summary?.break_even_point != null
            ? Number(summary.break_even_point)
            : undefined
        }
        breakEvenProgress={summary?.break_even_progress ?? null}
        recoveryRate={summary?.recovery_rate ?? null}
        dailyBurnRate={
          summary?.daily_burn_rate != null
            ? Number(summary.daily_burn_rate)
            : undefined
        }
        cashRunwayDays={summary?.cash_runway_days ?? null}
        workingCapital={
          summary?.working_capital != null
            ? Number(summary.working_capital)
            : undefined
        }
      />

      {/* Morning Briefing Banner */}
      <section className="kx-briefing-card">
        <div className="kx-briefing-icon">
          <Compass size={24} />
        </div>
        <div className="kx-briefing-content">
          <h3>{t("briefing_title")}</h3>
          <p>
            {openAlerts.length > 0
              ? `Radar a identifié ${openAlerts.length} point(s) d'attention sur vos ventes et procédures.`
              : t("briefing_ok")}
          </p>
        </div>
        <div className="kx-briefing-action">
          <button
            className="app-button app-button-secondary"
            disabled={radarRunning}
            onClick={onTriggerRadar}
          >
            <Play size={15} />
            <span>{radarRunning ? "…" : t("btn_scan_radar")}</span>
          </button>
        </div>
      </section>

      {/* Dual Panel : Radar Alerts & Active Actions */}
      <section className="app-grid-two">
        {/* Left Panel: Critical Radar Alerts */}
        <article className="app-panel">
          <div className="app-panel-head">
            <div>
              <span className="app-eyebrow">{t("alerts_title")}</span>
              <h2>{t("alerts_subtitle")} ({openAlerts.length})</h2>
            </div>
            <Link href="/espace/radar" className="kx-panel-link">
              <span>{t("see_all_radar")}</span>
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
                    {t("btn_action")}
                  </button>
                  <button
                    className="app-text-button kx-btn-xs"
                    onClick={() => onResolveAlert(alert.id)}
                    title="Marquer comme vérifié et résolu"
                  >
                    {t("btn_resolve")}
                  </button>
                </div>
              </div>
            ))}

            {openAlerts.length === 0 && (
              <div className="kx-empty-box">
                <CheckCircle2 size={32} className="kx-icon-green" />
                <strong>{t("no_anomalies_open")}</strong>
                <p>{t("no_anomalies_desc")}</p>
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
                <span className="app-eyebrow">{t("execution_eyebrow")}</span>
                <h2>{t("actions_subtitle")} ({activeActions.length})</h2>
              </div>
              <Link href="/espace/actions" className="kx-panel-link">
                <span>{t("see_all_actions")}</span>
                <ArrowRight size={15} />
              </Link>
            </div>

            <div className="app-action-list">
              {activeActions.slice(0, 3).map((act) => (
                <div key={act.id} className="app-action">
                  <Zap size={16} className="kx-icon-emerald" />
                  <div className="kx-action-main">
                    <strong>{act.title}</strong>
                    <span>{t("assigned_to")} : {act.responsible_user_id || t("unassigned")} · {t("due_date")} : {formatDate(act.due_date)}</span>
                  </div>
                  <StatusPill>{formatLabel(act.status)}</StatusPill>
                </div>
              ))}

              {activeActions.length === 0 && (
                <div className="kx-empty-box kx-compact">
                  <p>{t("no_active_actions")}</p>
                </div>
              )}
            </div>
          </article>

          {/* Registries Summary Counter */}
          <article className="app-panel kx-registry-counters-panel">
            <div className="app-panel-head">
              <h2>{t("active_registers")}</h2>
            </div>
            <div className="kx-mini-registers-grid kx-five-grid">
              <Link href="/espace/ventes" className="kx-mini-register-item">
                <ReceiptText size={18} />
                <div>
                  <strong>{summary?.total_sales_count || 0}</strong>
                  <span>{proConfig.registers.sales.title}</span>
                </div>
              </Link>

              <Link href="/espace/depenses" className="kx-mini-register-item">
                <Wallet size={18} />
                <div>
                  <strong>{summary?.expenses_count || 0}</strong>
                  <span>{proConfig.registers.expenses.title}</span>
                </div>
              </Link>

              <Link href="/espace/fournisseurs" className="kx-mini-register-item">
                <Building size={18} />
                <div>
                  <strong>{summary?.suppliers_count || 0}</strong>
                  <span>{proConfig.registers.suppliers.title}</span>
                </div>
              </Link>

              <Link href="/espace/offres" className="kx-mini-register-item">
                <Tag size={18} />
                <div>
                  <strong>{summary?.offers_count || 0}</strong>
                  <span>{proConfig.registers.offers.title}</span>
                </div>
              </Link>

              <Link href="/espace/procedures" className="kx-mini-register-item">
                <FileCheck2 size={18} />
                <div>
                  <strong>{summary?.procedures_count || 0}</strong>
                  <span>{proConfig.registers.procedures.title}</span>
                </div>
              </Link>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
