import { describe, it, expect, vi } from 'vitest';

vi.mock('@sveltejs/kit', () => ({
  json: (data: unknown, init?: ResponseInit) => {
    const body = JSON.stringify(data);
    const headers = new Headers(init?.headers);
    if (!headers.has('content-type')) headers.set('content-type', 'application/json');
    return new Response(body, { ...init, headers });
  },
}));

import { POST } from '../../src/routes/api/check/+server';

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('API response schema', () => {
  it('response has all required top-level keys', async () => {
    const response = await POST({ request: makeRequest({ text: 'Hello world.' }) } as any);
    const data = await response.json();
    expect(data).toHaveProperty('summary');
    expect(data).toHaveProperty('issues');
    expect(data).toHaveProperty('meta');
  });

  it('summary has all 7 detector counts plus total', async () => {
    const response = await POST({ request: makeRequest({ text: 'Hello world.' }) } as any);
    const data = await response.json();
    const keys = Object.keys(data.summary).sort();
    expect(keys).toEqual([
      'adverbs', 'duplicateWords', 'hedging', 'longSentences',
      'nominalizations', 'passiveVoice', 'total', 'weaselWords',
    ]);
    for (const key of keys) {
      expect(typeof data.summary[key]).toBe('number');
    }
  });

  it('issues has all 7 detector arrays', async () => {
    const response = await POST({ request: makeRequest({ text: 'Hello world.' }) } as any);
    const data = await response.json();
    const keys = Object.keys(data.issues).sort();
    expect(keys).toEqual([
      'adverbs', 'duplicateWords', 'hedging', 'longSentences',
      'nominalizations', 'passiveVoice', 'weaselWords',
    ]);
    for (const key of keys) {
      expect(Array.isArray(data.issues[key])).toBe(true);
    }
  });

  it('meta has characterCount, wordCount, sentenceCount, processingTimeMs', async () => {
    const response = await POST({ request: makeRequest({ text: 'Hello world.' }) } as any);
    const data = await response.json();
    expect(typeof data.meta.characterCount).toBe('number');
    expect(typeof data.meta.wordCount).toBe('number');
    expect(typeof data.meta.sentenceCount).toBe('number');
    expect(typeof data.meta.processingTimeMs).toBe('number');
  });

  it('weasel word issue has word, index, length, line, column, context', async () => {
    const response = await POST({ request: makeRequest({ text: 'This is very good.' }) } as any);
    const data = await response.json();
    const issue = data.issues.weaselWords[0];
    expect(issue).toHaveProperty('word');
    expect(issue).toHaveProperty('index');
    expect(issue).toHaveProperty('length');
    expect(issue).toHaveProperty('line');
    expect(issue).toHaveProperty('column');
    expect(issue).toHaveProperty('context');
  });

  it('nominalization issue has suggestion field', async () => {
    const response = await POST({ request: makeRequest({ text: 'The utilization is high.' }) } as any);
    const data = await response.json();
    const issue = data.issues.nominalizations[0];
    expect(issue).toHaveProperty('suggestion');
    expect(issue.suggestion).toBe('use');
  });

  it('error response has error field', async () => {
    const response = await POST({ request: makeRequest({}) } as any);
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(typeof data.error).toBe('string');
  });

  it('config error response has error and details', async () => {
    const response = await POST({ request: makeRequest({ text: 'hi', config: { bad: true } }) } as any);
    const data = await response.json();
    expect(data).toHaveProperty('error');
    expect(data).toHaveProperty('details');
    expect(Array.isArray(data.details)).toBe(true);
  });
});
