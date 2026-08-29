import { buildApp } from './app.js';
import { env } from './config/env.js';

const app = buildApp();

const server = app.listen(env.PORT, () => {
    console.log(`[API] Server is running on port ${env.PORT} in ${env.NODE_ENV} mode`);
});

const shutdown = () => {
    console.log('\n[API] Received kill signal, shutting down gracefully');
    server.close(() => {
        console.log('[API] Closed out remaining connections');
        process.exit(0);
    });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);