import { configureGenkit } from '@genkit-ai/core';
import { googleAI } from '@genkit-ai/googleai';
import { env } from './env.js';

configureGenkit({
    plugins: [
        googleAI({
            apiKey: env.GEMINI_API_KEY,
        }),
    ],
    logLevel: env.NODE_ENV === 'development' ? 'debug' : 'info',
    enableTracingAndMetrics: true,
});