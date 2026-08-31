import { NextResponse } from "next/server";
import { requireServiceIaIdentity } from "@/lib/auth-server";

export async function GET() {
  try {
    const identity = await requireServiceIaIdentity();
    return NextResponse.json({
      subscription_plan: "trial",
      subscription_status: "trial",
      subscription_period_months: 0,
      subscription_ends_at: null,
      days_remaining: 14,
      max_authorized_senders: 1,
      active_senders_count: 1,
      is_trial: true,
      is_active: true,
      available_plans: [
        {
          code: "pack_starter_3m",
          name: "Starter Solo",
          plan: "starter",
          period_months: 3,
          amount_minor: 19900,
          currency: "XOF",
          display_price: "19 900 FCFA",
          is_launch_deal: true,
          original_price: "29 700 FCFA",
          max_senders: 1,
          features: [
            "1 Numéro WhatsApp connecté (Gérant)",
            "Dictée vocale & texte illimitée",
            "Reçus WhatsApp automatiques clients (PDF & texte)",
            "Bilan de caisse quotidien chaque soir à 21h sur WhatsApp",
            "Sauvegardes quotidiennes chiffrées AES-256",
          ],
        },
        {
          code: "pack_business_3m",
          name: "Business Multi-Vendeurs",
          plan: "business",
          period_months: 3,
          amount_minor: 39900,
          currency: "XOF",
          display_price: "39 900 FCFA",
          is_launch_deal: true,
          original_price: "59 700 FCFA",
          max_senders: 3,
          features: [
            "Jusqu'à 3 Numéros WhatsApp (Gérant + 2 Vendeurs)",
            "Tout ce qui est inclus dans Starter",
            "Gestion des stocks en direct & alertes de rupture WhatsApp",
            "Suivi des créances & relances clients en 1-clic",
            "Export comptable complet Excel / PDF certifié",
            "Support prioritaire direct sur WhatsApp 7j/7",
          ],
        },
      ],
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err.message || "Erreur récupération statut." } },
      { status: 401 }
    );
  }
}
