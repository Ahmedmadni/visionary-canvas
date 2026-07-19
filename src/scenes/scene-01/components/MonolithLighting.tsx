/**
 * MonolithLighting — the clean studio three-point rig.
 *
 * Matches the approved reference video: a bright, even, fully-lit product
 * shot rather than a moody chiaroscuro reveal.
 *
 *   KEY   soft warm-neutral softbox from upper-left (Rembrandt-adjacent),
 *         gently settles in over the first moments and then holds near
 *         full — no dramatic ignition.
 *   FILL  a broad, near-neutral hemisphere that keeps shadow detail open;
 *         MUCH stronger than the old cold-void fill — studio work is
 *         low-contrast by design.
 *   RIM   a soft, near-white separation light from behind (NOT the old
 *         cyan) — just enough to lift the product off the background.
 *
 * Light INTENSITIES are driven imperatively from the timeline channels
 * (`key`, `fill`, `rim`) every frame. Contact shadows are gated by the
 * performance budget.
 */

import { ContactShadows } from "@react-three/drei";
import { useEffect, useRef } from "react";
import type { HemisphereLight, SpotLight } from "three";

import { frameBus } from "@/lib/renderLoop";
import { SCENE_01_FRAME_PRIORITY } from "../config";
import { useScene01Runtime } from "../runtime";

// Peak intensities each channel ramps toward (channel is 0..1).
const KEY_MAX = 22;
const RIM_MAX = 10;
const FILL_MAX = 1.4;

const KEY_COLOR = "#fff3e0"; // soft warm-neutral, ~5200K
const RIM_COLOR = "#f2f6ff"; // soft near-white separation light
const FILL_SKY = "#eef2f7"; // near-neutral, very slightly cool
const FILL_GROUND = "#15181d";

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
      if (fillRef.current) fillRef.current.intensity = ch.fill * FILL_MAX;
    }, SCENE_01_FRAME_PRIORITY.camera);
    return unsubscribe;
  }, [channels]);

  return (
    <group>
      {/* Warm-neutral key — upper-left softbox. */}
      <spotLight
        ref={keyRef}
        position={[-4.2, 5.4, 3.2]}
        angle={0.62}
        penumbra={1}
        distance={30}
        decay={1.4}
        color={KEY_COLOR}
        intensity={0}
        castShadow={budget.shadows}
        shadow-mapSize-width={budget.shadows ? 1024 : 0}
        shadow-mapSize-height={budget.shadows ? 1024 : 0}
        shadow-bias={-0.0004}
      />
      {/* Soft near-white rim — behind, slightly high, lifts the product
          off the background without reading as colored light. */}
      <spotLight
        ref={rimRef}
        position={[0.6, 3.0, -4.6]}
        angle={0.7}
        penumbra={1}
        distance={26}
        decay={1.8}
        color={RIM_COLOR}
        intensity={0}
      />
      {/* Broad near-neutral fill — studio low-contrast, not a void ambient. */}
      <hemisphereLight ref={fillRef} args={[FILL_SKY, FILL_GROUND, 0]} />

      {budget.shadows && (
        <ContactShadows
          position={[0, 0.001, 0]}
          scale={12}
          resolution={budget.envResolution}
          blur={2.2}
          opacity={0.55}
          far={6}
          color="#000000"
        />
      )}
    </group>
  );
}
