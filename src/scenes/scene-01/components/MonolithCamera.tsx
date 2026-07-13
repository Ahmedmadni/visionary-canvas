/**
 * MonolithCamera — applies the timeline's camera channels to the shared
 * perspective camera every frame, imperatively.
 *
 * The camera itself is owned by the global CameraRig (`makeDefault`,
 * `manual`). This component never creates a camera; it only writes
 * position / look-at / fov from the channel object AFTER the timeline has
 * resolved (higher frame-bus priority). No React state, no re-renders.
 */

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { PerspectiveCamera, Vector3 } from "three";

import { frameBus } from "@/lib/renderLoop";
import { SCENE_01_FRAME_PRIORITY } from "../config";
import { useScene01Runtime } from "../runtime";

const _target = new Vector3();

export function MonolithCamera() {
  const { channels } = useScene01Runtime();
  const camera = useThree((s) => s.camera);

  useEffect(() => {
    if (!(camera instanceof PerspectiveCamera)) return;
    let lastFov = camera.fov;

    const unsubscribe = frameBus.subscribe(() => {
      const ch = channels.current;
      camera.position.set(ch.px, ch.py, ch.pz);
      _target.set(ch.tx, ch.ty, ch.tz);
      camera.lookAt(_target);
      if (ch.fov !== lastFov) {
        camera.fov = ch.fov;
        camera.updateProjectionMatrix();
        lastFov = ch.fov;
      }
    }, SCENE_01_FRAME_PRIORITY.camera);

    return unsubscribe;
  }, [camera, channels]);

  return null;
}
