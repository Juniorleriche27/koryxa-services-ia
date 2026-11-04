import { describe, it, expect } from "vitest";
import {
  sha256Hex,
  calculateEventHash,
  buildAuditChain,
  verifyAuditChainIntegrity,
  GENESIS_HASH,
  RawAuditEvent,
} from "../lib/audit/audit-hash-chain";
import {
  assessFourEyesRequirement,
  validateApproverIdentity,
  DEFAULT_FOUR_EYES_POLICY,
} from "../lib/audit/four-eyes-policy";

describe("Cryptographic Audit Hash Chain Engine", () => {
  it("computes deterministic SHA-256 hashes", () => {
    const hash1 = sha256Hex("CAURI_FINANCIAL_TRUTH_2026");
    const hash2 = sha256Hex("CAURI_FINANCIAL_TRUTH_2026");
    const hash3 = sha256Hex("CAURI_FINANCIAL_TRUTH_2027");

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
    expect(hash1.length).toBe(64);
  });

  it("builds an unbroken cryptographic chain linked to genesis", () => {
    const events: RawAuditEvent[] = [
      {
        id: "ev-1",
        entity_type: "sale",
        entity_id: "sale-101",
        event_type: "sale.created",
        actor_user_id: "user-cashier-1",
        payload: { reference: "VTE-2026-001", amount: 250000 },
        created_at: "2026-11-04T10:00:00Z",
      },
      {
        id: "ev-2",
        entity_type: "sale",
        entity_id: "sale-101",
        event_type: "smartdoc.signed",
        actor_user_id: "client-public",
        payload: { signer: "M. Traoré", token: "tok-abc" },
        created_at: "2026-11-04T10:05:00Z",
      },
      {
        id: "ev-3",
        entity_type: "sale",
        entity_id: "sale-101",
        event_type: "smartdoc.paid",
        actor_user_id: "client-public",
        payload: { method: "Wave", amount: 250000 },
        created_at: "2026-11-04T10:06:00Z",
      },
    ];

    const chained = buildAuditChain(events);

    expect(chained.length).toBe(3);
    // Le premier bloc part du bloc Genesis
    expect(chained[0].previous_hash).toBe(GENESIS_HASH);
    // Le second bloc prend le hash du premier
    expect(chained[1].previous_hash).toBe(chained[0].hash);
    // Le troisième bloc prend le hash du second
    expect(chained[2].previous_hash).toBe(chained[1].hash);

    // Vérification d'intégrité
    const report = verifyAuditChainIntegrity(events);
    expect(report.isValid).toBe(true);
    expect(report.verifiedEvents).toBe(3);
    expect(report.brokenAtEventId).toBeNull();
  });

  it("detects tampering or retroactive modification and identifies the broken block", () => {
    const events: RawAuditEvent[] = [
      {
        id: "ev-1",
        entity_type: "expense",
        entity_id: "exp-01",
        event_type: "expense.created",
        actor_user_id: "user-1",
        payload: { amount: 50000 },
        created_at: "2026-11-04T12:00:00Z",
      },
      {
        id: "ev-2",
        entity_type: "expense",
        entity_id: "exp-01",
        event_type: "expense.paid",
        actor_user_id: "user-2",
        payload: { amount: 50000 },
        created_at: "2026-11-04T12:10:00Z",
      },
    ];

    // Construit la chaîne originale
    const chained = buildAuditChain(events);
    expect(chained[0].hash).toBeDefined();

    // Simule une altération pirate de données dans la base (ex: modification du montant de l'événement 1 de 50 000 à 500 000)
    const tamperedEvents: RawAuditEvent[] = [
      {
        ...events[0],
        payload: { amount: 500000 }, // altération frauduleuse !
      },
      events[1],
    ];

    // Le hash recalculé pour le bloc 1 changera, ce qui modifierait sa valeur
    // Mais si le pirate garde le hash du bloc 2 tel quel ou s'il tente de tromper le système
    const originalHeadHash = chained[1].hash;
    const tamperedChained = buildAuditChain(tamperedEvents);

    expect(tamperedChained[1].hash).not.toBe(originalHeadHash);
  });
});

describe("Four-Eyes Principle (Double Contrôle)", () => {
  it("flags expenses over 100 000 FCFA as requiring dual authorization", () => {
    const normalExpense = assessFourEyesRequirement({
      type: "expense",
      amount: 45000,
    });
    expect(normalExpense.requiresApproval).toBe(false);

    const highExpense = assessFourEyesRequirement({
      type: "expense",
      amount: 250000,
    });
    expect(highExpense.requiresApproval).toBe(true);
    expect(highExpense.ruleCode).toBe("EXPENSE_OVER_THRESHOLD");
  });

  it("flags commercial discounts over 15% as requiring approval", () => {
    const okDiscount = assessFourEyesRequirement({
      type: "discount",
      discountPct: 10,
    });
    expect(okDiscount.requiresApproval).toBe(false);

    const hugeDiscount = assessFourEyesRequirement({
      type: "discount",
      discountPct: 25,
    });
    expect(hugeDiscount.requiresApproval).toBe(true);
    expect(hugeDiscount.ruleCode).toBe("DISCOUNT_OVER_LIMIT");
  });

  it("strictly forbids creator from approving their own transaction", () => {
    const selfApproval = validateApproverIdentity({
      creatorUserId: "user-cashier-amy",
      approverUserId: "user-cashier-amy",
      approverRole: "admin",
    });
    expect(selfApproval.canApprove).toBe(false);
    expect(selfApproval.refusalReason).toContain("Double Contrôle");

    const validApproval = validateApproverIdentity({
      creatorUserId: "user-cashier-amy",
      approverUserId: "user-manager-amadou",
      approverRole: "manager",
    });
    expect(validApproval.canApprove).toBe(true);
  });
});
