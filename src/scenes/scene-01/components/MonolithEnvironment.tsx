/**
 * MonolithEnvironment — the studio the hero stands in.
 *
 *  - Near-black graphite background — no volumetric fog. The reference
 *    video's air is clean; depth is read from the floor reflection and
 *    lighting falloff alone, not haze. (The scene's old `FogExp2` +
 *    `haze` channel were removed for the clean-studio direction — see
 *    docs/scene-01-reference-breakdown.md.)
 *  - A reflective obsidian floor (drei MeshReflectorMaterial) with a
 *    CRISP mirror (low blur, high resolution) on capable tiers, matching
 *    the reference's sharp reflection — degrading to a plain dark
 *    standard material on low/mobile.
 *  - Image-based lighting + floor PBR maps sourced from the production
 *    asset pipeline: applied imperatively the moment they decode, with a
 *    clean restore on teardown. Until they arrive the scene runs on its
 *    explicit three-point rig and untextured floor — no glitch, no pop.
 *
 * No placeholder geometry stands in for the hero; the floor is real set
 * dressing, not a stand-in for a missing model.
 */

import { MeshReflectorMaterial } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import { Color, type MeshStandardMaterial } from "three";

import { useEnvironmentMap, useFloorMaps } from "../assets";
import { useScene01Runtime } from "../runtime";

const BACKGROUND = new Color("#0c0e12");
const FLOOR_COLOR = new Color("#05070a");

export function MonolithEnvironment() {
  const { tier } = useScene01Runtime();
  const scene = useThree((s) => s.scene);
  const envMap = useEnvironmentMap();
  const floorMaps = useFloorMaps();

  // Own the scene background for the life of the mount; restore on exit.
  useEffect(() => {
    const prevBackground = scene.background;
    scene.background = BACKGROUND;
    return () => {
      scene.background = prevBackground;
    };
  }, [scene]);

  // Apply / restore image-based lighting when the HDR env map arrives.
  useEffect(() => {
    if (!envMap) return;
    const prev = scene.environment;
    scene.environment = envMap;
    return () => {
      scene.environment = prev;
    };
  }, [scene, envMap]);

  // Mirror floor is the single most expensive pass here — off on low tier.
  const reflective = tier !== "low";
  const reflectorRes = tier === "high" ? 1536 : 768;

  // Track the mounted floor material so PBR maps can be applied both when
  // they hot-load (floorMaps changes) and when the material remounts on a
  // tier flip (matVersion changes).
  const floorMatRef = useRef<MeshStandardMaterial | null>(null);
  const [matVersion, setMatVersion] = useState(0);
  const setFloorMat = useCallback((mat: MeshStandardMaterial | null) => {
    floorMatRef.current = mat;
    if (mat) setMatVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    const mat = floorMatRef.current;
    if (!mat || !floorMaps) return;
    if (floorMaps.albedo) mat.map = floorMaps.albedo;
    if (floorMaps.normal) mat.normalMap = floorMaps.normal;
    if (floorMaps.roughness) mat.roughnessMap = floorMaps.roughness;
    mat.needsUpdate = true;
  }, [floorMaps, matVersion]);

  return (
    <group>
      {/* Reflective obsidian floor — crisp mirror, per the reference. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        {reflective ? (
          <MeshReflectorMaterial
            ref={setFloorMat}
            resolution={reflectorRes}
            mixBlur={0.35}
            mixStrength={1.4}
            blur={[80, 32]}
            roughness={0.28}
            depthScale={0.9}
            minDepthThreshold={0.5}
            maxDepthThreshold={1.4}
            metalness={0.92}
            color={FLOOR_COLOR}
            mirror={0}
          />
        ) : (
          <meshStandardMaterial
            ref={setFloorMat}
            color={FLOOR_COLOR}
            roughness={0.4}
            metalness={0.8}
          />
        )}
      </mesh>
    </group>
  );
}
