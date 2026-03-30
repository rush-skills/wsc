import { describe, it, expect } from 'vitest';
import { detectAiTells } from '../../src/core/detector';
import { aiTellsVocabulary, aiTellsPhrases } from '../../src/core/words';

describe('detectAiTells', () => {
  it('returns empty for empty string', () => {
    expect(detectAiTells('')).toEqual([]);
  });

  it('returns empty for clean text', () => {
    expect(detectAiTells('The system works well and is fast.')).toEqual([]);
  });

  it('detects a vocabulary tell', () => {
    const results = detectAiTells('We need to delve into this problem.');
    expect(results).toHaveLength(1);
    expect(results[0].text).toBe('delve');
    expect(results[0].reason).toContain('delve');
  });

  it('detects multiple vocabulary tells', () => {
    const results = detectAiTells('This comprehensive and pivotal approach is transformative.');
    expect(results.length).toBeGreaterThanOrEqual(3);
  });

  it('is case-insensitive for vocabulary', () => {
    const results = detectAiTells('DELVE into it.');
    expect(results).toHaveLength(1);
    expect(results[0].text).toBe('DELVE');
  });

  it('matches whole words only for vocabulary', () => {
    // "realm" should not match inside "unrealm" or similar
    expect(detectAiTells('The unrealm is vast.')).toEqual([]);
  });

  it('detects phrase tells', () => {
    const results = detectAiTells("It's important to note that this matters.");
    expect(results).toHaveLength(1);
    expect(results[0].reason).toContain('hedging');
  });

  it('detects phrase tells case-insensitively', () => {
    const results = detectAiTells("IN TODAY'S FAST-PACED WORLD, we must adapt.");
    expect(results).toHaveLength(1);
  });

  it('returns correct index and length for vocabulary', () => {
    const text = 'We should delve deeper.';
    const results = detectAiTells(text);
    expect(results).toHaveLength(1);
    expect(text.substring(results[0].index, results[0].index + results[0].length)).toBe('delve');
  });

  it('returns correct index and length for phrases', () => {
    const text = "Yes, let's dive in to the topic.";
    const results = detectAiTells(text);
    expect(results).toHaveLength(1);
    expect(text.substring(results[0].index, results[0].index + results[0].length)).toBe("let's dive in");
  });

  it('accepts custom vocabulary list', () => {
    const customVocab = [{ word: 'synergy', reason: 'Custom AI tell' }];
    const results = detectAiTells('We need more synergy.', customVocab, []);
    expect(results).toHaveLength(1);
    expect(results[0].text).toBe('synergy');
  });

  it('accepts custom phrase list', () => {
    const customPhrases = [{ phrase: 'circle back', reason: 'Corporate AI tell' }];
    const results = detectAiTells("Let's circle back on this.", [], customPhrases);
    expect(results).toHaveLength(1);
    expect(results[0].text).toBe('circle back');
  });

  it('returns results sorted by position', () => {
    const text = 'This pivotal and comprehensive approach leveraging new paradigms.';
    const results = detectAiTells(text);
    for (let i = 1; i < results.length; i++) {
      expect(results[i].index).toBeGreaterThanOrEqual(results[i - 1].index);
    }
  });

  it('default vocabulary list has expected entries', () => {
    expect(aiTellsVocabulary.length).toBeGreaterThan(30);
    expect(aiTellsVocabulary.some(v => v.word === 'delve')).toBe(true);
    expect(aiTellsVocabulary.some(v => v.word === 'tapestry')).toBe(true);
  });

  it('default phrase list has expected entries', () => {
    expect(aiTellsPhrases.length).toBeGreaterThan(20);
    expect(aiTellsPhrases.some(p => p.phrase === "let's dive in")).toBe(true);
    expect(aiTellsPhrases.some(p => p.phrase === 'great question')).toBe(true);
  });

  it('each vocabulary entry has word and reason', () => {
    for (const entry of aiTellsVocabulary) {
      expect(typeof entry.word).toBe('string');
      expect(entry.word.length).toBeGreaterThan(0);
      expect(typeof entry.reason).toBe('string');
      expect(entry.reason.length).toBeGreaterThan(0);
    }
  });

  it('each phrase entry has phrase and reason', () => {
    for (const entry of aiTellsPhrases) {
      expect(typeof entry.phrase).toBe('string');
      expect(entry.phrase.length).toBeGreaterThan(0);
      expect(typeof entry.reason).toBe('string');
      expect(entry.reason.length).toBeGreaterThan(0);
    }
  });
});
