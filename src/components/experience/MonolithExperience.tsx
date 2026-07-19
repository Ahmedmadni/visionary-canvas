/**
 * MonolithExperience — the app-level composition for the current build.
 *
 * This is the HOST that decides where scenes live on the page and wires
 * the global layers together:
 *   - <ScrollManager/>  — the single Lenis instance (publishes scroll).
 *   - <CanvasWrapper/>  — the client-only WebGL layer (fixed, full-bleed).
 *   - <HudOverlay/>     — the scene's DOM/CSS technical overlay (no GPU cost).
 *   - <LoadingScreen/>  — fades out on `isReady`.
 *   - a tall scroll region that gives the reveal room to breathe.
 *
 * While "The Monolith" is the only shipped scene it owns the entire
 * scroll (`setScene01ScrollRange(0, 1)`). When Scene 02 arrives this shell
 * grows a proper chapter map and each scene gets its own slice — the
 * scenes themselves don't change.
 */

import { useEffect } from "react";

import { LoadingScreen } from "@/components/dom/LoadingScreen";
import { CanvasWrapper } from "@/components/webgl/CanvasWrapper";
import { ScrollManager } from "@/components/webgl/ScrollManager";
import { eventBus } from "@/lib/eventBus";
import { useAppStore } from "@/store";
import { SCENE_01_ID, setScene01ScrollRange } from "@/scenes/scene-01/config";
import { HudOverlay } from "@/scenes/scene-01/hud/HudOverlay";

// Scroll distance allotted to the reveal. Longer = slower, weightier scrub.
const SCENE_01_SCROLL_VH = 320;

function useMonolithBoot() {
  const setActiveScene = useAppStore((s) => s.setActiveScene);
  const setReady = useAppStore((s) => s.setReady);

  useEffect(() => {
    // Standalone: the whole page drives this one scene.
    setScene01ScrollRange(0, 1);
    setActiveScene(SCENE_01_ID);

    const off = eventBus.on("scene:preload-complete", ({ id }) => {
      if (id === SCENE_01_ID) setReady(true);
    });
    // Safety floor so the loader never sticks if the event is missed.
    const fallback = window.setTimeout(() => setReady(true), 2500);

    return () => {
      off();
      window.clearTimeout(fallback);
      setActiveScene(null);
    };
  }, [setActiveScene, setReady]);
}

export function MonolithExperience() {
  useMonolithBoot();

  return (
    <div className="relative w-full" style={{ backgroundColor: "#06070a" }}>
      <ScrollManager />
      <CanvasWrapper />
      <HudOverlay />
      <LoadingScreen />

      {/* Accessible label for the experience (the visual title belongs to
          the design layer / a later pass). */}
      <h1 className="sr-only">The Monolith — a single luxury shawarma</h1>

      {/* Scroll runway. The fixed canvas renders behind this; the height
          is what gives Lenis a scroll range to map onto the timeline. */}
      <div style={{ height: `${SCENE_01_SCROLL_VH}vh` }} aria-hidden="true" />
    </div>
  );
}
