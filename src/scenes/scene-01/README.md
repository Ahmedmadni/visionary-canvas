# Scene 01 — "The Monolith"

A clean, fully-lit **studio product-viz reveal** of a single luxury shawarma
— matching the approved reference video (a concept-art production package).
Six hard-cut shots, camera-and-timeline-complete:

| Shot | What it is | Visual treatment |
| --- | --- | --- |
| **A — hero** | Product lying on the floor, slow lateral drift + push-in | ✅ Built (hero model, pose, HUD) |
| **B — turnaround** | Product snaps upright, slow spec-sheet yaw | ✅ Built (single-camera simplification — see below) |
| **C1 — macroMeat** | Extreme close push on the grilled meat | 🚧 Camera + timeline only |
| **C2 — macroSauce** | Extreme close push on the sauce / veg | 🚧 Camera + timeline only |
| **D — exploded** | Camera pulls back for the (future) floating ingredient stack | 🚧 Camera + timeline only |
| **E — materialBoard** | Near-locked on the (future) cross-section halves | 🚧 Camera + timeline only |

Every shot drives the shared studio-lighting/DOF channels and hard-cuts
cleanly into the next (camera, product pose, lighting, and DOF all snap
together — see "Animation model" below). Shots C1–E have no dedicated
visual component yet — no macro effects, no exploded-part offsetting, no
cross-section rendering, no HUD copy — they're waiting on the multi-part
hero GLB and cross-section asset (see
`docs/scene-01-production-asset-guide.md`). No darkness reveal, no fog, no
floating dust anywhere — see `docs/scene-01-reference-breakdown.md` for the
full technical director's analysis this implementation is built from.

This is an **isolated, reusable production module**. It self-registers with
the global scene registry and drives everything imperatively off the shared
frame bus — no per-frame React state.

## Files

