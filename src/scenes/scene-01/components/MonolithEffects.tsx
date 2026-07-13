/**
 * MonolithEffects — the scene's postprocessing grade.
 *
 * Hosted inside the shared, tier-aware <Effects> composer. Bloom intensity
 * tracks the `key` channel so the hero blooms as the light comes up;
 * vignette + a whisper of film grain hold the frame together. The whole
 * stack is skipped when the performance budget disallows postprocessing
 * (low tier / weak mobile), where <Effects> already returns null anyway.
 *
 * Effect instances are updated imperatively via refs from the frame bus —
 * never through React props on a per-frame basis.
 */

import { Bloom, Noise, Vignette } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useEffect, useRef } from "react";

import { Effects } from "@/components/webgl/Effects";
import { frameBus } from "@/lib/renderLoop";
import { useScene01Runtime } from "../runtime";

const BLOOM_BASE = 0.15;
const BLOOM_GAIN = 0.85;

export function MonolithEffects() {
  const { channels, budget } = useScene01Runtime();
  const bloomRef = useRef<{ intensity: number } | null>(null);

  useEffect(() => {
    if (!budget.postprocess) return;
    const unsubscribe = frameBus.subscribe(() => {
      if (bloomRef.current) {
        bloomRef.current.intensity = BLOOM_BASE + channels.current.key * BLOOM_GAIN;
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
        luminanceThreshold={0.6}
        luminanceSmoothing={0.25}
      />
      <Vignette eskil={false} offset={0.28} darkness={0.9} />
      <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.035} />
    </Effects>
  );
}
