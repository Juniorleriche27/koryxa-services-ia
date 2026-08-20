"use client";

import { useState } from "react";
import {
  Printer,
  Share2,
  CheckCircle2,
  Clock,
  FileText,
  Building,
  User,
  Calendar,
  CreditCard,
  QrCode,
  ArrowRight,
  RefreshCw,
  X,
  ExternalLink,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { Dialog } from "./Dialog";
import { formatMoney, formatDate } from "./RegistersTable";
import { SaleItem } from "./RegistersTable";

interface CommercialDocumentViewerProps {
  open: boolean;
  onClose: () => void;
  document: SaleItem | null;
  organizationName?: string;
  organizationCategory?: string;
  onRecordPayment?: (doc: SaleItem) => void;
  onConvert?: (doc: SaleItem, targetType: "invoice" | "receipt") => void;
}

export function CommercialDocumentViewer({
  open,
  onClose,
  document: doc,
  organizationName = "Entreprise KORYXA",
  organizationCategory = "Commerce & Distribution",
  onRecordPayment,
  onConvert,
}: CommercialDocumentViewerProps) {
  const [copied, setCopied] = useState(false);

  if (!open || !doc) return null;

  const total = Number(doc.total_amount) || 0;
  const paid = Number(doc.paid_amount || 0);
  const balance = Math.max(0, total - paid);
  const currency = doc.currency || "XOF";
  const docType = doc.document_type || (doc.payment_status === "paid" ? "receipt" : "invoice");

  const docTitles: Record<string, { title: string; subtitle: string; color: string; badge: string }> = {
    quote: {
      title: "DEVIS COMMERCIAL",
      subtitle: "Proposition tarifaire & conditions de réalisation",
      color: "border-blue-500 bg-blue-50/50 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200",
      badge: "🏷️ DEVIS",
    },
    proforma: {
      title: "FACTURE PRO FORMA",
      subtitle: "Facture préalable avant validation définitive",
      color: "border-purple-500 bg-purple-50/50 text-purple-900 dark:bg-purple-950/40 dark:text-purple-200",
      badge: "📄 PRO FORMA",
    },
    invoice: {
      title: "FACTURE OFFICIELLE",
      subtitle: "Titre de créance et justificatif de vente",
      color: "border-emerald-500 bg-emerald-50/50 text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200",
      badge: "🧾 FACTURE",
    },
    receipt: {
      title: "REÇU DE PAIEMENT / FACTURE ACQUITTÉE",
      subtitle: "Justificatif de règlement intégral et libératoire",
      color: "border-teal-500 bg-teal-50/50 text-teal-900 dark:bg-teal-950/40 dark:text-teal-200",
      badge: "✅ ACQUITTÉE",
    },
  };

  const currentMeta = docTitles[docType] || docTitles.invoice;

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    const text = `Bonjour ${doc.client_name || "Client"},\n\nVeuillez trouver le document *${currentMeta.title}* réf. *${doc.reference}* d'un montant total de *${formatMoney(total, currency)}*`
      + (balance > 0 ? ` (Solde restant : *${formatMoney(balance, currency)}*).` : ` (Entièrement réglé ✅).`)
      + `\n\nÉmis par *${organizationName}*.\nMerci pour votre confiance !`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <Dialog open={open} onClose={onClose} title="" description="">
      <div className="kx-commercial-document-container -mt-4">
        {/* Top Floating Actions Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-border print:hidden">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${currentMeta.color}`}>
              {currentMeta.badge}
            </span>
            <span className="text-xs font-bold text-muted-foreground">
              Réf : <strong className="text-foreground">{doc.reference}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Convert Action (Quote/Proforma -> Invoice) */}
            {(docType === "quote" || docType === "proforma") && onConvert && (
              <button
                type="button"
                onClick={() => onConvert(doc, "invoice")}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-xs"
              >
                <RefreshCw size={13} />
                <span>Convertir en Facture</span>
              </button>
            )}

            {/* Record Payment Action */}
            {balance > 0 && onRecordPayment && (
              <button
                type="button"
                onClick={() => onRecordPayment(doc)}
                className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 text-xs font-black flex items-center gap-1.5 transition cursor-pointer border border-emerald-300 dark:border-emerald-800"
              >
                <CreditCard size={13} />
                <span>Encaisser Acompte</span>
              </button>
            )}

            {/* WhatsApp Share */}
            <button
              type="button"
              onClick={handleShareWhatsApp}
              className="px-3 py-1.5 rounded-xl border border-border bg-card hover:bg-muted text-xs font-bold text-emerald-600 flex items-center gap-1.5 transition cursor-pointer"
              title="Partager sur WhatsApp"
            >
              <Share2 size={13} />
              <span>WhatsApp</span>
            </button>

            {/* Print Button */}
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <Printer size={13} />
              <span>Imprimer (PDF)</span>
            </button>
          </div>
        </div>

        {/* Printable Document Paper */}
        <div className="bg-white text-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-sm font-sans">
          {/* Header Block */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black grid place-items-center text-sm shadow-xs">
                  {organizationName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-950 tracking-tight leading-tight">
                    {organizationName}
                  </h2>
                  <span className="text-[11px] font-bold text-emerald-700 block">
                    {organizationCategory}
                  </span>
                </div>
              </div>
            </div>

            <div className="sm:text-right space-y-1">
              <span className={`inline-block px-3 py-1 rounded-lg text-xs font-black tracking-wider uppercase border ${currentMeta.color}`}>
                {currentMeta.title}
              </span>
              <div className="text-xs text-slate-600 font-medium">
                N° <strong>{doc.reference}</strong>
              </div>
              <div className="text-[11px] text-slate-500">
                Date : <strong>{formatDate(doc.sale_date, false)}</strong>
              </div>
              {doc.due_date && (
                <div className="text-[11px] text-amber-700 font-bold">
                  Échéance : <strong>{formatDate(doc.due_date, false)}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Client & Metadata Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                Destinataire / Client
              </span>
              <strong className="text-sm font-black text-slate-900 block">
                {doc.client_name || "Client au comptant"}
              </strong>
              {doc.sales_channel && (
                <span className="text-xs text-slate-500 block">Canal : {doc.sales_channel}</span>
              )}
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                Mode de Règlement
              </span>
              <strong className="text-xs font-bold text-slate-800 block">
                {doc.payment_method || "Espèces / Mobile Money"}
              </strong>
              <span className="text-xs text-slate-500 block">
                Statut : <strong className="uppercase">{doc.payment_status}</strong>
              </span>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 text-slate-900 font-black">
                  <th className="py-2.5 px-2">Désignation / Prestation</th>
                  <th className="py-2.5 px-2 text-center">Qté</th>
                  <th className="py-2.5 px-2 text-right">Prix Unitaire</th>
                  <th className="py-2.5 px-2 text-right">Remise</th>
                  <th className="py-2.5 px-2 text-right">Total Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-2">
                    <strong className="text-slate-900 font-bold block">{doc.item_label}</strong>
                    {doc.comment && <small className="text-slate-500 block mt-0.5">{doc.comment}</small>}
                  </td>
                  <td className="py-3 px-2 text-center font-bold text-slate-800">{doc.quantity}</td>
                  <td className="py-3 px-2 text-right font-medium text-slate-700">
                    {formatMoney(doc.unit_price, currency)}
                  </td>
                  <td className="py-3 px-2 text-right text-slate-500">
                    {Number(doc.discount) > 0 ? formatMoney(doc.discount, currency) : "—"}
                  </td>
                  <td className="py-3 px-2 text-right font-black text-slate-950">
                    {formatMoney(total, currency)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown & Settlement Status */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pt-4 border-t border-slate-200">
            {/* Payment history or notes */}
            <div className="space-y-2 max-w-sm">
              <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wide block">
                Historique des Règlements :
              </span>
              {doc.payment_history && doc.payment_history.length > 0 ? (
                <div className="space-y-1">
                  {doc.payment_history.map((h, i) => (
                    <div key={i} className="text-[11px] flex items-center gap-2 text-slate-600">
                      <span className="text-emerald-600 font-bold">✓</span>
                      <span>{formatDate(h.date, false)} :</span>
                      <strong>{formatMoney(h.amount, currency)}</strong>
                      <span className="text-slate-400">({h.method})</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  {paid >= total
                    ? "Règlement intégral comptant enregistré."
                    : "En attente de versement du règlement."}
                </p>
              )}
            </div>

            {/* Totals Summary Card */}
            <div className="w-full sm:w-64 space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Total Net :</span>
                <strong>{formatMoney(total, currency)}</strong>
              </div>

              <div className="flex justify-between text-xs text-emerald-700 font-bold">
                <span>Montant Encaissé :</span>
                <span>{formatMoney(paid, currency)}</span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="text-xs font-black text-slate-950">
                  {balance === 0 ? "Solde Réglé :" : "Solde Restant Dû :"}
                </span>
                <strong className={`text-sm font-black ${balance === 0 ? "text-emerald-700" : "text-amber-700"}`}>
                  {formatMoney(balance, currency)}
                </strong>
              </div>
            </div>
          </div>

          {/* Legal Footnote & Official Certified Stamp */}
          <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-slate-400">
            <div>
              Document émis et certifié par la Mémoire Opérationnelle <strong>KORYXA</strong>.
              <br />
              Pour toute question ou règlement : contactez directement l&apos;établissement.
            </div>

            {paid >= total && (
              <div className="px-3 py-1.5 rounded-xl border-2 border-emerald-600 text-emerald-700 font-black uppercase tracking-widest text-xs rotate-[-3deg] shadow-xs">
                ✓ FACTURE ACQUITTÉE
              </div>
            )}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
