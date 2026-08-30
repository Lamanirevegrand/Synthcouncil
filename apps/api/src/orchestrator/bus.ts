import { EventEmitter } from 'node:events';
import type { CouncilEvent } from '@synthcouncil/schemas';

/**
 * Per-session event bus powering Server-Sent Events. Sessions are isolated:
 * publishing on one session can never leak into another.
 */
const emitters = new Map<string, EventEmitter>();

function emitterFor(sessionId: string): EventEmitter {
  let emitter = emitters.get(sessionId);
  if (!emitter) {
    emitter = new EventEmitter();
    emitters.set(sessionId, emitter);
  }
  return emitter;
}

export function publish(sessionId: string, event: CouncilEvent): void {
  emitterFor(sessionId).emit('event', event);
}

export function subscribe(sessionId: string, listener: (event: CouncilEvent) => void): () => void {
  const emitter = emitterFor(sessionId);
  emitter.on('event', listener);
  return () => {
    emitter.off('event', listener);
    if (emitter.listenerCount('event') === 0) {
      emitters.delete(sessionId);
    }
  };
}
