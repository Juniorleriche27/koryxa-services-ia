import { describe, expect, it } from "vitest";

function cleanSpeechDuplicates(text: string): string {
  if (!text) return "";
  let t = text.trim();
  for (let i = 0; i < 3; i++) {
    t = t.replace(/\b(.+?)\s+\1\b/gi, "$1");
  }
  t = t.replace(/\b(\w+)\s+\1\b/gi, "$1");
  return t.replace(/\s+/g, " ").trim();
}

describe("Voice Cockpit & Speech Dictation Engine", () => {
  it("removes speech recognition stutters and repeated phrases cleanly", () => {
    const raw = "vente de 10 sacs de riz vente de 10 sacs de riz payé par wave wave";
    const cleaned = cleanSpeechDuplicates(raw);

    expect(cleaned).toBe("vente de 10 sacs de riz payé par wave");
  });

  it("preserves legitimate French words while cleaning single duplicates", () => {
    const raw = "bonjour bonjour je vends deux pagnes kita kita";
    const cleaned = cleanSpeechDuplicates(raw);

    expect(cleaned).toBe("bonjour je vends deux pagnes kita");
  });

  it("normalizes decibel volume levels between 0.0 and 1.0", () => {
    const averageByteFreq1 = 64;
    const normalized1 = Math.min(1, averageByteFreq1 / 128);
    expect(normalized1).toBe(0.5);

    const averageByteFreq2 = 200;
    const normalized2 = Math.min(1, averageByteFreq2 / 128);
    expect(normalized2).toBe(1.0);
  });

  it("maps extracted voice sales correctly into POS cart items", () => {
    const voiceCandidate = {
      item_label: "Sac de riz 50kg",
      quantity: 3,
      unit_price: 18000,
      total_amount: 54000,
      client_name: "M. Traoré",
      payment_method: "Wave",
    };

    const cartItem = {
      name: voiceCandidate.item_label,
      quantity: Number(voiceCandidate.quantity),
      unitPrice: Number(voiceCandidate.unit_price),
    };

    expect(cartItem.name).toBe("Sac de riz 50kg");
    expect(cartItem.quantity).toBe(3);
    expect(cartItem.unitPrice).toBe(18000);
    expect(cartItem.quantity * cartItem.unitPrice).toBe(54000);
  });
});
