import { z } from 'zod';
import dotenv from 'dotenv';

// Charge le .env local (ignoré en prod sur Render)
dotenv.config();

const envSchema = z.object({
    PORT: z.coerce.number().default(3000),
    FRONTEND_URL: z.string().url().default('http://localhost:4321'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error('❌ Invalid environment variables:', parsedEnv.error.format());
    process.exit(1); // On crash net, on ne démarre pas une app corrompue
}

export const env = parsedEnv.data;