import { describe, it, expect } from "vitest";
import {
  computeCashflowProjection,
  evaluateRunwayHealth,
  calculateDaysOverdue,
  generateWhatsAppReminderMessage,
  formatTreasuryMoney,
  parseMoney,
} from "../lib/radar/cashflow-projection";

describe("Cashflow Projection & Radar Engine", () => {
  it("correctly parses money and formats FCFA strings", () => {
    expect(parseMoney("250 000")).toBe(250000);
    expect(parseMoney("-50 000")).toBe(-50000);
    expect(parseMoney(null)).toBe(0);
    expect(parseMoney(undefined)).toBe(0);
    expect(formatTreasuryMoney(500000, "XOF")).toContain("500");
    expect(formatTreasuryMoney(500000, "XOF")).toContain("FCFA");
  });

  it("correctly evaluates runway health status", () => {
    expect(evaluateRunwayHealth(45)).toBe("healthy");
    expect(evaluateRunwayHealth(31)).toBe("healthy");
    expect(evaluateRunwayHealth(25)).toBe("warning");
    expect(evaluateRunwayHealth(10)).toBe("warning");
    expect(evaluateRunwayHealth(9)).toBe("danger");
    expect(evaluateRunwayHealth(0)).toBe("danger");
  });

  it("calculates overdue days accurately based on due dates", () => {
    const today = new Date("2026-11-04");
    expect(calculateDaysOverdue("2026-11-01", today)).toBe(3);
    expect(calculateDaysOverdue("2026-11-04", today)).toBe(0);
    expect(calculateDaysOverdue("2026-11-10", today)).toBe(0);
    expect(calculateDaysOverdue(null, today)).toBe(0);
  });

  it("generates professional WhatsApp reminder message with live smart document link", () => {
    const msg = generateWhatsAppReminderMessage({
      clientName: "Amadou Diallo",
      reference: "FAC-2026-089",
      amountRemaining: 350000,
      currency: "XOF",
      publicToken: "tok_secure_abc123",
      daysOverdue: 14,
      organizationName: "KORYXA Sarl",
    });

    expect(msg).toContain("Amadou Diallo");
    expect(msg).toContain("FAC-2026-089");
    expect(msg).toContain("14 jours");
    expect(msg).toContain("https://cauri.app/d/tok_secure_abc123");
    expect(msg).toContain("KORYXA Sarl");
  });

  it("computes 30-day projection with baseline and simulated What-If scenarios", () => {
    const summary = {
      total_income_paid: 1500000,
      total_expenses_paid: 600000,
      cash_movement_net: 900000,
      receivables_overdue: 400000,
      receivables_not_due: 300000,
      total_expenses_unpaid: 200000,
      primary_currency: "XOF",
    };

    const receivables = [
      {
        id: "sale-1",
        reference: "VTE-001",
        client_name: "Société Alpha",
        total_amount: 400000,
        paid_amount: 0,
        due_date: "2026-10-20", // overdue
        public_token: "tok-alpha",
      },
      {
        id: "sale-2",
        reference: "VTE-002",
        client_name: "Client Beta",
        total_amount: 300000,
        paid_amount: 0,
        due_date: "2026-11-14", // J+10
        public_token: "tok-beta",
      },
    ];

    const refDate = new Date("2026-11-04");

    // Baseline projection (no simulation)
    const baseProj = computeCashflowProjection(summary, receivables, {}, refDate);

    expect(baseProj.startingBalance).toBe(900000);
    expect(baseProj.points.length).toBe(31);
    expect(baseProj.dailyBurnRate).toBe(20000); // 600000 / 30
    expect(baseProj.baselineRunwayDays).toBe(45); // 900000 / 20000
    expect(baseProj.healthStatus).toBe("healthy");

    // What-If Simulation: add 500k cash + recover 50% of overdue + reduce expenses by 20%
    const simProj = computeCashflowProjection(
      summary,
      receivables,
      {
        additionalInflow: 500000,
        recoveryCollectionPct: 50,
        expenseReductionPct: 20,
        deferExpensesDays: 10,
      },
      refDate
    );

    expect(simProj.simulatedBurnRate).toBe(16000); // 20000 * 0.8
    expect(simProj.simulatedRunwayDays).toBeGreaterThan(baseProj.baselineRunwayDays);
    expect(simProj.deltaRunwayDays).toBeGreaterThan(0);
    // On Day 0, simulated balance should have +500 000
    expect(simProj.points[0].simulatedBalance).toBe(1400000);
  });

  it("handles low or zero initial cash by flagging immediate rupture danger", () => {
    const summary = {
      total_income_paid: 100000,
      total_expenses_paid: 300000,
      cash_movement_net: -200000, // Deficit
      receivables_overdue: 0,
      receivables_not_due: 0,
      primary_currency: "XOF",
    };

    const proj = computeCashflowProjection(summary, [], {}, new Date("2026-11-04"));

    expect(proj.healthStatus).toBe("danger");
    expect(proj.ruptureDayIndex).toBe(0);
  });
});
