/**
 * Scene 01 — camera choreography.
 *
 * Reworked to match the approved reference video: a HERO beauty pass
 * (product lying on the floor, slow lateral drift + push-in) HARD-CUTS
 * into a TURNAROUND pass (product standing, slow spec-sheet yaw). Motion
 * is authored, not derived — a fixed keyframe list the GSAP timeline
 * tweens between, kept as plain data so it stays unit-testable.
 *
 * A "cut" is authored as a near-zero-duration segment (`SCENE_01_CUT_EPSILON`)
 * with `ease: "none"` landing exactly at the shot boundary — no new
 * transition machinery, the existing per-segment tween loop in
 * `timeline.ts` already produces an instant snap for a ~0-duration span.
 *
 * Product pose travels with the camera in the SAME keyframe (tiltZ tips
 * the hero onto its side for the lying beauty pose; spinY drives the
 * turnaround's slow yaw) so a "cut" snaps pose and camera together, and
 * an "ease" glides them together — exactly what the reference does.
 *
 * NOTE — pose numbers are principled approximations pending the real
 * hero GLB's actual bounds (see docs/scene-01-production-asset-guide.md).
 * Retune `HeroMonolith`'s BASE_Y-per-pose once the asset lands.
 */

import type { Vector3Tuple } from "three";

import { registerPreset } from "@/components/webgl/CameraRig";
import { SCENE_01_ID } from "./config";
import { SCENE_01_CUT_EPSILON, type Scene01ShotId } from "./shots";

export interface CameraKeyframe {
  /** Absolute local scene progress (0..1) across BOTH shots. */
  at: number;
  shot: Scene01ShotId;
  position: Vector3Tuple;
  target: Vector3Tuple;
  fov: number;
  /** Hero group Z-tilt in radians (0 = standing, -PI/2 = lying on its side). */
  tiltZ: number;
  /** Hero group Y-spin in radians (turnaround yaw). */
  spinY: number;
  /** GSAP ease used to reach THIS keyframe from the previous one. */
  ease: string;
}

const STANDING = 0;
const LYING = -Math.PI / 2;

/**
 * Desktop / tablet framing.
 *   0.00–0.50  HERO        product lying, slow lateral drift + push-in.
 *   0.50→cut   TURNAROUND  product snaps upright, slow spec-sheet yaw.
 */
const DESKTOP_KEYFRAMES: readonly CameraKeyframe[] = [
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
    at: 0.25,
    shot: "hero",
    position: [1.4, 1.15, 4.0],
    target: [0, 0.35, 0],
    fov: 29,
    tiltZ: LYING,
    spinY: 0.18,
    ease: "sine.inOut",
  },
  {
    at: 0.5,
    shot: "hero",
    position: [0.3, 1.05, 3.7],
    target: [0, 0.35, 0],
    fov: 28,
    tiltZ: LYING,
    spinY: 0.3,
    ease: "sine.inOut",
  },
  {
    // Hard cut: product snaps upright, camera reframes front-on.
    at: 0.5 + SCENE_01_CUT_EPSILON,
    shot: "turnaround",
    position: [0, 0.9, 5.2],
    target: [0, 1.0, 0],
    fov: 26,
    tiltZ: STANDING,
    spinY: 0,
    ease: "none",
  },
  {
    at: 0.75,
    shot: "turnaround",
    position: [0.9, 0.95, 4.9],
    target: [0, 1.0, 0],
    fov: 27,
    tiltZ: STANDING,
    spinY: Math.PI * 0.28,
    ease: "sine.inOut",
  },
  {
    at: 1.0,
    shot: "turnaround",
    position: [1.6, 1.0, 4.6],
    target: [0, 1.0, 0],
    fov: 28,
    tiltZ: STANDING,
    spinY: Math.PI * 0.52,
    ease: "sine.inOut",
  },
];

/**
 * Mobile framing. Portrait viewports crop the sides, so we pull the
 * camera back and widen the FOV to keep the whole hero in frame.
 */
const MOBILE_KEYFRAMES: readonly CameraKeyframe[] = [
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
    at: 0.25,
    shot: "hero",
    position: [1.7, 1.3, 5.9],
    target: [0, 0.4, 0],
    fov: 41,
    tiltZ: LYING,
    spinY: 0.18,
    ease: "sine.inOut",
  },
  {
    at: 0.5,
    shot: "hero",
    position: [0.4, 1.2, 5.6],
    target: [0, 0.4, 0],
    fov: 40,
    tiltZ: LYING,
    spinY: 0.3,
    ease: "sine.inOut",
  },
  {
    at: 0.5 + SCENE_01_CUT_EPSILON,
    shot: "turnaround",
    position: [0, 1.0, 7.6],
    target: [0, 1.0, 0],
    fov: 38,
    tiltZ: STANDING,
    spinY: 0,
    ease: "none",
  },
  {
    at: 0.75,
    shot: "turnaround",
    position: [1.1, 1.05, 7.2],
    target: [0, 1.0, 0],
    fov: 39,
    tiltZ: STANDING,
    spinY: Math.PI * 0.28,
    ease: "sine.inOut",
  },
  {
    at: 1.0,
    shot: "turnaround",
    position: [1.9, 1.1, 6.8],
    target: [0, 1.0, 0],
    fov: 40,
    tiltZ: STANDING,
    spinY: Math.PI * 0.52,
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
