import { describe, it, expect } from 'vitest';
import { detectNominalizations } from '../../src/core/detector';

describe('detectNominalizations', () => {
  it('returns empty for empty string', () => {
    expect(detectNominalizations('')).toEqual([]);
  });

  it('returns empty for clean text', () => {
    expect(detectNominalizations('The team worked hard.')).toEqual([]);
  });

  it('detects a single nominalization', () => {
    const results = detectNominalizations('The utilization of resources is high.');
    expect(results).toHaveLength(1);
    expect(results[0].word).toBe('utilization');
    expect(results[0].suggestion).toBe('use');
  });

  it('detects multiple nominalizations', () => {
    const results = detectNominalizations('The implementation and optimization were good.');
    expect(results).toHaveLength(2);
  });

  it('is case-insensitive', () => {
    const results = detectNominalizations('The UTILIZATION was noted.');
    expect(results).toHaveLength(1);
    expect(results[0].suggestion).toBe('use');
  });

  it('matches whole words only', () => {
    // "mentation" is not "implementation"
    expect(detectNominalizations('mentation is not a word.')).toEqual([]);
  });

  it('returns correct index and length', () => {
    const text = 'The utilization was clear.';
    const results = detectNominalizations(text);
    expect(results[0].index).toBe(4);
    expect(results[0].length).toBe(11);
    expect(text.substring(results[0].index, results[0].index + results[0].length)).toBe('utilization');
  });

  it('returns correct suggestion', () => {
    const results = detectNominalizations('The management of the project.');
    expect(results).toHaveLength(1);
    expect(results[0].suggestion).toBe('manage');
  });

  it('supports custom word list', () => {
    const custom = [{ word: 'foo', suggestion: 'bar' }];
    expect(detectNominalizations('The foo was here.', custom)).toHaveLength(1);
    expect(detectNominalizations('The utilization was here.', custom)).toHaveLength(0);
  });

  it('returns empty for empty custom list', () => {
    expect(detectNominalizations('The utilization was here.', [])).toEqual([]);
  });
});
