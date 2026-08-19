"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/app/AppShell";
import { ExpressPosModal } from "@/components/app/ExpressPosModal";
import { OfferItem } from "@/components/app/RegistersTable";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { ShoppingBag, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CaissePage() {
  const [offers, setOffers] = useState<OfferItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [posOpen, setPosOpen] = useState(true);

  useEffect(() => {
    serviceIaFetch<OfferItem[]>("/registers/offers")
      .then(setOffers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/espace/ventes"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft size={16} />
            <span>Retour aux Ventes</span>
          </Link>

          <button
            onClick={() => setPosOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition"
          >
            <ShoppingBag size={18} />
            <span>Ouvrir la Caisse Tactile</span>
          </button>
        </div>

        <ExpressPosModal
          open={posOpen}
          offers={offers}
          onClose={() => setPosOpen(false)}
          onSaleCompleted={async () => {
            const updated = await serviceIaFetch<OfferItem[]>("/registers/offers");
            setOffers(updated);
          }}
        />
      </div>
    </AppShell>
  );
}
