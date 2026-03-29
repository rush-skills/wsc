export {
  detectWeaselWords, detectPassiveVoice, detectDuplicateWords, removeDuplicateWord,
  detectLongSentences, detectNominalizations, detectHedging, detectAdverbs,
} from './detector.js';
export {
  allWeaselWords, irregularVerbs, auxiliaryVerbs,
  nominalizations, hedgingPhrases, fillerAdverbs, abbreviations,
} from './words.js';
export { analyzeText } from './analyzer.js';
export type { AnalysisResult } from './analyzer.js';
export {
  mergeConfig, applyWordListOverrides, applyNominalizationOverrides,
  validateConfig, DEFAULT_CONFIG,
} from './config.js';
export type {
  WscConfig, DetectorConfig, WordListDetectorConfig,
  NominalizationDetectorConfig, LongSentenceDetectorConfig,
} from './config.js';
