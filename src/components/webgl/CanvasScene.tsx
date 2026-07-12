/**
 * CanvasScene — the actual R3F Canvas. Imported lazily by CanvasWrapper so
 * three.js never enters the SSR bundle (three touches `self`/`window` at
 * import time on certain builds and inflates the server chunk).
 */

import { Canvas } from "@react-three/fiber";

import { CameraManager } from "@/components/webgl/CameraManager";
import { PerformanceMonitor } from "@/components/webgl/PerformanceMonitor";
import { SceneManager } from "@/components/webgl/SceneManager";
import { WebGLContextRecovery } from "@/components/webgl/WebGLContextRecovery";
import { clampDpr } from "@/lib/performance";
import { useAppStore } from "@/store";

export default function CanvasScene() {
  const tier = useAppStore((s) => s.performanceTier);
  const dpr = typeof window === "undefined" ? 1 : clampDpr(window.devicePixelRatio, tier);

  return (
    <Canvas
      dpr={dpr}
      gl={{
        antialias: tier !== "low",
        powerPreference: "high-performance",
        alpha: true,
        stencil: false,
        depth: true,
      }}
      camera={{ manual: true }}
      className="!fixed inset-0"
    >
      <WebGLContextRecovery />
      <CameraManager />
      <PerformanceMonitor />
      <SceneManager />
    </Canvas>
  );
}
