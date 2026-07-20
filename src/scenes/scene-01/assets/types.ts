/**
 * Scene 01 — asset pipeline types.
 *
 * Pure type definitions for the production asset layer. NO Three.js and
 * NO DOM imports live here so the manifest and any tooling / tests can
 * import it freely. Three-bound loaded shapes live in `decoders.ts`.
 *
 * These types EXTEND the foundation's `AssetDescriptor` vocabulary for
 * this scene rather than modifying `src/types` — richer categorization
 * (PBR packs, spatial audio, video, per-device variants, validation and
 * memory budgets) is scene concern, not app-wide concern.
 */

/** Where an asset sits in the loading UI + progress breakdown. */
export type Scene01AssetCategory =
  | "model"
  | "environment"
  | "material"
  | "texture"
  | "audio"
  | "video";

/** The concrete decode path an asset takes. */
export type Scene01AssetKind =
  | "glb" // DRACO/Meshopt + KTX2 GLB
  | "hdr" // equirect HDRI → PMREM env map
  | "ktx2" // standalone KTX2 texture
  | "pbr-pack" // a set of KTX2 maps forming one PBR material
  | "audio" // ambient (non-positional) buffer
  | "audio-spatial" // positional / 3D audio buffer
  | "video"; // video texture (reserved for future use)

/** Which slot a map fills inside a PBR pack. */
export type PbrMapSlot =
  | "albedo"
  | "normal"
  | "roughness"
  | "metalness"
  | "ao"
  | "emissive"
  | "displacement";

/** Device/quality tier a variant targets. */
export type Scene01VariantId = "desktop" | "mobile" | "universal";

/**
 * Human-facing production spec for a variant — surfaced verbatim in the
 * Production Asset Guide and used by dev validation to sanity-check the
 * delivered file against what was briefed.
 */
export interface Scene01AssetSpec {
  /** e.g. "4096×4096", "2048×1024", "48kHz stereo". */
  resolution: string;
  /** e.g. "DRACO + Meshopt, KTX2/UASTC", "RGBE .hdr", "MP3 320kbps". */
  compression: string;
  /** Triangle budget for meshes; undefined for non-geometry. */
  triangleBudget?: number;
  /** Approx GPU/CPU memory budget in megabytes. */
  memoryBudgetMb: number;
  /** Loose upper bound on on-disk size in megabytes (validation warns above). */
  maxFileSizeMb: number;
}

/** What a delivered file must look like for validation to pass. */
export interface Scene01ValidationSpec {
  /**
   * Expected leading magic bytes (hex, space-free) OR an ASCII signature.
   * Checked case-insensitively against the file head. Empty = skip sniff.
   */
  magic: string[];
  /** MIME types considered acceptable from the HEAD probe (prefix match). */
  contentTypes: string[];
}

export interface Scene01AssetVariant {
  id: Scene01VariantId;
  /** Single-file kinds (glb / hdr / ktx2 / audio / video). */
  url?: string;
  /** PBR packs: one URL per map slot. */
  maps?: Partial<Record<PbrMapSlot, string>>;
  spec: Scene01AssetSpec;
  validation: Scene01ValidationSpec;
}

export interface Scene01AssetDef {
  /** Stable semantic id used across the scene + hooks. */
  role: string;
  category: Scene01AssetCategory;
  kind: Scene01AssetKind;
  /** One-line brief shown in logs + the asset guide. */
  description: string;
  /** The scene renders acceptably without it (all true for now). */
  optional: boolean;
  /** Recommended Blender / DCC export notes for the art team. */
  exportNotes: string[];
  /** At least one; ordered by preference. */
  variants: Scene01AssetVariant[];
  /**
   * For multi-part GLBs (`kind: "glb"` only): the named nodes/meshes
   * consumers must be able to address individually — e.g. the exploded-
   * deconstruction shot offsetting each ingredient, or a cross-section
   * asset's two halves. Undefined for single-mesh models and non-model
   * assets. Documented for the art team AND consumed by future decode-
   * time validation (not yet implemented — see docs/scene-01-reference-
   * breakdown.md phase 6).
   */
  requiredParts?: readonly string[];
}

/** Runtime lifecycle state of one asset. */
export type Scene01AssetStatus =
  | "idle" // not yet touched
  | "probing" // checking availability
  | "unavailable" // not present on the server (→ graceful fallback)
  | "validating" // present, checking integrity
  | "invalid" // present but corrupted / wrong format (→ fallback)
  | "loading" // decoding
  | "ready" // decoded + available to the scene
  | "error"; // decode failed (→ fallback)

/** A status is "settled" when no further work is pending for it. */
export const SETTLED_STATUSES: readonly Scene01AssetStatus[] = [
  "unavailable",
  "invalid",
  "ready",
  "error",
];

export function isSettled(status: Scene01AssetStatus): boolean {
  return SETTLED_STATUSES.includes(status);
}

export interface CategoryProgress {
  loaded: number; // settled assets
  total: number; // expected assets
  ready: number; // successfully decoded assets
}
