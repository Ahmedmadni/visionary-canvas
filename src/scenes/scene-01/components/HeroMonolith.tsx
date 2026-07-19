/**
 * HeroMonolith — host for the hero shawarma model.
 *
 * The model is sourced from the production asset pipeline: `useHeroScene`
 * returns the decoded GLB the instant it is validated + uploaded, or
 * `null` while it is absent / loading / failed. Because the pipeline hands
 * back a fully-ready object (no Suspense), swapping it in never flashes a
 * half-loaded state. When the model is absent we render NOTHING here — no
 * placeholder geometry, ever.
 *
 * The product is fully lit and fully present from frame one (studio
 * product-viz, not a darkness reveal) — the only per-frame work here is
 * applying the authored POSE: `tiltZ` tips the hero onto its side for the
 * lying hero-shot beauty framing, `spinY` drives the turnaround's slow
 * yaw. `BASE_Y_LYING` is a principled approximation of the resting height
 * once tipped over, pending the real hero GLB's bounds — retune it once
 * the asset lands (see docs/scene-01-production-asset-guide.md).
 */

import { useEffect, useLayoutEffect, useRef } from "react";
import type { Group, Mesh } from "three";

import { frameBus } from "@/lib/renderLoop";
import { useHeroScene } from "../assets";
import { useScene01Runtime } from "../runtime";

const BASE_Y_STANDING = -0.18;
const BASE_Y_LYING = -0.75;
const TILT_LYING = -Math.PI / 2;

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
      const ch = channels.current;
      // 0 = standing, 1 = fully lying — lets BASE_Y follow the tilt even
      // if a future shot eases continuously instead of hard-cutting.
      const lyingFraction = ch.tiltZ / TILT_LYING;
      g.position.y = BASE_Y_STANDING + lyingFraction * (BASE_Y_LYING - BASE_Y_STANDING);
      g.rotation.z = ch.tiltZ;
      g.rotation.y = ch.spinY;
    });
    return unsubscribe;
  }, [channels]);

  return (
    <group ref={groupRef} position={[0, BASE_Y_STANDING, 0]}>
      {heroScene && <primitive object={heroScene} />}
    </group>
  );
}
