// detector.ts
// Import word lists from data file
import {
  allWeaselWords,
  irregularVerbs,
  auxiliaryVerbs,
  nominalizations as defaultNominalizations,
  hedgingPhrases as defaultHedgingPhrases,
  fillerAdverbs as defaultFillerAdverbs,
  abbreviations,
  aiTellsVocabulary as defaultAiVocabulary,
  aiTellsPhrases as defaultAiPhrases,
  aiTellsPatterns as defaultAiPatterns,
} from "./words.js";

function escapeForRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Multi-word entries should survive hard-wrapped lines ("kind\nof") and curly
// apostrophes ("it’s"), so spaces become \s+ and ' matches either apostrophe.
function flexibleSource(str: string): string {
  return escapeForRegex(str).replace(/ /g, '\\s+').replace(/'/g, "['’]");
}

export function detectWeaselWords(text: string, wordList?: string[]): Array<{
  word: string;
  index: number;
  length: number;
}> {
  const results: Array<{ word: string; index: number; length: number }> = [];
  const words = wordList ?? allWeaselWords;
  if (words.length === 0) return results;

  // Longest-first so "kind of" wins over a hypothetical "kind" entry
  const sorted = [...words].sort((a, b) => b.length - a.length);
  const weaselWordsPattern = new RegExp(
    `\\b(${sorted.map(flexibleSource).join("|")})\\b`,
    "gi"
  );

  let match;
  while ((match = weaselWordsPattern.exec(text)) !== null) {
    results.push({
      word: match[0],
      index: match.index,
      length: match[0].length,
    });
  }

  return results;
}

export function detectPassiveVoice(text: string): Array<{
  phrase: string;
  index: number;
  length: number;
}> {
  const results: Array<{ phrase: string; index: number; length: number }> = [];

  const regularPattern = "\\w+ed";
  const allVerbs = `${regularPattern}|${irregularVerbs.join("|")}`;

  // Common adjectives/nouns ending in "ed"-like letters that are not past
  // participles ("was tired", "there is need"). 'used' is deliberately
  // absent: "was used by" is genuine passive.
  const notParticiples =
    "indeed|red|bed|naked|sacred|wretched|hundred|wicked|hatred|kindred|" +
    "need|speed|greed|seed|deed|creed|feed|breed|tweed|" +
    "tired|talented|gifted|excited|interested|supposed";

  // \s+ (not literal spaces) so passives spanning a hard line wrap still
  // match. Up to two gap words (negation or -ly adverb) may sit between the
  // auxiliary and the participle: "was not fully fixed".
  const passivePattern = new RegExp(
    `\\b(${auxiliaryVerbs.join("|")})\\b\\s+(?:(?:not|never|\\w+ly)\\s+){0,2}(?!(?:${notParticiples})\\b)(${allVerbs})\\b`,
    "gi"
  );

  let match;
  while ((match = passivePattern.exec(text)) !== null) {
    results.push({
      phrase: match[0],
      index: match.index,
      length: match[0].length,
    });
  }

  return results;
}

export function detectDuplicateWords(text: string): Array<{
  word: string;
  index: number;
  length: number;
}> {
  const results: Array<{ word: string; index: number; length: number }> = [];

  const regex = /\b(\w+)\b[\s\r\n]+\b(\1)\b/gi;

  let match;
  while ((match = regex.exec(text)) !== null) {
    // The backreference always ends the match, so its position is
    // deterministic — indexOf would find the FIRST word when cases match.
    const secondWordIndex = match.index + match[0].length - match[2].length;

    results.push({
      word: match[2],
      index: secondWordIndex,
      length: match[2].length,
    });

    // Resume at the duplicate so chained runs ("the the the") report each pair
    regex.lastIndex = secondWordIndex;
  }

  return results;
}

export function removeDuplicateWord(
  text: string,
  index: number,
  length: number
): string {
  let whitespaceStart = index;
  while (whitespaceStart > 0 && /\s/.test(text[whitespaceStart - 1])) {
    whitespaceStart--;
  }
  return text.substring(0, whitespaceStart) + text.substring(index + length);
}

/**
 * Split text into sentences, preserving positions. Handles abbreviations,
 * decimals, ellipses, closing quotes/brackets after terminators, Markdown
 * block boundaries, and CRLF line endings. Shared by detectLongSentences and
 * the analyzer's sentence count so both report the same numbers.
 */
