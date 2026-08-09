"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  Copy,
  Check,
  Send,
  Sparkles,
  Smartphone,
  ShieldCheck,
  HelpCircle,
  Plus,
  Trash2,
} from "lucide-react";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { FormError } from "./Dialog";
import { StatusPill } from "./Ui";

interface WhatsAppConfigData {
  phone_number_id: string | null;
  verify_token: string;
  is_active: boolean;
  authorized_sender_numbers: string[];
  auto_reply_enabled: boolean;
}

export function WhatsAppConfigView({ orgSlug }: { orgSlug: string }) {
  const [config, setConfig] = useState<WhatsAppConfigData>({
    phone_number_id: "",
    verify_token: "koryxa_secret_webhook_token",
    is_active: true,
    authorized_sender_numbers: ["+2250708091011", "+221770001122"],
    auto_reply_enabled: true,
  });
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [newNumber, setNewNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [simText, setSimText] = useState("Vente de 2 cartons de carrelage à 45000 FCFA client M. Sanogo payé par Wave");
  const [simResult, setSimResult] = useState<any>(null);
  const [simulating, setSimulating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const webhookUrl = typeof window !== "undefined"
    ? `${window.location.origin}/api/service-ia/integrations/whatsapp/webhook?org_id=${orgSlug}`
    : `https://votre-domaine.com/api/service-ia/integrations/whatsapp/webhook?org_id=${orgSlug}`;

  useEffect(() => {
    serviceIaFetch<WhatsAppConfigData>("/integrations/whatsapp/config")
      .then(setConfig)
      .catch(() => {});
  }, []);

  const copyToClipboard = (text: string, isUrl: boolean) => {
    navigator.clipboard.writeText(text);
    if (isUrl) {
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } else {
      setCopiedToken(true);
      setTimeout(() => setCopiedToken(false), 2000);
    }
  };

  const handleAddNumber = () => {
    if (!newNumber.trim()) return;
    const formatted = newNumber.trim();
    if (!config.authorized_sender_numbers.includes(formatted)) {
      setConfig((prev) => ({
        ...prev,
        authorized_sender_numbers: [...prev.authorized_sender_numbers, formatted],
      }));
      setNewNumber("");
    }
  };

  const handleRemoveNumber = (num: string) => {
    setConfig((prev) => ({
      ...prev,
      authorized_sender_numbers: prev.authorized_sender_numbers.filter((n) => n !== num),
    }));
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const updated = await serviceIaFetch<WhatsAppConfigData>("/integrations/whatsapp/config", {
        method: "PUT",
        body: JSON.stringify(config),
      });
      setConfig(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleSimulateInbound = async () => {
    if (!simText.trim()) return;
    setSimulating(true);
    setSimResult(null);
    try {
      const res = await serviceIaFetch<any>("/integrations/whatsapp/webhook", {
        method: "POST",
        body: JSON.stringify({
          from: config.authorized_sender_numbers[0] || "+225070000000",
          text: simText,
          organization_id: orgSlug,
        }),
      });
      setSimResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="kx-wa-container">
      {/* Intro Banner */}
      <div className="kx-wa-hero">
        <div className="kx-wa-hero-icon">
          <MessageSquare size={32} />
        </div>
        <div className="kx-wa-hero-text">
          <h2>Passerelle WhatsApp Business (WhatsApp-to-Register)</h2>
          <p>
            Permettez à vos commerciaux et équipes de terrain d&apos;enregistrer leurs ventes en direct par note vocale ou texte sur WhatsApp.
          </p>
        </div>
      </div>

      <div className="kx-wa-grid">
        {/* Left Column: Connection Credentials */}
        <div className="app-panel kx-wa-card">
          <h3>Paramètres de Connexion Meta Cloud API</h3>
          <p className="app-panel-note">
            Copiez ces informations dans votre tableau de bord Meta for Developers (section WhatsApp &gt; Configuration).
          </p>

          <div className="app-form-stack" style={{ marginTop: 14 }}>
            <label>
              URL du Webhook KORYXA
              <div className="kx-copy-input-row">
                <input readOnly value={webhookUrl} />
                <button
                  type="button"
                  className="app-button app-button-secondary"
                  onClick={() => copyToClipboard(webhookUrl, true)}
                >
                  {copiedUrl ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copiedUrl ? "Copié !" : "Copier"}</span>
                </button>
              </div>
            </label>

            <label>
              Token de Vérification (Verify Token)
              <div className="kx-copy-input-row">
                <input
                  value={config.verify_token}
                  onChange={(e) => setConfig({ ...config, verify_token: e.target.value })}
                />
                <button
                  type="button"
                  className="app-button app-button-secondary"
                  onClick={() => copyToClipboard(config.verify_token, false)}
                >
                  {copiedToken ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copiedToken ? "Copié !" : "Copier"}</span>
                </button>
              </div>
            </label>

            <label>
              Numéros de téléphone des vendeurs autorisés
              <div className="kx-copy-input-row">
                <input
                  placeholder="Ex : +2250708091011"
                  value={newNumber}
                  onChange={(e) => setNewNumber(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddNumber();
                    }
                  }}
                />
                <button type="button" className="app-button app-button-primary" onClick={handleAddNumber}>
                  <Plus size={16} />
                  <span>Ajouter</span>
                </button>
              </div>
            </label>

            <div className="kx-number-tags-list">
              {config.authorized_sender_numbers.map((num) => (
                <span key={num} className="kx-number-tag">
                  <Smartphone size={13} />
                  <span>{num}</span>
                  <button type="button" onClick={() => handleRemoveNumber(num)}>
                    <Trash2 size={12} />
                  </button>
                </span>
              ))}
            </div>

            {saveSuccess && <div className="kx-success-alert">Configuration WhatsApp enregistrée avec succès.</div>}

            <div className="app-form-actions">
              <button
                type="button"
                className="app-button app-button-primary"
                disabled={saving}
                onClick={handleSaveConfig}
              >
                {saving ? "Enregistrement…" : "Enregistrer les paramètres"}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Inbound Message Simulator */}
        <div className="app-panel kx-wa-card">
          <div className="kx-card-badge-head">
            <h3>Simulateur de Message WhatsApp</h3>
            <span className="kx-sim-badge">Test en direct</span>
          </div>
          <p className="app-panel-note">
            Testez comment KORYXA réagit lorsqu&apos;un vendeur envoie une note de vente par WhatsApp.
          </p>

          <div className="kx-chat-simulator">
            <div className="kx-chat-bubble-in">
              <small>Vendeur (+225 07 08 09 10 11)</small>
              <textarea
                className="kx-sim-textarea"
                rows={3}
                value={simText}
                onChange={(e) => setSimText(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="app-button app-button-primary kx-sim-send-btn"
              disabled={simulating}
              onClick={handleSimulateInbound}
            >
              <Send size={15} />
              <span>{simulating ? "Traitement IA…" : "Simuler l'envoi WhatsApp"}</span>
            </button>

            {simResult && (
              <div className="kx-chat-bubble-out">
                <div className="kx-bubble-brand">
                  <Sparkles size={14} />
                  <strong>KORYXA Bot (Réponse automatique)</strong>
                </div>
                <pre className="kx-reply-pre">{simResult.reply_message}</pre>
                <div className="kx-sim-record-tag">
                  <Check size={14} className="kx-icon-green" />
                  <span>Vente {simResult.record?.reference} créée dans le registre</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
