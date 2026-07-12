/**
 * Scroll timeline / chapter engine.
 *
 * A cinematic experience with 10+ scenes typically maps ranges of the
 * page scroll to named "chapters" (each chapter typically drives one
 * scene). This module normalizes that mapping so scenes never read raw
 * scroll pixels.
 *
 * Chapters are declared in a config file, then evaluated against the
 * current scroll progress (0..1) via `resolveChapter()`. A local
 * progress (0..1 across the chapter's own range) is returned so
 * per-scene timelines are always in a consistent unit.
 */

export interface Chapter {
  id: string;
  /** Start of the chapter's scroll range in [0, 1]. */
  start: number;
  /** End of the chapter's scroll range in [0, 1]. */
  end: number;
  /** Optional scene ID this chapter activates. */
  sceneId?: string;
}

export interface ResolvedChapter {
  chapter: Chapter | null;
  /** Local progress within the chapter, 0..1. */
  local: number;
}

export function resolveChapter(chapters: readonly Chapter[], progress: number): ResolvedChapter {
  for (const chapter of chapters) {
    if (progress >= chapter.start && progress <= chapter.end) {
      const span = chapter.end - chapter.start;
      const local = span > 0 ? (progress - chapter.start) / span : 0;
      return { chapter, local };
    }
  }
  return { chapter: null, local: 0 };
}

/** Small helper: linearly remap a local progress into a nested sub-range. */
export function subRange(local: number, start: number, end: number): number {
  if (local <= start) return 0;
  if (local >= end) return 1;
  return (local - start) / (end - start);
}
