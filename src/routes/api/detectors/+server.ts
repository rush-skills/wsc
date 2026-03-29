import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { allWeaselWords, nominalizations, hedgingPhrases, fillerAdverbs } from '../../../core';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const GET: RequestHandler = async () => {
  return json({
    detectors: [
      {
        name: 'weaselWords',
        description: 'Vague terms that weaken writing',
        configurable: true,
        wordCount: allWeaselWords.length,
      },
      {
        name: 'passiveVoice',
        description: 'Passive voice constructions',
        configurable: false,
      },
      {
        name: 'duplicateWords',
        description: 'Adjacent repeated words',
        configurable: false,
      },
      {
        name: 'longSentences',
        description: 'Sentences exceeding a word count threshold',
        configurable: true,
        defaultMaxWords: 30,
      },
      {
        name: 'nominalizations',
        description: 'Nouns that could be replaced with stronger verbs',
        configurable: true,
        wordCount: nominalizations.length,
      },
      {
        name: 'hedging',
        description: 'Phrases that weaken assertions',
        configurable: true,
        phraseCount: hedgingPhrases.length,
      },
      {
        name: 'adverbs',
        description: 'Filler adverbs that add emphasis without substance',
        configurable: true,
        wordCount: fillerAdverbs.length,
      },
    ],
  }, { headers: CORS_HEADERS });
};

export const OPTIONS: RequestHandler = async () => {
  return new Response(null, { headers: CORS_HEADERS });
};
