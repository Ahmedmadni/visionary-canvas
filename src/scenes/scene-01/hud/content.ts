/**
 * Scene 01 — HUD content.
 *
 * Per-shot copy + callout anchor points for the technical overlay. Pure
 * data — no React, no DOM — so it can be reused by the HUD component and
 * inspected/tested independently.
 *
 * Anchor positions are SCREEN-SPACE percentages (0..100), not 3D-projected
 * points. This is a deliberate v1 simplification: the reference's callout
 * leader-lines visually read as graphic overlay elements, and true 3D→2D
 * anchor projection would require the HUD to reach into the R3F camera
 * from DOM-land. Flagged in docs/scene-01-reference-breakdown.md as a
 * candidate upgrade once the overlay needs to track specific mesh
 * features (e.g. a named ingredient in the exploded shot).
 *
 * Content only exists for HERO and TURNAROUND — the shots with a built
 * visual treatment. `shots.ts` now lists six shots total; the other four
 * (macro/exploded/material) have camera + timeline scaffolding but no HUD
 * copy yet (deliberately deferred, not a placeholder). `HudOverlay`
 * renders nothing for a shot missing from this map, by design.
 */

import type { Scene01ShotId } from "../shots";

export interface HudCallout {
  /** Short label, e.g. "REFLECTIVE SURFACE". */
  label: string;
  /** Anchor point, percentage of viewport (0..100). */
  x: number;
  y: number;
  /** Which side the label text sits on relative to its leader line. */
  side: "left" | "right";
}

export interface Scene01HudShotContent {
  tag: string; // small persistent readout, e.g. "SHAWARMA · 01"
  label: string; // primary shot label, e.g. "PRODUCT VIEW"
  sublabel: string; // secondary line, e.g. "A · HERO"
  callouts: readonly HudCallout[];
}

export const SCENE_01_HUD_CONTENT: Partial<Record<Scene01ShotId, Scene01HudShotContent>> = {
  hero: {
    tag: "SHAWARMA · 01",
    label: "PRODUCT VIEW",
    sublabel: "A · HERO",
    callouts: [
      { label: "GRILLED FLATBREAD", x: 24, y: 26, side: "left" },
      { label: "REFLECTIVE SURFACE", x: 74, y: 80, side: "right" },
    ],
  },
  turnaround: {
    tag: "SHAWARMA · 01",
    label: "TURNAROUND",
    sublabel: "B · SPEC VIEW",
    callouts: [
      { label: "PRODUCT SILHOUETTE", x: 26, y: 30, side: "left" },
      { label: "MATERIAL REFERENCE", x: 76, y: 74, side: "right" },
    ],
  },
};
