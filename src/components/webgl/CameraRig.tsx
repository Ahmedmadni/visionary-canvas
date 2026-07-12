/**
 * CameraRig — singleton perspective camera with a preset-based API.
 *
 * A cinematic experience with 10+ scenes typically has 20–50 named
 * camera positions. Each preset is registered by ID via `registerPreset`
 * and activated with `activatePreset(id)`. The rig writes the preset
 * directly (no tween) — scenes that want an animated transition should
 * drive `camera.position` / `camera.lookAt(target)` themselves via GSAP
 * from the frameBus, using `getPreset(id)` as the target.
 *
 * Kept intentionally imperative: GSAP timelines and R3F reactivity
 * don't mix well, and cinematic camera work is authored, not derived.
 */

import { PerspectiveCamera as DreiPerspectiveCamera } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import { PerspectiveCamera, Vector3 } from "three";

import { useAppStore } from "@/store";
import type { CameraPreset } from "@/types";

const registry = new Map<string, CameraPreset>();

export function registerPreset(preset: CameraPreset): void {
  registry.set(preset.id, preset);
}

export function getPreset(id: string): CameraPreset | undefined {
  return registry.get(id);
}

const _tmp = new Vector3();

export function applyPreset(camera: PerspectiveCamera, preset: CameraPreset): void {
  camera.position.set(preset.position[0], preset.position[1], preset.position[2]);
  _tmp.set(preset.target[0], preset.target[1], preset.target[2]);
  camera.lookAt(_tmp);
  if (preset.fov != null) {
    camera.fov = preset.fov;
    camera.updateProjectionMatrix();
  }
  if (preset.near != null) {
    camera.near = preset.near;
    camera.updateProjectionMatrix();
  }
  if (preset.far != null) {
    camera.far = preset.far;
    camera.updateProjectionMatrix();
  }
}

export function CameraRig() {
  const device = useAppStore((s) => s.device);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);

  // Aspect + FOV get device-aware defaults so mobile framing isn't cut off.
  const initial = useMemo(
    () => ({
      fov: device === "mobile" ? 60 : 45,
      near: 0.1,
      far: 200,
      position: [0, 0, 5] as [number, number, number],
    }),
    [device],
  );

  useEffect(() => {
    if (camera instanceof PerspectiveCamera) {
      camera.aspect = size.width / Math.max(size.height, 1);
      camera.updateProjectionMatrix();
    }
  }, [camera, size.width, size.height]);

  return <DreiPerspectiveCamera makeDefault {...initial} />;
}
