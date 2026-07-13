/**
 * Scene 01 — "The Monolith" — scene root.
 *
 * The default export SceneManager lazy-loads and mounts inside its
 * disposable `<group>`. This component wires the subsystems together
 * under the shared runtime and owns the per-frame drivers:
 *
 *   Scene01Provider           shared channels + budget + keyframes
 *     ├─ useScene01Timeline   scroll → GSAP → channels        (frame prio 10)
 *     ├─ useScene01Lifecycle  ambient audio bed
 *     ├─ MonolithCamera       channels → camera               (frame prio 20)
 *     ├─ MonolithLighting     channels → light intensities    (frame prio 20)
 *     ├─ MonolithEnvironment  fog / floor / IBL
 *     ├─ HeroMonolith         hero model (graceful) + rise
 *     ├─ DustField            atmospheric particles           (frame prio 30)
 *     └─ MonolithEffects      bloom / vignette / grain
 *
 * Nothing here holds animation in React state — every moving value flows
 * through the channel object and the frame bus, so the scene re-renders
 * only on structural change (tier / breakpoint), never per frame.
 */

import { DustField } from "./components/DustField";
import { HeroMonolith } from "./components/HeroMonolith";
import { MonolithCamera } from "./components/MonolithCamera";
import { MonolithEffects } from "./components/MonolithEffects";
import { MonolithEnvironment } from "./components/MonolithEnvironment";
import { MonolithLighting } from "./components/MonolithLighting";
import { useScene01Lifecycle } from "./hooks/useScene01Lifecycle";
import { useScene01Timeline } from "./hooks/useScene01Timeline";
import { Scene01Provider } from "./runtime";

function Scene01Content() {
  // Per-frame drivers (scroll scrub + audio bed). Both self-clean.
  useScene01Timeline();
  useScene01Lifecycle();

  return (
    <>
      <MonolithCamera />
      <MonolithLighting />
      <MonolithEnvironment />
      <HeroMonolith />
      <DustField />
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
