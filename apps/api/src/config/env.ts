import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Strict environment contract. Secrets are optional at boot: the LLM client
 * and the store fall back to mock / memory modes when no key is configured,
 * so the whole pipeline can be exercised locally without any external API.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),

  /** Comma-separated list of allowed CORS origins. */
  FRONTEND_URL: z.string().default('http://localhost:4321'),

  // --- LLM provider -------------------------------------------------------
  // Priority: LLM_PROVIDER > LLM_MOCK > OPENROUTER_API_KEY > GROQ_API_KEY > (mock in dev)
  LLM_PROVIDER: z.enum(['openrouter', 'groq', 'custom', 'mock']).optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  CUSTOM_LLM_BASE_URL: z.string().url().optional(),
  LLM_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().optional(),
  LLM_MOCK: z.coerce.boolean().default(false),
  LLM_TIMEOUT_MS: z.coerce.number().int().positive().default(90_000),
  SITE_URL: z.string().url().optional(),

  // --- Evidence / search --------------------------------------------------
  TAVILY_API_KEY: z.string().optional(),
  SEARCH_MOCK: z.coerce.boolean().default(false),
  SEARCH_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  FETCH_TIMEOUT_MS: z.coerce.number().int().positive().default(12_000),

  // --- Storage ------------------------------------------------------------
  STORAGE: z.enum(['auto', 'memory', 'supabase']).default('auto'),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('[env] Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const allowedOrigins = env.FRONTEND_URL.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
