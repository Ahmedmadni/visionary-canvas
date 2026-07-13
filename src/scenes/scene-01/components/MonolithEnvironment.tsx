/**
 * MonolithEnvironment — the void the hero stands in.
 *
 *  - A near-black graphite background + exponential fog whose density is
 *    driven by the timeline's `haze` channel (dense mystery early, thins
 *    as the key light takes over).
 *  - A reflective obsidian floor (drei MeshReflectorMaterial) on capable
 *    tiers, degrading to a plain dark standard material on low/mobile.
 *  - Image-based lighting from the studio HDR — but ONLY once that asset
 *    is committed; until then we run lightless-IBL and lean on the
 *    explicit three-point rig.
 *
 * No placeholder geometry stands in for the hero here; the floor is real
 * set dressing, not a stand-in for the missing model.
 */

import { Environment, MeshReflectorMaterial } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { Color, FogExp2 } from "three";

import { frameBus } from "@/lib/renderLoop";
import { getScene01Asset, isScene01AssetReady } from "../assets";
import { useScene01Runtime } from "../runtime";

const BACKGROUND = new Color("#080a0e");
const FOG_COLOR = new Color("#0a0c11");
const FLOOR_COLOR = new Color("#05070a");

const FOG_MIN = 0.028;
const FOG_MAX = 0.14;

export function MonolithEnvironment() {
  const { channels, budget, tier } = useScene01Runtime();
  const scene = useThree((s) => s.scene);

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

  // Mirror floor is the single most expensive pass here — off on low tier.
  const reflective = tier !== "low";
  const reflectorRes = tier === "high" ? 1024 : 512;

  return (
    <group>
      {/* Reflective obsidian floor. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        {reflective ? (
          <MeshReflectorMaterial
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
          <meshStandardMaterial color={FLOOR_COLOR} roughness={0.6} metalness={0.7} />
        )}
      </mesh>

      {/* Image-based lighting — only when the real HDR is present. */}
      {isScene01AssetReady("environment") && (
        <Environment files={getScene01Asset("environment").url} background={false} />
      )}
    </group>
  );
}
