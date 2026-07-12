/**
 * useVisibility — tracks Page Visibility API and syncs it into the store.
 *
 * Backgrounded tabs should NOT keep pumping the render loop or audio —
 * it wastes battery and can trigger context loss on mobile. The store's
 * `isPaused` flag is consumed by CanvasScene (frameloop = "never") and
 * AudioManager (suspends the context).
 */

import { useEffect } from "react";

import { eventBus } from "@/lib/eventBus";
import { useAppStore } from "@/store";
import { isBrowser } from "@/utils/detect";

export function useVisibility(): void {
  const setPaused = useAppStore((s) => s.setPaused);

  useEffect(() => {
    if (!isBrowser) return;
    const update = () => {
      const visible = document.visibilityState === "visible";
      setPaused(!visible);
      eventBus.emit("visibility:change", { visible });
    };
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, [setPaused]);
}
