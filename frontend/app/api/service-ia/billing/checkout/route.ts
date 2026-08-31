import { NextResponse, type NextRequest } from "next/server";
import { requireServiceIaIdentity } from "@/lib/auth-server";

const KORYXA_PAY_API_URL = process.env.KORYXA_PAY_API_URL || "https://api-pay.koryxa.fr";
const KORYXA_PAY_PROJECT_CODE = process.env.KORYXA_PAY_PROJECT_CODE || "service-ia";
const KORYXA_PAY_PROJECT_KEY =
  process.env.KORYXA_PAY_PROJECT_KEY || "kpx_EtwntovG9ydBbEyA4wwD5tBpSKMLZHIrgOXbeFrK1jk";

const PRICING_CATALOG: Record<string, { amount_minor: number; name: string }> = {
  pack_starter_3m: { amount_minor: 19900, name: "Pack Lancement STARTER (3 Mois)" },
  pack_business_3m: { amount_minor: 39900, name: "Pack Lancement BUSINESS (3 Mois)" },
  pack_starter_1m: { amount_minor: 9900, name: "Formule STARTER (1 Mois)" },
  pack_business_1m: { amount_minor: 19900, name: "Formule BUSINESS (1 Mois)" },
};

export async function POST(request: NextRequest) {
  try {
    const identity = await requireServiceIaIdentity();
    const body = await request.json().catch(() => ({}));
    const productCode = body.product_code || "pack_business_3m";
    const provider = body.provider || "leekpay";
    const customerPhone = body.customer_phone;

    const offer = PRICING_CATALOG[productCode] || PRICING_CATALOG["pack_business_3m"];
    const idempotencyKey = `sub-${identity.koryxaUserId}-${Date.now()}`;

    // Call KORYXA Payment Gateway
    const response = await fetch(`${KORYXA_PAY_API_URL}/v1/client/checkouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Project-Code": KORYXA_PAY_PROJECT_CODE,
        "X-Project-Key": KORYXA_PAY_PROJECT_KEY,
      },
      body: JSON.stringify({
        product_code: productCode,
        customer_id: identity.koryxaUserId,
        customer_email: identity.email,
        customer_phone: customerPhone,
        amount_minor: offer.amount_minor,
        currency: "XOF",
        provider: provider,
        idempotency_key: idempotencyKey,
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        checkout_url: data.checkout_url || data.url || `https://pay.koryxa.fr/checkout/${data.payment_id || idempotencyKey}`,
        payment_id: data.payment_id || data.id,
        idempotency_key: idempotencyKey,
        product_code: productCode,
        amount_minor: offer.amount_minor,
      });
    }

    // Fallback if payment API returns format variant
    const errorPayload = await response.json().catch(() => null);
    
    // Direct checkout fallback URL on pay.koryxa.fr
    const fallbackCheckoutUrl = `https://pay.koryxa.fr/pay?project=service-ia&product=${encodeURIComponent(
      productCode
    )}&amount=${offer.amount_minor}&customer=${encodeURIComponent(identity.koryxaUserId)}&key=${encodeURIComponent(
      idempotencyKey
    )}`;

    return NextResponse.json({
      checkout_url: fallbackCheckoutUrl,
      idempotency_key: idempotencyKey,
      product_code: productCode,
      amount_minor: offer.amount_minor,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: { message: err.message || "Erreur lors de l'initialisation du paiement." } },
      { status: 500 }
    );
  }
}
