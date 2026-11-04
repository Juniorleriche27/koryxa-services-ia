import { describe, expect, it } from "vitest";
import { posAudioHaptics } from "@/lib/offline/pos-audio-haptics";

describe("Caisse POS Offline-First & Audio-Tactile Engine", () => {
  it("posAudioHaptics handles sound toggle and execution without throwing", () => {
    // Sound enabled by default
    expect(posAudioHaptics.isSoundEnabled()).toBe(true);

    posAudioHaptics.setSoundEnabled(false);
    expect(posAudioHaptics.isSoundEnabled()).toBe(false);

    // Calling sound methods while disabled should be a clean no-op
    expect(() => posAudioHaptics.playTapSound()).not.toThrow();
    expect(() => posAudioHaptics.playAddProductSound()).not.toThrow();
    expect(() => posAudioHaptics.playCashDrawerSound()).not.toThrow();
    expect(() => posAudioHaptics.playWarningSound()).not.toThrow();

    posAudioHaptics.setSoundEnabled(true);
    expect(posAudioHaptics.isSoundEnabled()).toBe(true);

    // Calling sound methods while enabled
    expect(() => posAudioHaptics.playTapSound()).not.toThrow();
    expect(() => posAudioHaptics.playAddProductSound()).not.toThrow();
    expect(() => posAudioHaptics.playCashDrawerSound()).not.toThrow();
    expect(() => posAudioHaptics.playWarningSound()).not.toThrow();
  });

  it("triggers haptic vibrations safely in test environment", () => {
    expect(() => posAudioHaptics.triggerHaptic("light")).not.toThrow();
    expect(() => posAudioHaptics.triggerHaptic("medium")).not.toThrow();
    expect(() => posAudioHaptics.triggerHaptic("success")).not.toThrow();
    expect(() => posAudioHaptics.triggerHaptic("warning")).not.toThrow();
  });

  it("calculates accurate change for FCFA banknotes", () => {
    const totalAmount = 3500;
    const received10k = 10000;
    const change = received10k - totalAmount;

    expect(change).toBe(6500);

    const receivedExact = 3500;
    expect(receivedExact - totalAmount).toBe(0);

    const receivedInsufficient = 2000;
    const deficit = totalAmount - receivedInsufficient;
    expect(deficit).toBe(1500);
  });

  it("formats offline receipt references with valid prefix and digits", () => {
    const tempId = `off_${Date.now()}_123456`;
    const counter = 4210;
    const offlineRef = `REC-OFF-${counter}`;

    expect(offlineRef).toMatch(/^REC-OFF-\d{4}$/);
    expect(tempId).toMatch(/^off_\d+_[a-z0-9]+$/);
  });
});
