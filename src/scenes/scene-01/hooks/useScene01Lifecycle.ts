/**
 * useScene01Lifecycle — non-visual enter/exit concerns for the scene:
 * the ambient drone and dev diagnostics.
 *
 * SceneManager already emits `scene:enter` / `scene:exit` on the bus and
 * deep-disposes the scene graph on unmount; this hook covers what lives
 * OUTSIDE the graph — the audio bed. It starts the loop once audio is
 * unlocked and the stem is present, and stops it on unmount. Everything
 * degrades silently when the audio asset isn't committed yet.
 */

import { useEffect } from "react";

import { audioManager } from "@/audio";
import { eventBus } from "@/lib/eventBus";
import { getScene01Asset, isScene01AssetReady } from "../assets";

const AMBIENCE_VOLUME = 0.45;

export function useScene01Lifecycle(): void {
  useEffect(() => {
    if (!isScene01AssetReady("ambience")) return;

    const asset = getScene01Asset("ambience");
    const key = asset.key ?? asset.url;
    let source: AudioBufferSourceNode | null = null;
    let started = false;
    let cancelled = false;

    const start = async () => {
      if (started || cancelled || !audioManager.isUnlocked()) return;
      started = true;
      try {
        await audioManager.load(key, asset.url);
        if (cancelled) return;
        source = audioManager.play(key, { loop: true, volume: AMBIENCE_VOLUME });
      } catch {
        started = false; // allow a later retry on unlock
      }
    };

    let off: (() => void) | undefined;
    if (audioManager.isUnlocked()) {
      void start();
    } else {
      off = eventBus.on("audio:unlocked", () => void start());
    }

    return () => {
      cancelled = true;
      off?.();
      try {
        source?.stop();
      } catch {
        /* already stopped */
      }
      source = null;
    };
  }, []);
}
