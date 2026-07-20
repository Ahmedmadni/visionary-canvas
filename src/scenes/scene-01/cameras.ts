/**
 * Scene 01 — camera choreography.
 *
 * Full six-shot structure from the approved reference video. Motion is
 * authored, not derived — a fixed keyframe list the GSAP timeline tweens
 * between, kept as plain data so it stays unit-testable.
 *
 *   A  hero          product lying, slow lateral drift + push-in
 *   B  turnaround     product snaps upright, slow spec-sheet yaw
 *   C1 macroMeat      extreme close push on the meat
 *   C2 macroSauce     extreme close push on the sauce / veg
 *   D  exploded       camera pulls back to frame the (future) floating stack
 *   E  materialBoard  near-locked on the (future) cross-section halves
 *
 * A "cut" is authored as a near-zero-duration segment (`SCENE_01_CUT_EPSILON`)
 * with `ease: "none"` landing exactly at the shot boundary — no new
 * transition machinery, the existing per-segment tween loop in
 * `timeline.ts` already produces an instant snap for a ~0-duration span.
 *
 * Product pose travels with the camera in the SAME keyframe (tiltZ tips
 * the hero onto its side for the lying beauty pose; spinY drives the
 * turntable yaw / fixed display angle for later shots) so a "cut" snaps
 * pose and camera together, and an "ease" glides them together — exactly
 * what the reference does.
 *
 * SCOPE NOTE (see docs/scene-01-reference-breakdown.md): only A and B have
 * a built visual treatment right now. C1/C2/D/E's camera framing here is
 * production-ready scaffolding — a plausible, principled push/pull/hold
 * per the reference's shot table — but nothing in the scene graph yet
 * reacts to being "in" those shots beyond the shared studio-lighting/DOF
 * channels every shot already drives. No exploded-part offsetting, no
 * cross-section rendering, no macro-specific effects are implemented.
 *
 * NOTE — pose/framing numbers throughout are principled approximations
 * pending the real hero GLB's actual bounds (see
 * docs/scene-01-production-asset-guide.md). Retune once the asset lands.
 */

import type { Vector3Tuple } from "three";

import { registerPreset } from "@/components/webgl/CameraRig";
import { SCENE_01_ID } from "./config";
import { SCENE_01_CUT_EPSILON, type Scene01ShotId } from "./shots";

export interface CameraKeyframe {
  /** Absolute local scene progress (0..1) across ALL shots. */
  at: number;
  shot: Scene01ShotId;
  position: Vector3Tuple;
  target: Vector3Tuple;
  fov: number;
  /** Hero group Z-tilt in radians (0 = standing, -PI/2 = lying on its side). */
  tiltZ: number;
  /** Hero group Y-spin in radians (turntable yaw / fixed display angle). */
  spinY: number;
  /** GSAP ease used to reach THIS keyframe from the previous one. */
  ease: string;
}

const STANDING = 0;
const LYING = -Math.PI / 2;
// Fixed three-quarter display angle used once the turntable stops
// spinning (macro / exploded / material shots hold a static read).
const DISPLAY_ANGLE = Math.PI * 0.15;

