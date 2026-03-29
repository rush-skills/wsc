import { describe, it, expect } from 'vitest';
import {
  detectWeaselWords,
  detectPassiveVoice,
  detectDuplicateWords,
  removeDuplicateWord,
} from '../../src/core/detector';

// ============================================================================
// detectWeaselWords
// ============================================================================

describe('detectWeaselWords', () => {
  it('returns empty array for clean text', () => {
    expect(detectWeaselWords('The code is good.')).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(detectWeaselWords('')).toEqual([]);
  });

  it('detects a single weasel word', () => {
    const results = detectWeaselWords('This is very good.');
    expect(results.length).toBe(1);
    expect(results[0].word.toLowerCase()).toBe('very');
    expect(results[0].index).toBe(8);
    expect(results[0].length).toBe(4);
  });

  it('detects multiple weasel words', () => {
    const results = detectWeaselWords('It is extremely and obviously bad.');
    const words = results.map(r => r.word.toLowerCase());
    expect(words).toContain('extremely');
    expect(words).toContain('obviously');
  });

  it('detects weasel words case-insensitively', () => {
    const results = detectWeaselWords('VERY good. Very bad. very ugly.');
    expect(results.length).toBe(3);
    expect(results[0].word).toBe('VERY');
    expect(results[1].word).toBe('Very');
    expect(results[2].word).toBe('very');
  });

  it('matches whole words only, not substrings', () => {
    // "several" is a weasel word, but "severally" should not match as "several"
    // "few" is a weasel word, but "curfew" should not match
    const results = detectWeaselWords('A curfew was imposed.');
    const words = results.map(r => r.word.toLowerCase());
    expect(words).not.toContain('few');
  });

  it('detects multi-word weasel phrases', () => {
    const results = detectWeaselWords('There are a number of issues.');
    const words = results.map(r => r.word.toLowerCase());
    expect(words).toContain('are a number');
  });

  it('returns correct index and length for each match', () => {
    const text = 'fairly obvious';
    const results = detectWeaselWords(text);
    for (const r of results) {
      expect(text.substring(r.index, r.index + r.length).toLowerCase()).toBe(r.word.toLowerCase());
    }
  });

  it('detects weasel words from the additional list', () => {
    const results = detectWeaselWords('This is basically and literally true.');
    const words = results.map(r => r.word.toLowerCase());
    expect(words).toContain('basically');
    expect(words).toContain('literally');
  });

  it('detects weasel words across multiple lines', () => {
    const results = detectWeaselWords('very good\nextremely bad\nquite ugly');
    expect(results.length).toBe(3);
  });

  it('handles text with only whitespace', () => {
    expect(detectWeaselWords('   \n\t  ')).toEqual([]);
  });

  it('handles text with special characters around weasel words', () => {
    const results = detectWeaselWords('It is (very) good!');
    expect(results.length).toBe(1);
    expect(results[0].word.toLowerCase()).toBe('very');
  });
});

// ============================================================================
// detectPassiveVoice
// ============================================================================

