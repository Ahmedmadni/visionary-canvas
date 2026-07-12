/**
 * Performance helpers — clamp DPR, choose tier-appropriate settings, and
 * expose a lightweight FPS sampler used by the on-canvas PerformanceMonitor.
 */

import type { PerformanceTier } from "@/types";

export function clampDpr(dpr: number, tier: PerformanceTier): number {
  const max = tier === "high" ? 2 : tier === "medium" ? 1.5 : 1;
  return Math.min(Math.max(dpr, 1), max);
}

export function shadowMapSize(tier: PerformanceTier): number {
  return tier === "high" ? 2048 : tier === "medium" ? 1024 : 512;
}

export function enablePostprocessing(tier: PerformanceTier): boolean {
  return tier !== "low";
}

/**
 * Rolling-average FPS sampler. Frame-loop code calls `.tick(delta)` every
 * frame; consumers read `.fps` at whatever cadence they need (e.g. once
 * per second) to avoid re-render storms.
 */
export class FpsSampler {
  private frames = 0;
  private elapsed = 0;
  fps = 60;

  tick(delta: number): void {
    this.frames += 1;
    this.elapsed += delta;
    if (this.elapsed >= 1) {
      this.fps = this.frames / this.elapsed;
      this.frames = 0;
      this.elapsed = 0;
    }
  }
}
