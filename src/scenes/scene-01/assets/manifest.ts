/**
 * Scene 01 — production asset manifest.
 *
 * The authoritative description of EVERY asset "The Monolith" expects in
 * production: file names, variants, compression, poly/memory budgets, and
 * the validation signature each delivered file must match. The Production
 * Asset Guide (docs/) is generated from these same specs, so code and the
 * art-team brief can never drift.
 *
 * No file here exists in the repo yet — that is by design. The asset
 * manager probes each URL at runtime; present files load and hot-swap in,
 * absent files leave the scene in its intentional lit-void fallback. There
 * is no `ready` flag to toggle anymore: availability is observed, not
 * declared.
 *
 * Pure data — safe to import anywhere (no Three.js / DOM).
 */

import type { Scene01AssetDef, Scene01VariantId } from "./types";

/** Root under `public/` for all Scene 01 assets. */
export const SCENE_01_ASSET_ROOT = "/assets/scene-01";

// Common magic signatures (ASCII where the format is text-headed).
const MAGIC = {
  glb: ["676c5446"], // "glTF"
  ktx2: ["ab4b5458203230bb0d0a1a0a"], // KTX 2.0 identifier
  hdr: ["#?RADIANCE", "#?RGBE"],
  png: ["89504e47"],
  mp3: ["494433", "fffb", "fff3", "fff2"], // ID3 or MPEG frame sync
  ogg: ["4f676753"], // "OggS"
  mp4: ["66747970"], // "ftyp" (appears at byte offset 4; sniffed loosely)
} as const;

