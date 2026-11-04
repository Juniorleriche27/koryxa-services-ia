/**
 * CAURI - Moteur de Scoring de Solvabilité Client & Recommandations de Crédit
 * Spécialement adapté aux PME/TPE du commerce africain (UEMOA / FCFA).
 */

import { formatTreasuryMoney, parseMoney } from "../radar/cashflow-projection";

export type CreditTier = "A+" | "A" | "B" | "C" | "D";

export interface ClientSolvencyMetrics {
  clientKey: string;
  clientName: string;
  clientPhone?: string | null;
  clientEmail?: string | null;
  totalSalesCount: number;
  totalInvoiced: number;
  totalPaid: number;
  totalOutstanding: number;
  overdueCount: number;
  maxOverdueDays: number;
  avgOverdueDays: number;
  paymentRatio: number; // 0 à 1
  lastSaleDate?: string | null;
  solvencyScore: number; // 0 à 100
  tier: CreditTier;
  tierLabel: string;
  tierColor: string;
  tierBg: string;
  tierBorder: string;
  creditPolicy: string;
  maxRecommendedCredit: number; // Montant max d'encours recommandé en FCFA
  recommendedReminderTone: "proximity" | "courteous" | "firm" | "legal";
  sales: Array<{
    id: string;
    reference: string;
    total_amount: number | string;
    paid_amount?: number | string | null;
    due_date?: string | null;
    sale_date: string;
    public_token?: string | null;
    currency?: string;
  }>;
}

export interface RawSaleItem {
  id: string;
  reference: string;
  client_name?: string | null;
  client_phone?: string | null;
  client_email?: string | null;
  total_amount: number | string;
  paid_amount?: number | string | null;
  due_date?: string | null;
  sale_date: string;
  payment_status?: string;
  public_token?: string | null;
  currency?: string;
}

/**
 * Attribue le rang et les paramètres de politique de crédit en fonction du score (0 à 100)
 */
export function getTierConfig(score: number): {
  tier: CreditTier;
  tierLabel: string;
  tierColor: string;
  tierBg: string;
  tierBorder: string;
  creditPolicy: string;
  defaultTone: "proximity" | "courteous" | "firm" | "legal";
} {
  if (score >= 90) {
    return {
      tier: "A+",
      tierLabel: "Client Exemplaire",
      tierColor: "#15803d",
      tierBg: "rgba(34, 197, 94, 0.12)",
      tierBorder: "rgba(34, 197, 94, 0.35)",
      creditPolicy: "Crédit 30 à 45 jours autorisé sans acompte. Client prioritaire.",
      defaultTone: "proximity",
    };
  }
  if (score >= 75) {
    return {
      tier: "A",
      tierLabel: "Client Fiable",
      tierColor: "#16a34a",
      tierBg: "rgba(22, 163, 74, 0.12)",
      tierBorder: "rgba(22, 163, 74, 0.3)",
      creditPolicy: "Crédit standard 15 à 30 jours. Acompte de 20% suggéré sur gros montants.",
      defaultTone: "courteous",
    };
  }
  if (score >= 55) {
    return {
      tier: "B",
      tierLabel: "Vigilance Modérée",
      tierColor: "#d97706",
      tierBg: "rgba(245, 158, 11, 0.12)",
      tierBorder: "rgba(245, 158, 11, 0.35)",
      creditPolicy: "Acompte minimum 30% à 50% obligatoire à la commande. Relance dès J+2.",
      defaultTone: "courteous",
    };
  }
  if (score >= 35) {
    return {
      tier: "C",
      tierLabel: "Risque Élevé",
      tierColor: "#ea580c",
      tierBg: "rgba(234, 88, 12, 0.12)",
      tierBorder: "rgba(234, 88, 12, 0.35)",
      creditPolicy: "Acompte 70% obligatoire. Aucune livraison sans preuve de virement.",
      defaultTone: "firm",
    };
  }
  return {
    tier: "D",
    tierLabel: "Contentieux / Risque Majeur",
    tierColor: "#dc2626",
    tierBg: "rgba(239, 68, 68, 0.12)",
    tierBorder: "rgba(239, 68, 68, 0.35)",
    creditPolicy: "Comptant 100% strict exigé avant préparation. Bloquer les encours.",
    defaultTone: "legal",
  };
}

/**
 * Calcule le Score de Solvabilité mathématique (0 à 100)
 */
