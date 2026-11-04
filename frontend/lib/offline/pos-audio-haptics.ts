/**
 * Audio-Tactile Feedback Engine for CAURI Caisse POS.
 * Combines zero-dependency Web Audio API sound synthesis and mobile haptic vibrations
 * to provide instant, tactile physical feedback to cashiers.
 */

class PosAudioHapticsEngine {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private hapticsEnabled: boolean = true;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("cauri_pos_sound_enabled");
        if (stored !== null) {
          this.soundEnabled = stored === "true";
        }
      } catch {
        // Ignore
      }
    }
  }

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

  public setSoundEnabled(enabled: boolean): void {
    this.soundEnabled = enabled;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("cauri_pos_sound_enabled", String(enabled));
      } catch {
        // Ignore
      }
    }
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  /**
   * Tactile vibration on smartphone or touch devices.
   */
  public triggerHaptic(
    pattern: "light" | "medium" | "heavy" | "success" | "warning" = "light"
  ): void {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!this.hapticsEnabled) return;

    try {
      if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
        switch (pattern) {
          case "light":
            navigator.vibrate(12);
            break;
          case "medium":
            navigator.vibrate(28);
            break;
          case "heavy":
            navigator.vibrate(50);
            break;
          case "success":
            navigator.vibrate([15, 30, 25]);
            break;
          case "warning":
            navigator.vibrate([40, 40, 40]);
            break;
        }
      }
    } catch {
      // Haptics not supported or blocked by browser policy
    }
  }

  /**
   * Micro-click sound for keypad / banknote tap.
   */
  public playTapSound(): void {
    if (!this.soundEnabled || typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.025);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.03);
    } catch {
      // Ignore
    }
  }

  /**
   * Melodic ascending chime when adding an item to the ticket.
   */
  public playAddProductSound(): void {
    if (!this.soundEnabled || typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.04); // E5

      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Ignore
    }
  }

  /**
   * Cash drawer opening mechanical slide + high brass bell tone ("Ka-Ching!").
   */
  public playCashDrawerSound(): void {
    if (!this.soundEnabled || typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // 1. Drawer mechanical push
      const clickOsc = ctx.createOscillator();
      const clickGain = ctx.createGain();
      clickOsc.type = "square";
      clickOsc.frequency.setValueAtTime(280, now);
      clickOsc.frequency.exponentialRampToValueAtTime(90, now + 0.05);

      clickGain.gain.setValueAtTime(0.15, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      clickOsc.connect(clickGain);
      clickGain.connect(ctx.destination);
      clickOsc.start(now);
      clickOsc.stop(now + 0.06);

      // 2. High bell tone 1 (1568 Hz)
      const bell1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      bell1.type = "sine";
      bell1.frequency.setValueAtTime(1568, now + 0.03);

      gain1.gain.setValueAtTime(0, now);
      gain1.gain.setValueAtTime(0.32, now + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

      bell1.connect(gain1);
      gain1.connect(ctx.destination);
      bell1.start(now + 0.03);
      bell1.stop(now + 0.86);

      // 3. Overtone 2 (2093 Hz)
      const bell2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      bell2.type = "sine";
      bell2.frequency.setValueAtTime(2093, now + 0.05);

      gain2.gain.setValueAtTime(0, now);
      gain2.gain.setValueAtTime(0.25, now + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.1);

      bell2.connect(gain2);
      gain2.connect(ctx.destination);
      bell2.start(now + 0.05);
      bell2.stop(now + 1.12);
    } catch {
      // Ignore
    }
  }

  /**
   * Dual low-frequency tone for warnings or negative change.
   */
  public playWarningSound(): void {
    if (!this.soundEnabled || typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(180, now + 0.08);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.24);
    } catch {
      // Ignore
    }
  }
}

export const posAudioHaptics = new PosAudioHapticsEngine();
