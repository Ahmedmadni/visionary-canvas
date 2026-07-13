/**
 * Scene registry with lifecycle.
 *
 * Every cinematic scene registers itself here as a lazy import so
 * SceneManager can look it up by ID, code-split its chunk, and manage
 * preload / mount / unmount. Scene modules live in sibling files (e.g.
 * `src/scenes/Scene01.tsx`) and register themselves at module load:
 *
 *   registerScene({ id: "scene-01", label: "Awakening", load: () => import("./Scene01"), assets: [...] });
 *
 * The registry is intentionally empty until the first scene ships.
 */

import { lazyWithRetry } from "@/lib/lazy";
import type { SceneDefinition, SceneId } from "@/types";

const REGISTRY = new Map<SceneId, SceneDefinition>();

export function registerScene(def: SceneDefinition): void {
  if (REGISTRY.has(def.id)) {
    console.warn(`[scenes] Overwriting existing scene registration for "${def.id}"`);
  }
  REGISTRY.set(def.id, def);
}

export function getSceneDefinition(id: SceneId): SceneDefinition | null {
  return REGISTRY.get(id) ?? null;
}

export function getSceneComponent(id: SceneId) {
  const def = REGISTRY.get(id);
  if (!def) return null;
  return lazyWithRetry(def.load);
}

/**
 * Legacy alias kept for the initial SceneManager wiring. Prefer
 * `getSceneComponent` in new code.
 */
export const getScene = getSceneComponent;

export function listScenes(): SceneDefinition[] {
  return [...REGISTRY.values()];
}

/**
 * Scene registration side effects. Each scene module self-registers on
 * import. Kept at the BOTTOM so `registerScene` and `REGISTRY` are fully
 * initialized before any scene calls back into this module (these are
 * intentionally circular imports resolved by evaluation order).
 *
 * Add one line per scene as they ship — never import scene components
 * eagerly here; registration uses lazy `load()` to preserve code-split.
 */
import "./scene-01";
