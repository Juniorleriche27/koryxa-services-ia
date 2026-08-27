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
  Plus,
  Trash2,
  KeyRound,
  ExternalLink,
  Activity,
  CheckCircle2,
  QrCode,
  RefreshCw,
  LogOut,
  Radio,
} from "lucide-react";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { StatusPill } from "./Ui";
import { useI18n } from "@/lib/i18n";

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

interface SessionQrResponse {
  status: "disconnected" | "scanning" | "connecting" | "connected";
  qr: string | null;
  phone: string | null;
  user_name: string | null;
}

interface AuthorizedSenderItem {
  id: string;
  organization_id: string;
  phone_number: string;
  label?: string | null;
  is_active: boolean;
  created_at: string;
}

export function WhatsAppConfigView({ orgSlug }: { orgSlug: string }) {
  const { lang } = useI18n();
  const [activeTab, setActiveTab] = useState<"qrcode" | "meta">("qrcode");

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

  // Structured Authorized Senders State
  const [authorizedSenders, setAuthorizedSenders] = useState<AuthorizedSenderItem[]>([]);
  const [newSenderPhone, setNewSenderPhone] = useState("");
  const [newSenderLabel, setNewSenderLabel] = useState("");
  const [addingSender, setAddingSender] = useState(false);
  const [senderError, setSenderError] = useState<string | null>(null);

  // Live Baileys Multi-Device Session State
  const [sessionStatus, setSessionStatus] = useState<"disconnected" | "scanning" | "connecting" | "connected">("scanning");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [connectedPhone, setConnectedPhone] = useState<string | null>(null);
  const [connectedUserName, setConnectedUserName] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  const [accessTokenInput, setAccessTokenInput] = useState("");
  const [appSecretInput, setAppSecretInput] = useState("");
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
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

  // 1. Fetch Config and Authorized Senders
  const loadSenders = () => {
    serviceIaFetch<{ items: AuthorizedSenderItem[]; total: number }>(
      "/integrations/whatsapp/authorized-numbers"
    )
      .then((res) => {
        if (res && res.items) {
          setAuthorizedSenders(res.items);
        }
      })
      .catch(() => {});
  };

  useEffect(() => {
    serviceIaFetch<WhatsAppConfigData>("/integrations/whatsapp/config")
      .then((data) => {
        setConfig(data);
      })
      .catch(() => {});
    loadSenders();
  }, [orgSlug]);

  // 2. Poll Live Baileys QR Code / Connection Status
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const pollSession = async () => {
      try {
        const res = await serviceIaFetch<SessionQrResponse>("/integrations/whatsapp/session-qr");
        if (res) {
          setSessionStatus(res.status);
          if (res.qr) {
            setQrCodeDataUrl(res.qr);
          }
          if (res.phone) {
            setConnectedPhone(res.phone);
          }
          if (res.user_name) {
            setConnectedUserName(res.user_name);
          }
        }
      } catch (_) {}
    };

    void pollSession();
    timer = setInterval(pollSession, 3000);

    return () => {
      if (timer) clearInterval(timer);
    };
  }, []);

  const [resetting, setResetting] = useState(false);

  const handleResetQr = async () => {
    setResetting(true);
    setQrCodeDataUrl("");
    try {
      await serviceIaFetch("/integrations/whatsapp/session-reset", { method: "POST" });
    } catch (_) {}
    setTimeout(() => setResetting(false), 2000);
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      await serviceIaFetch("/integrations/whatsapp/session-disconnect", { method: "POST" });
      setSessionStatus("disconnected");
      setConnectedPhone(null);
      setConnectedUserName(null);
      setQrCodeDataUrl("");
    } catch (_) {
    } finally {
      setDisconnecting(false);
    }
  };

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

  const handleAddSender = async () => {
    if (!newSenderPhone.trim()) return;
    setAddingSender(true);
    setSenderError(null);
    try {
      await serviceIaFetch("/integrations/whatsapp/authorized-numbers", {
        method: "POST",
        body: JSON.stringify({
          phone_number: newSenderPhone.trim(),
          label: newSenderLabel.trim() || undefined,
          is_active: true,
        }),
      });
      setNewSenderPhone("");
      setNewSenderLabel("");
      loadSenders();
    } catch (err: unknown) {
      setSenderError(err instanceof Error ? err.message : "Erreur ajout numéro");
    } finally {
      setAddingSender(false);
    }
  };

  const handleToggleSender = async (sender: AuthorizedSenderItem) => {
    try {
      await serviceIaFetch(`/integrations/whatsapp/authorized-numbers/${sender.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !sender.is_active }),
      });
      loadSenders();
    } catch (_) {}
  };

  const handleDeleteSender = async (id: string) => {
    try {
      await serviceIaFetch(`/integrations/whatsapp/authorized-numbers/${id}`, {
        method: "DELETE",
      });
      loadSenders();
    } catch (_) {}
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
          text: simText,
          from: connectedPhone || "+22899159953",
          message_id: `sim_${Date.now()}`,
          organization_id: orgSlug || "default",
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
    <div className="kx-wa-container space-y-6">
      {/* Hero Banner */}
      <div className="kx-wa-hero">
        <div className="kx-wa-hero-icon">
          <MessageSquare size={32} />
        </div>
        <div className="kx-wa-hero-text">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2>Passerelle WhatsApp & Mobilité Terrain</h2>
            <StatusPill>
              {sessionStatus === "connected" ? "🟢 WhatsApp Connecté" : "🟡 Prêt pour Appairage"}
            </StatusPill>
          </div>
          <p>
            Enregistrez vos ventes, notes vocales et encaissements en direct sur le terrain par simple message ou audio WhatsApp.
          </p>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-muted rounded-2xl max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab("qrcode")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "qrcode"
              ? "bg-card text-emerald-600 dark:text-emerald-400 shadow-md"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <QrCode size={16} />
          <span>Liaison Directe par QR Code (Simple)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("meta")}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "meta"
              ? "bg-card text-primary shadow-md"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <KeyRound size={16} />
          <span>Meta Cloud API (Grand Compte)</span>
        </button>
      </div>

      <div className="kx-wa-grid">
        {/* Left Column: Direct QR Connection or Meta API */}
        {activeTab === "qrcode" ? (
          /* DIRECT QR CODE SCANNING / CONNECTED STATE */
          <div className="app-panel kx-wa-card">
            <div className="app-panel-head">
              <div>
                <span className="app-eyebrow">Connexion Sans Code</span>
                <h3>Liaison WhatsApp Multi-Device</h3>
              </div>
              {sessionStatus === "connected" ? (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Connecté
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                  <Radio size={12} className="animate-pulse" />
                  En attente de scan
                </span>
              )}
            </div>

            <div className="p-6 flex flex-col items-center justify-center text-center space-y-5">
              {sessionStatus === "connected" ? (
                /* CONNECTED STATE VIEW */
                <div className="w-full max-w-md p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-4 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-emerald-950 dark:text-emerald-200">
                      WhatsApp Appairé & Opérationnel
                    </h4>
                    <p className="text-xs font-mono font-bold text-emerald-800 dark:text-emerald-300 mt-1">
                      Numéro lié : {connectedPhone || "Session Active"}
                    </p>
                    {connectedUserName && (
                      <p className="text-xs text-muted-foreground">
                        Profil : {connectedUserName}
                      </p>
                    )}
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Votre session est active. Vous et vos commerciaux pouvez envoyer des <strong>messages écrits</strong> ou des <strong>notes vocales</strong> à ce numéro pour enregistrer vos ventes et dépenses.
                  </p>

                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={disconnecting}
                      onClick={handleDisconnect}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border border-destructive/30 text-destructive bg-destructive/5 hover:bg-destructive/15 transition cursor-pointer"
                    >
                      <LogOut size={14} />
                      <span>{disconnecting ? "Déconnexion en cours…" : "Déconnecter la session WhatsApp"}</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* SCANNING / QR CODE VIEW */
                <>
                  <div className="p-4 bg-white rounded-2xl shadow-lg border border-border flex flex-col items-center">
                    {qrCodeDataUrl ? (
                      <img
                        src={qrCodeDataUrl}
                        alt="Scan WhatsApp QR Code"
                        className="w-64 h-64 object-contain rounded-xl"
                      />
                    ) : (
                      <div className="w-64 h-64 flex flex-col items-center justify-center gap-3">
                        <RefreshCw className="animate-spin text-emerald-600" size={32} />
                        <span className="text-xs font-medium text-muted-foreground">
                          Génération du QR Code en direct…
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Session Multi-Device sécurisée
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetQr}
                      disabled={resetting}
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-muted hover:bg-muted/80 text-foreground transition cursor-pointer border border-border"
                    >
                      <RefreshCw size={13} className={resetting ? "animate-spin" : ""} />
                      <span>{resetting ? "Régénération en cours…" : "Régénérer / Réinitialiser le QR Code"}</span>
                    </button>
                  </div>

                  {/* Instructions Pas-à-Pas Claires */}
                  <div className="w-full max-w-lg text-left space-y-3">
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-200 text-xs space-y-1">
                      <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400">
                        <ShieldCheck size={16} />
                        <span>Appairage Direct & Chiffré</span>
                      </div>
                      <p className="text-[11.5px] text-muted-foreground leading-relaxed">
                        Scannez ce QR Code avec votre téléphone pour connecter le numéro WhatsApp de votre entreprise à KORYXA.
                      </p>
                    </div>

                    <strong className="text-sm font-bold text-foreground block pt-1">
                      Comment connecter votre WhatsApp en 3 étapes :
                    </strong>
                    <ol className="text-xs text-muted-foreground space-y-2 list-decimal pl-4">
                      <li>
                        Ouvrez <strong>WhatsApp</strong> sur votre smartphone.
                      </li>
                      <li>
                        Touchez <strong>Appareils connectés</strong> ➔ <strong>Connecter un appareil</strong>.
                      </li>
                      <li>
                        Pointez la caméra de votre smartphone vers le <strong>QR Code ci-dessus</strong>.
                      </li>
                    </ol>

                    <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11.5px] text-blue-950 dark:text-blue-200 space-y-1">
                      <strong className="font-bold text-blue-800 dark:text-blue-300 block">
                        ℹ️ Information importante sur Baileys QR Code :
                      </strong>
                      <p className="text-muted-foreground">
                        Baileys est une solution alternative non officielle basée sur WhatsApp Web. Des déconnexions ponctuelles peuvent survenir selon l'état du réseau de votre smartphone. Pour une stabilité garantie 24/7 sans smartphone requis, utilisez l'onglet <strong>Meta Cloud API</strong>.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11.5px] text-amber-950 dark:text-amber-200 space-y-1">
                      <strong className="font-bold text-amber-800 dark:text-amber-300 block">
                        💡 Si votre téléphone indique « Impossible de se connecter maintenant » :
                      </strong>
                      <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                        <li>Le QR Code WhatsApp change toutes les 20 secondes. Cliquez sur <strong>« Régénérer le QR Code »</strong> pour avoir un code tout neuf et scannez-le aussitôt.</li>
                        <li>Vérifiez dans WhatsApp ➔ <em>Appareils connectés</em> que vous n'avez pas atteint la limite maximale de 4 appareils (si oui, déconnectez une ancienne session Web inactive).</li>
                      </ul>
                    </div>
                  </div>
                </>
              )}

              {/* Authorized Numbers Manager (Chantier 1) */}
              <div className="w-full pt-4 border-t border-border/60 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground block text-left">
                    Numéros WhatsApp Autorisés (Format International E.164) :
                  </label>
                  <span className="text-[11px] text-muted-foreground">
                    {authorizedSenders.length} configuré(s)
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    placeholder="Numéro (ex: +2250708091011)"
                    value={newSenderPhone}
                    onChange={(e) => setNewSenderPhone(e.target.value)}
                    className="flex-1 text-xs"
                  />
                  <input
                    placeholder="Nom / Rôle (ex: Koffi Vendeur)"
                    value={newSenderLabel}
                    onChange={(e) => setNewSenderLabel(e.target.value)}
                    className="flex-1 text-xs"
                  />
                  <button
                    type="button"
                    className="app-button app-button-secondary text-xs px-3"
                    disabled={addingSender || !newSenderPhone.trim()}
                    onClick={handleAddSender}
                  >
                    <Plus size={14} />
                    <span>{addingSender ? "…" : "Autoriser"}</span>
                  </button>
                </div>

                {senderError && (
                  <p className="text-xs text-destructive font-medium">{senderError}</p>
                )}

                <div className="space-y-1.5 mt-2">
                  {authorizedSenders.length === 0 ? (
                    <p className="text-xs text-muted-foreground italic text-left">
                      Aucun numéro restreint : tous les collaborateurs peuvent enregistrer des opérations.
                    </p>
                  ) : (
                    authorizedSenders.map((sender) => (
                      <div
                        key={sender.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-muted/60 border border-border text-xs"
                      >
                        <div className="flex items-center gap-2 text-left">
                          <span className="font-mono font-bold text-foreground">
                            {sender.phone_number}
                          </span>
                          {sender.label && (
                            <span className="text-muted-foreground">({sender.label})</span>
                          )}
                          <span
                            className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                              sender.is_active
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {sender.is_active ? "Actif" : "Désactivé"}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleSender(sender)}
                            className="text-[11px] px-2 py-0.5 rounded border border-border hover:bg-muted font-medium"
                          >
                            {sender.is_active ? "Désactiver" : "Activer"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSender(sender.id)}
                            className="p-1 rounded text-destructive hover:bg-destructive/10"
                            aria-label={`Supprimer ${sender.phone_number}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
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
                <span className="app-eyebrow">Compte Entreprise</span>
                <h3>Configuration Meta WhatsApp Cloud API</h3>
              </div>
              <a
                href="https://developers.facebook.com/apps"
                target="_blank"
                rel="noreferrer"
                className="app-text-button inline-flex items-center gap-1 text-xs font-bold text-primary"
              >
                <span>Portail Meta Developers</span>
                <ExternalLink size={13} />
              </a>
            </div>

            <div className="app-form-stack space-y-4" style={{ marginTop: 14 }}>
              {/* Step 1: Meta API Credentials */}
              <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                    1
                  </span>
                  <strong className="text-sm font-bold">Identifiants Officiels Meta WhatsApp</strong>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    ID de numéro de téléphone (Phone Number ID) *
                  </label>
                  <input
                    placeholder="Ex : 109827364512938"
                    value={config.phone_number_id || ""}
                    onChange={(e) => setConfig({ ...config, phone_number_id: e.target.value })}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Jeton d&apos;accès officiel Meta (Access Token) *
                  </label>
                  <input
                    type="password"
                    placeholder={
                      config.has_access_token
                        ? "•••••••••••••••••••• (Clé enregistrée et chiffrée)"
                        : "Collez votre Permanent System User Token"
                    }
                    value={accessTokenInput}
                    onChange={(e) => setAccessTokenInput(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Secret de l&apos;application Meta (App Secret - facultatif)
                  </label>
                  <input
                    type="password"
                    placeholder={
                      config.has_app_secret
                        ? "•••••••••••••••••••• (Secret enregistré)"
                        : "Secret pour signature HMAC SHA-256"
                    }
                    value={appSecretInput}
                    onChange={(e) => setAppSecretInput(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              {/* Step 2: Webhook setup */}
              <div className="p-4 rounded-xl border border-border bg-card space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                    2
                  </span>
                  <strong className="text-sm font-bold">Liaison du Webhook KORYXA dans Meta</strong>
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    URL du Webhook KORYXA
                  </label>
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
                </div>

                <div>
                  <label className="text-xs font-semibold text-muted-foreground block mb-1">
                    Jeton de vérification (Verify Token)
                  </label>
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
                </div>
              </div>

              {/* Actions Button */}
              <div className="flex gap-2.5 pt-2">
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

              {testResult && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium border ${
                    testResult.status === "connected"
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                      : "bg-destructive/10 border-destructive/20 text-destructive"
                  }`}
                >
                  {testResult.message}
                </div>
              )}
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

          <div className="p-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Saisissez ou dictez une vente comme le ferait un commercial sur WhatsApp :
            </p>

            <textarea
              rows={3}
              className="kx-sim-textarea w-full text-sm rounded-xl p-3 border border-border bg-background"
              value={simText}
              onChange={(e) => setSimText(e.target.value)}
              placeholder="Ex : Vente de 5 sacs de riz à 95000 FCFA client Diallo payé par Orange Money"
            />

            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                className="app-button app-button-secondary text-xs px-2.5 py-1"
                onClick={() =>
                  setSimText("Vente de 2 cartons de savon à 15000 FCFA client Koffi payé en espèces")
                }
              >
                Ex : Vente Comptoir
              </button>
              <button
                type="button"
                className="app-button app-button-secondary text-xs px-2.5 py-1"
                onClick={() =>
                  setSimText("Combien avons-nous vendu aujourd'hui et quel est le montant total ?")
                }
              >
                Ex : Rapport Journalier
              </button>
            </div>

            <button
              type="button"
              className="app-button app-button-primary w-full flex items-center justify-center gap-2 py-2.5"
              disabled={simulating}
              onClick={handleSimulateInbound}
            >
              <Send size={15} />
              <span>{simulating ? "Traitement en direct…" : "Envoyer le message WhatsApp"}</span>
            </button>

            {simResult && (
              <div className="p-4 rounded-2xl bg-muted/60 border border-border/80 space-y-2 mt-4">
                <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                  <Sparkles size={14} />
                  <span>KORYXA Bot (Réponse automatique)</span>
                </div>
                <pre className="text-xs font-sans whitespace-pre-wrap text-foreground/90 leading-relaxed">
                  {simResult.reply_message}
                </pre>
                {simResult.record && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold mt-2">
                    <Check size={14} />
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
