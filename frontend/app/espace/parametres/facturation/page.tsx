import type { Metadata } from "next";
import { PageHeader } from "@/components/app/PageHeader";
import { BillingPlansView } from "@/components/app/BillingPlansView";

export const metadata: Metadata = {
  title: "Abonnement et facturation",
  description: "Consultez les formules et les informations de facturation de votre espace CAURI.",
};

export default function BillingPage() {
  return (
    <>
      <PageHeader
        eyebrow="DIRECTION / ABONNEMENT"
        title="Formules et facturation"
        description="Consultez votre formule, vos capacités et les options de règlement disponibles."
      />
      <BillingPlansView />
    </>
  );
}
