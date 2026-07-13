# Scene 01 — "The Monolith"

An 8–12 second cinematic reveal of a single luxury shawarma standing
monolithic in near-darkness. The camera rises from the floor, arcs a slow
three-quarter, and settles into a held hero portrait as a warm key light
blooms in and cold cyan rim light carves the silhouette out of the void.
Product-launch grammar — Apple / Porsche / Tesla.

This is an **isolated, reusable production module**. It self-registers with
the global scene registry and drives everything imperatively off the shared
frame bus — no per-frame React state.

## Files

| File | Responsibility |
| --- | --- |
| `config.ts` | Identity, scroll range (canonical + host-remappable), beat map, per-tier/mobile performance budget, frame-bus priorities. Pure data. |
| `cameras.ts` | Authored camera keyframes (desktop + mobile framings), registered as named CameraRig presets. |
| `timeline.ts` | The scroll-driven **GSAP** timeline. Scrubs a flat `Scene01Channels` object; pure + unit-tested. |
| `runtime.tsx` | React context threading `channels` / `budget` / `keyframes` to subsystems without prop-drilling or re-renders. |
| `Scene01.tsx` | Scene root (the registry's lazy default export). Wires the subsystems + per-frame drivers. |
| `register.ts` | Registry side effect (lazy `load`, preset registration). Imported by `src/scenes/index.ts`. |
| `hooks/useScene01Timeline.ts` | Builds + scrubs the timeline from damped scroll; reduced-motion short-circuit. |
| **`assets/`** | **The production asset pipeline** — see below. |
| `components/AssetSystem.tsx` | Binds the asset manager to the renderer, starts load + hot-load, disposes on unmount. |
| `components/MonolithCamera.tsx` | `channels → camera` each frame (frame prio 20). |
| `components/MonolithLighting.tsx` | Three-point rig; intensities driven by `key`/`rim` channels; budgeted contact shadows. |
| `components/MonolithEnvironment.tsx` | Graphite background, `haze`-driven fog, reflective obsidian floor; applies HDR IBL + floor PBR maps when they decode. |
| `components/HeroMonolith.tsx` | Hero host — pipeline-sourced model or **lit-void fallback**; authored `rise`. |
| `components/DustField.tsx` | GPU dust particle system (bespoke shader, additive, `dust`-driven opacity). |
| `components/MonolithAudio.tsx` | Ambient bed + spatial (HRTF) emitter, listener driven by the camera. |
| `components/MonolithEffects.tsx` | Bloom / vignette / grain inside the tier-aware composer; bloom tracks `key`. |

### `assets/` — production asset pipeline

| File | Responsibility |
| --- | --- |
| `types.ts` | Categories, kinds, variants, specs, budgets, validation + status types. Pure. |
| `manifest.ts` | Authoritative production manifest (every asset, desktop/mobile variants, specs, budgets, magic). Pure. |
| `validate.ts` | Availability `probe()` + magic-byte / size `sniff()` → a verdict that never throws. |
| `decoders.ts` | One decode path per kind (GLB·DRACO·Meshopt·KTX2 / HDR+PMREM / PBR pack / audio / spatial / video), each with `dispose()`. |
| `store.ts` | Scene-local Zustand: per-asset status + per-category progress + hot-swap `revision`. |
| `AssetManager.ts` | Orchestration: variant select → validate → decode → cache → mirror progress → hot-load poll → dispose. |
| `hooks.ts` | `useHeroScene` / `useEnvironmentMap` / `useFloorMaps` / `useAudioBuffer` / `useVideoTexture` / `useCategoryProgress`. |
| `debug.ts` | Dev-only logger (`import.meta.env.DEV` guarded — stripped in prod). |
| `index.ts` | Public barrel + back-compat helpers. |

## Animation model

```
scroll (Lenis → store) ─▶ local progress (clamped to active range)
                       ─▶ damped (half-life) ─▶ GSAP timeline.progress()
                       ─▶ Scene01Channels (flat scalars, mutated in place)
                       ─▶ camera / lights / fog / dust / bloom  (frame bus)
```

Frame-bus priority ordering guarantees the timeline resolves (10) before
the camera/lights (20) and particles (30) read the channels.

## Waiting on real assets

No asset binaries ship in the repo yet — by design. The `AssetManager`
**probes each manifest URL at runtime**: present files are validated,
decoded, and hot-swapped in; absent files leave the scene in its
intentional lit-void fallback. There is no `ready` flag to toggle.

To bring an asset online, drop the file at the `url` declared in
`assets/manifest.ts` under `public/assets/scene-01/…`. Within one poll it
validates and appears — no code change, no reload. Slots: hero GLB
(desktop/mobile), studio HDR (2K/1K), obsidian floor PBR pack, ambient
drone, spatial sizzle, and a reserved video-texture slot.

**The full art-team brief — file names, resolutions, compression, poly /
memory budgets, and Blender export settings — lives in
[`docs/scene-01-production-asset-guide.md`](../../../docs/scene-01-production-asset-guide.md).**

## Performance & degradation

Driven entirely by `resolveScene01Budget(tier, isMobile)`:

- **high** — 2400 dust, contact shadows, 1024² mirror floor, full post.
- **medium** — 1200 dust, shadows, 512² mirror floor, full post.
- **low** — 400 dust, no shadows, plain floor, **no postprocessing**.
- **mobile** — one extra clamp on top of tier (×0.4 dust, no shadows, 64²).

`prefers-reduced-motion` snaps to the settled hero frame and skips the
scroll scrub entirely.
