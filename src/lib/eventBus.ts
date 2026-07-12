/**
 * Typed application event bus.
 *
 * Cross-cutting communication between DOM and WebGL layers, and between
 * unrelated scene modules, MUST go through this bus rather than through
 * Zustand — Zustand is for shared state, the bus is for one-shot signals
 * (context lost, chapter changed, audio unlocked, scene entered).
 *
 * Handlers run synchronously in registration order. Emit from anywhere;
 * subscribe from `useEvent()` so React can clean up.
 */

import type { SceneId } from "@/types";

export interface AppEventMap {
  "webgl:context-lost": void;
  "webgl:context-restored": void;
  "webgl:tier-changed": { previous: string; next: string };
  "scene:enter": { id: SceneId };
  "scene:exit": { id: SceneId };
  "scene:preload-start": { id: SceneId };
  "scene:preload-complete": { id: SceneId };
  "scroll:chapter-change": { previous: string | null; next: string | null };
  "audio:unlocked": void;
  "audio:muted-change": { muted: boolean };
  "visibility:change": { visible: boolean };
}

type EventKey = keyof AppEventMap;
type Handler<K extends EventKey> = (payload: AppEventMap[K]) => void;

class EventBus {
  private handlers = new Map<EventKey, Set<Handler<EventKey>>>();

  on<K extends EventKey>(event: K, handler: Handler<K>): () => void {
    const bucket = (this.handlers.get(event) ?? new Set()) as Set<Handler<EventKey>>;
    bucket.add(handler as Handler<EventKey>);
    this.handlers.set(event, bucket);
    return () => bucket.delete(handler as Handler<EventKey>);
  }

  emit<K extends EventKey>(event: K, ...args: AppEventMap[K] extends void ? [] : [AppEventMap[K]]): void {
    const bucket = this.handlers.get(event);
    if (!bucket) return;
    const payload = (args[0] ?? undefined) as AppEventMap[K];
    for (const handler of bucket) (handler as Handler<K>)(payload);
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const eventBus = new EventBus();
