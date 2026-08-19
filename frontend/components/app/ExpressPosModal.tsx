"use client";

import React, { useState, useMemo } from "react";
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
  Sparkles,
  Receipt,
  User,
  Package,
} from "lucide-react";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { OfferItem, formatMoney } from "./RegistersTable";

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
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [clientName, setClientName] = useState("Client Comptoir");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [amountReceived, setAmountReceived] = useState<string>("");
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [busy, setBusy] = useState(false);
  const [lastSaleResult, setLastSaleResult] = useState<any | null>(null);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    offers.forEach((o) => {
      if (o.category) set.add(o.category);
    });
    return ["all", ...Array.from(set)];
  }, [offers]);

  // Filtered catalogue
  const filteredOffers = useMemo(() => {
    return offers.filter((o) => {
      if (selectedCategory !== "all" && o.category !== selectedCategory) return false;
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        o.name.toLowerCase().includes(q) ||
        (o.category || "").toLowerCase().includes(q)
      );
    });
  }, [offers, search, selectedCategory]);

  // Cart calculations
  const subtotal = cart.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const totalAmount = Math.max(0, subtotal - discountAmount);

  const receivedNum = parseFloat(amountReceived) || 0;
  const changeToReturn = Math.max(0, receivedNum - totalAmount);

  const addToCart = (offer: OfferItem) => {
    const price = parseFloat(offer.price || "0") || 0;
    setCart((prev) => {
      const existing = prev.find((item) => item.offer.id === offer.id);
      if (existing) {
        return prev.map((item) =>
          item.offer.id === offer.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { offer, quantity: 1, unitPrice: price }];
    });
  };

  const updateQuantity = (offerId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.offer.id === offerId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (offerId: string) => {
    setCart((prev) => prev.filter((item) => item.offer.id !== offerId));
  };

  const clearCart = () => {
    setCart([]);
    setAmountReceived("");
    setDiscountPercent(0);
    setClientName("Client Comptoir");
    setLastSaleResult(null);
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setBusy(true);
    try {
      // For each item or the main item, record sale
      // If multiple items, we concatenate labels or create one multi-item sale
      const mainItem = cart[0];
      const summaryLabel =
        cart.length === 1
          ? mainItem.offer.name
          : `${mainItem.offer.name} + ${cart.length - 1} autre(s) article(s)`;

      const totalQty = cart.reduce((acc, i) => acc + i.quantity, 0);

      const payload = {
        sale_date: new Date().toISOString().split("T")[0],
        item_label: summaryLabel,
        offer_id: cart.length === 1 ? mainItem.offer.id : null,
        client_name: clientName.trim() || "Client Comptoir",
        quantity: totalQty,
        unit_price: totalAmount / (totalQty || 1),
        discount: discountAmount,
        total_amount: totalAmount,
        currency: currency,
        payment_method: paymentMethod,
        payment_status: "paid",
        sales_channel: "caisse_express",
        comment: `Vente caisse express (${cart.map((i) => `${i.quantity}x ${i.offer.name}`).join(", ")})`,
      };

      const result = await serviceIaFetch<any>("/registers/sales", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      // Also dispatch custom event
      window.dispatchEvent(new CustomEvent("koryxa:record-created"));
      if (onSaleCompleted) await onSaleCompleted();

      setLastSaleResult({
        ...result,
        cartItems: [...cart],
        changeToReturn,
        receivedNum,
        totalAmount,
      });
    } catch (err: any) {
      alert(err.message || "Erreur lors de l'encaissement");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-background/80 backdrop-blur-md">
      <div className="w-full max-w-6xl h-[92vh] bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* POS Header */}
        <header className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShoppingBag size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-foreground">
                  Mode Caisse Express (POS)
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  Comptoir Direct
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Encaissement rapide, décrémentation automatique des stocks et calcul de monnaie.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={clearCart}
              className="px-3 py-1.5 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition flex items-center gap-1.5"
            >
              <RotateCcw size={14} />
              <span>Nouveau Ticket</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Main Grid: Left Catalogue | Right Cart & Checkout */}
        {lastSaleResult ? (
          /* Sale Success & Receipt View */
          <div className="flex-1 p-8 flex flex-col items-center justify-center text-center bg-card">
            <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4 animate-bounce">
              <CheckCircle2 size={48} />
            </div>
            <h3 className="text-2xl font-black text-foreground mb-1">
              Encaissement Réussi !
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Réf : <strong>{lastSaleResult.reference || "VTE-EXPRESS"}</strong> · Payé par{" "}
              <strong>{lastSaleResult.payment_method?.toUpperCase()}</strong>
            </p>

            {/* Receipt Summary Card */}
            <div className="w-full max-w-md p-6 rounded-2xl border border-border bg-muted/30 text-left space-y-3 mb-8">
              <div className="flex justify-between text-sm border-b border-border/60 pb-2">
                <span className="text-muted-foreground">Total Encaissé</span>
                <strong className="font-mono text-base text-foreground">
                  {formatMoney(lastSaleResult.totalAmount, currency)}
                </strong>
              </div>

              {lastSaleResult.receivedNum > 0 && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Montant Reçu</span>
                    <span className="font-mono">{formatMoney(lastSaleResult.receivedNum, currency)}</span>
                  </div>
                  <div className="flex justify-between text-sm pt-2 border-t border-border/40 font-bold text-emerald-600 dark:text-emerald-400">
                    <span>Monnaie à Rendre</span>
                    <span className="font-mono text-base">
                      {formatMoney(lastSaleResult.changeToReturn, currency)}
                    </span>
                  </div>
                </>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="px-5 py-2.5 rounded-xl border border-border bg-muted hover:bg-muted/80 text-sm font-semibold flex items-center gap-2"
              >
                <Printer size={16} />
                <span>Imprimer Ticket</span>
              </button>

              <button
                onClick={clearCart}
                className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition flex items-center gap-2"
              >
                <Plus size={16} />
                <span>Nouvelle Vente</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
            {/* Left Panel: Catalogue (7 cols) */}
            <div className="lg:col-span-7 border-r border-border flex flex-col h-full bg-background overflow-hidden">
              {/* Search & Category Pills */}
              <div className="p-4 border-b border-border space-y-3 bg-card shrink-0">
                <div className="relative">
                  <Search
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher un produit, article, code..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                        selectedCategory === cat
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-muted text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {cat === "all" ? "Tous les articles" : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Products Tiles Grid */}
              <div className="flex-1 p-4 overflow-y-auto">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {filteredOffers.map((offer) => {
                    const price = parseFloat(offer.price || "0") || 0;
                    const stock = Number(offer.stock_quantity ?? 0);
                    const minStock = Number(offer.min_stock_alert ?? 5);
                    const isOutOfStock = offer.track_stock && stock <= 0;
                    const isLowStock = offer.track_stock && stock > 0 && stock <= minStock;

                    return (
                      <button
                        key={offer.id}
                        onClick={() => addToCart(offer)}
                        disabled={isOutOfStock}
                        className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition group relative ${
                          isOutOfStock
                            ? "opacity-50 border-destructive/30 bg-destructive/5 cursor-not-allowed"
                            : "border-border/80 bg-card hover:border-primary hover:shadow-md active:scale-95"
                        }`}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <strong className="text-sm font-bold text-foreground line-clamp-2 group-hover:text-primary transition">
                              {offer.name}
                            </strong>
                          </div>
                          {offer.category && (
                            <span className="text-[10px] text-muted-foreground block mb-2 font-mono">
                              {offer.category}
                            </span>
                          )}
                        </div>

                        <div className="mt-3 pt-2 border-t border-border/40 flex items-center justify-between">
                          <span className="text-sm font-black font-mono text-foreground">
                            {formatMoney(price, offer.currency || currency)}
                          </span>

                          {offer.track_stock && (
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                isOutOfStock
                                  ? "bg-rose-500/10 text-rose-600"
                                  : isLowStock
                                  ? "bg-amber-500/10 text-amber-600"
                                  : "bg-emerald-500/10 text-emerald-600"
                              }`}
                            >
                              {isOutOfStock ? "Rupture" : `${stock} en stock`}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {filteredOffers.length === 0 && (
                  <div className="h-64 flex flex-col items-center justify-center text-center text-muted-foreground">
                    <Package size={36} className="mb-2 opacity-40" />
                    <p className="text-sm">Aucun produit ne correspond à cette recherche.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel: Cart & Checkout (5 cols) */}
            <div className="lg:col-span-5 flex flex-col h-full bg-card overflow-hidden">
              {/* Client & Cart Items */}
              <div className="p-4 border-b border-border bg-muted/20 shrink-0">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-muted-foreground" />
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Nom du client (ex: M. Koffi)"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Cart List */}
              <div className="flex-1 p-4 overflow-y-auto space-y-2">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-6">
                    <ShoppingBag size={40} className="mb-2 opacity-30" />
                    <p className="text-sm font-semibold">Le panier est vide</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Cliquez sur les articles du catalogue pour les ajouter au ticket de caisse.
                    </p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.offer.id}
                      className="p-3 rounded-xl border border-border bg-background flex items-center justify-between gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <strong className="text-sm text-foreground block truncate">
                          {item.offer.name}
                        </strong>
                        <span className="text-xs font-mono text-muted-foreground">
                          {formatMoney(item.unitPrice, currency)}
                        </span>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5 bg-muted rounded-lg p-1">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.offer.id, -1)}
                          className="p-1 rounded hover:bg-card text-muted-foreground hover:text-foreground transition"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="font-bold text-xs px-2 font-mono">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.offer.id, 1)}
                          className="p-1 rounded hover:bg-card text-muted-foreground hover:text-foreground transition"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      {/* Line Total */}
                      <div className="text-right min-w-[70px]">
                        <span className="font-bold text-sm font-mono text-foreground">
                          {formatMoney(item.unitPrice * item.quantity, currency)}
                        </span>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.offer.id)}
                        className="text-muted-foreground hover:text-destructive transition p-1"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Checkout Controls Footer */}
              <div className="p-4 border-t border-border bg-muted/30 shrink-0 space-y-3">
                {/* Total & Payment Method Selector */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                    Moyen de Paiement
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {PAYMENT_METHODS.map((pm) => {
                      const isSelected = paymentMethod === pm.id;
                      const Icon = pm.icon;
                      return (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => setPaymentMethod(pm.id)}
                          className={`p-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground shadow-sm"
                              : "border-border bg-card text-foreground hover:bg-muted"
                          }`}
                        >
                          <Icon size={14} />
                          <span>{pm.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Cash Calculator if Cash selected */}
                {paymentMethod === "cash" && (
                  <div className="p-3 rounded-xl bg-background border border-border grid grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                        Montant Reçu
                      </label>
                      <input
                        type="number"
                        placeholder="Ex: 10000"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-sm font-bold font-mono focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
                        Monnaie à Rendre
                      </span>
                      <span className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400">
                        {formatMoney(changeToReturn, currency)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Totals Summary */}
                <div className="pt-2 border-t border-border/60 space-y-1">
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>Sous-total ({cart.reduce((a, b) => a + b.quantity, 0)} articles)</span>
                    <span className="font-mono">{formatMoney(subtotal, currency)}</span>
                  </div>

                  <div className="flex justify-between items-center text-lg font-black text-foreground pt-1">
                    <span>Total à Payer</span>
                    <span className="font-mono text-primary text-xl">
                      {formatMoney(totalAmount, currency)}
                    </span>
                  </div>
                </div>

                {/* Big Checkout Button */}
                <button
                  type="button"
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || busy}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-base shadow-lg shadow-emerald-600/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={20} />
                  <span>
                    {busy
                      ? "Validation..."
                      : `ENCAISSER ${formatMoney(totalAmount, currency)}`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
