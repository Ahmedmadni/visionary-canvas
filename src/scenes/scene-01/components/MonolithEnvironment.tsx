/**
 * MonolithEnvironment — the void the hero stands in.
 *
 *  - Near-black graphite background + exponential fog whose density is
 *    driven by the timeline's `haze` channel.
 *  - A reflective obsidian floor (drei MeshReflectorMaterial) on capable
 *    tiers, degrading to a plain dark standard material on low/mobile.
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
import { Color, FogExp2, type MeshStandardMaterial } from "three";

import { frameBus } from "@/lib/renderLoop";
import { useEnvironmentMap, useFloorMaps } from "../assets";
import { useScene01Runtime } from "../runtime";

const BACKGROUND = new Color("#080a0e");
const FOG_COLOR = new Color("#0a0c11");
const FLOOR_COLOR = new Color("#05070a");

const FOG_MIN = 0.028;
const FOG_MAX = 0.14;

export function MonolithEnvironment() {
  const { channels, tier } = useScene01Runtime();
  const scene = useThree((s) => s.scene);
  const envMap = useEnvironmentMap();
  const floorMaps = useFloorMaps();

  // Own the scene background + fog for the life of the mount; restore on exit.
  useEffect(() => {
    const prevBackground = scene.background;
    const prevFog = scene.fog;
    const fog = new FogExp2(FOG_COLOR.getHex(), FOG_MIN);
    scene.background = BACKGROUND;
    scene.fog = fog;

    const unsubscribe = frameBus.subscribe(() => {
      fog.density = FOG_MIN + channels.current.haze * (FOG_MAX - FOG_MIN);
    });

    return () => {
      scene.background = prevBackground;
      scene.fog = prevFog;
      unsubscribe();
    };
  }, [scene, channels]);

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
  const reflectorRes = tier === "high" ? 1024 : 512;

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
      {/* Reflective obsidian floor. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        {reflective ? (
          <MeshReflectorMaterial
            ref={setFloorMat}
            resolution={reflectorRes}
            mixBlur={1}
            mixStrength={2.2}
            blur={[420, 120]}
            roughness={0.55}
            depthScale={1.1}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.3}
            metalness={0.85}
            color={FLOOR_COLOR}
            mirror={0}
          />
        ) : (
          <meshStandardMaterial
            ref={setFloorMat}
            color={FLOOR_COLOR}
            roughness={0.6}
            metalness={0.7}
          />
        )}
      </mesh>
    </group>
  );
}
