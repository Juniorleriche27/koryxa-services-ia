/**
 * Web Audio API synthesizer for instant audio feedback on CAURI Smart Documents.
 * Generates an executive cash-register chime ("K-Ching") and success tones
 * without relying on external assets or network requests.
 */

class SoundSynthesizer {
  private ctx: AudioContext | null = null;

  private getContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    try {
      if (!this.ctx) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }
      }
      if (this.ctx && this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  /**
   * Cash register "Ka-Ching" sound simulation:
   * 1. Short mechanical click (drawer opening)
   * 2. High metallic bell resonance (two clear harmonic frequencies: 1568Hz & 2093Hz)
   */
  public playCashRegisterSound(): void {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // 1. Mechanical slide/click
      const clickOsc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      clickOsc.type = "square";
      clickOsc.frequency.setValueAtTime(320, now);
      clickOsc.frequency.exponentialRampToValueAtTime(120, now + 0.05);

      clickGain.gain.setValueAtTime(0.18, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      clickOsc.connect(clickGain);
      clickGain.connect(ctx.destination);
      clickOsc.start(now);
      clickOsc.stop(now + 0.06);

      // 2. High bell tone 1 (G6 = 1568 Hz)
      const bell1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      bell1.type = "sine";
      bell1.frequency.setValueAtTime(1568, now + 0.04);

      gain1.gain.setValueAtTime(0, now);
      gain1.gain.setValueAtTime(0.35, now + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

      bell1.connect(gain1);
      gain1.connect(ctx.destination);
      bell1.start(now + 0.04);
      bell1.stop(now + 0.86);

      // 3. Bell overtone 2 (C7 = 2093 Hz)
      const bell2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      bell2.type = "sine";
      bell2.frequency.setValueAtTime(2093, now + 0.06);

      gain2.gain.setValueAtTime(0, now);
      gain2.gain.setValueAtTime(0.28, now + 0.06);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

      bell2.connect(gain2);
      gain2.connect(ctx.destination);
      bell2.start(now + 0.06);
      bell2.stop(now + 1.12);
    } catch {
      // Audio autoplay policy or hardware muted
    }
  }

  /**
   * Harmonic pleasant chime for validated signature.
   */
  public playSignatureVerifiedSound(): void {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio

      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.08;

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.2, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.46);
      });
    } catch {
      // Ignore
    }
  }
}

export const soundFx = new SoundSynthesizer();
