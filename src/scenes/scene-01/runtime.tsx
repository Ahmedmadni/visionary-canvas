/**
 * Scene 01 — shared runtime context.
 *
 * Threads the per-mount, allocation-free `Scene01Channels` object (plus
 * the resolved performance budget, camera keyframes, and environment
 * flags) to every subsystem WITHOUT prop-drilling and WITHOUT triggering
 * React re-renders on animation. Subsystems read `channels.current` each
 * frame from their own frame-bus subscription.
 *
 * The context value is stable for the life of the mount; only the budget
 * and keyframes recompute when the device tier / breakpoint changes,
 * which the timeline hook treats as a rebuild signal.
 */

import { createContext, useContext, useMemo, useRef, type ReactNode } from "react";

import type { PerformanceTier } from "@/types";
import { useAppStore } from "@/store";
import { resolveScene01Budget, type Scene01Budget } from "./config";
import { scene01CameraKeyframes, type CameraKeyframe } from "./cameras";
import { createScene01Channels, type Scene01Channels } from "./timeline";

export interface Scene01Runtime {
  /** Mutable, in-place animated channels. Read `.current` per frame. */
  channels: React.MutableRefObject<Scene01Channels>;
  budget: Scene01Budget;
  keyframes: readonly CameraKeyframe[];
  isMobile: boolean;
  reducedMotion: boolean;
  tier: PerformanceTier;
}

const Scene01Context = createContext<Scene01Runtime | null>(null);

export function Scene01Provider({ children }: { children: ReactNode }) {
  const device = useAppStore((s) => s.device);
  const tier = useAppStore((s) => s.performanceTier);
  const reducedMotion = useAppStore((s) => s.reducedMotion);

  const isMobile = device === "mobile";
  const budget = useMemo(() => resolveScene01Budget(tier, isMobile), [tier, isMobile]);
  const keyframes = useMemo(() => scene01CameraKeyframes(isMobile), [isMobile]);

  // Stable channel object for the whole mount; the timeline mutates it.
  const channels = useRef<Scene01Channels>(createScene01Channels(keyframes));

  const value = useMemo<Scene01Runtime>(
    () => ({ channels, budget, keyframes, isMobile, reducedMotion, tier }),
    [budget, keyframes, isMobile, reducedMotion, tier],
  );

  return <Scene01Context.Provider value={value}>{children}</Scene01Context.Provider>;
}

export function useScene01Runtime(): Scene01Runtime {
  const ctx = useContext(Scene01Context);
  if (!ctx) throw new Error("useScene01Runtime must be used within <Scene01Provider>");
  return ctx;
}
