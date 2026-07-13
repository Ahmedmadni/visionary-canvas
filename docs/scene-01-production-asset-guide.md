# Scene 01 — "The Monolith" · Production Asset Guide

**Audience:** 3D / texture / audio artists delivering final assets.
**Owner:** Scene 01 engineering.
**Status:** Pipeline live. Awaiting all production assets.

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
│   └── hero-shawarma.mobile.glb
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

---

## 2. Hero model — `model`

The single subject. Lit by the scene rig; **do not bake lighting**.

| | Desktop | Mobile |
| --- | --- | --- |
| **File** | `models/hero-shawarma.desktop.glb` | `models/hero-shawarma.mobile.glb` |
| **Triangle budget** | ≤ 45,000 tris | ≤ 18,000 tris |
| **Textures** | 4K albedo · 2K normal/rough/AO | 2K albedo · 1K normal/rough/AO |
| **Compression** | Draco L6 + Meshopt + KTX2/UASTC | Draco L6 + Meshopt + KTX2/ETC1S |
| **Max file size** | 9 MB | 3.5 MB |
| **GPU memory budget** | ~48 MB | ~16 MB |
| **Format** | glTF 2.0 binary (`.glb`) | glTF 2.0 binary (`.glb`) |

**Geometry rules**

- **+Y up**, single root, **origin at the base** (model sits on `y = 0`),
  overall height ≈ **2 world units**. Face **−Z**.
- Apply all transforms (scale = 1, rotation = 0). No empties, no cameras,
  no lights in the file.
- One material, **metallic-roughness** workflow. No vertex colors.
- Real-world scale; clean, welded normals; UVs in 0–1, no overlaps on the
  albedo set.

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

---

## 3. Environment HDRI — `environment`

Image-based lighting + floor reflections. Mostly black with one soft warm
key and one cyan rim source. The explicit three-point rig provides most of
the key light, so this is **fill + reflection**, not the main light.

| | Desktop | Mobile |
| --- | --- | --- |
| **File** | `hdr/studio-void.2k.hdr` | `hdr/studio-void.1k.hdr` |
| **Resolution** | 2048 × 1024 | 1024 × 512 |
| **Format** | Equirectangular, 32-bit float **RGBE `.hdr`** | same |
| **Max file size** | 12 MB | 4 MB |
| **GPU memory budget** | ~24 MB (pre-PMREM) | ~6 MB |

**Rules**

- Scene-referred **linear** values, **no baked tonemap / no exposure**.
- Peak luminance **≤ 8.0**. Keep the key disc soft (no hard sun).
- The runtime pre-filters to a PMREM environment map automatically; just
  deliver a clean equirect `.hdr`.

**Blender/Nuke export:** render or paint equirectangular, save as
Radiance `.hdr` (32-bit). Do not export `.exr` here — the loader expects
RGBE `.hdr`.

---

## 4. Obsidian floor PBR pack — `material`

Tileable reflective floor. Applied to the floor material; without it the
floor is a flat dark reflective standard material (still looks correct).

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

## 5. Audio

| Role | File | Channels | Format | Budget | Notes |
| --- | --- | --- | --- | --- | --- |
| **Ambience** (`audio`) | `audio/monolith-drone.mp3` | 48 kHz **stereo** | MP3 320 kbps (or Ogg q6) | 6 MB / ≤ 2.5 MB file | Seamless loop; swells at the ignition beat. Peak −1 dBTP, ~ −18 LUFS. |
| **Sizzle** (`audio-spatial`) | `audio/shawarma-sizzle.mp3` | 48 kHz **MONO** | MP3 256 kbps (or Ogg q5) | 3 MB / ≤ 1.5 MB file | **Must be mono** — it is HRTF-spatialized at the hero and panned by the camera. Tight seamless loop, no stereo width. |

Both start only after the first user gesture (browser autoplay policy) and
loop for the scene's duration. Missing audio = silence, no error.

---

## 6. Video texture — `video` (RESERVED)

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

## 7. Validation & rejection rules

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

Check the dev console (`[scene-01/assets]`) after every drop — it names the
exact reason for any rejection.

---

## 8. Total scene budget (all assets present)

| Category | Desktop GPU/CPU | Mobile GPU/CPU |
| --- | --- | --- |
| Hero model | ~48 MB | ~16 MB |
| Environment HDRI | ~24 MB | ~6 MB |
| Floor PBR | ~12 MB | ~3 MB |
| Audio (ambience + sizzle) | ~9 MB | ~9 MB |
| Video (reserved) | ~20 MB | — |
| **Target total** | **≤ ~110 MB desktop** | **≤ ~35 MB mobile** |

Stay within budget so the whole 10-scene experience fits GPU memory as it
grows. When in doubt, prioritize the hero silhouette + reflection quality;
the void hides texture detail elsewhere.

---

*This guide is kept in lockstep with `src/scenes/scene-01/assets/manifest.ts`
— if a spec changes there, it changes here.*
