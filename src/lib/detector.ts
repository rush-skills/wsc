// detector.ts

// List of weasel words from the original blog post
const weaselWords = [
  "many",
  "various",
  "very",
  "fairly",
  "several",
  "extremely",
  "exceedingly",
  "quite",
  "remarkably",
  "few",
  "surprisingly",
  "mostly",
  "largely",
  "huge",
  "tiny",
  "are a number",
  "is a number",
  "excellent",
  "interestingly",
  "significantly",
  "substantially",
  "clearly",
  "vast",
  "relatively",
  "completely",
];

// Additional weasel words that might be useful
const additionalWeaselWords = [
  "virtually",
  "somewhat",
  "somehow",
  "sort of",
  "kind of",
  "rather",
  "usually",
  "basically",
  "generally",
  "pretty much",
  "arguably",
  "almost",
  "occasionally",
  "approximately",
  "nearly",
  "seemingly",
  "apparently",
  "evidently",
  "conceivably",
  "possibly",
  "probably",
  "perhaps",
  "maybe",
  "certainly",
  "definitely",
  "essentially",
  "actually",
  "literally",
  "obviously",
];

// Combined list of all weasel words
export const allWeaselWords = [...weaselWords, ...additionalWeaselWords];

// List of irregular verb forms (past participles) from the original blog post
const irregularVerbs = [
  "awoken",
  "been",
  "born",
  "beat",
  "become",
  "begun",
  "bent",
  "beset",
  "bet",
  "bid",
  "bidden",
  "bound",
  "bitten",
  "bled",
  "blown",
  "broken",
  "bred",
  "brought",
  "broadcast",
  "built",
  "burnt",
  "burst",
  "bought",
  "cast",
  "caught",
  "chosen",
  "clung",
  "come",
  "cost",
  "crept",
  "cut",
  "dealt",
  "dug",
  "dived",
  "done",
  "drawn",
  "dreamt",
  "driven",
  "drunk",
  "eaten",
  "fallen",
  "fed",
  "felt",
  "fought",
  "found",
  "fit",
  "fled",
  "flung",
  "flown",
  "forbidden",
  "forgotten",
  "foregone",
  "forgiven",
  "forsaken",
  "frozen",
  "gotten",
  "given",
  "gone",
  "ground",
  "grown",
  "hung",
  "heard",
  "hidden",
  "hit",
  "held",
  "hurt",
  "kept",
  "knelt",
  "knit",
  "known",
  "laid",
  "led",
  "leapt",
  "learnt",
  "left",
  "lent",
  "let",
  "lain",
  "lighted",
  "lost",
  "made",
  "meant",
  "met",
  "misspelt",
  "mistaken",
  "mown",
  "overcome",
  "overdone",
  "overtaken",
  "overthrown",
  "paid",
  "pled",
  "proven",
  "put",
  "quit",
  "read",
  "rid",
  "ridden",
  "rung",
  "risen",
  "run",
  "sawn",
  "said",
  "seen",
  "sought",
  "sold",
  "sent",
  "set",
  "sewn",
  "shaken",
  "shaven",
  "shorn",
  "shed",
  "shone",
  "shod",
  "shot",
  "shown",
  "shrunk",
  "shut",
  "sung",
  "sunk",
  "sat",
  "slept",
  "slain",
  "slid",
  "slung",
  "slit",
  "smitten",
  "sown",
  "spoken",
  "sped",
  "spent",
  "spilt",
  "spun",
  "spit",
  "split",
  "spread",
  "sprung",
  "stood",
  "stolen",
  "stuck",
  "stung",
  "stunk",
  "stridden",
  "struck",
  "strung",
  "striven",
  "sworn",
  "swept",
  "swollen",
  "swum",
  "swung",
  "taken",
  "taught",
  "torn",
  "told",
  "thought",
  "thrived",
  "thrown",
  "thrust",
  "trodden",
  "understood",
  "upheld",
  "upset",
  "woken",
  "worn",
  "woven",
  "wed",
  "wept",
  "wound",
  "won",
  "withheld",
  "withstood",
  "wrung",
  "written",
];

// Auxiliary verbs used in passive voice
const auxiliaryVerbs = [
  "am",
  "are",
  "were",
  "being",
  "is",
  "been",
  "was",
  "be",
];

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
