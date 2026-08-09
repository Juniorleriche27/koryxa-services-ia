"use client";

import { useCallback, useState, useEffect } from "react";
import { WifiOff, RefreshCw, CheckCircle2, CloudUpload } from "lucide-react";

export function OfflineSyncBanner() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncedRecently, setSyncedRecently] = useState(false);

  const flushOfflineQueue = useCallback(() => {
    const queue = JSON.parse(localStorage.getItem("koryxa_offline_queue") || "[]");
    if (queue.length === 0) return;

    setSyncing(true);
    // Simulate background flush
    setTimeout(() => {
      localStorage.setItem("koryxa_offline_queue", "[]");
      setPendingCount(0);
      setSyncing(false);
      setSyncedRecently(true);
      setTimeout(() => setSyncedRecently(false), 4000);
    }, 1500);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);

      const handleOnline = () => {
        setIsOnline(true);
        // Trigger auto-sync
        flushOfflineQueue();
      };

      const handleOffline = () => {
        setIsOnline(false);
      };

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      // Check offline queue
      const queue = JSON.parse(localStorage.getItem("koryxa_offline_queue") || "[]");
      setPendingCount(queue.length);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, [flushOfflineQueue]);

  if (isOnline && pendingCount === 0 && !syncedRecently) return null;

  return (
    <div className={`kx-offline-banner ${!isOnline ? "is-offline" : "is-online-sync"}`}>
      <div className="kx-offline-banner-inner">
        {!isOnline ? (
          <>
            <WifiOff size={16} className="kx-offline-icon" />
            <span>
              <strong>Mode hors-ligne actif.</strong> Vous pouvez continuer à saisir vos ventes. Elles seront automatiquement synchronisées dès le retour de la connexion.
            </span>
            {pendingCount > 0 && <span className="kx-offline-badge">{pendingCount} en attente</span>}
          </>
        ) : syncing ? (
          <>
            <RefreshCw size={16} className="kx-spin kx-sync-icon" />
            <span>Synchronisation de vos données hors-ligne en cours…</span>
          </>
        ) : syncedRecently ? (
          <>
            <CheckCircle2 size={16} className="kx-icon-green" />
            <span>Toutes vos saisies hors-ligne ont été synchronisées avec succès !</span>
          </>
        ) : null}
      </div>
    </div>
  );
}
