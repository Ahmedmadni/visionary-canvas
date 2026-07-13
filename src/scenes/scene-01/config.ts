/**
 * Scene 01 — "The Monolith" — static configuration.
 *
 * Single source of truth for every tunable constant this scene owns:
 * identity, scroll range, timeline beat map, performance budget, and the
 * per-tier degradation table. Nothing here touches Three.js or the DOM,
 * so it is safe to import from anywhere (registry, tests, dev tools).
 *
 * Design intent: an 8–12s cinematic reveal of a single luxury shawarma
 * standing monolithic in near-darkness. The camera rises from the floor,
 * arcs around the hero, and settles into a held three-quarter portrait.
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
 * drives the timeline.
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
 * Timeline beat map — normalized positions (0..1 of the scene's local
 * progress) for each narrative beat. The GSAP timeline and the camera
 * choreography both reference these so the motion stays in sync with the
 * art direction if a beat is retimed.
 *
 *   0.00  BLACK      — full darkness, hero unlit, haze only
 *   0.18  IGNITION   — rim light ignites, silhouette emerges from the void
 *   0.45  RISE       — camera lifts off the floor, key light blooms in
 *   0.72  ORBIT      — slow three-quarter arc, dust catches the beams
 *   1.00  HERO HOLD  — settled portrait framing, fully lit, title-ready
 */
export const SCENE_01_BEATS = {
  black: 0.0,
  ignition: 0.18,
  rise: 0.45,
  orbit: 0.72,
  hero: 1.0,
} as const;

export type Scene01Beat = keyof typeof SCENE_01_BEATS;

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
 * `dustCount`    — number of GPU dust points.
 * `shadows`      — cast contact shadows from the key light.
 * `volumetric`   — render the fake volumetric haze cone.
 * `postprocess`  — allow the scene's bloom/vignette/grain stack.
 * `envResolution`— cubemap resolution for the reflective floor.
 */
export interface Scene01Budget {
  dustCount: number;
  shadows: boolean;
  volumetric: boolean;
  postprocess: boolean;
  envResolution: number;
}

const BUDGET_BY_TIER: Record<PerformanceTier, Scene01Budget> = {
  high: { dustCount: 2400, shadows: true, volumetric: true, postprocess: true, envResolution: 256 },
  medium: {
    dustCount: 1200,
    shadows: true,
    volumetric: true,
    postprocess: true,
    envResolution: 128,
  },
  low: { dustCount: 400, shadows: false, volumetric: false, postprocess: false, envResolution: 64 },
};

/**
 * Resolve the effective budget for the current environment. Mobile is
 * clamped one extra step regardless of tier — a "high" phone still lacks
 * the thermal headroom of a "medium" laptop for sustained volumetrics.
 */
export function resolveScene01Budget(tier: PerformanceTier, isMobile: boolean): Scene01Budget {
  const base = BUDGET_BY_TIER[tier];
  if (!isMobile) return base;
  return {
    ...base,
    dustCount: Math.round(base.dustCount * 0.4),
    shadows: false,
    volumetric: tier === "high",
    envResolution: Math.min(base.envResolution, 64),
  };
}

/**
 * Frame-bus priorities for this scene's per-frame subscribers. Lower runs
 * first. The timeline must resolve BEFORE anything reads the shared state
 * object it writes, hence camera/particles run at a higher number.
 */
export const SCENE_01_FRAME_PRIORITY = {
  timeline: 10,
  camera: 20,
  particles: 30,
} as const;
