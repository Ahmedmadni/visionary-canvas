# Scene 01 — Reference Technical Breakdown & Implementation Plan

**Reference:** `Concept_art_package_for_artist` · 10.0 s · 1920×1080 · 24 fps · H.264.
**Status:** Analysis below is unchanged. **Phases 1–4 of the plan are now
IMPLEMENTED** (clean-studio direction, approved) — see
"Implementation status" immediately below. Phases 5–8 remain planning-only.

## Implementation status (update)

Direction lock: **clean studio look**, matching the reference — fog, dust,
and the darkness-reveal are retired from Scene 01 (systems kept in the
codebase, unmounted, for a future moodier scene).

| Phase | Status | Notes |
| --- | --- | --- |
| 0 — Direction lock | ✅ Done | Clean-studio direction approved over the hybrid option. |
| 1 — Timeline & camera refactor | ✅ Done | `shots.ts` (HERO + TURNAROUND, hard-cut boundary), `cameras.ts` rewritten with per-shot keyframes + authored product pose (`tiltZ`/`spinY`) traveling with the camera. |
| 2 — Lighting overhaul | ✅ Done | `MonolithLighting.tsx` — warm-neutral key, near-white rim, broad neutral fill. `MonolithEnvironment.tsx` — fog removed, mirror floor sharpened. |
| 3 — DOF + grade | ✅ Done | Tier-gated `DepthOfField` in `MonolithEffects.tsx`, driven by `dofFocus`/`dofBokeh`; film grain (`Noise`) dropped; vignette reduced to a static, mild value. |
| 4 — HUD overlay | ✅ Done (v1) | DOM/CSS `hud/HudOverlay.tsx` — corner brackets, crosshair, per-shot tag + callouts. Screen-space anchors, not 3D-projected (see below). |
| 5 — Macro shots | ⏳ Deferred | Needs no new assets in principle, but not built this pass — out of the approved Phase 1–4 scope. |
| 6 — Exploded deconstruction | ⏳ Deferred | Blocked on a multi-part hero GLB (manifest not yet updated for it). |
| 7 — Turnaround (full 2×2) & material board | ⏳ Deferred / simplified | See below — a **single-camera** turnaround shipped instead of the reference's 4-viewport scissor grid. |
| 8 — Asset manifest updates | ⏳ Deferred | Follows once phases 5–7 are scheduled. |

### Scoping calls made during implementation (flagged, not silent)

- **Turnaround simplified to one camera.** The reference's Shot B is a 2×2
  grid of four *simultaneous* orthographic viewports (front/left/right/rear).
  That's a materially different R3F pattern (multiple scissored viewports in
  one frame) than anything else in this codebase, and was explicitly called
  out in the original plan as Phase 7 — "most documentation-flavoured,
  confirm before building." What shipped instead: **one perspective camera**
  with the product standing upright and a slow authored yaw (`spinY`),
  dressed with HUD copy ("TURNAROUND", "B · SPEC VIEW") so it reads as a
  spec-sheet pass without the 4-viewport engineering. The full grid is still
  open to build as a dedicated follow-up.
- **HUD anchors are screen-space, not 3D-projected.** Callout leader-lines
  point from a label to a fixed viewport percentage, not to a projected 3D
  point on the mesh. This matches how the reference itself reads (graphic
  overlay, not literal object tracking) and keeps the HUD a zero-R3F-
  dependency DOM layer. Upgrading to true 3D anchors is straightforward
  later (project a `Vector3` through the R3F camera into screen space) but
  wasn't needed for this shot content.
- **Product pose (lying → standing) is a new authored transform,** not just
  a camera move — `tiltZ`/`spinY` on the hero group, added to `cameras.ts`'s
  keyframes so a cut snaps pose and camera together. The resting-height
  offset for the "lying" pose (`BASE_Y_LYING` in `HeroMonolith.tsx`) is a
  principled approximation pending the real hero GLB's bounds.

Full shot-by-shot analysis and the original phased plan (unedited) follow.

> **What the reference actually is.** It is a *concept / production package*,
> not a single continuous cinematic. Over 10 s it moves through **six
> distinct sections** (hero → turnaround → 2× macro → exploded → material
> board), each with a HUD/technical-overlay treatment. The on-screen label
> text is AI-garbled ("SHAWARMNT", "Malynlic drooter 384") and carries **no
> meaning** — the transferable truth is the **composition, lighting, floor,
> pacing, camera language, and graphic-overlay system**, plus the **product
> design** it documents. This breakdown treats it accordingly.

A contact sheet (1 fps) accompanies this doc as
`scene01-reference-contactsheet.png`.

