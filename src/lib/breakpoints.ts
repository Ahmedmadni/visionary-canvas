/**
 * Single source of truth for responsive breakpoints across the app.
 *
 * Mirror these values in Tailwind theme extensions if custom breakpoint
 * utilities are ever needed — do NOT hardcode pixel widths elsewhere.
 */

import type { DeviceType } from "@/types";

export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const;

export function deviceFromWidth(width: number): DeviceType {
  if (width >= BREAKPOINTS.desktop) return "desktop";
  if (width >= BREAKPOINTS.tablet) return "tablet";
  return "mobile";
}
