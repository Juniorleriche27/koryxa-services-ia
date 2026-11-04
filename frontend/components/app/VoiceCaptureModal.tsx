"use client";

import { useState, useEffect, useRef } from "react";
import {
  Mic,
  Square,
  CircleHelp,
  CheckCircle2,
  AlertCircle,
  X,
  Radio,
  Pencil,
  RotateCcw,
  Check,
  Layers,
  Volume2,
  Smartphone,
  Clock,
} from "lucide-react";
import { Dialog } from "./Dialog";
import { formatMoney, formatLabel, formatDate } from "./RegistersTable";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { useI18n } from "@/lib/i18n";
import { AudioWaveform } from "@/components/voice/AudioWaveform";
import {
  AudioRecordingEngine,
  transcribeAudioFile,
  speakConfirmation,
} from "@/lib/voice/audio-recorder";
import { posAudioHaptics } from "@/lib/offline/pos-audio-haptics";

const CURRENCY_OPTIONS = [
  { code: "XOF", label: "XOF - Franc CFA (UEMOA)" },
  { code: "XAF", label: "XAF - Franc CFA (CEMAC)" },
  { code: "GNF", label: "GNF - Franc Guinéen" },
  { code: "CDF", label: "CDF - Franc Congolais" },
  { code: "EUR", label: "EUR - Euro (€)" },
  { code: "USD", label: "USD - Dollar US ($)" },
  { code: "MAD", label: "MAD - Dirham Marocain" },
  { code: "CAD", label: "CAD - Dollar Canadien" },
  { code: "GBP", label: "GBP - Livre Sterling (£)" },
  { code: "CHF", label: "CHF - Franc Suisse" },
  { code: "NGN", label: "NGN - Naira Nigérian" },
  { code: "GHS", label: "GHS - Cedi Ghanéen" },
  { code: "KES", label: "KES - Shilling Kenyan" },
  { code: "TND", label: "TND - Dinar Tunisien" },
  { code: "RWF", label: "RWF - Franc Rwandais" },
];

export interface VoiceSaleItem {
  reference: string;
  sale_date: string;
  client_name?: string | null;
  item_label: string;
  quantity: string | number;
  unit_price: string | number;
  total_amount: string | number;
  currency: string;
  payment_method?: string | null;
  payment_status: string;
  sales_channel?: string | null;
  comment?: string | null;
}

interface VoiceParseResult {
  intent: "sale" | "offer" | "procedure" | "expense" | "unknown";
  confidence: number;
  original_transcript: string;
  sale?: VoiceSaleItem;
  sales?: VoiceSaleItem[];
  offer?: {
    name: string;
    price?: string | number | null;
    currency: string;
    category?: string | null;
  };
  procedure?: {
    title: string;
    steps: Array<{ position: number; title: string }>;
  };
  expense?: {
    reference: string;
    expense_date: string;
    beneficiary: string;
    category: string;
    amount: number;
    currency: string;
    payment_method: string;
    payment_status: string;
    comment?: string;
  };
  summary_message: string;
}

interface VoiceCaptureModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function cleanSpeechDuplicates(text: string): string {
  if (!text) return "";
  let t = text.trim();
  for (let i = 0; i < 3; i++) {
    t = t.replace(/\b(.+?)\s+\1\b/gi, "$1");
  }
  t = t.replace(/\b(\w+)\s+\1\b/gi, "$1");
  return t.replace(/\s+/g, " ").trim();
}

