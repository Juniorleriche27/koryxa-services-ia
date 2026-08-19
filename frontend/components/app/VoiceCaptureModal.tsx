"use client";

import { useState, useEffect, useRef } from "react";
import {
  Mic,
  Square,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Radio,
  Pencil,
  RotateCcw,
  Check,
  Layers,
} from "lucide-react";
import { Dialog } from "./Dialog";
import { formatMoney, formatLabel, formatDate } from "./RegistersTable";
import { serviceIaFetch } from "@/lib/service-ia/api";

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
  intent: "sale" | "offer" | "procedure" | "unknown";
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
  summary_message: string;
}

interface VoiceCaptureModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function VoiceCaptureModal({ open, onClose, onSuccess }: VoiceCaptureModalProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parseResult, setParseResult] = useState<VoiceParseResult | null>(null);
  const [salesList, setSalesList] = useState<VoiceSaleItem[]>([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingTranscript, setEditingTranscript] = useState(false);

  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const transcriptBufferRef = useRef<string>("");

  // Recording Timer
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const startRecording = () => {
    setError("");
    setSuccessMessage("");
    setParseResult(null);
    setSalesList([]);
    setTranscript("");
    transcriptBufferRef.current = "";

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setError("La dictée vocale en direct n'est pas supportée par ce navigateur. Vous pouvez saisir votre phrase manuellement.");
      setEditingTranscript(true);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "fr-FR";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript + " ";
        }
        const cleaned = currentTranscript.trim();
        transcriptBufferRef.current = cleaned;
        setTranscript(cleaned);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech error:", event.error);
        if (event.error === "not-allowed") {
          setError("Accès au microphone refusé. Veuillez autoriser l'accès au micro.");
        }
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
        const finalText = transcriptBufferRef.current.trim();
        if (finalText) {
          void parseTranscriptText(finalText);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error("Recognition start error:", err);
      setError("Impossible de démarrer la capture audio. Vous pouvez saisir le texte.");
      setEditingTranscript(true);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsRecording(false);
  };

  const parseTranscriptText = async (textToParse: string) => {
    if (!textToParse.trim()) return;
    setAnalyzing(true);
    setError("");

    try {
      const result = await serviceIaFetch<VoiceParseResult>("/voice/parse", {
        method: "POST",
        body: JSON.stringify({ transcript: textToParse.trim() }),
      });
      setParseResult(result);
      if (result.sales && result.sales.length > 0) {
        setSalesList(result.sales);
      } else if (result.sale) {
        setSalesList([result.sale]);
      } else {
        setSalesList([]);
      }
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'analyse sémantique du texte.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Modify individual sale in multi-sales list
  const handleUpdateSale = (index: number, field: keyof VoiceSaleItem, value: any) => {
    setSalesList((prev) => {
      const copy = [...prev];
      const target = { ...copy[index], [field]: value };

      // Recompute total if quantity or unit_price changes
      if (field === "quantity" || field === "unit_price") {
        const q = Number(field === "quantity" ? value : target.quantity) || 1;
        const p = Number(field === "unit_price" ? value : target.unit_price) || 0;
        target.total_amount = q * p;
      }
      // Recompute unit_price if total_amount changes
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
      }

      await serviceIaFetch("/voice/confirm", {
        method: "POST",
        body: JSON.stringify({
          intent: parseResult.intent,
          payload: payload,
          source: "voice",
        }),
      });

      const countMsg = salesList.length > 1 ? `${salesList.length} ventes enregistrées` : "Enregistrement réussi";
      setSuccessMessage(`${countMsg} et archivé dans votre registre !`);
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

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <Dialog
      open={open}
      onClose={() => {
        if (isRecording) stopRecording();
        onClose();
        resetModal();
      }}
      title="Dictée Vocale Intelligente"
      description="Dictez une ou plusieurs ventes, un tarif ou une procédure. L'IA extrait automatiquement les articles, montants et devises."
    >
      <div className="space-y-5">
        {/* Recording Visualizer Card */}
        <div className="p-6 rounded-2xl bg-muted/40 border border-border flex flex-col items-center justify-center text-center relative overflow-hidden">
          {isRecording && (
            <div className="absolute inset-0 bg-rose-500/5 animate-pulse pointer-events-none" />
          )}

          <div className="mb-3">
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={analyzing || saving}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
                isRecording
                  ? "bg-rose-600 hover:bg-rose-700 text-white animate-pulse ring-8 ring-rose-500/20"
                  : "bg-primary hover:opacity-90 text-primary-foreground"
              }`}
            >
              {isRecording ? <Square size={28} /> : <Mic size={32} />}
            </button>
          </div>

          <div>
            <span className="font-mono text-xl font-bold text-foreground block">
              {isRecording ? formatTimer(recordingSeconds) : "Prêt à enregistrer"}
            </span>
            <p className="text-xs text-muted-foreground mt-1">
              {isRecording
                ? "Parlez naturellement (vous pouvez dicter plusieurs ventes)... Cliquez sur le carré pour terminer."
                : "Cliquez sur le micro et dictez votre opération."}
            </p>
          </div>
        </div>

        {/* Live Audio / Transcribed Text Review */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Radio size={14} className={isRecording ? "text-rose-600 animate-pulse" : "text-emerald-600"} />
              <span>{isRecording ? "Écoute en direct..." : "Texte dicté"}</span>
            </span>
            <button
              type="button"
              onClick={() => setEditingTranscript((prev) => !prev)}
              className="text-primary hover:underline text-xs flex items-center gap-1"
            >
              <Pencil size={12} />
              <span>{editingTranscript ? "Fermer l'éditeur" : "Corriger le texte"}</span>
            </button>
          </div>

          {editingTranscript ? (
            <div className="space-y-2">
              <textarea
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="Exemple : Vente d'un ordinateur à 50 000 FCFA et aussi 10 téléphones à 80 000 par téléphone"
                rows={3}
                className="w-full p-3 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => parseTranscriptText(transcript)}
                className="px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold"
              >
                Analyser ce texte
              </button>
            </div>
          ) : (
            <p className="p-3.5 rounded-xl bg-card border border-border text-sm text-foreground italic leading-relaxed min-h-[44px]">
              {transcript ? `« ${transcript} »` : <span className="text-muted-foreground not-italic">Aucun texte dicté pour l'instant.</span>}
            </p>
          )}
        </div>

        {/* Status indicator */}
        {analyzing && (
          <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs flex items-center justify-center gap-2">
            <RotateCcw size={15} className="animate-spin" />
            <span>Extraction intelligente des ventes, devises et quantités...</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Extracted Structured Card */}
        {parseResult && parseResult.intent !== "unknown" && (
          <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-primary" />
                <strong className="text-xs uppercase font-bold tracking-wider text-foreground">
                  {parseResult.intent === "sale" && salesList.length > 1
                    ? `✨ ${salesList.length} Ventes Détectées`
                    : `Entité Détectée : ${parseResult.intent.toUpperCase()}`}
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
                  <div key={idx} className="p-3 rounded-xl bg-card border border-border/80 space-y-2.5 shadow-sm">
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
                      <div>
                        <span className="text-muted-foreground block text-[10px] mb-0.5">Article / Produit</span>
                        <input
                          type="text"
                          value={item.item_label}
                          onChange={(e) => handleUpdateSale(idx, "item_label", e.target.value)}
                          className="w-full px-2 py-1 rounded-lg border border-border bg-background text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] mb-0.5">Quantité</span>
                        <input
                          type="number"
                          step="any"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => handleUpdateSale(idx, "quantity", e.target.value)}
                          className="w-full px-2 py-1 rounded-lg border border-border bg-background text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] mb-0.5">Montant Total</span>
                        <input
                          type="number"
                          step="any"
                          value={item.total_amount}
                          onChange={(e) => handleUpdateSale(idx, "total_amount", e.target.value)}
                          placeholder="Prix total"
                          className="w-full px-2 py-1 rounded-lg border border-border bg-background text-xs font-bold font-mono text-primary focus:ring-1 focus:ring-primary focus:outline-none"
                        />
                      </div>
                      <div>
                        <span className="text-muted-foreground block text-[10px] mb-0.5">Devise</span>
                        <select
                          value={item.currency}
                          onChange={(e) => handleUpdateSale(idx, "currency", e.target.value)}
                          className="w-full px-2 py-1 rounded-lg border border-border bg-background text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                        >
                          {CURRENCY_OPTIONS.map((c) => (
                            <option key={c.code} value={c.code}>
                              {c.code}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Payment status toggle per sale */}
                    <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
                      <span className="text-muted-foreground text-[10px]">Règlement :</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateSale(idx, "payment_status", "unpaid")}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                            item.payment_status === "unpaid"
                              ? "bg-rose-500/15 text-rose-600 border border-rose-500/30"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          ⏳ Non Payé
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateSale(idx, "payment_status", "paid")}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold transition ${
                            item.payment_status === "paid"
                              ? "bg-emerald-500/15 text-emerald-600 border border-emerald-500/30"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          🟢 Payé
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Offer Intent Preview */}
            {parseResult.intent === "offer" && parseResult.offer && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-card border border-border/80">
                  <span className="text-muted-foreground block text-[10px]">Nom de l'offre</span>
                  <strong className="text-foreground">{parseResult.offer.name}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-card border border-border/80">
                  <span className="text-muted-foreground block text-[10px]">Tarif</span>
                  <strong className="font-mono text-primary">
                    {formatMoney(parseResult.offer.price, parseResult.offer.currency)}
                  </strong>
                </div>
              </div>
            )}

            {/* Procedure Intent Preview */}
            {parseResult.intent === "procedure" && parseResult.procedure && (
              <div className="space-y-1.5 text-xs">
                <strong className="text-foreground block">{parseResult.procedure.title}</strong>
                <span className="text-muted-foreground text-[11px]">
                  {parseResult.procedure.steps.length} étape(s) identifiée(s)
                </span>
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
            className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted transition"
          >
            Fermer
          </button>

          {parseResult && parseResult.intent !== "unknown" && (
            <button
              type="button"
              onClick={confirmRecord}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition flex items-center gap-2 shadow-md"
            >
              <CheckCircle2 size={16} />
              <span>
                {saving
                  ? "Validation..."
                  : parseResult.intent === "sale" && salesList.length > 1
                  ? `Enregistrer les ${salesList.length} ventes dans le Registre`
                  : "Enregistrer dans le Registre"}
              </span>
            </button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