---

## Global art-direction observations (the mood truth)

These are the highest-value takeaways and they **differ materially from the
current implementation**:

- **Clean studio product-viz, not a moody void.** Even, bright, soft-box key;
  the product is fully lit from frame one. There is **no darkness-reveal**,
  **no volumetric fog**, **no floating dust**, and **no visible steam** in any
  section.
- **Signature floor:** glossy near-black surface with a **crisp mirror
  reflection** of the product. Present in hero, turnaround, and material
  sections.
- **Background:** near-black graphite radial gradient, subtle vignette.
- **Graphic language:** a persistent **HUD overlay** — corner brackets,
  crosshairs, callout leader-lines, small diamond/tick glyphs, a human-scale
  silhouette, and material swatch chips. This is a whole layer we do not have.
- **Camera language:** slow, controlled, product-viz. Locked or gentle
  push/parallax/turntable; **hard cuts between sections**, not one continuous
  fly-through.
- **Depth of field:** shallow and expressive in the macro sections; near-deep
  in the wide/turnaround sections.
- **Product pose:** hero beauty pose is **horizontal** (lying on the floor),
  three-quarter to camera. It only stands **vertical** inside the orthographic
  turnaround diagram.

---

## Shot-by-shot breakdown

Coordinates use the scene convention: hero near origin, ≈2 units tall,
+Y up, camera distances in world units. FOV in degrees (vertical).

### Shot A — HERO / HUD BEAUTY · ~0.0–1.8 s
1. **Camera movement:** slow lateral orbit + micro dolly-in (turntable feel).
2. **Camera speed:** very slow, constant (~3–5°/s yaw).
3. **Camera position:** ~`[1.6, 0.5, 4.2]`, slightly above the product.
4. **Camera target:** the wrap's mid-body, ~`[0, 0.35, 0]`.
5. **Lens (FOV):** long-ish, ~28–32° (≈70–85 mm equiv) — flattering compression.
6. **DOF:** moderate; front of wrap sharp, background floor falls off softly.
7. **Lighting direction:** key from upper-right/front, soft fill from left.
8. **Lighting intensity:** high-key, even; specular hotline along the flatbread.
9. **Colour temperature:** neutral ~5200 K key, slightly cooler fill (~6000 K).
10. **Environment mood:** clean, premium, technical; graphite backdrop.
11. **Fog density:** ~0 (none).
12. **Particle behaviour:** none (only static HUD glyphs).
13. **Steam behaviour:** none.
14. **Product rotation:** subtle yaw drift (~10–15° over the shot).
15. **Scroll mapping:** page 0.00 → 0.18.
16. **Animation timing:** HUD brackets draw-on over ~0.4 s; callouts fade in.
17. **Transition timing:** ~0.3 s dissolve/whip into Shot B.
18. **GSAP structure:** `shotA` label; camera yaw/dolly tween + HUD stagger.
19. **Three.js strategy:** reflective floor + soft area/spot key; product GLB.
20. **R3F mapping:** `MonolithCamera` (shot preset) · `HeroMonolith` · `MonolithEnvironment` (floor) · **new** `HudOverlay`.

### Shot B — ORTHOGRAPHIC TURNAROUND · ~1.8–4.0 s
1. **Camera movement:** none per view; a 2×2 quad of locked ortho views (front/left/right/rear).
2. **Camera speed:** static (product yaws 90° between quadrant states).
3. **Camera position:** orthographic, dead-on per quadrant.
4. **Camera target:** product centre `[0, 1.0, 0]` (standing pose).
5. **Lens (FOV):** orthographic (telephoto-flat, ~0° perspective).
6. **DOF:** deep / none.
7. **Lighting direction:** flat, even document lighting; mild top key.
8. **Lighting intensity:** medium, low contrast (readability over drama).
9. **Colour temperature:** neutral ~5500 K.
10. **Environment mood:** technical spec-sheet; darker slate panels + grid.
11. **Fog density:** 0.
12. **Particle behaviour:** none; static callouts + grid ticks.
13. **Steam behaviour:** none.
14. **Product rotation:** **stepped 90° yaws** define the four views.
15. **Scroll mapping:** 0.18 → 0.40.
16. **Animation timing:** quadrants stagger in ~0.2 s apart; leader-lines draw-on.
17. **Transition timing:** ~0.3 s cut to macro.
18. **GSAP structure:** `shotB`; 4 grouped sub-tweens (one per quadrant) + line draws.
19. **Three.js strategy:** one `OrthographicCamera`, 4 scissor/viewport regions **or** 4 instanced silhouettes; standing-pose transform.
20. **R3F mapping:** **new** `TurnaroundRig` + `HudOverlay`; reuses `HeroMonolith` geometry.

