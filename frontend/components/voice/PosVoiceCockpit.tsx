"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  Square,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Volume2,
  ArrowRight,
  Zap,
} from "lucide-react";
import { AudioWaveform } from "./AudioWaveform";
import {
  AudioRecordingEngine,
  transcribeAudioFile,
  speakConfirmation,
} from "@/lib/voice/audio-recorder";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { posAudioHaptics } from "@/lib/offline/pos-audio-haptics";

interface PosVoiceCockpitProps {
  open: boolean;
  onClose: () => void;
  onApplyItems: (data: {
    items: Array<{ name: string; quantity: number; unitPrice: number }>;
    clientName?: string;
    paymentMethod?: string;
  }) => void;
  currency?: string;
}

export function PosVoiceCockpit({
  open,
  onClose,
  onApplyItems,
  currency = "XOF",
}: PosVoiceCockpitProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [decibelLevel, setDecibelLevel] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [extractedSummary, setExtractedSummary] = useState<string | null>(null);

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

  const handleStart = async () => {
    setErrorMessage(null);
    setExtractedSummary(null);
    setLiveTranscript("");
    setRecordingSeconds(0);

    posAudioHaptics.playTapSound();
    posAudioHaptics.triggerHaptic("medium");

    try {
      if (!engineRef.current) {
        engineRef.current = new AudioRecordingEngine();
      }

      await engineRef.current.startRecording(
        (lvl) => setDecibelLevel(lvl),
        (transcript) => setLiveTranscript(transcript)
      );

      setIsRecording(true);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      setErrorMessage("Microphone inaccessible. Veuillez autoriser l'accès audio.");
      posAudioHaptics.playWarningSound();
      posAudioHaptics.triggerHaptic("warning");
    }
  };

  const handleStopAndParse = async () => {
    if (!engineRef.current || !isRecording) return;

    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
    setIsAnalyzing(true);
    setErrorMessage(null);

    posAudioHaptics.playTapSound();
    posAudioHaptics.triggerHaptic("light");

    try {
      const result = await engineRef.current.stopRecording();
      let textToParse = result.transcript.trim();

      // If speech recognition didn't capture text, send the recorded audio blob to Whisper AI
      if (!textToParse && result.audioBlob && result.audioBlob.size > 1000) {
        try {
          textToParse = await transcribeAudioFile(result.audioBlob);
        } catch {
          // Whisper fallback error
        }
      }

      if (!textToParse) {
        throw new Error("Aucune parole détectée. Veuillez parler plus près du microphone.");
      }

      setLiveTranscript(textToParse);

      // Call semantic AI parsing
      const parseResponse = await serviceIaFetch<any>("/voice/parse", {
        method: "POST",
        body: JSON.stringify({ transcript: textToParse }),
      });

      if (parseResponse.intent === "sale" && (parseResponse.sale || parseResponse.sales)) {
        const sales = parseResponse.sales || [parseResponse.sale];
        const extractedItems = sales.map((s: any) => ({
          name: s.item_label || "Article vocal",
          quantity: Number(s.quantity) || 1,
          unitPrice: Number(s.unit_price) || 0,
        }));

        const primarySale = sales[0];
        const clientName = primarySale.client_name || undefined;
        let paymentMethod: string | undefined = undefined;

        if (primarySale.payment_method) {
          const pm = primarySale.payment_method.toLowerCase();
          if (pm.includes("wave")) paymentMethod = "wave";
          else if (pm.includes("orange")) paymentMethod = "orange_money";
          else if (pm.includes("mtn") || pm.includes("momo")) paymentMethod = "mtn_momo";
          else if (pm.includes("carte")) paymentMethod = "card";
          else paymentMethod = "cash";
        }

        const totalFormatted = extractedItems
          .reduce((sum: number, it: any) => sum + it.quantity * it.unitPrice, 0)
          .toLocaleString("fr-FR");

        const summary = `${extractedItems.length} article(s) reconnu(s) pour un total de ${totalFormatted} ${currency}.`;
        setExtractedSummary(summary);

        posAudioHaptics.playCashDrawerSound();
        posAudioHaptics.triggerHaptic("success");
        speakConfirmation("Articles ajoutés au panier");

        // Apply items to POS cart
        onApplyItems({
          items: extractedItems,
          clientName,
          paymentMethod,
        });

        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error(
          parseResponse.summary_message ||
            "L'IA n'a pas pu identifier clairement les articles ou montants. Veuillez reformuler."
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur d'analyse vocale.";
      setErrorMessage(msg);
      posAudioHaptics.playWarningSound();
      posAudioHaptics.triggerHaptic("warning");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-card border border-border rounded-3xl p-6 sm:p-7 shadow-2xl relative flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-600 text-white grid place-items-center shadow-xs">
              <Mic size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground">Cockpit Vocal de Caisse</h3>
              <p className="text-xs text-muted-foreground">
                Dictez vos ventes en direct sans toucher au clavier
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full grid place-items-center text-muted-foreground hover:bg-muted transition cursor-pointer"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Waveform Visualizer */}
        <AudioWaveform
          isRecording={isRecording}
          decibelLevel={decibelLevel}
          recordingSeconds={recordingSeconds}
        />

        {/* Live Streaming Transcript */}
        <div className="min-h-[72px] p-4 rounded-2xl border border-border bg-muted/30 text-xs flex flex-col justify-center text-center">
          {liveTranscript ? (
            <p className="font-bold text-foreground text-sm italic">
              &laquo; {liveTranscript} &raquo;
            </p>
          ) : (
            <p className="text-muted-foreground">
              {isRecording
                ? "Parlez maintenant... (ex: 3 pagnes à 12 000 payé par Wave)"
                : "Appuyez sur le bouton rouge pour commencer à parler."}
            </p>
          )}
        </div>

        {/* Success or Error feedback */}
        {extractedSummary && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{extractedSummary}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-800 text-red-800 dark:text-red-300 text-xs font-bold flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Examples of voice phrasing */}
        {!isRecording && !extractedSummary && (
          <div className="p-3 rounded-2xl bg-muted/40 border border-border space-y-1.5 text-[11px] text-muted-foreground">
            <span className="font-bold uppercase text-[10px] tracking-wider block text-foreground">
              Exemples de commandes vocales :
            </span>
            <ul className="space-y-1 list-disc list-inside">
              <li>&laquo; 3 sacs de ciment à 5 000 pour M. Koné par Wave &raquo;</li>
              <li>&laquo; 2 cartons de lait à 15 000 espèces &raquo;</li>
              <li>&laquo; Vente 1 pagne kita à 45 000 payé par Orange Money &raquo;</li>
            </ul>
          </div>
        )}

        {/* Action Button: Start / Stop */}
        <div>
          {isRecording ? (
            <button
              type="button"
              onClick={handleStopAndParse}
              disabled={isAnalyzing}
              className="w-full py-4 min-h-[50px] rounded-2xl bg-red-600 hover:bg-red-700 text-white font-black text-sm shadow-lg shadow-red-600/25 flex items-center justify-center gap-2 cursor-pointer transition animate-pulse"
            >
              <Square size={16} />
              <span>Arrêter et Ajouter au Ticket</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStart}
              disabled={isAnalyzing}
              className="w-full py-4 min-h-[50px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer transition"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Analyse sémantique IA en cours...</span>
                </>
              ) : (
                <>
                  <Mic size={18} />
                  <span>Activer la Dictée Vocale</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
