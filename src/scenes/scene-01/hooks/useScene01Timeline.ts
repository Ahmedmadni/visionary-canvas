/**
 * useScene01Timeline — builds the authored GSAP timeline for the current
 * device framing and scrubs it from the damped scroll progress every
 * frame via the shared frame bus.
 *
 * Flow each frame:
 *   scrollProgress (store) → chapter-local (0..1) → damped → tl.progress()
 *
 * Reduced motion short-circuits the scrub: we snap the channels to the
 * settled hero state once and skip the timeline entirely, so motion-
 * sensitive users still get the composed frame without the reveal.
 *
 * The hook owns the timeline's lifecycle and kills it on unmount — GSAP
 * timelines hold references that must be released explicitly.
 */

import { useEffect } from "react";

import { frameBus, damp } from "@/lib/renderLoop";
import { useAppStore } from "@/store";
import { getScene01ScrollRange, SCENE_01_FRAME_PRIORITY, SCENE_01_SCRUB_HALFLIFE } from "../config";
import { useScene01Runtime } from "../runtime";
import { applyScene01Settled, buildScene01Timeline } from "../timeline";

/** Clamped local progress across the scene's active page range. */
function localProgress(scroll: number): number {
  const { start, end } = getScene01ScrollRange();
  const span = end - start;
  if (span <= 0) return scroll >= end ? 1 : 0;
  const t = (scroll - start) / span;
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

export function useScene01Timeline(): void {
  const { channels, keyframes, reducedMotion } = useScene01Runtime();

  useEffect(() => {
    const ch = channels.current;

    if (reducedMotion) {
      applyScene01Settled(ch, keyframes);
      return;
    }

    const tl = buildScene01Timeline(ch, keyframes);
    let scrubbed = 0; // damped local progress

    const unsubscribe = frameBus.subscribe(({ delta }) => {
      const local = localProgress(useAppStore.getState().scrollProgress);
      // Frame-rate-independent easing toward the raw scroll target adds
      // cinematic weight without decoupling from the scroll position.
      scrubbed = damp(scrubbed, local, SCENE_01_SCRUB_HALFLIFE, delta);
      tl.progress(scrubbed);
    }, SCENE_01_FRAME_PRIORITY.timeline);

    return () => {
      unsubscribe();
      tl.kill();
    };
  }, [channels, keyframes, reducedMotion]);
}
