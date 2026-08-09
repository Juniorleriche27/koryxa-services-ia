"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { EmptyState } from "@/components/app/Ui";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { SuppliersDirectory, SupplierItem } from "@/components/app/SuppliersTable";

interface ApiPage<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<SupplierItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSuppliers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await serviceIaFetch<ApiPage<SupplierItem>>("/registers/suppliers?page_size=100");
      setSuppliers(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Données indisponibles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSuppliers();
  }, [loadSuppliers]);

  return (
    <>
      <PageHeader
        eyebrow="Partenaires & Achats"
        title="Fournisseurs & Prestataires"
        description="Centralisez les coordonnées, interlocuteurs et modalités de règlement de vos fournisseurs réguliers."
      />

      <section className="app-panel">
        {loading && <EmptyState title="Chargement…" detail="Connexion au répertoire des fournisseurs." />}
        {error && <EmptyState title="Erreur" detail={error} />}
        {!loading && !error && (
          <SuppliersDirectory suppliers={suppliers} onRefresh={loadSuppliers} />
        )}
      </section>
    </>
  );
}
