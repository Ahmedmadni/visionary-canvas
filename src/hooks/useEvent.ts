/**
 * useEvent — typed subscription hook for the app event bus.
 *
 * Handles registration + cleanup so callers never leak listeners across
 * remounts.
 */

import { useEffect } from "react";

import { eventBus, type AppEventMap } from "@/lib/eventBus";

type EventKey = keyof AppEventMap;

export function useEvent<K extends EventKey>(
  event: K,
  handler: (payload: AppEventMap[K]) => void,
  deps: React.DependencyList = [],
): void {
  useEffect(() => {
    return eventBus.on(event, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, ...deps]);
}
