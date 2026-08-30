import type { EvidenceProvider } from './types.js';
import { env } from '../config/env.js';
import { fetchPage as fetchPageImpl } from './fetch.js';
import { searchWeb } from './search.js';

/** Assemble the evidence provider from the environment (mock | tavily | key-free fallbacks). */
export function createEvidenceProvider(): EvidenceProvider {
  const mode = env.SEARCH_MOCK ? 'mock' : env.TAVILY_API_KEY ? 'tavily+direct' : 'duckduckgo+jina';
  return {
    mode,
    search: (query, limit) => searchWeb(query, limit),
    fetchPage: (url) => fetchPageImpl(url),
  };
}
