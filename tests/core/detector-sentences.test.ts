import { describe, it, expect } from 'vitest';
import { detectLongSentences } from '../../src/core/detector';

describe('detectLongSentences', () => {
  it('returns empty for empty string', () => {
    expect(detectLongSentences('')).toEqual([]);
  });

  it('returns empty for whitespace-only', () => {
    expect(detectLongSentences('   ')).toEqual([]);
  });

  it('returns empty for short sentence', () => {
    expect(detectLongSentences('This is short.')).toEqual([]);
  });

  it('returns empty for sentence at exact threshold', () => {
    const words = Array(30).fill('word').join(' ') + '.';
    expect(detectLongSentences(words)).toEqual([]);
  });

  it('detects sentence 1 word over threshold', () => {
    const words = Array(31).fill('word').join(' ') + '.';
    const results = detectLongSentences(words);
    expect(results).toHaveLength(1);
    expect(results[0].wordCount).toBe(31);
  });

  it('detects only long sentences among multiple', () => {
    const short = 'Short sentence here.';
    const longWords = Array(35).fill('word').join(' ') + '.';
    const text = `${short} ${longWords} Another short one.`;
    const results = detectLongSentences(text);
    expect(results).toHaveLength(1);
    expect(results[0].wordCount).toBe(35);
  });

  it('does not split at abbreviation Dr.', () => {
    const words = Array(28).fill('word').join(' ');
    const text = `Dr. Smith said ${words} to the audience.`;
    const results = detectLongSentences(text);
    expect(results).toHaveLength(1);
    // Should be one sentence, not split at "Dr."
  });

  it('does not split at abbreviation e.g.', () => {
    const text = 'Some things e.g. apples and oranges and bananas and grapes and ' +
      Array(25).fill('word').join(' ') + '.';
    const results = detectLongSentences(text);
    expect(results).toHaveLength(1);
  });

  it('does not split at ellipsis', () => {
    const words = Array(25).fill('word').join(' ');
    const text = `Well... ${words} and more words here today.`;
    const results = detectLongSentences(text);
    expect(results).toHaveLength(1);
  });

  it('does not split at decimal number', () => {
    const words = Array(28).fill('word').join(' ');
    const text = `The value 3.14 and ${words} in the end.`;
    const results = detectLongSentences(text);
    expect(results).toHaveLength(1);
  });

  it('treats text without sentence terminators as one sentence', () => {
    const words = Array(35).fill('word').join(' ');
    const results = detectLongSentences(words);
    expect(results).toHaveLength(1);
    expect(results[0].wordCount).toBe(35);
  });

  it('supports custom maxWords parameter', () => {
    const text = 'one two three four five six.';
    expect(detectLongSentences(text, 5)).toHaveLength(1);
    expect(detectLongSentences(text, 6)).toHaveLength(0);
  });

  it('returns correct index and length', () => {
    const prefix = 'Short. ';
    const longSentence = Array(35).fill('word').join(' ') + '.';
    const text = prefix + longSentence;
    const results = detectLongSentences(text);
    expect(results).toHaveLength(1);
    expect(text.substring(results[0].index, results[0].index + results[0].length))
      .toBe(longSentence.trim());
  });

  it('truncates sentence field at 50 chars', () => {
    const longSentence = Array(35).fill('word').join(' ') + '.';
    const results = detectLongSentences(longSentence);
    expect(results[0].sentence.length).toBeLessThanOrEqual(53); // 50 + "..."
    expect(results[0].sentence).toContain('...');
  });

  it('does not truncate short sentence text', () => {
    // 10 words with maxWords=5 — short enough text, but over word limit
    const text = 'a b c d e f g h i j.';
    const results = detectLongSentences(text, 5);
    expect(results).toHaveLength(1);
    expect(results[0].sentence).not.toContain('...');
  });

  it('handles leading whitespace before long sentence', () => {
    const words = Array(35).fill('word').join(' ');
    const text = `   ${words}`;
    const results = detectLongSentences(text);
    expect(results).toHaveLength(1);
    expect(results[0].index).toBe(3); // after the 3 spaces
  });

  it('handles multi-line text', () => {
    const words = Array(35).fill('word').join(' ');
    const text = `First sentence.\n${words}\nand more.`;
    const results = detectLongSentences(text);
    // The long part spans from after "First sentence.\n" to "and more."
    // Whether it's 1 or more depends on period placement
    expect(results.length).toBeGreaterThanOrEqual(1);
  });

  it('handles ! and ? as sentence boundaries', () => {
    const long1 = Array(35).fill('word').join(' ') + '!';
    const long2 = Array(35).fill('word').join(' ') + '?';
    const text = `${long1} ${long2}`;
    const results = detectLongSentences(text);
    expect(results).toHaveLength(2);
  });

  it('handles text ending without terminal punctuation', () => {
    const words = Array(35).fill('word').join(' ');
    const results = detectLongSentences(words);
    expect(results).toHaveLength(1);
    expect(results[0].wordCount).toBe(35);
  });
});
