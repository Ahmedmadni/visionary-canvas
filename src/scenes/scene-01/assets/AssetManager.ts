/**
 * Scene 01 — asset manager (orchestration).
 *
 * The single brain of the pipeline. For each manifest entry it:
 *   1. selects the desktop/mobile variant for the device,
 *   2. validates availability + integrity (never throws into the scene),
 *   3. decodes via the matching decoder,
 *   4. caches the decoded object + flips store status → ready,
 *   5. mirrors aggregate progress into the global loading store,
 *   6. keeps polling absent assets so they HOT-LOAD when delivered.
 *
 * Missing / corrupt assets resolve to a terminal non-ready status and the
 * scene keeps its fallback — there is no throw path that can blank the
 * canvas. Everything the manager loads is disposed on `dispose()`.
 */

import type { WebGLRenderer } from "three";

import { useAppStore } from "@/store";
import { assetLog } from "./debug";
import { decode, type LoadContext, type LoadedAsset } from "./decoders";
import { getAssetDef, selectVariant, SCENE_01_MANIFEST } from "./manifest";
import { aggregateProgress, useAssetStore } from "./store";
import { validate } from "./validate";

interface ManagerOptions {
  /** Poll interval for absent assets, ms. */
  hotloadIntervalMs?: number;
  /** Max load attempts per asset before it stops being retried. */
  maxAttempts?: number;
  /** Enable the background hot-load poller. */
  hotload?: boolean;
}

const DEFAULTS: Required<ManagerOptions> = {
  hotloadIntervalMs: import.meta.env.DEV ? 4000 : 15000,
  maxAttempts: import.meta.env.DEV ? Infinity : 40,
  hotload: true,
};

class Scene01AssetManager {
  private ctx: LoadContext | null = null;
  private opts: Required<ManagerOptions> = DEFAULTS;
  private objects = new Map<string, LoadedAsset>();
  private inflight = new Set<string>();
  private attempts = new Map<string, number>();
  private aborts = new Map<string, AbortController>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private started = false;

  /** Bind the renderer + device context. Safe to call once per mount. */
  init(gl: WebGLRenderer, isMobile: boolean, options: ManagerOptions = {}): void {
    this.ctx = { gl, isMobile };
    this.opts = { ...DEFAULTS, ...options };
  }

  get<T extends LoadedAsset = LoadedAsset>(role: string): T | undefined {
    return this.objects.get(role) as T | undefined;
  }

  /** Kick off the initial load pass and (optionally) the hot-load poller. */
  start(): void {
    if (this.started || !this.ctx) return;
    this.started = true;
    assetLog.info(
      `Manager start — ${SCENE_01_MANIFEST.length} asset(s), mobile=${this.ctx.isMobile}`,
    );
    void this.loadAll();
    if (this.opts.hotload) {
      this.timer = setInterval(() => this.hotloadTick(), this.opts.hotloadIntervalMs);
    }
  }

  private async loadAll(): Promise<void> {
    await Promise.all(SCENE_01_MANIFEST.map((def) => this.loadRole(def.role)));
    this.mirrorProgress();
  }

  private eligible(role: string): boolean {
    const status = useAssetStore.getState().statuses[role];
    if (
      status === "ready" ||
      status === "loading" ||
      status === "validating" ||
      status === "probing"
    ) {
      return false;
    }
    if (this.inflight.has(role)) return false;
    return (this.attempts.get(role) ?? 0) < this.opts.maxAttempts;
  }

  private hotloadTick(): void {
    if (typeof document !== "undefined" && document.hidden) return;
    const roles = SCENE_01_MANIFEST.map((d) => d.role).filter((r) => this.eligible(r));
    if (roles.length === 0) {
      // Nothing left to retry that could still succeed — stop polling.
      if (this.allResolvedOrExhausted()) this.stopHotload();
      return;
    }
    for (const role of roles) void this.loadRole(role);
  }

  private allResolvedOrExhausted(): boolean {
    return SCENE_01_MANIFEST.every((d) => {
      const status = useAssetStore.getState().statuses[d.role];
      if (status === "ready") return true;
      return (this.attempts.get(d.role) ?? 0) >= this.opts.maxAttempts;
    });
  }

  async loadRole(role: string): Promise<void> {
    const def = getAssetDef(role);
    if (!def || !this.ctx) return;
    if (this.inflight.has(role) || useAssetStore.getState().statuses[role] === "ready") return;

    this.inflight.add(role);
    this.attempts.set(role, (this.attempts.get(role) ?? 0) + 1);
    const abort = new AbortController();
    this.aborts.set(role, abort);

    const { setStatus, bumpRevision } = useAssetStore.getState();
    const variant = selectVariant(def, this.ctx.isMobile);
    const end = assetLog.group(`load "${role}" (${variant.id})`);

    try {
      setStatus(role, "probing", { variant: variant.id });

      // Validate every underlying URL (a PBR pack has several).
      const urls =
        def.kind === "pbr-pack"
          ? Object.values(variant.maps ?? {})
          : [variant.url].filter(Boolean as unknown as (v: string | undefined) => v is string);

      let available = true;
      let invalidReason: string | undefined;
      for (const url of urls) {
        const verdict = await validate(url, variant.validation, variant.spec, abort.signal);
        verdict.warnings.forEach((w) => assetLog.warn(`${role}: ${w}`));
        if (!verdict.available) {
          available = false;
          break;
        }
        if (!verdict.ok) {
          invalidReason = verdict.reason;
          break;
        }
      }

      if (!available) {
        setStatus(role, "unavailable");
        assetLog.info(`${role}: not present yet — using fallback`);
        return;
      }
      if (invalidReason) {
        setStatus(role, "invalid", { error: invalidReason });
        assetLog.warn(`${role}: invalid — ${invalidReason}`);
        return;
      }

      setStatus(role, "loading");
      const loaded = await decode(def, variant, this.ctx);
      if (abort.signal.aborted) {
        loaded.dispose();
        return;
      }

      this.objects.get(role)?.dispose(); // replace any prior instance cleanly
      this.objects.set(role, loaded);
      setStatus(role, "ready");
      bumpRevision();
      assetLog.info(`${role}: ready`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setStatus(role, "error", { error: message });
      assetLog.error(`${role}: decode failed — ${message}`);
    } finally {
      this.inflight.delete(role);
      this.aborts.delete(role);
      this.mirrorProgress();
      end();
    }
  }

  /** Push aggregate progress into the global loading store. */
  private mirrorProgress(): void {
    const state = useAssetStore.getState();
    const { loaded, total } = aggregateProgress(state);
    useAppStore.getState().setLoadingProgress(loaded, total);
    if (state.allSettled) useAppStore.getState().setReady(true);
  }

  private stopHotload(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      assetLog.info("Hot-load poller stopped");
    }
  }

  /** Full teardown — called on scene unmount. Releases all GPU/CPU memory. */
  dispose(): void {
    this.stopHotload();
    this.aborts.forEach((a) => a.abort());
    this.aborts.clear();
    this.inflight.clear();
    this.attempts.clear();
    this.objects.forEach((asset) => asset.dispose());
    this.objects.clear();
    this.started = false;
    this.ctx = null;
    useAssetStore.getState().reset();
    assetLog.info("Manager disposed");
  }
}

export const assetManager = new Scene01AssetManager();
