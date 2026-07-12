/**
 * Scene manager.
 *
 * Handles the full scene lifecycle:
 *  1. Resolves the active scene from the store.
 *  2. Runs the scene's preload (asset warmup + custom side effects).
 *  3. Mounts the scene component inside a Suspense boundary.
 *  4. Deep-disposes the scene root on unmount to release GPU memory.
 *  5. Emits enter/exit events through the bus so audio and UI layers
 *     can react without prop-drilling.
 */

import { useThree } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { Group } from "three";

import { disposeObject } from "@/lib/dispose";
import { eventBus } from "@/lib/eventBus";
import { getSceneComponent, getSceneDefinition } from "@/scenes";
import { useAppStore } from "@/store";
import type { AssetDescriptor, SceneId } from "@/types";

async function preloadAssets(assets: readonly AssetDescriptor[]): Promise<void> {
  if (assets.length === 0) return;
  const setProgress = useAppStore.getState().setLoadingProgress;
  setProgress(0, assets.length);

  let loaded = 0;
  await Promise.all(
    assets.map(async (asset) => {
      try {
        // GLTF/texture preloads run inside the scene via drei hooks; this
        // step primes the HTTP cache for every asset kind uniformly.
        await fetch(asset.url, { cache: "force-cache" });
      } finally {
        loaded += 1;
        setProgress(loaded, assets.length);
      }
    }),
  );
}

export function SceneManager() {
  const activeScene = useAppStore((s) => s.activeScene);
  const previousScene = useAppStore((s) => s.previousScene);
  const [readyScene, setReadyScene] = useState<SceneId | null>(null);
  const rootRef = useRef<Group>(null);

  // Preload + swap.
  useEffect(() => {
    if (!activeScene) {
      setReadyScene(null);
      return;
    }
    const def = getSceneDefinition(activeScene);
    if (!def) {
      // eslint-disable-next-line no-console
      console.error(`[SceneManager] Unknown scene id: "${activeScene}"`);
      return;
    }

    let cancelled = false;
    eventBus.emit("scene:preload-start", { id: def.id });

    (async () => {
      if (def.assets) await preloadAssets(def.assets);
      if (def.preload) await def.preload();
      if (cancelled) return;
      eventBus.emit("scene:preload-complete", { id: def.id });
      eventBus.emit("scene:enter", { id: def.id });
      setReadyScene(def.id);
    })();

    return () => {
      cancelled = true;
      eventBus.emit("scene:exit", { id: def.id });
    };
  }, [activeScene]);

  // Track previous scene id so we emit correct exit events on unmount.
  useEffect(() => {
    if (previousScene && previousScene !== activeScene) {
      eventBus.emit("scene:exit", { id: previousScene });
    }
  }, [previousScene, activeScene]);

  const SceneComponent = useMemo(() => {
    return readyScene ? getSceneComponent(readyScene) : null;
  }, [readyScene]);

  // Deep-dispose the scene root when the mounted scene changes.
  useSceneDisposal(rootRef, readyScene);

  if (!SceneComponent) return null;

  return (
    <Suspense fallback={null}>
      <group ref={rootRef}>
        <SceneComponent />
      </group>
    </Suspense>
  );
}

function useSceneDisposal(rootRef: React.RefObject<Group | null>, sceneId: SceneId | null): void {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    const root = rootRef.current;
    return () => {
      if (root) disposeObject(root);
      // Drop cached programs that no future scene will use. This is
      // aggressive; measure before enabling on projects with shared
      // materials across scenes.
      gl.renderLists.dispose();
    };
  }, [rootRef, sceneId, gl]);
}
