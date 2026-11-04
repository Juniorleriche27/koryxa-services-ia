/**
 * CAURI - Moteur de projection prédictive de trésorerie & simulateur What-If
 * Conçu pour les PME & TPE de l'UEMOA (FCFA / XOF) et multi-devises.
 */

export interface CashflowSummaryData {
  total_income_paid: number | string | null;
  total_income_unpaid: number | string | null;
  total_expenses_paid: number | string | null;
  total_expenses_unpaid: number | string | null;
  cash_movement_net: number | string | null;
  receivables_overdue: number | string | null;
  receivables_not_due: number | string | null;
  primary_currency: string;
}

export interface SimulationParams {
  additionalInflow: number; // Injection immédiate / acompte client (ex: +500 000 FCFA)
  deferExpensesDays: number; // Décalage de paiement fournisseurs (ex: 15 jours)
  expenseReductionPct: number; // Réduction des charges d'exploitation en % (ex: 15%)
  recoveryCollectionPct: number; // Taux d'encaissement des créances échues (0 à 100%)
}

export interface DailyProjectionPoint {
  date: string;
  dayIndex: number;
  dayLabel: string;
  baselineBalance: number;
  simulatedBalance: number;
  baselineInflow: number;
  baselineOutflow: number;
  simulatedInflow: number;
  simulatedOutflow: number;
  isDeficit: boolean;
}

export type TreasuryHealthStatus = "healthy" | "warning" | "danger";

export interface CashflowProjectionResult {
  currency: string;
  startingBalance: number;
  baselineRunwayDays: number;
  simulatedRunwayDays: number;
  deltaRunwayDays: number;
  dailyBurnRate: number;
  simulatedBurnRate: number;
  healthStatus: TreasuryHealthStatus;
  simulatedHealthStatus: TreasuryHealthStatus;
  minProjectedBalance: number;
  simulatedMinProjectedBalance: number;
  ruptureDayIndex: number | null;
  simulatedRuptureDayIndex: number | null;
  points: DailyProjectionPoint[];
  totalOverdueReceivables: number;
  totalPendingPayables: number;
}

export interface ReceivableItem {
  id: string;
  reference: string;
  client_name?: string | null;
  client_phone?: string | null;
  item_label?: string;
  total_amount: number | string;
  paid_amount?: number | string | null;
  due_date?: string | null;
  sale_date?: string;
  public_token?: string | null;
  currency?: string;
}

/**
 * Nettoie et convertit une valeur monétaire en nombre positif ou négatif
 */
export function parseMoney(val: unknown): number {
  if (val === null || val === undefined) return 0;
  const num = typeof val === "number" ? val : parseFloat(String(val).replace(/[^0-9.-]/g, ""));
  return isNaN(num) ? 0 : num;
}

/**
 * Formate un montant en FCFA / Devise avec séparateurs d'espaces insécables
 */
