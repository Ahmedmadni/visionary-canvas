/**
 * Scene 01 — shot registry.
 *
 * Per the approved reference video (a concept-art product-viz package),
 * the reveal is composed of six discrete, hard-cut SHOTS rather than one
 * continuous camera move. Each shot owns a scroll range; the transport is
 * still Lenis scroll → damped progress, exactly as before — only the
 * authored content per range changes.
 *
 *   A  hero          product lying, slow lateral drift + push-in
 *   B  turnaround     product snaps upright, slow spec-sheet yaw
 *   C1 macroMeat      extreme close-up on the grilled meat
 *   C2 macroSauce     extreme close-up on the sauce / veg
 *   D  exploded       ingredients separate vertically, camera pulls back
 *   E  materialBoard  cross-section halves + swatches, near-locked
 *
 * `resolveScene01Shot` reuses the foundation's chapter resolver
 * (`lib/scrollTimeline.ts`) so "current shot + local progress" logic
 * isn't duplicated — a `Scene01Shot` IS a `Chapter`.
 *
 * CAMERA + TIMELINE scaffolding for all six shots is implemented (see
 * `cameras.ts`, `timeline.ts`). The VISUAL content of C1/C2/D/E is NOT —
 * no macro-specific effects, no exploded-part offsetting, no cross-
 * section rendering, no HUD copy for these shots yet. Those wait on the
 * multi-part hero GLB and cross-section asset (see
 * docs/scene-01-production-asset-guide.md) and are deliberately scoped
 * out of this pass — see docs/scene-01-reference-breakdown.md phases 5-7.
 */

import { resolveChapter, type Chapter } from "@/lib/scrollTimeline";

export type Scene01ShotId =
  | "hero"
  | "turnaround"
  | "macroMeat"
  | "macroSauce"
  | "exploded"
  | "materialBoard";

export interface Scene01Shot extends Chapter {
  id: Scene01ShotId;
  label: string;
  /**
   * How this shot's CAMERA begins relative to the one before it.
   * "cut" — instant snap (product-viz hard cut), authored in the camera
   * keyframes as a near-zero-duration segment.
   * "ease" — a normal authored transition. Only the very first shot uses
   * this (there is nothing to cut FROM).
   */
  transitionIn: "cut" | "ease";
}

export const SCENE_01_SHOTS: readonly Scene01Shot[] = [
  { id: "hero", label: "Hero / HUD Beauty", start: 0.0, end: 0.18, transitionIn: "ease" },
  { id: "turnaround", label: "Turnaround", start: 0.18, end: 0.4, transitionIn: "cut" },
  { id: "macroMeat", label: "Macro — Meat", start: 0.4, end: 0.5, transitionIn: "cut" },
  { id: "macroSauce", label: "Macro — Sauce", start: 0.5, end: 0.6, transitionIn: "cut" },
  { id: "exploded", label: "Exploded Deconstruction", start: 0.6, end: 0.8, transitionIn: "cut" },
  {
    id: "materialBoard",
    label: "Material / Cross-Section Board",
    start: 0.8,
    end: 1.0,
    transitionIn: "cut",
  },
];

/**
 * Width of an authored hard-cut segment, in the same 0..1 local-progress
 * units as `at`/`start`/`end`. Small enough to read as instant against the
 * damped scrub. Shared by `cameras.ts` (camera + pose snap) and
 * `timeline.ts` (lighting/DOF snap) so a shot boundary always cuts in sync.
 */
export const SCENE_01_CUT_EPSILON = 0.004;

export interface ResolvedScene01Shot {
  shot: Scene01Shot | null;
  /** Local progress within the shot, 0..1. */
  local: number;
}

export function resolveScene01Shot(progress: number): ResolvedScene01Shot {
  const { chapter, local } = resolveChapter(SCENE_01_SHOTS, progress);
  return { shot: chapter as Scene01Shot | null, local };
}

export function getScene01Shot(id: Scene01ShotId): Scene01Shot {
  const shot = SCENE_01_SHOTS.find((s) => s.id === id);
  if (!shot) throw new Error(`[scene-01] Unknown shot id: ${id}`);
  return shot;
}
