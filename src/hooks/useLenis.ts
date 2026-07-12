/**
 * useLenis — mounts a single Lenis instance for the whole page and drives
 * it from a rAF loop. Publishes scroll data into the global store so any
 * WebGL scene can react without prop-drilling.
 *
 * Only one Lenis instance should exist per document. Mount from a
 * top-level client component (see ScrollManager).
 */

import Lenis from "lenis";
import { useEffect, useRef } from "react";

import { useAppStore } from "@/store";
import { isBrowser, prefersReducedMotion } from "@/utils/detect";

export function useLenis() {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (!isBrowser) return;

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: !prefersReducedMotion(),
    });
    lenisRef.current = lenis;

    const setScroll = useAppStore.getState().setScroll;
    lenis.on("scroll", ({ scroll, limit, velocity }) => {
      const progress = limit > 0 ? scroll / limit : 0;
      setScroll(scroll, progress, velocity);
    });

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  return lenisRef;
}
