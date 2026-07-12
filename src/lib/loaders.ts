/**
 * Compressed-asset loader configuration.
 *
 * Configures singleton DRACO / KTX2 / Meshopt decoders so scenes can ship
 * compressed GLTF and KTX2 textures without paying the decode-cost of
 * uncompressed assets. Decoder binaries are loaded from Google's public
 * CDN (DRACO) and jsdelivr (Basis) — well-cached across origins.
 *
 * Usage inside a scene:
 *   const gltf = useLoader(GLTFLoader, url, (loader) => {
 *     loader.setDRACOLoader(getDracoLoader());
 *     loader.setKTX2Loader(getKTX2Loader(gl));
 *     loader.setMeshoptDecoder(MeshoptDecoder);
 *   });
 *
 * Or with drei: `useGLTF(url, true, true)` (drei wires DRACO/Meshopt).
 *
 * These loaders MUST NOT be imported from SSR-reachable code — three.js
 * loader modules touch browser globals. Only import inside `webgl/`
 * components, which are already gated behind CanvasWrapper's ClientOnly.
 */

import type { WebGLRenderer } from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

const DRACO_DECODER_PATH = "https://www.gstatic.com/draco/versioned/decoders/1.5.7/";
const BASIS_TRANSCODER_PATH = "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/libs/basis/";

let dracoLoader: DRACOLoader | null = null;
let ktx2Loader: KTX2Loader | null = null;

export function getDracoLoader(): DRACOLoader {
  if (!dracoLoader) {
    dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(DRACO_DECODER_PATH);
    dracoLoader.setDecoderConfig({ type: "js" });
  }
  return dracoLoader;
}

export function getKTX2Loader(renderer: WebGLRenderer): KTX2Loader {
  if (!ktx2Loader) {
    ktx2Loader = new KTX2Loader();
    ktx2Loader.setTranscoderPath(BASIS_TRANSCODER_PATH);
  }
  // detectSupport must be called with the ACTIVE renderer; safe to re-call.
  ktx2Loader.detectSupport(renderer);
  return ktx2Loader;
}

export { MeshoptDecoder };

/**
 * Called on full teardown (page unload / HMR). Never call between scene
 * switches — the loaders are shared across scenes by design.
 */
export function disposeLoaders(): void {
  dracoLoader?.dispose();
  ktx2Loader?.dispose();
  dracoLoader = null;
  ktx2Loader = null;
}
