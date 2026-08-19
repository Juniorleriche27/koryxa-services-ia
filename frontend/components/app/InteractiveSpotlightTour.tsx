"use client";

import { useState, useEffect } from "react";
import { Sparkles, ArrowRight, ArrowLeft, X, Check, Lightbulb } from "lucide-react";
import clsx from "clsx";
import { BusinessCategoryConfig } from "@/lib/service-ia/business-categories";

interface TourStep {
  targetSelector: string;
  title: string;
  description: string;
  badge: string;
}

export function InteractiveSpotlightTour({
  proConfig,
}: {
  proConfig: BusinessCategoryConfig;
}) {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const tourSteps: TourStep[] = [
    {
      targetSelector: '[data-tour="voice-mic"]',
      title: "🎙️ Dictée Vocale Magique",
      description: "Dictez vos ventes, commandes et cotisations en Français ou langues locales. L'IA extrait automatiquement le client, l'article, la quantité et le montant !",
      badge: "Saisie sans clavier",
    },
    {
      targetSelector: '[data-tour="cora-ia"]',
      title: "🤖 Cora IA • Directrice des Opérations",
      description: "Accessible via le bouton ou le raccourci (Ctrl+J / ⌘J). Posez-lui n'importe quelle question sur votre chiffre d'affaires, vos stocks ou vos impayés !",
      badge: "IA Opérationnelle",
    },
    {
      targetSelector: '[data-tour="nav-blocks"]',
      title: "📁 4 Blocs Métiers Organisés",
      description: `Vos registres (${proConfig.shortName}) sont scindés en 4 univers clairs : Pilotage, Équipe & Pointage, Radar & Qualité, Canaux & Système. Cliquez pour déplier !`,
      badge: proConfig.badge,
    },
    {
      targetSelector: '[data-tour="cockpit-score"]',
      title: "📊 Cockpit & Score Radar KORYXA",
      description: "Surveillez vos 4 indicateurs vitaux : Chiffre d'Affaires, Total Encaissé, Factures en attente et votre note de santé opérationnelle sur 100.",
      badge: "Pilotage Dirigeant",
    },
  ];

  // Check if first-time user and listen for re-launch event
  useEffect(() => {
    const handleStartTour = () => {
      setActiveStep(0);
    };

    window.addEventListener("koryxa:start-tour", handleStartTour);

    try {
      const hasSeen = localStorage.getItem("koryxa_spotlight_tour_completed");
      if (!hasSeen) {
        // Automatically start after a gentle 1.2s delay on initial discovery
        const timer = setTimeout(() => {
          setActiveStep(0);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } catch {
      // ignore
    }

    return () => {
      window.removeEventListener("koryxa:start-tour", handleStartTour);
    };
  }, []);

  // Update target bounding box when active step changes or on window resize
  useEffect(() => {
    if (activeStep === null) {
      setTargetRect(null);
      return;
    }

    const step = tourSteps[activeStep];
    if (!step) return;

    const updateRect = () => {
      const el = document.querySelector(step.targetSelector);
      if (el) {
        const rect = el.getBoundingClientRect();
        setTargetRect(rect);
        // Scroll element into view smoothly if off-screen
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        // Fallback if target element not found on page
        setTargetRect(null);
      }
    };

    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);

    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [activeStep]);

  const handleNext = () => {
    if (activeStep === null) return;
    if (activeStep < tourSteps.length - 1) {
      setActiveStep(activeStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (activeStep === null) return;
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleComplete = () => {
    setActiveStep(null);
    try {
      localStorage.setItem("koryxa_spotlight_tour_completed", "true");
    } catch {
      // ignore
    }
  };

  if (activeStep === null) return null;

  const currentStep = tourSteps[activeStep];

  return (
    <div className="fixed inset-0 z-[100] pointer-events-auto">
      {/* Dark overlay backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-[2px] transition-opacity duration-300"
        onClick={handleComplete}
      />

      {/* Target Element Spotlight Ring */}
      {targetRect && (
        <div
          className="fixed border-2 border-emerald-400 rounded-2xl pointer-events-none shadow-[0_0_0_9999px_rgba(15,23,42,0.65)] transition-all duration-300 animate-pulse"
          style={{
            top: `${Math.max(0, targetRect.top - 6)}px`,
            left: `${Math.max(0, targetRect.left - 6)}px`,
            width: `${targetRect.width + 12}px`,
            height: `${targetRect.height + 12}px`,
          }}
        />
      )}

      {/* Floating Dialog Card */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-auto sm:top-auto sm:bottom-12 sm:left-1/2 sm:-translate-x-1/2 w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-[101] text-slate-900 dark:text-slate-100">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
              <Sparkles size={13} />
              {currentStep.badge}
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400 font-bold">
              Étape {activeStep + 1} sur {tourSteps.length}
            </span>
          </div>

          <button
            onClick={handleComplete}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 hover:text-slate-950 transition cursor-pointer"
            aria-label="Passer la visite"
          >
            <X size={18} />
          </button>
        </div>

        <h3 className="text-lg font-extrabold text-slate-950 dark:text-white tracking-tight mb-2">
          {currentStep.title}
        </h3>

        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
          {currentStep.description}
        </p>

        {/* Action Controls */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={handleComplete}
            className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition cursor-pointer"
          >
            Passer la visite
          </button>

          <div className="flex items-center gap-2">
            {activeStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Précédent</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-sm transition cursor-pointer"
            >
              <span>{activeStep === tourSteps.length - 1 ? "Terminer la visite 🎉" : "Suivant"}</span>
              {activeStep === tourSteps.length - 1 ? <Check size={14} /> : <ArrowRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
