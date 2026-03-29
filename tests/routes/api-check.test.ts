import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @sveltejs/kit's json helper before importing the route
vi.mock('@sveltejs/kit', () => ({
  json: (data: unknown, init?: ResponseInit) => {
    const body = JSON.stringify(data);
    const headers = new Headers(init?.headers);
    if (!headers.has('content-type')) {
      headers.set('content-type', 'application/json');
    }
    return new Response(body, { ...init, headers });
  },
}));

import { POST, OPTIONS } from '../../src/routes/api/check/+server';

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function makeInvalidRequest(): Request {
  return new Request('http://localhost/api/check', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: 'not json{{{',
  });
}

// ============================================================================
// POST /api/check
// ============================================================================

describe('POST /api/check', () => {
  it('returns valid analysis for text with issues', async () => {
    const request = makeRequest({ text: 'The code was written very quickly.' });
    const response = await POST({ request } as any);
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.summary).toBeDefined();
    expect(data.summary.total).toBe(2);
    expect(data.summary.weaselWords).toBe(1);
    expect(data.summary.passiveVoice).toBe(1);
    expect(data.summary.duplicateWords).toBe(0);
    expect(data.issues).toBeDefined();
    expect(data.meta).toBeDefined();
    expect(data.meta.characterCount).toBe(34);
    expect(data.meta.wordCount).toBe(6);
    expect(typeof data.meta.processingTimeMs).toBe('number');
  });

  it('returns zero issues for clean text', async () => {
    const request = makeRequest({ text: 'The team wrote good code.' });
    const response = await POST({ request } as any);
    const data = await response.json();
    expect(data.summary.total).toBe(0);
    expect(data.issues.weaselWords).toEqual([]);
    expect(data.issues.passiveVoice).toEqual([]);
    expect(data.issues.duplicateWords).toEqual([]);
  });

  it('returns 400 for invalid JSON body', async () => {
    const request = makeInvalidRequest();
    const response = await POST({ request } as any);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Invalid JSON');
  });

  it('returns 400 for missing text field', async () => {
    const request = makeRequest({});
    const response = await POST({ request } as any);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Missing or invalid');
  });

  it('returns 400 for non-string text field', async () => {
    const request = makeRequest({ text: 123 });
    const response = await POST({ request } as any);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('Missing or invalid');
  });

  it('returns 400 for empty string text', async () => {
    const request = makeRequest({ text: '' });
    const response = await POST({ request } as any);
    expect(response.status).toBe(400);
  });

  it('returns 400 for text exceeding 100,000 characters', async () => {
    const request = makeRequest({ text: 'a'.repeat(100_001) });
    const response = await POST({ request } as any);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('100000');
  });

  it('accepts text at exactly 100,000 characters', async () => {
    const request = makeRequest({ text: 'a'.repeat(100_000) });
    const response = await POST({ request } as any);
    expect(response.status).toBe(200);
  });

  it('returns CORS headers', async () => {
    const request = makeRequest({ text: 'Hello world.' });
    const response = await POST({ request } as any);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
  });

  it('includes line and column in weasel word issues', async () => {
    const request = makeRequest({ text: 'Hello\nThis is very good.' });
    const response = await POST({ request } as any);
    const data = await response.json();
    const issue = data.issues.weaselWords[0];
    expect(issue.line).toBe(2);
    expect(issue.column).toBeGreaterThan(0);
    expect(issue.word.toLowerCase()).toBe('very');
  });

  it('includes context in passive voice issues', async () => {
    const request = makeRequest({ text: 'The code was written by them.' });
    const response = await POST({ request } as any);
    const data = await response.json();
    const issue = data.issues.passiveVoice[0];
    expect(issue.context).toBeDefined();
    expect(issue.context).toContain('was written');
    expect(issue.phrase.toLowerCase()).toBe('was written');
  });

  it('includes context in duplicate word issues', async () => {
    const request = makeRequest({ text: 'the the code works' });
    const response = await POST({ request } as any);
    const data = await response.json();
    expect(data.issues.duplicateWords.length).toBeGreaterThan(0);
    expect(data.issues.duplicateWords[0].context).toBeDefined();
  });

  it('adds ellipsis to context when text is long', async () => {
    const text = 'A'.repeat(30) + ' very ' + 'B'.repeat(30);
    const request = makeRequest({ text });
    const response = await POST({ request } as any);
    const data = await response.json();
    const ctx = data.issues.weaselWords[0].context;
    expect(ctx).toContain('...');
  });

  it('omits ellipsis in context when text is short', async () => {
    const request = makeRequest({ text: 'very' });
    const response = await POST({ request } as any);
    const data = await response.json();
    const ctx = data.issues.weaselWords[0].context;
    expect(ctx).not.toContain('...');
  });

  it('detects all three issue types at once', async () => {
    const request = makeRequest({ text: 'The the code was written very fast.' });
    const response = await POST({ request } as any);
    const data = await response.json();
    expect(data.summary.weaselWords).toBeGreaterThan(0);
    expect(data.summary.passiveVoice).toBeGreaterThan(0);
    expect(data.summary.duplicateWords).toBeGreaterThan(0);
  });
});

// ============================================================================
// OPTIONS /api/check
// ============================================================================

describe('OPTIONS /api/check', () => {
  it('returns CORS headers with null body', async () => {
    const response = await OPTIONS({} as any);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('OPTIONS');
    expect(response.headers.get('Access-Control-Allow-Headers')).toContain('Content-Type');
    expect(response.body).toBeNull();
  });
});
