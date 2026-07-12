/**
 * useAssetLoader — batch-preload GLTF / texture / HDR / audio assets and
 * publish loading progress into the global store.
 *
 * Uses drei's `useGLTF.preload` / `useTexture.preload` on the client so
 * the asset caches R3F consumes at render time are already warm.
 */

import { useGLTF, useTexture } from "@react-three/drei";
import { useEffect } from "react";

import { useAppStore } from "@/store";
import type { AssetDescriptor } from "@/types";
import { isBrowser } from "@/utils/detect";

export function useAssetLoader(assets: readonly AssetDescriptor[]) {
  useEffect(() => {
    if (!isBrowser || assets.length === 0) return;

    const setProgress = useAppStore.getState().setLoadingProgress;
    setProgress(0, assets.length);

    let cancelled = false;
    let loaded = 0;
    const tick = () => {
      if (cancelled) return;
      loaded += 1;
      setProgress(loaded, assets.length);
    };

    Promise.all(
      assets.map(async (asset) => {
        try {
          switch (asset.kind) {
            case "gltf":
              useGLTF.preload(asset.url);
              break;
            case "texture":
              useTexture.preload(asset.url);
              break;
            case "hdr":
              // HDR uses RGBELoader inside drei's <Environment /> — a
              // fetch primes the browser cache without pulling three.js
              // into this module scope.
              await fetch(asset.url, { cache: "force-cache" });
              break;
            case "audio":
              await fetch(asset.url, { cache: "force-cache" });
              break;
          }
        } finally {
          tick();
        }
      }),
    ).then(() => {
      if (!cancelled) useAppStore.getState().setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [assets]);
}
