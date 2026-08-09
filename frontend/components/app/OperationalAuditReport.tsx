"use client";

import { Printer, ArrowLeft, ShieldCheck, CheckCircle2, AlertTriangle, Building2, Calendar, FileText, Check } from "lucide-react";
import { formatMoney, formatDate, formatLabel } from "./RegistersTable";

export interface OperationalAuditData {
  organizationName: string;
  generatedDate: string;
  reportRef: string;
  summary: {
    totalSalesCount: number;
    totalSalesAmount: number;
    totalPaidAmount: number;
    totalUnpaidAmount: number;
    totalPartialAmount: number;
    offersCount: number;
    proceduresCount: number;
    currency: string;
  };
  radarScores: {
    globalScore: number;
    completeness: number;
    freshness: number;
    consistency: number;
    traceability: number;
  };
  criticalAlerts: Array<{
    id: string;
    title: string;
    explanation: string;
    priority: string;
    dimension: string;
  }>;
  recentSales: Array<{
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

export function OperationalAuditReport({
  data,
  onClose,
}: {
  data: OperationalAuditData;
  onClose: () => void;
}) {
  const handlePrint = () => {
    window.print();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "is-score-good";
    if (score >= 50) return "is-score-medium";
    return "is-score-warning";
  };

  return (
    <div className="kx-audit-modal-backdrop">
      <div className="kx-audit-report-sheet">
        {/* Navigation toolbar (hidden on print) */}
        <div className="kx-audit-toolbar no-print">
          <button className="app-button app-button-secondary" onClick={onClose}>
            <ArrowLeft size={16} />
            <span>Fermer le bilan</span>
          </button>
          <div className="kx-audit-toolbar-right">
            <span>Mise en page optimisée pour PDF / Papier A4</span>
            <button className="app-button app-button-primary" onClick={handlePrint}>
              <Printer size={16} />
              <span>Imprimer en PDF</span>
            </button>
          </div>
        </div>

        {/* Printable Report Content */}
        <div className="kx-audit-printable">
          {/* Header */}
          <header className="kx-report-header">
            <div className="kx-report-brand">
              <div className="kx-report-logo">
                <span>K</span>
              </div>
              <div>
                <h1>KORYXA Service IA</h1>
                <p>Mémoire Opérationnelle & Bilan de Santé d&apos;Entreprise</p>
              </div>
            </div>
            <div className="kx-report-meta">
              <div>
                <span>Entreprise audité</span>
                <strong>{data.organizationName}</strong>
              </div>
              <div>
                <span>Date d&apos;émission</span>
                <strong>{data.generatedDate}</strong>
              </div>
              <div>
                <span>Réf. Rapport</span>
                <code>{data.reportRef}</code>
              </div>
            </div>
          </header>

          <hr className="kx-report-divider" />

          {/* Executive Summary Score */}
          <section className="kx-report-score-box">
            <div className="kx-score-main">
              <div className={`kx-score-circle ${getScoreColor(data.radarScores.globalScore)}`}>
                <span>{data.radarScores.globalScore}</span>
                <small>/100</small>
              </div>
              <div className="kx-score-text">
                <h2>Indice Global de Maturité Opérationnelle</h2>
                <p>
                  Cet indice certifie le niveau de structuration, la fiabilité des données et la traçabilité des processus de l&apos;entreprise.
                </p>
              </div>
            </div>

            <div className="kx-score-grid">
              <div className="kx-score-card">
                <span>Complétude</span>
                <strong>{data.radarScores.completeness}%</strong>
                <small>Informations essentielles enregistrées</small>
              </div>
              <div className="kx-score-card">
                <span>Fraîcheur</span>
                <strong>{data.radarScores.freshness}%</strong>
                <small>Données vérifiées récemment</small>
              </div>
              <div className="kx-score-card">
                <span>Cohérence</span>
                <strong>{data.radarScores.consistency}%</strong>
                <small>Absence de contradictions ou doublons</small>
              </div>
              <div className="kx-score-card">
                <span>Traçabilité</span>
                <strong>{data.radarScores.traceability}%</strong>
                <small>Sources et responsables identifiés</small>
              </div>
            </div>
          </section>

          {/* Financial & Registry Health */}
          <section className="kx-report-section">
            <h3 className="kx-report-section-title">
              <ShieldCheck size={18} />
              <span>1. Synthèse Commerciale & Recouvrement</span>
            </h3>

            <div className="kx-report-fin-grid">
              <div className="kx-report-fin-card">
                <span>Chiffre d&apos;Affaires Enregistré</span>
                <strong>{formatMoney(data.summary.totalSalesAmount, data.summary.currency)}</strong>
                <small>{data.summary.totalSalesCount} ventes suivies</small>
              </div>
              <div className="kx-report-fin-card is-positive">
                <span>Total Encaissé Vérifié</span>
                <strong>{formatMoney(data.summary.totalPaidAmount, data.summary.currency)}</strong>
                <small>Paiements confirmés</small>
              </div>
              <div className="kx-report-fin-card is-warning">
                <span>Reste à Recouvrer (Impayés)</span>
                <strong>{formatMoney(data.summary.totalUnpaidAmount, data.summary.currency)}</strong>
                <small>Ventes en attente de règlement</small>
              </div>
              <div className="kx-report-fin-card">
                <span>Offres & Procédures</span>
                <strong>{data.summary.offersCount} offres / {data.summary.proceduresCount} proc.</strong>
                <small>Registres officiels actifs</small>
              </div>
            </div>
          </section>

          {/* Critical Alerts & Radar Sentinelle */}
          <section className="kx-report-section">
            <h3 className="kx-report-section-title">
              <AlertTriangle size={18} />
              <span>2. Points d&apos;Attention & Recommandations Radar</span>
            </h3>

            {data.criticalAlerts.length === 0 ? (
              <div className="kx-report-empty-alerts">
                <CheckCircle2 size={22} className="kx-icon-green" />
                <p>Aucune anomalie critique détectée. La mémoire opérationnelle est saine et à jour.</p>
              </div>
            ) : (
              <div className="kx-report-alert-table">
                <table>
                  <thead>
                    <tr>
                      <th>Priorité</th>
                      <th>Anomalie constatée</th>
                      <th>Explication & Impact</th>
                      <th>Dimension</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.criticalAlerts.slice(0, 6).map((alert) => (
                      <tr key={alert.id}>
                        <td>
                          <span className={`kx-pill-priority kx-priority-${alert.priority}`}>
                            {formatLabel(alert.priority)}
                          </span>
                        </td>
                        <td>
                          <strong>{alert.title}</strong>
                        </td>
                        <td>{alert.explanation}</td>
                        <td>{formatLabel(alert.dimension)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Recent Audited Sales */}
          <section className="kx-report-section">
            <h3 className="kx-report-section-title">
              <FileText size={18} />
              <span>3. Dernières Ventes Vérifiées</span>
            </h3>

            <div className="kx-report-table-scroll">
              <table className="kx-report-table">
                <thead>
                  <tr>
                    <th>Réf</th>
                    <th>Date</th>
                    <th>Client</th>
                    <th>Prestation / Produit</th>
                    <th style={{ textAlign: "right" }}>Montant</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentSales.slice(0, 8).map((sale) => (
                    <tr key={sale.id}>
                      <td>
                        <code>{sale.reference}</code>
                      </td>
                      <td>{formatDate(sale.sale_date)}</td>
                      <td>{sale.client_name || "—"}</td>
                      <td>{sale.item_label}</td>
                      <td style={{ textAlign: "right" }}>
                        <strong>{formatMoney(sale.total_amount, sale.currency)}</strong>
                      </td>
                      <td>
                        <span className={`kx-status-badge kx-badge-${sale.payment_status}`}>
                          {formatLabel(sale.payment_status)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Signatures & Certification */}
          <footer className="kx-report-footer">
            <div className="kx-report-cert-text">
              <p>
                Document généré automatiquement par <strong>KORYXA Service IA</strong> — Mémoire Opérationnelle & Qualité de Données.
                Certifié conforme aux enregistrements du registre d&apos;entreprise à la date d&apos;émission.
              </p>
            </div>
            <div className="kx-report-signatures">
              <div className="kx-sig-block">
                <span>Le Responsable Opérationnel</span>
                <div className="kx-sig-line"></div>
                <small>Nom & Signature</small>
              </div>
              <div className="kx-sig-block">
                <span>La Direction Générale / Expert</span>
                <div className="kx-sig-line"></div>
                <small>Cachet & Date</small>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
