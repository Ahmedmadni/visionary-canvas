/**
 * MonolithEffects — the scene's postprocessing stack.
 *
 * Reworked for the clean studio direction: a tasteful, mostly-static
 * specular bloom (tracks `key`, which itself barely varies now), a
 * tier-gated DEPTH OF FIELD driven by the `dofFocus`/`dofBokeh` channels
 * (moderate shallow during the hero push-in, near-deep for the
 * turnaround's spec-sheet clarity — see docs/scene-01-reference-
 * breakdown.md shots C1/B), and a static, much-reduced vignette. Film
 * grain (`Noise`) is DROPPED — the reference's frame is clean, no grain.
 *
 * The whole stack is skipped when the performance budget disallows
 * postprocessing (low tier / weak mobile); DOF has its OWN finer-grained
 * budget flag (`budget.dof`) since it is the single most expensive pass
 * here, on top of the reflective floor.
 *
 * Effect instances are updated imperatively via refs from the frame bus —
 * never through React props on a per-frame basis.
 */

import { Bloom, DepthOfField, Vignette } from "@react-three/postprocessing";
import type { DepthOfFieldEffect } from "postprocessing";
import { useEffect, useRef } from "react";

import { Effects } from "@/components/webgl/Effects";
import { frameBus } from "@/lib/renderLoop";
import { useScene01Runtime } from "../runtime";

const BLOOM_BASE = 0.1;
const BLOOM_GAIN = 0.35;

// Map the normalized 0..1 DOF channels onto world-unit / effect-native
// ranges. Approximate against the authored camera-to-target distances in
// cameras.ts; retune alongside the camera once a real hero GLB is in.
const DOF_FOCUS_MIN = 3.0;
const DOF_FOCUS_MAX = 6.0;
const DOF_BOKEH_MIN = 0.4;
const DOF_BOKEH_MAX = 3.2;

const VIGNETTE_OFFSET = 0.32;
const VIGNETTE_DARKNESS = 0.35;

export function MonolithEffects() {
  const { channels, budget } = useScene01Runtime();
  const bloomRef = useRef<{ intensity: number } | null>(null);
  const dofRef = useRef<DepthOfFieldEffect | null>(null);

  useEffect(() => {
    if (!budget.postprocess) return;
    const unsubscribe = frameBus.subscribe(() => {
      const ch = channels.current;
      if (bloomRef.current) {
        bloomRef.current.intensity = BLOOM_BASE + ch.key * BLOOM_GAIN;
      }
      if (dofRef.current) {
        const focus = DOF_FOCUS_MIN + ch.dofFocus * (DOF_FOCUS_MAX - DOF_FOCUS_MIN);
        const bokeh = DOF_BOKEH_MIN + ch.dofBokeh * (DOF_BOKEH_MAX - DOF_BOKEH_MIN);
        dofRef.current.circleOfConfusionMaterial.focusDistance = focus;
        dofRef.current.bokehScale = bokeh;
      }
    });
    return unsubscribe;
  }, [channels, budget.postprocess]);

  if (!budget.postprocess) return null;

  return (
    <Effects>
      <Bloom
        ref={bloomRef as never}
        mipmapBlur
        intensity={BLOOM_BASE}
        luminanceThreshold={0.65}
        luminanceSmoothing={0.25}
      />
      {budget.dof && (
        <DepthOfField
          ref={dofRef}
          focusDistance={DOF_FOCUS_MIN}
          focalLength={0.02}
          bokehScale={DOF_BOKEH_MIN}
        />
      )}
      <Vignette eskil={false} offset={VIGNETTE_OFFSET} darkness={VIGNETTE_DARKNESS} />
    </Effects>
  );
}
