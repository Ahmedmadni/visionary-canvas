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
| `assets.ts` | Real-asset manifest with `ready` flags + graceful-missing handling. No placeholder geometry. |
| `cameras.ts` | Authored camera keyframes (desktop + mobile framings), registered as named CameraRig presets. |
| `timeline.ts` | The scroll-driven **GSAP** timeline. Scrubs a flat `Scene01Channels` object; pure + unit-tested. |
| `runtime.tsx` | React context threading `channels` / `budget` / `keyframes` to subsystems without prop-drilling or re-renders. |
| `Scene01.tsx` | Scene root (the registry's lazy default export). Wires the subsystems + per-frame drivers. |
| `register.ts` | Registry side effect (lazy `load`, preset registration). Imported by `src/scenes/index.ts`. |
| `hooks/useScene01Timeline.ts` | Builds + scrubs the timeline from damped scroll; reduced-motion short-circuit. |
| `hooks/useScene01Lifecycle.ts` | Ambient-audio bed (enter/exit), degrades silently when the stem is absent. |
| `hooks/useHeroModel.ts` | Compressed-GLB (DRACO+Meshopt) hero loader. Suspends; only mounted when present. |
| `components/MonolithCamera.tsx` | `channels → camera` each frame (frame prio 20). |
| `components/MonolithLighting.tsx` | Three-point rig; intensities driven by `key`/`rim` channels; budgeted contact shadows. |
| `components/MonolithEnvironment.tsx` | Graphite background, `haze`-driven fog, reflective obsidian floor, IBL when the HDR lands. |
| `components/HeroMonolith.tsx` | Hero host — real model or **lit-void fallback**; authored `rise`. |
| `components/DustField.tsx` | GPU dust particle system (bespoke shader, additive, `dust`-driven opacity). |
| `components/MonolithEffects.tsx` | Bloom / vignette / grain inside the tier-aware composer; bloom tracks `key`. |

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

Every entry in `assets.ts` ships `ready: false`. To bring one online: drop
the real binary at its manifest `url` under `public/`, flip `ready` to
`true`. No other wiring changes. Until then the scene plays the honest
lit-void fallback. Slots: hero GLB, studio HDR, obsidian floor PBR set,
ambient drone.

## Performance & degradation

Driven entirely by `resolveScene01Budget(tier, isMobile)`:

- **high** — 2400 dust, contact shadows, 1024² mirror floor, full post.
- **medium** — 1200 dust, shadows, 512² mirror floor, full post.
- **low** — 400 dust, no shadows, plain floor, **no postprocessing**.
- **mobile** — one extra clamp on top of tier (×0.4 dust, no shadows, 64²).

`prefers-reduced-motion` snaps to the settled hero frame and skips the
scroll scrub entirely.
