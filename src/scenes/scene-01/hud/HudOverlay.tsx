/**
 * HudOverlay — the scene's technical/graphic overlay.
 *
 * A DOM/SVG-free layer OUTSIDE the WebGL canvas — corner brackets, a
 * crosshair, a persistent shot tag, callout leader-lines, and a small
 * glyph — styled after the approved reference video's product-viz HUD.
 * Near-zero GPU cost: this never touches Three.js, and it agrees with the
 * 3D scene about "what shot is active" via the same pure helpers the
 * in-canvas timeline uses (`useScene01HudState`).
 *
 * Content swaps per shot; `key={shotId}` on the content wrapper triggers
 * a cross-fade (`tw-animate-css`) on shot change. Reduced motion drops the
 * fade to an instant swap. Callout leader-lines are hidden below the `sm`
 * breakpoint — a deliberate re-layout, not a naive scale-down, since the
 * reference is authored for 16:9 (see docs/scene-01-reference-
 * breakdown.md, "HUD text legibility across breakpoints").
 *
 * `shots.ts` lists six shots; `content.ts` only has copy for HERO and
 * TURNAROUND. For any other active shot this renders NOTHING — not a
 * placeholder — matching the rest of the scene's "absent means absent"
 * convention. Finalizing the HUD for the other four shots is deliberately
 * out of scope for this pass.
 *
 * Anchor points are screen-space percentages, not 3D-projected — see the
 * note in `content.ts` for why, and what upgrading this would take.
 */

import { SCENE_01_HUD_CONTENT, type HudCallout } from "./content";
import { useScene01HudState } from "./useScene01HudState";

function CornerBrackets() {
  const base = "pointer-events-none absolute h-6 w-6 border-white/30";
  return (
    <>
      <div className={`${base} left-5 top-5 border-l border-t`} />
      <div className={`${base} right-5 top-5 border-r border-t`} />
      <div className={`${base} bottom-5 left-5 border-b border-l`} />
      <div className={`${base} bottom-5 right-5 border-b border-r`} />
    </>
  );
}

function Crosshair() {
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2">
      <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/20" />
      <div className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-white/20" />
    </div>
  );
}

function CalloutRow({ callout }: { callout: HudCallout }) {
  return (
    <div
      className="pointer-events-none absolute hidden -translate-y-1/2 sm:block"
      style={{ left: `${callout.x}%`, top: `${callout.y}%` }}
    >
      <div className={`flex items-center ${callout.side === "left" ? "flex-row-reverse" : ""}`}>
        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/60" />
        <div className="h-px w-8 shrink-0 bg-white/25" />
        <span className="whitespace-nowrap px-2 font-mono text-[10px] uppercase tracking-widest text-white/70">
          {callout.label}
        </span>
      </div>
    </div>
  );
}

export function HudOverlay() {
  const { active, shotId, reducedMotion } = useScene01HudState();

  const content = shotId ? SCENE_01_HUD_CONTENT[shotId] : undefined;
  if (!active || !shotId || !content) return null;

  const fadeClass = reducedMotion ? "" : "animate-in fade-in duration-700";

  return (
    <div className="pointer-events-none fixed inset-0 z-40 select-none">
      <div key={shotId} className={fadeClass}>
        <CornerBrackets />
        <Crosshair />

        {/* Persistent shot tag, top-left. */}
        <div className="pointer-events-none absolute left-12 top-6 font-mono text-[10px] uppercase tracking-widest text-white/50">
          <div>{content.tag}</div>
          <div className="mt-1 text-white/80">{content.label}</div>
          <div className="text-white/40">{content.sublabel}</div>
        </div>

        {/* Small glyph, bottom-right — echoes the reference's persistent mark. */}
        <div className="pointer-events-none absolute bottom-12 right-12 font-mono text-sm text-white/40">
          ✦
        </div>

        {content.callouts.map((c) => (
          <CalloutRow key={c.label} callout={c} />
        ))}
      </div>
    </div>
  );
}