### Shot C1 — MACRO: MEAT · ~4.0–5.0 s
1. **Camera movement:** slow push / drift across the filling.
2. **Camera speed:** slow, eased.
3. **Camera position:** extreme close, ~`[0.15, 0.2, 0.6]` from surface.
4. **Camera target:** grilled meat slices.
5. **Lens (FOV):** macro, ~18–24° with very close focus.
6. **DOF:** **very shallow** — a thin slice of meat sharp, strong bokeh.
7. **Lighting direction:** raking side light to reveal char + moisture.
8. **Lighting intensity:** high spec on wet surfaces; punchy.
9. **Colour temperature:** warm ~4300–4800 K (appetising).
10. **Environment mood:** intimate, tactile, appetite-forward.
11. **Fog density:** 0.
12. **Particle behaviour:** none (optional faint spice specks).
13. **Steam behaviour:** none observed (candidate to ADD tastefully — see plan).
14. **Product rotation:** n/a (surface detail; camera moves, not product).
15. **Scroll mapping:** 0.40 → 0.52.
16. **Animation timing:** continuous slow parallax; focus pull across ~1 s.
17. **Transition timing:** ~0.25 s cut/whip to sauce macro.
18. **GSAP structure:** `shotC1`; camera dolly + `focusDistance` tween.
19. **Three.js strategy:** `DepthOfField` postprocess with animated focus target.
20. **R3F mapping:** **new** `MacroRig` (camera+focus) · `MonolithEffects` (add DOF).

