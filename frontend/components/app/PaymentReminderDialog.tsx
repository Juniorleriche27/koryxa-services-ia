"use client";

import { useState, useEffect } from "react";
import {
  CircleHelp,
  MessageSquare,
  Mail,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  Clock,
  Send,
  Zap,
  AlertTriangle,
  HeartHandshake,
  ShieldCheck,
} from "lucide-react";
import { Dialog, FormError } from "./Dialog";
import { serviceIaFetch } from "@/lib/service-ia/api";
import {
  generateStrategicPaymentReminder,
  ReminderTone,
  ReminderTiming,
} from "@/lib/credit/whatsapp-reminder-engine";
import { ClientSolvencyBadge } from "../credit/ClientSolvencyBadge";
import { CreditTier } from "@/lib/credit/client-scoring";

interface PaymentReminderDialogProps {
  open: boolean;
  onClose: () => void;
  organizationName?: string;
  clientScore?: number;
  clientTier?: CreditTier;
  sale: {
    id: string;
    reference: string;
    client_name?: string | null;
    client_phone?: string | null;
    total_amount: number | string;
    paid_amount?: number | string | null;
    due_date?: string | null;
    currency?: string;
    sale_date: string;
    public_token?: string | null;
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
  organizationName = "CAURI",
  clientScore,
  clientTier,
  sale,
}: PaymentReminderDialogProps) {
  const [tone, setTone] = useState<ReminderTone>("courteous");
  const [channel, setChannel] = useState<"whatsapp" | "email" | "sms">("whatsapp");
  const [timing, setTiming] = useState<ReminderTiming>(() => {
    if (!sale?.due_date) return "overdue";
    const today = new Date().toISOString().slice(0, 10);
    if (sale.due_date > today) return "upcoming";
    if (sale.due_date === today) return "due_today";
    return "overdue";
  });
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

    const overdueDays = calculateOverdueDays(sale.due_date, sale.sale_date);
    const total = Number(sale.total_amount || 0);
    const paid = Number(sale.paid_amount || 0);
    const balance = Math.max(0, total - paid);

    // Générateur local stratégique garanti (immédiat & résilient)
    const localGenerated = generateStrategicPaymentReminder({
      clientName: sale.client_name,
      clientPhone: sale.client_phone,
      reference: sale.reference,
      totalAmount: total,
      paidAmount: paid,
      balanceDue: balance,
      dueDate: sale.due_date,
      overdueDays,
      currency: sale.currency || "XOF",
      organizationName,
      publicToken: sale.public_token,
      tone,
      timing,
      clientTier,
    });

    try {
      // Tentative Knowlia IA en tâche de fond pour enrichissement
      const res = await serviceIaFetch<ReminderResponse>("/ai/generate-payment-reminder", {
        method: "POST",
        body: JSON.stringify({
          sale_id: sale.id,
          client_name: sale.client_name || "Client",
          client_phone: sale.client_phone || null,
          organization_name: organizationName,
          amount: total,
          paid_amount: paid,
          balance_due: balance,
          due_date: sale.due_date || null,
          due_status: timing,
          currency: sale.currency || "XOF",
          reference: sale.reference,
          overdue_days: overdueDays,
          tone: tone === "proximity" ? "courteous" : tone,
          channel,
          payment_methods_info: "Wave, Orange Money, Moov, MTN MoMo ou Virement",
        }),
      });

      // Si l'IA n'a pas inclus le lien SmartDoc vivant mais qu'on a un token, on l'injecte proprement
      let finalBody = res.body;
      if (sale.public_token && !finalBody.includes("/d/")) {
        const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://cauri.app";
        finalBody += `\n\n👉 Consultez votre facture certifiée et réglez en 1 clic : ${baseUrl}/d/${sale.public_token}`;
      }

      setGeneratedResult({
        subject: res.subject,
        body: finalBody,
        provider_used: res.provider_used || "Cora IA",
        formatted_whatsapp_url: localGenerated.whatsappUrl,
      });
    } catch {
      // En cas d'indisponibilité réseau, utilisation du générateur stratégique local
      setGeneratedResult({
        subject: localGenerated.subject,
        body: localGenerated.body,
        provider_used: "Moteur Stratégique Cauri",
        formatted_whatsapp_url: localGenerated.whatsappUrl,
      });
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
    const textToCopy =
      channel === "email" && generatedResult.subject
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
      title="Relance Stratégique Client & WhatsApp 1-Clic"
      description={`Rédigez un rappel sur-mesure pour la facture ${sale.reference} auprès de ${sale.client_name || "votre client"}.`}
      onClose={onClose}
    >
      <div className="kx-reminder-generator-body">
        {/* Badge Solvabilité Client si disponible */}
        {clientScore !== undefined && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: "rgba(0, 168, 107, 0.05)",
              border: "1px solid rgba(0, 168, 107, 0.15)",
              padding: "8px 12px",
              borderRadius: "10px",
              marginBottom: "12px",
            }}
          >
            <span style={{ fontSize: "12px", color: "#334155", fontWeight: 600 }}>
              Indice de Solvabilité du Client :
            </span>
            <ClientSolvencyBadge score={clientScore} tier={clientTier} size="md" />
          </div>
        )}

        {/* Timing Selector: Avant échéance / Jour J / En retard (sans émojis, icônes Lucide) */}
        <div className="kx-option-block mb-3">
          <span className="kx-option-label">Moment de la relance (Cycle d&apos;échéance) :</span>
          <div className="grid grid-cols-3 gap-2 mt-1">
            {[
              { id: "upcoming", label: "Avant échéance", icon: Clock, desc: "Rappel préventif" },
              { id: "due_today", label: "Jour J", icon: Zap, desc: "Échéance ce jour" },
              { id: "overdue", label: "En retard", icon: AlertTriangle, desc: "Échéance dépassée" },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  className={`p-2 rounded-xl border text-xs text-left transition cursor-pointer ${
                    timing === t.id
                      ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 font-black"
                      : "border-border text-muted-foreground hover:border-slate-400"
                  }`}
                  onClick={() => setTiming(t.id as ReminderTiming)}
                  style={{ minHeight: "44px" }}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <Icon size={13} />
                    <span>{t.label}</span>
                  </div>
                  <div className="text-[10px] opacity-75">{t.desc}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Controls Bar: 4 Tonalités & Canal */}
        <div className="kx-reminder-options-grid">
          <div className="kx-option-block">
            <span className="kx-option-label">Tonalité du message :</span>
            <div className="kx-tone-selector" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
              <button
                type="button"
                className={`kx-tone-btn ${tone === "proximity" ? "is-active" : ""}`}
                onClick={() => setTone("proximity")}
                style={{ minHeight: "44px" }}
              >
                <div className="flex items-center gap-1">
                  <HeartHandshake size={13} />
                  <span>Entente Locale</span>
                </div>
                <small>Proximité & Confiance UEMOA</small>
              </button>

              <button
                type="button"
                className={`kx-tone-btn ${tone === "courteous" ? "is-active" : ""}`}
                onClick={() => setTone("courteous")}
                style={{ minHeight: "44px" }}
              >
                <div className="flex items-center gap-1">
                  <ShieldCheck size={13} />
                  <span>Amical & Courtois</span>
                </div>
                <small>Premier rappel bienveillant</small>
              </button>

              <button
                type="button"
                className={`kx-tone-btn ${tone === "firm" ? "is-active" : ""}`}
                onClick={() => setTone("firm")}
                style={{ minHeight: "44px" }}
              >
                <div className="flex items-center gap-1">
                  <Clock size={13} />
                  <span>Ferme & Précis</span>
                </div>
                <small>Rappel d&apos;échéance formel</small>
              </button>

              <button
                type="button"
                className={`kx-tone-btn is-legal ${tone === "legal" ? "is-active" : ""}`}
                onClick={() => setTone("legal")}
                style={{ minHeight: "44px" }}
              >
                <div className="flex items-center gap-1">
                  <AlertTriangle size={13} />
                  <span>Mise en demeure</span>
                </div>
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
                style={{ minHeight: "44px" }}
              >
                <MessageSquare size={14} />
                <span>WhatsApp</span>
              </button>
              <button
                type="button"
                className={`kx-channel-btn ${channel === "email" ? "is-active" : ""}`}
                onClick={() => setChannel("email")}
                style={{ minHeight: "44px" }}
              >
                <Mail size={14} />
                <span>Email</span>
              </button>
              <button
                type="button"
                className={`kx-channel-btn ${channel === "sms" ? "is-active" : ""}`}
                onClick={() => setChannel("sms")}
                style={{ minHeight: "44px" }}
              >
                <Send size={14} />
                <span>SMS</span>
              </button>
            </div>
          </div>
        </div>

        {/* Generated Text Area */}
        <div className="kx-reminder-preview-box" style={{ marginTop: "12px" }}>
          <div className="kx-preview-header">
            <div className="kx-preview-meta">
              <CircleHelp size={14} className="kx-icon-emerald" />
              <span>Généré par {generatedResult?.provider_used || "Cora"}</span>
            </div>
            {generatedResult && (
              <button
                type="button"
                className="kx-copy-badge-btn"
                onClick={copyToClipboard}
                style={{ minHeight: "32px" }}
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
              <small>Rédaction intelligente avec lien Smart Document…</small>
            </div>
          )}

          {!loading && generatedResult && (
            <div className="kx-preview-content">
              {generatedResult.subject && channel === "email" && (
                <div className="kx-preview-subject">
                  <strong>Objet :</strong> {generatedResult.subject}
                </div>
              )}
              <div className="kx-preview-body" style={{ whiteSpace: "pre-wrap", fontSize: "13px" }}>
                {generatedResult.body}
              </div>
            </div>
          )}
        </div>

        <FormError>{error}</FormError>

        {/* Action Buttons */}
        <div className="app-form-actions" style={{ marginTop: "16px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button
            type="button"
            className="app-button app-button-secondary"
            onClick={onClose}
            style={{ minHeight: "44px" }}
          >
            Fermer
          </button>

          {channel === "whatsapp" && generatedResult?.formatted_whatsapp_url && (
            <a
              href={generatedResult.formatted_whatsapp_url}
              target="_blank"
              rel="noopener noreferrer"
              className="app-button app-button-primary kx-whatsapp-send-btn"
              style={{
                backgroundColor: "#25D366",
                borderColor: "#25D366",
                minHeight: "44px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "#ffffff",
                textDecoration: "none",
                fontWeight: 700,
              }}
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
            style={{ minHeight: "44px" }}
          >
            <Copy size={16} />
            <span>{copied ? "Copié dans le presse-papier !" : "Copier le message"}</span>
          </button>
        </div>
      </div>
    </Dialog>
  );
}