export function calculateSolvencyScore({
  totalInvoiced,
  totalPaid,
  overdueCount,
  maxOverdueDays,
  totalSalesCount,
}: {
  totalInvoiced: number;
  totalPaid: number;
  overdueCount: number;
  maxOverdueDays: number;
  totalSalesCount: number;
}): number {
  if (totalInvoiced <= 0) return 50; // Nouveau client sans historique

  // 1. Ratio de paiement historique (45 points max)
  const paymentRatio = Math.max(0, Math.min(1, totalPaid / totalInvoiced));
  const ratioPoints = Math.round(paymentRatio * 45);

  // 2. Ponctualité & Retard max constaté (35 points max)
  let punctualityPoints = 35;
  if (overdueCount > 0) {
    if (maxOverdueDays > 45) {
      punctualityPoints = 0;
    } else if (maxOverdueDays > 30) {
      punctualityPoints = 8;
    } else if (maxOverdueDays > 15) {
      punctualityPoints = 18;
    } else if (maxOverdueDays > 7) {
      punctualityPoints = 25;
    } else {
      punctualityPoints = 30;
    }
  }

  // 3. Bonus d'ancienneté / récurrence (15 points max)
  let loyaltyPoints = 5;
  if (totalSalesCount >= 10) {
    loyaltyPoints = 15;
  } else if (totalSalesCount >= 4) {
    loyaltyPoints = 12;
  } else if (totalSalesCount >= 2) {
    loyaltyPoints = 8;
  }

  // 4. Bonus bonus si zéro impayé en cours (5 points)
  const remaining = totalInvoiced - totalPaid;
  const zeroOutstandingBonus = remaining <= 0 ? 5 : 0;

  const rawScore = ratioPoints + punctualityPoints + loyaltyPoints + zeroOutstandingBonus;
  return Math.max(5, Math.min(100, rawScore));
}

/**
 * Agrège un portefeuille de ventes pour calculer la solvabilité par client
 */
export function aggregateClientSolvency(
  sales: RawSaleItem[],
  referenceDate: Date = new Date()
): ClientSolvencyMetrics[] {
  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);

  const clientMap = new Map<
    string,
    {
      name: string;
      phone: string | null;
      email: string | null;
      sales: RawSaleItem[];
    }
  >();

  sales.forEach((s) => {
    const rawName = s.client_name?.trim() || "Client Divers";
    const rawPhone = s.client_phone?.trim() || null;
    // Clef unique basée sur le téléphone en priorité, ou le nom
    const key = rawPhone ? rawPhone.replace(/[^0-9]/g, "") : rawName.toLowerCase();

    if (!clientMap.has(key)) {
      clientMap.set(key, {
        name: rawName,
        phone: rawPhone,
        email: s.client_email || null,
        sales: [],
      });
    }

    const entry = clientMap.get(key)!;
    entry.sales.push(s);
    if (!entry.phone && rawPhone) entry.phone = rawPhone;
    if (!entry.email && s.client_email) entry.email = s.client_email;
  });

  const results: ClientSolvencyMetrics[] = [];

  clientMap.forEach((entry, key) => {
    let totalInvoiced = 0;
    let totalPaid = 0;
    let overdueCount = 0;
    let maxOverdueDays = 0;
    let sumOverdueDays = 0;
    let lastSaleDate: string | null = null;

    entry.sales.forEach((s) => {
      const tot = parseMoney(s.total_amount);
      const paid = parseMoney(s.paid_amount);
      const remaining = Math.max(0, tot - paid);

      totalInvoiced += tot;
      totalPaid += paid;

      if (!lastSaleDate || (s.sale_date && s.sale_date > lastSaleDate)) {
        lastSaleDate = s.sale_date;
      }

      if (remaining > 0 && s.due_date) {
        const due = new Date(s.due_date);
        due.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((ref.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays > 0) {
          overdueCount++;
          sumOverdueDays += diffDays;
          if (diffDays > maxOverdueDays) maxOverdueDays = diffDays;
        }
      }
    });

    const totalOutstanding = Math.max(0, totalInvoiced - totalPaid);
    const avgOverdueDays = overdueCount > 0 ? Math.round(sumOverdueDays / overdueCount) : 0;
    const paymentRatio = totalInvoiced > 0 ? totalPaid / totalInvoiced : 1;

    const score = calculateSolvencyScore({
      totalInvoiced,
      totalPaid,
      overdueCount,
      maxOverdueDays,
      totalSalesCount: entry.sales.length,
    });

    const tierInfo = getTierConfig(score);

    // Calcul du plafond de crédit recommandé (entre 20% et 120% de la moyenne facturée)
    const avgSaleAmount = totalInvoiced / (entry.sales.length || 1);
    const multiplier =
      tierInfo.tier === "A+"
        ? 2.5
        : tierInfo.tier === "A"
        ? 1.5
        : tierInfo.tier === "B"
        ? 0.8
        : tierInfo.tier === "C"
        ? 0.3
        : 0;

    const maxRecommendedCredit = Math.round(avgSaleAmount * multiplier);

    results.push({
      clientKey: key,
      clientName: entry.name,
      clientPhone: entry.phone,
      clientEmail: entry.email,
      totalSalesCount: entry.sales.length,
      totalInvoiced: Math.round(totalInvoiced),
      totalPaid: Math.round(totalPaid),
      totalOutstanding: Math.round(totalOutstanding),
      overdueCount,
      maxOverdueDays,
      avgOverdueDays,
      paymentRatio: Number(paymentRatio.toFixed(2)),
      lastSaleDate,
      solvencyScore: score,
      tier: tierInfo.tier,
      tierLabel: tierInfo.tierLabel,
      tierColor: tierInfo.tierColor,
      tierBg: tierInfo.tierBg,
      tierBorder: tierInfo.tierBorder,
      creditPolicy: tierInfo.creditPolicy,
      maxRecommendedCredit,
      recommendedReminderTone: tierInfo.defaultTone,
      sales: entry.sales,
    });
  });

  // Tri par risque : en retard en premier, puis solde dû décroissant
  return results.sort((a, b) => b.totalOutstanding - a.totalOutstanding || a.solvencyScore - b.solvencyScore);
}
