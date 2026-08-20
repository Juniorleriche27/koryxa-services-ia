"use client";

import React, { useState } from "react";
import { Package, Plus, Minus, Check, RefreshCw, X, AlertCircle } from "lucide-react";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { OfferItem, formatMoney } from "./RegistersTable";

interface StockAdjustmentDialogProps {
  offer: OfferItem;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export function StockAdjustmentDialog({
  offer,
  onClose,
  onSuccess,
}: StockAdjustmentDialogProps) {
  const currentStock = Number(offer.stock_quantity ?? 0);
  const [mode, setMode] = useState<"add" | "set" | "subtract">("add");
  const [quantity, setQuantity] = useState<string>("10");
  const [reason, setReason] = useState<string>("Réception fournisseur");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const parsedQty = parseFloat(quantity) || 0;
  const projectedStock =
    mode === "add"
      ? currentStock + parsedQty
      : mode === "subtract"
      ? Math.max(0, currentStock - parsedQty)
      : parsedQty;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedQty < 0) {
      setError("La quantité doit être un nombre positif.");
      return;
    }
    setBusy(true);
    setError("");

    try {
      let body: Record<string, unknown> = { reason: reason.trim() };
      if (mode === "add") {
        body.quantity_delta = parsedQty;
      } else if (mode === "subtract") {
        body.quantity_delta = -parsedQty;
      } else {
        body.new_quantity = parsedQty;
      }

      await serviceIaFetch(`/registers/offers/${offer.id}/adjust-stock`, {
        method: "POST",
        body: JSON.stringify(body),
      });

      await onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Erreur lors de l'ajustement du stock.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Package size={20} />
            </div>
            <div>
              <h3 className="font-bold text-foreground text-base">
                Ajustement de Stock
              </h3>
              <p className="text-xs text-muted-foreground">{offer.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Current Stock Indicator */}
        <div className="px-5 py-3.5 bg-muted/20 border-b border-border/50 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Stock physique actuel</span>
          <span className="font-bold text-sm text-foreground font-mono">
            {currentStock} {offer.billing_unit || "unités"}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Operation Mode Tabs */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">
              Type d'opération
            </label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setMode("add");
                  setReason("Réception fournisseur / Réapprovisionnement");
                }}
                className={`py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1 ${
                  mode === "add"
                    ? "bg-card text-foreground shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Plus size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>Entrée (+)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("subtract");
                  setReason("Perte, casse ou dépréciation");
                }}
                className={`py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1 ${
                  mode === "subtract"
                    ? "bg-card text-foreground shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Minus size={14} className="text-rose-600 dark:text-rose-400" />
                <span>Sortie (-)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("set");
                  setReason("Inventaire physique et comptage");
                }}
                className={`py-1.5 text-xs font-semibold rounded-lg transition flex items-center justify-center gap-1 ${
                  mode === "set"
                    ? "bg-card text-foreground shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <RefreshCw size={14} className="text-blue-600 dark:text-blue-400" />
                <span>Inventaire (=)</span>
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              {mode === "set" ? "Nouvelle quantité totale comptée" : "Quantité à impacter"}
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={quantity}
              onFocus={(e) => e.target.select()}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-base font-bold font-mono text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              autoFocus
            />
          </div>

          {/* Reason / Justification */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1">
              Motif / Justification d'audit
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ex: Facture Fournisseur N°124 ou Inventaire mensuel"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-sm text-foreground focus:ring-2 focus:ring-primary focus:outline-none"
              required
            />
          </div>

          {/* Projected Stock Preview */}
          <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between">
            <span className="text-xs font-medium text-foreground">
              Nouveau stock après validation :
            </span>
            <span className="text-sm font-bold font-mono text-primary">
              {projectedStock} {offer.billing_unit || "unités"}
            </span>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-muted-foreground hover:bg-muted transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={busy || !parsedQty}
              className="px-5 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2"
            >
              <Check size={16} />
              <span>{busy ? "Enregistrement..." : "Confirmer le stock"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
