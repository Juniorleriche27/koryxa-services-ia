"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  X,
  Award,
} from "lucide-react";
import clsx from "clsx";
import { BusinessCategoryConfig, ActivationStep } from "@/lib/service-ia/business-categories";

interface ActivationChecklistWidgetProps {
  proConfig: BusinessCategoryConfig;
  totalSalesCount: number;
  offersCount: number;
  onOpenVoice?: () => void;
}

export function ActivationChecklistWidget({
  proConfig,
  totalSalesCount,
  offersCount,
  onOpenVoice,
}: ActivationChecklistWidgetProps) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  // Storage key per category
  const storageKey = `koryxa_activation_${proConfig.id}`;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      const isDismissed = localStorage.getItem(`${storageKey}_dismissed`);
      if (isDismissed === "true") {
        setDismissed(true);
      }
      if (stored) {
        setCompletedSteps(JSON.parse(stored));
      }
    } catch {
      // ignore localStorage errors
    }
  }, [storageKey]);

  // Sync automated completion based on actual database numbers
  useEffect(() => {
    setCompletedSteps((prev) => {
      const next = { ...prev };
      if (totalSalesCount > 0) next["step-voice"] = true;
      if (offersCount > 0) next["step-catalog"] = true;
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, [totalSalesCount, offersCount, storageKey]);

  const steps = proConfig.activationGuide.steps;
  const totalCount = steps.length;
  const completedCount = steps.filter((s) => completedSteps[s.id]).length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const toggleStep = (stepId: string) => {
    setCompletedSteps((prev) => {
      const next = { ...prev, [stepId]: !prev[stepId] };
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const handleAction = (step: ActivationStep) => {
    if (step.actionType === "voice") {
      if (onOpenVoice) {
        onOpenVoice();
      } else {
        window.dispatchEvent(new CustomEvent("koryxa:open-voice"));
      }
    } else if (step.actionHref) {
      router.push(step.actionHref);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(`${storageKey}_dismissed`, "true");
    } catch {
      // ignore
    }
  };

  if (dismissed) {
    return (
      <button
        onClick={() => {
          setDismissed(false);
          try {
            localStorage.removeItem(`${storageKey}_dismissed`);
          } catch {
            // ignore
          }
        }}
        className="fixed bottom-20 sm:bottom-6 right-6 z-40 flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900 text-white shadow-xl hover:bg-slate-800 transition text-xs font-bold border border-slate-700 cursor-pointer"
        title="Ouvrir le guide de démarrage"
      >
        <Sparkles size={14} className="text-emerald-400" />
        <span>Guide de démarrage ({completedCount}/{totalCount})</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 w-[calc(100vw-32px)] sm:w-[380px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="p-3.5 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 grid place-items-center shrink-0 border border-emerald-500/30">
            {progressPercent === 100 ? <Award size={16} /> : <Sparkles size={16} />}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold truncate text-white leading-tight">
              Guide de Démarrage ({completedCount}/{totalCount})
            </h4>
            <p className="text-[10.5px] text-emerald-300/80 truncate">
              {proConfig.shortName} • {progressPercent}% complété
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1 rounded-md hover:bg-white/10 text-slate-300 transition cursor-pointer"
            aria-label={collapsed ? "Déplier" : "Réduire"}
          >
            {collapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 rounded-md hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
            aria-label="Fermer le guide"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-slate-100 dark:bg-slate-800 w-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Body Content */}
      {!collapsed && (
        <div className="p-3 max-h-[380px] overflow-y-auto space-y-2.5">
          <p className="text-xs text-slate-600 dark:text-slate-400 px-1">
            {proConfig.activationGuide.welcomeDescription}
          </p>

          <div className="space-y-2">
            {steps.map((step, idx) => {
              const isDone = Boolean(completedSteps[step.id]);

              return (
                <div
                  key={step.id}
                  className={clsx(
                    "p-2.5 rounded-xl border transition text-left",
                    isDone
                      ? "bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50"
                      : "bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-700/60 hover:border-emerald-300"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <button
                      type="button"
                      onClick={() => toggleStep(step.id)}
                      className="mt-0.5 text-slate-400 hover:text-emerald-600 transition cursor-pointer shrink-0"
                    >
                      {isDone ? (
                        <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Circle size={18} />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <strong
                          className={clsx(
                            "text-xs font-bold tracking-tight block",
                            isDone
                              ? "line-through text-slate-500 dark:text-slate-400 font-medium"
                              : "text-slate-900 dark:text-slate-100"
                          )}
                        >
                          {idx + 1}. {step.title}
                        </strong>
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {step.description}
                      </p>

                      {step.exampleText && !isDone && (
                        <div className="mt-1.5 px-2 py-1 rounded-md bg-emerald-100/60 dark:bg-emerald-950/40 text-[10.5px] font-medium text-emerald-800 dark:text-emerald-300 italic border border-emerald-200/50">
                          {step.exampleText}
                        </div>
                      )}

                      {!isDone && (
                        <div className="mt-2 flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => handleAction(step)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition cursor-pointer"
                          >
                            <span>{step.actionLabel}</span>
                            <ArrowRight size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {progressPercent === 100 && (
            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 text-center text-xs font-bold border border-emerald-300">
              🎉 Félicitations ! Votre espace {proConfig.shortName} est 100% configuré et prêt pour l&apos;activité quotidienne.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
