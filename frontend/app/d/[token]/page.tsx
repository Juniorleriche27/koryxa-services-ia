"use client";

import React, { useEffect, useState, use } from "react";
import {
  FileText,
  CheckCircle2,
  Clock,
  Printer,
  Share2,
  Smartphone,
  ShieldCheck,
  CreditCard,
  PenTool,
  AlertCircle,
  Building2,
  Calendar,
  User,
  ArrowRight,
  Sparkles,
  Lock,
  Receipt,
  Tag,
  Check,
  Copy,
} from "lucide-react";
import { SignaturePad } from "@/components/smart-doc/SignaturePad";
import { PaymentDrawer } from "@/components/smart-doc/PaymentDrawer";
import { soundFx } from "@/components/smart-doc/soundEffects";

interface PublicDocumentData {
  token: string;
  id: string;
  reference: string;
  document_type: "quote" | "proforma" | "invoice" | "receipt";
  sale_date: string;
  due_date: string | null;
  item_label: string;
  quantity: number;
  unit_price: number;
  discount: number;
  total_amount: number;
  paid_amount: number;
  remaining_balance: number;
  currency: string;
  payment_status: "unpaid" | "partial" | "paid";
  payment_method: string | null;
  payment_history: Array<{
    date: string;
    amount: string | number;
    method: string;
    transaction_id?: string;
    comment?: string;
  }>;
  comment: string | null;
  organization_id: string;
  organization_name: string;
  organization_commercial_name: string | null;
  organization_phone: string | null;
  organization_email: string | null;
  organization_address: string | null;
  client_name: string | null;
  client_phone: string | null;
  client_email: string | null;
  signed_at: string | null;
  signed_by_name: string | null;
  signature_data: string | null;
  view_count: number;
  last_viewed_at: string | null;
}

