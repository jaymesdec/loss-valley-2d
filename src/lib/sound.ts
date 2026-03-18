type SoundName =
  | 'star_earn'
  | 'level_complete'
  | 'step_taken'
  | 'training_tick'
  | 'overshoot_bounce'
  | 'probe_place'
  | 'click';

class SoundService {
  private audioContext: AudioContext | null = null;
  private muted = false;

  /** Lazy init on first user gesture */
  private ensureContext(): AudioContext | null {
    if (!this.audioContext) {
      try {
        this.audioContext = new AudioContext();
      } catch {
        return null;
      }
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
  }

  isMuted(): boolean {
    return this.muted;
  }

  play(sound: SoundName) {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    switch (sound) {
      case 'star_earn':
        this.playTone(ctx, 880, 0.15, 'sine', 0.3);
        setTimeout(() => this.playTone(ctx, 1100, 0.15, 'sine', 0.25), 100);
        setTimeout(() => this.playTone(ctx, 1320, 0.2, 'sine', 0.2), 200);
        break;

      case 'level_complete':
        this.playTone(ctx, 523, 0.15, 'sine', 0.3);
        setTimeout(() => this.playTone(ctx, 659, 0.15, 'sine', 0.25), 120);
        setTimeout(() => this.playTone(ctx, 784, 0.15, 'sine', 0.2), 240);
        setTimeout(() => this.playTone(ctx, 1047, 0.3, 'sine', 0.25), 360);
        break;

      case 'step_taken':
        this.playTone(ctx, 440, 0.05, 'triangle', 0.15);
        break;

      case 'training_tick':
        this.playTone(ctx, 660, 0.03, 'sine', 0.1);
        break;

      case 'overshoot_bounce':
        this.playTone(ctx, 200, 0.1, 'sawtooth', 0.2);
        break;

      case 'probe_place':
        this.playTone(ctx, 550, 0.08, 'sine', 0.2);
        break;

      case 'click':
        this.playTone(ctx, 400, 0.03, 'triangle', 0.1);
        break;
    }
  }

  private playTone(
    ctx: AudioContext,
    frequency: number,
    duration: number,
    type: OscillatorType,
    volume: number
  ) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + duration
    );

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }
}

// Singleton
export const soundService = new SoundService();
