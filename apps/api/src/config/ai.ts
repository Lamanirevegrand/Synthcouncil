import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';
import { env } from './env.js';

// Initialisation de l'instance Genkit (Standard 0.9+)
export const ai = genkit({
    plugins: [
        googleAI({ apiKey: env.GEMINI_API_KEY }),
    ],
});