### Shot C2 — MACRO: SAUCE POUR · ~5.0–6.0 s
1. **Camera movement:** near-locked, slight rise following the pour.
2. **Camera speed:** slow.
3. **Camera position:** ~`[0, 0.35, 0.6]` facing pickle/tomato/sauce.
4. **Camera target:** the drizzle contact point.
5. **Lens (FOV):** macro ~20°.
6. **DOF:** very shallow; droplets and sauce sharp, edges melt.
7. **Lighting direction:** front-top soft key + strong rim for the sauce sheen.
8. **Lighting intensity:** high spec on wet sauce/droplets.
9. **Colour temperature:** neutral-warm ~5000 K.
10. **Environment mood:** fresh, glossy, hyper-real.
11. **Fog density:** 0.
12. **Particle behaviour:** water droplets (static beads) on veg.
13. **Steam behaviour:** none.
14. **Product rotation:** n/a.
15. **Scroll mapping:** 0.52 → 0.63.
16. **Animation timing:** **sauce fluid pour** ~0.8 s (the one true motion FX).
17. **Transition timing:** ~0.3 s to exploded view.
18. **GSAP structure:** `shotC2`; morph/*displacement* or animated mesh for pour.
19. **Three.js strategy:** pre-baked pour as an animated GLTF clip or a scripted stretch mesh; DOF.
20. **R3F mapping:** `MacroRig` · **new** `SaucePour` (animated node) · DOF.

### Shot D — EXPLODED DECONSTRUCTION · ~6.0–8.0 s
1. **Camera movement:** slow vertical parallax up the floating stack.
2. **Camera speed:** slow, constant.
3. **Camera position:** ~`[0.4, 1.0, 4.8]`, framing the full column.
4. **Camera target:** stack centre `[0, 1.0, 0]`.
5. **Lens (FOV):** ~30° (mild compression to hold the tall stack).
6. **DOF:** moderate; whole stack mostly readable.
7. **Lighting direction:** even top-biased key so each layer reads.
8. **Lighting intensity:** medium, low-drama.
9. **Colour temperature:** neutral ~5200 K.
10. **Environment mood:** analytical "hero deconstructed"; graphite void.
11. **Fog density:** 0 (clean separation on black).
12. **Particle behaviour:** none; leader-lines + human-scale silhouette glyph.
13. **Steam behaviour:** none.
14. **Product rotation:** slow shared yaw of the whole stack (~15°).
15. **Scroll mapping:** 0.63 → 0.82.
16. **Animation timing:** ingredients **separate vertically** ~1.0 s (staggered), hold, re-converge optional.
17. **Transition timing:** ~0.3 s to material board.
18. **GSAP structure:** `shotD`; per-part `position.y` offset stagger + group yaw.
19. **Three.js strategy:** **multi-part GLB** (named ingredient meshes) offset along Y; leader-lines as HUD.
20. **R3F mapping:** **new** `ExplodedRig` (drives named nodes) · `HudOverlay` · `HeroMonolith` (multi-part variant).

### Shot E — MATERIAL / CROSS-SECTION BOARD · ~8.0–10.0 s
1. **Camera movement:** near-locked, tiny push-in.
2. **Camera speed:** very slow.
3. **Camera position:** ~`[0, 0.4, 4.0]` facing two cross-section halves.
4. **Camera target:** the cut faces `[0, 0.4, 0]`.
5. **Lens (FOV):** ~30°.
6. **DOF:** shallow-moderate; cut faces sharp.
7. **Lighting direction:** soft even key + rim on the halves.
8. **Lighting intensity:** medium-high, clean.
9. **Colour temperature:** neutral ~5200 K.
10. **Environment mood:** premium spec board; swatches + modeling notes panel.
11. **Fog density:** 0.
12. **Particle behaviour:** none; PBR swatch spheres + colour chips (HUD).
13. **Steam behaviour:** none.
14. **Product rotation:** static (two halves splayed open).
15. **Scroll mapping:** 0.82 → 1.00.
16. **Animation timing:** swatch chips + notes stagger in ~0.15 s apart.
17. **Transition timing:** hold to end / loop.
18. **GSAP structure:** `shotE`; halves ease-open + swatch stagger.
19. **Three.js strategy:** **cross-section hero variant** (two halves) + reflective floor; swatches as HUD/DOM.
20. **R3F mapping:** **new** `MaterialBoard` + `HudOverlay`; reflective floor reused.

---

## Comparison against the current Scene 01

### ✅ Already matches
- **Reflective dark floor** with mirror reflection (`MonolithEnvironment` + `MeshReflectorMaterial`).
- **Near-black graphite background** + subtle vignette.
- **Scroll-driven GSAP timeline** scrubbed from Lenis — the exact transport the reference's section pacing needs.
- **Authored camera choreography** with per-beat keyframes (the pattern extends cleanly to per-shot presets).
- **Asset pipeline** already expects the hero GLB, HDR, PBR floor, and (usefully) is where new asset needs plug in.
- **Bloom** for the clean specular sheen on the flatbread/sauce.
- **Tiered performance budget + reduced-motion** scaffolding.

### ❌ Missing (present in reference, absent now)
- **HUD / technical-overlay layer** — corner brackets, crosshairs, callout leader-lines, glyphs, human-scale silhouette, swatch chips. *(Biggest gap.)*
- **Multiple discrete shots with cuts** — current is one continuous rise/orbit; reference is 6 cut sections.
- **Depth-of-field** (shallow macro bokeh + focus pulls).
- **Macro ingredient close-ups** (meat, sauce).
- **Sauce-pour fluid motion** (the one hero motion FX).
- **Exploded deconstruction** of ingredients (needs a multi-part GLB).
- **Orthographic 4-view turnaround** chapter.
- **Material / cross-section board** chapter (needs a cut-halves variant + swatches).
- **Horizontal hero beauty pose** (current framing assumes a vertical "monolith").

### 🔧 Should be improved
- **Lighting** → shift from dramatic cyan-rim chiaroscuro toward **clean, high-key studio softbox** (neutral ~5200 K key, soft fill). Keep a gentle rim for separation, drop the "cold cyan reveal".
- **Camera** → replace the single rise/orbit with **per-shot presets + cuts**; add a turntable micro-yaw to the hero.
- **Floor reflection fidelity** → crisper mirror (lower blur) for the hero/material shots to match the reference's sharp reflection.
- **Tone/grade** → less moody, more premium-neutral; reduce vignette strength.

### ➖ Should be removed / reconsidered
- **Volumetric fog (`FogExp2`, `haze` channel)** — reference air is clean. Reduce to near-zero or cut; repurpose only as a faint floor gradient.
- **Dust particle field (`DustField`)** — no floating dust in the reference. Remove for Scene 01, or demote to an almost-invisible sparkle. (Keep the system in the codebase for later scenes.)
- **The "emerge from black void" ignition beat** (black → ignition → rise) — reference is fully lit from t0. Re-map the opening beats to a **lit hero + HUD draw-on**, not a darkness reveal.
- **Heavy film grain** — reference is clean; reduce or drop `Noise`.

### ⚡ Should be optimized
- **Reflection is the costliest pass** — disable `MeshReflectorMaterial` during the **macro** and **exploded** shots (floor barely visible); only pay for it in hero/turnaround/material.
- **DOF is expensive** — gate `DepthOfField` to medium/high tiers; on low tier, fake it with a static blurred backdrop or skip.
- **HUD as DOM/CSS/SVG overlay**, not WebGL — near-zero GPU cost, crisp text, easy to sync to scroll. Only the leader-line *anchor points* need projecting from 3D.
- **Turnaround** — render **one** model through 4 scissored viewports rather than 4 GLB instances (¼ the geometry/VRAM).
- **Exploded view** — reuse the single multi-part GLB's nodes with Y-offsets; no duplicate meshes.
- **Shot-scoped subsystems** — mount `MacroRig`/`ExplodedRig`/`MaterialBoard` only while their scroll range is active (unmount off-range) to keep per-frame work minimal.

---

## Reconciled target look (decision needed before build)

The reference is **clean studio product-viz with a HUD**; the current scene is
a **moody foggy void reveal**. These are different films. Recommended
reconciliation (pending sign-off):

> **Adopt the reference's clean studio look + HUD + shot structure**, keep the
> reflective floor and scroll-scrub engine, and **retire fog/dust/darkness-
> reveal** for Scene 01. Preserve those systems in the codebase for later,
> moodier scenes.

If instead a hybrid is wanted (studio product with a faint atmospheric base),
that is a one-line budget change — but it is a **direction call for the user**,
not an engineering default.

---

## Phased implementation plan (for approval — nothing built yet)

**Phase 0 — Direction lock.** Confirm the reconciled look above; decide
fog/dust in/out; confirm the 6-shot structure and per-shot scroll ranges.

**Phase 1 — Timeline & camera refactor.** Re-map `SCENE_01_BEATS` → six named
shots (A–E incl. C1/C2) with scroll ranges; extend `cameras.ts` with per-shot
presets; add **cut** handling (instant preset swap vs. eased) to the timeline.

**Phase 2 — Lighting overhaul.** Replace the cyan-rim chiaroscuro with a
studio soft-box rig (area/rect key + soft fill + gentle rim); tune the floor
reflection sharpness. Update the performance budget accordingly.

**Phase 3 — DOF + grade.** Add tier-gated `DepthOfField` with per-shot focus
targets; reduce vignette/grain; re-balance bloom for specular sheen.

**Phase 4 — HUD overlay system.** New DOM/SVG `HudOverlay` synced to the shot
timeline: corner brackets, crosshair, callout leader-lines with 3D-projected
anchors, glyphs, human-scale silhouette. Draw-on/stagger animations.

**Phase 5 — Macro shots.** `MacroRig` (close camera + focus pulls) for meat and
sauce; `SaucePour` animated node; disable floor reflection while active.

**Phase 6 — Exploded deconstruction.** `ExplodedRig` driving named ingredient
nodes with staggered Y-offsets + shared yaw (**requires the multi-part GLB**).

**Phase 7 — Turnaround & material board (optional/last).** `TurnaroundRig`
(ortho, 4 scissored viewports) and `MaterialBoard` (cross-section halves +
swatch HUD). These are the most "documentation-flavoured" — confirm they
belong in the *scene* vs. a separate spec page.

**Phase 8 — Asset manifest updates.** Extend the asset guide/manifest for the
new needs below.

---

## New asset requirements surfaced by the reference

Feed these into `assets/manifest.ts` + the Production Asset Guide (Phase 8):

- **Hero GLB must be multi-part** — separable named meshes (`flatbread`,
  `meat`, `fries`, `pickles`, `tomato`, `sauce`, `parsley`) for the exploded
  view. *(Current manifest briefs a single-mesh hero — this is a real change.)*
- **Cross-section variant** of the hero (two open halves) for the material board.
- **Sauce-pour** animated clip (or a morphable sauce mesh).
- **Macro-detail textures** (4K albedo/normal) for extreme close-ups.
- **HUD assets** — a technical/monospace font, bracket/crosshair/diamond SVGs,
  and a human-scale silhouette.
- **Material swatch renders** (PBR spheres) — or generate them live from the
  hero materials.

## Technical risks
- **Direction mismatch** is the top risk: building to the reference means
  removing the atmospheric identity of the current scene. Get explicit sign-off.
- **Multi-part GLB** dependency gates the exploded shot — the hero asset brief
  must change *before* modeling starts, or that shot slips.
- **Per-shot mounting + cuts** interacts with the single-camera assumption in
  `MonolithCamera`; needs careful teardown to avoid frame-bus leaks between shots.
- **HUD text legibility** across breakpoints — the reference is 16:9; portrait
  mobile will need a re-laid-out HUD, not a scaled one.
- **DOF + reflection together** on mid-tier GPUs is heavy — the shot-scoped
  enable/disable strategy above is load-bearing, not optional.
