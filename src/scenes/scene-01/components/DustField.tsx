/**
 * DustField — the atmospheric dust particle system.
 *
 * A single `THREE.Points` cloud with a bespoke shader: per-particle seed
 * + scale attributes, size-attenuated soft round points, additive
 * blending, and a slow parametric drift computed on the GPU (no CPU
 * per-particle work).
 *
 * NOT currently mounted by Scene01 — the approved reference video's air
 * is clean (no floating dust), so this system is retired from "The
 * Monolith" for now. Kept self-contained (an `opacity` prop instead of a
 * dependency on Scene01Channels) so a later, moodier scene can reuse it
 * directly. See docs/scene-01-reference-breakdown.md.
 *
 * Count scales with the performance budget; the whole system is skipped
 * when the budget allots zero particles. Geometry + material are built
 * once and explicitly disposed on unmount (they live off the auto-
 * disposed scene graph path just enough to warrant belt-and-braces).
 */

import { useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Points,
  ShaderMaterial,
} from "three";

import { frameBus } from "@/lib/renderLoop";
import { clampDpr } from "@/lib/performance";
import { SCENE_01_FRAME_PRIORITY } from "../config";
import { useScene01Runtime } from "../runtime";

// Volume the motes occupy — a tall column hugging the hero.
const RADIUS = 2.6;
const HEIGHT = 4.2;
const Y_BASE = -0.2;

const VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  attribute float aScale;
  attribute float aSeed;
  varying float vFade;

  void main() {
    vec3 p = position;
    float t = uTime * 0.06 + aSeed * 6.2831853;
    // Slow parametric drift so the field breathes without reshuffling.
    p.x += sin(t) * 0.18;
    p.y += sin(t * 0.7) * 0.12;
    p.z += cos(t * 0.9) * 0.18;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * aScale * uPixelRatio * (1.0 / max(-mv.z, 0.001));
    vFade = aScale;
  }
`;

const FRAGMENT = /* glsl */ `
  uniform float uOpacity;
  uniform vec3 uColor;
  varying float vFade;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.0, d);
    float alpha = soft * uOpacity * (0.35 + 0.65 * vFade);
    gl_FragColor = vec4(uColor, alpha);
  }
`;

function buildDustGeometry(count: number): BufferGeometry {
  const positions = new Float32Array(count * 3);
  const scales = new Float32Array(count);
  const seeds = new Float32Array(count);

  for (let i = 0; i < count; i += 1) {
    // Denser toward the base, sparse up top — sqrt biases the radius in.
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * RADIUS;
    positions[i * 3 + 0] = Math.cos(angle) * r;
    positions[i * 3 + 1] = Y_BASE + Math.pow(Math.random(), 1.6) * HEIGHT;
    positions[i * 3 + 2] = Math.sin(angle) * r;
    scales[i] = 0.4 + Math.random() * 0.6;
    seeds[i] = Math.random();
  }

  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("aScale", new BufferAttribute(scales, 1));
  geometry.setAttribute("aSeed", new BufferAttribute(seeds, 1));
  return geometry;
}

export interface DustFieldProps {
  /** Target opacity, 0..1. Defaults to fully visible. */
  opacity?: number;
}

export function DustField({ opacity = 1 }: DustFieldProps) {
  const { budget, tier } = useScene01Runtime();
  const gl = useThree((s) => s.gl);
  const pointsRef = useRef<Points>(null);
  const opacityRef = useRef(opacity);
  opacityRef.current = opacity;

  const count = budget.dustCount;

  const { geometry, material } = useMemo(() => {
    const geo = buildDustGeometry(count);
    const mat = new ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: 26 },
        uPixelRatio: { value: 1 },
        uOpacity: { value: 0 },
        uColor: { value: new Color(0.68, 0.86, 1.0) }, // faint cyan-white
      },
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    return { geometry: geo, material: mat };
  }, [count]);

  // Keep point size crisp under the tier-clamped device pixel ratio.
  useEffect(() => {
    material.uniforms.uPixelRatio.value = clampDpr(gl.getPixelRatio(), tier);
  }, [material, gl, tier]);

  useEffect(() => {
    const unsubscribe = frameBus.subscribe(({ time }) => {
      material.uniforms.uTime.value = time;
      material.uniforms.uOpacity.value = opacityRef.current;
    }, SCENE_01_FRAME_PRIORITY.particles);
    return unsubscribe;
  }, [material]);

  // Off-graph resources: dispose explicitly on unmount.
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  if (count <= 0) return null;

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />;
}
