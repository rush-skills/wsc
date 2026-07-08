import type { WscConfig, WordListDetectorConfig, NominalizationDetectorConfig, LongSentenceDetectorConfig, AiTellsDetectorConfig } from './config.js';
import { mergeConfig, applyWordListOverrides, applyNominalizationOverrides, applyAiTellsVocabOverrides, applyAiTellsPhraseOverrides, applyAiTellsPatternOverrides } from './config.js';
import { allWeaselWords, nominalizations, hedgingPhrases, fillerAdverbs, aiTellsVocabulary, aiTellsPhrases, aiTellsPatterns } from './words.js';
import {
  detectWeaselWords,
  detectPassiveVoice,
  detectDuplicateWords,
  detectLongSentences,
  detectNominalizations,
  detectHedging,
  detectAdverbs,
  detectAiTells,
  splitSentences,
} from './detector.js';
import { maskMarkdown } from './markdown.js';

export interface AnalyzeOptions {
  /** Mask Markdown structure (code, tables, headings, comments) before analysis. */
  markdown?: boolean;
}

export interface AnalysisResult {
  issues: {
    weaselWords: Array<{ word: string; index: number; length: number }>;
    passiveVoice: Array<{ phrase: string; index: number; length: number }>;
    duplicateWords: Array<{ word: string; index: number; length: number }>;
    longSentences: Array<{ sentence: string; wordCount: number; index: number; length: number }>;
    nominalizations: Array<{ word: string; suggestion: string; index: number; length: number }>;
    hedging: Array<{ phrase: string; index: number; length: number }>;
    adverbs: Array<{ word: string; index: number; length: number }>;
    aiTells: Array<{ text: string; index: number; length: number; reason: string }>;
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
    aiTells: number;
  };
  meta: {
    characterCount: number;
    wordCount: number;
    sentenceCount: number;
  };
  config: ReturnType<typeof mergeConfig>;
}

export function analyzeText(text: string, config?: WscConfig, options?: AnalyzeOptions): AnalysisResult {
  const analyzed = options?.markdown ? maskMarkdown(text) : text;
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
  const at = d.aiTells! as AiTellsDetectorConfig;

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

  const aiVocabList = at.enabled
    ? applyAiTellsVocabOverrides(aiTellsVocabulary, at.add, at.remove)
    : [];

  const aiPhraseList = at.enabled
    ? applyAiTellsPhraseOverrides(aiTellsPhrases, at.addPhrases, at.removePhrases)
    : [];

  const aiPatternList = at.enabled
    ? applyAiTellsPatternOverrides(aiTellsPatterns, at.removePatterns)
    : [];

  const issues = {
    weaselWords: ww.enabled ? detectWeaselWords(analyzed, weaselWordList) : [],
    passiveVoice: pv.enabled ? detectPassiveVoice(analyzed) : [],
    duplicateWords: dw.enabled ? detectDuplicateWords(analyzed) : [],
    longSentences: ls.enabled ? detectLongSentences(analyzed, ls.maxWords) : [],
    nominalizations: nm.enabled ? detectNominalizations(analyzed, nominalizationList) : [],
    hedging: hd.enabled ? detectHedging(analyzed, hedgingList) : [],
    adverbs: ad.enabled ? detectAdverbs(analyzed, adverbList) : [],
    aiTells: at.enabled ? detectAiTells(analyzed, aiVocabList, aiPhraseList, aiPatternList) : [],
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
    aiTells: issues.aiTells.length,
  };
  summary.total = summary.weaselWords + summary.passiveVoice + summary.duplicateWords +
    summary.longSentences + summary.nominalizations + summary.hedging + summary.adverbs +
    summary.aiTells;

  // Same splitter the long-sentence detector uses, so the stats bar and the
  // long-sentence results can never disagree about what a sentence is.
  const sentenceCount = splitSentences(analyzed).length;

  return {
    issues,
    summary,
    meta: {
      characterCount: analyzed.length,
      wordCount: analyzed.split(/\s+/).filter(w => w && !/^\u0000+$/.test(w)).length,
      sentenceCount,
    },
    config: merged,
  };
}
