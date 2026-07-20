/**
 * Scene 01 — asset pipeline public surface.
 *
 * The one import site the rest of the scene uses. Re-exports the manifest,
 * runtime store, manager, hooks, and types, plus a couple of
 * backward-compatible helpers for callers that only need a boolean or the
 * preload list.
 */

import type { AssetDescriptor } from "@/types";
import { useAssetStore } from "./store";

export * from "./types";
export {
  SCENE_01_MANIFEST,
  SCENE_01_ASSET_ROOT,
  SCENE_01_HERO_PARTS,
  SCENE_01_CROSS_SECTION_PARTS,
  getAssetDef,
  assetRoles,
  selectVariant,
} from "./manifest";
export { assetManager } from "./AssetManager";
export { useAssetStore, aggregateProgress } from "./store";
export type { LoadedAsset } from "./decoders";
export {
  useAssetStatus,
  useSceneAsset,
  useHeroScene,
  useEnvironmentMap,
  useFloorMaps,
  useAudioBuffer,
  useVideoTexture,
  useCategoryProgress,
  useAssetsSettled,
} from "./hooks";

/** True once the given asset has been decoded and is available. */
export function isScene01AssetReady(role: string): boolean {
  return useAssetStore.getState().statuses[role] === "ready";
}

/**
 * SceneManager-level preload list. Intentionally empty: the in-scene
 * AssetManager owns validation + streaming + hot-loading, so the registry
 * preload step stays a no-op rather than blindly fetching (and 404-ing)
 * assets that may not exist yet.
 */
export function scene01PreloadAssets(): AssetDescriptor[] {
  return [];
}
