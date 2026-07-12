/**
 * Effects — tier-aware postprocessing wrapper.
 *
 * Renders an EffectComposer that hosts scene-provided effects as
 * children. Returns `null` on low tier so we skip the composer overhead
 * entirely. Scenes pass effects as children:
 *
 *   <Effects><Bloom intensity={0.8} /><Vignette /></Effects>
 *
 * Uses `enableNormalPass={false}` by default (most effects don't need
 * it) and `multisampling={0}` (rely on MSAA in the base render target
 * only when tier is high — configured via Canvas gl.antialias).
 */

import { EffectComposer } from "@react-three/postprocessing";
import type { ReactElement, ReactNode } from "react";

import { enablePostprocessing } from "@/lib/performance";
import { useAppStore } from "@/store";

interface EffectsProps {
  children?: ReactNode;
  enableNormalPass?: boolean;
}

export function Effects({ children, enableNormalPass = false }: EffectsProps) {
  const tier = useAppStore((s) => s.performanceTier);
  if (!enablePostprocessing(tier) || !children) return null;

  // EffectComposer's children are typed as Effect elements; scenes pass
  // postprocessing components (Bloom, Vignette, etc.) directly.
  return (
    <EffectComposer multisampling={0} enableNormalPass={enableNormalPass}>
      {children as ReactElement}
    </EffectComposer>
  );
}
