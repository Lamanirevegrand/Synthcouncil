import type { z } from 'zod';

/**
 * Lenient JSON extraction from a model response. Models love to wrap JSON in
 * prose or code fences; this recovers the first balanced JSON object.
 */
export function jsonFromText(text: string): unknown {
  const trimmed = text.trim();

  // Fast path: the whole response is JSON.
  try {
    return JSON.parse(trimmed);
  } catch {
    /* fall through */
  }

  // Code fences: ```json ... ```
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {
      /* fall through */
    }
  }

  // Balanced-object scan starting at the first '{'.
  const start = trimmed.indexOf('{');
  if (start === -1) return undefined;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < trimmed.length; i += 1) {
    const char = trimmed[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === '\\' && inString) {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === '{') depth += 1;
    else if (char === '}') {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(trimmed.slice(start, i + 1));
        } catch {
          return undefined;
        }
      }
    }
  }
  return undefined;
}

export class StructuredOutputError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
    readonly rawResponse?: string
  ) {
    super(message);
    this.name = 'StructuredOutputError';
  }
}

/**
 * Make model output schema-safe: sources often come back as bare URLs or
 * relative paths. Normalize them so the Zod contracts stay strict.
 */
export function normalizeSource(raw: unknown): { url: string; title: string; snippet?: string } | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const rec = raw as Record<string, unknown>;
  const urlCandidate = typeof rec.url === 'string' ? rec.url : '';
  if (!urlCandidate.trim()) return null;
  let url = urlCandidate.trim();
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  const title = typeof rec.title === 'string' && rec.title.trim() ? rec.title.trim() : url;
  const snippet = typeof rec.snippet === 'string' && rec.snippet.trim() ? rec.snippet.trim() : undefined;
  return { url, title, snippet };
}
