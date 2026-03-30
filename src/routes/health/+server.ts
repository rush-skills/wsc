import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { analyzeText } from '../../core';

const KNOWN_TEXT = 'The code was written very quickly.';
const EXPECTED_WEASEL = 1;
const EXPECTED_PASSIVE = 1;

export const GET: RequestHandler = async () => {
  try {
    const result = analyzeText(KNOWN_TEXT);
    const healthy =
      result.summary.weaselWords === EXPECTED_WEASEL &&
      result.summary.passiveVoice === EXPECTED_PASSIVE;

    return json({
      status: healthy ? 'healthy' : 'unhealthy',
      checks: {
        weaselWords: result.summary.weaselWords === EXPECTED_WEASEL,
        passiveVoice: result.summary.passiveVoice === EXPECTED_PASSIVE,
      },
      detectors: 8,
      timestamp: new Date().toISOString(),
    }, {
      status: healthy ? 200 : 503,
    });
  } catch (err: unknown) {
    return json({
      status: 'unhealthy',
      error: err instanceof Error ? err.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 503 });
  }
};
