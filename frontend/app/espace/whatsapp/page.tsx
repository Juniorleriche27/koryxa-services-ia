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
        eyebrow="COMMERCE / CANAUX"
        title="WhatsApp Business"
        description="Connectez votre canal WhatsApp pour suivre les ventes et les échanges sur le terrain."
      />
      <WhatsAppConfigView orgSlug={orgSlug} />
    </>
  );
}
