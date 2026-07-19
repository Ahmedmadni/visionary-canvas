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
 *   - STUDIO LIGHTING + POSTPROCESS, driven directly by the shot ranges in
 *     `shots.ts` — a clean, mostly-lit studio look per the reference video,
 *     with a hard-cut snap at the shot boundary (matching the camera cut).
 */

import gsap from "gsap";

import type { CameraKeyframe } from "./cameras";
import { SCENE_01_CUT_EPSILON, SCENE_01_SHOTS } from "./shots";

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

  // --- Studio lighting + postprocess: shot-scoped, hard-cut at the same
  // boundary as the camera. The reference is fully lit from frame one —
  // these are gentle settles, not a darkness reveal.
  const [hero, turnaround] = SCENE_01_SHOTS;
  const CUT = SCENE_01_CUT_EPSILON;
  const cutAt = hero.end;
  const turnaroundStart = hero.end + CUT;
  const turnaroundSpan = Math.max(turnaround.end - turnaroundStart, 0.0001);

  // Key: settles in over the first fifth of the hero shot, then holds.
  tl.to(ch, { key: 1.0, duration: hero.end * 0.2, ease: "power1.out" }, 0)
    .to(ch, { key: 0.97, duration: hero.end * 0.8, ease: "sine.inOut" }, hero.end * 0.2)
    .to(ch, { key: 1.0, duration: CUT, ease: "none" }, cutAt)
    .to(ch, { key: 1.0, duration: turnaroundSpan, ease: "none" }, turnaroundStart);

  // Fill: near-constant, studio-flat — low contrast throughout.
  tl.to(ch, { fill: 0.9, duration: hero.end, ease: "sine.inOut" }, 0).to(
    ch,
    { fill: 0.85, duration: turnaroundSpan, ease: "sine.inOut" },
    turnaroundStart,
  );

  // Rim: gentle separation; a touch stronger once the product stands
  // upright for the turnaround.
  tl.to(ch, { rim: 0.5, duration: hero.end, ease: "sine.inOut" }, 0)
    .to(ch, { rim: 0.6, duration: CUT, ease: "none" }, cutAt)
    .to(ch, { rim: 0.6, duration: turnaroundSpan, ease: "none" }, turnaroundStart);

  // DOF: moderate shallow during the hero push-in (macro-adjacent feel),
  // hard-cut to near-deep focus for the turnaround's spec-sheet clarity.
  tl.to(ch, { dofFocus: 0.28, dofBokeh: 0.62, duration: hero.end, ease: "sine.inOut" }, 0)
    .to(ch, { dofFocus: 0.52, dofBokeh: 0.14, duration: CUT, ease: "none" }, cutAt)
    .to(
      ch,
      { dofFocus: 0.55, dofBokeh: 0.12, duration: turnaroundSpan, ease: "sine.inOut" },
      turnaroundStart,
    );

  return tl;
}

/**
 * Snap channels to the settled turnaround-end state without any scrub
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
  ch.key = 1.0;
  ch.fill = 0.85;
  ch.rim = 0.6;
  ch.dofFocus = 0.55;
  ch.dofBokeh = 0.12;
}
