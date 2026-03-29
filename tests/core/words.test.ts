import { describe, it, expect } from 'vitest';
import {
  weaselWords,
  additionalWeaselWords,
  allWeaselWords,
  irregularVerbs,
  auxiliaryVerbs,
} from '../../src/core/words';

describe('words.ts', () => {
  describe('weaselWords', () => {
    it('is a non-empty array of strings', () => {
      expect(Array.isArray(weaselWords)).toBe(true);
      expect(weaselWords.length).toBeGreaterThan(0);
      for (const word of weaselWords) {
        expect(typeof word).toBe('string');
        expect(word.length).toBeGreaterThan(0);
      }
    });

    it('contains known weasel words', () => {
      expect(weaselWords).toContain('very');
      expect(weaselWords).toContain('many');
      expect(weaselWords).toContain('extremely');
      expect(weaselWords).toContain('quite');
      expect(weaselWords).toContain('clearly');
    });

    it('contains multi-word phrases', () => {
      expect(weaselWords).toContain('are a number');
      expect(weaselWords).toContain('is a number');
    });

    it('has no duplicates', () => {
      const unique = new Set(weaselWords);
      expect(unique.size).toBe(weaselWords.length);
    });
  });

  describe('additionalWeaselWords', () => {
    it('is a non-empty array of strings', () => {
      expect(Array.isArray(additionalWeaselWords)).toBe(true);
      expect(additionalWeaselWords.length).toBeGreaterThan(0);
      for (const word of additionalWeaselWords) {
        expect(typeof word).toBe('string');
      }
    });

    it('contains known additional weasel words', () => {
      expect(additionalWeaselWords).toContain('basically');
      expect(additionalWeaselWords).toContain('literally');
      expect(additionalWeaselWords).toContain('obviously');
    });

    it('has no duplicates', () => {
      const unique = new Set(additionalWeaselWords);
      expect(unique.size).toBe(additionalWeaselWords.length);
    });

    it('does not overlap with base weaselWords', () => {
      const baseSet = new Set(weaselWords);
      for (const word of additionalWeaselWords) {
        expect(baseSet.has(word)).toBe(false);
      }
    });
  });

  describe('allWeaselWords', () => {
    it('is the concatenation of weaselWords and additionalWeaselWords', () => {
      expect(allWeaselWords).toEqual([...weaselWords, ...additionalWeaselWords]);
    });

    it('has the correct total count', () => {
      expect(allWeaselWords.length).toBe(weaselWords.length + additionalWeaselWords.length);
    });
  });

  describe('irregularVerbs', () => {
    it('is a non-empty array of strings', () => {
      expect(Array.isArray(irregularVerbs)).toBe(true);
      expect(irregularVerbs.length).toBeGreaterThan(0);
      for (const verb of irregularVerbs) {
        expect(typeof verb).toBe('string');
      }
    });

    it('contains known irregular past participles', () => {
      expect(irregularVerbs).toContain('written');
      expect(irregularVerbs).toContain('broken');
      expect(irregularVerbs).toContain('taken');
      expect(irregularVerbs).toContain('given');
      expect(irregularVerbs).toContain('done');
      expect(irregularVerbs).toContain('chosen');
    });

    it('has no duplicates', () => {
      const unique = new Set(irregularVerbs);
      expect(unique.size).toBe(irregularVerbs.length);
    });
  });

  describe('auxiliaryVerbs', () => {
    it('is a non-empty array of strings', () => {
      expect(Array.isArray(auxiliaryVerbs)).toBe(true);
      expect(auxiliaryVerbs.length).toBeGreaterThan(0);
    });

    it('contains all expected auxiliary verbs for passive voice', () => {
      expect(auxiliaryVerbs).toContain('am');
      expect(auxiliaryVerbs).toContain('are');
      expect(auxiliaryVerbs).toContain('were');
      expect(auxiliaryVerbs).toContain('being');
      expect(auxiliaryVerbs).toContain('is');
      expect(auxiliaryVerbs).toContain('been');
      expect(auxiliaryVerbs).toContain('was');
      expect(auxiliaryVerbs).toContain('be');
    });

    it('has exactly 8 auxiliary verbs', () => {
      expect(auxiliaryVerbs.length).toBe(8);
    });

    it('has no duplicates', () => {
      const unique = new Set(auxiliaryVerbs);
      expect(unique.size).toBe(auxiliaryVerbs.length);
    });
  });
});
