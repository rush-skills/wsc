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

describe('API response snapshots', () => {
  it('clean text response structure', async () => {
    const response = await POST({ request: makeRequest({ text: 'The team wrote good code.' }) } as any);
    const data = await response.json();
    // Remove timing field which varies
    delete data.meta.processingTimeMs;
    expect(data).toMatchSnapshot();
  });

  it('text with weasel word and passive voice', async () => {
    const response = await POST({ request: makeRequest({ text: 'The code was written very fast.' }) } as any);
    const data = await response.json();
    delete data.meta.processingTimeMs;
    expect(data).toMatchSnapshot();
  });
});
