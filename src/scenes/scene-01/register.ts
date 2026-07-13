/**
 * Scene 01 — registry side effect.
 *
 * Importing this module registers "The Monolith" with the global scene
 * registry and its camera presets. It deliberately does NOT import the
 * Scene01 component — `load` is a dynamic import so the scene's Three.js
 * chunk stays code-split and is only fetched when the scene activates.
 *
 * The app-level `src/scenes/index.ts` imports this file for its side
 * effect. Adding Scene 02 later means adding a sibling `register` import
 * there — never editing this file.
 */

import { registerScene } from "@/scenes";
import { registerScene01Cameras, scene01PresetId } from "./cameras";
import { scene01PreloadAssets } from "./assets";
import { SCENE_01_ID } from "./config";

registerScene01Cameras();

registerScene({
  id: SCENE_01_ID,
  label: "The Monolith",
  load: () => import("./Scene01"),
  // Empty by design — the in-scene AssetManager owns validation, streaming,
  // and hot-loading, so the registry preload step never blindly fetches.
  assets: scene01PreloadAssets(),
  camera: scene01PresetId("hero"),
});
