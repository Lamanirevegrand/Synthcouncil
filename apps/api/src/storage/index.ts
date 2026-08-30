import { env } from '../config/env.js';
import { createMemoryStore } from './memory.js';
import { createSupabaseStore } from './supabase.js';
import type { CouncilStore } from './types.js';

/** Resolve the store from the environment; falls back to memory with a warning. */
export function createStore(): CouncilStore {
  const hasSupabase = Boolean(env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY);
  const mode = env.STORAGE === 'supabase' || (env.STORAGE === 'auto' && hasSupabase) ? 'supabase' : 'memory';

  if (mode === 'supabase' && env.SUPABASE_URL && env.SUPABASE_SERVICE_KEY) {
    return createSupabaseStore(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY);
  }

  if (env.STORAGE === 'supabase') {
    throw new Error('STORAGE=supabase requires SUPABASE_URL and SUPABASE_SERVICE_KEY.');
  }

  console.warn('[storage] No Supabase credentials — using in-memory storage. Sessions do not survive a restart.');
  return createMemoryStore();
}
