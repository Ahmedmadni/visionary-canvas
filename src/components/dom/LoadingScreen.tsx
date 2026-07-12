/**
 * Full-viewport loading screen driven by the global store.
 *
 * Rendered as a sibling to the Canvas — fades out once `isReady` flips.
 * Kept intentionally minimal (no branding, no copy) so the design layer
 * can theme it via CSS custom properties on the root.
 */

import { useAppStore } from "@/store";

export function LoadingScreen() {
  const progress = useAppStore((s) => s.loadingProgress);
  const isReady = useAppStore((s) => s.isReady);

  return (
    <div
      aria-hidden={isReady}
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background transition-opacity duration-700"
      style={{ opacity: isReady ? 0 : 1 }}
    >
      <div className="w-48">
        <div className="h-px w-full overflow-hidden bg-border">
          <div
            className="h-full bg-foreground transition-[width] duration-200 ease-out"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
