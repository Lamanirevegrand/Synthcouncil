import { describe, expect, it } from 'vitest';
import { jsonFromText, normalizeSource } from './json.js';

describe('jsonFromText', () => {
  it('parses a bare JSON object', () => {
    expect(jsonFromText('{"a":1}')).toEqual({ a: 1 });
  });

  it('parses JSON wrapped in a code fence', () => {
    expect(jsonFromText('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it('recovers the first balanced object from prose', () => {
    const text = 'Here is my answer: {"stance":"concerns","headline":"x"} and that is final.';
    expect(jsonFromText(text)).toEqual({ stance: 'concerns', headline: 'x' });
  });

  it('handles nested braces and strings', () => {
    const text = '{ "nested": { "deep": [1, {"k":"}"}] }, "ok": true }';
    expect(jsonFromText(text)).toEqual({ nested: { deep: [1, { k: '}' }] }, ok: true });
  });

  it('returns undefined for non-JSON text', () => {
    expect(jsonFromText('no json here')).toBeUndefined();
  });

  it('returns undefined for malformed JSON', () => {
    expect(jsonFromText('{"a": }')).toBeUndefined();
  });
});

describe('normalizeSource', () => {
  it('adds https:// to bare domains', () => {
    expect(normalizeSource({ url: 'docs.example.com/guide', title: 'Guide' })).toEqual({
      url: 'https://docs.example.com/guide',
      title: 'Guide',
    });
  });

  it('keeps valid urls and defaults title to the url', () => {
    expect(normalizeSource({ url: 'https://example.com' })).toEqual({
      url: 'https://example.com',
      title: 'https://example.com',
    });
  });

  it('drops malformed entries', () => {
    expect(normalizeSource({ url: '', title: 'x' })).toBeNull();
    expect(normalizeSource(null)).toBeNull();
  });
});
