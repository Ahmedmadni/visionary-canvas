/**
 * Scene 01 — asset manifest & registration.
 *
 * This scene is authored around REAL production assets (a hi-fi shawarma
 * GLB, a studio HDR, a reflective-floor PBR set, an ambient drone). Those
 * binaries are not in the repo yet, so every entry ships with
 * `ready: false`. While an asset is unready the loader skips it, the
 * scene renders its lit-void fallback, and NOTHING 404-storms the
 * network.
 *
 * Bringing an asset online is a one-line change: drop the file at the
 * declared `url` under `public/`, flip `ready` to `true`. The loader,
 * the loading-screen progress, and the hero host all pick it up with no
 * further wiring.
 *
 * We deliberately DO NOT ship placeholder cubes / procedural stand-ins —
 * the infrastructure expects the real thing and degrades honestly until
 * it arrives.
 */

import type { AssetDescriptor, AssetKind } from "@/types";

export type Scene01AssetRole =
  | "hero"
  | "environment"
  | "floorAlbedo"
  | "floorNormal"
  | "floorRoughness"
  | "ambience";

export interface Scene01Asset extends AssetDescriptor {
  role: Scene01AssetRole;
  /** Human note describing the real asset that belongs at this slot. */
  note: string;
  /**
   * Flip to `true` once the real binary has been committed under
   * `public/`. Until then the asset is excluded from the preload set so
   * the scene degrades gracefully instead of fetching a missing file.
   */
  ready: boolean;
  /** Can the scene render acceptably without it? */
  optional: boolean;
}

/**
 * The full manifest. `key` is stable and role-derived so drei's caches
 * (`useGLTF`, `useTexture`) resolve consistently across remounts.
 */
export const SCENE_01_ASSETS: readonly Scene01Asset[] = [
  {
    role: "hero",
    kind: "gltf",
    key: "scene01.hero",
    url: "/models/scene-01/monolith-shawarma.glb",
    note: "Hero shawarma — DRACO-compressed GLB, single mesh, ~40k tris, PBR (KTX2). Y-up, origin at base, ~2u tall.",
    ready: false,
    optional: true,
  },
  {
    role: "environment",
    kind: "hdr",
    key: "scene01.env",
    url: "/hdr/scene-01/studio-void.hdr",
    note: "Dark studio HDR for reflections + IBL. Mostly black with one soft cyan rim source and a warm key.",
    ready: false,
    optional: true,
  },
  {
    role: "floorAlbedo",
    kind: "texture",
    key: "scene01.floor.albedo",
    url: "/textures/scene-01/obsidian-albedo.ktx2",
    note: "Obsidian floor base color, near-black.",
    ready: false,
    optional: true,
  },
  {
    role: "floorNormal",
    kind: "texture",
    key: "scene01.floor.normal",
    url: "/textures/scene-01/obsidian-normal.ktx2",
    note: "Subtle micro-scratch normal map for the reflective floor.",
    ready: false,
    optional: true,
  },
  {
    role: "floorRoughness",
    kind: "texture",
    key: "scene01.floor.roughness",
    url: "/textures/scene-01/obsidian-roughness.ktx2",
    note: "Roughness / reflection breakup for the floor.",
    ready: false,
    optional: true,
  },
  {
    role: "ambience",
    kind: "audio",
    key: "scene01.ambience",
    url: "/audio/scene-01/monolith-drone.mp3",
    note: "Sub-heavy ambient drone with a single ignition swell at the rim-light beat.",
    ready: false,
    optional: true,
  },
] as const;

const BY_ROLE = new Map<Scene01AssetRole, Scene01Asset>(SCENE_01_ASSETS.map((a) => [a.role, a]));

export function getScene01Asset(role: Scene01AssetRole): Scene01Asset {
  const asset = BY_ROLE.get(role);
  if (!asset) throw new Error(`[scene-01] Unknown asset role: ${role}`);
  return asset;
}

export function isScene01AssetReady(role: Scene01AssetRole): boolean {
  return BY_ROLE.get(role)?.ready ?? false;
}

/**
 * The subset of assets the SceneManager should actually preload — i.e.
 * the ones whose real binaries exist. Registered as the scene's
 * `assets`, so the loading-screen progress reflects real bytes only.
 */
export function scene01PreloadAssets(): AssetDescriptor[] {
  return SCENE_01_ASSETS.filter((a) => a.ready).map(({ kind, url, key }) => ({
    kind: kind as AssetKind,
    url,
    key,
  }));
}
