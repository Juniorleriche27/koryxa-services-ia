"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Clock,
  Send,
  AlertTriangle,
  CheckCircle2,
  Check,
  Copy,
  Download,
  Users,
  Package,
  DollarSign,
  TrendingUp,
  RefreshCw,
  Zap,
  Layers,
  ArrowRight,
} from "lucide-react";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { formatMoney } from "./RegistersTable";

export function AutomationsHubView() {
  const [digestLoading, setDigestLoading] = useState(false);
  const [digestSending, setDigestSending] = useState(false);
  const [digestResult, setDigestResult] = useState<any | null>(null);
  const [digestSuccessMsg, setDigestSuccessMsg] = useState("");

  const [remindersLoading, setRemindersLoading] = useState(false);
  const [remindersSending, setRemindersSending] = useState(false);
  const [remindersResult, setRemindersResult] = useState<any | null>(null);
  const [remindersSuccessMsg, setRemindersSuccessMsg] = useState("");

  // 1. Fetch Daily Digest Preview
  const handleLoadDigest = async () => {
    setDigestLoading(true);
    setDigestSuccessMsg("");
    try {
      const res = await serviceIaFetch<any>("/automations/daily-digest");
      setDigestResult(res);
    } catch (e: any) {
      alert(e.message || "Erreur de génération du bilan");
    } finally {
      setDigestLoading(false);
    }
  };

  // 2. Send Daily Digest Now
  const handleSendDigest = async () => {
    setDigestSending(true);
    try {
      const res = await serviceIaFetch<any>("/automations/daily-digest/send", {
        method: "POST",
      });
      setDigestSuccessMsg(res.message || "Bilan envoyé avec succès sur WhatsApp !");
      setTimeout(() => setDigestSuccessMsg(""), 4000);
    } catch (e: any) {
      alert(e.message || "Erreur lors de l'envoi");
    } finally {
      setDigestSending(false);
    }
  };

  // 3. Fetch Unpaid Reminders Preview
  const handleLoadReminders = async () => {
    setRemindersLoading(true);
    setRemindersSuccessMsg("");
    try {
      const res = await serviceIaFetch<any>("/automations/unpaid-reminders?min_days=1");
      setRemindersResult(res);
    } catch (e: any) {
      alert(e.message || "Erreur lors de la détection des impayés");
    } finally {
      setRemindersLoading(false);
    }
  };

  // 4. Send Reminders Now
  const handleSendReminders = async () => {
    setRemindersSending(true);
    try {
      const res = await serviceIaFetch<any>("/automations/unpaid-reminders/send?min_days=1", {
        method: "POST",
      });
      setRemindersSuccessMsg(res.message || "Relances transmises avec succès !");
      setTimeout(() => setRemindersSuccessMsg(""), 4000);
    } catch (e: any) {
      alert(e.message || "Erreur lors de l'envoi des relances");
    } finally {
      setRemindersSending(false);
    }
  };

  return (
    <div className="space-y-6 my-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600">
            Routines & Clôtures Automatiques
          </span>
          <h2 className="text-xl font-extrabold text-slate-950 mt-0.5">
            Automatisations Métier
          </h2>
          <p className="text-xs text-slate-500">
            Bilan de caisse journalier à 21h00 et suivi automatique des créances à 09h00.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black self-start sm:self-auto">
          <Zap size={14} className="text-emerald-600 fill-emerald-500" />
          <span>Automatisé 24/7</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD 1: 21h00 DAILY CLOSING DIGEST */}
        <div className="p-7 rounded-3xl border border-slate-200/80 bg-white shadow-sm flex flex-col justify-between space-y-6 transition hover:shadow-md">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 font-black border border-indigo-100">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-950">Bilan Journalier Exécutif</h3>
                  <span className="text-xs text-slate-400 font-mono">
                    Déclencheur automatique : 21h00 (Tous les soirs)
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                🟢 Actif
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Consolide le chiffre d'affaires, déduit les dépenses du jour, alerte sur les ruptures de stock
              et dresse le bilan complet des présences pour envoi direct sur votre WhatsApp.
            </p>

            {digestSuccessMsg && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>{digestSuccessMsg}</span>
              </div>
            )}

            {digestResult && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between items-center font-bold text-slate-950">
                  <span>Aperçu du Bilan :</span>
                  <span className="text-emerald-700 font-mono font-black">
                    Net : {formatMoney(digestResult.net_cashflow, digestResult.currency)}
                  </span>
                </div>
                <pre className="p-3 rounded-xl bg-white border border-slate-200 text-[11px] font-mono whitespace-pre-wrap text-slate-800 max-h-48 overflow-y-auto shadow-inner">
                  {digestResult.formatted_message}
                </pre>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleLoadDigest}
              disabled={digestLoading}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 py-3 text-xs font-black text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              {digestLoading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
              <span>Aperçu en Direct</span>
            </button>

            <button
              type="button"
              onClick={handleSendDigest}
              disabled={digestSending}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-xs font-black text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition cursor-pointer"
            >
              {digestSending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
              <span>Tester l'Envoi (21h)</span>
            </button>
          </div>
        </div>

        {/* CARD 2: 09h00 UNPAID DEBT RECOVERY */}
        <div className="p-7 rounded-3xl border border-slate-200/80 bg-white shadow-sm flex flex-col justify-between space-y-6 transition hover:shadow-md">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 font-black border border-amber-100">
                  <DollarSign size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-950">Relances Factures & Créances</h3>
                  <span className="text-xs text-slate-400 font-mono">
                    Déclencheur automatique : 09h00 (Du Lundi au Vendredi)
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                🟢 Actif
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Détecte les ventes et factures non encaissées depuis plus de 24-48h et génère des relances
              personnalisées et courtoises sur WhatsApp pour accélérer vos encaissements.
            </p>

            {remindersSuccessMsg && (
              <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>{remindersSuccessMsg}</span>
              </div>
            )}

            {remindersResult && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                <div className="flex justify-between items-center font-bold text-slate-950">
                  <span>Créances détectées :</span>
                  <span className="text-amber-700 font-mono font-black">
                    {remindersResult.unpaid_count} impayé(s) ({formatMoney(remindersResult.total_unpaid_amount, remindersResult.currency)})
                  </span>
                </div>
                {remindersResult.items && remindersResult.items.length > 0 ? (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {remindersResult.items.map((item: any, idx: number) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] flex justify-between">
                        <div>
                          <strong className="text-slate-900">{item.client_name || "Client"}</strong>
                          <span className="text-slate-500 font-mono ml-2">({item.client_phone || "Pas de tél"})</span>
                        </div>
                        <span className="font-bold text-amber-700 font-mono">{formatMoney(item.amount, item.currency)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500 italic text-[11px]">Aucun impayé en attente pour le moment.</p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleLoadReminders}
              disabled={remindersLoading}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 py-3 text-xs font-black text-slate-700 hover:bg-slate-100 transition cursor-pointer"
            >
              {remindersLoading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
              <span>Scanner les Impayés</span>
            </button>

            <button
              type="button"
              onClick={handleSendReminders}
              disabled={remindersSending}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3 text-xs font-black text-white shadow-md shadow-emerald-600/20 hover:bg-emerald-700 transition cursor-pointer"
            >
              {remindersSending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
              <span>Lancer les Relances (09h)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