export default function SmartDocumentPublicPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const [doc, setDoc] = useState<PublicDocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals & Panels
  const [showSignModal, setShowSignModal] = useState(false);
  const [signerName, setSignerName] = useState("");
  const [isSigning, setIsSigning] = useState(false);
  const [showPaymentDrawer, setShowPaymentDrawer] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [paymentSuccessToast, setPaymentSuccessToast] = useState<string | null>(null);

  const fetchDocument = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/public/documents/${token}`);
      if (!res.ok) {
        throw new Error("Ce document est introuvable ou le lien a expiré.");
      }
      const data = await res.json();
      setDoc(data);
      if (data.client_name) {
        setSignerName(data.client_name);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur de chargement.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, [token]);

  const handleSaveSignature = async (signatureDataUrl: string) => {
    if (!signerName.trim()) {
      alert("Veuillez saisir le nom et prénom du signataire.");
      return;
    }

    try {
      setIsSigning(true);
      const res = await fetch(`/api/public/documents/${token}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signer_name: signerName.trim(),
          signature_data: signatureDataUrl,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.detail || "Erreur lors de la signature.");
      }

      const updated = await res.json();
      setDoc(updated);
      setShowSignModal(false);
      soundFx.playSignatureVerifiedSound();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Échec de l'enregistrement de la signature.");
    } finally {
      setIsSigning(false);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const handlePaymentSuccess = (res: { transactionId: string; amount: number; method: string }) => {
    setPaymentSuccessToast(
      `Paiement de ${res.amount.toLocaleString("fr-FR")} ${doc?.currency || "FCFA"} validé avec succès (Réf: ${res.transactionId})`
    );
    fetchDocument();
    setTimeout(() => setPaymentSuccessToast(null), 8000);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6 animate-pulse">
          <div className="flex justify-between items-center">
            <div className="h-8 w-40 bg-slate-200 dark:bg-slate-800 rounded-xl" />
            <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
          <div className="h-24 bg-slate-100 dark:bg-slate-800/50 rounded-2xl" />
          <div className="space-y-3">
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />
            <div className="h-10 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !doc) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 text-center shadow-xl space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 grid place-items-center mx-auto">
            <AlertCircle size={28} />
          </div>
          <h1 className="text-lg font-black text-slate-950 dark:text-white">Document Introuvable</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {error || "Ce document n'existe pas ou le lien sécurisé a expiré. Veuillez contacter l'entreprise émettrice."}
          </p>
        </div>
      </main>
    );
  }

  const isQuote = doc.document_type === "quote";
  const isPaid = doc.payment_status === "paid" || doc.remaining_balance <= 0;
  const isPartiallyPaid = doc.paid_amount > 0 && !isPaid;
  const isSigned = Boolean(doc.signed_at);

  const docTitles: Record<string, { label: string; badge: string; color: string; icon: typeof Tag }> = {
    quote: {
      label: "DEVIS COMMERCIAL",
      badge: "DEVIS EN LIGNE",
      color: "border-blue-500 bg-blue-50 text-blue-900 dark:bg-blue-950/50 dark:text-blue-200",
      icon: Tag,
    },
    proforma: {
      label: "FACTURE PRO FORMA",
      badge: "PRO FORMA",
      color: "border-purple-500 bg-purple-50 text-purple-900 dark:bg-purple-950/50 dark:text-purple-200",
      icon: FileText,
    },
    invoice: {
      label: "FACTURE OFFICIELLE",
      badge: "FACTURE",
      color: "border-emerald-500 bg-emerald-50 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200",
      icon: Receipt,
    },
    receipt: {
      label: "REÇU DE PAIEMENT ACQUITTÉ",
      badge: "ACQUITTÉE",
      color: "border-teal-500 bg-teal-50 text-teal-900 dark:bg-teal-950/50 dark:text-teal-200",
      icon: CheckCircle2,
    },
  };

  const meta = docTitles[doc.document_type] || docTitles.invoice;

  return (
    <main className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-6 sm:py-10 px-3 sm:px-6 font-sans">
      <div className="max-w-3xl mx-auto space-y-4">
        {/* Payment Success Toast */}
        {paymentSuccessToast && (
          <div className="p-4 rounded-2xl bg-emerald-600 text-white shadow-xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={20} className="shrink-0" />
              <span className="text-xs font-black">{paymentSuccessToast}</span>
            </div>
            <button
              type="button"
              onClick={() => setPaymentSuccessToast(null)}
              className="text-white/80 hover:text-white text-xs font-bold"
            >
              Fermer
            </button>
          </div>
        )}

        {/* Top Floating Control Bar (Hidden when printing) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${meta.color}`}>
              <meta.icon size={13} />
              <span>{meta.badge}</span>
            </span>
            <span className="text-xs font-bold text-slate-500">
              Réf : <strong className="text-slate-950 dark:text-white">{doc.reference}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-2 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition cursor-pointer flex items-center gap-1.5"
              title="Copier le lien"
            >
              {copiedLink ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copiedLink ? "Copié !" : "Copier lien"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 min-h-[44px] rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:opacity-90 text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs"
            >
              <Printer size={14} />
              <span>Imprimer (PDF)</span>
            </button>
          </div>
        </div>

        {/* Printable Smart Document Paper */}
        <div className="bg-white text-slate-950 p-6 sm:p-10 rounded-3xl border border-slate-200/90 shadow-xl space-y-8 relative overflow-hidden">
          {/* Subtle Trust Security Banner */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 font-bold tracking-tight text-emerald-800">
              <ShieldCheck size={14} className="text-emerald-600" />
              <span>Document Certifié CAURI SmartDoc</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400 text-[10px]">
              <Lock size={12} />
              <span>Chiffrement TLS & intégrité horodatée</span>
            </div>
          </div>

          {/* Header Block: Organization + Document Meta */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-6 pb-6 border-b border-slate-200">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#1E3A5F] text-white font-black grid place-items-center text-base shadow-sm">
                  {doc.organization_name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h1 className="text-lg font-black text-slate-950 tracking-tight leading-tight">
                    {doc.organization_commercial_name || doc.organization_name}
                  </h1>
                  {doc.organization_address && (
                    <span className="text-xs text-slate-500 font-medium block">
                      {doc.organization_address}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="sm:text-right space-y-1">
              <span className={`inline-block px-3 py-1 rounded-xl text-xs font-black tracking-wider uppercase border ${meta.color}`}>
                {meta.label}
              </span>
              <div className="text-xs text-slate-700 font-bold">
                N° : <span className="font-mono">{doc.reference}</span>
              </div>
              <div className="text-[11px] text-slate-500">
                Date d&apos;émission : <strong>{doc.sale_date}</strong>
              </div>
              {doc.due_date && (
                <div className="text-[11px] text-amber-800 font-bold">
                  Échéance : <strong>{doc.due_date}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Client & Settlement Metadata Card */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div>
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                Destinataire / Client
              </span>
              <strong className="text-sm font-black text-slate-900 block">
                {doc.client_name || "Client"}
              </strong>
              {doc.client_phone && (
                <span className="text-xs text-slate-600 font-mono block mt-0.5">
                  Tél : {doc.client_phone}
                </span>
              )}
              {doc.client_email && (
                <span className="text-xs text-slate-500 block">{doc.client_email}</span>
              )}
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
                Statut du Document
              </span>
              <div className="flex sm:justify-end items-center gap-1.5 mt-0.5">
                {isPaid ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 size={12} />
                    <span>RÉGLÉ INTÉGRALEMENT</span>
                  </span>
                ) : isPartiallyPaid ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-100 text-amber-800 border border-amber-300">
                    <Clock size={12} />
                    <span>ACOMPTE REÇU - SOLDE EN ATTENTE</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-200 text-slate-800">
                    <span>EN ATTENTE DE RÈGLEMENT</span>
                  </span>
                )}
              </div>

              {isSigned && (
                <div className="text-[11px] text-emerald-700 font-bold mt-1.5 flex sm:justify-end items-center gap-1">
                  <Check size={12} />
                  <span>Devis validé et signé électroniquement</span>
                </div>
              )}
            </div>
          </div>

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-900 text-slate-900 font-black">
                  <th className="py-3 px-3">Désignation des Prestations / Articles</th>
                  <th className="py-3 px-3 text-center">Qté</th>
                  <th className="py-3 px-3 text-right">Prix Unitaire</th>
                  <th className="py-3 px-3 text-right">Remise</th>
                  <th className="py-3 px-3 text-right">Total Net</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-4 px-3">
                    <strong className="text-slate-950 font-bold text-sm block">
                      {doc.item_label}
                    </strong>
                    {doc.comment && (
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{doc.comment}</p>
                    )}
                  </td>
                  <td className="py-4 px-3 text-center font-bold text-slate-800">{doc.quantity}</td>
                  <td className="py-4 px-3 text-right font-medium text-slate-700">
                    {Number(doc.unit_price).toLocaleString("fr-FR")} {doc.currency}
                  </td>
                  <td className="py-4 px-3 text-right text-slate-500">
                    {Number(doc.discount) > 0
                      ? `${Number(doc.discount).toLocaleString("fr-FR")} ${doc.currency}`
                      : "—"}
                  </td>
                  <td className="py-4 px-3 text-right font-black text-slate-950 text-sm">
                    {Number(doc.total_amount).toLocaleString("fr-FR")} {doc.currency}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown Card & Payments */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pt-4 border-t border-slate-200">
            {/* Payment history list */}
            <div className="space-y-2 max-w-sm">
              <span className="text-[11px] font-extrabold text-slate-700 uppercase tracking-wide block">
                Règlements Enregistrés :
              </span>
              {doc.payment_history && doc.payment_history.length > 0 ? (
                <div className="space-y-1.5">
                  {doc.payment_history.map((h, i) => (
                    <div
                      key={i}
                      className="text-xs flex items-center gap-2 p-2 rounded-xl bg-emerald-50/60 border border-emerald-100 text-slate-800"
                    >
                      <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
                      <span className="text-slate-500 text-[11px]">{h.date} :</span>
                      <strong>
                        {Number(h.amount).toLocaleString("fr-FR")} {doc.currency}
                      </strong>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                        {h.method}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Aucun paiement n&apos;a encore été enregistré sur ce document.
                </p>
              )}
            </div>

            {/* Totals Summary */}
            <div className="w-full sm:w-72 space-y-2.5 p-4 rounded-2xl bg-slate-50 border border-slate-200/90">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Total Net :</span>
                <strong>
                  {Number(doc.total_amount).toLocaleString("fr-FR")} {doc.currency}
                </strong>
              </div>

              <div className="flex justify-between text-xs text-emerald-700 font-bold">
                <span>Montant Encaissé :</span>
                <span>
                  {Number(doc.paid_amount).toLocaleString("fr-FR")} {doc.currency}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="text-xs font-black text-slate-950">
                  {doc.remaining_balance <= 0 ? "Solde Réglé :" : "Solde Restant Dû :"}
                </span>
                <strong
                  className={`text-base font-black ${
                    doc.remaining_balance <= 0 ? "text-emerald-700" : "text-amber-700"
                  }`}
                >
                  {Number(doc.remaining_balance).toLocaleString("fr-FR")} {doc.currency}
                </strong>
              </div>
            </div>
          </div>

          {/* Interactive Actions & Signature Section (Visible in UI) */}
          <div className="pt-6 border-t border-slate-200 space-y-6 print:hidden">
            {/* 1. Tactile Signature Section for Quote or Unsigned Documents */}
            {isQuote && (
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PenTool size={16} className="text-blue-600" />
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      Signature Électronique Tactile
                    </h3>
                  </div>
                  {isSigned && (
                    <span className="text-[11px] font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <Check size={12} />
                      <span>Signé & Certifié</span>
                    </span>
                  )}
                </div>

                {isSigned ? (
                  <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <span className="text-[11px] text-slate-500 block">Signé par :</span>
                      <strong className="text-xs font-black text-slate-900">
                        {doc.signed_by_name}
                      </strong>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        Horodatage : {doc.signed_at ? new Date(doc.signed_at).toLocaleString("fr-FR") : ""}
                      </span>
                    </div>

                    {doc.signature_data && (
                      <div className="p-2 rounded-lg border border-slate-100 bg-slate-50 max-w-[160px]">
                        <img
                          src={doc.signature_data}
                          alt="Signature certifiée"
                          className="max-h-12 w-auto object-contain"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-600">
                      En tant que client, vous pouvez valider et signer ce devis d&apos;un simple trait
                      de doigt sur votre écran tactile.
                    </p>

                    {!showSignModal ? (
                      <button
                        type="button"
                        onClick={() => setShowSignModal(true)}
                        className="px-4 py-2.5 min-h-[44px] rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black transition cursor-pointer flex items-center gap-2 shadow-xs"
                      >
                        <PenTool size={14} />
                        <span>Signer ce devis au doigt</span>
                      </button>
                    ) : (
                      <div className="p-4 rounded-2xl bg-white border border-slate-300 shadow-sm space-y-3 animate-in fade-in duration-200">
                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 mb-1">
                            Nom & Prénom du Signataire
                          </label>
                          <input
                            type="text"
                            value={signerName}
                            onChange={(e) => setSignerName(e.target.value)}
                            placeholder="Ex: Mme Awa Diop"
                            className="w-full px-3 py-2 min-h-[44px] rounded-xl border border-slate-300 text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <SignaturePad
                          onSave={handleSaveSignature}
                          onCancel={() => setShowSignModal(false)}
                          isSubmitting={isSigning}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 2. Instant 1-Click Payment CTA Banner */}
            {!isPaid && (
              <div className="p-6 rounded-3xl bg-linear-to-r from-emerald-600 to-teal-700 text-white shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200 flex items-center justify-center sm:justify-start gap-1">
                    <Sparkles size={12} />
                    <span>Règlement Instantané Mobile Money & CB</span>
                  </span>
                  <h2 className="text-base sm:text-lg font-black tracking-tight">
                    Régler le solde en 1-Clic
                  </h2>
                  <p className="text-xs text-emerald-100 max-w-md">
                    Payez immédiatement par <strong>Wave</strong>, <strong>Orange Money</strong>,{" "}
                    <strong>MTN MoMo</strong>, <strong>Moov</strong> ou <strong>Carte Bancaire</strong>.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPaymentDrawer(true)}
                  className="px-6 py-3.5 min-h-[48px] rounded-2xl bg-white text-emerald-900 hover:bg-emerald-50 font-black text-xs sm:text-sm transition cursor-pointer flex items-center gap-2 shadow-lg shrink-0"
                >
                  <Smartphone size={16} />
                  <span>Payer {Number(doc.remaining_balance).toLocaleString("fr-FR")} {doc.currency}</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Official Certified Stamp (Visible on Print and Screen when paid) */}
          {isPaid && (
            <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
              <div className="text-[11px] text-slate-400">
                Document intégralement soldé et certifié conforme par la Mémoire Opérationnelle{" "}
                <strong>CAURI</strong>.
              </div>

              <div className="px-4 py-2 rounded-2xl border-2 border-emerald-600 text-emerald-700 font-black uppercase tracking-widest text-xs rotate-[-3deg] shadow-xs">
                ✓ FACTURE ACQUITTÉE
              </div>
            </div>
          )}
        </div>

        {/* Payment Drawer Modal */}
        <PaymentDrawer
          open={showPaymentDrawer}
          onClose={() => setShowPaymentDrawer(false)}
          currency={doc.currency}
          totalAmount={Number(doc.total_amount)}
          paidAmount={Number(doc.paid_amount)}
          remainingBalance={Number(doc.remaining_balance)}
          clientPhone={doc.client_phone}
          clientName={doc.client_name}
          onPaymentSuccess={handlePaymentSuccess}
          token={token}
        />
      </div>
    </main>
  );
}
