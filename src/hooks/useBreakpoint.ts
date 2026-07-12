/**
 * useBreakpoint — resolves the current device tier from viewport width.
 *
 * SSR-safe: returns "desktop" during server render, updates on the
 * client after mount via a matchMedia listener.
 */

import { useEffect, useState } from "react";

import { BREAKPOINTS, deviceFromWidth } from "@/lib/breakpoints";
import type { DeviceType } from "@/types";
import { isBrowser } from "@/utils/detect";

export function useBreakpoint(): DeviceType {
  const [device, setDevice] = useState<DeviceType>("desktop");

  useEffect(() => {
    if (!isBrowser) return;
    const update = () => setDevice(deviceFromWidth(window.innerWidth));
    update();
    const mqTablet = window.matchMedia(`(min-width: ${BREAKPOINTS.tablet}px)`);
    const mqDesktop = window.matchMedia(`(min-width: ${BREAKPOINTS.desktop}px)`);
    mqTablet.addEventListener("change", update);
    mqDesktop.addEventListener("change", update);
    window.addEventListener("resize", update);
    return () => {
      mqTablet.removeEventListener("change", update);
      mqDesktop.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return device;
}
