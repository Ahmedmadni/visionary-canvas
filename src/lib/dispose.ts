/**
 * Deep-dispose helper for Three.js objects.
 *
 * Three doesn't garbage-collect GPU resources — you must call `.dispose()`
 * on geometries, materials, textures, and render targets. Missing a
 * dispose on scene teardown is the #1 cause of "memory grows every time I
 * change scenes" bugs.
 *
 * Call `disposeObject(root)` on the root object of a scene when it
 * unmounts (SceneManager does this automatically for registered scenes).
 */

import type { Material, Object3D, Texture } from "three";

interface MaybeDisposable {
  dispose?: () => void;
}

type MaterialWithMaps = Material & Record<string, unknown>;

function disposeMaterial(material: Material): void {
  const mat = material as MaterialWithMaps;
  for (const key of Object.keys(mat)) {
    const value = mat[key];
    if (value && typeof value === "object" && "isTexture" in value && (value as Texture).isTexture) {
      (value as Texture).dispose();
    }
  }
  material.dispose();
}

export function disposeObject(root: Object3D): void {
  root.traverse((obj) => {
    const mesh = obj as Object3D & {
      geometry?: MaybeDisposable;
      material?: Material | Material[];
    };
    mesh.geometry?.dispose?.();
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(disposeMaterial);
    } else if (mesh.material) {
      disposeMaterial(mesh.material);
    }
  });
}
