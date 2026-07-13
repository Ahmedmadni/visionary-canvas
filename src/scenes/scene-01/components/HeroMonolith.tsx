/**
 * HeroMonolith — host for the hero shawarma model.
 *
 * The model is sourced from the production asset pipeline: `useHeroScene`
 * returns the decoded GLB the instant it is validated + uploaded, or
 * `null` while it is absent / loading / failed. Because the pipeline hands
 * back a fully-ready object (no Suspense), swapping it in never flashes a
 * half-loaded state — the scene simply transitions from lit-void to hero.
 *
 * The reveal is done by LIGHT, not by fading the mesh, so once present the
 * model sits in darkness until the rig ignites. A subtle authored "rise"
 * (lift + micro-scale) is applied from the `rise` channel. When the model
 * is absent we render NOTHING here — no placeholder geometry, ever.
 */

import { useEffect, useLayoutEffect, useRef } from "react";
import type { Group, Mesh } from "three";

import { frameBus } from "@/lib/renderLoop";
import { useHeroScene } from "../assets";
import { useScene01Runtime } from "../runtime";

const BASE_Y = -0.18;
const RISE_Y = 0.18;

export function HeroMonolith() {
  const { channels, budget } = useScene01Runtime();
  const groupRef = useRef<Group>(null);
  const heroScene = useHeroScene();

  // Prepare meshes for the rig whenever a (new) model arrives.
  useLayoutEffect(() => {
    if (!heroScene) return;
    heroScene.traverse((obj) => {
      const mesh = obj as Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = budget.shadows;
        mesh.receiveShadow = false;
        mesh.frustumCulled = false; // single hero, always on screen
      }
    });
  }, [heroScene, budget.shadows]);

  useEffect(() => {
    const unsubscribe = frameBus.subscribe(() => {
      const g = groupRef.current;
      if (!g) return;
      const rise = channels.current.rise;
      g.position.y = BASE_Y + rise * RISE_Y;
      const s = 0.985 + rise * 0.015;
      g.scale.set(s, s, s);
    });
    return unsubscribe;
  }, [channels]);

  return (
    <group ref={groupRef} position={[0, BASE_Y, 0]}>
      {heroScene && <primitive object={heroScene} />}
    </group>
  );
}
