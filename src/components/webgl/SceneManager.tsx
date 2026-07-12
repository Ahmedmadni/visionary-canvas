/**
 * Scene manager.
 *
 * Looks up the active scene from the global store, lazy-loads its module
 * via the scene registry, and mounts it inside a Suspense boundary. Scene
 * transitions (fade, morph, etc.) will be layered on later — for now the
 * manager is a pure router between scene chunks.
 */

import { Suspense, useMemo } from "react";

import { getScene } from "@/scenes";
import { useAppStore } from "@/store";

export function SceneManager() {
  const activeScene = useAppStore((s) => s.activeScene);

  const SceneComponent = useMemo(() => {
    if (!activeScene) return null;
    return getScene(activeScene);
  }, [activeScene]);

  if (!SceneComponent) return null;

  return (
    <Suspense fallback={null}>
      <SceneComponent />
    </Suspense>
  );
}
