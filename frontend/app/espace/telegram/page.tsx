"use client";

import React, { useState, useEffect } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import {
  Send,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  Smartphone,
  Mic,
  LayoutDashboard,
  ShieldCheck,
  Zap,
  QrCode,
  Share2,
  Sparkles,
  RefreshCw,
  Users,
  Trash2,
  Key,
  Bot,
  AlertCircle,
  Clock,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { serviceIaFetch } from "@/lib/service-ia/api";

interface TelegramConfig {
  is_active: boolean;
  link_code: string;
  deep_link_url: string;
  bot_username: string;
  custom_bot_active: boolean;
  custom_bot_username?: string | null;
  has_custom_bot_token: boolean;
}

interface TelegramUser {
  id: string;
  organization_id: string;
  telegram_user_id: string;
  telegram_username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  label?: string | null;
  is_active: boolean;
  created_at: string;
}

export default function TelegramPage() {
  const [config, setConfig] = useState<TelegramConfig>({
    is_active: true,
    link_code: "link_org_loading",
    deep_link_url: "https://t.me/cauri_koryxa_bot?start=loading",
    bot_username: "cauri_koryxa_bot",
    custom_bot_active: false,
    has_custom_bot_token: false,
  });
  const [users, setUsers] = useState<TelegramUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  // Custom Bot State
  const [customBotToken, setCustomBotToken] = useState("");
  const [savingBot, setSavingBot] = useState(false);
  const [botStatusMessage, setBotStatusMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const loadData = async () => {
    try {
      const [cfg, userList] = await Promise.all([
        serviceIaFetch<TelegramConfig>("/telegram/config").catch(() => null),
        serviceIaFetch<TelegramUser[]>("/telegram/users").catch(() => []),
      ]);
      if (cfg) setConfig(cfg);
      if (userList) setUsers(userList);
    } catch {
      // Fallback defaults
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(config.deep_link_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRegenerateCode = async () => {
    if (!confirm("Voulez-vous générer un nouveau lien de connexion ? Les anciens liens non utilisés expireront.")) {
      return;
    }
    setRegenerating(true);
    try {
      const res = await serviceIaFetch<{ link_code: string; deep_link_url: string }>(
        "/telegram/link-code/regenerate",
        { method: "POST" }
      );
      setConfig((prev) => ({
        ...prev,
        link_code: res.link_code,
        deep_link_url: res.deep_link_url,
      }));
    } catch (e) {
      alert("Erreur lors de la régénération du lien.");
    } finally {
      setRegenerating(false);
    }
  };

  const handleToggleUser = async (user: TelegramUser) => {
    try {
      await serviceIaFetch(`/telegram/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !user.is_active }),
      });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: !u.is_active } : u))
      );
    } catch {
      alert("Impossible de modifier le statut de l'utilisateur.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Voulez-vous vraiment révoquer l'accès de cet utilisateur Telegram ?")) return;
    try {
      await serviceIaFetch(`/telegram/users/${userId}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch {
      alert("Erreur lors de la suppression.");
    }
  };

  const handleSaveCustomBot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customBotToken.trim()) return;
    setSavingBot(true);
    setBotStatusMessage(null);
    try {
      const res = await serviceIaFetch<{ ok: boolean; message: string; bot_username?: string }>(
        "/telegram/custom-bot",
        {
          method: "POST",
          body: JSON.stringify({ bot_token: customBotToken.trim() }),
        }
      );
      setBotStatusMessage({ type: "success", text: res.message });
      setConfig((prev) => ({
        ...prev,
        custom_bot_active: true,
        custom_bot_username: res.bot_username,
        has_custom_bot_token: true,
      }));
      setCustomBotToken("");
    } catch (err: any) {
      setBotStatusMessage({
        type: "error",
        text: err?.message || "Échec de connexion du bot Telegram. Vérifiez le token.",
      });
    } finally {
      setSavingBot(false);
    }
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(
    config.deep_link_url
  )}&color=047857&bgcolor=ffffff`;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      <PageHeader
        eyebrow="Canaux & Mobilité"
        title="Canal Telegram & Mini App (TMA)"
        description="Connectez vos comptes Telegram à votre organisation. Pilotez vos ventes, dépenses et consulte vos bilans en toute sécurité avec isolation stricte des données."
      />

      {/* 1. Hero Action Card : Connexion 1-Clic KORYXA */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 p-6 sm:p-8 text-white border border-emerald-500/25 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Bot Officiel KORYXA : @{config.bot_username}</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Liaison Sécurisée Multi-Comptes
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Cliquez sur le bouton pour lier votre Telegram à cette organisation en 1 clic. Chaque compte reste 100% étanche et confidentiel.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={config.deep_link_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-[0_10px_25px_rgba(16,185,129,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Send size={18} className="text-slate-950 fill-current" />
                <span>Lier mon compte Telegram</span>
                <ExternalLink size={14} className="text-slate-950/70" />
              </a>

              <button
                type="button"
                onClick={copyToClipboard}
                className="inline-flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check size={15} className="text-emerald-400" />
                    <span className="text-emerald-300">Lien copié !</span>
                  </>
                ) : (
                  <>
                    <Copy size={15} className="text-slate-300" />
                    <span>Copier le lien d&apos;invitation</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleRegenerateCode}
                disabled={regenerating}
                title="Régénérer le code secret de liaison"
                className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw size={15} className={regenerating ? "animate-spin text-emerald-400" : ""} />
              </button>
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>Lien direct sécurisé :</span>
              <code className="px-2 py-1 rounded bg-slate-800/90 text-emerald-300 font-mono text-[11px] truncate max-w-xs sm:max-w-md">
                {config.deep_link_url}
              </code>
            </div>
          </div>

          {/* QR Code Scanner Card */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="p-4 bg-white rounded-2xl shadow-2xl border border-white/20 flex flex-col items-center">
              <img
                src={qrCodeUrl}
                alt="QR Code Telegram Liaison CAURI"
                width={200}
                height={200}
                className="rounded-xl object-contain"
              />
              <p className="mt-2.5 text-[11px] font-bold text-slate-700 text-center flex items-center gap-1">
                <QrCode size={14} className="text-emerald-600" />
                <span>Scannez pour connecter votre smartphone</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Liste des Comptes Telegram Connectés */}
      <div className="rounded-3xl bg-card border border-border/80 shadow-xs p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-foreground text-base">Comptes Telegram Reliés ({users.length})</h3>
              <p className="text-xs text-muted-foreground">
                Membres de votre équipe autorisés à passer des ventes et consulter les bilans via Telegram.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadData}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted/50 transition cursor-pointer"
          >
            <RefreshCw size={13} />
            <span>Actualiser</span>
          </button>
        </div>

        {users.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-border/80 bg-muted/20 space-y-2">
            <Smartphone size={32} className="mx-auto text-muted-foreground/60" />
            <p className="text-sm font-bold text-foreground">Aucun compte Telegram n&apos;est encore relié</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Cliquez sur le bouton vert ci-dessus ou scannez le QR code pour lier votre premier compte en 2 secondes.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border/60 text-muted-foreground font-semibold">
                  <th className="pb-3 px-3">Nom & Utilisateur</th>
                  <th className="pb-3 px-3">ID Telegram</th>
                  <th className="pb-3 px-3">Rôle / Libellé</th>
                  <th className="pb-3 px-3">Statut</th>
                  <th className="pb-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-muted/30 transition">
                    <td className="py-3.5 px-3">
                      <div className="font-extrabold text-foreground">
                        {u.first_name || ""} {u.last_name || ""}
                      </div>
                      {u.telegram_username ? (
                        <div className="text-[11px] text-emerald-600 font-mono">@{u.telegram_username}</div>
                      ) : (
                        <div className="text-[11px] text-muted-foreground">Sans @pseudo</div>
                      )}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-muted-foreground text-[11px]">
                      {u.telegram_user_id}
                    </td>
                    <td className="py-3.5 px-3 font-medium text-foreground">
                      {u.label || "Vendeur / Terrain"}
                    </td>
                    <td className="py-3.5 px-3">
                      <button
                        type="button"
                        onClick={() => handleToggleUser(u)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition ${
                          u.is_active
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                            : "bg-muted text-muted-foreground border border-border"
                        }`}
                      >
                        {u.is_active ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        <span>{u.is_active ? "Actif" : "Suspendu"}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteUser(u.id)}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-500/10 transition cursor-pointer"
                        title="Révoquer cet accès"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. Section Mode Marque Blanche : Mon Propre Bot Dédié */}
      <div className="rounded-3xl bg-card border border-border/80 shadow-xs p-6 space-y-5">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="font-extrabold text-foreground text-base">Mode Marque Blanche : Votre Propre Bot Dédié</h3>
            <p className="text-xs text-muted-foreground">
              Optionnel : Si vous souhaitez que le bot porte le nom et le logo exacts de votre enseigne.
            </p>
          </div>
        </div>

        {config.custom_bot_active && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
              <CheckCircle2 size={16} />
              <span>Bot dédié actif : @{config.custom_bot_username}</span>
            </div>
            <span className="text-[11px] text-emerald-600 bg-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
              En ligne
            </span>
          </div>
        )}

        <form onSubmit={handleSaveCustomBot} className="space-y-4 max-w-2xl">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Key size={13} className="text-emerald-600" />
              <span>Token d&apos;API HTTP Telegram BotFather</span>
            </label>
            <input
              type="password"
              placeholder="Ex: 8884618965:AAGPcrd5MQQWr-iibxs0DvByIvH0vVXjpRA"
              value={customBotToken}
              onChange={(e) => setCustomBotToken(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            <p className="text-[11px] text-muted-foreground">
              Générez un bot sur Telegram avec <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-emerald-600 underline">@BotFather</a> via <code>/newbot</code> et collez le token ici.
            </p>
          </div>

          {botStatusMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                botStatusMessage.type === "success"
                  ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20"
                  : "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20"
              }`}
            >
              {botStatusMessage.type === "success" ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
              <span>{botStatusMessage.text}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={savingBot || !customBotToken.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 active:scale-95 transition cursor-pointer disabled:opacity-50"
          >
            {savingBot ? <RefreshCw size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
            <span>Enregistrer et Activer mon Bot Dédié</span>
          </button>
        </form>
      </div>

      {/* 4. Guide des Commandes & Exemples de Saisie */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-foreground font-extrabold text-sm">
            <Zap size={16} className="text-emerald-600" />
            <span>Commandes de Menu dans le Chat</span>
          </div>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li className="flex items-start gap-2">
              <code className="px-1.5 py-0.5 rounded bg-muted font-bold text-foreground">/cockpit</code>
              <span>Ouvre l&apos;application complète Mini App dans Telegram</span>
            </li>
            <li className="flex items-start gap-2">
              <code className="px-1.5 py-0.5 rounded bg-muted font-bold text-foreground">/solde</code>
              <span>Consulte le chiffre d&apos;affaires, total encaissé et trésorerie du jour</span>
            </li>
            <li className="flex items-start gap-2">
              <code className="px-1.5 py-0.5 rounded bg-muted font-bold text-foreground">/radar</code>
              <span>Affiche les alertes opérationnelles (stocks faibles, factures échues)</span>
            </li>
            <li className="flex items-start gap-2">
              <code className="px-1.5 py-0.5 rounded bg-muted font-bold text-foreground">/menu</code>
              <span>Affiche les boutons d&apos;action interactifs d&apos;accueil</span>
            </li>
          </ul>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-foreground font-extrabold text-sm">
            <Mic size={16} className="text-emerald-600" />
            <span>Saisie en Langage Naturel (Texte ou Audio)</span>
          </div>
          <ul className="space-y-2 text-xs text-muted-foreground">
            <li className="p-2.5 rounded-xl bg-muted/40 border border-border/60">
              <span className="font-bold text-foreground block">🛍️ Exemple Vente :</span>
              <i>« Vente 3 cartons savon 15000 payé espèces au client Koffi »</i>
            </li>
            <li className="p-2.5 rounded-xl bg-muted/40 border border-border/60">
              <span className="font-bold text-foreground block">💸 Exemple Dépense :</span>
              <i>« Dépense 5000 carburant pour livraison moto »</i>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
