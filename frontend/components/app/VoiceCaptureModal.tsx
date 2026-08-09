"use client";

import { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  ReceiptText,
  Tag,
  FileCheck2,
  ArrowRight,
  Volume2,
  RefreshCw,
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
  const [transcript, setTranscript] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [parseResult, setParseResult] = useState<VoiceParseResult | null>(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef("");

  // Initialize Speech Recognition if available in browser
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "fr-FR";

        recognition.onresult = (event: any) => {
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const text = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscriptRef.current = `${finalTranscriptRef.current} ${text}`.trim();
            } else {
              interim += text;
            }
          }
          setTranscript(`${finalTranscriptRef.current} ${interim}`.trim());
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsRecording(false);
          const messages: Record<string, string> = {
            "not-allowed":
              "Accès au microphone refusé. Autorisez le micro pour service-ia.koryxa.fr dans votre navigateur.",
            "service-not-allowed":
              "Le service de reconnaissance vocale est bloqué par le navigateur.",
            "audio-capture": "Aucun microphone utilisable n’a été détecté.",
            network: "La reconnaissance vocale est momentanément indisponible.",
            "no-speech": "Aucune parole détectée. Rapprochez-vous du microphone et réessayez.",
          };
          setError(messages[event.error] || "La capture vocale a échoué. Réessayez.");
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const toggleRecording = () => {
    setError("");
    if (!recognitionRef.current) {
      setError(
        "La reconnaissance vocale n’est pas disponible dans ce navigateur. Utilisez Chrome ou Edge, ou saisissez la phrase manuellement.",
      );
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setTranscript("");
      finalTranscriptRef.current = "";
      setParseResult(null);
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch {
        setIsRecording(false);
        setError("Le microphone est déjà utilisé ou n’a pas pu démarrer.");
      }
    }
  };

  const handleAnalyze = async () => {
    if (!transcript.trim()) {
      setError("Veuillez dicter ou saisir une phrase avant d'analyser.");
      return;
    }

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    setAnalyzing(true);
    setError("");
    try {
      const res = await serviceIaFetch<VoiceParseResult>("/voice/parse", {
        method: "POST",
        body: JSON.stringify({ transcript }),
      });
      setParseResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'analyse vocale");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirm = async () => {
    if (!parseResult) return;
    setSaving(true);
    setError("");
    try {
      const payload =
        parseResult.intent === "sale"
          ? parseResult.sale
          : parseResult.intent === "offer"
          ? parseResult.offer
          : parseResult.procedure;

      await serviceIaFetch("/voice/confirm", {
        method: "POST",
        body: JSON.stringify({
          intent: parseResult.intent,
          payload,
          source: "voice",
        }),
      });

      setSuccessMessage("✅ Enregistrement validé et synchronisé dans votre registre !");
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccessMessage("");
        setParseResult(null);
        setTranscript("");
      }, 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de la confirmation");
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <Dialog
      open
      title="🎙️ Capture Vocale Intelligente"
      description="Dictez une vente, une offre ou une procédure en langage naturel. L'IA KORYXA extrait et structure les données instantanément."
      onClose={onClose}
    >
      <div className="kx-voice-container">
        {/* Animated Recording Zone */}
        <div className={`kx-voice-mic-zone ${isRecording ? "is-active-recording" : ""}`}>
          <button
            type="button"
            className={`kx-voice-mic-button ${isRecording ? "is-pulsing" : ""}`}
            onClick={toggleRecording}
            title={isRecording ? "Arrêter l'écoute" : "Démarrer la dictée vocale"}
          >
            {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
          </button>

          <span className="kx-voice-status-label">
            {isRecording ? "Écoute en cours… Parlez naturellement" : "Cliquez sur le micro pour dicter"}
          </span>

          {isRecording && (
            <div className="kx-voice-soundwave">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          )}
        </div>

        {/* Live Transcript Box */}
        <div className="kx-voice-transcript-box">
          <div className="kx-voice-transcript-head">
            <span>Transcription</span>
            {transcript && (
              <button
                type="button"
                className="app-text-button kx-btn-xs"
                onClick={() => {
                  finalTranscriptRef.current = "";
                  setTranscript("");
                }}
              >
                Effacer
              </button>
            )}
          </div>
          <textarea
            className="kx-voice-textarea"
            rows={3}
            value={transcript}
            onChange={(e) => {
              finalTranscriptRef.current = e.target.value;
              setTranscript(e.target.value);
            }}
            placeholder="Ex : « Vente de 3 sacs de riz à 15 000 FCFA à M. Koffi payé par Wave »"
          />
        </div>

        {/* Action Button: Analyze */}
        {!parseResult && (
          <div className="kx-voice-analyze-row">
            <button
              type="button"
              className="app-button app-button-primary kx-w-full"
              disabled={analyzing || !transcript.trim()}
              onClick={handleAnalyze}
            >
              {analyzing ? (
                <>
                  <RefreshCw size={16} className="kx-spin" />
                  <span>Analyse intelligente…</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Analyser avec l&apos;IA KORYXA</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Form Error or Success */}
        <FormError>{error}</FormError>
        {successMessage && <div className="kx-success-alert">{successMessage}</div>}

        {/* Structured Result Preview */}
        {parseResult && (
          <div className="kx-voice-result-card">
            <div className="kx-voice-result-head">
              <div className="kx-intent-badge">
                {parseResult.intent === "sale" && <ReceiptText size={16} />}
                {parseResult.intent === "offer" && <Tag size={16} />}
                {parseResult.intent === "procedure" && <FileCheck2 size={16} />}
                <span>
                  {parseResult.intent === "sale"
                    ? "Vente Détectée"
                    : parseResult.intent === "offer"
                    ? "Offre Détectée"
                    : "Procédure Détectée"}
                </span>
              </div>
              <StatusPill>{Math.round(parseResult.confidence * 100)}% confiance</StatusPill>
            </div>

            <p className="kx-voice-summary-text">{parseResult.summary_message}</p>

            {/* Extracted Fields Summary for Sale */}
            {parseResult.sale && (
              <div className="kx-extracted-grid">
                <div>
                  <small>Article / Service</small>
                  <strong>{parseResult.sale.item_label}</strong>
                </div>
                <div>
                  <small>Client</small>
                  <strong>{parseResult.sale.client_name || "Client anonyme"}</strong>
                </div>
                <div>
                  <small>Montant total</small>
                  <strong className="kx-price-highlight">
                    {formatMoney(parseResult.sale.total_amount, parseResult.sale.currency)}
                  </strong>
                </div>
                <div>
                  <small>Mode & Statut</small>
                  <strong>
                    {parseResult.sale.payment_method || "Non précisé"} (
                    {formatLabel(parseResult.sale.payment_status)})
                  </strong>
                </div>
              </div>
            )}

            {/* Confirm Actions */}
            <div className="kx-voice-result-actions">
              <button
                type="button"
                className="app-button app-button-secondary"
                onClick={() => setParseResult(null)}
              >
                Corriger
              </button>
              <button
                type="button"
                className="app-button app-button-primary"
                disabled={saving}
                onClick={handleConfirm}
              >
                {saving ? "Enregistrement…" : "Confirmer et enregistrer"}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        <div className="app-form-actions" style={{ marginTop: 12 }}>
          <button type="button" className="app-button app-button-secondary" onClick={onClose}>
            Fermer
          </button>
        </div>
      </div>
    </Dialog>
  );
}
