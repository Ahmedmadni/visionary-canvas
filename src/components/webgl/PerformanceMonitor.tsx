/**
 * In-canvas performance monitor.
 *
 * Samples frame delta from R3F's useFrame, and downgrades the global
 * performance tier if sustained FPS drops below a threshold. Does NOT
 * render anything visible — production HUD (if any) belongs in a
 * separate dev-only DOM overlay.
 */

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";

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
      const tier = useAppStore.getState().performanceTier;
      if (tier === "high") useAppStore.getState().setPerformanceTier("medium");
      else if (tier === "medium") useAppStore.getState().setPerformanceTier("low");
      belowThresholdRef.current = 0;
    }
  });

  return null;
}