export function splitSentences(text: string): Array<{ text: string; index: number }> {
  const sentences: Array<{ text: string; index: number }> = [];
  if (!text.trim()) return sentences;

  let currentStart = 0;

  // Skip leading whitespace for first sentence
  while (currentStart < text.length && /\s/.test(text[currentStart])) {
    currentStart++;
  }

  let i = 0;
  while (i < text.length) {
    // Treat paragraph breaks (blank lines) and the start of a new list item
    // or blockquote as sentence boundaries. A Markdown block is not one long
    // running sentence just because it lacks terminal punctuation. (A single
    // '\n' inside a paragraph — soft-wrapped prose — is NOT a boundary.)
    // '\r' is tolerated so CRLF files split the same way as LF files.
    if (text[i] === '\n') {
      const rest = text.slice(i + 1);
      const isParagraphBreak = /^[ \t\r]*\n/.test(rest);
      const startsNewBlock = /^[ \t\r]*(?:[-*+]\s|\d+[.)]\s|>)/.test(rest);
      if (isParagraphBreak || startsNewBlock) {
        const sentenceText = text.substring(currentStart, i + 1).trim();
        if (sentenceText) sentences.push({ text: sentenceText, index: currentStart });
        i++;
        while (i < text.length && /\s/.test(text[i])) i++;
        currentStart = i;
        continue;
      }
    }
    if (text[i] === '.' || text[i] === '!' || text[i] === '?' || text[i] === '…') {
      // Check for ellipsis
      if (text[i] === '.' && text[i + 1] === '.' && text[i + 2] === '.') {
        i += 3;
        continue;
      }

      // Check for decimal number: digit.digit
      if (text[i] === '.' && i > 0 && /\d/.test(text[i - 1]) && i + 1 < text.length && /\d/.test(text[i + 1])) {
        i++;
        continue;
      }

      // Check for abbreviation
      if (text[i] === '.') {
        let wordStart = i - 1;
        while (wordStart >= 0 && /[a-zA-Z.]/.test(text[wordStart])) {
          wordStart--;
        }
        wordStart++;
        const wordBefore = text.substring(wordStart, i).toLowerCase().replace(/\.$/, '');
        if (abbreviations.has(wordBefore)) {
          i++;
          continue;
        }
      }

      // A terminator may be followed by closing quotes/brackets before the
      // whitespace: 'He said "Stop." Then he left.'
      let afterPunct = i + 1;
      while (afterPunct < text.length && /["'”’)\]]/.test(text[afterPunct])) {
        afterPunct++;
      }
      if (afterPunct >= text.length || /\s/.test(text[afterPunct])) {
        const sentenceText = text.substring(currentStart, afterPunct).trim();
        if (sentenceText) {
          sentences.push({ text: sentenceText, index: currentStart });
        }
        i = afterPunct;
        while (i < text.length && /\s/.test(text[i])) {
          i++;
        }
        currentStart = i;
        continue;
      }
    }
    i++;
  }

  // Handle remaining text (no terminal punctuation)
  if (currentStart < text.length) {
    const sentenceText = text.substring(currentStart).trim();
    if (sentenceText) {
      sentences.push({ text: sentenceText, index: currentStart });
    }
  }

  return sentences;
}

export function detectLongSentences(text: string, maxWords?: number): Array<{
  sentence: string;
  wordCount: number;
  index: number;
  length: number;
}> {
  const threshold = maxWords ?? 30;
  const results: Array<{ sentence: string; wordCount: number; index: number; length: number }> = [];

  for (const s of splitSentences(text)) {
    const words = s.text.split(/\s+/).filter(Boolean);
    if (words.length > threshold) {
      const truncated = s.text.length > 50 ? s.text.substring(0, 50) + '...' : s.text;
      results.push({
        sentence: truncated,
        wordCount: words.length,
        index: s.index,
        length: s.text.length,
      });
    }
  }

  return results;
}

export function detectNominalizations(
  text: string,
  wordList?: Array<{ word: string; suggestion: string }>,
): Array<{
  word: string;
  suggestion: string;
  index: number;
  length: number;
}> {
  const results: Array<{ word: string; suggestion: string; index: number; length: number }> = [];
  const words = wordList ?? defaultNominalizations;
  if (words.length === 0) return results;

  const pattern = new RegExp(
    `\\b(${words.map(w => escapeForRegex(w.word)).join("|")})\\b`,
    "gi"
  );

  const suggestionMap = new Map(words.map(w => [w.word.toLowerCase(), w.suggestion]));

  let match;
  while ((match = pattern.exec(text)) !== null) {
    results.push({
      word: match[0],
      suggestion: suggestionMap.get(match[0].toLowerCase()) || '',
      index: match.index,
      length: match[0].length,
    });
  }

  return results;
}

