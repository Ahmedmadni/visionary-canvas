/**
 * Scene 01 — asset runtime store (scene-local Zustand).
 *
 * Holds the OBSERVABLE state of the asset layer: each asset's lifecycle
 * status, the chosen variant, per-category progress, and a `revision`
 * counter that bumps whenever a decoded object becomes available so React
 * hooks re-render and pull the new object from the manager.
 *
 * This is intentionally separate from the global app store — asset
 * bookkeeping is a scene concern. The MANAGER mirrors the aggregate into
 * the global loading progress; nothing here reaches across.
 *
 * Pure (no Three.js). The decoded objects themselves live in the manager,
 * not in here — Zustand holds status, not GPU handles.
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import { SCENE_01_MANIFEST } from "./manifest";
import {
  isSettled,
  type CategoryProgress,
  type Scene01AssetCategory,
  type Scene01AssetStatus,
  type Scene01VariantId,
} from "./types";

const ROLES = SCENE_01_MANIFEST.map((a) => a.role);
const CATEGORY_OF = new Map<string, Scene01AssetCategory>(
  SCENE_01_MANIFEST.map((a) => [a.role, a.category]),
);
const CATEGORIES = [...new Set(SCENE_01_MANIFEST.map((a) => a.category))];

function initialStatuses(): Record<string, Scene01AssetStatus> {
  return Object.fromEntries(ROLES.map((r) => [r, "idle" as Scene01AssetStatus]));
}

function emptyProgress(): Record<string, CategoryProgress> {
  const out: Record<string, CategoryProgress> = {};
  for (const cat of CATEGORIES) {
    const total = SCENE_01_MANIFEST.filter((a) => a.category === cat).length;
    out[cat] = { loaded: 0, total, ready: 0 };
  }
  return out;
}

interface SetStatusOpts {
  error?: string;
  variant?: Scene01VariantId;
}

export interface AssetStoreState {
  statuses: Record<string, Scene01AssetStatus>;
  errors: Record<string, string | undefined>;
  variants: Record<string, Scene01VariantId | undefined>;
  categoryProgress: Record<string, CategoryProgress>;
  revision: number;
  allSettled: boolean;

  setStatus: (role: string, status: Scene01AssetStatus, opts?: SetStatusOpts) => void;
  bumpRevision: () => void;
  reset: () => void;
}

function recompute(statuses: Record<string, Scene01AssetStatus>) {
  const categoryProgress: Record<string, CategoryProgress> = {};
  for (const cat of CATEGORIES) {
    categoryProgress[cat] = { loaded: 0, total: 0, ready: 0 };
  }
  let settledCount = 0;
  for (const role of ROLES) {
    const cat = CATEGORY_OF.get(role)!;
    const p = categoryProgress[cat];
    p.total += 1;
    const st = statuses[role];
    if (isSettled(st)) {
      p.loaded += 1;
      settledCount += 1;
      if (st === "ready") p.ready += 1;
    }
  }
  return { categoryProgress, allSettled: settledCount === ROLES.length };
}

export const useAssetStore = create<AssetStoreState>()(
  subscribeWithSelector((set) => ({
    statuses: initialStatuses(),
    errors: {},
    variants: {},
    categoryProgress: emptyProgress(),
    revision: 0,
    allSettled: false,

    setStatus: (role, status, opts) =>
      set((s) => {
        const statuses = { ...s.statuses, [role]: status };
        const { categoryProgress, allSettled } = recompute(statuses);
        return {
          statuses,
          errors: opts?.error !== undefined ? { ...s.errors, [role]: opts.error } : s.errors,
          variants:
            opts?.variant !== undefined ? { ...s.variants, [role]: opts.variant } : s.variants,
          categoryProgress,
          allSettled,
        };
      }),

    bumpRevision: () => set((s) => ({ revision: s.revision + 1 })),

    reset: () =>
      set({
        statuses: initialStatuses(),
        errors: {},
        variants: {},
        categoryProgress: emptyProgress(),
        revision: 0,
        allSettled: false,
      }),
  })),
);

/** Aggregate progress across every category (count-based, 0..1). */
export function aggregateProgress(state: AssetStoreState): {
  loaded: number;
  total: number;
  fraction: number;
} {
  let loaded = 0;
  let total = 0;
  for (const cat of CATEGORIES) {
    loaded += state.categoryProgress[cat]?.loaded ?? 0;
    total += state.categoryProgress[cat]?.total ?? 0;
  }
  return { loaded, total, fraction: total > 0 ? loaded / total : 1 };
}
