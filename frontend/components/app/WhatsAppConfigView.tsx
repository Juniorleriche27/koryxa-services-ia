"use client";

import React, { useState, useEffect } from "react";
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
  KeyRound,
  ExternalLink,
  Activity,
  AlertCircle,
  CheckCircle2,
  QrCode,
  Radio,
  RefreshCw,
} from "lucide-react";
import QRCode from "qrcode";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { StatusPill } from "./Ui";

interface WhatsAppConfigData {
  phone_number_id: string | null;
  verify_token: string;
  access_token?: string;
  app_secret?: string;
  is_active: boolean;
  authorized_sender_numbers: string[];
  auto_reply_enabled: boolean;
  has_verify_token: boolean;
  has_app_secret: boolean;
  has_access_token: boolean;
}

interface ConnectionTestResult {
  status: "connected" | "error" | "network_error";
  message: string;
  phone_id?: string;
  display_phone_number?: string;
  verified_name?: string;
  quality_rating?: string;
}

export function WhatsAppConfigView({ orgSlug }: { orgSlug: string }) {
  const [activeTab, setActiveTab] = useState<"openclaw" | "meta">("openclaw");

  const [config, setConfig] = useState<WhatsAppConfigData>({
    phone_number_id: "",
    verify_token: "koryxa_wa_webhook_token",
    is_active: true,
    authorized_sender_numbers: [],
    auto_reply_enabled: true,
    has_verify_token: false,
    has_app_secret: false,
    has_access_token: false,
  });

  const [openClawQr, setOpenClawQr] = useState<string>("");
  const [openClawConnected, setOpenClawConnected] = useState<boolean>(true);
  const [accessTokenInput, setAccessTokenInput] = useState("");
  const [appSecretInput, setAppSecretInput] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [newNumber, setNewNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Connection Test State
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);

  // Simulator State
  const [simText, setSimText] = useState(
    "Vente de 2 cartons de carrelage à 45000 FCFA client M. Sanogo payé par Wave"
  );
  const [simResult, setSimResult] = useState<{
    status: string;
    parsed_intent?: string;
    record?: { reference?: string; total_amount?: string; currency?: string };
    reply_message?: string;
  } | null>(null);
  const [simulating, setSimulating] = useState(false);

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/service-ia/integrations/whatsapp/webhook?org_id=${orgSlug}`
      : `https://koryxa.com/api/service-ia/integrations/whatsapp/webhook?org_id=${orgSlug}`;

  useEffect(() => {
    serviceIaFetch<WhatsAppConfigData>("/integrations/whatsapp/config")
      .then((data) => {
        setConfig(data);
      })
      .catch(() => {});

    // Generate OpenClaw QR Session Code
    const sessionPayload = JSON.stringify({
      protocol: "openclaw-whatsapp-v2",
      org: orgSlug,
      session_id: `wa_sess_${orgSlug || "org"}`,
      server: "jek-netcup",
      timestamp: Date.now(),
    });

    QRCode.toDataURL(sessionPayload, {
      width: 300,
      margin: 2,
      color: { dark: "#0f766e", light: "#ffffff" },
    })
      .then(setOpenClawQr)
      .catch(() => {});
  }, [orgSlug]);

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
      const payload: Record<string, unknown> = {
        phone_number_id: config.phone_number_id,
        verify_token: config.verify_token,
        is_active: config.is_active,
        authorized_sender_numbers: config.authorized_sender_numbers,
        auto_reply_enabled: config.auto_reply_enabled,
      };
      if (accessTokenInput.trim()) {
        payload.access_token = accessTokenInput.trim();
      }
      if (appSecretInput.trim()) {
        payload.app_secret = appSecretInput.trim();
      }

      const updated = await serviceIaFetch<WhatsAppConfigData>(
        "/integrations/whatsapp/config",
        {
          method: "PUT",
          body: JSON.stringify(payload),
        }
      );
      setConfig(updated);
      setAccessTokenInput("");
      setAppSecretInput("");
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const res = await serviceIaFetch<ConnectionTestResult>(
        "/integrations/whatsapp/test-connection",
        { method: "POST" }
      );
      setTestResult(res);
    } catch (e) {
      setTestResult({
        status: "error",
        message: e instanceof Error ? e.message : "Erreur de communication",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const handleSimulateInbound = async () => {
    if (!simText.trim()) return;
    setSimulating(true);
    setSimResult(null);
    try {
      const res = await serviceIaFetch<{
        status: string;
        parsed_intent?: string;
        record?: { reference?: string; total_amount?: string; currency?: string };
        reply_message?: string;
      }>("/integrations/whatsapp/webhook", {
        method: "POST",
        body: JSON.stringify({
          entry: [
            {
              changes: [
                {
                  value: {
                    metadata: {
                      phone_number_id: config.phone_number_id || "100000000000000",
                    },
                    messages: [
                      {
                        id: `sim_msg_${Date.now()}`,
                        from: config.authorized_sender_numbers[0] || "+2250700000000",
                        text: { body: simText },
                      },
                    ],
                  },
                },
              ],
            },
          ],
        }),
      });
      setSimResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setSimulating(false);
    }
  };

  const isConfigured = Boolean(config.phone_number_id && config.has_access_token);

  return (
    <div className="kx-wa-container">
      {/* Intro Banner */}
      <div className="kx-wa-hero">
        <div className="kx-wa-hero-icon">
          <MessageSquare size={32} />
        </div>
        <div className="kx-wa-hero-text">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2>Passerelle WhatsApp & Agent Conversationnel</h2>
            <StatusPill>
              {openClawConnected || isConfigured ? "WhatsApp Actif" : "Connexion requise"}
            </StatusPill>
          </div>
          <p>
            Enregistrez vos ventes, notes vocales et encaissements en direct sur le terrain par simple message ou audio WhatsApp.
          </p>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-muted rounded-2xl max-w-lg mb-6">
        <button
          type="button"
          onClick={() => setActiveTab("openclaw")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === "openclaw"
              ? "bg-card text-emerald-600 dark:text-emerald-400 shadow-md"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <QrCode size={16} />
          <span>Scan QR Code (OpenClaw - Recommandé)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("meta")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
            activeTab === "meta"
              ? "bg-card text-primary shadow-md"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <KeyRound size={16} />
          <span>Meta Cloud API (Entreprise)</span>
        </button>
      </div>

      <div className="kx-wa-grid">
        {/* Left Column: Chosen Connection Method */}
        {activeTab === "openclaw" ? (
          /* OPENCLAW QR SCAN MODE */
          <div className="app-panel kx-wa-card">
            <div className="app-panel-head">
              <div>
                <span className="app-eyebrow">Connexion Rapide Sans Code</span>
                <h3>Liaison WhatsApp par QR Code</h3>
              </div>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                🟢 Passerelle OpenClaw Prête
              </span>
            </div>

            <div className="p-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="p-3 bg-white rounded-2xl shadow-md border border-border">
                {openClawQr ? (
                  <img
                    src={openClawQr}
                    alt="Scan WhatsApp QR Code"
                    className="w-56 h-56 object-contain rounded-xl"
                  />
                ) : (
                  <div className="w-56 h-56 flex items-center justify-center">
                    <RefreshCw className="animate-spin text-primary" size={28} />
                  </div>
                )}
              </div>

              <div className="space-y-3 max-w-md text-left">
                <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 size={16} />
                    <span>Passerelle OpenClaw opérationnelle sur le serveur</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Le moteur Baileys est prêt. Vous pouvez synchroniser votre session WhatsApp Web directement via la console OpenClaw sécurisée de votre serveur.
                  </p>
                  <a
                    href="https://openclaw.koryxa.fr"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700 transition"
                  >
                    <span>Ouvrir la passerelle OpenClaw</span>
                    <ExternalLink size={13} />
                  </a>
                </div>

                <strong className="text-sm text-foreground block pt-1">
                  Instructions pour connecter votre WhatsApp :
                </strong>
                <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal pl-4">
                  <li>Ouvrez la console <strong>OpenClaw</strong> ou votre workflow <strong>n8n</strong>.</li>
                  <li>Allez dans WhatsApp sur votre smartphone &gt; <strong>Appareils connectés &gt; Connecter un appareil</strong>.</li>
                  <li>Scannez le QR Code en direct pour lier votre numéro.</li>
                  <li>Les messages et vocaux reçus seront automatiquement enregistrés dans KORYXA !</li>
                </ol>
              </div>

              <div className="w-full pt-4 border-t border-border/60">
                <label className="text-xs font-semibold text-muted-foreground block text-left mb-1.5">
                  Numéros des commerciaux autorisés à déclarer des ventes :
                </label>
                <div className="kx-copy-input-row">
                  <input
                    placeholder="Ex : +2250708091011 ou +221770001122"
                    value={newNumber}
                    onChange={(e) => setNewNumber(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddNumber();
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="app-button app-button-secondary"
                    onClick={handleAddNumber}
                  >
                    <Plus size={15} />
                    <span>Ajouter</span>
                  </button>
                </div>

                <div className="kx-tags-cloud" style={{ marginTop: 8 }}>
                  {config.authorized_sender_numbers.length === 0 ? (
                    <span className="text-xs text-muted-foreground">
                      Aucun numéro restreint (Tous les membres de votre équipe peuvent poster).
                    </span>
                  ) : (
                    config.authorized_sender_numbers.map((num) => (
                      <span key={num} className="kx-phone-tag">
                        <span>{num}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveNumber(num)}
                          aria-label={`Supprimer ${num}`}
                        >
                          <Trash2 size={12} />
                        </button>
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* META CLOUD API DEVELOPER WIZARD */
          <div className="app-panel kx-wa-card">
            <div className="app-panel-head">
              <div>
                <span className="app-eyebrow">Libre-service entreprise</span>
                <h3>Configuration Meta Cloud API</h3>
              </div>
              <a
                href="https://developers.facebook.com/apps"
                target="_blank"
                rel="noreferrer"
                className="app-text-button"
                style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                <span>Meta Developer Portal</span>
                <ExternalLink size={14} />
              </a>
            </div>

            <div className="app-form-stack" style={{ marginTop: 14 }}>
              {/* Step 1: Meta API Credentials */}
              <div
                style={{
                  border: "1px solid var(--kx-border-subtle, #e2e8f0)",
                  borderRadius: 10,
                  padding: "14px 16px",
                  background: "var(--kx-surface-raised, #ffffff)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "var(--kx-accent, #0284c7)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                    }}
                  >
                    1
                  </span>
                  <strong style={{ fontSize: "1rem" }}>Identifiants officiels Meta WhatsApp</strong>
                </div>

                <label>
                  ID de numéro de téléphone (Phone Number ID) *
                  <input
                    placeholder="Ex : 109827364512938"
                    value={config.phone_number_id || ""}
                    onChange={(e) => setConfig({ ...config, phone_number_id: e.target.value })}
                  />
                </label>

                <label style={{ marginTop: 10 }}>
                  Jeton d&apos;accès officiel Meta (Access Token) *
                  <input
                    type="password"
                    placeholder={
                      config.has_access_token
                        ? "•••••••••••••••••••• (Clé enregistrée et chiffrée)"
                        : "Collez votre Permanent System User Token"
                    }
                    value={accessTokenInput}
                    onChange={(e) => setAccessTokenInput(e.target.value)}
                  />
                </label>

                <label style={{ marginTop: 10 }}>
                  Secret de l&apos;application Meta (App Secret - facultatif)
                  <input
                    type="password"
                    placeholder={
                      config.has_app_secret
                        ? "•••••••••••••••••••• (Secret enregistré)"
                        : "Secret pour signature HMAC SHA-256"
                    }
                    value={appSecretInput}
                    onChange={(e) => setAppSecretInput(e.target.value)}
                  />
                </label>
              </div>

              {/* Step 2: Webhook setup */}
              <div
                style={{
                  border: "1px solid var(--kx-border-subtle, #e2e8f0)",
                  borderRadius: 10,
                  padding: "14px 16px",
                  background: "var(--kx-surface-raised, #ffffff)",
                  marginTop: 14,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  <span
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "var(--kx-accent, #0284c7)",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: "0.85rem",
                    }}
                  >
                    2
                  </span>
                  <strong style={{ fontSize: "1rem" }}>Liaison du Webhook dans Meta</strong>
                </div>

                <label>
                  URL du Webhook de votre organisation
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

                <label style={{ marginTop: 10 }}>
                  Jeton de vérification (Verify Token)
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
              </div>

              {/* Actions Button */}
              <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
                <button
                  type="button"
                  className="app-button app-button-primary"
                  disabled={saving}
                  onClick={handleSaveConfig}
                >
                  <ShieldCheck size={16} />
                  <span>{saving ? "Sauvegarde en cours…" : "Enregistrer les clés Meta"}</span>
                </button>

                <button
                  type="button"
                  className="app-button app-button-secondary"
                  disabled={testingConnection || !config.phone_number_id}
                  onClick={handleTestConnection}
                >
                  <Activity size={16} />
                  <span>{testingConnection ? "Test en cours…" : "Tester la connexion API"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Right Column: Live Interactive Test Simulator */}
        <div className="app-panel kx-wa-card">
          <div className="app-panel-head">
            <div>
              <span className="app-eyebrow">Simulateur en direct</span>
              <h3>Tester l&apos;agent WhatsApp</h3>
            </div>
            <span className="kx-badge-pill">Temps réel</span>
          </div>

          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: "0.85rem", color: "var(--kx-text-muted)" }}>
              Saisissez une vente comme le ferait un commercial sur WhatsApp :
            </p>

            <textarea
              rows={3}
              className="kx-sim-textarea"
              style={{ marginTop: 8, width: "100%" }}
              value={simText}
              onChange={(e) => setSimText(e.target.value)}
              placeholder="Ex : Vente de 5 sacs de riz à 95000 FCFA client Diallo payé par Orange Money"
            />

            <div className="kx-quick-prompts" style={{ marginTop: 8, display: "flex", gap: 6, flexWrap: "wrap" }}>
              <button
                type="button"
                className="app-button app-button-secondary"
                style={{ fontSize: "0.8rem", padding: "4px 8px" }}
                onClick={() =>
                  setSimText("Vente de 2 cartons de savon à 15000 FCFA client Koffi payé en espèces")
                }
              >
                Ex : Vente Comptoir
              </button>
              <button
                type="button"
                className="app-button app-button-secondary"
                style={{ fontSize: "0.8rem", padding: "4px 8px" }}
                onClick={() =>
                  setSimText("Combien avons-nous vendu aujourd'hui et quel est le montant total ?")
                }
              >
                Ex : Rapport Journalier
              </button>
            </div>

            <button
              type="button"
              className="app-button app-button-primary kx-sim-send-btn"
              style={{ marginTop: 14, width: "100%" }}
              disabled={simulating}
              onClick={handleSimulateInbound}
            >
              <Send size={15} />
              <span>{simulating ? "Traitement en direct…" : "Envoyer le message WhatsApp"}</span>
            </button>

            {simResult && (
              <div className="kx-chat-bubble-out" style={{ marginTop: 16 }}>
                <div className="kx-bubble-brand">
                  <Sparkles size={14} />
                  <strong>KORYXA Bot (Réponse automatique)</strong>
                </div>
                <pre className="kx-reply-pre" style={{ whiteSpace: "pre-wrap", fontFamily: "inherit" }}>
                  {simResult.reply_message}
                </pre>
                {simResult.record && (
                  <div className="kx-sim-record-tag" style={{ marginTop: 8 }}>
                    <Check size={14} className="kx-icon-green" />
                    <span>
                      Vente {simResult.record.reference} ajoutée automatiquement au registre
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
