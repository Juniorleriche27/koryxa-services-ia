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
  RefreshCw,
  Monitor,
  MoreVertical,
} from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstaller() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(true);

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

    // 2. Platform Detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isAndroidDevice = /android/.test(userAgent);
    setIsIos(isIosDevice);
    setIsAndroid(isAndroidDevice);

    // 3. Register Service Worker with active background updates
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          // Check for updates on mount and on window focus
          registration.update().catch(() => {});

          const handleFocus = () => {
            registration.update().catch(() => {});
          };
          window.addEventListener("focus", handleFocus);

          // Periodic background check every 60s
          const interval = setInterval(() => {
            registration.update().catch(() => {});
          }, 60000);

          registration.addEventListener("updatefound", () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener("statechange", () => {
                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                  newWorker.postMessage({ type: "SKIP_WAITING" });
                  setUpdateAvailable(true);
                }
              });
            }
          });

          return () => {
            window.removeEventListener("focus", handleFocus);
            clearInterval(interval);
          };
        })
        .catch((err) => {
          console.warn("Service Worker registration failed:", err);
        });

      let refreshing = false;
      navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (!refreshing) {
          refreshing = true;
          setUpdateAvailable(true);
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
          <div className="bg-white/95 dark:bg-slate-900/95 border border-emerald-500/40 p-2.5 rounded-2xl shadow-xl backdrop-blur-xl flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-1 flex items-center justify-center shrink-0 shadow-xs">
                <img src="/icons/icon-192x192.png" alt="KORYXA" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0">
                <div className="text-[11.5px] font-extrabold text-slate-900 dark:text-white truncate">
                  Installer l&apos;application KORYXA
                </div>
                <div className="text-[10px] text-slate-600 dark:text-slate-300 truncate">
                  Accès 1-clic direct sur votre écran
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowModal(true)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs cursor-pointer transition"
              >
                Installer
              </button>
              <button
                type="button"
                onClick={dismissBanner}
                aria-label="Masquer le bandeau"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Update Notification Banner (Instant 1-click apply) */}
      {updateAvailable && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/50 backdrop-blur-xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <RefreshCw size={20} className="animate-spin" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-black tracking-tight text-white">
                  Mise à jour KORYXA disponible !
                </div>
                <p className="text-[11px] text-slate-300 truncate">
                  Nouvelles améliorations prêtes.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-md transition cursor-pointer"
              >
                Actualiser
              </button>
              <button
                type="button"
                onClick={() => setUpdateAvailable(false)}
                className="p-1.5 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pro Install Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-50 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative overflow-hidden">
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>

            {/* Header branding */}
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg p-2.5 shrink-0">
                <img src="/icons/icon-192x192.png" alt="KORYXA" className="w-full h-full object-contain" />
              </div>
              <div>
                <span className="text-[11px] uppercase font-black tracking-wider text-emerald-600 dark:text-emerald-400">
                  Application Officielle
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Installer KORYXA
                </h3>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mb-5 leading-relaxed">
              Installez KORYXA sur votre smartphone ou sur votre ordinateur (Windows / Mac) pour une expérience logicielle fluide, ultra-rapide et sécurisée.
            </p>

            {/* Feature points with clean high-contrast styling */}
            <div className="space-y-2.5 mb-5 bg-emerald-50/70 dark:bg-slate-800/80 p-4 rounded-2xl border border-emerald-100 dark:border-slate-700/80">
              <div className="flex items-center gap-3 text-xs font-bold text-slate-800 dark:text-slate-100">
                <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Icône directe sur votre écran d&apos;accueil ou bureau</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-slate-800 dark:text-slate-100">
                <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Mises à jour 100% automatiques et instantanées</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold text-slate-800 dark:text-slate-100">
                <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Plein écran sans barre de navigateur &amp; réactivité maximale</span>
              </div>
            </div>

            {/* Platform-specific Actions */}
            {deferredPrompt ? (
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/25 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download size={18} />
                  <span>Installer maintenant sur cet appareil</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition cursor-pointer"
                >
                  Fermer
                </button>
              </div>
            ) : isIos ? (
              <div className="space-y-3">
                <div className="space-y-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs">
                  <div className="font-black flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                    <Smartphone size={16} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Installation sur iPhone / iPad (Safari) :</span>
                  </div>
                  <ol className="space-y-2 list-decimal list-inside text-slate-700 dark:text-emerald-100 font-medium pl-1">
                    <li>
                      Appuyez sur le bouton <strong className="font-bold text-slate-900 dark:text-white">Partager</strong> <Share size={13} className="inline text-emerald-600 dark:text-emerald-400 mx-1" /> en bas de l&apos;écran Safari.
                    </li>
                    <li>
                      Faites défiler et appuyez sur <strong className="font-bold text-slate-900 dark:text-white">Sur l&apos;écran d&apos;accueil</strong> <PlusSquare size={13} className="inline text-emerald-600 dark:text-emerald-400 mx-1" />.
                    </li>
                    <li>
                      Appuyez sur <strong className="font-bold text-slate-900 dark:text-white">Ajouter</strong> en haut à droite.
                    </li>
                  </ol>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wide shadow-md shadow-emerald-900/20 active:scale-[0.99] transition cursor-pointer"
                >
                  J&apos;ai compris
                </button>
              </div>
            ) : isAndroid ? (
              <div className="space-y-3">
                <div className="space-y-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs">
                  <div className="font-black flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
                    <Smartphone size={16} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Installation sur Android (Chrome / Samsung) :</span>
                  </div>
                  <ol className="space-y-2 list-decimal list-inside text-slate-700 dark:text-emerald-100 font-medium pl-1">
                    <li>
                      Appuyez sur le menu <MoreVertical size={14} className="inline text-emerald-600 dark:text-emerald-400 mx-0.5" /> (les 3 points en haut à droite du navigateur).
                    </li>
                    <li>
                      Sélectionnez <strong className="font-bold text-slate-900 dark:text-white">« Installer l&apos;application »</strong> ou <strong className="font-bold text-slate-900 dark:text-white">« Ajouter à l&apos;écran d&apos;accueil »</strong>.
                    </li>
                    <li>
                      Confirmez en appuyant sur <strong className="font-bold text-slate-900 dark:text-white">Installer</strong>.
                    </li>
                  </ol>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wide shadow-md shadow-emerald-900/20 active:scale-[0.99] transition cursor-pointer"
                >
                  J&apos;ai compris
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 leading-relaxed space-y-2">
                  <div className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Monitor size={15} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Sur ordinateur (Chrome / Edge / Brave / Safari) :</span>
                  </div>
                  <p>
                    Cliquez sur l&apos;icône <strong className="font-bold text-slate-900 dark:text-white">Installer l&apos;application</strong> <Download size={14} className="inline text-emerald-600 dark:text-emerald-400 mx-1" /> située à droite dans la barre d&apos;adresse de votre navigateur, ou dans le menu des 3 points.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wide shadow-md shadow-emerald-900/20 active:scale-[0.99] transition cursor-pointer"
                >
                  J&apos;ai compris
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
