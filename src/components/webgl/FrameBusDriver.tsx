/**
 * FrameBusDriver — pumps the shared frameBus from inside R3F's useFrame.
 *
 * This is the ONE call site of `frameBus.tick()`. Every scene, camera
 * animator, or audio-reactive material subscribes via
 * `frameBus.subscribe(cb, priority)` and gets called in priority order.
 * Keeps the render loop centralized and deterministic.
 */

import { useFrame } from "@react-three/fiber";

import { frameBus } from "@/lib/renderLoop";

export function FrameBusDriver() {
  useFrame((state, delta) => {
    frameBus.tick(state.clock.elapsedTime, delta);
  }, 0);
  return null;
}
