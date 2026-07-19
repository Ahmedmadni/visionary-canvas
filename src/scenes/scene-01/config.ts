/**
 * Scene 01 — "The Monolith" — static configuration.
 *
 * Single source of truth for every tunable constant this scene owns:
 * identity, scroll range, performance budget, and the per-tier
 * degradation table. Nothing here touches Three.js or the DOM, so it is
 * safe to import from anywhere (registry, tests, dev tools).
 *
 * Design intent: a clean, fully-lit studio product-viz reveal of a single
 * luxury shawarma — matching the approved reference video. See `shots.ts`
 * for the per-shot scroll ranges and `cameras.ts` for the choreography.
 *
 * When Scene 02 ships it gets its OWN `scene-02/config.ts` — do not add
 * cross-scene constants here.
 */

import type { PerformanceTier } from "@/types";

export const SCENE_01_ID = "scene-01" as const;

/**
 * Chapter range on the global page scroll (0..1). The experience shell
 * declares one tall scroll section per scene; this scene owns the first
 * slice. `resolveChapter()` maps this back to a local 0..1 progress that
 * `shots.ts` further divides into per-shot ranges.
 */
export const SCENE_01_CHAPTER = {
  id: SCENE_01_ID,
  start: 0,
  end: 0.34,
  sceneId: SCENE_01_ID,
} as const;

/**
 * Active scroll range that actually drives the timeline. Defaults to the
 * canonical film position above, but the HOST experience owns where a
 * scene lives on the page and may remap it — e.g. a standalone build
 * where "The Monolith" is the entire show maps it to the full 0..1.
 *
 * This is what keeps the scene reusable: the reveal logic never assumes a
 * fixed page position, it reads its range from here.
 */
let activeScrollRange: { start: number; end: number } = {
  start: SCENE_01_CHAPTER.start,
  end: SCENE_01_CHAPTER.end,
};

export function getScene01ScrollRange(): { start: number; end: number } {
  return activeScrollRange;
}

export function setScene01ScrollRange(start: number, end: number): void {
  activeScrollRange = { start, end };
}

/**
 * Clamped local progress (0..1) across the scene's active page range,
 * from a raw global `scrollY`/`scrollProgress` value. The single source
 * of this math — the R3F-side timeline scrub AND the DOM-side HUD both
 * call this so "where are we in the scene" never drifts between the two.
 */
export function resolveScene01LocalProgress(scroll: number): number {
  const { start, end } = getScene01ScrollRange();
  const span = end - start;
  if (span <= 0) return scroll >= end ? 1 : 0;
  const t = (scroll - start) / span;
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

/**
 * How aggressively the scrubbed scroll progress is damped before it
 * drives the timeline. Higher half-life = more cinematic lag / weight.
 * Expressed as a half-life in seconds (see `damp()` in lib/renderLoop).
 */
export const SCENE_01_SCRUB_HALFLIFE = 0.12;

/**
 * Per-tier / per-device performance budget. Every visual subsystem reads
 * its allowance from here rather than branching on tier inline, so the
 * degradation strategy is auditable in one place.
 *
 * `dustCount`    — reserved for the (currently unmounted) DustField system;
 *                  kept sized here so it can be reused by a later, moodier
 *                  scene without redesigning the budget shape.
 * `shadows`      — cast contact shadows from the key light.
 * `dof`          — allow the depth-of-field postprocess pass.
 * `postprocess`  — allow the scene's bloom/vignette/DOF stack at all.
 * `envResolution`— reflector resolution for the mirror floor.
 */
export interface Scene01Budget {
  dustCount: number;
  shadows: boolean;
  dof: boolean;
  postprocess: boolean;
  envResolution: number;
}

const BUDGET_BY_TIER: Record<PerformanceTier, Scene01Budget> = {
  high: { dustCount: 2400, shadows: true, dof: true, postprocess: true, envResolution: 512 },
  medium: { dustCount: 1200, shadows: true, dof: true, postprocess: true, envResolution: 256 },
  low: { dustCount: 400, shadows: false, dof: false, postprocess: false, envResolution: 64 },
};

/**
 * Resolve the effective budget for the current environment. Mobile is
 * clamped one extra step regardless of tier — a "high" phone still lacks
 * the thermal headroom of a "medium" laptop for sustained DOF + a mirror
 * floor at once.
 */
export function resolveScene01Budget(tier: PerformanceTier, isMobile: boolean): Scene01Budget {
  const base = BUDGET_BY_TIER[tier];
  if (!isMobile) return base;
  return {
    ...base,
    dustCount: Math.round(base.dustCount * 0.4),
    shadows: false,
    dof: false,
    envResolution: Math.min(base.envResolution, 128),
  };
}

/**
 * Frame-bus priorities for this scene's per-frame subscribers. Lower runs
 * first. The timeline must resolve BEFORE anything reads the shared state
 * object it writes, hence camera/lights run at a higher number.
 */
export const SCENE_01_FRAME_PRIORITY = {
  timeline: 10,
  camera: 20,
  particles: 30,
} as const;