describe('detectPassiveVoice', () => {
  it('returns empty array for active voice text', () => {
    expect(detectPassiveVoice('The team wrote the code.')).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(detectPassiveVoice('')).toEqual([]);
  });

  it('detects passive voice with regular past participle (-ed)', () => {
    const results = detectPassiveVoice('The code was updated by the team.');
    expect(results.length).toBe(1);
    expect(results[0].phrase.toLowerCase()).toBe('was updated');
  });

  it('detects passive voice with irregular past participle', () => {
    const results = detectPassiveVoice('The code was written by the team.');
    expect(results.length).toBe(1);
    expect(results[0].phrase.toLowerCase()).toBe('was written');
  });

  it('detects multiple passive voice constructions', () => {
    const results = detectPassiveVoice('The code was written and the tests were broken.');
    expect(results.length).toBe(2);
  });

  it('detects passive with different auxiliary verbs', () => {
    const auxiliaries = [
      'am impressed',
      'is broken',
      'are taken',
      'was written',
      'were chosen',
      'been done',
      'being built',
      'be forgotten',
    ];
    for (const phrase of auxiliaries) {
      const results = detectPassiveVoice(`It ${phrase} today.`);
      expect(results.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('detects passive voice case-insensitively', () => {
    const results = detectPassiveVoice('WAS WRITTEN');
    expect(results.length).toBe(1);
  });

  it('returns correct index and length', () => {
    const text = 'The code was written by them.';
    const results = detectPassiveVoice(text);
    expect(results.length).toBe(1);
    const r = results[0];
    expect(text.substring(r.index, r.index + r.length).toLowerCase()).toBe(r.phrase.toLowerCase());
  });

  it('detects passive voice across multiple lines', () => {
    const results = detectPassiveVoice('Code was written.\nTests were broken.');
    expect(results.length).toBe(2);
  });

  it('handles text with no verbs', () => {
    expect(detectPassiveVoice('Hello world.')).toEqual([]);
  });

  it('handles text with only whitespace', () => {
    expect(detectPassiveVoice('   \n\t  ')).toEqual([]);
  });

  it('detects passive with auxiliary followed by space and regular -ed verb', () => {
    const results = detectPassiveVoice('It is considered important.');
    expect(results.length).toBe(1);
    expect(results[0].phrase.toLowerCase()).toBe('is considered');
  });
});

// ============================================================================
// detectDuplicateWords
// ============================================================================

describe('detectDuplicateWords', () => {
  it('returns empty array for clean text', () => {
    expect(detectDuplicateWords('The code is good.')).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(detectDuplicateWords('')).toEqual([]);
  });

  it('detects a simple duplicate word', () => {
    const results = detectDuplicateWords('the the code');
    expect(results.length).toBe(1);
    expect(results[0].word).toBe('the');
  });

  it('detects case-insensitive duplicates', () => {
    const results = detectDuplicateWords('The the code');
    expect(results.length).toBe(1);
    // The second word (the duplicate) preserves its original case
    expect(results[0].word).toBe('the');
  });

  it('detects multiple duplicate pairs', () => {
    const results = detectDuplicateWords('the the code is is good');
    expect(results.length).toBe(2);
  });

  it('returns index and length for the duplicate', () => {
    const text = 'the the code';
    const results = detectDuplicateWords(text);
    expect(results.length).toBe(1);
    // Due to indexOf finding the first "the" in "the the", the reported index
    // is 0 (the start of the first word). This is the existing behavior.
    expect(results[0].index).toBe(0);
    expect(results[0].length).toBe(3);
    expect(results[0].word).toBe('the');
  });

  it('detects duplicates separated by newlines', () => {
    const results = detectDuplicateWords('the\nthe code');
    expect(results.length).toBe(1);
  });

  it('detects duplicates separated by multiple spaces', () => {
    const results = detectDuplicateWords('the   the code');
    expect(results.length).toBe(1);
  });

  it('detects duplicates separated by tabs', () => {
    const results = detectDuplicateWords('the\tthe code');
    expect(results.length).toBe(1);
  });

  it('does not flag non-adjacent duplicate words', () => {
    // "the" appears twice but not adjacent
    const results = detectDuplicateWords('the code and the test');
    expect(results.length).toBe(0);
  });

  it('handles text with only whitespace', () => {
    expect(detectDuplicateWords('   \n\t  ')).toEqual([]);
  });

  it('correctly reports the duplicate word text from the original', () => {
    const text = 'Hello HELLO world';
    const results = detectDuplicateWords(text);
    expect(results.length).toBe(1);
    // The second word is "HELLO" — should be captured as-is from the text
    expect(results[0].word).toBe('HELLO');
  });
});

// ============================================================================
// removeDuplicateWord
// ============================================================================

describe('removeDuplicateWord', () => {
  it('removes a duplicate word and preceding whitespace', () => {
    const text = 'the the code';
    // Duplicate "the" is at index 4, length 3
    const result = removeDuplicateWord(text, 4, 3);
    expect(result).toBe('the code');
  });

  it('removes a duplicate at the end of text', () => {
    const text = 'hello hello';
    const result = removeDuplicateWord(text, 6, 5);
    expect(result).toBe('hello');
  });

  it('removes duplicate separated by multiple spaces', () => {
    const text = 'the   the code';
    // Second "the" starts at index 6, length 3
    const result = removeDuplicateWord(text, 6, 3);
    expect(result).toBe('the code');
  });

  it('removes duplicate separated by newline', () => {
    const text = 'the\nthe code';
    // Second "the" starts at index 4, length 3
    const result = removeDuplicateWord(text, 4, 3);
    expect(result).toBe('the code');
  });

  it('removes duplicate separated by tab', () => {
    const text = 'the\tthe code';
    const result = removeDuplicateWord(text, 4, 3);
    expect(result).toBe('the code');
  });

  it('handles removal at the start of text (index 0, no preceding whitespace)', () => {
    // Edge case: if the duplicate is at index 0, there's no preceding whitespace
    const text = 'hello world';
    // Remove "hello" at index 0 — whitespaceStart stays at 0
    const result = removeDuplicateWord(text, 0, 5);
    expect(result).toBe(' world');
  });

  it('works correctly with iterative detect-then-remove pattern', () => {
    // The MCP handler and frontend use an iterative approach: detect, remove
    // the last duplicate, repeat. Because the detector reports the index of
    // the first word in the pair (due to indexOf behavior), removeDuplicateWord
    // removes the first occurrence. The iterative pattern still converges to
    // no duplicates remaining.
    let text = 'the the code is is good';
    let duplicates = detectDuplicateWords(text);
    while (duplicates.length > 0) {
      const d = duplicates[duplicates.length - 1];
      text = removeDuplicateWord(text, d.index, d.length);
      duplicates = detectDuplicateWords(text);
    }
    // After iterative removal, no duplicates remain
    expect(detectDuplicateWords(text).length).toBe(0);
  });

  it('handles removal with mixed whitespace (spaces, tabs, newlines)', () => {
    const text = 'word \t\n word rest';
    // Second "word" is at index 8 (after "word \t\n ")
    const result = removeDuplicateWord(text, 8, 4);
    expect(result).toBe('word rest');
  });
});
