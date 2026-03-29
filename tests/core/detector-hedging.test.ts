import { describe, it, expect } from 'vitest';
import { detectHedging } from '../../src/core/detector';

describe('detectHedging', () => {
  it('returns empty for empty string', () => {
    expect(detectHedging('')).toEqual([]);
  });

  it('returns empty for clean text', () => {
    expect(detectHedging('The system works well.')).toEqual([]);
  });

  it('detects a single hedging phrase', () => {
    const results = detectHedging('I think this is correct.');
    expect(results).toHaveLength(1);
    expect(results[0].phrase).toBe('I think');
  });

  it('detects multiple hedging phrases', () => {
    const results = detectHedging('I think it seems like a problem.');
    expect(results).toHaveLength(2);
  });

  it('is case-insensitive', () => {
    const results = detectHedging('I THINK this works.');
    expect(results).toHaveLength(1);
  });

  it('detects phrase at start of text', () => {
    const results = detectHedging('I believe that is true.');
    expect(results).toHaveLength(1);
    expect(results[0].index).toBe(0);
  });

  it('does not detect partial matches', () => {
    // "think" alone is not "I think"
    expect(detectHedging('I need to think about it.')).toEqual([]);
  });

  it('returns correct index and length', () => {
    const text = 'Well, I think it works.';
    const results = detectHedging(text);
    expect(results).toHaveLength(1);
    expect(text.substring(results[0].index, results[0].index + results[0].length)).toBe('I think');
  });

  it('supports custom phrase list', () => {
    const custom = ['in my view'];
    expect(detectHedging('In my view, this is fine.', custom)).toHaveLength(1);
    expect(detectHedging('I think this is fine.', custom)).toHaveLength(0);
  });

  it('returns empty for empty custom list', () => {
    expect(detectHedging('I think this is fine.', [])).toEqual([]);
  });

  it('handles contractions', () => {
    const results = detectHedging("If I'm not mistaken, this is right.");
    expect(results).toHaveLength(1);
  });
});