export function VoiceCaptureModal({ open, onClose, onSuccess }: VoiceCaptureModalProps) {
  const { t } = useI18n();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [decibelLevel, setDecibelLevel] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parseResult, setParseResult] = useState<VoiceParseResult | null>(null);
  const [salesList, setSalesList] = useState<VoiceSaleItem[]>([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingTranscript, setEditingTranscript] = useState(false);

  const engineRef = useRef<AudioRecordingEngine | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new AudioRecordingEngine();
    }
    return () => {
      if (engineRef.current?.isRecording) {
        engineRef.current.stopRecording().catch(() => {});
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startRecording = async () => {
    setError("");
    setSuccessMessage("");
    setParseResult(null);
    setSalesList([]);
    setTranscript("");
    setRecordingSeconds(0);

    posAudioHaptics.playTapSound();
    posAudioHaptics.triggerHaptic("medium");

    try {
      if (!engineRef.current) {
        engineRef.current = new AudioRecordingEngine();
      }

      await engineRef.current.startRecording(
        (lvl) => setDecibelLevel(lvl),
        (liveText) => setTranscript(cleanSpeechDuplicates(liveText))
      );

      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      setError("Accès microphone refusé ou non supporté. Vous pouvez saisir votre phrase manuellement.");
      setEditingTranscript(true);
      posAudioHaptics.playWarningSound();
      posAudioHaptics.triggerHaptic("warning");
    }
  };

  const stopRecording = async () => {
    if (!engineRef.current || !isRecording) return;
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setAnalyzing(true);

    posAudioHaptics.playTapSound();
    posAudioHaptics.triggerHaptic("light");

    try {
      const result = await engineRef.current.stopRecording();
      let textToParse = cleanSpeechDuplicates(result.transcript.trim());

      // If speech recognition didn't capture text, send the recorded audio blob to Whisper AI
      if (!textToParse && result.audioBlob && result.audioBlob.size > 1000) {
        try {
          textToParse = await transcribeAudioFile(result.audioBlob);
        } catch {
          // Whisper fallback error
        }
      }

      if (textToParse) {
        setTranscript(textToParse);
        await parseTranscriptText(textToParse);
      } else {
        setError("Aucune parole détectée. Veuillez parler plus distinctement ou saisir le texte.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur de capture audio.";
      setError(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  const parseTranscriptText = async (textToParse: string) => {
    const cleanText = cleanSpeechDuplicates(textToParse.trim());
    if (!cleanText) return;
    setAnalyzing(true);
    setError("");

    try {
      const result = await serviceIaFetch<VoiceParseResult>("/voice/parse", {
        method: "POST",
        body: JSON.stringify({ transcript: cleanText }),
      });
      setParseResult(result);
      if (result.sales && result.sales.length > 0) {
        setSalesList(result.sales);
      } else if (result.sale) {
        setSalesList([result.sale]);
      } else {
        setSalesList([]);
      }
      posAudioHaptics.playCashDrawerSound();
      posAudioHaptics.triggerHaptic("success");
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'analyse sémantique du texte.");
      posAudioHaptics.playWarningSound();
      posAudioHaptics.triggerHaptic("warning");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleUpdateSale = (index: number, field: keyof VoiceSaleItem, value: any) => {
    setSalesList((prev) => {
      const copy = [...prev];
      const target = { ...copy[index], [field]: value };

      if (field === "quantity" || field === "unit_price") {
        const q = Number(field === "quantity" ? value : target.quantity) || 1;
        const p = Number(field === "unit_price" ? value : target.unit_price) || 0;
        target.total_amount = q * p;
      }
      if (field === "total_amount") {
        const q = Number(target.quantity) || 1;
        const t = Number(value) || 0;
        target.unit_price = q > 0 ? t / q : t;
      }

      copy[index] = target;
      return copy;
    });
  };

  const confirmRecord = async () => {
    if (!parseResult || parseResult.intent === "unknown") return;
    setSaving(true);
    setError("");

    try {
      let payload: any = null;
      if (parseResult.intent === "sale") {
        payload = salesList.length > 1 ? salesList : salesList[0] || parseResult.sale;
      } else if (parseResult.intent === "offer" && parseResult.offer) {
        payload = parseResult.offer;
      } else if (parseResult.intent === "procedure" && parseResult.procedure) {
        payload = parseResult.procedure;
      } else if (parseResult.intent === "expense" && parseResult.expense) {
        payload = parseResult.expense;
      }

      await serviceIaFetch("/voice/confirm", {
        method: "POST",
        body: JSON.stringify({
          intent: parseResult.intent,
          payload: payload,
          source: "voice",
        }),
      });

      const countMsg = salesList.length > 1 ? `${salesList.length} ventes enregistrées` : "Enregistrement validé";
      setSuccessMessage(`${countMsg} avec succès dans votre registre !`);
      posAudioHaptics.playCashDrawerSound();
      onSuccess();
      setTimeout(() => {
        onClose();
        resetModal();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la validation finale du registre.");
    } finally {
      setSaving(false);
    }
  };

  const resetModal = () => {
    if (isRecording) stopRecording();
    setTranscript("");
    setParseResult(null);
    setSalesList([]);
    setError("");
    setSuccessMessage("");
    setEditingTranscript(false);
    setRecordingSeconds(0);
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (isRecording) stopRecording();
        onClose();
        resetModal();
      }}
      title="Cockpit Vocal & Dictée Intelligente"
      description="Dictez naturellement vos ventes, dépenses, offres ou procédures. L'IA extrait automatiquement les articles, montants et clients."
    >
      <div className="space-y-4">
        {/* Live Audio Waveform Component */}
        <AudioWaveform
          isRecording={isRecording}
          decibelLevel={decibelLevel}
          recordingSeconds={recordingSeconds}
        />

        {/* Central Record Button */}
        <div className="flex flex-col items-center justify-center p-3">
          <button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            disabled={analyzing || saving}
            className={`w-20 h-20 min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center transition-all duration-300 shadow-xl cursor-pointer ${
              isRecording
                ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse ring-8 ring-rose-500/30"
                : "bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95"
            }`}
          >
            {isRecording ? <Square size={28} /> : <Mic size={32} />}
          </button>
          <span className="text-xs text-muted-foreground font-bold mt-2">
            {isRecording ? "Appuyez pour terminer la dictée" : "Appuyez pour commencer à parler"}
          </span>
        </div>

        {/* Live Audio / Transcribed Text Review */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Radio size={14} className={isRecording ? "text-rose-600 animate-pulse" : "text-emerald-600"} />
              <span>{isRecording ? "Capture vocale en direct…" : "Texte dicté"}</span>
            </span>
            <button
              type="button"
              onClick={() => setEditingTranscript((prev) => !prev)}
              className="text-primary hover:underline text-xs flex items-center gap-1 cursor-pointer font-bold"
            >
              <Pencil size={12} />
              <span>{editingTranscript ? "Masquer l'éditeur" : "Corriger le texte"}</span>
            </button>
          </div>

          {editingTranscript ? (
            <div className="space-y-2">
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Exemple : Vente de 10 cartons de biscuit à 2000f un carton payé par Moov Money par le client Koffi"
                rows={3}
                className="w-full p-3 rounded-2xl border border-border bg-background text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => parseTranscriptText(transcript)}
                className="px-4 py-2 min-h-[44px] rounded-xl bg-emerald-600 text-white text-xs font-black shadow-xs hover:bg-emerald-700 transition cursor-pointer"
              >
                Analyser et extraire
              </button>
            </div>
          ) : (
            <p className="p-3.5 rounded-2xl bg-card border border-border text-sm text-foreground italic leading-relaxed min-h-[44px]">
              {transcript ? `« ${transcript} »` : <span className="text-muted-foreground not-italic">Appuyez sur le micro pour dicter votre opération.</span>}
            </p>
          )}
        </div>

        {/* Status indicator */}
        {analyzing && (
          <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary text-xs flex items-center justify-center gap-2">
            <RotateCcw size={15} className="animate-spin" />
            <span>Extraction IA intelligente des articles, prix et clients…</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-2xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Extracted Structured Card */}
        {parseResult && parseResult.intent !== "unknown" && (
          <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CircleHelp size={16} className="text-primary" />
                <strong className="text-xs uppercase font-bold tracking-wider text-foreground">
                  {parseResult.intent === "sale" && salesList.length > 1
                    ? `${salesList.length} Ventes détectées`
                    : `Opération détectée (${parseResult.intent})`}
                </strong>
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">
                {formatDate(new Date().toISOString(), true)}
              </span>
            </div>

            {/* Multiple Sales / Single Sale Preview */}
            {parseResult.intent === "sale" && salesList.length > 0 && (
              <div className="space-y-3">
                {salesList.map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-card border border-border/80 space-y-2.5 shadow-xs">
                    {salesList.length > 1 && (
                      <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                        <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                          <Layers size={13} />
                          <span>Vente #{idx + 1}</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Réf : {item.reference}
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-muted-foreground block text-[10px] font-bold uppercase mb-0.5">Article / Produit</span>
                        <input
                          type="text"
                          value={item.item_label}
                          onChange={(e) => handleUpdateSale(idx, "item_label", e.target.value)}
                          className="w-full px-2.5 py-1.5 min-h-[44px] rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-muted-foreground block text-[10px] font-bold uppercase mb-0.5">Client</span>
                        <input
                          type="text"
                          value={item.client_name || ""}
                          placeholder="Client comptoir"
                          onChange={(e) => handleUpdateSale(idx, "client_name", e.target.value)}
                          className="w-full px-2.5 py-1.5 min-h-[44px] rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] font-bold uppercase mb-0.5">Quantité</span>
                        <input
                          type="number"
                          step="any"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateSale(idx, "quantity", e.target.value)}
                          className="w-full px-2.5 py-1.5 min-h-[44px] rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden"
                        />
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] font-bold uppercase mb-0.5">Montant Total</span>
                        <input
                          type="number"
                          step="any"
                          value={item.total_amount}
                          onChange={(e) => handleUpdateSale(idx, "total_amount", e.target.value)}
                          placeholder="Prix total"
                          className="w-full px-2.5 py-1.5 min-h-[44px] rounded-xl border border-border bg-background text-xs font-bold font-mono text-primary focus:ring-1 focus:ring-primary focus:outline-hidden"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-muted-foreground block text-[10px] font-bold uppercase mb-0.5">Devise</span>
                        <select
                          value={item.currency}
                          onChange={(e) => handleUpdateSale(idx, "currency", e.target.value)}
                          className="w-full px-2.5 py-1.5 min-h-[44px] rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden"
                        >
                          {CURRENCY_OPTIONS.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.code}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="text-muted-foreground block text-[10px] font-bold uppercase mb-0.5">Mode de Paiement</span>
                        <input
                          type="text"
                          value={item.payment_method || "Espèces"}
                          onChange={(e) => handleUpdateSale(idx, "payment_method", e.target.value)}
                          placeholder="Moov Money, Wave, etc."
                          className="w-full px-2.5 py-1.5 min-h-[44px] rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden"
                        />
                      </div>
                    </div>

                    {/* Payment status toggle per sale */}
                    <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
                      <span className="text-muted-foreground text-[10px] font-bold uppercase">Statut Règlement :</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateSale(idx, "payment_status", "unpaid")}
                          className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                            item.payment_status === "unpaid"
                              ? "bg-rose-500/15 text-rose-600 border border-rose-500/30"
                              : "bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <Clock size={12} />
                          <span>Non Payé</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateSale(idx, "payment_status", "paid")}
                          className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                            item.payment_status === "paid"
                              ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                              : "bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <CheckCircle2 size={12} />
                          <span>Payé</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={() => {
              if (isRecording) stopRecording();
              onClose();
              resetModal();
            }}
            className="px-4 py-2.5 min-h-[44px] rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted transition cursor-pointer"
          >
            Fermer
          </button>

          {parseResult && parseResult.intent !== "unknown" && (
            <button
              type="button"
              onClick={confirmRecord}
              disabled={saving}
              className="px-5 py-2.5 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 size={16} />
              <span>
                {saving
                  ? "Validation..."
                  : parseResult.intent === "sale" && salesList.length > 1
                  ? `Enregistrer les ${salesList.length} ventes`
                  : "Enregistrer la vente"}
              </span>
            </button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