export function detectHedging(text: string, phraseList?: string[]): Array<{
  phrase: string;
  index: number;
  length: number;
}> {
  const results: Array<{ phrase: string; index: number; length: number }> = [];
  const phrases = phraseList ?? defaultHedgingPhrases;
  if (phrases.length === 0) return results;

  // Sort by length descending so longer phrases match first
  const sorted = [...phrases].sort((a, b) => b.length - a.length);

  const pattern = new RegExp(`\\b(${sorted.map(flexibleSource).join("|")})\\b`, "gi");

  let match;
  while ((match = pattern.exec(text)) !== null) {
    results.push({
      phrase: match[0],
      index: match.index,
      length: match[0].length,
    });
  }

  return results;
}

export function detectAdverbs(text: string, wordList?: string[]): Array<{
  word: string;
  index: number;
  length: number;
}> {
  const results: Array<{ word: string; index: number; length: number }> = [];
  const words = wordList ?? defaultFillerAdverbs;
  if (words.length === 0) return results;

  const pattern = new RegExp(
    `\\b(${words.map(escapeForRegex).join("|")})\\b`,
    "gi"
  );

  let match;
  while ((match = pattern.exec(text)) !== null) {
    results.push({
      word: match[0],
      index: match.index,
      length: match[0].length,
    });
  }

  return results;
}

// ─── AI Tells Detector ─────────────────────────────────────────────────────

/** Add \b only where the phrase edge is a word character — `\b` after "," never matches. */
function phraseRegex(phrase: string): RegExp {
  const lead = /^\w/.test(phrase) ? '\\b' : '';
  const trail = /\w$/.test(phrase) ? '\\b' : '';
  return new RegExp(`${lead}${flexibleSource(phrase)}${trail}`, 'gi');
}

export function detectAiTells(
  text: string,
  vocabularyList?: Array<{ word: string; variants?: string[]; reason: string }>,
  phraseList?: Array<{ phrase: string; reason: string }>,
  patternList?: Array<{ name: string; pattern: string; reason: string }>,
): Array<{ text: string; index: number; length: number; reason: string }> {
  const results: Array<{ text: string; index: number; length: number; reason: string }> = [];
  const vocab = vocabularyList ?? defaultAiVocabulary;
  const phrases = phraseList ?? defaultAiPhrases;
  const patterns = patternList ?? defaultAiPatterns;

  // Vocabulary tells: whole-word matches, including inflected variants
  for (const { word, variants, reason } of vocab) {
    const forms = [word, ...(variants ?? [])].map(escapeForRegex).join('|');
    const regex = new RegExp(`\\b(?:${forms})\\b`, 'gi');
    let match;
    while ((match = regex.exec(text)) !== null) {
      results.push({
        text: match[0],
        index: match.index,
        length: match[0].length,
        reason,
      });
    }
  }

  // Phrase tells: case-insensitive whole-phrase matches
  for (const { phrase, reason } of phrases) {
    const regex = phraseRegex(phrase);
    let match;
    while ((match = regex.exec(text)) !== null) {
      results.push({
        text: match[0],
        index: match.index,
        length: match[0].length,
        reason,
      });
      // Allow overlapping re-scan from the next character
      regex.lastIndex = match.index + 1;
    }
  }

  // Structural tells: regex patterns for constructions, not literal strings
  for (const { pattern, reason } of patterns) {
    let regex: RegExp;
    try {
      regex = new RegExp(pattern, 'gi');
    } catch {
      continue; // an unsupported/invalid pattern must not take down the analyzer
    }
    let match;
    while ((match = regex.exec(text)) !== null) {
      results.push({
        text: match[0],
        index: match.index,
        length: match[0].length,
        reason,
      });
      if (match[0].length === 0) regex.lastIndex++; // safety against zero-width matches
    }
  }

  // A span contained inside a longer match is the same finding reported twice
  // ("delve" inside "let's delve") — keep only the outermost match. Sorting by
  // index then length-descending guarantees any covering match precedes the
  // matches it covers, so one forward pass suffices.
  results.sort((a, b) => a.index - b.index || b.length - a.length);
  const kept: typeof results = [];
  for (const r of results) {
    const covered = kept.some(k => k.index <= r.index && k.index + k.length >= r.index + r.length);
    if (!covered) kept.push(r);
  }
  return kept;
}