/** Desktop / tablet framing — see the shot table in the module doc. */
const DESKTOP_KEYFRAMES: readonly CameraKeyframe[] = [
  // ---------------------------------------------------------------- A hero
  {
    at: 0.0,
    shot: "hero",
    position: [2.6, 1.3, 4.4],
    target: [0, 0.35, 0],
    fov: 30,
    tiltZ: LYING,
    spinY: 0.05,
    ease: "none",
  },
  {
    at: 0.09,
    shot: "hero",
    position: [1.4, 1.15, 4.0],
    target: [0, 0.35, 0],
    fov: 29,
    tiltZ: LYING,
    spinY: 0.18,
    ease: "sine.inOut",
  },
  {
    at: 0.18,
    shot: "hero",
    position: [0.3, 1.05, 3.7],
    target: [0, 0.35, 0],
    fov: 28,
    tiltZ: LYING,
    spinY: 0.3,
    ease: "sine.inOut",
  },

  // --------------------------------------------------------- B turnaround
  {
    at: 0.18 + SCENE_01_CUT_EPSILON,
    shot: "turnaround",
    position: [0, 0.9, 5.2],
    target: [0, 1.0, 0],
    fov: 26,
    tiltZ: STANDING,
    spinY: 0,
    ease: "none",
  },
  {
    at: 0.29,
    shot: "turnaround",
    position: [0.9, 0.95, 4.9],
    target: [0, 1.0, 0],
    fov: 27,
    tiltZ: STANDING,
    spinY: Math.PI * 0.28,
    ease: "sine.inOut",
  },
  {
    at: 0.4,
    shot: "turnaround",
    position: [1.6, 1.0, 4.6],
    target: [0, 1.0, 0],
    fov: 28,
    tiltZ: STANDING,
    spinY: Math.PI * 0.52,
    ease: "sine.inOut",
  },

  // ------------------------------------------------------- C1 macro: meat
  {
    at: 0.4 + SCENE_01_CUT_EPSILON,
    shot: "macroMeat",
    position: [0.15, 0.95, 1.15],
    target: [0, 0.9, 0.3],
    fov: 20,
    tiltZ: STANDING,
    spinY: DISPLAY_ANGLE,
    ease: "none",
  },
  {
    at: 0.5,
    shot: "macroMeat",
    position: [0.05, 0.9, 1.05],
    target: [0, 0.85, 0.32],
    fov: 19,
    tiltZ: STANDING,
    spinY: DISPLAY_ANGLE,
    ease: "sine.inOut",
  },

  // ------------------------------------------------------ C2 macro: sauce
  {
    at: 0.5 + SCENE_01_CUT_EPSILON,
    shot: "macroSauce",
    position: [-0.1, 0.6, 1.1],
    target: [0, 0.55, 0.35],
    fov: 20,
    tiltZ: STANDING,
    spinY: DISPLAY_ANGLE,
    ease: "none",
  },
  {
    at: 0.6,
    shot: "macroSauce",
    position: [-0.05, 0.65, 1.0],
    target: [0, 0.58, 0.33],
    fov: 19,
    tiltZ: STANDING,
    spinY: DISPLAY_ANGLE,
    ease: "sine.inOut",
  },

  // ------------------------------------------------------------ D exploded
  {
    at: 0.6 + SCENE_01_CUT_EPSILON,
    shot: "exploded",
    position: [0.5, 1.3, 5.0],
    target: [0, 1.1, 0],
    fov: 30,
    tiltZ: STANDING,
    spinY: Math.PI * 0.12,
    ease: "none",
  },
  {
    at: 0.8,
    shot: "exploded",
    position: [0.3, 1.55, 4.85],
    target: [0, 1.15, 0],
    fov: 29,
    tiltZ: STANDING,
    spinY: Math.PI * 0.16,
    ease: "sine.inOut",
  },

  // ------------------------------------------------------ E materialBoard
  {
    at: 0.8 + SCENE_01_CUT_EPSILON,
    shot: "materialBoard",
    position: [0, 0.9, 4.0],
    target: [0, 0.9, 0],
    fov: 30,
    tiltZ: STANDING,
    spinY: 0,
    ease: "none",
  },
  {
    at: 1.0,
    shot: "materialBoard",
    position: [0.05, 0.92, 3.85],
    target: [0, 0.9, 0],
    fov: 29,
    tiltZ: STANDING,
    spinY: 0,
    ease: "sine.inOut",
  },
];

/**
 * Mobile framing. Portrait viewports crop the sides, so we pull the
 * camera back and widen the FOV to keep the subject in frame throughout.
 */
