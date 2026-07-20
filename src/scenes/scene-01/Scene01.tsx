/**
 * Scene 01 — "The Monolith" — scene root.
 *
 * The default export SceneManager lazy-loads and mounts inside its
 * disposable `<group>`. This component wires the subsystems together
 * under the shared runtime and owns the per-frame drivers:
 *
 *   Scene01Provider           shared channels + budget + keyframes
 *     ├─ AssetSystem          production asset pipeline (load/validate/hot-load)
 *     ├─ useScene01Timeline   scroll → GSAP → channels        (frame prio 10)
 *     ├─ MonolithCamera       channels → camera + pose        (frame prio 20)
 *     ├─ MonolithLighting     channels → studio light rig     (frame prio 20)
 *     ├─ MonolithEnvironment  clean background / floor / IBL (asset-driven)
 *     ├─ HeroMonolith         hero model (asset-driven), pose-driven
 *     ├─ MonolithAudio        ambient + spatial audio (asset-driven)
 *     └─ MonolithEffects      bloom / DOF / vignette
 *
 * `DustField` (atmospheric particles) is intentionally NOT mounted here —
 * the approved reference video's air is clean. The system stays in the
 * codebase, self-contained, for a later moodier scene.
 *
 * `shots.ts`/`cameras.ts`/`timeline.ts` scaffold all SIX reference shots
 * (hero, turnaround, two macros, exploded, material board), but only hero
 * and turnaround have a built visual treatment (hero model pose, HUD
 * copy). The other four already drive the shared studio-lighting/DOF
 * channels every component here already consumes — no new component is
 * mounted for them yet. See docs/scene-01-reference-breakdown.md.
 *
 * Nothing here holds animation in React state — every moving value flows
 * through the channel object and the frame bus, so the scene re-renders
 * only on structural change (tier / breakpoint / asset arrival).
 */

import { AssetSystem } from "./components/AssetSystem";
import { HeroMonolith } from "./components/HeroMonolith";
import { MonolithAudio } from "./components/MonolithAudio";
import { MonolithCamera } from "./components/MonolithCamera";
import { MonolithEffects } from "./components/MonolithEffects";
import { MonolithEnvironment } from "./components/MonolithEnvironment";
import { MonolithLighting } from "./components/MonolithLighting";
import { useScene01Timeline } from "./hooks/useScene01Timeline";
import { Scene01Provider } from "./runtime";

function Scene01Content() {
  // Per-frame scroll scrub. Self-cleans on unmount.
  useScene01Timeline();

  return (
    <>
      <AssetSystem />
      <MonolithCamera />
      <MonolithLighting />
      <MonolithEnvironment />
      <HeroMonolith />
      <MonolithAudio />
      <MonolithEffects />
    </>
  );
}

export default function Scene01() {
  return (
    <Scene01Provider>
      <Scene01Content />
    </Scene01Provider>
  );
}
