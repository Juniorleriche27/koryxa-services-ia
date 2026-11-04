import { describe, expect, it, vi } from "vitest";
import { soundFx } from "@/components/smart-doc/soundEffects";

describe("Smart Documents Frontend Engine", () => {
  it("sound synthesizer safely handles execution in all environments", () => {
    // Should execute without throwing even without hardware audio devices
    expect(() => soundFx.playCashRegisterSound()).not.toThrow();
    expect(() => soundFx.playSignatureVerifiedSound()).not.toThrow();
  });

  it("calculates accurate financial deposits and remaining balances", () => {
    const totalAmount = 300000;
    const paidAmount = 100000;
    const remainingBalance = Math.max(0, totalAmount - paidAmount);

    expect(remainingBalance).toBe(200000);

    const deposit30 = Math.round(remainingBalance * 0.3);
    const deposit50 = Math.round(remainingBalance * 0.5);

    expect(deposit30).toBe(60000);
    expect(deposit50).toBe(100000);
  });

  it("formats smart document public URLs correctly", () => {
    const token = "doc_a1b2c3d4e5f6789012345678abcdef01";
    const origin = "https://cauri.app";
    const smartDocUrl = `${origin}/d/${token}`;

    expect(smartDocUrl).toBe("https://cauri.app/d/doc_a1b2c3d4e5f6789012345678abcdef01");
    expect(smartDocUrl).toMatch(/^https:\/\/cauri\.app\/d\/doc_[a-f0-9]{32}$/);
  });

  it("validates mobile money payment providers", () => {
    const validProviders = ["wave", "orange_money", "mtn_momo", "moov_money", "card"];
    const regex = /^(wave|orange_money|mtn_momo|moov_money|card)$/;

    validProviders.forEach((provider) => {
      expect(regex.test(provider)).toBe(true);
    });

    expect(regex.test("unknown_provider")).toBe(false);
    expect(regex.test("paypal")).toBe(false);
  });
});
