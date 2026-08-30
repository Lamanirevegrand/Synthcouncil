import cors from 'cors';
import express, { type Express } from 'express';
import { allowedOrigins, env } from './config/env.js';
import { createEvidenceProvider } from './evidence/provider.js';
import { createLlmClient, resolveLlmConfig } from './llm/client.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { CouncilEngine } from './orchestrator/engine.js';
import { createSessionsRouter } from './routes/sessions.routes.js';
import { createStore } from './storage/index.js';

export const buildApp = (): Express => {
  const app = express();

  // Strict CORS: only the declared frontend origins may call the API.
  app.use(
    cors({
      origin: allowedOrigins,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type'],
    })
  );

  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const store = createStore();
  const llm = createLlmClient(resolveLlmConfig());
  const evidence = createEvidenceProvider();
  const engine = new CouncilEngine({ store, llm, evidence });

  console.log(
    `[api] llm=${llm.provider}/${llm.model} storage=${store.mode} evidence=${evidence.mode} frontend=${allowedOrigins.join(', ')}`
  );

  app.use('/api/sessions', createSessionsRouter({ store, engine }));

  // The error middleware must stay last.
  app.use(errorHandler);

  return app;
};
