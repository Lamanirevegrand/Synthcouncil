import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
    PORT: z.coerce.number().default(3000),
    FRONTEND_URL: z.string().url().default('http://localhost:4321'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required for agent execution'),
    SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
    SUPABASE_SERVICE_KEY: z.string().min(1, 'SUPABASE_SERVICE_KEY is required for backend operations'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
    console.error('❌ Invalid environment variables:', parsedEnv.error.format());
    process.exit(1);
}

export const env = parsedEnv.data;