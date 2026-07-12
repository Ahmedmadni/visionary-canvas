/**
 * Global application store (Zustand).
 *
 * Single source of truth for cross-cutting UI + WebGL state: loading
 * progress, active scene, scroll offset, chapter, performance tier,
 * device metadata, tab visibility, audio state. Scene-local ephemeral
 * state (mesh refs, uniforms) does NOT belong here — keep it inside
 * the scene component with useRef.
 */

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import type { DeviceType, PerformanceTier, SceneId, Viewport } from "@/types";

interface AppState {
  // --- Boot / loading -------------------------------------------------
  isReady: boolean;
  loadingProgress: number; // 0..1
  loadedAssets: number;
  totalAssets: number;

  // --- Scene ----------------------------------------------------------
  activeScene: SceneId | null;
  nextScene: SceneId | null;
  previousScene: SceneId | null;
  isTransitioning: boolean;

  // --- Scroll / chapter ----------------------------------------------
  scrollY: number;
  scrollProgress: number; // 0..1 across the page
  scrollVelocity: number;
  currentChapter: string | null;

  // --- Environment ----------------------------------------------------
  performanceTier: PerformanceTier;
  device: DeviceType;
  viewport: Viewport;
  reducedMotion: boolean;
  isPaused: boolean; // tab hidden

  // --- Audio ----------------------------------------------------------
  audioUnlocked: boolean;
  audioMuted: boolean;

  // --- Actions --------------------------------------------------------
  setReady: (ready: boolean) => void;
  setLoadingProgress: (loaded: number, total: number) => void;
  setActiveScene: (id: SceneId | null) => void;
  requestSceneTransition: (id: SceneId) => void;
  completeSceneTransition: () => void;
  setScroll: (y: number, progress: number, velocity: number) => void;
  setCurrentChapter: (id: string | null) => void;
  setPerformanceTier: (tier: PerformanceTier) => void;
  setViewport: (viewport: Viewport) => void;
  setReducedMotion: (value: boolean) => void;
  setPaused: (paused: boolean) => void;
  setAudioUnlocked: (unlocked: boolean) => void;
  setAudioMuted: (muted: boolean) => void;
}

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set) => ({
    isReady: false,
    loadingProgress: 0,
    loadedAssets: 0,
    totalAssets: 0,

    activeScene: null,
    nextScene: null,
    previousScene: null,
    isTransitioning: false,

    scrollY: 0,
    scrollProgress: 0,
    scrollVelocity: 0,
    currentChapter: null,

    performanceTier: "medium",
    device: "desktop",
    viewport: { width: 0, height: 0, dpr: 1, device: "desktop" },
    reducedMotion: false,
    isPaused: false,

    audioUnlocked: false,
    audioMuted: false,

    setReady: (ready) => set({ isReady: ready }),
    setLoadingProgress: (loaded, total) =>
      set({
        loadedAssets: loaded,
        totalAssets: total,
        loadingProgress: total > 0 ? loaded / total : 0,
      }),
    setActiveScene: (id) =>
      set((s) => ({
        previousScene: s.activeScene,
        activeScene: id,
      })),
    requestSceneTransition: (id) => set({ nextScene: id, isTransitioning: true }),
    completeSceneTransition: () =>
      set((s) => ({
        previousScene: s.activeScene,
        activeScene: s.nextScene ?? s.activeScene,
        nextScene: null,
        isTransitioning: false,
      })),
    setScroll: (scrollY, scrollProgress, scrollVelocity) =>
      set({ scrollY, scrollProgress, scrollVelocity }),
    setCurrentChapter: (currentChapter) => set({ currentChapter }),
    setPerformanceTier: (performanceTier) => set({ performanceTier }),
    setViewport: (viewport) => set({ viewport, device: viewport.device }),
    setReducedMotion: (reducedMotion) => set({ reducedMotion }),
    setPaused: (isPaused) => set({ isPaused }),
    setAudioUnlocked: (audioUnlocked) => set({ audioUnlocked }),
    setAudioMuted: (audioMuted) => set({ audioMuted }),
  })),
);
