/**
 * AssetSystem — mounts the asset pipeline into the live scene.
 *
 * Binds the manager to the active WebGL renderer + device profile, starts
 * the initial load pass and the hot-load poller, and tears everything
 * down (disposing all GPU/CPU asset memory) on unmount. Renders nothing.
 *
 * Mounted FIRST inside Scene01 so decoders have a renderer before any
 * consumer asks for an asset. A device-tier flip (desktop↔mobile) re-runs
 * the effect, which reloads the correct variants.
 */

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

import { assetManager } from "../assets/AssetManager";
import { useScene01Runtime } from "../runtime";

export function AssetSystem() {
  const { isMobile } = useScene01Runtime();
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    assetManager.init(gl, isMobile);
    assetManager.start();
    return () => assetManager.dispose();
  }, [gl, isMobile]);

  return null;
}
