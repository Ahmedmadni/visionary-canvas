/**
 * Global application store (Zustand).
 *
 * This is the single source of truth for cross-cutting UI + WebGL state:
 * loading progress, active scene, scroll offset, performance tier, and
 * device metadata. Scene-local ephemeral state (mesh refs, uniforms) does
 * NOT belong here — keep it inside the scene component with useRef.
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
  isTransitioning: boolean;

  // --- Scroll ---------------------------------------------------------
  scrollY: number;
  scrollProgress: number; // 0..1 across the page
  scrollVelocity: number;

  // --- Environment ----------------------------------------------------
  performanceTier: PerformanceTier;
  device: DeviceType;
  viewport: Viewport;
  reducedMotion: boolean;

  // --- Actions --------------------------------------------------------
  setReady: (ready: boolean) => void;
  setLoadingProgress: (loaded: number, total: number) => void;
  setActiveScene: (id: SceneId | null) => void;
  requestSceneTransition: (id: SceneId) => void;
  completeSceneTransition: () => void;
  setScroll: (y: number, progress: number, velocity: number) => void;
  setPerformanceTier: (tier: PerformanceTier) => void;
  setViewport: (viewport: Viewport) => void;
  setReducedMotion: (value: boolean) => void;
}

export const useAppStore = create<AppState>()(
  subscribeWithSelector((set) => ({
    isReady: false,
    loadingProgress: 0,
    loadedAssets: 0,
    totalAssets: 0,

    activeScene: null,
    nextScene: null,
    isTransitioning: false,

    scrollY: 0,
    scrollProgress: 0,
    scrollVelocity: 0,

    performanceTier: "medium",
    device: "desktop",
    viewport: { width: 0, height: 0, dpr: 1, device: "desktop" },
    reducedMotion: false,

    setReady: (ready) => set({ isReady: ready }),
    setLoadingProgress: (loaded, total) =>
      set({
        loadedAssets: loaded,
        totalAssets: total,
        loadingProgress: total > 0 ? loaded / total : 0,
      }),
    setActiveScene: (id) => set({ activeScene: id }),
    requestSceneTransition: (id) => set({ nextScene: id, isTransitioning: true }),
    completeSceneTransition: () =>
      set((s) => ({
        activeScene: s.nextScene ?? s.activeScene,
        nextScene: null,
        isTransitioning: false,
      })),
    setScroll: (scrollY, scrollProgress, scrollVelocity) =>
      set({ scrollY, scrollProgress, scrollVelocity }),
    setPerformanceTier: (performanceTier) => set({ performanceTier }),
    setViewport: (viewport) => set({ viewport, device: viewport.device }),
    setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  })),
);
