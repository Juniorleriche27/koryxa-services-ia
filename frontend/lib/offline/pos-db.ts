/**
 * IndexedDB Offline-First Storage Engine for CAURI Caisse (POS).
 * Stores product catalog offers and queues sales in an offline outbox
 * when network is disconnected or unstable.
 */

import { OfferItem } from "@/components/app/RegistersTable";

const DB_NAME = "cauri_pos_offline_db";
const DB_VERSION = 1;

export interface PendingOfflineSale {
  tempId: string;
  offlineReference: string;
  payload: any;
  cartItems: any[];
  totalAmount: number;
  currency: string;
  paymentMethod: string;
  clientName: string;
  createdAt: string;
  syncStatus: "pending" | "syncing" | "synced" | "failed";
  errorMessage?: string | null;
  retryCount: number;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not available in this environment."));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Offers store (Product catalog cache)
      if (!db.objectStoreNames.contains("offers")) {
        const offersStore = db.createObjectStore("offers", { keyPath: "id" });
        offersStore.createIndex("category", "category", { unique: false });
        offersStore.createIndex("name", "name", { unique: false });
      }

      // 2. Sales Outbox (Pending offline transactions)
      if (!db.objectStoreNames.contains("sales_outbox")) {
        const outboxStore = db.createObjectStore("sales_outbox", { keyPath: "tempId" });
        outboxStore.createIndex("syncStatus", "syncStatus", { unique: false });
        outboxStore.createIndex("createdAt", "createdAt", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Cache product catalog offers in IndexedDB for instant offline search.
 */
export async function saveCachedOffers(offers: OfferItem[]): Promise<void> {
  if (typeof window === "undefined" || !window.indexedDB) return;
  try {
    const db = await openDatabase();
    const tx = db.transaction("offers", "readwrite");
    const store = tx.objectStore("offers");

    // Clear existing cache and replace with fresh data
    store.clear();
    offers.forEach((offer) => {
      if (offer && offer.id) {
        store.put(offer);
      }
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Graceful fallback if storage quota exceeded or disabled
  }
}

/**
 * Retrieve cached offers from IndexedDB.
 */
export async function getCachedOffers(): Promise<OfferItem[]> {
  if (typeof window === "undefined" || !window.indexedDB) return [];
  try {
    const db = await openDatabase();
    const tx = db.transaction("offers", "readonly");
    const store = tx.objectStore("offers");
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => resolve((request.result as OfferItem[]) || []);
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Queue a sale in the offline outbox when network is absent or unstable.
 */
export async function enqueueOfflineSale(
  payload: any,
  cartItems: any[]
): Promise<PendingOfflineSale> {
  const tempId = `off_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const counter = Math.floor(1000 + Math.random() * 9000);
  const offlineReference = `REC-OFF-${counter}`;

  const pendingSale: PendingOfflineSale = {
    tempId,
    offlineReference,
    payload: {
      ...payload,
      reference: offlineReference,
    },
    cartItems,
    totalAmount: Number(payload.total_amount) || 0,
    currency: payload.currency || "XOF",
    paymentMethod: payload.payment_method || "cash",
    clientName: payload.client_name || "Client Comptoir",
    createdAt: new Date().toISOString(),
    syncStatus: "pending",
    retryCount: 0,
  };

  if (typeof window === "undefined" || !window.indexedDB) {
    return pendingSale;
  }

  try {
    const db = await openDatabase();
    const tx = db.transaction("sales_outbox", "readwrite");
    const store = tx.objectStore("sales_outbox");
    store.put(pendingSale);

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    // Notify other components
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cauri:pos-outbox-updated"));
    }
  } catch {
    // If IndexedDB fails, in-memory object is still returned
  }

  return pendingSale;
}

/**
 * Get all pending sales in the outbox.
 */
export async function getPendingSales(): Promise<PendingOfflineSale[]> {
  if (typeof window === "undefined" || !window.indexedDB) return [];
  try {
    const db = await openDatabase();
    const tx = db.transaction("sales_outbox", "readonly");
    const store = tx.objectStore("sales_outbox");
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const all = (request.result as PendingOfflineSale[]) || [];
        resolve(all.filter((s) => s.syncStatus !== "synced"));
      };
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Count how many sales are waiting in the outbox.
 */
export async function getPendingSalesCount(): Promise<number> {
  const sales = await getPendingSales();
  return sales.length;
}

/**
 * Remove or mark an outbox sale as synced after successful server confirmation.
 */
export async function removePendingSale(tempId: string): Promise<void> {
  if (typeof window === "undefined" || !window.indexedDB) return;
  try {
    const db = await openDatabase();
    const tx = db.transaction("sales_outbox", "readwrite");
    const store = tx.objectStore("sales_outbox");
    store.delete(tempId);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("cauri:pos-outbox-updated"));
        }
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Ignore
  }
}

/**
 * Replay and synchronize all pending offline sales to the backend.
 */
export async function syncOutboxSales(
  apiCaller: (path: string, init: any) => Promise<any>
): Promise<{ synced: number; failed: number }> {
  const pending = await getPendingSales();
  if (pending.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const sale of pending) {
    try {
      // Re-submit to the standard backend register endpoint
      await apiCaller("/registers/sales", {
        method: "POST",
        body: JSON.stringify(sale.payload),
      });

      // Remove from outbox once persisted on server
      await removePendingSale(sale.tempId);
      synced += 1;
    } catch {
      failed += 1;
    }
  }

  if (synced > 0 && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("koryxa:record-created"));
    window.dispatchEvent(new CustomEvent("cauri:sales-synced", { detail: { synced } }));
  }

  return { synced, failed };
}
