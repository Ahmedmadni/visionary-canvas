# Scene 01 — "The Monolith" · Production Asset Guide

**Audience:** 3D / texture / audio artists delivering final assets.
**Owner:** Scene 01 engineering.
**Status:** Pipeline live. Awaiting all production assets. Direction:
**clean studio product-viz**, per the approved reference video — see
`docs/scene-01-reference-breakdown.md`.

The runtime has a complete asset integration layer built and waiting.
Nothing here needs an engineer once you understand the drop points: place
a file at the exact path below and it validates, decodes, and appears in
the scene automatically (in dev, within ~4 seconds — no reload). If a file
is missing or fails validation, the scene falls back gracefully with no
visual glitch, so partial deliveries are safe.

---

## 1. How delivery works

1. Export to the **exact file name + path** in the tables below.
2. Drop it under `public/assets/scene-01/…`.
3. The runtime **probes → validates (magic bytes + size) → decodes →
   hot-swaps** it in. Watch the browser console (dev) for
   `[scene-01/assets]` logs confirming `ready`, or warnings if a file is
   oversized / mislabelled / corrupt.

There is **no flag to flip** and no code to touch. Availability is
observed at runtime.

### Folder layout

```
public/assets/scene-01/
├── models/
│   ├── hero-shawarma.desktop.glb
│   ├── hero-shawarma.mobile.glb
│   ├── hero-cross-section.desktop.glb
│   └── hero-cross-section.mobile.glb
├── hdr/
│   ├── studio-void.2k.hdr
│   └── studio-void.1k.hdr
├── textures/obsidian/
│   ├── albedo.2k.ktx2      normal.2k.ktx2      roughness.2k.ktx2   ao.2k.ktx2
│   └── albedo.1k.ktx2      normal.1k.ktx2      roughness.1k.ktx2
├── audio/
│   ├── monolith-drone.mp3
│   └── shawarma-sizzle.mp3
└── video/
    └── hero-turntable.mp4   (reserved — not yet mounted)
```

### Why desktop **and** mobile variants

The runtime auto-selects `*.desktop.*` on desktop/tablet and `*.mobile.*`
on phones (and clamps one extra step for thermal headroom). Deliver both;
if only one exists the runtime will still use whatever is present.

### Which shot needs which asset

