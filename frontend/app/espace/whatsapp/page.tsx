"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { WhatsAppConfigView } from "@/components/app/WhatsAppConfigView";
import { ClientSolvencyRadar } from "@/components/credit/ClientSolvencyRadar";
import { serviceIaFetch } from "@/lib/service-ia/api";
import { MessageSquare, Users, ShieldCheck } from "lucide-react";
import { SaleItem } from "@/components/app/RegistersTable";

export default function WhatsAppPage() {
  const [orgSlug, setOrgSlug] = useState("");
  const [organizationName, setOrganizationName] = useState("CAURI");
  const [sales, setSales] = useState<SaleItem[]>([]);
  const [activeTab, setActiveTab] = useState<"gateway" | "solvency">("gateway");

  useEffect(() => {
    serviceIaFetch<{ name?: string; slug: string }>("/organizations/current")
      .then((data) => {
        if (data.slug) setOrgSlug(data.slug);
        if (data.name) setOrganizationName(data.name);
      })
      .catch(() => setOrgSlug(""));

    serviceIaFetch<{ items: SaleItem[] }>("/registers/sales?page_size=100")
      .then((res) => {
        if (res && res.items) setSales(res.items);
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="COMMERCE / CANAUX & RECOUVREMENT"
        title="WhatsApp Business & Relance Stratégique"
        description="Gérez votre passerelle WhatsApp, analysez la solvabilité de vos clients et déclenchez des relances 1-clic avec liens SmartDoc."
      />

      {/* Onglets de navigation */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button
          type="button"
          onClick={() => setActiveTab("gateway")}
          className={`app-button ${activeTab === "gateway" ? "app-button-primary" : "app-button-secondary"}`}
          style={{ minHeight: "42px", display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          <MessageSquare size={16} />
          <span>Passerelle & Numéros WhatsApp</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("solvency")}
          className={`app-button ${activeTab === "solvency" ? "app-button-primary" : "app-button-secondary"}`}
          style={{ minHeight: "42px", display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          <Users size={16} />
          <span>Relance Intelligente & Solvabilité Clients</span>
        </button>
      </div>

      {activeTab === "gateway" ? (
        <WhatsAppConfigView orgSlug={orgSlug} />
      ) : (
        <ClientSolvencyRadar sales={sales} organizationName={organizationName} />
      )}
    </>
  );
}
