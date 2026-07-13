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
 *     ├─ MonolithCamera       channels → camera               (frame prio 20)
 *     ├─ MonolithLighting     channels → light intensities    (frame prio 20)
 *     ├─ MonolithEnvironment  fog / floor / IBL (asset-driven)
 *     ├─ HeroMonolith         hero model (asset-driven) + rise
 *     ├─ DustField            atmospheric particles           (frame prio 30)
 *     ├─ MonolithAudio        ambient + spatial audio (asset-driven)
 *     └─ MonolithEffects      bloom / vignette / grain
 *
 * Nothing here holds animation in React state — every moving value flows
 * through the channel object and the frame bus, so the scene re-renders
 * only on structural change (tier / breakpoint / asset arrival).
 */

import { AssetSystem } from "./components/AssetSystem";
import { DustField } from "./components/DustField";
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
      <DustField />
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
