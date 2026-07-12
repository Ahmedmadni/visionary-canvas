/**
 * SSR-safe environment detection helpers.
 *
 * Every function must be safe to call on the server (returns a conservative
 * default) so shared modules don't crash during the TanStack Start SSR pass.
 */

export const isBrowser = typeof window !== "undefined";

export function prefersReducedMotion(): boolean {
  if (!isBrowser) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function isTouchDevice(): boolean {
  if (!isBrowser) return false;
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}

/**
 * Coarse hardware tier detection. Deliberately conservative — used to gate
 * postprocessing passes, shadow maps, and pixel ratio.
 */
export function detectHardwareTier(): "low" | "medium" | "high" {
  if (!isBrowser) return "medium";
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;

  if (cores <= 4 || memory <= 2) return "low";
  if (cores <= 8 || memory <= 4) return "medium";
  return "high";
}

export function supportsWebGL2(): boolean {
  if (!isBrowser) return false;
  try {
    const canvas = document.createElement("canvas");
    return !!canvas.getContext("webgl2");
  } catch {
    return false;
  }
}
