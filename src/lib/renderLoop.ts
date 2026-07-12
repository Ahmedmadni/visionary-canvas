/**
 * Render-loop helpers.
 *
 * R3F drives its own rAF loop via useFrame. These helpers cover the
 * scheduling patterns useFrame doesn't handle directly: on-demand render
 * bursts, throttled subscribers, and time-based easings driven from a
 * single delta source.
 */

export type FrameCallback = (state: { time: number; delta: number }) => void;

/**
 * Simple priority-ordered frame subscriber registry. Scene managers can
 * register update callbacks that run inside R3F's useFrame in a
 * deterministic order (low priority first).
 */
class FrameBus {
  private subs = new Map<number, Set<FrameCallback>>();

  subscribe(cb: FrameCallback, priority = 0): () => void {
    const bucket = this.subs.get(priority) ?? new Set();
    bucket.add(cb);
    this.subs.set(priority, bucket);
    return () => bucket.delete(cb);
  }

  tick(time: number, delta: number): void {
    const priorities = [...this.subs.keys()].sort((a, b) => a - b);
    for (const p of priorities) {
      const bucket = this.subs.get(p);
      if (!bucket) continue;
      for (const cb of bucket) cb({ time, delta });
    }
  }
}

export const frameBus = new FrameBus();

/**
 * Frame-rate-independent damping (Lerp toward target). Standard trick from
 * Freya Holmer's "Rethinking damping" — smoothing is expressed as a
 * half-life in seconds, so behavior is stable across framerates.
 */
export function damp(current: number, target: number, halfLife: number, dt: number): number {
  if (halfLife <= 0) return target;
  return target + (current - target) * Math.pow(2, -dt / halfLife);
}
