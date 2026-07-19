/**
 * Scene 01 — "The Monolith" — public barrel.
 *
 * Importing this module registers the scene (side effect) and re-exports
 * the stable, non-Three.js surface other layers may need: identity, the
 * scroll-chapter descriptor, and the asset manifest for tooling. The
 * heavy scene component is intentionally NOT re-exported here — it is
 * reached only through the registry's lazy `load`.
 */

import "./register";

export { SCENE_01_ID, SCENE_01_CHAPTER } from "./config";
export { SCENE_01_SHOTS, resolveScene01Shot } from "./shots";
export { SCENE_01_MANIFEST, isScene01AssetReady, useCategoryProgress } from "./assets";
export { scene01PresetId } from "./cameras";
