import { env } from '../config/env.js';
import { withTimeout } from '../utils/timeout.js';
import { decodeEntities } from './html.js';
import { EvidenceError, type SearchResult } from './types.js';

const USER_AGENT =
  'Mozilla/5.0 (compatible; SynthCouncil/1.0; +https://github.com/synthcouncil/synthcouncil)';

const TIMEOUTS = { search: env.SEARCH_TIMEOUT_MS, fetch: env.FETCH_TIMEOUT_MS };

/**
 * Web search. Preferred provider is Tavily (structured JSON, generous free
 * tier); the fallback scrapes DuckDuckGo Lite (no key required); mock mode
 * returns synthetic results for offline demos/tests.
 */
export async function searchWeb(query: string, limit = 5): Promise<SearchResult[]> {
  if (env.SEARCH_MOCK || !env.TAVILY_API_KEY) {
    if (env.SEARCH_MOCK) return mockSearch(query);
    return duckDuckGoSearch(query, limit);
  }
  return tavilySearch(query, limit);
}

async function tavilySearch(query: string, limit: number): Promise<SearchResult[]> {
  const response = await withTimeout(
    fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: env.TAVILY_API_KEY,
        query,
        max_results: limit,
        search_depth: 'basic',
      }),
    }),
    TIMEOUTS.search,
    'Tavily search'
  );

  if (!response.ok) {
    throw new EvidenceError(`Tavily search failed (${response.status})`, 'tavily');
  }

  const payload = (await response.json()) as {
    results?: Array<{ title?: string; url?: string; content?: string }>;
  };

  return (payload.results ?? [])
    .filter((result) => typeof result.url === 'string' && result.url.startsWith('http'))
    .slice(0, limit)
    .map((result) => ({
      title: result.title ?? result.url!,
      url: result.url!,
      snippet: (result.content ?? '').slice(0, 400),
    }));
}

/**
 * DuckDuckGo Lite scraping fallback — key-free, works well enough for an MVP
 * evidence pipeline. If it ever gets blocked, the agent still proceeds with
 * the evidence it already has (the engine degrades gracefully).
 */
async function duckDuckGoSearch(query: string, limit: number): Promise<SearchResult[]> {
  const url = `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`;
  const response = await withTimeout(
    fetch(url, { headers: { 'User-Agent': USER_AGENT } }),
    TIMEOUTS.search,
    'DuckDuckGo search'
  );

  if (!response.ok) {
    throw new EvidenceError(`DuckDuckGo search failed (${response.status})`, 'duckduckgo');
  }

  const html = await response.text();
  const results: SearchResult[] = [];

  const linkRe = /<a[^>]+rel="nofollow"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  const snippetRe = /<td class="result-snippet">([\s\S]*?)<\/td>/gi;
  const links: Array<{ url: string; title: string }> = [];
  let match: RegExpExecArray | null;

  while ((match = linkRe.exec(html)) !== null) {
    const url = match[1];
    if (!/^https?:\/\//i.test(url)) continue;
    links.push({ url, title: decodeEntities(match[2].replace(/<[^>]+>/g, '').trim()) });
  }

  const snippets: string[] = [];
  while ((match = snippetRe.exec(html)) !== null) {
    snippets.push(decodeEntities(match[1].replace(/<[^>]+>/g, '').trim()));
  }

  for (let i = 0; i < links.length && results.length < limit; i += 1) {
    results.push({
      title: links[i].title || links[i].url,
      url: links[i].url,
      snippet: snippets[i] ?? '',
    });
  }

  if (results.length === 0) {
    throw new EvidenceError('DuckDuckGo returned no parseable results (possibly blocked)', 'duckduckgo');
  }
  return results;
}

export function mockSearch(query: string): SearchResult[] {
  return [
    {
      title: 'Official API documentation (mock)',
      url: 'https://docs.example.com/api-guide',
      snippet: `[mock] Reference documentation relevant to "${query}".`,
    },
    {
      title: 'Pricing and platform limits (mock)',
      url: 'https://docs.example.com/pricing',
      snippet: `[mock] Fee schedules and platform limits relevant to "${query}".`,
    },
    {
      title: 'Regulatory briefing (mock)',
      url: 'https://docs.example.com/regulatory',
      snippet: `[mock] Jurisdiction notes relevant to "${query}".`,
    },
  ];
}
