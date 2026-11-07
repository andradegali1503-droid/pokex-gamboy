import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class GbaAudioService {
  private ctx: AudioContext | null = null;
  private isBrowser: boolean;
  public isMuted: boolean = false;
  private activeCryRaf: number | null = null;
  private currentAudio: HTMLAudioElement | null = null;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  private getContext(): AudioContext | null {
    if (!this.isBrowser || this.isMuted) {
      return null;
    }
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted && this.currentAudio) {
      this.currentAudio.pause();
    }
    if (!this.isMuted) {
      this.playSelect();
    }
    return this.isMuted;
  }

  private playToneSequence(
    notes: { freq: number; durationMs: number; type?: OscillatorType; gain?: number; slideTo?: number }[]
  ): void {
    const ctx = this.getContext();
    if (!ctx) return;

    let startTime = ctx.currentTime;
    for (const note of notes) {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = note.type || 'square';
      osc.frequency.setValueAtTime(note.freq, startTime);
      if (note.slideTo) {
        osc.frequency.linearRampToValueAtTime(note.slideTo, startTime + note.durationMs / 1000);
      }

      const peakGain = note.gain ?? 0.065;
      gainNode.gain.setValueAtTime(peakGain, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + note.durationMs / 1000);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + note.durationMs / 1000);
      startTime += note.durationMs / 1000;
    }
  }

  /** SE_DEX_SCROLL: Crisp short GBA scroll tick when moving 1 row in Pokédex list */
  public playDexScroll(): void {
    this.playToneSequence([
      { freq: 1180, slideTo: 1580, durationMs: 22, type: 'square', gain: 0.045 }
    ]);
  }

  /** SE_DEX_PAGE: Page jump arpeggio when pressing LEFT/RIGHT in Pokédex list */
  public playDexPage(): void {
    this.playToneSequence([
      { freq: 880, durationMs: 24, type: 'square', gain: 0.055 },
      { freq: 1320, durationMs: 28, type: 'square', gain: 0.055 }
    ]);
  }

  /** SE_SELECT: Standard GBA cursor / A button confirmation beep */
  public playSelect(): void {
    this.playToneSequence([
      { freq: 1046.5, durationMs: 28, type: 'square', gain: 0.06 },
      { freq: 1567.98, durationMs: 42, type: 'square', gain: 0.06 }
    ]);
  }

  /** Cancel / B button low-to-mid tone */
  public playCancel(): void {
    this.playToneSequence([
      { freq: 1174.66, durationMs: 30, type: 'square', gain: 0.055 },
      { freq: 783.99, durationMs: 45, type: 'square', gain: 0.055 }
    ]);
  }

  /** SE_PIN: Opening a Pokémon's Info Screen from the list */
  public playPin(): void {
    this.playToneSequence([
      { freq: 1318.5, durationMs: 38, type: 'square', gain: 0.065 },
      { freq: 1975.5, durationMs: 75, type: 'square', gain: 0.065 }
    ]);
  }

  /** SE_PC_LOGIN: Opening the Pokédex or Search Menu */
  public playPcLogin(): void {
    this.playToneSequence([
      { freq: 523.25, durationMs: 45, type: 'square', gain: 0.06 },
      { freq: 659.25, durationMs: 45, type: 'square', gain: 0.06 },
      { freq: 1046.5, durationMs: 75, type: 'square', gain: 0.065 }
    ]);
  }

  /** SE_PC_OFF: Closing the Search Menu or Pokédex */
  public playPcOff(): void {
    this.playToneSequence([
      { freq: 1046.5, durationMs: 45, type: 'square', gain: 0.06 },
      { freq: 659.25, durationMs: 45, type: 'square', gain: 0.06 },
      { freq: 392.0, durationMs: 80, type: 'square', gain: 0.06 }
    ]);
  }

  /** Poké Ball caught toggle chime */
  public playCatchChime(): void {
    this.playToneSequence([
      { freq: 987.77, durationMs: 45, type: 'square', gain: 0.06 },
      { freq: 1174.66, durationMs: 45, type: 'square', gain: 0.06 },
      { freq: 1318.51, durationMs: 45, type: 'square', gain: 0.06 },
      { freq: 1567.98, durationMs: 90, type: 'square', gain: 0.065 }
    ]);
  }

  /**
   * Plays a Pokémon's legacy Gen 3 cry (with synthesized GBA chiptune fallback)
   * and drives real-time waveform + VU meter callbacks for the CRY screen.
   */
  public playPokemonCry(
    nationalId: number,
    cryUrl: string,
    onFrame?: (waveform: number[], vuLevel: number) => void,
    onComplete?: () => void
  ): void {
    if (!this.isBrowser) return;

    if (this.activeCryRaf) {
      cancelAnimationFrame(this.activeCryRaf);
      this.activeCryRaf = null;
    }
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }

    // Always synthesize GBA wave envelope for oscilloscope/VU + fallback audio
    const durationMs = 780 + (nationalId % 7) * 65;
    const baseFreq = 260 + ((nationalId * 37) % 520);
    const modFreq = 180 + ((nationalId * 53) % 440);

    let audioPlayed = false;
    if (!this.isMuted && cryUrl) {
      try {
        const audio = new Audio(cryUrl);
        audio.volume = 0.45;
        this.currentAudio = audio;
        audio.play().then(() => {
          audioPlayed = true;
        }).catch(() => {
          this.playSynthesizedCry(baseFreq, modFreq, durationMs);
        });
      } catch {
        this.playSynthesizedCry(baseFreq, modFreq, durationMs);
      }
    } else if (!this.isMuted) {
      this.playSynthesizedCry(baseFreq, modFreq, durationMs);
    }

    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      if (elapsed >= durationMs) {
        if (onFrame) {
          onFrame(new Array(48).fill(0), 0);
        }
        if (onComplete) {
          onComplete();
        }
        this.activeCryRaf = null;
        return;
      }

      const progress = elapsed / durationMs;
      const envelope = Math.sin(progress * Math.PI) * (0.75 + 0.25 * Math.sin(elapsed * 0.045));
      const waveform: number[] = [];
      for (let i = 0; i < 48; i++) {
        const phase = elapsed * 0.03 + i * 0.38;
        const harmonic1 = Math.sin(phase * (1 + (nationalId % 5) * 0.25));
        const harmonic2 = Math.cos(phase * 2.3 - elapsed * 0.02) * 0.55;
        const stepQuantized = Math.round((harmonic1 + harmonic2) * envelope * 4) / 4;
        waveform.push(Math.max(-1, Math.min(1, stepQuantized)));
      }
      const vuLevel = Math.min(100, Math.max(8, Math.round(envelope * 96 + Math.abs(Math.sin(elapsed * 0.06)) * 18)));
      if (onFrame) {
        onFrame(waveform, vuLevel);
      }
      this.activeCryRaf = requestAnimationFrame(tick);
    };

    this.activeCryRaf = requestAnimationFrame(tick);
  }

  private playSynthesizedCry(baseFreq: number, modFreq: number, durationMs: number): void {
    this.playToneSequence([
      { freq: baseFreq, slideTo: modFreq * 1.35, durationMs: durationMs * 0.28, type: 'square', gain: 0.055 },
      { freq: modFreq * 1.2, slideTo: baseFreq * 0.85, durationMs: durationMs * 0.32, type: 'sawtooth', gain: 0.05 },
      { freq: baseFreq * 1.15, slideTo: modFreq * 0.75, durationMs: durationMs * 0.4, type: 'square', gain: 0.045 }
    ]);
  }
}
