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

export { SCENE_01_ID, SCENE_01_CHAPTER, SCENE_01_BEATS } from "./config";
export { SCENE_01_ASSETS, isScene01AssetReady } from "./assets";
export { scene01PresetId } from "./cameras";
