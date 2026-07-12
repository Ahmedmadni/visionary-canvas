/**
 * Shared type definitions for the WebGL application layer.
 *
 * Kept intentionally small — scene/material/shader modules should extend
 * these primitives rather than redefining their own shapes.
 */

export type PerformanceTier = "low" | "medium" | "high";

export type DeviceType = "mobile" | "tablet" | "desktop";

export type SceneId = string;

export interface SceneDefinition {
  id: SceneId;
  /** Human-readable label, used only for debugging / dev tools. */
  label: string;
  /**
   * Lazy component loader — MUST be a dynamic import so the scene chunk is
   * split from the main bundle and only fetched when needed.
   */
  load: () => Promise<{ default: React.ComponentType }>;
  /** Optional list of asset URLs to preload before the scene mounts. */
  assets?: readonly AssetDescriptor[];
}

export type AssetKind = "gltf" | "texture" | "hdr" | "audio";

export interface AssetDescriptor {
  kind: AssetKind;
  url: string;
  /** Optional stable key; defaults to the URL. */
  key?: string;
}

export interface Viewport {
  width: number;
  height: number;
  dpr: number;
  device: DeviceType;
}
