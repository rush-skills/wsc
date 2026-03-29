import type { WscConfig, WordListDetectorConfig, NominalizationDetectorConfig, LongSentenceDetectorConfig } from './config.js';
import { mergeConfig, applyWordListOverrides, applyNominalizationOverrides } from './config.js';
import { allWeaselWords, nominalizations, hedgingPhrases, fillerAdverbs } from './words.js';
import {
  detectWeaselWords,
  detectPassiveVoice,
  detectDuplicateWords,
  detectLongSentences,
  detectNominalizations,
  detectHedging,
  detectAdverbs,
} from './detector.js';

export interface AnalysisResult {
  issues: {
    weaselWords: Array<{ word: string; index: number; length: number }>;
    passiveVoice: Array<{ phrase: string; index: number; length: number }>;
    duplicateWords: Array<{ word: string; index: number; length: number }>;
    longSentences: Array<{ sentence: string; wordCount: number; index: number; length: number }>;
    nominalizations: Array<{ word: string; suggestion: string; index: number; length: number }>;
    hedging: Array<{ phrase: string; index: number; length: number }>;
    adverbs: Array<{ word: string; index: number; length: number }>;
  };
  summary: {
    total: number;
    weaselWords: number;
    passiveVoice: number;
    duplicateWords: number;
    longSentences: number;
    nominalizations: number;
    hedging: number;
    adverbs: number;
  };
  meta: {
    characterCount: number;
    wordCount: number;
    sentenceCount: number;
  };
  config: ReturnType<typeof mergeConfig>;
}

export function analyzeText(text: string, config?: WscConfig): AnalysisResult {
  const merged = mergeConfig(config);
  const d = merged.detectors;

  // mergeConfig guarantees all detectors are populated
  const ww = d.weaselWords! as WordListDetectorConfig;
  const pv = d.passiveVoice!;
  const dw = d.duplicateWords!;
  const ls = d.longSentences! as LongSentenceDetectorConfig;
  const nm = d.nominalizations! as NominalizationDetectorConfig;
  const hd = d.hedging! as WordListDetectorConfig;
  const ad = d.adverbs! as WordListDetectorConfig;

  const weaselWordList = ww.enabled
    ? applyWordListOverrides(allWeaselWords, ww.add, ww.remove)
    : [];

  const nominalizationList = nm.enabled
    ? applyNominalizationOverrides(nominalizations, nm.add, nm.remove)
    : [];

  const hedgingList = hd.enabled
    ? applyWordListOverrides(hedgingPhrases, hd.add, hd.remove)
    : [];

  const adverbList = ad.enabled
    ? applyWordListOverrides(fillerAdverbs, ad.add, ad.remove)
    : [];

  const issues = {
    weaselWords: ww.enabled ? detectWeaselWords(text, weaselWordList) : [],
    passiveVoice: pv.enabled ? detectPassiveVoice(text) : [],
    duplicateWords: dw.enabled ? detectDuplicateWords(text) : [],
    longSentences: ls.enabled ? detectLongSentences(text, ls.maxWords) : [],
    nominalizations: nm.enabled ? detectNominalizations(text, nominalizationList) : [],
    hedging: hd.enabled ? detectHedging(text, hedgingList) : [],
    adverbs: ad.enabled ? detectAdverbs(text, adverbList) : [],
  };

  const summary = {
    total: 0,
    weaselWords: issues.weaselWords.length,
    passiveVoice: issues.passiveVoice.length,
    duplicateWords: issues.duplicateWords.length,
    longSentences: issues.longSentences.length,
    nominalizations: issues.nominalizations.length,
    hedging: issues.hedging.length,
    adverbs: issues.adverbs.length,
  };
  summary.total = summary.weaselWords + summary.passiveVoice + summary.duplicateWords +
    summary.longSentences + summary.nominalizations + summary.hedging + summary.adverbs;

  const sentenceMatches = text.match(/[^.!?]*[.!?](?:\s|$)/g);
  const sentenceCount = sentenceMatches ? sentenceMatches.length : (text.trim() ? 1 : 0);

  return {
    issues,
    summary,
    meta: {
      characterCount: text.length,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      sentenceCount,
    },
    config: merged,
  };
}
