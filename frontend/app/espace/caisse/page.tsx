"use client";

import React, { useEffect, useState } from "react";
import { ExpressPosModal } from "@/components/app/ExpressPosModal";
import { OfferItem } from "@/components/app/RegistersTable";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { ShoppingBag, ArrowLeft, Wallet, ShieldCheck } from "lucide-react";
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
    <div className="cauri-finance-caisse p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <header className="cauri-caisse-header">
        <div className="cauri-caisse-intro">
          <span className="cauri-finance-eyebrow"><Wallet size={15} aria-hidden="true" /> FINANCES / CAISSE</span>
          <h1>Caisse tactile</h1>
          <p>Enregistrez une vente depuis votre caisse. Les opérations validées restent liées aux registres existants.</p>
        </div>
        <div className="cauri-caisse-actions">
        <Link
          href="/espace/ventes"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft size={16} />
          <span>Retour aux ventes</span>
        </Link>

        <Link href="/espace/finance" className="rounded-xl border border-emerald-600 px-3 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-300">Comptes &amp; mouvements</Link>
        <button
          onClick={() => setPosOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition"
        >
          <ShoppingBag size={18} />
          <span>Ouvrir la caisse</span>
        </button>
        </div>
      </header>
      <div className="cauri-caisse-notice"><ShieldCheck size={17} aria-hidden="true" /><p>Les données des ventes proviennent du registre des offres. Aucun montant n’est affiché avant confirmation.</p></div>

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
  );
}
