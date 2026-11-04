import { describe, it, expect } from "vitest";
import {
  calculateSolvencyScore,
  getTierConfig,
  aggregateClientSolvency,
} from "../lib/credit/client-scoring";
import {
  generateStrategicPaymentReminder,
  cleanWhatsAppPhone,
} from "../lib/credit/whatsapp-reminder-engine";

describe("Client Solvency & Scoring Engine", () => {
  it("evaluates a perfect paying client with high score and Tier A+", () => {
    const score = calculateSolvencyScore({
      totalInvoiced: 2500000,
      totalPaid: 2500000,
      overdueCount: 0,
      maxOverdueDays: 0,
      totalSalesCount: 12,
    });

    expect(score).toBeGreaterThanOrEqual(90);
    const tier = getTierConfig(score);
    expect(tier.tier).toBe("A+");
    expect(tier.tierLabel).toBe("Client Exemplaire");
    expect(tier.defaultTone).toBe("proximity");
  });

  it("penalizes chronic overdue clients with Tier C or D", () => {
    const score = calculateSolvencyScore({
      totalInvoiced: 3000000,
      totalPaid: 500000,
      overdueCount: 4,
      maxOverdueDays: 60,
      totalSalesCount: 4,
    });

    expect(score).toBeLessThan(45);
    const tier = getTierConfig(score);
    expect(["C", "D"]).toContain(tier.tier);
    expect(tier.creditPolicy).toMatch(/obligatoire|strict/);
  });

  it("aggregates raw sales list into ranked client solvency metrics", () => {
    const rawSales = [
      {
        id: "s1",
        reference: "VTE-001",
        client_name: "Entreprise Baobab",
        client_phone: "+225 07 01 02 03 04",
        total_amount: 1000000,
        paid_amount: 1000000,
        due_date: "2026-10-15",
        sale_date: "2026-10-01",
      },
      {
        id: "s2",
        reference: "VTE-002",
        client_name: "Entreprise Baobab",
        client_phone: "+225 07 01 02 03 04",
        total_amount: 500000,
        paid_amount: 500000,
        due_date: "2026-11-01",
        sale_date: "2026-10-20",
      },
      {
        id: "s3",
        reference: "VTE-003",
        client_name: "Société Lagune",
        client_phone: "+225 05 55 66 77 88",
        total_amount: 800000,
        paid_amount: 100000,
        due_date: "2026-10-01", // Échue de plus de 30 jours au 04/11/2026
        sale_date: "2026-09-15",
      },
    ];

    const refDate = new Date("2026-11-04");
    const clients = aggregateClientSolvency(rawSales, refDate);

    expect(clients.length).toBe(2);

    // Client avec solde impayé (Société Lagune) arrive en premier
    const lagune = clients.find((c) => c.clientName === "Société Lagune")!;
    expect(lagune).toBeDefined();
    expect(lagune.totalOutstanding).toBe(700000);
    expect(lagune.overdueCount).toBe(1);
    expect(lagune.maxOverdueDays).toBeGreaterThan(30);
    expect(["B", "C", "D"]).toContain(lagune.tier);

    // Client Baobab a payé 100%
    const baobab = clients.find((c) => c.clientName === "Entreprise Baobab")!;
    expect(baobab).toBeDefined();
    expect(baobab.totalOutstanding).toBe(0);
    expect(baobab.paymentRatio).toBe(1);
    expect(baobab.tier).toBe("A+");
  });
});

describe("Strategic Multi-Tone WhatsApp Reminder Engine", () => {
  it("cleans phone numbers and formats WhatsApp links correctly", () => {
    expect(cleanWhatsAppPhone("+225 07 12 34 56")).toBe("22507123456");
    expect(cleanWhatsAppPhone(null)).toBe("");
  });

  it("generates Proximity tone with live SmartDoc link", () => {
    const res = generateStrategicPaymentReminder({
      clientName: "Ibrahim Traoré",
      clientPhone: "+225 07 00 11 22 33",
      reference: "FAC-2026-100",
      totalAmount: 450000,
      paidAmount: 150000,
      balanceDue: 300000,
      dueDate: "2026-10-25",
      overdueDays: 10,
      currency: "XOF",
      organizationName: "KORYXA Sarl",
      publicToken: "tok_test_456",
      tone: "proximity",
    });

    expect(res.subject).toContain("Nouvelles de KORYXA Sarl");
    expect(res.body).toContain("Ibrahim Traoré");
    expect(res.body).toContain("FCFA");
    expect(res.body).toContain("https://cauri.app/d/tok_test_456");
    expect(res.whatsappUrl).toContain("2250700112233");
    expect(res.hasSmartDoc).toBe(true);
  });

  it("generates Legal / Mise en demeure tone with stern legal phrasing", () => {
    const res = generateStrategicPaymentReminder({
      clientName: "SARL Horizon",
      clientPhone: "01020304",
      reference: "FAC-2026-999",
      totalAmount: 1200000,
      paidAmount: 0,
      overdueDays: 45,
      organizationName: "CAURI Group",
      tone: "legal",
    });

    expect(res.subject).toContain("MISE EN DEMEURE");
    expect(res.body).toContain("72 heures");
    expect(res.body).toContain("cabinet de recouvrement");
    expect(res.body).toContain("FCFA");
  });
});
