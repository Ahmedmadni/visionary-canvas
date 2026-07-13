/**
 * Scene 01 — asset React hooks.
 *
 * The bridge between the imperative manager/store and the declarative
 * scene graph. Components subscribe to an asset's status and get the
 * decoded object back the instant it is ready (or hot-swapped) — no
 * Suspense, so the fallback stays fully rendered until the real thing is
 * decoded AND uploaded, which is what keeps swaps glitch-free.
 */

import type { Group, Texture, VideoTexture } from "three";

import { assetManager } from "./AssetManager";
import { useAssetStore } from "./store";
import type { CategoryProgress, PbrMapSlot, Scene01AssetStatus } from "./types";

export function useAssetStatus(role: string): Scene01AssetStatus {
  return useAssetStore((s) => s.statuses[role] ?? "idle");
}

/**
 * Generic accessor: current status + the decoded object (typed by the
 * caller). Re-renders on status change and on hot-swap (`revision`).
 */
export function useSceneAsset<T>(role: string): {
  status: Scene01AssetStatus;
  asset: T | undefined;
} {
  const status = useAssetStore((s) => s.statuses[role] ?? "idle");
  // Subscribe to revision so a ready→ready hot-swap still re-renders.
  useAssetStore((s) => s.revision);
  const asset = assetManager.get(role) as unknown as T | undefined;
  return { status, asset };
}

export function useHeroScene(): Group | null {
  const { asset } = useSceneAsset<{ kind: "glb"; scene: Group }>("hero");
  return asset?.scene ?? null;
}

export function useEnvironmentMap(): Texture | null {
  const { asset } = useSceneAsset<{ kind: "hdr"; envMap: Texture }>("environment");
  return asset?.envMap ?? null;
}

export function useFloorMaps(): Partial<Record<PbrMapSlot, Texture>> | null {
  const { asset } = useSceneAsset<{ kind: "pbr-pack"; maps: Partial<Record<PbrMapSlot, Texture>> }>(
    "floor",
  );
  return asset?.maps ?? null;
}

export function useAudioBuffer(role: string): { buffer: AudioBuffer; spatial: boolean } | null {
  const { asset } = useSceneAsset<{ kind: "audio"; buffer: AudioBuffer; spatial: boolean }>(role);
  return asset ? { buffer: asset.buffer, spatial: asset.spatial } : null;
}

export function useVideoTexture(role: string): VideoTexture | null {
  const { asset } = useSceneAsset<{ kind: "video"; texture: VideoTexture }>(role);
  return asset?.texture ?? null;
}

/** Per-category loading progress for a category-aware loading UI. */
export function useCategoryProgress(): Record<string, CategoryProgress> {
  return useAssetStore((s) => s.categoryProgress);
}

export function useAssetsSettled(): boolean {
  return useAssetStore((s) => s.allSettled);
}