export const SCENE_01_MANIFEST: readonly Scene01AssetDef[] = [
  // ----------------------------------------------------------------- MODEL
  {
    role: "hero",
    category: "model",
    kind: "glb",
    description:
      "Hero shawarma — the single subject of the scene. Y-up, origin at the base, ~2u tall.",
    optional: true,
    exportNotes: [
      "Blender → glTF 2.0 (.glb), +Y up, apply all transforms, single root.",
      "Compression: Draco (mesh) at compression level 6, quantize POS 14 / NORM 10 / UV 12.",
      "Bake PBR to KTX2/UASTC; do NOT ship PNG/JPG textures inside the GLB.",
      "One material, metallic-roughness workflow; no vertex colors.",
      "Meshopt-optimize after Draco (gltfpack -cc) for interleaved, quantized streams.",
    ],
    variants: [
      {
        id: "desktop",
        url: `${SCENE_01_ASSET_ROOT}/models/hero-shawarma.desktop.glb`,
        spec: {
          resolution: "4K albedo / 2K normal-roughness-ao",
          compression: "Draco L6 + Meshopt + KTX2/UASTC",
          triangleBudget: 45000,
          memoryBudgetMb: 48,
          maxFileSizeMb: 9,
        },
        validation: {
          magic: [...MAGIC.glb],
          contentTypes: ["model/gltf-binary", "application/octet-stream"],
        },
      },
      {
        id: "mobile",
        url: `${SCENE_01_ASSET_ROOT}/models/hero-shawarma.mobile.glb`,
        spec: {
          resolution: "2K albedo / 1K normal-roughness-ao",
          compression: "Draco L6 + Meshopt + KTX2/ETC1S",
          triangleBudget: 18000,
          memoryBudgetMb: 16,
          maxFileSizeMb: 3.5,
        },
        validation: {
          magic: [...MAGIC.glb],
          contentTypes: ["model/gltf-binary", "application/octet-stream"],
        },
      },
    ],
  },

  // ----------------------------------------------------------- ENVIRONMENT
  {
    role: "environment",
    category: "environment",
    kind: "hdr",
    description:
      "Studio-void HDRI for image-based lighting + floor reflections. Mostly black, one warm key + one cyan rim source.",
    optional: true,
    exportNotes: [
      "Equirectangular, 32-bit float, RGBE (.hdr). Keep the sun/key disc soft.",
      "Nuke/Blender: no baked-in tonemap; linear scene-referred values.",
      "Peak luminance ≤ 8.0; the scene's explicit rig provides most of the light.",
    ],
    variants: [
      {
        id: "desktop",
        url: `${SCENE_01_ASSET_ROOT}/hdr/studio-void.2k.hdr`,
        spec: {
          resolution: "2048×1024",
          compression: "RGBE .hdr (uncompressed float)",
          memoryBudgetMb: 24,
          maxFileSizeMb: 12,
        },
        validation: {
          magic: [...MAGIC.hdr],
          contentTypes: ["image/vnd.radiance", "application/octet-stream"],
        },
      },
      {
        id: "mobile",
        url: `${SCENE_01_ASSET_ROOT}/hdr/studio-void.1k.hdr`,
        spec: {
          resolution: "1024×512",
          compression: "RGBE .hdr (uncompressed float)",
          memoryBudgetMb: 6,
          maxFileSizeMb: 4,
        },
        validation: {
          magic: [...MAGIC.hdr],
          contentTypes: ["image/vnd.radiance", "application/octet-stream"],
        },
      },
    ],
  },

  // -------------------------------------------------------------- MATERIAL
  {
    role: "floor",
    category: "material",
    kind: "pbr-pack",
    description:
      "Obsidian reflective floor PBR set. Applied to the floor material; falls back to a flat dark standard material.",
    optional: true,
    exportNotes: [
      "Tileable, 1×1m real-world scale. sRGB for albedo/emissive, LINEAR for data maps.",
      "Encode with toktx/basisu: albedo UASTC, normal UASTC (rg), roughness/ao ETC1S.",
      "Normal map: OpenGL (+Y) green channel. Roughness in the R channel.",
    ],
    variants: [
      {
        id: "desktop",
        maps: {
          albedo: `${SCENE_01_ASSET_ROOT}/textures/obsidian/albedo.2k.ktx2`,
          normal: `${SCENE_01_ASSET_ROOT}/textures/obsidian/normal.2k.ktx2`,
          roughness: `${SCENE_01_ASSET_ROOT}/textures/obsidian/roughness.2k.ktx2`,
          ao: `${SCENE_01_ASSET_ROOT}/textures/obsidian/ao.2k.ktx2`,
        },
        spec: {
          resolution: "2048×2048 per map (×4)",
          compression: "KTX2 (UASTC albedo/normal, ETC1S rough/ao)",
          memoryBudgetMb: 12,
          maxFileSizeMb: 8,
        },
        validation: {
          magic: [...MAGIC.ktx2],
          contentTypes: ["image/ktx2", "application/octet-stream"],
        },
      },
      {
        id: "mobile",
        maps: {
          albedo: `${SCENE_01_ASSET_ROOT}/textures/obsidian/albedo.1k.ktx2`,
          normal: `${SCENE_01_ASSET_ROOT}/textures/obsidian/normal.1k.ktx2`,
          roughness: `${SCENE_01_ASSET_ROOT}/textures/obsidian/roughness.1k.ktx2`,
        },
        spec: {
          resolution: "1024×1024 per map (×3, no AO)",
          compression: "KTX2 ETC1S",
          memoryBudgetMb: 3,
          maxFileSizeMb: 2.5,
        },
        validation: {
          magic: [...MAGIC.ktx2],
          contentTypes: ["image/ktx2", "application/octet-stream"],
        },
      },
    ],
  },

  // ----------------------------------------------------------------- AUDIO
  {
    role: "ambience",
    category: "audio",
    kind: "audio",
    description:
      "Sub-heavy ambient drone bed. Loops for the whole scene; swells at the ignition beat.",
    optional: true,
    exportNotes: [
      "48kHz, stereo. Seamless loop (equal-power crossfade the tail).",
      "MP3 256–320kbps or Ogg Vorbis q6. Peak −1 dBTP, integrated ~ −18 LUFS.",
    ],
    variants: [
      {
        id: "universal",
        url: `${SCENE_01_ASSET_ROOT}/audio/monolith-drone.mp3`,
        spec: {
          resolution: "48kHz stereo",
          compression: "MP3 320kbps",
          memoryBudgetMb: 6,
          maxFileSizeMb: 2.5,
        },
        validation: {
          magic: [...MAGIC.mp3, ...MAGIC.ogg],
          contentTypes: ["audio/mpeg", "audio/ogg", "application/octet-stream"],
        },
      },
    ],
  },
  {
    role: "sizzle",
    category: "audio",
    kind: "audio-spatial",
    description:
      "Positional sizzle emitter anchored at the hero. 3D-panned via the hero's world position.",
    optional: true,
    exportNotes: [
      "48kHz, MONO (spatialization requires a single channel).",
      "Tight seamless loop, no stereo width. MP3 256kbps or Ogg q5.",
    ],
    variants: [
      {
        id: "universal",
        url: `${SCENE_01_ASSET_ROOT}/audio/shawarma-sizzle.mp3`,
        spec: {
          resolution: "48kHz mono",
          compression: "MP3 256kbps",
          memoryBudgetMb: 3,
          maxFileSizeMb: 1.5,
        },
        validation: {
          magic: [...MAGIC.mp3, ...MAGIC.ogg],
          contentTypes: ["audio/mpeg", "audio/ogg", "application/octet-stream"],
        },
      },
    ],
  },

  // ----------------------------------------------------------------- VIDEO
  {
    role: "heroTurntable",
    category: "video",
    kind: "video",
    description:
      "RESERVED — future video texture (e.g. a looping turntable / heat-shimmer surface). Pipeline supports it; nothing mounts it yet.",
    optional: true,
    exportNotes: [
      "Square 1:1, H.264 High + HEVC fallback, yuv420p, no audio track.",
      "Seamless loop, CRF ~20, keyframe every 1s for fast seek.",
    ],
    variants: [
      {
        id: "universal",
        url: `${SCENE_01_ASSET_ROOT}/video/hero-turntable.mp4`,
        spec: {
          resolution: "1080×1080",
          compression: "H.264 High (CRF 20)",
          memoryBudgetMb: 20,
          maxFileSizeMb: 12,
        },
        validation: {
          magic: [...MAGIC.mp4],
          contentTypes: ["video/mp4", "application/octet-stream"],
        },
      },
    ],
  },
];

const BY_ROLE = new Map<string, Scene01AssetDef>(SCENE_01_MANIFEST.map((a) => [a.role, a]));

export function getAssetDef(role: string): Scene01AssetDef | undefined {
  return BY_ROLE.get(role);
}

export function assetRoles(): string[] {
  return SCENE_01_MANIFEST.map((a) => a.role);
}

/**
 * Choose the best variant for the environment. Falls back to `universal`,
 * then to the first declared variant, so a manifest entry is never left
 * without a resolvable variant.
 */
export function selectVariant(def: Scene01AssetDef, isMobile: boolean) {
  const preferred: Scene01VariantId = isMobile ? "mobile" : "desktop";
  return (
    def.variants.find((v) => v.id === preferred) ??
    def.variants.find((v) => v.id === "universal") ??
    def.variants[0]
  );
}
