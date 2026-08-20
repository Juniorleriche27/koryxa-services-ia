"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  MessageSquare,
  Mail,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  Clock,
  Send,
} from "lucide-react";
import { Dialog, FormError } from "./Dialog";
import { serviceIaFetch } from "@/lib/service-ia/api";

interface PaymentReminderDialogProps {
  open: boolean;
  onClose: () => void;
  sale: {
    id: string;
    reference: string;
    client_name?: string | null;
    total_amount: number | string;
    paid_amount?: number | string | null;
    due_date?: string | null;
    currency: string;
    sale_date: string;
  } | null;
}

interface ReminderResponse {
  subject: string | null;
  body: string;
  provider_used: string;
  formatted_whatsapp_url: string | null;
}

export function PaymentReminderDialog({
  open,
  onClose,
  sale,
}: PaymentReminderDialogProps) {
  const [tone, setTone] = useState<"courteous" | "firm" | "legal">("courteous");
  const [channel, setChannel] = useState<"whatsapp" | "email" | "sms">("whatsapp");
  const [timing, setTiming] = useState<"upcoming" | "due_today" | "overdue">(() => {
    if (!sale?.due_date) return "overdue";
    const today = new Date().toISOString().slice(0, 10);
    if (sale.due_date > today) return "upcoming";
    if (sale.due_date === today) return "due_today";
    return "overdue";
  });
  const [paymentInfo, setPaymentInfo] = useState("Wave / Orange Money / MTN MoMo ou Virement bancaire");
  const [loading, setLoading] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<ReminderResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const calculateOverdueDays = (dueDateStr?: string | null, saleDateStr?: string) => {
    const targetDateStr = dueDateStr || saleDateStr;
    if (!targetDateStr) return 0;
    const targetDate = new Date(targetDateStr);
    const today = new Date();
    const diffTime = Math.max(0, today.getTime() - targetDate.getTime());
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleGenerate = async () => {
    if (!sale) return;
    setLoading(true);
    setError("");
    setCopied(false);
    try {
      const overdueDays = calculateOverdueDays(sale.due_date, sale.sale_date);
      const total = Number(sale.total_amount || 0);
      const paid = Number(sale.paid_amount || 0);
      const balance = Math.max(0, total - paid);

      const res = await serviceIaFetch<ReminderResponse>("/ai/generate-payment-reminder", {
        method: "POST",
        body: JSON.stringify({
          sale_id: sale.id,
          client_name: sale.client_name || "Client",
          amount: total,
          paid_amount: paid,
          balance_due: balance,
          due_date: sale.due_date || null,
          due_status: timing,
          currency: sale.currency || "XOF",
          reference: sale.reference,
          overdue_days: overdueDays,
          tone,
          channel,
          payment_methods_info: paymentInfo,
        }),
      });
      setGeneratedResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de la génération de la relance");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && sale) {
      void handleGenerate();
    }
  }, [open, sale, tone, channel, timing]);

  const copyToClipboard = () => {
    if (!generatedResult) return;
    const textToCopy = generatedResult.subject
      ? `Objet : ${generatedResult.subject}\n\n${generatedResult.body}`
      : generatedResult.body;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!open || !sale) return null;

  return (
    <Dialog
      open
      title="Générateur de Relance Client (IA)"
      description={`Rédigez un rappel sur-mesure pour la vente ${sale.reference} auprès de ${sale.client_name || "votre client"}.`}
      onClose={onClose}
    >
      <div className="kx-reminder-generator-body">
        {/* Timing Selector: Avant échéance / Jour J / En retard */}
        <div className="kx-option-block mb-3">
          <span className="kx-option-label">Moment de la relance (Cycle d&apos;échéance) :</span>
          <div className="grid grid-cols-3 gap-2 mt-1">
            {[
              { id: "upcoming", label: "⏳ Avant échéance", desc: "Rappel préventif" },
              { id: "due_today", label: "⚡ Jour J", desc: "Échéance ce jour" },
              { id: "overdue", label: "🚨 En retard", desc: "Échéance dépassée" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                className={`p-2 rounded-xl border text-xs text-left transition cursor-pointer ${
                  timing === t.id
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-black"
                    : "border-border text-muted-foreground hover:border-slate-400"
                }`}
                onClick={() => setTiming(t.id as "upcoming" | "due_today" | "overdue")}
              >
                <div className="font-bold">{t.label}</div>
                <div className="text-[10px] opacity-75">{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Controls Bar: Tone & Channel */}
        <div className="kx-reminder-options-grid">
          <div className="kx-option-block">
            <span className="kx-option-label">Tonalité du message :</span>
            <div className="kx-tone-selector">
              <button
                type="button"
                className={`kx-tone-btn ${tone === "courteous" ? "is-active" : ""}`}
                onClick={() => setTone("courteous")}
              >
                <span>Amical & Courtois</span>
                <small>Premier rappel bienveillant</small>
              </button>
              <button
                type="button"
                className={`kx-tone-btn ${tone === "firm" ? "is-active" : ""}`}
                onClick={() => setTone("firm")}
              >
                <span>Ferme & Précis</span>
                <small>Échéance dépassée</small>
              </button>
              <button
                type="button"
                className={`kx-tone-btn is-legal ${tone === "legal" ? "is-active" : ""}`}
                onClick={() => setTone("legal")}
              >
                <span>Mise en demeure</span>
                <small>Pré-contentieux juridique</small>
              </button>
            </div>
          </div>

          <div className="kx-option-block">
            <span className="kx-option-label">Canal d&apos;envoi :</span>
            <div className="kx-channel-selector">
              <button
                type="button"
                className={`kx-channel-btn ${channel === "whatsapp" ? "is-active" : ""}`}
                onClick={() => setChannel("whatsapp")}
              >
                <MessageSquare size={14} />
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                className={`kx-channel-btn ${channel === "email" ? "is-active" : ""}`}
                onClick={() => setChannel("email")}
              >
                <Mail size={14} />
                <span>Email</span>
              </button>
              <button
                type="button"
                className={`kx-channel-btn ${channel === "sms" ? "is-active" : ""}`}
                onClick={() => setChannel("sms")}
              >
                <span>SMS / Texte</span>
              </button>
            </div>
          </div>
        </div>

        {/* Generated Text Area */}
        <div className="kx-reminder-preview-box">
          <div className="kx-preview-header">
            <div className="kx-preview-meta">
              <Sparkles size={14} className="kx-icon-emerald" />
              <span>Texte généré par {generatedResult?.provider_used || "Cora"}</span>
            </div>
            {generatedResult && (
              <button
                type="button"
                className="kx-copy-badge-btn"
                onClick={copyToClipboard}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? "Copié !" : "Copier"}</span>
              </button>
            )}
          </div>

          {loading && (
            <div className="kx-preview-loading">
              <div className="kx-copilot-typing">
                <span />
                <span />
                <span />
              </div>
              <small>Rédaction intelligente de la relance…</small>
            </div>
          )}

          {!loading && generatedResult && (
            <div className="kx-preview-content">
              {generatedResult.subject && (
                <div className="kx-preview-subject">
                  <strong>Objet :</strong> {generatedResult.subject}
                </div>
              )}
              <div className="kx-preview-body" style={{ whiteSpace: "pre-wrap" }}>
                {generatedResult.body}
              </div>
            </div>
          )}
        </div>

        <FormError>{error}</FormError>

        {/* Action Buttons */}
        <div className="app-form-actions">
          <button type="button" className="app-button app-button-secondary" onClick={onClose}>
            Fermer
          </button>

          {channel === "whatsapp" && generatedResult?.formatted_whatsapp_url && (
            <a
              href={generatedResult.formatted_whatsapp_url}
              target="_blank"
              rel="noopener noreferrer"
              className="app-button app-button-primary kx-whatsapp-send-btn"
            >
              <MessageSquare size={16} />
              <span>Ouvrir sur WhatsApp</span>
              <ExternalLink size={14} />
            </a>
          )}

          <button
            type="button"
            className="app-button app-button-primary"
            onClick={copyToClipboard}
          >
            <Copy size={16} />
            <span>{copied ? "Copié dans le presse-papier !" : "Copier le message"}</span>
          </button>
        </div>
      </div>
    </Dialog>
  );
}
