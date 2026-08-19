"use client";

import {
  HelpCircle,
  Sparkles,
  Mic,
  Bot,
  Command,
  Compass,
  ArrowRight,
  X,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { Dialog } from "./Dialog";
import { BusinessCategoryConfig } from "@/lib/service-ia/business-categories";

interface QuickHelpModalProps {
  open: boolean;
  onClose: () => void;
  proConfig: BusinessCategoryConfig;
  onStartTour: () => void;
  onOpenVoice: () => void;
  onOpenCopilot: () => void;
}

export function QuickHelpModal({
  open,
  onClose,
  proConfig,
  onStartTour,
  onOpenVoice,
  onOpenCopilot,
}: QuickHelpModalProps) {
  if (!open) return null;

  return (
    <Dialog open={open} onClose={onClose} title="Centre d'Aide & Guidage KORYXA">
      <div className="space-y-6">
        {/* Banner with Business Category context */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-900 text-white flex items-center justify-between gap-4">
          <div>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-extrabold uppercase tracking-wider mb-1">
              Espace {proConfig.emoji} {proConfig.name}
            </span>
            <h4 className="text-base font-bold text-white leading-snug">
              Besoin d&apos;aide pour utiliser KORYXA ?
            </h4>
            <p className="text-xs text-slate-300 mt-0.5">
              Découvrez les raccourcis et le fonctionnement en toute simplicité.
            </p>
          </div>
          <button
            onClick={() => {
              onClose();
              onStartTour();
            }}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold flex items-center gap-1.5 shrink-0 shadow-md transition cursor-pointer"
          >
            <Compass size={15} />
            <span>Visite Guidée</span>
          </button>
        </div>

        {/* 3 Interactive Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div
            onClick={() => {
              onClose();
              onOpenVoice();
            }}
            className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-emerald-400 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 grid place-items-center shrink-0 group-hover:scale-105 transition-transform">
                <Mic size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <strong className="text-xs font-bold text-slate-900 dark:text-white block">
                  Tester la Dictée Vocale
                </strong>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 block mt-0.5">
                  Saisie de ventes à la voix sans clavier
                </span>
              </div>
            </div>
          </div>

          <div
            onClick={() => {
              onClose();
              onOpenCopilot();
            }}
            className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 hover:border-emerald-400 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 transition cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 grid place-items-center shrink-0 group-hover:scale-105 transition-transform">
                <Bot size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <strong className="text-xs font-bold text-slate-900 dark:text-white block">
                  Discuter avec Cora IA
                </strong>
                <span className="text-[11px] text-slate-600 dark:text-slate-400 block mt-0.5">
                  Posez vos questions sur vos chiffres réels
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Examples */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/80 dark:border-slate-800 space-y-2.5">
          <h5 className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={14} className="text-emerald-600" />
            <span>Exemples de phrases que vous pouvez dicter :</span>
          </h5>
          <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
            {proConfig.activationGuide.steps
              .filter((s) => s.exampleText)
              .map((s) => (
                <li key={s.id} className="flex items-start gap-2 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  <span className="text-emerald-600 font-bold shrink-0">💬</span>
                  <span className="italic">{s.exampleText}</span>
                </li>
              ))}
          </ul>
        </div>

        {/* Keyboard Shortcuts */}
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
          <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
            Raccourcis Clavier Pro
          </h5>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Assistant Cora IA</span>
              <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-bold text-[10.5px]">Ctrl + J</kbd>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <span className="text-slate-600 dark:text-slate-400 font-medium">Recherche & Actions</span>
              <kbd className="px-2 py-0.5 rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 font-mono font-bold text-[10.5px]">Ctrl + K</kbd>
            </div>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
