/**
 * Scene 01 — asset decoders.
 *
 * One decode path per asset kind, each returning a uniform `LoadedAsset`
 * with an explicit `dispose()` so the manager can release GPU/CPU memory
 * deterministically. All Three.js imports are confined to this file (and
 * the manager) — the manifest / validation / store stay framework-free.
 *
 * Compressed pipelines reuse the foundation's singleton loaders
 * (`@/lib/loaders`) so DRACO / KTX2 / Meshopt decoders are shared across
 * the whole app rather than re-instantiated per asset.
 */

import {
  EquirectangularReflectionMapping,
  LinearFilter,
  LinearMipmapLinearFilter,
  NoColorSpace,
  PMREMGenerator,
  RepeatWrapping,
  SRGBColorSpace,
  type Group,
  type Texture,
  type VideoTexture as VideoTextureType,
  type WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { VideoTexture } from "three";

import { audioManager } from "@/audio";
import { getDracoLoader, getKTX2Loader, MeshoptDecoder } from "@/lib/loaders";
import type { PbrMapSlot, Scene01AssetDef, Scene01AssetVariant } from "./types";

export interface LoadContext {
  gl: WebGLRenderer;
  isMobile: boolean;
}

export type LoadedAsset =
  | { kind: "glb"; scene: Group; dispose: () => void }
  | { kind: "hdr"; envMap: Texture; dispose: () => void }
  | { kind: "ktx2"; texture: Texture; dispose: () => void }
  | { kind: "pbr-pack"; maps: Partial<Record<PbrMapSlot, Texture>>; dispose: () => void }
  | { kind: "audio"; buffer: AudioBuffer; spatial: boolean; dispose: () => void }
  | { kind: "video"; texture: VideoTextureType; video: HTMLVideoElement; dispose: () => void };

// Data maps must stay linear; only color maps are sRGB.
const SRGB_SLOTS: readonly PbrMapSlot[] = ["albedo", "emissive"];

function configurePbrTexture(texture: Texture, slot: PbrMapSlot): void {
  texture.colorSpace = SRGB_SLOTS.includes(slot) ? SRGBColorSpace : NoColorSpace;
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
}

async function loadGlb(variant: Scene01AssetVariant, ctx: LoadContext): Promise<LoadedAsset> {
  const loader = new GLTFLoader();
  loader.setDRACOLoader(getDracoLoader());
  loader.setKTX2Loader(getKTX2Loader(ctx.gl));
  loader.setMeshoptDecoder(MeshoptDecoder);

  const gltf = await loader.loadAsync(variant.url!);
  const scene = gltf.scene as Group;

  const dispose = () => {
    scene.traverse((obj) => {
      const mesh = obj as { geometry?: { dispose?: () => void }; material?: unknown };
      mesh.geometry?.dispose?.();
      const mat = mesh.material;
      const disposeMat = (m: unknown) => {
        const record = m as Record<string, unknown> & { dispose?: () => void };
        for (const key of Object.keys(record)) {
          const v = record[key] as { isTexture?: boolean; dispose?: () => void } | null;
          if (v && v.isTexture) v.dispose?.();
        }
        record.dispose?.();
      };
      if (Array.isArray(mat)) mat.forEach(disposeMat);
      else if (mat) disposeMat(mat);
    });
  };

  return { kind: "glb", scene, dispose };
}

async function loadHdr(variant: Scene01AssetVariant, ctx: LoadContext): Promise<LoadedAsset> {
  const source = await new RGBELoader().loadAsync(variant.url!);
  source.mapping = EquirectangularReflectionMapping;

  // Pre-filter to a proper PMREM environment map for correct IBL.
  const pmrem = new PMREMGenerator(ctx.gl);
  pmrem.compileEquirectangularShader();
  const envMap = pmrem.fromEquirectangular(source).texture;
  pmrem.dispose();
  source.dispose(); // the equirect source is no longer needed once pre-filtered

  return {
    kind: "hdr",
    envMap,
    dispose: () => envMap.dispose(),
  };
}

async function loadKtx2(variant: Scene01AssetVariant, ctx: LoadContext): Promise<LoadedAsset> {
  const texture = await getKTX2Loader(ctx.gl).loadAsync(variant.url!);
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.needsUpdate = true;
  return { kind: "ktx2", texture, dispose: () => texture.dispose() };
}

async function loadPbrPack(variant: Scene01AssetVariant, ctx: LoadContext): Promise<LoadedAsset> {
  const ktx2 = getKTX2Loader(ctx.gl);
  const entries = Object.entries(variant.maps ?? {}) as [PbrMapSlot, string][];

  const loaded = await Promise.all(
    entries.map(async ([slot, url]) => {
      const texture = await ktx2.loadAsync(url);
      configurePbrTexture(texture, slot);
      return [slot, texture] as const;
    }),
  );

  const maps: Partial<Record<PbrMapSlot, Texture>> = {};
  for (const [slot, texture] of loaded) maps[slot] = texture;

  return {
    kind: "pbr-pack",
    maps,
    dispose: () => Object.values(maps).forEach((t) => t?.dispose()),
  };
}

async function loadAudio(def: Scene01AssetDef, variant: Scene01AssetVariant): Promise<LoadedAsset> {
  const buffer = await audioManager.load(def.role, variant.url!);
  return {
    kind: "audio",
    buffer,
    spatial: def.kind === "audio-spatial",
    // Buffers are owned by the AudioManager cache; nothing GPU-side to free.
    dispose: () => {},
  };
}

function loadVideo(variant: Scene01AssetVariant): Promise<LoadedAsset> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = variant.url!;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    video.preload = "auto";

    const onReady = () => {
      cleanup();
      const texture = new VideoTexture(video);
      texture.colorSpace = SRGBColorSpace;
      void video.play().catch(() => {
        /* autoplay may be blocked until gesture; texture still updates once playing */
      });
      resolve({
        kind: "video",
        texture,
        video,
        dispose: () => {
          video.pause();
          video.removeAttribute("src");
          video.load();
          texture.dispose();
        },
      });
    };
    const onError = () => {
      cleanup();
      reject(new Error("video load error"));
    };
    const cleanup = () => {
      video.removeEventListener("canplaythrough", onReady);
      video.removeEventListener("error", onError);
    };

    video.addEventListener("canplaythrough", onReady, { once: true });
    video.addEventListener("error", onError, { once: true });
  });
}

export function decode(
  def: Scene01AssetDef,
  variant: Scene01AssetVariant,
  ctx: LoadContext,
): Promise<LoadedAsset> {
  switch (def.kind) {
    case "glb":
      return loadGlb(variant, ctx);
    case "hdr":
      return loadHdr(variant, ctx);
    case "ktx2":
      return loadKtx2(variant, ctx);
    case "pbr-pack":
      return loadPbrPack(variant, ctx);
    case "audio":
    case "audio-spatial":
      return loadAudio(def, variant);
    case "video":
      return loadVideo(variant);
  }
}
