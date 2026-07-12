/**
 * CanvasWrapper — client-only entry point for the WebGL layer.
 *
 * Responsibilities:
 *  - Gate the entire three.js import graph behind React.lazy so it never
 *    enters the SSR bundle.
 *  - Wrap the Canvas in an ErrorBoundary so a scene crash doesn't blank
 *    the page.
 *  - Sync viewport + performance tier + reduced-motion into the store
 *    once, on mount.
 *
 * Mount from a route component inside <ClientOnly>.
 */

import { ClientOnly } from "@tanstack/react-router";
import { Suspense, useEffect } from "react";

import { ErrorBoundary } from "@/components/dom/ErrorBoundary";
import { useBreakpoint } from "@/hooks/useBreakpoint";
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

function CanvasHost() {
  useSyncEnvironment();
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