| File | Responsibility |
| --- | --- |
| `config.ts` | Identity, scroll range (canonical + host-remappable), shared local-progress helper, per-tier/mobile performance budget, frame-bus priorities. Pure data. |
| `shots.ts` | The six-shot registry (A–E) — scroll ranges + the shared hard-cut epsilon. Reuses the foundation's `resolveChapter`. |
| `cameras.ts` | Authored camera keyframes (desktop + mobile) for all six shots, each also carrying the product's POSE (`tiltZ`/`spinY`) so a cut snaps camera and product together. Registered as named CameraRig presets. |
| `timeline.ts` | The scroll-driven **GSAP** timeline. Two tween groups on one timeline: camera+pose (from `cameras.ts`) and studio lighting/DOF — a per-shot `SHOT_VISUALS` lookup, generic over ALL of `shots.ts` (add a shot + a lookup entry, nothing else changes). Scrubs a flat `Scene01Channels` object; pure + unit-tested. |
| `runtime.tsx` | React context threading `channels` / `budget` / `keyframes` to subsystems without prop-drilling or re-renders. |
| `Scene01.tsx` | Scene root (the registry's lazy default export). Wires the subsystems + per-frame drivers. |
| `register.ts` | Registry side effect (lazy `load`, preset registration). Imported by `src/scenes/index.ts`. |
| `hooks/useScene01Timeline.ts` | Builds + scrubs the timeline from damped scroll; reduced-motion short-circuit. |
| **`assets/`** | **The production asset pipeline** — see below. |
| **`hud/`** | **The DOM/CSS technical overlay** — see below. |
| `components/AssetSystem.tsx` | Binds the asset manager to the renderer, starts load + hot-load, disposes on unmount. |
| `components/MonolithCamera.tsx` | `channels → camera` each frame (frame prio 20). |
| `components/MonolithLighting.tsx` | Clean studio three-point rig (warm-neutral key, near-white rim, broad near-neutral fill); intensities driven by `key`/`fill`/`rim` channels; budgeted contact shadows. |
| `components/MonolithEnvironment.tsx` | Graphite background, crisp reflective obsidian floor (no fog); applies HDR IBL + floor PBR maps when they decode. |
| `components/HeroMonolith.tsx` | Hero host — pipeline-sourced model or **no geometry at all** when absent; applies the authored pose (`tiltZ`/`spinY`). |
| `components/DustField.tsx` | GPU dust particle system — **not mounted** in this scene (the reference's air is clean); kept self-contained (`opacity` prop) for a later, moodier scene. |
| `components/MonolithAudio.tsx` | Ambient bed + spatial (HRTF) emitter, listener driven by the camera. |
| `components/MonolithEffects.tsx` | Bloom (tracks `key`) + tier-gated Depth of Field (tracks `dofFocus`/`dofBokeh`) + a static, mild vignette. No film grain. |

### `assets/` — production asset pipeline

| File | Responsibility |
| --- | --- |
| `types.ts` | Categories, kinds, variants, specs, budgets, validation + status types. Pure. |
| `manifest.ts` | Authoritative production manifest (every asset, desktop/mobile variants, specs, budgets, magic). Hero is a MULTI-PART GLB — `SCENE_01_HERO_PARTS` lists the 8 required named nodes. `heroCrossSection` is a separate multi-part asset (`SCENE_01_CROSS_SECTION_PARTS`) for shot E only. Pure. |
| `validate.ts` | Availability `probe()` + magic-byte / size `sniff()` → a verdict that never throws. |
| `decoders.ts` | One decode path per kind (GLB·DRACO·Meshopt·KTX2 / HDR+PMREM / PBR pack / audio / spatial / video), each with `dispose()`. |
| `store.ts` | Scene-local Zustand: per-asset status + per-category progress + hot-swap `revision`. |
| `AssetManager.ts` | Orchestration: variant select → validate → decode → cache → mirror progress → hot-load poll → dispose. |
| `hooks.ts` | `useHeroScene` / `useEnvironmentMap` / `useFloorMaps` / `useAudioBuffer` / `useVideoTexture` / `useCategoryProgress`. |
| `debug.ts` | Dev-only logger (`import.meta.env.DEV` guarded — stripped in prod). |
| `index.ts` | Public barrel + back-compat helpers. |

### `hud/` — technical overlay

| File | Responsibility |
| --- | --- |
| `content.ts` | Per-shot copy + screen-space callout anchor points. Only HERO and TURNAROUND have entries — `SCENE_01_HUD_CONTENT` is a `Partial<Record<...>>` and `HudOverlay` renders nothing for a shot without content (deliberate, not a placeholder). Pure data. |
| `useScene01HudState.ts` | DOM-side hook resolving the active shot from the SAME scroll store + pure helpers the in-canvas timeline uses — no R3F dependency, no bridge/portal. |
| `HudOverlay.tsx` | The DOM/CSS component (corner brackets, crosshair, tag, callouts). Mounted OUTSIDE the Canvas, in `MonolithExperience`. Near-zero GPU cost. |

Anchor points are **screen-space percentages**, not 3D-projected — a
deliberate v1 simplification (see the "Deferred / simplified" section
below).

## Animation model

```
scroll (Lenis → store) ─▶ local progress (clamped to active range, config.ts)
                       ─▶ damped (half-life) ─▶ GSAP timeline.progress()
                       ─▶ Scene01Channels (flat scalars, mutated in place)
                       ─▶ camera + pose / studio lights / DOF / bloom  (frame bus)

                       (DOM, independent) ─▶ resolveScene01Shot(local)
                                          ─▶ HudOverlay content swap
```

Frame-bus priority ordering guarantees the timeline resolves (10) before
the camera/lights (20). The HUD reads the identical scroll math on the DOM
side via `resolveScene01LocalProgress` + `resolveScene01Shot`, so the 3D
scene and the DOM overlay never disagree about which shot is active.

A **hard cut** (camera, pose, lighting, and DOF all snapping together) is
authored as a near-zero-duration tween segment at the shot boundary
(`SCENE_01_CUT_EPSILON`, in `shots.ts`) — no separate transition machinery.

## Waiting on real assets

No asset binaries ship in the repo yet — by design. The `AssetManager`
**probes each manifest URL at runtime**: present files are validated,
decoded, and hot-swapped in; absent files leave the scene in its
intentional fallback (no geometry, no textures, explicit rig only). There
is no `ready` flag to toggle.

To bring an asset online, drop the file at the `url` declared in
`assets/manifest.ts` under `public/assets/scene-01/…`. Within one poll it
validates and appears — no code change, no reload. Slots: hero GLB
(desktop/mobile, **multi-part** — see `SCENE_01_HERO_PARTS`), hero
cross-section GLB (desktop/mobile, **multi-part** — see
`SCENE_01_CROSS_SECTION_PARTS`, shot E only), studio HDR (2K/1K), obsidian
floor PBR pack, ambient drone, spatial sizzle, and a reserved
video-texture slot.

**The full art-team brief — file names, resolutions, compression, poly /
memory budgets, and Blender export settings — lives in
[`docs/scene-01-production-asset-guide.md`](../../../docs/scene-01-production-asset-guide.md).**

Camera pose numbers (`BASE_Y_LYING` in `HeroMonolith.tsx`, `dofFocus`/
`dofBokeh` ranges in `MonolithEffects.tsx`) are principled approximations
pending the real hero GLB's bounds — retune once it lands.

## Performance & degradation

Driven entirely by `resolveScene01Budget(tier, isMobile)`:

- **high** — DOF on, contact shadows, 512-unit reflector budget, full post.
- **medium** — DOF on, shadows, 256-unit reflector budget, full post.
- **low** — DOF off, no shadows, plain floor, **no postprocessing**.
- **mobile** — one extra clamp on top of tier (DOF off, no shadows, reflector capped).

`prefers-reduced-motion` snaps to the settled turnaround-end frame and
skips the scroll scrub entirely (both the 3D timeline and the HUD's
cross-fade).

## Deferred / simplified (see docs/scene-01-reference-breakdown.md)

- **Turnaround is a single camera**, not the reference's 2×2 orthographic
  scissor-viewport grid — that is a materially different R3F pattern
  (multiple simultaneous viewports) flagged as a later, dedicated phase.
- **HUD callout anchors are screen-space**, not 3D-projected onto the mesh.
- **HUD copy for C1/C2/D/E is not written** — `HudOverlay` renders nothing
  for those shots (deliberate, not a placeholder).
- **Macro shots (C1/C2), exploded deconstruction (D), and the material
  board (E) have camera + timeline scaffolding only** — no macro-specific
  visual effects (e.g. the sauce-pour motion), no exploded-part
  offsetting, no cross-section rendering. They need the multi-part hero
  GLB and the `heroCrossSection` asset, both now fully briefed in
  `docs/scene-01-production-asset-guide.md`, PLUS new components
  (`MacroRig`/`SaucePour`, `ExplodedRig`, `MaterialBoard`) that don't
  exist yet.
