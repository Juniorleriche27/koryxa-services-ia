/**
 * CAURI - Règle du Double Contrôle (Four-Eyes Principle) & Autorisations Sensibles
 * Empêche les fraudes internes, remises abusives et décaissements non autorisés.
 */

export interface FourEyesPolicyConfig {
  expenseThresholdFcfa: number; // Ex: 100 000 FCFA
  discountThresholdPct: number; // Ex: 15%
  cancellationRequiresApproval: boolean; // Annulation de vente validée
}

export const DEFAULT_FOUR_EYES_POLICY: FourEyesPolicyConfig = {
  expenseThresholdFcfa: 100000,
  discountThresholdPct: 15,
  cancellationRequiresApproval: true,
};

export interface SensitiveOperationAssessment {
  requiresApproval: boolean;
  reason: string | null;
  severity: "low" | "medium" | "high" | "critical";
  ruleCode: string | null;
}

/**
 * Analyse une opération pour déterminer si elle déclenche obligatoirement le Double Contrôle
 */
export function assessFourEyesRequirement(
  operation: {
    type: "expense" | "discount" | "cancellation" | "stock_adjustment" | "sale_modification";
    amount?: number;
    discountPct?: number;
    description?: string;
  },
  policy: FourEyesPolicyConfig = DEFAULT_FOUR_EYES_POLICY
): SensitiveOperationAssessment {
  // 1. Dépense excédant le plafond autorisé
  if (operation.type === "expense" && operation.amount !== undefined) {
    if (operation.amount >= policy.expenseThresholdFcfa) {
      return {
        requiresApproval: true,
        reason: `Décaissement de ${operation.amount.toLocaleString("fr-FR")} FCFA supérieur au seuil d'alerte (${policy.expenseThresholdFcfa.toLocaleString("fr-FR")} FCFA)`,
        severity: operation.amount >= policy.expenseThresholdFcfa * 3 ? "critical" : "high",
        ruleCode: "EXPENSE_OVER_THRESHOLD",
      };
    }
  }

  // 2. Remise commerciale exceptionnelle
  if (operation.type === "discount" && operation.discountPct !== undefined) {
    if (operation.discountPct >= policy.discountThresholdPct) {
      return {
        requiresApproval: true,
        reason: `Remise commerciale de ${operation.discountPct}% supérieure au maximum autorisé sans visa (${policy.discountThresholdPct}%)`,
        severity: operation.discountPct >= 30 ? "critical" : "medium",
        ruleCode: "DISCOUNT_OVER_LIMIT",
      };
    }
  }

  // 3. Annulation d'une facture déjà validée
  if (operation.type === "cancellation" && policy.cancellationRequiresApproval) {
    return {
      requiresApproval: true,
      reason: "Annulation d'une transaction validée : visa de contrôle obligatoire",
      severity: "high",
      ruleCode: "TRANSACTION_CANCELLATION",
    };
  }

  return {
    requiresApproval: false,
    reason: null,
    severity: "low",
    ruleCode: null,
  };
}

/**
 * Vérifie si un utilisateur est habilité à valider une opération dans le cadre du Double Contrôle
 * Règle d'or : le créateur d'une transaction ne peut jamais s'auto-approuver
 */
export function validateApproverIdentity({
  creatorUserId,
  approverUserId,
  approverRole,
}: {
  creatorUserId: string;
  approverUserId: string;
  approverRole?: string;
}): { canApprove: boolean; refusalReason: string | null } {
  if (creatorUserId && approverUserId && creatorUserId.trim() === approverUserId.trim()) {
    return {
      canApprove: false,
      refusalReason: "Principe du Double Contrôle : L'auteur de l'opération ne peut pas s'auto-valider.",
    };
  }

  // Les rôles habilités au second regard sont admin, manager, owner
  const validRoles = ["owner", "admin", "manager", "supervisor", "comptable"];
  if (approverRole && !validRoles.includes(approverRole.toLowerCase())) {
    return {
      canApprove: false,
      refusalReason: "Votre rôle ne dispose pas de l'habilitation de Double Contrôle.",
    };
  }

  return {
    canApprove: true,
    refusalReason: null,
  };
}
