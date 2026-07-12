/**
 * Web Audio manager (singleton).
 *
 * Owns a single AudioContext, a master gain, and named audio buffers.
 * Modern browsers require a user gesture before playback; `armUnlock()`
 * attaches one-time listeners that resume the context on first
 * interaction and emit `audio:unlocked` through the event bus.
 *
 * Kept dependency-free (no howler / tone.js) so the bundle stays lean
 * and we control the render graph. Scenes hook into `getContext()` and
 * `getMasterGain()` for spatial audio, filters, or sends.
 */

import { eventBus } from "@/lib/eventBus";

interface AudioContextCtor {
  new (contextOptions?: AudioContextOptions): AudioContext;
}

interface WindowWithWebkitAudio extends Window {
  webkitAudioContext?: AudioContextCtor;
}

function getAudioContextCtor(): AudioContextCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as WindowWithWebkitAudio;
  return window.AudioContext ?? w.webkitAudioContext ?? null;
}

class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private muted = false;
  private unlocked = false;
  private armDetach: (() => void) | null = null;

  isUnlocked(): boolean {
    return this.unlocked;
  }

  getContext(): AudioContext | null {
    return this.ctx;
  }

  getMasterGain(): GainNode | null {
    return this.master;
  }

  private ensureContext(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor = getAudioContextCtor();
    if (!Ctor) return null;
    this.ctx = new Ctor({ latencyHint: "interactive" });
    this.master = this.ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 1;
    this.master.connect(this.ctx.destination);
    return this.ctx;
  }

  /** Attach one-shot listeners that unlock audio on the next user gesture. */
  armUnlock(): void {
    if (this.unlocked || this.armDetach || typeof window === "undefined") return;

    const unlock = async () => {
      const ctx = this.ensureContext();
      if (!ctx) return;
      try {
        if (ctx.state === "suspended") await ctx.resume();
        this.unlocked = true;
        eventBus.emit("audio:unlocked");
      } finally {
        this.armDetach?.();
        this.armDetach = null;
      }
    };

    const events: (keyof DocumentEventMap)[] = ["pointerdown", "keydown", "touchstart"];
    events.forEach((evt) => document.addEventListener(evt, unlock, { once: true, passive: true }));
    this.armDetach = () => {
      events.forEach((evt) => document.removeEventListener(evt, unlock));
    };
  }

  async load(key: string, url: string): Promise<AudioBuffer> {
    const existing = this.buffers.get(key);
    if (existing) return existing;

    const ctx = this.ensureContext();
    if (!ctx) throw new Error("AudioContext unavailable");

    const arrayBuffer = await fetch(url).then((r) => r.arrayBuffer());
    const buffer = await ctx.decodeAudioData(arrayBuffer);
    this.buffers.set(key, buffer);
    return buffer;
  }

  play(key: string, opts: { loop?: boolean; volume?: number; when?: number } = {}): AudioBufferSourceNode | null {
    const ctx = this.ctx;
    const master = this.master;
    const buffer = this.buffers.get(key);
    if (!ctx || !master || !buffer) return null;

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = opts.loop ?? false;

    if (opts.volume != null && opts.volume !== 1) {
      const gain = ctx.createGain();
      gain.gain.value = opts.volume;
      source.connect(gain).connect(master);
    } else {
      source.connect(master);
    }

    source.start(opts.when ?? 0);
    return source;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master && this.ctx) {
      // Short ramp to avoid clicks.
      const t = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.linearRampToValueAtTime(muted ? 0 : 1, t + 0.05);
    }
    eventBus.emit("audio:muted-change", { muted });
  }

  isMuted(): boolean {
    return this.muted;
  }

  /** Suspend the audio graph (tab hidden). No-op if already suspended. */
  async suspend(): Promise<void> {
    if (this.ctx?.state === "running") await this.ctx.suspend();
  }

  async resume(): Promise<void> {
    if (this.ctx?.state === "suspended" && this.unlocked) await this.ctx.resume();
  }

  /** Full teardown (page unload / test cleanup). */
  async dispose(): Promise<void> {
    this.armDetach?.();
    this.armDetach = null;
    this.buffers.clear();
    if (this.ctx) {
      try {
        await this.ctx.close();
      } catch {
        /* noop */
      }
    }
    this.ctx = null;
    this.master = null;
    this.unlocked = false;
  }
}

export const audioManager = new AudioManager();
