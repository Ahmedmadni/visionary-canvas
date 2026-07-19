/**
 * useScene01HudState — resolves what the HUD should show, DOM-side only.
 *
 * Deliberately independent of the R3F tree: it reads the SAME global
 * scroll store and the SAME pure `resolveScene01LocalProgress` /
 * `resolveScene01Shot` helpers the in-canvas timeline uses, so the HUD
 * always agrees with the 3D scene about "what shot are we in" without
 * needing a portal, a bridge context, or per-frame plumbing out of the
 * Canvas. This is what keeps the HUD a near-zero-cost DOM/CSS layer.
 */

import { useAppStore } from "@/store";
import { resolveScene01LocalProgress, SCENE_01_ID } from "../config";
import { resolveScene01Shot, type Scene01ShotId } from "../shots";

export interface Scene01HudState {
  active: boolean;
  shotId: Scene01ShotId | null;
  /** Local progress within the current shot, 0..1. */
  shotProgress: number;
  reducedMotion: boolean;
}

export function useScene01HudState(): Scene01HudState {
  const activeScene = useAppStore((s) => s.activeScene);
  const scrollProgress = useAppStore((s) => s.scrollProgress);
  const reducedMotion = useAppStore((s) => s.reducedMotion);

  const active = activeScene === SCENE_01_ID;
  const local = resolveScene01LocalProgress(scrollProgress);
  const { shot, local: shotProgress } = resolveScene01Shot(local);

  return {
    active,
    shotId: shot?.id ?? null,
    shotProgress,
    reducedMotion,
  };
}
