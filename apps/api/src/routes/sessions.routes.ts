import { Router } from 'express';
import { ArbitrateInputSchema, CreateSessionInputSchema } from '@synthcouncil/schemas';
import type { CouncilEngine } from '../orchestrator/engine.js';
import { subscribe } from '../orchestrator/bus.js';
import type { CouncilStore } from '../storage/types.js';
import { ApiError } from '../utils/errors.js';

export interface SessionsRouterDeps {
  store: CouncilStore;
  engine: CouncilEngine;
}

export function createSessionsRouter({ store, engine }: SessionsRouterDeps): Router {
  const router = Router();

  /** Convene the council: create a session from a topic + options. */
  router.post('/', async (req, res, next) => {
    try {
      const input = CreateSessionInputSchema.parse(req.body);
      const session = await store.createSession({
        topic: input.topic,
        context: input.context,
        config: {
          agents: input.agents,
          debateRounds: input.debateRounds ?? 2,
          requireArbitration: input.requireArbitration ?? true,
          model: input.model,
        },
      });
      res.status(201).json({ session });
    } catch (error) {
      next(error);
    }
  });

  /** Full snapshot: session header + blackboard. */
  router.get('/:id', async (req, res, next) => {
    try {
      const snapshot = await engine.snapshot(req.params.id);
      if (!snapshot) throw new ApiError(404, 'Session not found.');
      res.json(snapshot);
    } catch (error) {
      next(error);
    }
  });

  /** Start the orchestration DAG. Progress is streamed over SSE. */
  router.post('/:id/start', async (req, res, next) => {
    try {
      const sessionId = req.params.id;
      const session = await store.getSession(sessionId);
      if (!session) throw new ApiError(404, 'Session not found.');

      void engine
        .start(sessionId)
        .catch((error) => console.error(`[engine] start failed for ${sessionId}:`, error));

      res.status(202).json({
        sessionId,
        status: session.status,
        message: 'Council convened — the agents are investigating.',
      });
    } catch (error) {
      next(error);
    }
  });

  /** Human-in-the-loop: inject an arbitration directive (or proceed). */
  router.post('/:id/arbitrate', async (req, res, next) => {
    try {
      const input = ArbitrateInputSchema.parse(req.body);
      await engine.arbitrate(req.params.id, input);
      const snapshot = await engine.snapshot(req.params.id);
      res.json({ sessionId: req.params.id, status: snapshot?.session.status });
    } catch (error) {
      next(error);
    }
  });

  /** Server-Sent Events stream of council activity. */
  router.get('/:id/events', async (req, res, next) => {
    try {
      const sessionId = req.params.id;
      const session = await store.getSession(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Session not found.' });
        return;
      }

      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders();
      res.write('retry: 2000\n\n');

      const unsubscribe = subscribe(sessionId, (event) => {
        res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);
      });

      const heartbeat = setInterval(() => res.write(': ping\n\n'), 15_000);
      req.on('close', () => {
        clearInterval(heartbeat);
        unsubscribe();
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
