export {
  detectWeaselWords, detectPassiveVoice, detectDuplicateWords, removeDuplicateWord,
  detectLongSentences, detectNominalizations, detectHedging, detectAdverbs,
  detectAiTells,
} from './detector.js';
export {
  allWeaselWords, irregularVerbs, auxiliaryVerbs,
  nominalizations, hedgingPhrases, fillerAdverbs, abbreviations,
  aiTellsVocabulary, aiTellsPhrases,
} from './words.js';
export { analyzeText } from './analyzer.js';
export type { AnalysisResult } from './analyzer.js';
export {
  mergeConfig, applyWordListOverrides, applyNominalizationOverrides,
  applyAiTellsVocabOverrides, applyAiTellsPhraseOverrides,
  validateConfig, DEFAULT_CONFIG,
} from './config.js';
export type {
  WscConfig, DetectorConfig, WordListDetectorConfig,
  NominalizationDetectorConfig, LongSentenceDetectorConfig,
  AiTellsDetectorConfig,
} from './config.js';
