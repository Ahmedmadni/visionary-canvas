/**
 * In-canvas performance monitor.
 *
 * Samples frame delta from R3F's useFrame, downgrades the global
 * performance tier if sustained FPS drops below threshold, and emits a
 * `webgl:tier-changed` event so scenes can respond (e.g. disable
 * postprocessing, drop shadow map resolution).
 *
 * Renders nothing visible — a production HUD (if any) belongs in a
 * dev-only DOM overlay.
 */

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

import { eventBus } from "@/lib/eventBus";
import { FpsSampler } from "@/lib/performance";
import { useAppStore } from "@/store";

const DOWNGRADE_FPS = 40;
const DOWNGRADE_HOLD_SECONDS = 3;

export function PerformanceMonitor() {
  const samplerRef = useRef(new FpsSampler());
  const belowThresholdRef = useRef(0);

  useFrame((_, delta) => {
    const sampler = samplerRef.current;
    sampler.tick(delta);

    if (sampler.fps < DOWNGRADE_FPS) {
      belowThresholdRef.current += delta;
    } else {
      belowThresholdRef.current = 0;
    }

    if (belowThresholdRef.current > DOWNGRADE_HOLD_SECONDS) {
      const store = useAppStore.getState();
      const tier = store.performanceTier;
      const next = tier === "high" ? "medium" : tier === "medium" ? "low" : null;
      if (next) {
        store.setPerformanceTier(next);
        eventBus.emit("webgl:tier-changed", { previous: tier, next });
      }
      belowThresholdRef.current = 0;
    }
  });

  return null;
}