The scene is six hard-cut shots (A–E, with C split into two macro passes).
Only the hero GLB and the studio HDRI/floor are needed for shots A and B,
which are what's implemented today. The rest of this table is a look-ahead
so delivery can be sequenced sensibly — it does not mean those shots are
live yet (see `docs/scene-01-reference-breakdown.md` for what's built).

| Shot | Needs |
| --- | --- |
| A — Hero / HUD beauty | Hero GLB, studio HDRI, floor PBR |
| B — Turnaround | Hero GLB (same asset, no separate turnaround model) |
| C1 — Macro meat | Hero GLB — the `meatBeef`/`meatChicken` parts, isolated |
| C2 — Macro sauce | Hero GLB — the `sauce` part, isolated |
| D — Exploded deconstruction | Hero GLB — ALL named parts, offset independently |
| E — Material / cross-section board | **`heroCrossSection` GLB** (separate asset) |

---

## 2. Hero model — `model`

The single subject. Lit by the scene rig; **do not bake lighting**.

**⚠ MULTI-PART — this is a change from the original single-mesh brief.**
The hero must be modeled and exported as **separable named nodes**, not one
fused mesh. The exploded shot (D) offsets each part independently; the
macro shots (C1/C2) isolate one part for a close-up. One `.glb` file,
multiple named nodes — not multiple files.

| | Desktop | Mobile |
| --- | --- | --- |
| **File** | `models/hero-shawarma.desktop.glb` | `models/hero-shawarma.mobile.glb` |
| **Triangle budget** | ≤ 45,000 tris (whole assembly) | ≤ 18,000 tris |
| **Textures** | 4K albedo · 2K normal/rough/AO | 2K albedo · 1K normal/rough/AO |
| **Compression** | Draco L6 + Meshopt + KTX2/UASTC | Draco L6 + Meshopt + KTX2/ETC1S |
| **Max file size** | 9 MB | 3.5 MB |
| **GPU memory budget** | ~48 MB | ~16 MB |
| **Format** | glTF 2.0 binary (`.glb`) | glTF 2.0 binary (`.glb`) |

**Required named parts** (exact node names, case-sensitive):

```
flatbread · meatBeef · meatChicken · fries · pickles · tomato · sauce · parsley
```

**Geometry rules**

- **+Y up**, one root object containing the 8 named part objects above —
  each its own node, **not merged**. Origin at the base of the assembled
  hero (`y = 0`), overall height ≈ **2 world units**. Face **−Z**.
- Each part keeps its own local origin at its natural rest position within
  the assembled hero. The exploded shot offsets FROM that rest position —
  it does not compute a center, so a part placed anywhere but its correct
  assembled location will explode from the wrong place.
- Apply all transforms (scale = 1, rotation = 0) before export. No empties
  beyond the root, no cameras, no lights in the file.
- Metallic-roughness workflow. A shared material per part is fine. No
  vertex colors.
- Real-world scale; clean, welded normals; UVs in 0–1, no overlaps on the
  albedo set.

**MACRO-READY — new requirement.** Two shots push the camera to within
~15–25cm virtual distance of a single part (C1 on the meat, C2 on the
sauce). At that distance:

- No visible texture tiling or repeats.
- No flat-shaded facets — subdivide or add a normal map with real
  micro-detail (grill marks, meat striations, sauce sheen).
- No seams on `meatBeef`, `meatChicken`, `sauce`, or `pickles` specifically
  — these are the parts the macro shots isolate.
- **Test each of those parts in isolation, framed as a macro close-up,
  before delivery.** A model that reads fine at hero-shot distance can
  fall apart under a macro lens.

**Blender export settings** (File → Export → glTF 2.0)

- Format **glTF Binary (.glb)**.
- Transform: **+Y Up** ✔.
- Include: Selected Objects, **Apply Modifiers** ✔.
- Geometry: UVs ✔, Normals ✔, Tangents ✔ (needed for the normal map),
  Vertex Colors ✘.
- Materials: **Export**, Images: **Automatic** (we re-encode to KTX2 —
  see below), or embed KTX2 if you run the toktx step yourself.
- Compression: **Draco** ✔ — Position **14**, Normal **10**, Texcoord
  **12**, generic 12, compression level **6**.

**Post-export (engineering-provided script, but you can run it):**

```
# Re-encode embedded textures to KTX2 and Meshopt-optimize:
gltf-transform uastc  in.glb tmp.glb   --slots "baseColor"
gltf-transform etc1s  tmp.glb tmp2.glb --slots "!baseColor"
gltfpack -i tmp2.glb -o hero-shawarma.desktop.glb -cc   # Meshopt, keep Draco
```

**⚠ gltfpack node safety:** verify the output still has 8 named nodes
(`gltf-transform inspect hero-shawarma.desktop.glb`) — some `gltfpack`
flag combinations merge nodes with shared materials, which would silently
break the exploded shot. If yours does, export a unique (even temporary)
material per part before running gltfpack, or use `-kn` if your version
supports "keep named nodes."

---

## 3. Hero cross-section — `model` (new — Material Board shot only)

A **separate model** from the hero above — two halves, pre-split, showing
the layered filling at the cut face. Used only by shot E (Material /
Cross-Section Board). The runtime never cuts the hero GLB at runtime; this
is authored geometry.

| | Desktop | Mobile |
| --- | --- | --- |
| **File** | `models/hero-cross-section.desktop.glb` | `models/hero-cross-section.mobile.glb` |
| **Triangle budget** | ≤ 40,000 tris | ≤ 16,000 tris |
| **Textures** | 4K albedo · 2K normal/rough/AO | 2K albedo · 1K normal/rough/AO |
| **Compression** | Draco L6 + Meshopt + KTX2/UASTC | Draco L6 + Meshopt + KTX2/ETC1S |
| **Max file size** | 8 MB | 3 MB |
| **GPU memory budget** | ~44 MB | ~14 MB |

**Required named parts:** `leftHalf` · `rightHalf`

**Rules**

- Same materials/ingredient stack as the hero (flatbread / sauce / fries /
  meat / pickles / tomato) — this must read as "the same product, cut
  open," not a different sandwich.
- Position both halves with a small resting gap along X, **already split**
  — the scene does not animate a cut-open motion, the camera just holds on
  this pre-arranged geometry.
- Cut-face detail is the priority here (this shot exists to sell
  ingredient quality up close) — spend the triangle/texture budget on the
  interior faces over the outer crust.
- Same export pipeline as the hero (see Section 2's Blender settings +
  post-export script).

---

## 4. Environment HDRI — `environment`

Image-based lighting + floor reflections for a **clean, bright studio
look** — NOT a moody void. The explicit three-point studio rig (warm-
neutral key, near-white rim, broad neutral fill) provides most of the
light; this HDRI is fill + reflection detail, not the main light source.

| | Desktop | Mobile |
| --- | --- | --- |
| **File** | `hdr/studio-void.2k.hdr` | `hdr/studio-void.1k.hdr` |
| **Resolution** | 2048 × 1024 | 1024 × 512 |
| **Format** | Equirectangular, 32-bit float **RGBE `.hdr`** | same |
| **Max file size** | 12 MB | 4 MB |
| **GPU memory budget** | ~24 MB (pre-PMREM) | ~6 MB |

**Rules**

- Scene-referred **linear** values, **no baked tonemap / no exposure**.
- Peak luminance **≤ 8.0**. Soft, broad light sources — a studio softbox
  environment, not a hard point sun. No colored gels; keep it neutral so
  it doesn't fight the rig's warm key / near-white rim.
- The runtime pre-filters to a PMREM environment map automatically; just
  deliver a clean equirect `.hdr`.

**Blender/Nuke export:** render or paint equirectangular, save as
Radiance `.hdr` (32-bit). Do not export `.exr` here — the loader expects
RGBE `.hdr`.

---

## 5. Obsidian floor PBR pack — `material`

Tileable reflective floor. Applied to the floor material; without it the
floor is a flat dark reflective standard material (still looks correct,
just not textured).

| | Desktop | Mobile |
| --- | --- | --- |
| **Files** | `textures/obsidian/{albedo,normal,roughness,ao}.2k.ktx2` | `textures/obsidian/{albedo,normal,roughness}.1k.ktx2` |
| **Resolution** | 2048 × 2048 per map | 1024 × 1024 per map |
| **Maps** | albedo · normal · roughness · AO | albedo · normal · roughness (no AO) |
| **Compression** | KTX2 — UASTC (albedo/normal), ETC1S (rough/AO) | KTX2 ETC1S |
| **Max file size** | 8 MB (pack total) | 2.5 MB (pack total) |
| **GPU memory budget** | ~12 MB | ~3 MB |

**Rules**

- **Tileable**, 1 × 1 m real-world scale.
- Color space: **albedo = sRGB**, all data maps (**normal / roughness /
  AO**) = **linear**.
- Normal map: **OpenGL (+Y green)**. Roughness in the **R** channel.
- The reference's floor reads as a **crisp, near-mirror surface** — keep
  roughness LOW and even (the runtime's reflector is tuned for a sharp
  reflection; a rough/scratched map will visibly soften it).
- AO uses the mesh's second UV set on the hero, but the **floor plane has
  one UV set — floor AO is optional and currently not sampled**; deliver it
  for completeness / future use.

**Encoding (toktx):**

```
toktx --t2 --encode uastc --uastc_quality 2 --genmipmap albedo.2k.ktx2 albedo.png
toktx --t2 --encode uastc --uastc_quality 2 --genmipmap --assign_oetf linear normal.2k.ktx2 normal.png
toktx --t2 --encode etc1s --clevel 4 --qlevel 128 --genmipmap --assign_oetf linear roughness.2k.ktx2 roughness.png
```

---

## 6. Material board swatches — NO new asset needed

Shot E's reference shows small PBR swatch spheres alongside the
cross-section. These are **not** a separate delivery — they're sourced
procedurally at render time from the hero / hero-cross-section GLB's own
material maps (small spheres rendered with the same materials). If this
turns out to look worse than authored swatch renders once the shot is
actually built, engineering will follow up with a dedicated ask — nothing
to prepare for this now.

---

## 7. Audio

| Role | File | Channels | Format | Budget | Notes |
| --- | --- | --- | --- | --- | --- |
| **Ambience** (`audio`) | `audio/monolith-drone.mp3` | 48 kHz **stereo** | MP3 320 kbps (or Ogg q6) | 6 MB / ≤ 2.5 MB file | Seamless loop, steady bed for the whole scene. Peak −1 dBTP, ~ −18 LUFS. |
| **Sizzle** (`audio-spatial`) | `audio/shawarma-sizzle.mp3` | 48 kHz **MONO** | MP3 256 kbps (or Ogg q5) | 3 MB / ≤ 1.5 MB file | **Must be mono** — it is HRTF-spatialized at the hero and panned by the camera. Tight seamless loop, no stereo width. |

Both start only after the first user gesture (browser autoplay policy) and
loop for the scene's duration. Missing audio = silence, no error.

---

## 8. Video texture — `video` (RESERVED)

The pipeline fully supports video textures, but **no surface mounts one in
Scene 01 yet** — do not author this unless engineering requests it.

| | Spec |
| --- | --- |
| **File** | `video/hero-turntable.mp4` |
| **Resolution** | 1080 × 1080 (1:1) |
| **Codec** | H.264 High (CRF ~20), `yuv420p`, **no audio track** |
| **Budget** | ~20 MB GPU / ≤ 12 MB file |
| **Notes** | Seamless loop, keyframe every 1 s. Provide an HEVC fallback if targeting Safari HDR later. |

---

## 9. Validation & rejection rules

The runtime rejects a file (and keeps the fallback) if:

- **Missing** — 404 / not present → status `unavailable` (silent, retried).
- **Corrupt / wrong format** — the file head does not match the format's
  magic signature (`glTF`, KTX2 identifier, `#?RADIANCE`, `ID3`/`OggS`,
  `ftyp`) → status `invalid`.
- **Empty / truncated** — under 16 bytes → `invalid`.
- **Decode failure** — loader throws → status `error`.

It **warns but still loads** if:

- File size exceeds the budget above (dev console warning).
- The server sends an unexpected `Content-Type`.

**Not yet checked automatically:** whether a GLB actually contains its
required named parts (the list in Sections 2/3). Missing an engine-side
check for that is a known gap (see `docs/scene-01-reference-breakdown.md`)
— for now, verify node names yourself with `gltf-transform inspect` before
delivery.

Check the dev console (`[scene-01/assets]`) after every drop — it names the
exact reason for any rejection.

---

## 10. Total scene budget (all assets present)

| Category | Desktop GPU/CPU | Mobile GPU/CPU |
| --- | --- | --- |
| Hero model (multi-part) | ~48 MB | ~16 MB |
| Hero cross-section | ~44 MB | ~14 MB |
| Environment HDRI | ~24 MB | ~6 MB |
| Floor PBR | ~12 MB | ~3 MB |
| Audio (ambience + sizzle) | ~9 MB | ~9 MB |
| Video (reserved) | ~20 MB | — |
| **Target total** | **≤ ~155 MB desktop** | **≤ ~48 MB mobile** |

The cross-section model only needs to be resident while shot E is active —
if this budget becomes a problem, engineering can dispose/reload it
per-shot rather than holding it for the whole scene (not implemented yet;
flag if the number above is a concern).

---

*This guide is kept in lockstep with `src/scenes/scene-01/assets/manifest.ts`
— if a spec changes there, it changes here.*
