/**
 * WebGL context loss / recovery handler.
 *
 * The GPU can revoke a WebGL context at any time (tab backgrounded,
 * driver reset, low memory). Without a handler, the canvas silently goes
 * black. We suppress the default (which would prevent restoration) and
 * ask R3F to remount its render loop once the context is restored.
 */

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

export function WebGLContextRecovery() {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    const canvas = gl.domElement;

    const onLost = (e: Event) => {
      e.preventDefault();
      // eslint-disable-next-line no-console
      console.warn("[WebGL] Context lost");
    };
    const onRestored = () => {
      // eslint-disable-next-line no-console
      console.info("[WebGL] Context restored");
      invalidate();
    };

    canvas.addEventListener("webglcontextlost", onLost as EventListener);
    canvas.addEventListener("webglcontextrestored", onRestored as EventListener);

    return () => {
      canvas.removeEventListener("webglcontextlost", onLost as EventListener);
      canvas.removeEventListener("webglcontextrestored", onRestored as EventListener);
    };
  }, [gl, invalidate]);

  return null;
}
