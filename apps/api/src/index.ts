import { buildApp } from './app.js';
import { env } from './config/env.js';

const app = buildApp();

const server = app.listen(env.PORT, () => {
  console.log(`[api] SynthCouncil engine listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});

const shutdown = (signal: string) => {
  console.log(`\n[api] Received ${signal}, shutting down gracefully`);
  server.close(() => {
    console.log('[api] Closed all remaining connections');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
