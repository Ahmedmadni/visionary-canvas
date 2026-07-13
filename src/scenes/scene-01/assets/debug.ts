/**
 * Scene 01 — asset pipeline debug logging.
 *
 * Every diagnostic in the asset layer routes through here so it can be
 * stripped in production with a single guard. `import.meta.env.DEV` is
 * statically replaced by Vite, so these calls tree-shake out of the prod
 * bundle entirely — no runtime cost, no console noise for end users.
 */

const PREFIX = "[scene-01/assets]";

function enabled(): boolean {
  return import.meta.env.DEV;
}

export const assetLog = {
  info(message: string, ...rest: unknown[]): void {
    if (enabled()) console.info(`${PREFIX} ${message}`, ...rest);
  },
  warn(message: string, ...rest: unknown[]): void {
    if (enabled()) console.warn(`${PREFIX} ${message}`, ...rest);
  },
  error(message: string, ...rest: unknown[]): void {
    if (enabled()) console.error(`${PREFIX} ${message}`, ...rest);
  },
  /** Group a load lifecycle for readability. Returns a no-op ender in prod. */
  group(label: string): () => void {
    if (!enabled()) return () => {};

    console.groupCollapsed(`${PREFIX} ${label}`);

    return () => console.groupEnd();
  },
};
