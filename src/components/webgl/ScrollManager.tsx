/**
 * Scroll manager.
 *
 * Renders no DOM of its own — mounts the Lenis smooth-scroll instance and
 * publishes scroll data into the global store. Placed once, high in the
 * client tree (see CanvasWrapper's DOM sibling).
 */

import { useLenis } from "@/hooks/useLenis";

export function ScrollManager() {
  useLenis();
  return null;
}
