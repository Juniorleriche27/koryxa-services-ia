"use client";
import { useI18n } from "@/lib/i18n";

import React, { useState, useMemo, useEffect } from "react";
import {
  ShoppingBag,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Printer,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  RotateCcw,
  CircleHelp,
  Receipt,
  User,
  Package,
  ArrowRight,
  Zap,
  Wifi,
  WifiOff,
  RefreshCw,
  Volume2,
  VolumeX,
  Share2,
  ShieldCheck,
} from "lucide-react";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { OfferItem, formatMoney } from "./RegistersTable";
import { usePosOfflineSync } from "@/lib/offline/usePosOfflineSync";
import { posAudioHaptics } from "@/lib/offline/pos-audio-haptics";
import { enqueueOfflineSale } from "@/lib/offline/pos-db";
import { PosVoiceCockpit } from "@/components/voice/PosVoiceCockpit";
import { Mic } from "lucide-react";

interface ExpressPosModalProps {
  open: boolean;
  offers: OfferItem[];
  currency?: string;
  onClose: () => void;
  onSaleCompleted?: () => Promise<void>;
}

interface CartItem {
  offer: OfferItem;
  quantity: number;
  unitPrice: number;
}

const PAYMENT_METHODS = [
  { id: "cash", label: "Espèces", icon: Banknote, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10" },
  { id: "wave", label: "Wave", icon: Smartphone, color: "text-sky-600 dark:text-sky-400 bg-sky-500/10" },
  { id: "orange_money", label: "Orange Money", icon: Smartphone, color: "text-orange-600 dark:text-orange-400 bg-orange-500/10" },
  { id: "mtn_momo", label: "MTN MoMo", icon: Smartphone, color: "text-amber-600 dark:text-amber-400 bg-amber-500/10" },
  { id: "card", label: "Carte Bancaire", icon: CreditCard, color: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10" },
];

export function ExpressPosModal({
  open,
  offers,
  currency = "XOF",
  onClose,
  onSaleCompleted,
}: ExpressPosModalProps) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clientName, setClientName] = useState("Client Comptoir");
  const [clientPhone, setClientPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [busy, setBusy] = useState(false);
  const [lastSaleResult, setLastSaleResult] = useState<any | null>(null);
  const [mobileTab, setMobileTab] = useState<"catalog" | "cart">("catalog");
  const [soundActive, setSoundActive] = useState(true);
  const [voiceCockpitOpen, setVoiceCockpitOpen] = useState(false);

  const handleVoiceApplyItems = (data: {
    items: Array<{ name: string; quantity: number; unitPrice: number }>;
    clientName?: string;
    paymentMethod?: string;
  }) => {
    if (data.clientName) setClientName(data.clientName);
    if (data.paymentMethod) setPaymentMethod(data.paymentMethod);

    setCart((prev) => {
      const nextCart = [...prev];
      for (const item of data.items) {
        const existingOffer = safeOffers.find(
          (o) => o.name.toLowerCase() === item.name.toLowerCase()
        );
        const offer: OfferItem = existingOffer || {
          id: `custom-voice-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: item.name,
          price: String(item.unitPrice),
          currency: currency,
          category: "Dictée Vocale",
          status: "active",
          updated_at: new Date().toISOString(),
        };

        const idx = nextCart.findIndex(
          (c) => c.offer.name.toLowerCase() === item.name.toLowerCase()
        );
        if (idx >= 0) {
          nextCart[idx] = {
            ...nextCart[idx],
            quantity: nextCart[idx].quantity + item.quantity,
          };
        } else {
          nextCart.push({
            offer,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          });
        }
      }
      return nextCart;
    });
  };

  // Offline-first sync hook
  const { isOnline, pendingCount, isSyncing, syncNow } = usePosOfflineSync();

  // Custom free-sale item fields
  const [customItemName, setCustomItemName] = useState("");
  const [customItemPrice, setCustomItemPrice] = useState("");
  const [customItemQty, setCustomItemQty] = useState("1");

  useEffect(() => {
    setSoundActive(posAudioHaptics.isSoundEnabled());
  }, []);

  const handleToggleSound = () => {
    const next = !soundActive;
    setSoundActive(next);
    posAudioHaptics.setSoundEnabled(next);
    if (next) {
      posAudioHaptics.playTapSound();
    }
  };

  // Ensure safe offers array even if backend returns paginated object
  const safeOffers: OfferItem[] = useMemo(() => {
    if (Array.isArray(offers)) return offers;
    if (offers && typeof offers === "object" && Array.isArray((offers as any).items)) {
      return (offers as any).items;
    }
    return [];
  }, [offers]);

  // Extract categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    safeOffers.forEach((o) => {
      if (o.category) set.add(o.category);
    });
    return ["all", ...Array.from(set)];
  }, [safeOffers]);

  // Filtered offers by query and category
  const filteredOffers = useMemo(() => {
    return safeOffers.filter((o) => {
      if (selectedCategory !== "all" && o.category !== selectedCategory) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        o.name.toLowerCase().includes(q) ||
        (o.category || "").toLowerCase().includes(q) ||
        (o.description || "").toLowerCase().includes(q)
      );
    });
  }, [safeOffers, search, selectedCategory]);

  // Totals calculations
  const rawSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    return (rawSubtotal * discountPercent) / 100;
  }, [rawSubtotal, discountPercent]);

  const totalAmount = useMemo(() => {
    return Math.max(0, rawSubtotal - discountAmount);
  }, [rawSubtotal, discountAmount]);

  const changeToReturn = useMemo(() => {
    const received = parseFloat(amountReceived) || 0;
    if (received <= 0 || received < totalAmount) return 0;
    return received - totalAmount;
  }, [amountReceived, totalAmount]);

  const totalCartCount = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.quantity, 0);
  }, [cart]);

  // Banknotes presets by currency
  const banknotePresets = useMemo(() => {
    if (currency === "XOF" || currency === "XAF") {
      return [500, 1000, 2000, 5000, 10000];
    }
    if (currency === "EUR") {
      return [5, 10, 20, 50, 100];
    }
    return [1000, 2000, 5000, 10000, 20000, 50000];
  }, [currency]);

  // Cart operations with audio-tactile feedback
  const addToCart = (offer: OfferItem) => {
    const price = parseFloat(offer.price || "0") || 0;
    posAudioHaptics.playAddProductSound();
    posAudioHaptics.triggerHaptic("light");

    setCart((prev) => {
      const idx = prev.findIndex((item) => item.offer.id === offer.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { offer, quantity: 1, unitPrice: price }];
    });
  };

  const addCustomItemToCart = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const name = customItemName.trim() || "Article libre";
    const price = parseFloat(customItemPrice) || 0;
    const qty = parseFloat(customItemQty) || 1;

    if (price <= 0) {
      posAudioHaptics.playWarningSound();
      posAudioHaptics.triggerHaptic("warning");
      alert("Veuillez saisir un prix valide supérieur à 0.");
      return;
    }

    posAudioHaptics.playAddProductSound();
    posAudioHaptics.triggerHaptic("light");

    const customOffer: OfferItem = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: name,
      price: String(price),
      currency: currency,
      category: "Vente libre",
      status: "active",
      updated_at: new Date().toISOString(),
    };

    setCart((prev) => [...prev, { offer: customOffer, quantity: qty, unitPrice: price }]);
    setCustomItemName("");
    setCustomItemPrice("");
    setCustomItemQty("1");
  };

  const updateQuantity = (offerId: string, delta: number) => {
    posAudioHaptics.playTapSound();
    posAudioHaptics.triggerHaptic("light");

    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.offer.id === offerId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (offerId: string) => {
    posAudioHaptics.playTapSound();
    posAudioHaptics.triggerHaptic("medium");
    setCart((prev) => prev.filter((item) => item.offer.id !== offerId));
  };

  const clearCart = () => {
    posAudioHaptics.playTapSound();
    posAudioHaptics.triggerHaptic("light");
    setCart([]);
    setAmountReceived("");
    setDiscountPercent(0);
    setLastSaleResult(null);
    setMobileTab("catalog");
  };

  // Cash preset actions
  const handleCashPreset = (amount: number) => {
    posAudioHaptics.playTapSound();
    posAudioHaptics.triggerHaptic("light");
    setAmountReceived(String(amount));
  };

  const handleCashExact = () => {
    posAudioHaptics.playTapSound();
    posAudioHaptics.triggerHaptic("light");
    setAmountReceived(String(totalAmount));
  };

  const handleCashAdd = (increment: number) => {
    posAudioHaptics.playTapSound();
    posAudioHaptics.triggerHaptic("light");
    const current = parseFloat(amountReceived) || 0;
    setAmountReceived(String(current + increment));
  };

  // Submit sale (Offline-First resilient flow)
  const handleValidateSale = async () => {
    if (cart.length === 0) {
      posAudioHaptics.playWarningSound();
      posAudioHaptics.triggerHaptic("warning");
      alert("Veuillez ajouter au moins un produit au panier.");
      return;
    }

    const receivedNum = parseFloat(amountReceived) || 0;
    if (paymentMethod === "cash" && receivedNum > 0 && receivedNum < totalAmount) {
      posAudioHaptics.playWarningSound();
      posAudioHaptics.triggerHaptic("warning");
      alert("Le montant reçu en espèces est inférieur au total à payer.");
      return;
    }

    const cleanPhone = clientPhone.trim();
    if (cleanPhone && !cleanPhone.startsWith("+") && !cleanPhone.startsWith("00")) {
      posAudioHaptics.playWarningSound();
      posAudioHaptics.triggerHaptic("warning");
      alert(
        "Le numéro WhatsApp doit obligatoirement inclure l'indicatif international du pays avec '+' (ex: +225..., +33..., +221...)."
      );
      return;
    }

    setBusy(true);

    const itemLabelSummary =
      cart.length === 1
        ? cart[0].offer.name
        : `${cart[0].offer.name} + ${cart.length - 1} autre(s) article(s)`;

    const payload = {
      document_type: "receipt",
      sale_date: new Date().toISOString().slice(0, 10),
      client_name: clientName.trim() || "Client Comptoir",
      client_phone: clientPhone.trim() || null,
      item_label: itemLabelSummary,
      offer_id: cart.length === 1 && !cart[0].offer.id.startsWith("custom-") ? cart[0].offer.id : null,
      quantity: cart.length === 1 ? cart[0].quantity : 1,
      unit_price: cart.length === 1 ? cart[0].unitPrice : totalAmount,
      discount: discountAmount,
      total_amount: totalAmount,
      paid_amount: totalAmount,
      currency: currency,
      payment_method: paymentMethod,
      payment_status: "paid",
      sales_channel: "Caisse Tactile POS",
      comment: `Vente caisse tactile (${cart.map((c) => `${c.quantity}x ${c.offer.name}`).join(", ")})`,
      status: "validated",
    };

    // 1. If currently offline: Save to IndexedDB outbox directly
    if (!isOnline) {
      try {
        const offlineSale = await enqueueOfflineSale(payload, cart);
        posAudioHaptics.playCashDrawerSound();
        posAudioHaptics.triggerHaptic("success");

        setLastSaleResult({
          ...payload,
          isOffline: true,
          reference: offlineSale.offlineReference,
          cartItems: [...cart],
          changeToReturn,
          receivedNum,
          totalAmount,
        });

        window.dispatchEvent(new CustomEvent("koryxa:record-created"));
        if (onSaleCompleted) await onSaleCompleted();
      } catch (err: any) {
        alert(err.message || "Erreur lors de l'enregistrement hors-ligne");
      } finally {
        setBusy(false);
      }
      return;
    }

    // 2. If online: Attempt direct server write, fall back to offline outbox if network drops
    try {
      const result = await serviceIaFetch<any>("/registers/sales", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      posAudioHaptics.playCashDrawerSound();
      posAudioHaptics.triggerHaptic("success");

      window.dispatchEvent(new CustomEvent("koryxa:record-created"));
      if (onSaleCompleted) await onSaleCompleted();

      setLastSaleResult({
        ...result,
        isOffline: false,
        cartItems: [...cart],
        changeToReturn,
        receivedNum,
        totalAmount,
      });
    } catch (err: any) {
      // Network failure or backend timeout: save offline transparently
      try {
        const offlineSale = await enqueueOfflineSale(payload, cart);
        posAudioHaptics.playCashDrawerSound();
        posAudioHaptics.triggerHaptic("success");

        setLastSaleResult({
          ...payload,
          isOffline: true,
          reference: offlineSale.offlineReference,
          cartItems: [...cart],
          changeToReturn,
          receivedNum,
          totalAmount,
        });

        window.dispatchEvent(new CustomEvent("koryxa:record-created"));
        if (onSaleCompleted) await onSaleCompleted();
      } catch (offlineErr: any) {
        alert(offlineErr.message || "Échec de l'encaissement");
      }
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/70 backdrop-blur-md">
      <div className="w-full max-w-6xl h-[94vh] bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 relative">
        {/* POS Header */}
        <header className="px-4 sm:px-6 py-3 border-b border-border flex items-center justify-between bg-muted/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-xs">
              <ShoppingBag size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-foreground">
                  Caisse Tactile &amp; Sonore
                </h2>

                {/* Connectivity & Sync status badge */}
                {isOnline ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[10px] font-black border border-emerald-300 dark:border-emerald-800">
                    <Wifi size={11} className="text-emerald-600" />
                    <span>EN LIGNE</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-black border border-amber-300 dark:border-amber-800 animate-pulse">
                    <WifiOff size={11} className="text-amber-600" />
                    <span>HORS-LIGNE</span>
                  </span>
                )}

                {pendingCount > 0 && (
                  <button
                    type="button"
                    onClick={() => syncNow()}
                    disabled={isSyncing || !isOnline}
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-[10px] font-black cursor-pointer transition shadow-xs"
                    title="Synchroniser les ventes en attente"
                  >
                    <RefreshCw size={10} className={isSyncing ? "animate-spin" : ""} />
                    <span>{isSyncing ? "Sync..." : `${pendingCount} à synchroniser`}</span>
                  </button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                Encaissement comptoir instantané, calcul de monnaie et synchronisation PWA.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Voice Dictation Cockpit Button */}
            <button
              type="button"
              onClick={() => setVoiceCockpitOpen(true)}
              className="px-3 py-2 min-h-[44px] rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100 text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Dicter une vente vocalement"
            >
              <Mic size={15} className="text-red-600" />
              <span className="hidden sm:inline">Dictée Vocale</span>
            </button>

            {/* Audio Toggle Button */}
            <button
              type="button"
              onClick={handleToggleSound}
              className={`p-2 min-h-[44px] min-w-[44px] rounded-xl border text-xs font-bold transition flex items-center justify-center cursor-pointer ${
                soundActive
                  ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
              title={soundActive ? "Son caisse activé (cliquer pour couper)" : "Son caisse coupé"}
            >
              {soundActive ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            <button
              type="button"
              onClick={clearCart}
              className="px-3.5 py-2 min-h-[44px] rounded-xl border border-border text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">Nouveau Ticket</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 min-h-[44px] min-w-[44px] rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition grid place-items-center cursor-pointer"
              aria-label="Fermer la caisse"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Mobile Tab Switcher (< lg) */}
        {!lastSaleResult && (
          <div className="lg:hidden flex items-center p-1.5 bg-muted/60 border-b border-border shrink-0">
            <button
              type="button"
              onClick={() => setMobileTab("catalog")}
              className={`flex-1 py-2.5 min-h-[44px] text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 ${
                mobileTab === "catalog"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground"
              }`}
            >
              <Package size={14} />
              <span>Articles ({filteredOffers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("cart")}
              className={`flex-1 py-2.5 min-h-[44px] text-xs font-black rounded-xl transition flex items-center justify-center gap-1.5 ${
                mobileTab === "cart"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-muted-foreground"
              }`}
            >
              <ShoppingBag size={14} />
              <span>Panier ({totalCartCount}) · {formatMoney(totalAmount, currency)}</span>
            </button>
          </div>
        )}

        {/* Main Body */}
        {lastSaleResult ? (
          /* Sale Success & Receipt View */
          <div className="flex-1 p-6 sm:p-8 flex flex-col items-center justify-center text-center bg-card overflow-y-auto">
            <div className="p-4 rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4 animate-in zoom-in-75 duration-300">
              <CheckCircle2 size={52} />
            </div>

            <h3 className="text-xl sm:text-2xl font-black text-foreground mb-1">
              Encaissement Validé !
            </h3>

            {lastSaleResult.isOffline ? (
              <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300 text-xs font-black">
                <WifiOff size={13} />
                <span>Enregistré en mode hors-ligne · Sync automatique dès connexion</span>
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-muted-foreground mb-4">
                Réf : <strong className="text-foreground">{lastSaleResult.reference || "VTE-EXPRESS"}</strong> ·
                Règlement : <strong>{lastSaleResult.payment_method?.toUpperCase()}</strong>
              </p>
            )}

            {/* Receipt Summary Card */}
            <div className="w-full max-w-md p-5 rounded-2xl border border-border bg-muted/30 text-left space-y-2.5 mb-6 text-xs sm:text-sm">
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">Client</span>
                <strong className="text-foreground">{clientName || "Client Comptoir"}</strong>
              </div>

              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">Total Encaissé</span>
                <strong className="font-mono text-base text-foreground font-black">
                  {formatMoney(lastSaleResult.totalAmount, currency)}
                </strong>
              </div>

              {lastSaleResult.receivedNum > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Montant Reçu</span>
                    <span className="font-mono font-bold">{formatMoney(lastSaleResult.receivedNum, currency)}</span>
                  </div>
                  <div className="flex justify-between items-center font-black text-emerald-600 dark:text-emerald-400 pt-1.5 border-t border-border/60">
                    <span className="text-xs uppercase tracking-wider">Monnaie Rendue :</span>
                    <span className="font-mono text-base sm:text-lg">
                      {formatMoney(lastSaleResult.changeToReturn, currency)}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => {
                  const cleanPhone = (clientPhone || "").replace(/[^0-9]/g, "");
                  const lines = [
                    `🧾 *TICKET DE CAISSE / REÇU D'ENCAISSEMENT*`,
                    `📄 Réf : *${lastSaleResult?.reference || "Comptoir"}*`,
                    `📅 Date : ${new Date().toLocaleDateString("fr-FR")}`,
                    `👤 Client : *${clientName || "Client Comptoir"}*`,
                    `💰 Montant réglé : *${formatMoney(lastSaleResult?.totalAmount || 0, currency)}* (${paymentMethod.toUpperCase()})`,
                  ];
                  if (lastSaleResult?.changeToReturn > 0) {
                    lines.push(`💵 Monnaie rendue : ${formatMoney(lastSaleResult.changeToReturn, currency)}`);
                  }
                  lines.push(`\nMerci pour votre achat et à très bientôt !`);
                  const text = lines.join("\n");
                  const baseUrl = cleanPhone
                    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=`
                    : `https://api.whatsapp.com/send?text=`;
                  window.open(`${baseUrl}${encodeURIComponent(text)}`, "_blank");
                }}
                className="px-4 py-2.5 min-h-[44px] rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-bold hover:bg-emerald-100 transition flex items-center gap-2 cursor-pointer"
              >
                <Share2 size={15} />
                <span>WhatsApp Ticket</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2.5 min-h-[44px] rounded-xl border border-border bg-muted hover:bg-muted/80 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer"
              >
                <Printer size={15} />
                <span>Imprimer Ticket</span>
              </button>

              <button
                type="button"
                onClick={clearCart}
                className="px-5 py-2.5 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm transition flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Plus size={16} />
                <span>Nouvelle Vente</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden relative">
            {/* Left Panel: Catalogue & Quick Add (7 cols) */}
            <div
              className={`lg:col-span-7 border-r border-border flex flex-col h-full bg-background overflow-hidden ${
                mobileTab === "catalog" ? "flex" : "hidden lg:flex"
              }`}
            >
              {/* Quick Free-Sale Form (Article Libre) */}
              <div className="p-3 sm:p-4 border-b border-border bg-primary/5 shrink-0">
                <form onSubmit={addCustomItemToCart} className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-foreground">
                    <span className="flex items-center gap-1.5 text-primary">
                      <Zap size={14} />
                      <span>Vente Express (Article Libre)</span>
                    </span>
                    <span className="text-[11px] text-muted-foreground">Saisie directe sans catalogue</span>
                  </div>

                  <div className="grid grid-cols-12 gap-2">
                    <input
                      type="text"
                      placeholder="Désignation de l'article..."
                      value={customItemName}
                      onChange={(e) => setCustomItemName(e.target.value)}
                      className="col-span-6 px-3 py-2 min-h-[44px] rounded-xl border border-border bg-card text-xs font-medium text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden"
                    />
                    <input
                      type="number"
                      placeholder={`Prix (${currency})`}
                      value={customItemPrice}
                      onChange={(e) => setCustomItemPrice(e.target.value)}
                      className="col-span-3 px-3 py-2 min-h-[44px] rounded-xl border border-border bg-card text-xs font-mono font-bold text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden"
                    />
                    <div className="col-span-3 flex items-center gap-1.5">
                      <button
                        type="submit"
                        className="flex-1 px-3 py-2 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                      >
                        <Plus size={14} />
                        <span>Ajouter</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setVoiceCockpitOpen(true)}
                        className="p-2 min-h-[44px] min-w-[44px] rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 hover:bg-red-100 grid place-items-center cursor-pointer transition shadow-xs"
                        title="Dicter cet article au micro"
                      >
                        <Mic size={16} />
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Search & Categories Bar */}
              <div className="p-3 sm:p-4 border-b border-border space-y-2 shrink-0">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher par nom, référence ou catégorie..."
                    className="w-full pl-9 pr-3 py-2 min-h-[44px] rounded-xl border border-border bg-card text-xs font-medium text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden"
                  />
                </div>

                {/* Categories Pills */}
                {categories.length > 2 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-1.5 min-h-[36px] rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                          selectedCategory === cat
                            ? "bg-primary text-primary-foreground shadow-xs"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {cat === "all" ? "Tous les articles" : cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Grid */}
              <div className="flex-1 p-3 sm:p-4 overflow-y-auto">
                {filteredOffers.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-6">
                    <Package size={36} className="mb-2 opacity-30" />
                    <p className="text-sm font-semibold">Aucun article trouvé</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Utilisez la vente express ci-dessus pour ajouter un article libre.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    {filteredOffers.map((offer) => {
                      const inCart = cart.find((c) => c.offer.id === offer.id);
                      return (
                        <button
                          key={offer.id}
                          type="button"
                          onClick={() => addToCart(offer)}
                          className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between gap-2 cursor-pointer min-h-[96px] ${
                            inCart
                              ? "border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/20 ring-1 ring-emerald-500"
                              : "border-border bg-card hover:border-slate-400 hover:bg-muted/40"
                          }`}
                        >
                          <div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block truncate">
                              {offer.category || "Article"}
                            </span>
                            <strong className="text-xs sm:text-sm font-black text-foreground block line-clamp-2 mt-0.5">
                              {offer.name}
                            </strong>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-border/40">
                            <span className="font-mono text-xs sm:text-sm font-black text-emerald-700 dark:text-emerald-400">
                              {formatMoney(offer.price || 0, currency)}
                            </span>
                            {inCart && (
                              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black grid place-items-center">
                                {inCart.quantity}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Mobile Floating Cart Summary Button */}
              {cart.length > 0 && mobileTab === "catalog" && (
                <div className="lg:hidden absolute bottom-3 left-3 right-3 z-20">
                  <button
                    type="button"
                    onClick={() => setMobileTab("cart")}
                    className="w-full py-3.5 px-4 min-h-[48px] rounded-2xl bg-emerald-600 text-white font-black text-sm shadow-xl flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <ShoppingBag size={18} />
                      <span>{totalCartCount} article(s) au panier</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-mono">
                      <span>{formatMoney(totalAmount, currency)}</span>
                      <ArrowRight size={16} />
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Right Panel: Cart & Checkout (5 cols) */}
            <div
              className={`lg:col-span-5 flex flex-col h-full bg-card overflow-hidden ${
                mobileTab === "cart" ? "flex" : "hidden lg:flex"
              }`}
            >
              {/* Client Info Bar */}
              <div className="p-3 sm:p-4 border-b border-border bg-muted/20 shrink-0 space-y-2">
                <div className="flex items-center gap-2">
                  <User size={15} className="text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Nom du client (ex: Client Comptoir)"
                    className="flex-1 px-3 py-1.5 min-h-[40px] rounded-xl border border-border bg-background text-xs font-bold text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone size={15} className="text-muted-foreground shrink-0" />
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="WhatsApp / Tél (ex: +225 07 12 34 56 78)"
                    className="flex-1 px-3 py-1.5 min-h-[40px] rounded-xl border border-border bg-background text-xs font-mono font-medium text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Cart Items List */}
              <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-2">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-6">
                    <ShoppingBag size={36} className="mb-2 opacity-30" />
                    <p className="text-sm font-semibold">Le ticket est vide</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sélectionnez des articles dans le catalogue ou utilisez la vente express.
                    </p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.offer.id}
                      className="p-3 rounded-2xl border border-border bg-background flex items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="flex-1 min-w-0">
                        <strong className="text-xs sm:text-sm text-foreground block truncate font-black">
                          {item.offer.name}
                        </strong>
                        <span className="text-xs font-mono text-muted-foreground">
                          {formatMoney(item.unitPrice, currency)}
                        </span>
                      </div>

                      {/* Quantity Controls (Large Touch Targets >= 44px) */}
                      <div className="flex items-center gap-1 bg-muted rounded-xl p-0.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.offer.id, -1)}
                          className="w-8 h-8 rounded-lg hover:bg-card text-muted-foreground hover:text-foreground transition grid place-items-center cursor-pointer"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="font-black text-xs px-2 font-mono">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.offer.id, 1)}
                          className="w-8 h-8 rounded-lg hover:bg-card text-muted-foreground hover:text-foreground transition grid place-items-center cursor-pointer"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      {/* Line Total */}
                      <strong className="font-mono text-xs sm:text-sm text-foreground w-16 sm:w-20 text-right font-black">
                        {formatMoney(item.quantity * item.unitPrice, currency)}
                      </strong>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.offer.id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive transition cursor-pointer"
                        title="Retirer l'article"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Checkout Controls */}
              <div className="p-3 sm:p-4 border-t border-border bg-muted/40 space-y-3 shrink-0">
                {/* Total Calculations */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Sous-total ({totalCartCount} art.)</span>
                    <span className="font-mono">{formatMoney(rawSubtotal, currency)}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm font-black pt-1.5 border-t border-border/60">
                    <span className="text-foreground text-sm uppercase tracking-wider">Total à Encaisser</span>
                    <span className="text-base sm:text-lg font-mono text-emerald-600 dark:text-emerald-400 font-black">
                      {formatMoney(totalAmount, currency)}
                    </span>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <span className="text-[10px] uppercase font-black text-muted-foreground tracking-wider block mb-1.5">
                    Mode de Règlement
                  </span>
                  <div className="grid grid-cols-5 gap-1.5">
                    {PAYMENT_METHODS.map((method) => {
                      const Icon = method.icon;
                      const isSelected = paymentMethod === method.id;
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => {
                            posAudioHaptics.playTapSound();
                            setPaymentMethod(method.id);
                          }}
                          className={`p-2 min-h-[48px] rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                            isSelected
                              ? "border-emerald-600 bg-emerald-600 text-white shadow-xs font-black"
                              : "border-border bg-background hover:bg-muted text-muted-foreground font-semibold"
                          }`}
                        >
                          <Icon size={16} />
                          <span className="text-[9px] leading-tight truncate w-full">{method.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quick-Cash Drawer: Banknotes & Change Calculator */}
                {paymentMethod === "cash" && (
                  <div className="p-3 rounded-2xl bg-background border border-border space-y-2.5 text-xs shadow-inner">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        Espèces Reçues :
                      </span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={amountReceived}
                          onChange={(e) => setAmountReceived(e.target.value)}
                          placeholder="Montant..."
                          className="w-32 px-2.5 py-1.5 min-h-[38px] rounded-xl border border-border text-right font-mono font-black text-foreground focus:ring-1 focus:ring-primary focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={handleCashExact}
                          className="px-2.5 py-1.5 min-h-[38px] rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-[10px] font-black text-slate-700 dark:text-slate-200 cursor-pointer"
                          title="Montant exact sans monnaie"
                        >
                          Exact
                        </button>
                      </div>
                    </div>

                    {/* Quick Banknotes Buttons */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                      {banknotePresets.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleCashPreset(preset)}
                          className="px-2.5 py-1.5 min-h-[36px] rounded-xl bg-muted hover:bg-muted/80 text-[11px] font-mono font-black text-foreground transition cursor-pointer whitespace-nowrap border border-border/60"
                        >
                          {preset.toLocaleString("fr-FR")} {currency === "XOF" || currency === "XAF" ? "F" : "€"}
                        </button>
                      ))}
                    </div>

                    {/* Change Result High-Contrast Banner */}
                    {parseFloat(amountReceived) > 0 && (
                      <div className="pt-2 border-t border-border/50">
                        {changeToReturn > 0 ? (
                          <div className="flex justify-between items-center p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">
                            <span className="font-black text-xs uppercase tracking-wide">
                              ✓ À Rendre au Client :
                            </span>
                            <strong className="font-mono text-base font-black">
                              {formatMoney(changeToReturn, currency)}
                            </strong>
                          </div>
                        ) : parseFloat(amountReceived) < totalAmount ? (
                          <div className="flex justify-between items-center p-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-300">
                            <span className="font-bold text-xs">Manque encore :</span>
                            <strong className="font-mono text-xs font-black">
                              {formatMoney(totalAmount - parseFloat(amountReceived), currency)}
                            </strong>
                          </div>
                        ) : (
                          <div className="text-right text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                            Compte exact (Aucune monnaie à rendre)
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Validate Sale Button (Large 48px CTA) */}
                <button
                  type="button"
                  onClick={handleValidateSale}
                  disabled={busy || cart.length === 0}
                  className="w-full py-3.5 min-h-[48px] rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 size={18} />
                  <span>
                    {busy
                      ? "Validation..."
                      : `Encaisser ${formatMoney(totalAmount, currency)}`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Voice Cockpit Modal */}
        <PosVoiceCockpit
          open={voiceCockpitOpen}
          onClose={() => setVoiceCockpitOpen(false)}
          onApplyItems={handleVoiceApplyItems}
          currency={currency}
        />
      </div>
    </div>
  );
}
