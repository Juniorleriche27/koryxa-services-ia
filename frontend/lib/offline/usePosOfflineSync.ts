"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getPendingSalesCount,
  syncOutboxSales,
  getPendingSales,
  PendingOfflineSale,
} from "./pos-db";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { posAudioHaptics } from "./pos-audio-haptics";

export function usePosOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [pendingSales, setPendingSales] = useState<PendingOfflineSale[]>([]);

  // Update online status and refresh outbox count
  const refreshOutbox = useCallback(async () => {
    try {
      const count = await getPendingSalesCount();
      const list = await getPendingSales();
      setPendingCount(count);
      setPendingSales(list);
    } catch {
      // Ignore
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (isSyncing) return { synced: 0, failed: 0 };
    setIsSyncing(true);

    try {
      const result = await syncOutboxSales(serviceIaFetch);
      if (result.synced > 0) {
        setLastSyncTime(new Date());
        posAudioHaptics.playAddProductSound();
      }
      await refreshOutbox();
      return result;
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshOutbox]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setIsOnline(navigator.onLine);
    refreshOutbox();

    const handleOnline = async () => {
      setIsOnline(true);
      posAudioHaptics.triggerHaptic("medium");
      // Auto-sync when coming back online
      const count = await getPendingSalesCount();
      if (count > 0) {
        await syncNow();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      posAudioHaptics.triggerHaptic("warning");
      posAudioHaptics.playWarningSound();
    };

    const handleOutboxUpdate = () => {
      refreshOutbox();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("cauri:pos-outbox-updated", handleOutboxUpdate);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("cauri:pos-outbox-updated", handleOutboxUpdate);
    };
  }, [refreshOutbox, syncNow]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    lastSyncTime,
    pendingSales,
    syncNow,
    refreshOutbox,
  };
}
