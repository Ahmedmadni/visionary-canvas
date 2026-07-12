/**
 * Dynamic-import helper with a stable identity so React.lazy caches the
 * loader between renders. Also swallows chunk-load errors on transient
 * network failures by retrying once — long-running cinematic apps often
 * lose their tab focus and hit a stale asset URL after a redeploy.
 */

import { lazy, type ComponentType } from "react";

export function lazyWithRetry<T extends ComponentType<Record<string, unknown>>>(
  loader: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      return await loader();
    } catch (err) {
      // One retry after a short delay — covers post-deploy chunk misses.
      await new Promise((r) => setTimeout(r, 250));
      try {
        return await loader();
      } catch {
        throw err;
      }
    }
  });
}
