/**
 * WebGL context loss / recovery handler.
 *
 * The GPU can revoke a WebGL context at any time (tab backgrounded,
 * driver reset, low memory on mobile). Without a handler, the canvas
 * silently goes black. We suppress the default (which would prevent
 * restoration), invalidate R3F's frame loop on restore, and emit both
 * events on the app bus so scenes / audio / UI can react.
 */

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";

import { eventBus } from "@/lib/eventBus";

export function WebGLContextRecovery() {
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);

  useEffect(() => {
    const canvas = gl.domElement;

    const onLost = (e: Event) => {
      e.preventDefault();
      // eslint-disable-next-line no-console
      console.warn("[WebGL] Context lost");
      eventBus.emit("webgl:context-lost");
    };
    const onRestored = () => {
      // eslint-disable-next-line no-console
      console.info("[WebGL] Context restored");
      eventBus.emit("webgl:context-restored");
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
