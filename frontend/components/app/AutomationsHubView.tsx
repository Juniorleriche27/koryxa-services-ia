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

  const [copiedWorkflow, setCopiedWorkflow] = useState<string | null>(null);

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
      setDigestSuccessMsg(res.message || "Bilan envoyé avec succès !");
      setTimeout(() => setDigestSuccessMsg(""), 4000);
    } catch (e: any) {
      alert(e.message || "Erreur lors de l'envoi");
    } finally {
      setDigestSending(false);
    }
  };

  // 3. Fetch Overdue Reminders
  const handleLoadReminders = async () => {
    setRemindersLoading(true);
    setRemindersSuccessMsg("");
    try {
      const res = await serviceIaFetch<any>("/automations/unpaid-reminders?min_days=1");
      setRemindersResult(res);
    } catch (e: any) {
      alert(e.message || "Erreur lors du scan des impayés");
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
      setRemindersSuccessMsg(res.message || "Relances transmises !");
      setTimeout(() => setRemindersSuccessMsg(""), 4000);
    } catch (e: any) {
      alert(e.message || "Erreur lors de l'envoi des relances");
    } finally {
      setRemindersSending(false);
    }
  };

  return (
    <div className="space-y-6 my-8">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider text-primary">
            Routines & Clôtures Automatiques
          </span>
          <h2 className="text-xl font-bold text-foreground mt-0.5">
            Automatisations Métier
          </h2>
          <p className="text-xs text-muted-foreground">
            Bilan de caisse journalier à 21h00 et suivi automatique des créances à 09h00.
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold">
          <Zap size={14} />
          <span>Automatisé</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CARD 1: 21h00 DAILY CLOSING DIGEST */}
        <div className="p-6 rounded-3xl border border-border bg-card shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Bilan Journalier Exécutif</h3>
                  <span className="text-xs text-muted-foreground font-mono">
                    Déclencheur automatique : 21h00 (Tous les soirs)
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                🟢 Actif
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Consolide le chiffre d'affaires, déduit les dépenses, alerte sur les ruptures de stock
              et dresse le bilan des présences de l'équipe pour envoi direct au dirigeant.
            </p>

            {digestSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>{digestSuccessMsg}</span>
              </div>
            )}

            {digestResult && (
              <div className="p-4 rounded-2xl bg-muted/40 border border-border text-xs space-y-2">
                <div className="flex justify-between items-center font-bold text-foreground">
                  <span>Aperçu du Bilan :</span>
                  <span className="text-primary font-mono">
                    Net : {formatMoney(digestResult.net_cashflow, digestResult.currency)}
                  </span>
                </div>
                <pre className="p-3 rounded-xl bg-background border border-border/80 text-[11px] font-mono whitespace-pre-wrap text-foreground max-h-48 overflow-y-auto">
                  {digestResult.formatted_message}
                </pre>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={handleLoadDigest}
              disabled={digestLoading}
              className="app-button app-button-secondary text-xs flex-1"
            >
              {digestLoading ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
              <span>Aperçu en Direct</span>
            </button>

            <button
              type="button"
              onClick={handleSendDigest}
              disabled={digestSending}
              className="app-button app-button-primary text-xs flex-1"
            >
              {digestSending ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
              <span>Tester l'Envoi (21h)</span>
            </button>
          </div>
        </div>

        {/* CARD 2: 09h00 DEBT REMINDERS */}
        <div className="p-6 rounded-3xl border border-border bg-card shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <DollarSign size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Relances Factures & Créances</h3>
                  <span className="text-xs text-muted-foreground font-mono">
                    Déclencheur automatique : 09h00 (Du Lundi au Vendredi)
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                🟢 Actif
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Détecte les ventes non encaissées depuis plus de 24-48h et génère des relances
              personnalisées et courtoises pour accélérer le recouvrement.
            </p>

            {remindersSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>{remindersSuccessMsg}</span>
              </div>
            )}

            {remindersResult && (
              <div className="p-4 rounded-2xl bg-muted/40 border border-border text-xs space-y-2">
                <div className="flex justify-between items-center font-bold text-foreground">
                  <span>Créances identifiées ({remindersResult.total_unpaid_count}) :</span>
                  <span className="text-destructive font-mono">
                    {formatMoney(remindersResult.total_unpaid_amount, remindersResult.currency)}
                  </span>
                </div>

                {remindersResult.reminders.length === 0 ? (
                  <p className="text-muted-foreground text-xs italic">
                    Aucun impayé en attente de relance. Félicitations !
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {remindersResult.reminders.map((r: any) => (
                      <div
                        key={r.sale_id}
                        className="p-2.5 rounded-xl bg-card border border-border/80 flex justify-between items-center text-[11px]"
                      >
                        <div>
                          <strong className="text-foreground">{r.client_name}</strong>
                          <div className="text-muted-foreground">
                            {r.item_label} · Retard {r.days_overdue}j
                          </div>
                        </div>
                        <span className="font-mono font-bold text-foreground">
                          {formatMoney(r.total_amount, r.currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-border/60">
            <button
              type="button"
              onClick={handleLoadReminders}
              disabled={remindersLoading}
              className="app-button app-button-secondary text-xs flex-1"
            >
              {remindersLoading ? <RefreshCw size={14} className="animate-spin" /> : <DollarSign size={14} />}
              <span>Scanner les Impayés</span>
            </button>

            <button
              type="button"
              onClick={handleSendReminders}
              disabled={remindersSending}
              className="app-button app-button-primary text-xs flex-1"
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