export function formatTreasuryMoney(amount: number, currency: string = "XOF"): string {
  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat("fr-FR", {
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(rounded);
  const currLabel = currency === "XOF" ? "FCFA" : currency;
  return `${formatted} ${currLabel}`;
}

/**
 * Détermine le statut de santé du Runway
 */
export function evaluateRunwayHealth(days: number): TreasuryHealthStatus {
  if (days > 30) return "healthy";
  if (days >= 10) return "warning";
  return "danger";
}

/**
 * Calcule le nombre de jours de retard d'une facture
 */
export function calculateDaysOverdue(dueDateStr?: string | null, referenceDate: Date = new Date()): number {
  if (!dueDateStr) return 0;
  const due = new Date(dueDateStr);
  if (isNaN(due.getTime())) return 0;
  const ref = new Date(referenceDate);
  ref.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffTime = ref.getTime() - due.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Génère le message WhatsApp de relance poli et percutant
 */
export function generateWhatsAppReminderMessage({
  clientName,
  reference,
  amountRemaining,
  currency = "FCFA",
  publicToken,
  daysOverdue,
  organizationName = "Notre Entreprise",
  baseUrl,
}: {
  clientName?: string | null;
  reference: string;
  amountRemaining: number;
  currency?: string;
  publicToken?: string | null;
  daysOverdue: number;
  organizationName?: string;
  baseUrl?: string;
}): string {
  const name = clientName?.trim() || "Cher Client";
  const currLabel = currency === "XOF" ? "FCFA" : currency;
  const formattedAmount = formatTreasuryMoney(amountRemaining, currLabel);
  const resolvedBaseUrl =
    baseUrl ||
    (typeof window !== "undefined" && window.location.origin && !window.location.origin.includes("localhost")
      ? window.location.origin
      : "https://cauri.app");
  const docLink = publicToken ? `${resolvedBaseUrl}/d/${publicToken}` : "";

  const overduePhrase =
    daysOverdue > 0
      ? `arrive à échéance depuis ${daysOverdue} jour${daysOverdue > 1 ? "s" : ""}`
      : "est en attente de règlement";

  let msg = `Bonjour ${name},\n\nSauf erreur ou omission de notre part, votre facture *${reference}* d'un montant de *${formattedAmount}* ${overduePhrase}.\n`;

  if (docLink) {
    msg += `\nVous pouvez consulter la facture détaillée, signer le bon ou effectuer le règlement sécurisé en 1 clic ici :\n👉 ${docLink}\n`;
  }

  msg += `\nRestant à votre entière disposition pour tout renseignement.\nCordialement,\n*${organizationName}*`;

  return msg;
}

/**
 * Moteur de calcul de la projection sur 30 jours et simulation What-If
 */
export function computeCashflowProjection(
  summary: Partial<CashflowSummaryData> | null,
  receivables: ReceivableItem[] = [],
  params?: Partial<SimulationParams>,
  currentDate: Date = new Date()
): CashflowProjectionResult {
  const currency = summary?.primary_currency || "XOF";
  const incomePaid = parseMoney(summary?.total_income_paid);
  const expensesPaid = parseMoney(summary?.total_expenses_paid);
  const rawNetMovement = parseMoney(summary?.cash_movement_net);

  // Solde de trésorerie disponible initial
  // Si le cash_movement_net est positif, on l'utilise comme base d'encaisse opérationnelle
  // Si vide, on prend la différence entre encaissements et décaissements
  const startingBalance = rawNetMovement !== 0 ? rawNetMovement : Math.max(0, incomePaid - expensesPaid);

  // Burn rate journalier calculé sur les décaissements déclarés
  // Hypothèse basée sur 30 jours d'exploitation. Si aucune dépense enregistrée, baseline par défaut de sécurité.
  const baselineMonthlyBurn = expensesPaid > 0 ? expensesPaid : 150000;
  const dailyBurnRate = Math.max(1000, Math.round(baselineMonthlyBurn / 30));

  // Paramètres de simulation What-If
  const addInflow = Math.max(0, params?.additionalInflow || 0);
  const deferDays = Math.max(0, Math.min(30, params?.deferExpensesDays || 0));
  const expenseRedPct = Math.max(-50, Math.min(50, params?.expenseReductionPct || 0));
  const recoveryPct = Math.max(0, Math.min(100, params?.recoveryCollectionPct || 0));

  // Burn rate simulé après réduction de charges
  const simulatedBurnRate = Math.max(500, Math.round(dailyBurnRate * (1 - expenseRedPct / 100)));

  // Cartographie des échéances de créances sur les 30 prochains jours
  const today = new Date(currentDate);
  today.setHours(0, 0, 0, 0);

  const baselineInflowsByDay: Record<number, number> = {};
  const simulatedInflowsByDay: Record<number, number> = {};

  let totalOverdue = parseMoney(summary?.receivables_overdue);
  let totalPendingPayables = parseMoney(summary?.total_expenses_unpaid);

  // Si on a des objets créances détaillés, on calcule précisément
  if (receivables.length > 0) {
    let overdueSum = 0;
    receivables.forEach((sale) => {
      const tot = parseMoney(sale.total_amount);
      const paid = parseMoney(sale.paid_amount);
      const remaining = Math.max(0, tot - paid);
      if (remaining <= 0) return;

      if (!sale.due_date) {
        // Sans date d'échéance : réparti doucement
        baselineInflowsByDay[7] = (baselineInflowsByDay[7] || 0) + remaining * 0.3;
        baselineInflowsByDay[21] = (baselineInflowsByDay[21] || 0) + remaining * 0.3;
        return;
      }

      const due = new Date(sale.due_date);
      due.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        // Échue / en retard
        overdueSum += remaining;
        // Dans le scénario simulé, le taux de recouvrement permet d'encaisser ces retards sur J+3 à J+10
        const recoveredPart = remaining * (recoveryPct / 100);
        simulatedInflowsByDay[5] = (simulatedInflowsByDay[5] || 0) + recoveredPart;
      } else if (diffDays <= 30) {
        baselineInflowsByDay[diffDays] = (baselineInflowsByDay[diffDays] || 0) + remaining;
        simulatedInflowsByDay[diffDays] = (simulatedInflowsByDay[diffDays] || 0) + remaining;
      }
    });

    if (overdueSum > 0) {
      totalOverdue = overdueSum;
    }
  } else if (totalOverdue > 0 && recoveryPct > 0) {
    // Si pas de liste individuelle mais totalOverdue connu, on simule son encaissement
    const recovered = totalOverdue * (recoveryPct / 100);
    simulatedInflowsByDay[5] = (simulatedInflowsByDay[5] || 0) + recovered;
  }

  // Construction des 31 points (J+0 à J+30)
  const points: DailyProjectionPoint[] = [];
  let currentBaseline = startingBalance;
  let currentSimulated = startingBalance + addInflow;

  let minBaseline = currentBaseline;
  let minSimulated = currentSimulated;
  let ruptureDayIndex: number | null = currentBaseline < 0 ? 0 : null;
  let simulatedRuptureDayIndex: number | null = currentSimulated < 0 ? 0 : null;

  for (let d = 0; d <= 30; d++) {
    const ptDate = new Date(today);
    ptDate.setDate(today.getDate() + d);
    const dateStr = ptDate.toISOString().slice(0, 10);
    const dayLabel = d === 0 ? "Aujourd'hui" : `J+${d}`;

    const bIn = baselineInflowsByDay[d] || 0;
    const sIn = (simulatedInflowsByDay[d] || 0) + (d === 0 ? addInflow : 0);

    const bOut = dailyBurnRate;
    // Si décalage de paiement fournisseurs, pendant les premiers `deferDays`, les sorties sont allégées
    const sOut = d < deferDays ? Math.round(simulatedBurnRate * 0.4) : simulatedBurnRate;

    if (d > 0) {
      currentBaseline = currentBaseline + bIn - bOut;
      currentSimulated = currentSimulated + sIn - sOut;
    }

    if (currentBaseline < minBaseline) minBaseline = currentBaseline;
    if (currentSimulated < minSimulated) minSimulated = currentSimulated;

    if (currentBaseline < 0 && ruptureDayIndex === null) {
      ruptureDayIndex = d;
    }
    if (currentSimulated < 0 && simulatedRuptureDayIndex === null) {
      simulatedRuptureDayIndex = d;
    }

    points.push({
      date: dateStr,
      dayIndex: d,
      dayLabel,
      baselineBalance: Math.round(currentBaseline),
      simulatedBalance: Math.round(currentSimulated),
      baselineInflow: Math.round(bIn),
      baselineOutflow: Math.round(bOut),
      simulatedInflow: Math.round(sIn),
      simulatedOutflow: Math.round(sOut),
      isDeficit: currentSimulated < 0,
    });
  }

  // Calcul du Runway en jours
  const baselineRunwayDays =
    ruptureDayIndex !== null
      ? ruptureDayIndex
      : dailyBurnRate > 0
      ? Math.max(0, Math.floor(startingBalance / dailyBurnRate))
      : 90;

  const simulatedRunwayDays =
    simulatedRuptureDayIndex !== null
      ? simulatedRuptureDayIndex
      : simulatedBurnRate > 0
      ? Math.max(0, Math.floor((startingBalance + addInflow) / simulatedBurnRate))
      : 90;

  const deltaRunwayDays = simulatedRunwayDays - baselineRunwayDays;
  const healthStatus = evaluateRunwayHealth(baselineRunwayDays);
  const simulatedHealthStatus = evaluateRunwayHealth(simulatedRunwayDays);

  return {
    currency,
    startingBalance,
    baselineRunwayDays,
    simulatedRunwayDays,
    deltaRunwayDays,
    dailyBurnRate,
    simulatedBurnRate,
    healthStatus,
    simulatedHealthStatus,
    minProjectedBalance: Math.round(minBaseline),
    simulatedMinProjectedBalance: Math.round(minSimulated),
    ruptureDayIndex,
    simulatedRuptureDayIndex,
    points,
    totalOverdueReceivables: totalOverdue,
    totalPendingPayables,
  };
}
