// detector.ts
// Import word lists from data file
import {
  allWeaselWords,
  irregularVerbs,
  auxiliaryVerbs,
} from "../data/words.js";

/**
 * Detects weasel words in the given text
 * @param text The text to analyze
 * @returns Array of found weasel words with their positions
 */
export function detectWeaselWords(text: string): Array<{
  word: string;
  index: number;
  length: number;
}> {
  const results: Array<{
    word: string;
    index: number;
    length: number;
  }> = [];

  // Create a regex that matches whole words only for all weasel words
  const weaselWordsPattern = new RegExp(
    `\\b(${allWeaselWords.join("|")})\\b`,
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

/**
 * Detects passive voice in the given text
 * @param text The text to analyze
 * @returns Array of passive voice instances with their positions
 */
export function detectPassiveVoice(text: string): Array<{
  phrase: string;
  index: number;
  length: number;
}> {
  const results: Array<{
    phrase: string;
    index: number;
    length: number;
  }> = [];

  // Regular past participle pattern (words ending in "ed")
  const regularPattern = "\\w+ed";

  // All verbs that can be used in passive voice
  const allVerbs = `${regularPattern}|${irregularVerbs.join("|")}`;

  // Full passive voice pattern: auxiliary verb + optional whitespace + past participle
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

/**
 * Detects duplicate adjacent words in the given text, handling case-insensitivity
 * @param text The text to analyze
 * @returns Array of duplicate words with their positions
 */
export function detectDuplicateWords(text: string): Array<{
  word: string;
  index: number;
  length: number;
}> {
  const results: Array<{
    word: string;
    index: number;
    length: number;
  }> = [];

  // This regex finds adjacent words with optional space in between, ignoring case
  const regex = /\b(\w+)\b[\s\r\n]+\b(\1)\b/gi;

  let match;
  while ((match = regex.exec(text)) !== null) {
    // To handle case insensitivity correctly, we need to determine the exact positions
    // of the second occurrence (the duplicate)
    const firstWord = match[1];
    const fullMatch = match[0];

    // Find the position of the second word in the match
    const firstWordIndex = match.index;
    const secondWordIndex = firstWordIndex + fullMatch.indexOf(match[2]);

    // Get the actual duplicate word from the text (preserving original case)
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

/**
 * Removes a duplicate word at the specified position
 * @param text The original text
 * @param index The starting index of the duplicate word
 * @param length The length of the duplicate word
 * @returns Updated text with the duplicate word removed
 */
export function removeDuplicateWord(
  text: string,
  index: number,
  length: number
): string {
  // Look backwards from the duplicate word to find the whitespace
  let whitespaceStart = index;
  while (whitespaceStart > 0 && /\s/.test(text[whitespaceStart - 1])) {
    whitespaceStart--;
  }

  // Remove the duplicate word and preceding whitespace
  return text.substring(0, whitespaceStart) + text.substring(index + length);
}
