"use client";

import { useState, useEffect, useRef } from "react";
import {
  Mic,
  Square,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  ReceiptText,
  Tag,
  FileCheck2,
  ArrowRight,
  RefreshCw,
  Radio,
  Pencil,
} from "lucide-react";
import { Dialog, FormError } from "./Dialog";
import { StatusPill } from "./Ui";
import { formatMoney, formatLabel } from "./RegistersTable";
import { serviceIaFetch } from "@/lib/service-ia/api";

interface VoiceParseResult {
  intent: "sale" | "offer" | "procedure" | "unknown";
  confidence: number;
  original_transcript: string;
  sale?: {
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
  };
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
  const [transcribing, setTranscribing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parseResult, setParseResult] = useState<VoiceParseResult | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingTranscript, setEditingTranscript] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  const startRecording = async () => {
    setError("");
    setSuccessMessage("");
    setParseResult(null);
    setTranscript("");
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        // Stop all audio tracks to turn off mic indicator
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        if (audioBlob.size > 100) {
          await transcribeAudioBlob(audioBlob);
        }
      };

      recorder.start(250); // Slice chunks every 250ms
      setIsRecording(true);
    } catch (err: any) {
      console.error("Mic error:", err);
      setError("Accès au microphone refusé ou indisponible. Veuillez autoriser le microphone.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const transcribeAudioBlob = async (blob: Blob) => {
    setTranscribing(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", blob, "voice_note.webm");

      const transcription = await serviceIaFetch<{
        transcript: string;
        confidence: number;
        engine: string;
      }>("/voice/transcribe", {
        method: "POST",
        body: formData,
      });

      if (transcription?.transcript) {
        setTranscript(transcription.transcript);
        await parseTranscriptText(transcription.transcript);
      } else {
        setError("Aucune parole détectée dans l'enregistrement audio.");
      }
    } catch (err: any) {
      setError(err.message || "Erreur de transcription Whisper AI HD.");
    } finally {
      setTranscribing(false);
    }
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
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'analyse sémantique du texte.");
    } finally {
      setAnalyzing(false);
    }
  };

  const confirmRecord = async () => {
    if (!parseResult || parseResult.intent === "unknown") return;
    setSaving(true);
    setError("");

    try {
      let payload: any = null;
      if (parseResult.intent === "sale" && parseResult.sale) {
        payload = parseResult.sale;
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

      setSuccessMessage("Enregistrement réussi et archivé dans votre registre !");
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
    setIsRecording(false);
    setTranscript("");
    setParseResult(null);
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
      title="Dictée Vocale Intelligente (Whisper AI HD)"
      description="Dictez une vente, un tarif ou une procédure opérationnelle. L'IA extrait automatiquement les chiffres et entités."
    >
      <div className="space-y-5">
        {/* Recording Visualizer Card */}
        <div className="p-6 rounded-2xl bg-muted/40 border border-border flex flex-col items-center justify-center text-center relative overflow-hidden">
          {/* Animated Wave Glow while recording */}
          {isRecording && (
            <div className="absolute inset-0 bg-rose-500/5 animate-pulse pointer-events-none" />
          )}

          <div className="mb-4">
            <button
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
              disabled={transcribing || analyzing || saving}
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
                ? "Parlez naturellement... Cliquez pour arrêter."
                : "Cliquez sur le micro pour démarrer la note vocale."}
            </p>
          </div>
        </div>

        {/* Status indicator */}
        {(transcribing || analyzing) && (
          <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs flex items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin" />
            <span>
              {transcribing
                ? "Transcription haute fidélité par Whisper AI HD..."
                : "Extraction sémantique des montants et entités..."}
            </span>
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

        {/* Transcribed Text Review */}
        {transcript && (
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Radio size={14} className="text-emerald-600" />
                <span>Transcription Whisper AI HD</span>
              </span>
              <button
                type="button"
                onClick={() => setEditingTranscript((prev) => !prev)}
                className="text-primary hover:underline text-xs flex items-center gap-1"
              >
                <Pencil size={12} />
                <span>{editingTranscript ? "Terminer" : "Corriger le texte"}</span>
              </button>
            </div>

            {editingTranscript ? (
              <div className="space-y-2">
                <textarea
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  rows={3}
                  className="w-full p-3 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => parseTranscriptText(transcript)}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold"
                >
                  Ré-analyser ce texte
                </button>
              </div>
            ) : (
              <p className="p-3.5 rounded-xl bg-card border border-border text-sm text-foreground italic leading-relaxed">
                « {transcript} »
              </p>
            )}
          </div>
        )}

        {/* Extracted Structured Card */}
        {parseResult && parseResult.intent !== "unknown" && (
          <div className="p-4 rounded-2xl bg-muted/40 border border-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-primary" />
                <strong className="text-xs uppercase font-bold tracking-wider text-foreground">
                  Entité Détectée : {parseResult.intent.toUpperCase()}
                </strong>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                Confiance : {Math.round(parseResult.confidence * 100)}%
              </span>
            </div>

            {/* Sale Intent Preview */}
            {parseResult.intent === "sale" && parseResult.sale && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-card border border-border/80">
                  <span className="text-muted-foreground block text-[10px]">Article / Vente</span>
                  <strong className="text-foreground">{parseResult.sale.item_label}</strong>
                </div>
                <div className="p-2.5 rounded-xl bg-card border border-border/80">
                  <span className="text-muted-foreground block text-[10px]">Montant Total</span>
                  <strong className="font-mono text-primary text-sm">
                    {formatMoney(parseResult.sale.total_amount, parseResult.sale.currency)}
                  </strong>
                </div>
                <div className="p-2.5 rounded-xl bg-card border border-border/80">
                  <span className="text-muted-foreground block text-[10px]">Client</span>
                  <span className="font-medium text-foreground">
                    {parseResult.sale.client_name || "Client standard"}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-card border border-border/80">
                  <span className="text-muted-foreground block text-[10px]">Règlement</span>
                  <span className="font-medium text-foreground">
                    {parseResult.sale.payment_method || "Espèces"} ({parseResult.sale.payment_status})
                  </span>
                </div>
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
              <span>{saving ? "Validation..." : "Enregistrer dans le Registre"}</span>
            </button>
          )}
        </div>
      </div>
    </Dialog>
  );
}
