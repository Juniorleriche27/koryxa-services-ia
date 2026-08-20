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
  ArrowRight,
  Zap,
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
  const [mobileTab, setMobileTab] = useState<"catalog" | "cart">("catalog");

  // Custom free-sale item fields
  const [customItemName, setCustomItemName] = useState("");
  const [customItemPrice, setCustomItemPrice] = useState("");
  const [customItemQty, setCustomItemQty] = useState("1");

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

  // Cart operations
  const addToCart = (offer: OfferItem) => {
    const price = parseFloat(offer.price || "0") || 0;
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
      alert("Veuillez saisir un prix valide supérieur à 0.");
      return;
    }

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
    setCart((prev) => prev.filter((item) => item.offer.id !== offerId));
  };

  const clearCart = () => {
    setCart([]);
    setAmountReceived("");
    setDiscountPercent(0);
    setLastSaleResult(null);
    setMobileTab("catalog");
  };

  // Fast cash presets
  const handleCashPreset = (amount: number) => {
    setAmountReceived(String(amount));
  };

  // Submit sale to backend API
  const handleValidateSale = async () => {
    if (cart.length === 0) {
      alert("Veuillez ajouter au moins un produit au panier.");
      return;
    }

    const receivedNum = parseFloat(amountReceived) || 0;
    if (paymentMethod === "cash" && receivedNum > 0 && receivedNum < totalAmount) {
      alert("Le montant reçu en espèces est inférieur au total à payer.");
      return;
    }

    setBusy(true);

    try {
      const itemLabelSummary =
        cart.length === 1
          ? cart[0].offer.name
          : `${cart[0].offer.name} + ${cart.length - 1} autre(s) article(s)`;

      const payload = {
        document_type: "receipt",
        sale_date: new Date().toISOString().slice(0, 10),
        client_name: clientName.trim() || "Client Comptoir",
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
        sales_channel: "Caisse Comptoir (POS)",
        comment: `Vente caisse express (${cart.map((c) => `${c.quantity}x ${c.offer.name}`).join(", ")})`,
        status: "validated",
      };

      const result = await serviceIaFetch<any>("/registers/sales", {
        method: "POST",
        body: JSON.stringify(payload),
      });

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-background/80 backdrop-blur-md">
      <div className="w-full max-w-6xl h-[94vh] bg-card border border-border rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200 relative">
        {/* POS Header */}
        <header className="px-4 sm:px-6 py-3.5 border-b border-border flex items-center justify-between bg-muted/40 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShoppingBag size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-foreground">
                  Caisse Express (POS)
                </h2>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  Comptoir Direct
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground hidden sm:block">
                Encaissement rapide au comptoir, décrémentation des stocks et reçu de vente immédiat.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={clearCart}
              className="px-3 py-1.5 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition flex items-center gap-1"
            >
              <RotateCcw size={13} />
              <span className="hidden sm:inline">Nouveau Ticket</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition"
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
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                mobileTab === "catalog"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              <Package size={14} />
              <span>Articles ({filteredOffers.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("cart")}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
                mobileTab === "cart"
                  ? "bg-primary text-primary-foreground shadow-sm"
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
            <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-4 animate-bounce">
              <CheckCircle2 size={48} />
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-foreground mb-1">
              Encaissement Réussi !
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mb-6">
              Réf : <strong>{lastSaleResult.reference || "VTE-EXPRESS"}</strong> · Payé par{" "}
              <strong>{lastSaleResult.payment_method?.toUpperCase()}</strong>
            </p>

            {/* Receipt Summary Card */}
            <div className="w-full max-w-md p-5 rounded-2xl border border-border bg-muted/30 text-left space-y-2.5 mb-6 text-xs sm:text-sm">
              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">Client</span>
                <strong className="text-foreground">{clientName || "Client Comptoir"}</strong>
              </div>

              <div className="flex justify-between border-b border-border/60 pb-2">
                <span className="text-muted-foreground">Total Encaissé</span>
                <strong className="font-mono text-base text-foreground">
                  {formatMoney(lastSaleResult.totalAmount, currency)}
                </strong>
              </div>

              {lastSaleResult.receivedNum > 0 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Montant Reçu</span>
                    <span className="font-mono">{formatMoney(lastSaleResult.receivedNum, currency)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400 pt-1 border-t border-border/40">
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
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl border border-border bg-muted hover:bg-muted/80 text-xs sm:text-sm font-semibold flex items-center gap-2"
              >
                <Printer size={15} />
                <span>Imprimer Ticket</span>
              </button>

              <button
                type="button"
                onClick={clearCart}
                className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs sm:text-sm hover:opacity-90 transition flex items-center gap-2"
              >
                <Plus size={15} />
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
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Zap size={14} className="text-primary" />
                      <span>Article libre / Vente directe</span>
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Encaissez sans produit créé à l'avance
                    </span>
                  </div>
                  <div className="grid grid-cols-12 gap-1.5">
                    <input
                      type="text"
                      value={customItemName}
                      onChange={(e) => setCustomItemName(e.target.value)}
                      placeholder="Ex: Clavier, Réparation, Café..."
                      className="col-span-6 sm:col-span-6 px-2.5 py-1.5 rounded-xl border border-border bg-background text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={customItemPrice}
                      onChange={(e) => setCustomItemPrice(e.target.value)}
                      placeholder={`Prix (${currency})`}
                      className="col-span-3 sm:col-span-3 px-2 py-1.5 rounded-xl border border-border bg-background text-xs font-mono font-bold focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!customItemPrice || parseFloat(customItemPrice) <= 0}
                      className="col-span-3 sm:col-span-3 px-2 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-1 shadow-sm"
                    >
                      <Plus size={13} />
                      <span>Ajouter</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Search & Category Pills */}
              <div className="p-3 sm:p-4 border-b border-border space-y-2.5 bg-card shrink-0">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Rechercher dans le catalogue d'articles..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-background text-xs sm:text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                  />
                </div>

                {categories.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
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
                )}
              </div>

              {/* Products Tiles Grid */}
              <div className="flex-1 p-3 sm:p-4 overflow-y-auto pb-20 lg:pb-4">
                {filteredOffers.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
                    {filteredOffers.map((offer) => {
                      const price = parseFloat(offer.price || "0") || 0;
                      const stock = Number(offer.stock_quantity ?? 0);
                      const minStock = Number(offer.min_stock_alert ?? 5);
                      const isOutOfStock = offer.track_stock && stock <= 0;
                      const isLowStock = offer.track_stock && stock > 0 && stock <= minStock;

                      return (
                        <button
                          key={offer.id}
                          type="button"
                          onClick={() => addToCart(offer)}
                          disabled={isOutOfStock}
                          className={`p-3 rounded-2xl border text-left flex flex-col justify-between transition group relative ${
                            isOutOfStock
                              ? "opacity-50 border-destructive/30 bg-destructive/5 cursor-not-allowed"
                              : "border-border/80 bg-card hover:border-primary hover:shadow-md active:scale-95 cursor-pointer"
                          }`}
                        >
                          <div>
                            <strong className="text-xs sm:text-sm font-bold text-foreground line-clamp-2 group-hover:text-primary transition">
                              {offer.name}
                            </strong>
                            {offer.category && (
                              <span className="text-[10px] text-muted-foreground block mb-1 font-mono">
                                {offer.category}
                              </span>
                            )}
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between">
                            <span className="text-xs sm:text-sm font-black font-mono text-foreground">
                              {formatMoney(price, offer.currency || currency)}
                            </span>

                            {offer.track_stock && (
                              <span
                                className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                  isOutOfStock
                                    ? "bg-rose-500/10 text-rose-600"
                                    : isLowStock
                                    ? "bg-amber-500/10 text-amber-600"
                                    : "bg-emerald-500/10 text-emerald-600"
                                }`}
                              >
                                {isOutOfStock ? "Rupture" : `${stock} dispo`}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 rounded-2xl bg-muted/20 border border-dashed border-border text-center space-y-3">
                    <Package size={36} className="mx-auto text-primary opacity-50" />
                    <h4 className="text-sm font-bold text-foreground">
                      {safeOffers.length === 0
                        ? "Catalogue d'articles vide"
                        : "Aucun article correspondant à votre recherche"}
                    </h4>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                      {safeOffers.length === 0
                        ? "Vous n'avez pas encore d'articles enregistrés dans votre catalogue. Vous pouvez ajouter un article libre en haut pour encaisser tout de suite !"
                        : "Essayez un autre mot-clé ou réinitialisez le filtre de recherche."}
                    </p>
                  </div>
                )}
              </div>

              {/* Floating Mobile Cart Banner when in catalog tab */}
              {cart.length > 0 && mobileTab === "catalog" && (
                <div className="lg:hidden absolute bottom-3 left-3 right-3 z-20">
                  <button
                    type="button"
                    onClick={() => setMobileTab("cart")}
                    className="w-full py-3 px-4 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <ShoppingBag size={18} />
                      <span>{totalCartCount} article(s)</span>
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
              {/* Client Name input */}
              <div className="p-3 sm:p-4 border-b border-border bg-muted/20 shrink-0">
                <div className="flex items-center gap-2">
                  <User size={15} className="text-muted-foreground" />
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Nom du client (ex: Client Comptoir)"
                    className="flex-1 px-3 py-1.5 rounded-lg border border-border bg-background text-xs font-medium text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Cart List */}
              <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-2">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-6">
                    <ShoppingBag size={36} className="mb-2 opacity-30" />
                    <p className="text-sm font-semibold">Le panier est vide</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Sélectionnez des articles dans le catalogue ou utilisez l'article libre.
                    </p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.offer.id}
                      className="p-2.5 sm:p-3 rounded-xl border border-border bg-background flex items-center justify-between gap-2"
                    >
                      <div className="flex-1 min-w-0">
                        <strong className="text-xs sm:text-sm text-foreground block truncate">
                          {item.offer.name}
                        </strong>
                        <span className="text-xs font-mono text-muted-foreground">
                          {formatMoney(item.unitPrice, currency)}
                        </span>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.offer.id, -1)}
                          className="p-1 rounded hover:bg-card text-muted-foreground hover:text-foreground transition"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="font-bold text-xs px-1.5 font-mono">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.offer.id, 1)}
                          className="p-1 rounded hover:bg-card text-muted-foreground hover:text-foreground transition"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      {/* Line Total */}
                      <strong className="font-mono text-xs sm:text-sm text-foreground w-16 sm:w-20 text-right">
                        {formatMoney(item.quantity * item.unitPrice, currency)}
                      </strong>

                      <button
                        type="button"
                        onClick={() => removeFromCart(item.offer.id)}
                        className="p-1 text-muted-foreground hover:text-destructive transition"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Checkout Footer Controls */}
              <div className="p-3 sm:p-4 border-t border-border bg-muted/40 space-y-3 shrink-0">
                {/* Total Calculations */}
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Sous-total ({totalCartCount} art.)</span>
                    <span className="font-mono">{formatMoney(rawSubtotal, currency)}</span>
                  </div>

                  <div className="flex justify-between items-center text-sm font-black pt-1 border-t border-border/60">
                    <span className="text-foreground">Total à Payer</span>
                    <span className="text-base sm:text-lg font-mono text-primary">
                      {formatMoney(totalAmount, currency)}
                    </span>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mb-1.5">
                    Moyen de Paiement
                  </label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                    {PAYMENT_METHODS.map((method) => {
                      const Icon = method.icon;
                      const isSelected = paymentMethod === method.id;
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setPaymentMethod(method.id)}
                          className={`p-2 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground shadow-sm font-bold"
                              : "border-border bg-background hover:bg-muted text-muted-foreground"
                          }`}
                        >
                          <Icon size={16} />
                          <span className="text-[10px] leading-tight">{method.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Cash Change Calculator (If cash selected) */}
                {paymentMethod === "cash" && (
                  <div className="p-2.5 rounded-xl bg-background border border-border space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">Reçu (Espèces) :</span>
                      <input
                        type="number"
                        value={amountReceived}
                        onChange={(e) => setAmountReceived(e.target.value)}
                        placeholder="Ex: 10000"
                        className="w-28 px-2 py-1 rounded border border-border text-right font-mono font-bold focus:ring-1 focus:ring-primary focus:outline-none"
                      />
                    </div>

                    {/* Presets */}
                    <div className="flex gap-1 justify-end">
                      {[1000, 2000, 5000, 10000, 20000, 50000].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => handleCashPreset(preset)}
                          className="px-2 py-0.5 rounded bg-muted hover:bg-muted/80 text-[10px] font-mono text-muted-foreground"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>

                    {changeToReturn > 0 && (
                      <div className="flex justify-between items-center font-bold text-emerald-600 dark:text-emerald-400 pt-1 border-t border-border/40">
                        <span>Monnaie à rendre :</span>
                        <strong className="font-mono text-sm">
                          {formatMoney(changeToReturn, currency)}
                        </strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Validate Sale Button */}
                <button
                  type="button"
                  onClick={handleValidateSale}
                  disabled={busy || cart.length === 0}
                  className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-sm shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 size={18} />
                  <span>
                    {busy ? "Encaissement..." : `Encaisser ${formatMoney(totalAmount, currency)}`}
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
