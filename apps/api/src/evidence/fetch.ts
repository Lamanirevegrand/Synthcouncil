import { env } from '../config/env.js';
import { withTimeout } from '../utils/timeout.js';
import { extractTitle, htmlToText } from './html.js';
import { EvidenceError, type FetchedPage } from './types.js';

const USER_AGENT =
  'Mozilla/5.0 (compatible; SynthCouncil/1.0; +https://github.com/synthcouncil/synthcouncil)';

const MAX_CONTENT_CHARS = 6_000;

/**
 * Fetch a page's readable content. Tries a direct request first; on failure
 * falls back to the Jina Reader proxy (key-free, renders pages for LLMs).
 */
export async function fetchPage(url: string): Promise<FetchedPage> {
  try {
    return await directFetch(url);
  } catch {
    try {
      return await jinaFetch(url);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      throw new EvidenceError(`Failed to fetch ${url}: ${reason}`, 'fetch');
    }
  }
}

async function directFetch(url: string): Promise<FetchedPage> {
  const response = await withTimeout(
    fetch(url, {
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    }),
    env.FETCH_TIMEOUT_MS,
    `Fetch ${url}`
  );

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json') || contentType.includes('application/pdf')) {
    throw new Error(`Unsupported content type: ${contentType}`);
  }

  const html = await response.text();
  const text = htmlToText(html).slice(0, MAX_CONTENT_CHARS);
  if (text.length < 80) {
    throw new Error('Page contains almost no readable text (likely JS-rendered)');
  }

  return { url: response.url || url, title: extractTitle(html) || url, content: text };
}

async function jinaFetch(url: string): Promise<FetchedPage> {
  const proxyUrl = `https://r.jina.ai/${url}`;
  const response = await withTimeout(
    fetch(proxyUrl, { headers: { 'User-Agent': USER_AGENT } }),
    env.FETCH_TIMEOUT_MS,
    `Jina fetch ${url}`
  );

  if (!response.ok) {
    throw new Error(`Jina proxy HTTP ${response.status}`);
  }

  const text = (await response.text()).slice(0, MAX_CONTENT_CHARS);
  if (text.length < 80) {
    throw new Error('Jina proxy returned almost no content');
  }

  return { url, title: url, content: text };
}
