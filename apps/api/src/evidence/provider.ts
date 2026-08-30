import { env } from '../config/env.js';
import { fetchPage as fetchPageImpl } from './fetch.js';
import { mockSearch, searchWeb } from './search.js';
import type { EvidenceProvider, FetchedPage } from './types.js';

/**
 * Assemble the evidence provider from the environment.
 * Mock mode is fully offline: synthetic search results AND synthetic pages,
 * so the whole council pipeline can run in a sandbox or during a demo.
 */
export function createEvidenceProvider(): EvidenceProvider {
  if (env.SEARCH_MOCK) {
    return {
      mode: 'mock',
      search: async (query, limit) => mockSearch(query).slice(0, limit),
      fetchPage: async (url: string): Promise<FetchedPage> => ({
        url,
        title: `[mock] ${url}`,
        content: `[mock] Synthetic page content for ${url}. This is representative evidence produced offline so the council pipeline can be demonstrated without live web access.`,
      }),
    };
  }

  const mode = env.TAVILY_API_KEY ? 'tavily+direct' : 'duckduckgo+jina';
  return {
    mode,
    search: (query, limit) => searchWeb(query, limit),
    fetchPage: (url) => fetchPageImpl(url),
  };
}
