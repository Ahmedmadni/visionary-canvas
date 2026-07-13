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
 */

import gsap from "gsap";

import { SCENE_01_BEATS } from "./config";
import type { CameraKeyframe } from "./cameras";

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
  // Visual drivers, all normalized 0..1.
  reveal: number; // hero emergence from the void
  rim: number; // cyan rim-light intensity
  key: number; // warm key-light intensity
  haze: number; // volumetric density
  dust: number; // dust-field opacity
  rise: number; // subtle hero lift/scale on reveal
  vignette: number; // postprocessing vignette darkness
  grade: number; // color-grade progression
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
    reveal: 0,
    rim: 0,
    key: 0,
    haze: 1,
    dust: 0,
    rise: 0,
    vignette: 1,
    grade: 0,
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

  // --- Camera: chained segments between keyframes, positioned on the
  // absolute beat time so retiming a beat retimes the camera with it.
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
        duration,
        ease: kf.ease,
      },
      at,
    );
  }

  const B = SCENE_01_BEATS;

  // --- Visual drivers. Authored against the same beat map. Positions are
  // absolute times; durations are the gap to the next relevant beat.

  // Reveal: void → silhouette at ignition, fully present by rise.
  tl.to(ch, { reveal: 0.35, duration: B.ignition, ease: "power1.in" }, 0).to(
    ch,
    { reveal: 1, duration: B.rise - B.ignition, ease: "power2.out" },
    B.ignition,
  );

  // Rim light ignites sharply at the ignition beat, then holds.
  tl.to(ch, { rim: 0, duration: B.ignition, ease: "none" }, 0)
    .to(ch, { rim: 1, duration: B.rise - B.ignition, ease: "power3.out" }, B.ignition)
    .to(ch, { rim: 0.85, duration: B.hero - B.rise, ease: "sine.inOut" }, B.rise);

  // Key light blooms in across the rise and holds through the hero beat.
  tl.to(ch, { key: 0, duration: B.ignition, ease: "none" }, 0)
    .to(ch, { key: 0.6, duration: B.orbit - B.ignition, ease: "power2.inOut" }, B.ignition)
    .to(ch, { key: 1, duration: B.hero - B.orbit, ease: "power2.out" }, B.orbit);

  // Haze is dense in the void, thins as the key light takes over.
  tl.to(ch, { haze: 1, duration: B.rise, ease: "sine.inOut" }, 0).to(
    ch,
    { haze: 0.45, duration: B.hero - B.rise, ease: "power1.out" },
    B.rise,
  );

  // Dust catches the beams from the rise onward, peaks in the orbit.
  tl.to(ch, { dust: 0, duration: B.rise, ease: "none" }, 0)
    .to(ch, { dust: 1, duration: B.orbit - B.rise, ease: "power1.out" }, B.rise)
    .to(ch, { dust: 0.7, duration: B.hero - B.orbit, ease: "sine.inOut" }, B.orbit);

  // Hero lift/scale — a subtle authored "breath" as it emerges.
  tl.to(ch, { rise: 1, duration: B.orbit, ease: "power2.out" }, B.ignition);

  // Vignette relaxes as the frame opens up into the hero hold.
  tl.to(ch, { vignette: 1, duration: B.rise, ease: "sine.inOut" }, 0).to(
    ch,
    { vignette: 0.6, duration: B.hero - B.rise, ease: "power1.out" },
    B.rise,
  );

  // Color grade drifts from cold void toward the warm hero balance.
  tl.to(ch, { grade: 1, duration: B.hero, ease: "sine.inOut" }, 0);

  return tl;
}

/**
 * Snap channels to the fully-revealed hero state without any scrub drama.
 * Used for reduced-motion, where we present the destination rather than
 * animating the whole reveal on scroll.
 */
export function applyScene01Settled(
  ch: Scene01Channels,
  keyframes: readonly CameraKeyframe[],
): void {
  const hero = keyframes[keyframes.length - 1];
  ch.px = hero.position[0];
  ch.py = hero.position[1];
  ch.pz = hero.position[2];
  ch.tx = hero.target[0];
  ch.ty = hero.target[1];
  ch.tz = hero.target[2];
  ch.fov = hero.fov;
  ch.reveal = 1;
  ch.rim = 0.85;
  ch.key = 1;
  ch.haze = 0.45;
  ch.dust = 0.7;
  ch.rise = 1;
  ch.vignette = 0.6;
  ch.grade = 1;
}
