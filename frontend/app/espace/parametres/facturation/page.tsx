import type { Metadata } from "next";
import { PageHeader } from "@/components/app/PageHeader";
import { BillingPlansView } from "@/components/app/BillingPlansView";

export const metadata: Metadata = {
  title: "Facturation & Formules d'Abonnement | KORYXA Service IA",
  description: "Gérez votre abonnement KORYXA Service IA et souscrivez au Pack 3 Mois par Mobile Money.",
};

export default function BillingPage() {
  return (
    <>
      <PageHeader
        eyebrow="Paramètres & Abonnements"
        title="Formules & Facturation"
        description="Gérez votre formule d'abonnement et réglez en 1 clic par Wave, Orange Money ou MTN MoMo."
      />
      <BillingPlansView />
    </>
  );
}
