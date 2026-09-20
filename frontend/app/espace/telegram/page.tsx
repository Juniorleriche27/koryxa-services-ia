"use client";

import React, { useState } from "react";
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
} from "lucide-react";

export default function TelegramPage() {
  const telegramBotName = "cauri_koryxa_bot";
  const telegramShortName = "cockpit";
  const telegramDirectLink = `https://t.me/${telegramBotName}/${telegramShortName}`;
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(telegramDirectLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    telegramDirectLink
  )}&color=047857&bgcolor=ffffff`;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <PageHeader
        eyebrow="Canaux & Mobilité"
        title="Telegram Mini App (TMA)"
        description="Pilotez votre entreprise, dictez vos opérations et consultez vos alertes en temps réel directement à l'intérieur de Telegram."
      />

      {/* Hero Action Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 p-6 sm:p-8 text-white border border-emerald-500/20 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Canal Mobile Opérationnel</span>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                CAURI dans votre Telegram
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Accédez à votre cockpit sans quitter Telegram. Idéal pour vos équipes sur le terrain, vos commerciaux et le gérant en déplacement.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href={telegramDirectLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm shadow-[0_10px_25px_rgba(16,185,129,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
              >
                <Send size={17} className="text-slate-950 fill-current" />
                <span>Ouvrir dans Telegram</span>
                <ExternalLink size={14} className="text-slate-950/70" />
              </a>

              <button
                type="button"
                onClick={copyToClipboard}
                className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs transition cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check size={15} className="text-emerald-400" />
                    <span className="text-emerald-300">Lien copié !</span>
                  </>
                ) : (
                  <>
                    <Copy size={15} className="text-slate-300" />
                    <span>Copier le lien direct</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>Lien direct du bot :</span>
              <code className="px-2 py-0.5 rounded bg-slate-800 text-emerald-300 font-mono text-[11px]">
                {telegramDirectLink}
              </code>
            </div>
          </div>

          {/* QR Code Card */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="p-4 bg-white rounded-2xl shadow-xl border border-white/20 flex flex-col items-center">
              <img
                src={qrCodeUrl}
                alt="QR Code Telegram Mini App CAURI"
                width={190}
                height={190}
                className="rounded-lg object-contain"
              />
              <p className="mt-2.5 text-[11px] font-bold text-slate-700 text-center flex items-center gap-1">
                <QrCode size={13} className="text-emerald-600" />
                <span>Scannez avec l&apos;appareil photo</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <Smartphone size={20} />
          </div>
          <h3 className="font-extrabold text-foreground text-sm">Zéro Installation</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Vos collaborateurs n&apos;ont rien à télécharger depuis l&apos;App Store ou Google Play : tout fonctionne dans Telegram.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <Mic size={20} />
          </div>
          <h3 className="font-extrabold text-foreground text-sm">Dictée Vocale IA</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Dictez vos ventes et dépenses en français ou en langues locales : l&apos;IA structure l&apos;opération instantanément.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <LayoutDashboard size={20} />
          </div>
          <h3 className="font-extrabold text-foreground text-sm">Cockpit Temps Réel</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Consultez le chiffre d&apos;affaires du jour, le taux de recouvrement des créances et les alertes radar sans délai.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-card border border-border/80 shadow-xs space-y-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
            <ShieldCheck size={20} />
          </div>
          <h3 className="font-extrabold text-foreground text-sm">Sécurité & Synchronisation</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Toutes les transactions passées sur Telegram sont directement chiffrées et enregistrées sur votre compte KORYXA.
          </p>
        </div>
      </div>

      {/* Sharing & Staff Instructions */}
      <div className="p-6 rounded-2xl bg-muted/40 border border-border/80 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles size={18} className="text-emerald-600" />
          <h3 className="font-extrabold text-sm text-foreground">
            Comment donner accès à vos vendeurs et employés ?
          </h3>
        </div>
        <ol className="list-decimal list-inside space-y-2 text-xs text-muted-foreground leading-relaxed pl-1">
          <li>
            Transférez le lien direct <strong className="text-foreground">{telegramDirectLink}</strong> à votre équipe sur WhatsApp ou Telegram.
          </li>
          <li>
            Ils cliquent sur le lien ou scannent le QR code ci-dessus : le bot s&apos;ouvre et lance la Mini App CAURI.
          </li>
          <li>
            Ils peuvent immédiatement enregistrer des ventes, suivre les encaissements ou déclarer leur présence en direct.
          </li>
        </ol>
      </div>
    </div>
  );
}
