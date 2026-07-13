/**
 * MonolithLighting — the three-point cinematic rig for the reveal.
 *
 *   KEY   warm Rembrandt spot from upper-left, blooms in across the rise.
 *   RIM   cold cyan spot from behind, ignites sharply to carve the
 *         silhouette out of the void.
 *   FILL  a very low cold hemisphere so shadow detail never goes fully
 *         black on brighter tiers.
 *
 * Light INTENSITIES are driven imperatively from the timeline channels
 * (`key`, `rim`) every frame — that is what actually "reveals" the hero,
 * rather than fading the mesh opacity. Contact shadows are gated by the
 * performance budget.
 */

import { ContactShadows } from "@react-three/drei";
import { useEffect, useRef } from "react";
import type { HemisphereLight, SpotLight } from "three";

import { frameBus } from "@/lib/renderLoop";
import { SCENE_01_FRAME_PRIORITY } from "../config";
import { useScene01Runtime } from "../runtime";

// Peak intensities each channel ramps toward (channel is 0..1).
const KEY_MAX = 26;
const RIM_MAX = 34;
const FILL_MAX = 0.35;

const KEY_COLOR = "#ffd7a1"; // warm tungsten
const RIM_COLOR = "#57d6ff"; // cold cyan
const FILL_SKY = "#22303a"; // cold, dim
const FILL_GROUND = "#050608";

export function MonolithLighting() {
  const { channels, budget } = useScene01Runtime();
  const keyRef = useRef<SpotLight>(null);
  const rimRef = useRef<SpotLight>(null);
  const fillRef = useRef<HemisphereLight>(null);

  useEffect(() => {
    const unsubscribe = frameBus.subscribe(() => {
      const ch = channels.current;
      if (keyRef.current) keyRef.current.intensity = ch.key * KEY_MAX;
      if (rimRef.current) rimRef.current.intensity = ch.rim * RIM_MAX;
      if (fillRef.current) fillRef.current.intensity = ch.key * FILL_MAX;
    }, SCENE_01_FRAME_PRIORITY.camera);
    return unsubscribe;
  }, [channels]);

  return (
    <group>
      {/* Warm key — upper-left Rembrandt. */}
      <spotLight
        ref={keyRef}
        position={[-4.2, 5.4, 3.2]}
        angle={0.52}
        penumbra={0.85}
        distance={30}
        decay={1.6}
        color={KEY_COLOR}
        intensity={0}
        castShadow={budget.shadows}
        shadow-mapSize-width={budget.shadows ? 1024 : 0}
        shadow-mapSize-height={budget.shadows ? 1024 : 0}
        shadow-bias={-0.0004}
      />
      {/* Cold rim — behind, slightly high, separates hero from the void. */}
      <spotLight
        ref={rimRef}
        position={[0.6, 3.0, -4.6]}
        angle={0.6}
        penumbra={1}
        distance={26}
        decay={1.8}
        color={RIM_COLOR}
        intensity={0}
      />
      {/* Cold fill — barely-there ambient so blacks aren't crushed flat. */}
      <hemisphereLight ref={fillRef} args={[FILL_SKY, FILL_GROUND, 0]} />

      {budget.shadows && (
        <ContactShadows
          position={[0, 0.001, 0]}
          scale={12}
          resolution={budget.envResolution * 4}
          blur={2.6}
          opacity={0.7}
          far={6}
          color="#000000"
        />
      )}
    </group>
  );
}
