/**
 * Scene 01 — scroll-driven GSAP timeline.
 *
 * The timeline is a PAUSED GSAP timeline whose `.progress()` we scrub from
 * the damped scroll value every frame. It never runs on its own clock —
 * scroll is the transport. It writes into a flat `Scene01Channels` object
 * of plain numbers; the camera animator and the visual subsystems read
 * those channels imperatively from the frame bus.
 *
 * This is the architecture's prescribed pattern: "GSAP timelines and R3F
 * reactivity don't mix well, and cinematic camera work is authored, not
 * derived." So we author here and apply imperatively elsewhere — no React
 * state, no re-renders, one allocation-free object mutated in place.
 *
 * Two independent tween groups share the one timeline:
 *   - CAMERA + POSE, driven by the keyframe list in `cameras.ts`.
 *   - STUDIO LIGHTING + POSTPROCESS, driven by a per-shot lookup
 *     (`SHOT_VISUALS`) generic over ALL of `shots.ts` — each shot settles
 *     into its authored values once, then holds flat for the rest of its
 *     span, snapping at the next shot's cut. This is what "keep the
 *     system modular so each shot can be independently tuned" means in
 *     practice: retiming or adding a shot never touches this loop, only
 *     `SCENE_01_SHOTS` and `SHOT_VISUALS`.
 */

import gsap from "gsap";

import type { CameraKeyframe } from "./cameras";
import {
  SCENE_01_CUT_EPSILON,
  SCENE_01_SHOTS,
  type Scene01Shot,
  type Scene01ShotId,
} from "./shots";

/**
 * Every animated quantity in the scene, flattened to scalars so GSAP can
 * tween them natively and the frame-bus consumers can read without
 * allocation. Camera position/target are xyz triples.
 */
export interface Scene01Channels {
  // Camera transform.
  px: number;
  py: number;
  pz: number;
  tx: number;
  ty: number;
  tz: number;
  fov: number;
  // Product pose — travels with the camera (see cameras.ts).
  tiltZ: number; // hero group Z-tilt, radians
  spinY: number; // hero group Y-spin, radians
  // Studio lighting — normalized 0..1 intensities the rig scales.
  key: number;
  fill: number;
  rim: number;
  // Postprocessing DOF (vignette is static — see MonolithEffects).
  dofFocus: number; // world-unit focus distance driver, 0..1 normalized
  dofBokeh: number; // 0..1 blur strength
}

/** The subset of channels a shot's studio-lighting/DOF settle targets. */
type ShotVisuals = Pick<Scene01Channels, "key" | "fill" | "rim" | "dofFocus" | "dofBokeh">;

/**
 * Per-shot authored HOLD values. Each shot eases in to these once (or
 * snaps, if it's a hard cut) and holds them flat for the rest of its
 * span — the reference is a series of held studio setups, not a
 * continuously drifting grade. Add a shot to `shots.ts` and a matching
 * entry here; nothing else needs to change.
 */
const SHOT_VISUALS: Record<Scene01ShotId, ShotVisuals> = {
  hero: { key: 1.0, fill: 0.9, rim: 0.5, dofFocus: 0.28, dofBokeh: 0.62 },
  turnaround: { key: 1.0, fill: 0.85, rim: 0.6, dofFocus: 0.52, dofBokeh: 0.14 },
  // Punchier raking light + very shallow DOF — the macro passes are the
  // one place this "clean studio" scene leans into contrast and bokeh.
  macroMeat: { key: 1.0, fill: 0.7, rim: 0.7, dofFocus: 0.05, dofBokeh: 0.95 },
  macroSauce: { key: 1.0, fill: 0.72, rim: 0.68, dofFocus: 0.06, dofBokeh: 0.92 },
  // Back to flat studio readability — the stack needs to stay legible.
  exploded: { key: 1.0, fill: 0.85, rim: 0.6, dofFocus: 0.5, dofBokeh: 0.35 },
  materialBoard: { key: 1.0, fill: 0.88, rim: 0.55, dofFocus: 0.5, dofBokeh: 0.22 },
};

export function createScene01Channels(keyframes: readonly CameraKeyframe[]): Scene01Channels {
  const first = keyframes[0];
  return {
    px: first.position[0],
    py: first.position[1],
    pz: first.position[2],
    tx: first.target[0],
    ty: first.target[1],
    tz: first.target[2],
    fov: first.fov,
    tiltZ: first.tiltZ,
    spinY: first.spinY,
    key: 0.92,
    fill: 0.85,
    rim: 0.5,
    dofFocus: 0.3,
    dofBokeh: 0.55,
  };
}

/**
 * Build the authored, paused timeline. Total duration is normalized to 1
 * so `.progress(p)` maps 1:1 onto the scene's local scroll progress.
 *
 * The returned timeline mutates `ch` in place. Kill it on teardown.
 */
export function buildScene01Timeline(
  ch: Scene01Channels,
  keyframes: readonly CameraKeyframe[],
): gsap.core.Timeline {
  const tl = gsap.timeline({ paused: true, defaults: { duration: 0 } });

  // --- Camera + pose: chained segments between authored keyframes. A
  // "cut" keyframe (see cameras.ts) has a ~0 duration and ease "none", so
  // this loop produces an instant snap for free — no special-casing.
  for (let i = 1; i < keyframes.length; i += 1) {
    const prev = keyframes[i - 1];
    const kf = keyframes[i];
    const at = prev.at;
    const duration = Math.max(kf.at - prev.at, 0.0001);
    tl.to(
      ch,
      {
        px: kf.position[0],
        py: kf.position[1],
        pz: kf.position[2],
        tx: kf.target[0],
        ty: kf.target[1],
        tz: kf.target[2],
        fov: kf.fov,
        tiltZ: kf.tiltZ,
        spinY: kf.spinY,
        duration,
        ease: kf.ease,
      },
      at,
    );
  }

  // --- Studio lighting + DOF: one settle-then-hold segment per shot,
  // generic over the whole shot list. A "cut" shot snaps instantly
  // (near-zero settle, no ease); the opening shot eases in gently since
  // there is nothing to cut from.
  for (const shot of SCENE_01_SHOTS as readonly Scene01Shot[]) {
    const target = SHOT_VISUALS[shot.id];
    const span = Math.max(shot.end - shot.start, 0.0001);
    const settleDuration = Math.min(SCENE_01_CUT_EPSILON * 2, span * 0.3);
    const settleEase = shot.transitionIn === "cut" ? "none" : "power1.out";

    tl.to(ch, { ...target, duration: settleDuration, ease: settleEase }, shot.start).to(
      ch,
      { ...target, duration: Math.max(span - settleDuration, 0.0001), ease: "none" },
      shot.start + settleDuration,
    );
  }

  return tl;
}

/**
 * Snap channels to the settled end-of-sequence state without any scrub
 * drama. Used for reduced-motion, where we present the destination rather
 * than animating the whole sequence on scroll.
 */
export function applyScene01Settled(
  ch: Scene01Channels,
  keyframes: readonly CameraKeyframe[],
): void {
  const last = keyframes[keyframes.length - 1];
  ch.px = last.position[0];
  ch.py = last.position[1];
  ch.pz = last.position[2];
  ch.tx = last.target[0];
  ch.ty = last.target[1];
  ch.tz = last.target[2];
  ch.fov = last.fov;
  ch.tiltZ = last.tiltZ;
  ch.spinY = last.spinY;

  const lastShot = SCENE_01_SHOTS[SCENE_01_SHOTS.length - 1];
  Object.assign(ch, SHOT_VISUALS[lastShot.id]);
}
