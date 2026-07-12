/**
 * Shared type definitions for the WebGL application layer.
 *
 * Kept intentionally small — scene/material/shader modules should extend
 * these primitives rather than redefining their own shapes.
 */

import type { ComponentType } from "react";
import type { PerspectiveCamera, Vector3Tuple } from "three";

export type PerformanceTier = "low" | "medium" | "high";

export type DeviceType = "mobile" | "tablet" | "desktop";

export type SceneId = string;

/**
 * Context handed to a scene's lifecycle hooks. Kept minimal — scenes
 * that need more (e.g. renderer, scene graph) use R3F hooks from
 * inside their component tree.
 */
export interface SceneLifecycleContext {
  id: SceneId;
  previousId: SceneId | null;
}

export interface SceneDefinition {
  id: SceneId;
  /** Human-readable label, used only for debugging / dev tools. */
  label: string;
  /**
   * Lazy component loader — MUST be a dynamic import so the scene chunk is
   * split from the main bundle and only fetched when needed.
   */
  load: () => Promise<{ default: ComponentType }>;
  /** Optional list of asset URLs to preload before the scene mounts. */
  assets?: readonly AssetDescriptor[];
  /**
   * Optional side-effect run before the scene mounts (after `assets` are
   * preloaded). Use for one-time setup — texture warmup, audio prep,
   * analytics ping. Do NOT touch the R3F scene graph here (it doesn't
   * exist yet); use the component body / useEffect for that.
   */
  preload?: () => Promise<void>;
  /**
   * Optional named camera preset to activate for this scene. Actual
   * transitions live in CameraRig.
   */
  camera?: string;
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

/**
 * Camera preset — a named camera state that CameraRig can transition
 * to. Rotations use radians; targets are look-at points in world space.
 */
export interface CameraPreset {
  id: string;
  position: Vector3Tuple;
  target: Vector3Tuple;
  fov?: number;
  near?: number;
  far?: number;
}

export type CameraApplyFn = (camera: PerspectiveCamera, preset: CameraPreset) => void;
