"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { WhatsAppConfigView } from "@/components/app/WhatsAppConfigView";
import { serviceIaFetch } from "@/lib/service-ia/api";

export default function WhatsAppPage() {
  const [orgSlug, setOrgSlug] = useState("");

  useEffect(() => {
    serviceIaFetch<{ slug: string }>("/organizations/current")
      .then((data) => setOrgSlug(data.slug))
      .catch(() => setOrgSlug(""));
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Intégrations & Mobilité"
        title="Passerelle WhatsApp Business"
        description="Connectez vos numéros de vente WhatsApp pour enregistrer et valider vos ventes en direct sur le terrain."
      />
      <WhatsAppConfigView orgSlug={orgSlug} />
    </>
  );
}
