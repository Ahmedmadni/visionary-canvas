/**
 * Scene registry.
 *
 * Every cinematic scene registers itself here as a lazy import so
 * SceneManager can look it up by ID and code-split its chunk. Scene
 * modules live in sibling files (e.g. `src/scenes/Scene01.tsx`) and are
 * added to REGISTRY when built — the registry is intentionally empty
 * until the first scene ships.
 */

import { lazyWithRetry } from "@/lib/lazy";
import type { SceneDefinition, SceneId } from "@/types";

const REGISTRY = new Map<SceneId, SceneDefinition>();

export function registerScene(def: SceneDefinition): void {
  REGISTRY.set(def.id, def);
}

export function getScene(id: SceneId) {
  const def = REGISTRY.get(id);
  if (!def) return null;
  return lazyWithRetry(def.load);
}

export function listScenes(): SceneDefinition[] {
  return [...REGISTRY.values()];
}
