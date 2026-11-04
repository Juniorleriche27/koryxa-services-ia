/**
 * Unified Audio Recording & Dictation Engine for CAURI.
 * Combines MediaRecorder (Whisper HD) with Web Speech API (streaming transcript)
 * and an AnalyserNode for real-time visual waveform rendering.
 */

import { serviceIaFetch } from "@/lib/service-ia/api";

export interface AudioRecordingResult {
  audioBlob: Blob;
  mimeType: string;
  transcript: string;
  durationMs: number;
}

export class AudioRecordingEngine {
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private recognition: any = null;
  private startTime: number = 0;
  private liveTranscript: string = "";

  public isRecording: boolean = false;

  /**
   * Start microphone capture with decibel analysis and dual-stream transcription.
   */
  public async startRecording(
    onDecibelUpdate?: (level: number) => void,
    onInterimTranscript?: (text: string) => void
  ): Promise<void> {
    if (typeof window === "undefined") return;

    this.audioChunks = [];
    this.liveTranscript = "";
    this.startTime = Date.now();

    // 1. Request microphone access
    this.mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    // 2. Setup AudioContext and AnalyserNode for real-time waveform
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
        if (this.audioContext.state === "suspended") {
          await this.audioContext.resume();
        }
        const source = this.audioContext.createMediaStreamSource(this.mediaStream);
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 64;
        source.connect(this.analyser);

        // Poll audio volume/decibels
        if (onDecibelUpdate) {
          const bufferLength = this.analyser.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);

          const checkVolume = () => {
            if (!this.isRecording || !this.analyser) return;
            this.analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < bufferLength; i++) {
              sum += dataArray[i];
            }
            const average = sum / bufferLength;
            // Normalize level between 0 and 1
            const normalized = Math.min(1, average / 128);
            onDecibelUpdate(normalized);
            requestAnimationFrame(checkVolume);
          };
          requestAnimationFrame(checkVolume);
        }
      }
    } catch {
      // AudioContext optional fallback
    }

    // 3. Setup MediaRecorder
    let mimeType = "audio/webm;codecs=opus";
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      if (MediaRecorder.isTypeSupported("audio/mp4")) mimeType = "audio/mp4";
      else if (MediaRecorder.isTypeSupported("audio/ogg")) mimeType = "audio/ogg";
      else mimeType = "";
    }

    this.mediaRecorder = mimeType
      ? new MediaRecorder(this.mediaStream, { mimeType })
      : new MediaRecorder(this.mediaStream);

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.start(250); // Record chunks every 250ms
    this.isRecording = true;

    // 4. Setup Web Speech API for real-time live preview (if supported)
    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      try {
        const recognition = new SpeechRecognitionClass();
        recognition.lang = "fr-FR";
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.maxAlternatives = 1;

        recognition.onresult = (event: any) => {
          let interim = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            interim += event.results[i][0].transcript + " ";
          }
          this.liveTranscript = interim.trim();
          if (onInterimTranscript) {
            onInterimTranscript(this.liveTranscript);
          }
        };

        recognition.onerror = () => {
          // Ignore SpeechRecognition errors (MediaRecorder handles the audio file)
        };

        recognition.start();
        this.recognition = recognition;
      } catch {
        // Ignore
      }
    }
  }

  /**
   * Stop recording and package the audio blob.
   */
  public async stopRecording(): Promise<AudioRecordingResult> {
    this.isRecording = false;

    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignore
      }
    }

    const durationMs = Date.now() - this.startTime;

    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve({
          audioBlob: new Blob([], { type: "audio/webm" }),
          mimeType: "audio/webm",
          transcript: this.liveTranscript,
          durationMs,
        });
        return;
      }

      this.mediaRecorder.onstop = () => {
        const mimeType = this.mediaRecorder?.mimeType || "audio/webm";
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });

        // Clean up tracks
        if (this.mediaStream) {
          this.mediaStream.getTracks().forEach((track) => track.stop());
          this.mediaStream = null;
        }

        if (this.audioContext && this.audioContext.state !== "closed") {
          this.audioContext.close().catch(() => {});
          this.audioContext = null;
        }

        resolve({
          audioBlob,
          mimeType,
          transcript: this.liveTranscript,
          durationMs,
        });
      };

      try {
        this.mediaRecorder.stop();
      } catch {
        // In case already stopped
        const audioBlob = new Blob(this.audioChunks, { type: "audio/webm" });
        resolve({
          audioBlob,
          mimeType: "audio/webm",
          transcript: this.liveTranscript,
          durationMs,
        });
      }
    });
  }
}

/**
 * Upload audio blob to backend Whisper AI transcriber.
 */
export async function transcribeAudioFile(audioBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append("file", audioBlob, "dictation.webm");

  const response = await fetch("/api/service-ia/voice/transcribe", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error?.message || "Erreur de transcription vocale Whisper.");
  }

  const result = await response.json();
  return result.transcript || "";
}

/**
 * Text-To-Speech audio confirmation for hands-free cashier operation.
 */
export function speakConfirmation(text: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Ignore TTS errors
  }
}
