/**
 * HeroMonolith — host for the hero shawarma model.
 *
 * The reveal is done by LIGHT, not by fading the mesh, so the model is
 * present in the graph from the first frame and simply sits in darkness
 * until the rig ignites. A subtle authored "rise" (lift + micro-scale) is
 * applied to the transform group from the `rise` channel as it emerges.
 *
 * Graceful degradation is the whole point of this file: when the hero GLB
 * is not yet committed, we render NOTHING here — no placeholder cube, no
 * procedural stand-in. The scene plays as a lit, hazy void awaiting its
 * subject, and the console notes the absence once in dev.
 */

import { Suspense, useEffect, useRef } from "react";
import type { Group } from "three";

import { frameBus } from "@/lib/renderLoop";
import { isScene01AssetReady } from "../assets";
import { useScene01Runtime } from "../runtime";
import { useHeroModel } from "../hooks/useHeroModel";

const BASE_Y = -0.18;
const RISE_Y = 0.18;

function HeroModel({ castShadow }: { castShadow: boolean }) {
  const scene = useHeroModel(castShadow);
  return <primitive object={scene} />;
}

export function HeroMonolith() {
  const { channels, budget } = useScene01Runtime();
  const groupRef = useRef<Group>(null);
  const ready = isScene01AssetReady("hero");

  useEffect(() => {
    if (!ready && import.meta.env.DEV) {
      console.info(
        "[scene-01] Hero model not present — playing the lit-void fallback. " +
          "Drop the GLB at its manifest url and flip `ready` to enable it.",
      );
    }
  }, [ready]);

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
      {ready && (
        <Suspense fallback={null}>
          <HeroModel castShadow={budget.shadows} />
        </Suspense>
      )}
    </group>
  );
}
