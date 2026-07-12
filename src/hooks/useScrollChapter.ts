/**
 * useScrollChapter — resolves the current chapter and local progress
 * from the global scroll progress, and emits `scroll:chapter-change`
 * whenever the active chapter switches.
 *
 * Pass a stable `chapters` array (declared at module scope, never
 * rebuilt on render) to avoid churn.
 */

import { useEffect, useRef } from "react";

import { eventBus } from "@/lib/eventBus";
import { resolveChapter, type Chapter, type ResolvedChapter } from "@/lib/scrollTimeline";
import { useAppStore } from "@/store";

export function useScrollChapter(chapters: readonly Chapter[]): ResolvedChapter {
  const progress = useAppStore((s) => s.scrollProgress);
  const setCurrentChapter = useAppStore((s) => s.setCurrentChapter);
  const previousIdRef = useRef<string | null>(null);

  const resolved = resolveChapter(chapters, progress);
  const nextId = resolved.chapter?.id ?? null;

  useEffect(() => {
    if (previousIdRef.current !== nextId) {
      eventBus.emit("scroll:chapter-change", {
        previous: previousIdRef.current,
        next: nextId,
      });
      setCurrentChapter(nextId);
      previousIdRef.current = nextId;
    }
  }, [nextId, setCurrentChapter]);

  return resolved;
}
