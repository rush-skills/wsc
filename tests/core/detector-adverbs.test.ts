import { describe, it, expect } from 'vitest';
import { detectAdverbs } from '../../src/core/detector';
import { fillerAdverbs, allWeaselWords } from '../../src/core/words';

describe('detectAdverbs', () => {
  it('returns empty for empty string', () => {
    expect(detectAdverbs('')).toEqual([]);
  });

  it('returns empty for clean text', () => {
    expect(detectAdverbs('The system works well.')).toEqual([]);
  });

  it('detects a single filler adverb', () => {
    const results = detectAdverbs('This is totally wrong.');
    expect(results).toHaveLength(1);
    expect(results[0].word).toBe('totally');
  });

  it('detects multiple adverbs', () => {
    const results = detectAdverbs('This is totally and utterly wrong.');
    expect(results).toHaveLength(2);
  });

  it('is case-insensitive', () => {
    const results = detectAdverbs('TOTALLY wrong.');
    expect(results).toHaveLength(1);
  });

  it('matches whole words only', () => {
    expect(detectAdverbs('The fundamentals are solid.')).toEqual([]);
  });

  it('returns correct index and length', () => {
    const text = 'It is truly amazing.';
    const results = detectAdverbs(text);
    expect(results).toHaveLength(1);
    expect(text.substring(results[0].index, results[0].index + results[0].length)).toBe('truly');
  });

  it('supports custom word list', () => {
    const custom = ['really', 'super'];
    expect(detectAdverbs('This is really super cool.', custom)).toHaveLength(2);
    expect(detectAdverbs('This is totally cool.', custom)).toHaveLength(0);
  });

  it('returns empty for empty custom list', () => {
    expect(detectAdverbs('This is totally cool.', [])).toEqual([]);
  });

  it('has no overlap with weasel words list', () => {
    const weaselSet = new Set(allWeaselWords.map(w => w.toLowerCase()));
    const overlap = fillerAdverbs.filter(a => weaselSet.has(a.toLowerCase()));
    expect(overlap).toEqual([]);
  });
});
