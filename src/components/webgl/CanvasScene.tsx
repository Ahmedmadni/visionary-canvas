/**
 * CanvasScene — the R3F Canvas. Imported lazily by CanvasWrapper so
 * three.js never enters the SSR bundle.
 *
 * Key rendering decisions:
 *  - `frameloop` flips to "never" when the tab is hidden or reduced
 *    motion is active + no scene is transitioning, saving battery.
 *  - `dpr` is clamped by performance tier and by device pixel ratio.
 *  - GL flags are conservative: no stencil, alpha on (composited over
 *    DOM), high-performance power hint, antialias only above low tier.
 *  - Global systems (context recovery, camera rig, frame-bus driver,
 *    perf monitor, scene manager) mount here in a fixed order.
 */

import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";

import { CameraRig } from "@/components/webgl/CameraRig";
import { FrameBusDriver } from "@/components/webgl/FrameBusDriver";
import { PerformanceMonitor } from "@/components/webgl/PerformanceMonitor";
import { SceneManager } from "@/components/webgl/SceneManager";
import { WebGLContextRecovery } from "@/components/webgl/WebGLContextRecovery";
import { clampDpr } from "@/lib/performance";
import { useAppStore } from "@/store";

export default function CanvasScene() {
  const tier = useAppStore((s) => s.performanceTier);
  const isPaused = useAppStore((s) => s.isPaused);

  const dpr = useMemo(
    () => (typeof window === "undefined" ? 1 : clampDpr(window.devicePixelRatio, tier)),
    [tier],
  );

  return (
    <Canvas
      dpr={dpr}
      frameloop={isPaused ? "never" : "always"}
      gl={{
        antialias: tier !== "low",
        powerPreference: "high-performance",
        alpha: true,
        stencil: false,
        depth: true,
        preserveDrawingBuffer: false,
      }}
      camera={{ manual: true }}
      className="!fixed inset-0"
    >
      <WebGLContextRecovery />
      <CameraRig />
      <FrameBusDriver />
      <PerformanceMonitor />
      <SceneManager />
    </Canvas>
  );
}
