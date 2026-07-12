/**
 * CanvasWrapper — client-only entry point for the WebGL layer.
 *
 * Responsibilities:
 *  - Gate the entire three.js import graph behind React.lazy so it
 *    never enters the SSR bundle.
 *  - Wrap the Canvas in an ErrorBoundary so a scene crash doesn't
 *    blank the page.
 *  - Sync viewport + performance tier + reduced motion into the store
 *    once, on mount.
 *  - Mount the tab-visibility watcher and arm audio unlock so the first
 *    user gesture resumes the AudioContext.
 *
 * Mount from a route component inside <ClientOnly> — CanvasWrapper
 * already handles that internally.
 */

import { ClientOnly } from "@tanstack/react-router";
import { Suspense, useEffect } from "react";

import { audioManager } from "@/audio";
import { ErrorBoundary } from "@/components/dom/ErrorBoundary";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useEvent } from "@/hooks/useEvent";
import { useVisibility } from "@/hooks/useVisibility";
import { lazyWithRetry } from "@/lib/lazy";
import { useAppStore } from "@/store";
import { detectHardwareTier, prefersReducedMotion } from "@/utils/detect";

const CanvasScene = lazyWithRetry(() => import("@/components/webgl/CanvasScene"));

function useSyncEnvironment() {
  const device = useBreakpoint();
  const setViewport = useAppStore((s) => s.setViewport);
  const setPerformanceTier = useAppStore((s) => s.setPerformanceTier);
  const setReducedMotion = useAppStore((s) => s.setReducedMotion);

  useEffect(() => {
    setPerformanceTier(detectHardwareTier());
    setReducedMotion(prefersReducedMotion());
  }, [setPerformanceTier, setReducedMotion]);

  useEffect(() => {
    const update = () =>
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
        dpr: window.devicePixelRatio,
        device,
      });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [device, setViewport]);
}

function useAudioLifecycle() {
  const setUnlocked = useAppStore((s) => s.setAudioUnlocked);
  const isPaused = useAppStore((s) => s.isPaused);

  useEffect(() => {
    audioManager.armUnlock();
    return () => {
      void audioManager.dispose();
    };
  }, []);

  useEvent("audio:unlocked", () => setUnlocked(true), [setUnlocked]);

  useEffect(() => {
    if (isPaused) void audioManager.suspend();
    else void audioManager.resume();
  }, [isPaused]);
}

function CanvasHost() {
  useSyncEnvironment();
  useVisibility();
  useAudioLifecycle();

  return (
    <ErrorBoundary>
      <Suspense fallback={null}>
        <CanvasScene />
      </Suspense>
    </ErrorBoundary>
  );
}

export function CanvasWrapper() {
  return (
    <ClientOnly fallback={null}>
      <CanvasHost />
    </ClientOnly>
  );
}
