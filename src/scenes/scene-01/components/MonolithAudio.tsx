/**
 * MonolithAudio — the scene's audio bed, sourced from the asset pipeline.
 *
 *  - AMBIENCE  a non-positional drone looped through the master bus.
 *  - SIZZLE    a positional (HRTF) emitter anchored at the hero, panned by
 *              updating the Web Audio listener from the camera each frame.
 *
 * Both wait for (a) the buffer to decode and (b) audio to be unlocked by a
 * user gesture, then start; both stop + disconnect on unmount. When an
 * audio asset is absent the component is simply silent — no fallback tone,
 * no error surface. Renders nothing.
 */

import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import { Vector3, type PerspectiveCamera } from "three";

import { audioManager } from "@/audio";
import { eventBus } from "@/lib/eventBus";
import { frameBus } from "@/lib/renderLoop";
import { useAudioBuffer } from "../assets";

const AMBIENCE_VOLUME = 0.45;
const SIZZLE_VOLUME = 0.6;
const HERO_EMITTER = new Vector3(0, 0.5, 0);

/** Run `start` once audio is unlocked (now or on the next unlock event). */
function whenUnlocked(start: () => void): () => void {
  if (audioManager.isUnlocked()) {
    start();
    return () => {};
  }
  return eventBus.on("audio:unlocked", start);
}

function useAmbience() {
  const ambience = useAudioBuffer("ambience");
  const ready = !!ambience;

  useEffect(() => {
    if (!ready) return;
    let source: AudioBufferSourceNode | null = null;
    const off = whenUnlocked(() => {
      source = audioManager.play("ambience", { loop: true, volume: AMBIENCE_VOLUME });
    });
    return () => {
      off();
      try {
        source?.stop();
      } catch {
        /* already stopped */
      }
    };
  }, [ready]);
}

function useSpatialSizzle(camera: PerspectiveCamera) {
  const sizzle = useAudioBuffer("sizzle");
  const ready = !!sizzle;

  useEffect(() => {
    if (!ready) return;
    let source: AudioBufferSourceNode | null = null;
    let unsubscribeFrame: (() => void) | null = null;

    const off = whenUnlocked(() => {
      const ctx = audioManager.getContext();
      const master = audioManager.getMasterGain();
      const buffer = sizzle?.buffer;
      if (!ctx || !master || !buffer) return;

      const panner = ctx.createPanner();
      panner.panningModel = "HRTF";
      panner.distanceModel = "inverse";
      panner.refDistance = 1;
      panner.maxDistance = 24;
      panner.rolloffFactor = 1.2;
      setPannerPosition(panner, HERO_EMITTER);

      const gain = ctx.createGain();
      gain.gain.value = SIZZLE_VOLUME;

      source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.connect(panner).connect(gain).connect(master);
      source.start();

      // Drive the listener from the camera so panning tracks the fly-through.
      const pos = new Vector3();
      const fwd = new Vector3();
      const up = new Vector3();
      unsubscribeFrame = frameBus.subscribe(() => {
        camera.getWorldPosition(pos);
        camera.getWorldDirection(fwd);
        up.set(0, 1, 0).applyQuaternion(camera.quaternion);
        setListener(ctx.listener, pos, fwd, up);
      });
    });

    return () => {
      off();
      unsubscribeFrame?.();
      try {
        source?.stop();
      } catch {
        /* already stopped */
      }
    };
  }, [ready, sizzle, camera]);
}

export function MonolithAudio() {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  useAmbience();
  useSpatialSizzle(camera);
  return null;
}

// --- Web Audio compatibility shims -----------------------------------------

function setPannerPosition(panner: PannerNode, p: Vector3): void {
  if ("positionX" in panner) {
    panner.positionX.value = p.x;
    panner.positionY.value = p.y;
    panner.positionZ.value = p.z;
  } else {
    // Deprecated but needed for older Safari.
    (panner as unknown as { setPosition: (x: number, y: number, z: number) => void }).setPosition(
      p.x,
      p.y,
      p.z,
    );
  }
}

function setListener(listener: AudioListener, pos: Vector3, fwd: Vector3, up: Vector3): void {
  if ("positionX" in listener) {
    listener.positionX.value = pos.x;
    listener.positionY.value = pos.y;
    listener.positionZ.value = pos.z;
    listener.forwardX.value = fwd.x;
    listener.forwardY.value = fwd.y;
    listener.forwardZ.value = fwd.z;
    listener.upX.value = up.x;
    listener.upY.value = up.y;
    listener.upZ.value = up.z;
  } else {
    const legacy = listener as unknown as {
      setPosition: (x: number, y: number, z: number) => void;
      setOrientation: (
        fx: number,
        fy: number,
        fz: number,
        ux: number,
        uy: number,
        uz: number,
      ) => void;
    };
    legacy.setPosition(pos.x, pos.y, pos.z);
    legacy.setOrientation(fwd.x, fwd.y, fwd.z, up.x, up.y, up.z);
  }
}
