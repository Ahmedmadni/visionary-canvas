/**
 * useHeroModel — loads the hero shawarma GLB through drei's cached
 * loader (DRACO + Meshopt wired) and prepares its meshes for the rig.
 *
 * This hook SUSPENDS while the model streams, so it must only ever be
 * mounted behind a <Suspense> boundary AND only when the asset is
 * actually present (`isScene01AssetReady("hero")`). The host component
 * enforces that gate — this hook assumes the file exists.
 */

import { useGLTF } from "@react-three/drei";
import { useLayoutEffect } from "react";
import type { Mesh, Object3D } from "three";

import { getScene01Asset } from "../assets";

export function useHeroModel(castShadow: boolean): Object3D {
  const url = getScene01Asset("hero").url;
  // (path, useDraco, useMeshopt) — matches the compressed-GLB pipeline.
  const { scene } = useGLTF(url, true, true);

  useLayoutEffect(() => {
    scene.traverse((obj) => {
      const mesh = obj as Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = castShadow;
        mesh.receiveShadow = false;
        mesh.frustumCulled = false; // single hero, always on screen
      }
    });
  }, [scene, castShadow]);

  return scene;
}

/** Warm the cache ahead of mount. No-op until the real asset lands. */
export function preloadHeroModel(): void {
  useGLTF.preload(getScene01Asset("hero").url, true, true);
}
