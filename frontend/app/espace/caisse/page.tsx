"use client";

import React, { useEffect, useState } from "react";
import { ExpressPosModal } from "@/components/app/ExpressPosModal";
import { OfferItem } from "@/components/app/RegistersTable";
import { serviceIaFetch } from "@/lib/service-ia/api";
import {
  ShoppingBag,
  ArrowLeft,
  Wallet,
  ShieldCheck,
  Wifi,
  WifiOff,
  RefreshCw,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { saveCachedOffers, getCachedOffers } from "@/lib/offline/pos-db";
import { usePosOfflineSync } from "@/lib/offline/usePosOfflineSync";

export default function CaissePage() {
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [posOpen, setPosOpen] = useState(true);

  const { isOnline, pendingCount, isSyncing, syncNow } = usePosOfflineSync();

  const loadOffers = async () => {
    try {
      const data = await serviceIaFetch<OfferItem[]>("/registers/offers");
      setOffers(data);
      await saveCachedOffers(data);
    } catch {
      // Fallback to offline cached catalog in IndexedDB
      const cached = await getCachedOffers();
      if (cached && cached.length > 0) {
        setOffers(cached);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();

    // Register Service Worker for offline PWA capabilities
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return (
    <div className="cauri-finance-caisse p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <header className="cauri-caisse-header">
        <div className="cauri-caisse-intro">
          <div className="flex items-center gap-2">
            <span className="cauri-finance-eyebrow">
              <Wallet size={15} aria-hidden="true" /> FINANCES / CAISSE
            </span>

            {/* Offline / Online live indicator */}
            {isOnline ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                <Wifi size={12} className="text-emerald-600 shrink-0" />
                <span>En ligne</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse">
                <WifiOff size={12} className="text-amber-600 shrink-0" />
                <span>Hors-Ligne {pendingCount > 0 ? `(${pendingCount} en attente)` : ""}</span>
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white mt-1">
            Caisse Tactile &amp; Sonore
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Encaissement ultra-rapide au comptoir, décrémentation des stocks et synchronisation PWA
            automatique avec le Grand Siège.
          </p>
        </div>

        <div className="cauri-caisse-actions flex flex-wrap items-center gap-2">
          {pendingCount > 0 && isOnline && (
            <button
              type="button"
              onClick={() => syncNow()}
              disabled={isSyncing}
              className="px-3.5 py-2 min-h-[44px] rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center gap-2 shadow-sm cursor-pointer transition"
            >
              <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
              <span>{isSyncing ? "Synchronisation..." : `Synchroniser ${pendingCount} vente(s)`}</span>
            </button>
          )}

          <Link
            href="/espace/ventes"
            className="inline-flex items-center gap-2 min-h-[44px] px-3 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition"
          >
            <ArrowLeft size={16} />
            <span>Retour aux ventes</span>
          </Link>

          <Link
            href="/espace/finance"
            className="rounded-xl border border-emerald-600 px-3 py-2 min-h-[44px] text-xs font-bold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300 flex items-center"
          >
            Comptes &amp; mouvements
          </Link>

          <button
            onClick={() => setPosOpen(true)}
            className="inline-flex items-center gap-2 min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md transition cursor-pointer"
          >
            <ShoppingBag size={18} />
            <span>Ouvrir la caisse</span>
          </button>
        </div>
      </header>

      <div className="cauri-caisse-notice p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-400">
        <ShieldCheck size={18} className="text-emerald-600 shrink-0" aria-hidden="true" />
        <p>
          Moteur Caisse Offline-First activé. Vos ventes restent instantanées même lors des coupures
          Internet et se synchronisent automatiquement avec la mémoire comptable.
        </p>
      </div>

      <ExpressPosModal
        open={posOpen}
        offers={offers}
        onClose={() => setPosOpen(false)}
        onSaleCompleted={async () => {
          await loadOffers();
        }}
      />
    </div>
  );
}
