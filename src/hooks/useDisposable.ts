/**
 * useDisposable — register any Three.js resource (geometry, material,
 * texture, render target) for automatic disposal on component unmount.
 *
 * Complements SceneManager's deep-dispose pass, which only covers the
 * scene root's Object3D graph. Use this for off-graph resources such as
 * FBOs, external textures, and standalone materials.
 */

import { useEffect } from "react";

interface Disposable {
  dispose: () => void;
}

export function useDisposable(resource: Disposable | null | undefined): void {
  useEffect(() => {
    return () => {
      resource?.dispose();
    };
  }, [resource]);
}
