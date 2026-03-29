import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { detectWeaselWords, detectPassiveVoice, detectDuplicateWords } from '../../../core';

const MAX_TEXT_LENGTH = 100_000;

export const POST: RequestHandler = async ({ request }) => {
  const startTime = performance.now();

  let body: { text?: string };
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { text } = body;
  if (!text || typeof text !== 'string') {
    return json({ error: 'Missing or invalid "text" field' }, { status: 400 });
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return json({ error: `Text exceeds maximum length of ${MAX_TEXT_LENGTH} characters` }, { status: 400 });
  }

  const weaselWords = detectWeaselWords(text);
  const passiveVoice = detectPassiveVoice(text);
  const duplicateWords = detectDuplicateWords(text);

  const getLineCol = (index: number) => {
    const lines = text.substring(0, index).split('\n');
    return { line: lines.length, column: lines[lines.length - 1].length + 1 };
  };

  const getContext = (index: number, length: number) => {
    const start = Math.max(0, index - 20);
    const end = Math.min(text.length, index + length + 20);
    const prefix = start > 0 ? '...' : '';
    const suffix = end < text.length ? '...' : '';
    return `${prefix}${text.substring(start, end)}${suffix}`;
  };

  const response = {
    summary: {
      total: weaselWords.length + passiveVoice.length + duplicateWords.length,
      weaselWords: weaselWords.length,
      passiveVoice: passiveVoice.length,
      duplicateWords: duplicateWords.length,
    },
    issues: {
      weaselWords: weaselWords.map(w => ({
        ...w,
        ...getLineCol(w.index),
        context: getContext(w.index, w.length),
      })),
      passiveVoice: passiveVoice.map(p => ({
        ...p,
        ...getLineCol(p.index),
        context: getContext(p.index, p.length),
      })),
      duplicateWords: duplicateWords.map(d => ({
        ...d,
        ...getLineCol(d.index),
        context: getContext(d.index, d.length),
      })),
    },
    meta: {
      characterCount: text.length,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      processingTimeMs: Math.round(performance.now() - startTime),
    },
  };

  return json(response, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
};

export const OPTIONS: RequestHandler = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
};
