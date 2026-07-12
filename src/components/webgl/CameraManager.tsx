/**
 * Camera manager.
 *
 * Owns the singleton perspective camera used by every scene. Scenes should
 * NOT instantiate their own camera — instead, they read the active camera
 * from R3F context and animate it via GSAP timelines or the frame bus.
 *
 * This is intentionally minimal at foundation stage; per-scene camera
 * choreography lives inside each scene module.
 */

import { PerspectiveCamera } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

import { useAppStore } from "@/store";

export function CameraManager() {
  const setSize = useThree((s) => s.setSize);
  const size = useThree((s) => s.size);
  const device = useAppStore((s) => s.device);

  useEffect(() => {
    // Force a size sync so DPR/breakpoint changes propagate to the camera.
    setSize(size.width, size.height);
  }, [device, setSize, size.width, size.height]);

  return (
    <PerspectiveCamera
      makeDefault
      fov={device === "mobile" ? 60 : 45}
      near={0.1}
      far={200}
      position={[0, 0, 5]}
    />
  );
}
