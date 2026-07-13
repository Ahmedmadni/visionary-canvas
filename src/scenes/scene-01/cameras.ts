/**
 * Scene 01 — camera choreography.
 *
 * The reveal is authored, not derived: a fixed set of keyframes, each
 * pinned to a narrative beat, that the scroll-driven GSAP timeline scrubs
 * between. We keep the keyframes as plain data so they can be unit-tested,
 * previewed in dev tools, and retimed without touching render code.
 *
 * Each keyframe endpoint is ALSO registered with the global CameraRig
 * preset registry (`scene-01/<beat>`), so unrelated systems (debug jumps,
 * future scene hand-offs) can address a named camera state.
 */

import type { Vector3Tuple } from "three";

import { registerPreset } from "@/components/webgl/CameraRig";
import { SCENE_01_BEATS, SCENE_01_ID, type Scene01Beat } from "./config";

export interface CameraKeyframe {
  /** Local scene progress (0..1); mirrors a value in SCENE_01_BEATS. */
  at: number;
  beat: Scene01Beat;
  position: Vector3Tuple;
  target: Vector3Tuple;
  fov: number;
  /** GSAP ease used to reach THIS keyframe from the previous one. */
  ease: string;
}

/**
 * Desktop / tablet framing. Camera starts on the floor looking up at the
 * monolith in the dark, rises, arcs a slow three-quarter, and settles
 * into a held hero portrait with room above for a title.
 */
const DESKTOP_KEYFRAMES: readonly CameraKeyframe[] = [
  {
    at: SCENE_01_BEATS.black,
    beat: "black",
    position: [0.0, -1.6, 8.4],
    target: [0, 0.9, 0],
    fov: 32,
    ease: "none",
  },
  {
    at: SCENE_01_BEATS.ignition,
    beat: "ignition",
    position: [0.6, -1.1, 7.6],
    target: [0, 0.85, 0],
    fov: 33,
    ease: "power2.out",
  },
  {
    at: SCENE_01_BEATS.rise,
    beat: "rise",
    position: [1.8, 0.2, 6.2],
    target: [0, 0.55, 0],
    fov: 36,
    ease: "power2.inOut",
  },
  {
    at: SCENE_01_BEATS.orbit,
    beat: "orbit",
    position: [1.9, 0.7, 5.0],
    target: [0, 0.5, 0],
    fov: 38,
    ease: "sine.inOut",
  },
  {
    at: SCENE_01_BEATS.hero,
    beat: "hero",
    position: [0.8, 0.35, 4.1],
    target: [0, 0.5, 0],
    fov: 40,
    ease: "power3.out",
  },
];

/**
 * Mobile framing. Portrait viewports crop the sides, so we pull the
 * camera back, flatten the lateral arc, and widen the FOV to keep the
 * whole hero in frame with breathing room.
 */
const MOBILE_KEYFRAMES: readonly CameraKeyframe[] = [
  {
    at: SCENE_01_BEATS.black,
    beat: "black",
    position: [0.0, -1.4, 10.2],
    target: [0, 0.95, 0],
    fov: 46,
    ease: "none",
  },
  {
    at: SCENE_01_BEATS.ignition,
    beat: "ignition",
    position: [0.2, -1.0, 9.6],
    target: [0, 0.9, 0],
    fov: 47,
    ease: "power2.out",
  },
  {
    at: SCENE_01_BEATS.rise,
    beat: "rise",
    position: [0.7, 0.1, 8.4],
    target: [0, 0.6, 0],
    fov: 50,
    ease: "power2.inOut",
  },
  {
    at: SCENE_01_BEATS.orbit,
    beat: "orbit",
    position: [0.8, 0.5, 7.6],
    target: [0, 0.55, 0],
    fov: 52,
    ease: "sine.inOut",
  },
  {
    at: SCENE_01_BEATS.hero,
    beat: "hero",
    position: [0.3, 0.3, 6.6],
    target: [0, 0.55, 0],
    fov: 54,
    ease: "power3.out",
  },
];

export function scene01CameraKeyframes(isMobile: boolean): readonly CameraKeyframe[] {
  return isMobile ? MOBILE_KEYFRAMES : DESKTOP_KEYFRAMES;
}

/** Preset id for a given beat, e.g. `scene-01/hero`. */
export function scene01PresetId(beat: Scene01Beat): string {
  return `${SCENE_01_ID}/${beat}`;
}

let registered = false;

/**
 * Register every keyframe endpoint (desktop framing) as a named preset.
 * Idempotent — safe to call from the scene registration side effect.
 */
export function registerScene01Cameras(): void {
  if (registered) return;
  for (const kf of DESKTOP_KEYFRAMES) {
    registerPreset({
      id: scene01PresetId(kf.beat),
      position: kf.position,
      target: kf.target,
      fov: kf.fov,
    });
  }
  registered = true;
}
