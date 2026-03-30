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
} from "./words.js";

export function detectWeaselWords(text: string, wordList?: string[]): Array<{
  word: string;
  index: number;
  length: number;
}> {
  const results: Array<{ word: string; index: number; length: number }> = [];
  const words = wordList ?? allWeaselWords;
  if (words.length === 0) return results;

  const weaselWordsPattern = new RegExp(
    `\\b(${words.join("|")})\\b`,
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

  const passivePattern = new RegExp(
    `\\b(${auxiliaryVerbs.join("|")})\\b[ ]*(${allVerbs})\\b`,
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
    const firstWord = match[1];
    const fullMatch = match[0];

    const firstWordIndex = match.index;
    const secondWordIndex = firstWordIndex + fullMatch.indexOf(match[2]);

    const duplicateWord = text.substring(
      secondWordIndex,
      secondWordIndex + firstWord.length
    );

    results.push({
      word: duplicateWord,
      index: secondWordIndex,
      length: duplicateWord.length,
    });
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

export function detectLongSentences(text: string, maxWords?: number): Array<{
  sentence: string;
  wordCount: number;
  index: number;
  length: number;
}> {
  const threshold = maxWords ?? 30;
  const results: Array<{ sentence: string; wordCount: number; index: number; length: number }> = [];

  if (!text.trim()) return results;

  // Split into sentences, preserving positions
  const sentences: Array<{ text: string; index: number }> = [];
  let currentStart = 0;

  // Skip leading whitespace for first sentence
  while (currentStart < text.length && /\s/.test(text[currentStart])) {
    currentStart++;
  }

  let i = 0;
  while (i < text.length) {
    if (text[i] === '.' || text[i] === '!' || text[i] === '?') {
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

      // Check if followed by whitespace or end-of-string
      const afterPunct = i + 1;
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

  for (const s of sentences) {
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
    `\\b(${words.map(w => w.word).join("|")})\\b`,
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

  // Escape regex special chars in phrases
  const escaped = sorted.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");

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
    `\\b(${words.join("|")})\\b`,
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

function escapeForRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function detectAiTells(
  text: string,
  vocabularyList?: Array<{ word: string; reason: string }>,
  phraseList?: Array<{ phrase: string; reason: string }>,
): Array<{ text: string; index: number; length: number; reason: string }> {
  const results: Array<{ text: string; index: number; length: number; reason: string }> = [];
  const vocab = vocabularyList ?? defaultAiVocabulary;
  const phrases = phraseList ?? defaultAiPhrases;

  // Vocabulary tells: whole-word matches
  for (const { word, reason } of vocab) {
    const regex = new RegExp(`\\b${escapeForRegex(word)}\\b`, 'gi');
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

  // Phrase tells: case-insensitive substring matches
  const lowerText = text.toLowerCase();
  for (const { phrase, reason } of phrases) {
    const lowerPhrase = phrase.toLowerCase();
    let startIdx = 0;
    while (true) {
      const idx = lowerText.indexOf(lowerPhrase, startIdx);
      if (idx === -1) break;
      results.push({
        text: text.substring(idx, idx + phrase.length),
        index: idx,
        length: phrase.length,
        reason,
      });
      startIdx = idx + 1;
    }
  }

  // Sort by position
  results.sort((a, b) => a.index - b.index);
  return results;
}
