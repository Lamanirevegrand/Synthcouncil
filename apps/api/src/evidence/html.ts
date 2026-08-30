/**
 * Minimal HTML helpers used by the search fallback and the page fetcher.
 * No DOM, no heavy parser — just enough to turn HTML into readable text.
 */

const ENTITY_RE = /&(#x[0-9a-f]+|#\d+|[a-z]+);/gi;

export function decodeEntities(input: string): string {
  return input.replace(ENTITY_RE, (whole, entity: string) => {
    if (entity.startsWith('#x')) return String.fromCodePoint(parseInt(entity.slice(2), 16));
    if (entity.startsWith('#')) return String.fromCodePoint(parseInt(entity.slice(1), 10));
    const named: Record<string, string> = {
      amp: '&',
      lt: '<',
      gt: '>',
      quot: '"',
      apos: "'",
      nbsp: ' ',
      hellip: '…',
      mdash: '—',
      ndash: '–',
      rsquo: '’',
      lsquo: '‘',
      ldquo: '“',
      rdquo: '”',
    };
    return named[entity] ?? whole;
  });
}

/** Strip tags/scripts/styles and collapse whitespace into readable prose. */
export function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Extract the <title> of an HTML document. */
export function extractTitle(html: string): string {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match ? decodeEntities(match[1].trim()).slice(0, 200) : '';
}
