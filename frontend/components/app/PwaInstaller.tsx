"use client";

import { useState, useEffect } from "react";
import {
  Download,
  Smartphone,
  CheckCircle2,
  X,
  Share,
  PlusSquare,
  Zap,
  Sparkles,
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(true); // Default true until checked

  useEffect(() => {
    // 1. Detect standalone mode
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes("android-app://");
    setIsStandalone(isStandaloneMode);

    // Check banner dismissed in localStorage
    const dismissed = window.localStorage.getItem("koryxa:pwa-banner-dismissed") === "true";
    setBannerDismissed(dismissed);

    // 2. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // 3. Register Service Worker with instant auto-update
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  setUpdateAvailable(true);
                  setTimeout(() => setUpdateAvailable(false), 6000);
                }
              });
            }
          });
        })
        .catch((err) => {
          console.warn("Service Worker registration failed:", err);
        });

      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          setUpdateAvailable(true);
          setTimeout(() => setUpdateAvailable(false), 5000);
        }
      });
    }

    // 4. Capture native beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // 5. Custom event to open modal from anywhere in the app
    const handleOpenModal = () => setShowModal(true);
    window.addEventListener("koryxa:open-install-pwa", handleOpenModal);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("koryxa:open-install-pwa", handleOpenModal);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
        setShowModal(false);
        setBannerDismissed(true);
        window.localStorage.setItem("koryxa:pwa-banner-dismissed", "true");
      }
    } else {
      setShowModal(true);
    }
  };

  const dismissBanner = () => {
    setBannerDismissed(true);
    window.localStorage.setItem("koryxa:pwa-banner-dismissed", "true");
  };

  return (
    <>
      {/* Mobile Floating Install Banner (Hidden if installed or dismissed) */}
      {!isStandalone && !bannerDismissed && (
        <div className="fixed top-2 left-2 right-2 sm:hidden z-40 animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="bg-card/95 border border-emerald-500/30 p-2.5 rounded-2xl shadow-xl backdrop-blur-xl flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-1 flex items-center justify-center shrink-0 shadow-xs">
                <img src="/icons/icon-192x192.png" alt="KORYXA" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0">
                <div className="text-[11.5px] font-black text-foreground truncate">
                  Installer l'application KORYXA
                </div>
                <div className="text-[10px] text-muted-foreground truncate">
                  Acc�s 1-clic direct sur votre �cran
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-xs cursor-pointer"
              >
                Installer
              </button>
              <button
                type="button"
                onClick={dismissBanner}
                aria-label="Masquer le bandeau"
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Update Toast Notification */}
      {updateAvailable && (
        <div className="fixed top-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 p-4 rounded-2xl shadow-2xl border border-emerald-500/40 backdrop-blur-xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 dark:text-emerald-600 flex items-center justify-center shrink-0">
              <Zap size={20} className="animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-black tracking-tight">Mise � jour KORYXA appliqu�e</div>
              <p className="text-[11px] text-slate-300 dark:text-slate-600 truncate">
                Vos �crans et donn�es sont synchronis�s avec la derni�re version.
              </p>
            </div>
            <button
              onClick={() => setUpdateAvailable(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white dark:hover:text-slate-950 transition cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Pro Install Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-card border border-border/80 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative overflow-hidden">
            {/* Header branding */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition cursor-pointer"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg p-2.5 shrink-0">
                <img src="/icons/icon-192x192.png" alt="KORYXA" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="text-[11px] uppercase font-black tracking-wider text-emerald-700 dark:text-emerald-400">
                  Application Officielle
                </span>
                <h3 className="text-xl font-black text-foreground tracking-tight">
                  Installer KORYXA
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground mb-6 leading-relaxed">
              Installez KORYXA sur votre bureau d'ordinateur (Windows / Mac) ou sur votre smartphone pour une exp�rience logicielle native, ultra-rapide et s�curis�e.
            </p>

            {/* Feature points */}
            <div className="space-y-3 mb-6 bg-muted/40 p-4 rounded-2xl border border-border/60">
              <div className="flex items-center gap-3 text-xs font-bold text-foreground">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Ic�ne directe sur votre �cran d'accueil ou bureau</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-foreground">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Mises � jour 100% automatiques sans r�installation</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-foreground">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>Plein �cran sans barre de navigateur & r�activit� maximale</span>
              </div>
            </div>

            {/* Actions based on platform */}
            {isIos ? (
              <div className="space-y-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-200 text-xs">
                <div className="font-bold flex items-center gap-2">
                  <Smartphone size={16} className="text-emerald-600" />
                  <span>Installation sur iPhone / iPad (Safari) :</span>
                </div>
                <ol className="space-y-1.5 list-decimal list-inside text-muted-foreground dark:text-emerald-300/80 font-medium pl-1">
                  <li>
                    Appuyez sur le bouton <strong>Partager</strong> <Share size={13} className="inline text-emerald-600" /> dans la barre de Safari.
                  </li>
                  <li>
                    Faites d�filer vers le bas et appuyez sur <strong>Sur l'�cran d'accueil</strong> <PlusSquare size={13} className="inline text-emerald-600" />.
                  </li>
                  <li>Appuyez sur <strong>Ajouter</strong> en haut � droite.</li>
                </ol>
              </div>
            ) : deferredPrompt ? (
              <button
                type="button"
                onClick={handleInstallClick}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-sm shadow-xl shadow-emerald-600/30 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download size={18} />
                <span>Installer maintenant sur cet appareil</span>
              </button>
            ) : (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-muted/60 border border-border text-xs text-muted-foreground leading-relaxed">
                  <strong>Sur ordinateur (Chrome / Edge / Brave / Safari) :</strong>
                  <p className="mt-1">
                    Cliquez sur l'ic�ne <strong>Installer l'application</strong> <Download size={14} className="inline text-emerald-600" /> situ�e � droite dans la barre d'adresse de votre navigateur, ou dans le menu des 3 points.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full py-3 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs cursor-pointer"
                >
                  J'ai compris
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
