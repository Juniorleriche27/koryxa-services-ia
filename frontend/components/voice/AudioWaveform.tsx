"use client";

import React, { useMemo } from "react";
import { Mic, Radio } from "lucide-react";

interface AudioWaveformProps {
  isRecording: boolean;
  decibelLevel: number; // 0.0 to 1.0
  recordingSeconds: number;
}

export function AudioWaveform({
  isRecording,
  decibelLevel,
  recordingSeconds,
}: AudioWaveformProps) {
  const barsCount = 20;

  // Format seconds to mm:ss
  const formattedTime = useMemo(() => {
    const mins = Math.floor(recordingSeconds / 60);
    const secs = recordingSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }, [recordingSeconds]);

  // Generate dynamic bar heights based on decibel level and index
  const barHeights = useMemo(() => {
    if (!isRecording) return Array(barsCount).fill(4);

    return Array.from({ length: barsCount }, (_, i) => {
      // Bell curve factor so center bars are naturally taller
      const centerFactor = 1 - Math.abs(i - barsCount / 2) / (barsCount / 2);
      const randomJitter = Math.sin(i * 1.5 + recordingSeconds * 4) * 0.25 + 0.75;
      const heightPx = Math.max(
        6,
        Math.round(decibelLevel * 44 * centerFactor * randomJitter + 4)
      );
      return Math.min(48, heightPx);
    });
  }, [isRecording, decibelLevel, recordingSeconds, barsCount]);

  return (
    <div className="flex flex-col items-center justify-center gap-3 w-full p-4 rounded-2xl bg-slate-950 text-white shadow-inner">
      {/* Recording Header Pill */}
      <div className="flex items-center justify-between w-full text-xs">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            {isRecording && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            )}
            <span
              className={`relative inline-flex rounded-full h-3 w-3 ${
                isRecording ? "bg-red-500" : "bg-slate-600"
              }`}
            />
          </span>
          <span className="font-bold tracking-wide uppercase text-[10px] text-slate-300">
            {isRecording ? "Écoute Vocale Active" : "Microphone en pause"}
          </span>
        </div>

        <span className="font-mono font-bold text-xs text-slate-300 bg-slate-800/80 px-2.5 py-0.5 rounded-full">
          {formattedTime}
        </span>
      </div>

      {/* Dynamic Sound Wave Bars */}
      <div className="flex items-center justify-center gap-1.5 h-14 w-full">
        {barHeights.map((h, i) => (
          <div
            key={i}
            className={`w-1.5 rounded-full transition-all duration-75 ${
              isRecording
                ? "bg-linear-to-t from-red-500 via-rose-400 to-amber-300"
                : "bg-slate-700 h-1.5"
            }`}
            style={{
              height: `${h}px`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