const MOBILE_KEYFRAMES: readonly CameraKeyframe[] = [
  // ---------------------------------------------------------------- A hero
  {
    at: 0.0,
    shot: "hero",
    position: [3.2, 1.5, 6.4],
    target: [0, 0.4, 0],
    fov: 42,
    tiltZ: LYING,
    spinY: 0.05,
    ease: "none",
  },
  {
    at: 0.09,
    shot: "hero",
    position: [1.7, 1.3, 5.9],
    target: [0, 0.4, 0],
    fov: 41,
    tiltZ: LYING,
    spinY: 0.18,
    ease: "sine.inOut",
  },
  {
    at: 0.18,
    shot: "hero",
    position: [0.4, 1.2, 5.6],
    target: [0, 0.4, 0],
    fov: 40,
    tiltZ: LYING,
    spinY: 0.3,
    ease: "sine.inOut",
  },

  // --------------------------------------------------------- B turnaround
  {
    at: 0.18 + SCENE_01_CUT_EPSILON,
    shot: "turnaround",
    position: [0, 1.0, 7.6],
    target: [0, 1.0, 0],
    fov: 38,
    tiltZ: STANDING,
    spinY: 0,
    ease: "none",
  },
  {
    at: 0.29,
    shot: "turnaround",
    position: [1.1, 1.05, 7.2],
    target: [0, 1.0, 0],
    fov: 39,
    tiltZ: STANDING,
    spinY: Math.PI * 0.28,
    ease: "sine.inOut",
  },
  {
    at: 0.4,
    shot: "turnaround",
    position: [1.9, 1.1, 6.8],
    target: [0, 1.0, 0],
    fov: 40,
    tiltZ: STANDING,
    spinY: Math.PI * 0.52,
    ease: "sine.inOut",
  },

  // ------------------------------------------------------- C1 macro: meat
  {
    at: 0.4 + SCENE_01_CUT_EPSILON,
    shot: "macroMeat",
    position: [0.2, 1.1, 1.6],
    target: [0, 0.9, 0.3],
    fov: 30,
    tiltZ: STANDING,
    spinY: DISPLAY_ANGLE,
    ease: "none",
  },
  {
    at: 0.5,
    shot: "macroMeat",
    position: [0.07, 1.05, 1.5],
    target: [0, 0.85, 0.32],
    fov: 29,
    tiltZ: STANDING,
    spinY: DISPLAY_ANGLE,
    ease: "sine.inOut",
  },

  // ------------------------------------------------------ C2 macro: sauce
  {
    at: 0.5 + SCENE_01_CUT_EPSILON,
    shot: "macroSauce",
    position: [-0.15, 0.75, 1.55],
    target: [0, 0.55, 0.35],
    fov: 30,
    tiltZ: STANDING,
    spinY: DISPLAY_ANGLE,
    ease: "none",
  },
  {
    at: 0.6,
    shot: "macroSauce",
    position: [-0.07, 0.8, 1.45],
    target: [0, 0.58, 0.33],
    fov: 29,
    tiltZ: STANDING,
    spinY: DISPLAY_ANGLE,
    ease: "sine.inOut",
  },

  // ------------------------------------------------------------ D exploded
  {
    at: 0.6 + SCENE_01_CUT_EPSILON,
    shot: "exploded",
    position: [0.7, 1.5, 7.2],
    target: [0, 1.1, 0],
    fov: 40,
    tiltZ: STANDING,
    spinY: Math.PI * 0.12,
    ease: "none",
  },
  {
    at: 0.8,
    shot: "exploded",
    position: [0.4, 1.8, 7.0],
    target: [0, 1.15, 0],
    fov: 39,
    tiltZ: STANDING,
    spinY: Math.PI * 0.16,
    ease: "sine.inOut",
  },

  // ------------------------------------------------------ E materialBoard
  {
    at: 0.8 + SCENE_01_CUT_EPSILON,
    shot: "materialBoard",
    position: [0, 1.0, 5.8],
    target: [0, 0.9, 0],
    fov: 40,
    tiltZ: STANDING,
    spinY: 0,
    ease: "none",
  },
  {
    at: 1.0,
    shot: "materialBoard",
    position: [0.07, 1.02, 5.6],
    target: [0, 0.9, 0],
    fov: 39,
    tiltZ: STANDING,
    spinY: 0,
    ease: "sine.inOut",
  },
];

export function scene01CameraKeyframes(isMobile: boolean): readonly CameraKeyframe[] {
  return isMobile ? MOBILE_KEYFRAMES : DESKTOP_KEYFRAMES;
}

/** Preset id for a given shot's opening frame, e.g. `scene-01/hero`. */
export function scene01PresetId(shot: Scene01ShotId): string {
  return `${SCENE_01_ID}/${shot}`;
}

let registered = false;

/**
 * Register the first keyframe of each shot as a named CameraRig preset
 * (desktop framing). Idempotent — safe to call from the scene
 * registration side effect.
 */
export function registerScene01Cameras(): void {
  if (registered) return;
  const seen = new Set<Scene01ShotId>();
  for (const kf of DESKTOP_KEYFRAMES) {
    if (seen.has(kf.shot)) continue;
    seen.add(kf.shot);
    registerPreset({
      id: scene01PresetId(kf.shot),
      position: kf.position,
      target: kf.target,
      fov: kf.fov,
    });
  }
  registered = true;
}
