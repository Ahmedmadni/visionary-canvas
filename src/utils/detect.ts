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

export function isIOS(): boolean {
  if (!isBrowser) return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (ua.includes("Mac") && "ontouchend" in document);
}

/**
 * Coarse hardware tier detection. Deliberately conservative — used to
 * gate postprocessing passes, shadow map size, and pixel ratio. iOS is
 * downgraded one tier because Safari's WebGL implementation aggressively
 * throttles thermally.
 */
export function detectHardwareTier(): "low" | "medium" | "high" {
  if (!isBrowser) return "medium";
  const cores = navigator.hardwareConcurrency ?? 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;

  let tier: "low" | "medium" | "high";
  if (cores <= 4 || memory <= 2) tier = "low";
  else if (cores <= 8 || memory <= 4) tier = "medium";
  else tier = "high";

  if (isIOS() && tier === "high") tier = "medium";
  return tier;
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
