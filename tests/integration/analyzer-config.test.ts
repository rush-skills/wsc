import { describe, it, expect } from 'vitest';
import { analyzeText } from '../../src/core/analyzer';

const REALISTIC = `The implementation of the optimization was written very quickly.
I think the utilization of this approach is totally justified.
The the code was basically done done by the team.
This is a long sentence that goes on and on and on with many many words to ensure we exceed the default threshold of thirty words which should definitely trigger the long sentence detector here.`;

describe('analyzer + config integration', () => {
  it('default config detects all 8 issue types in realistic text', () => {
    const result = analyzeText(REALISTIC);
    expect(result.summary.weaselWords).toBeGreaterThan(0);
    expect(result.summary.passiveVoice).toBeGreaterThan(0);
    expect(result.summary.duplicateWords).toBeGreaterThan(0);
    expect(result.summary.longSentences).toBeGreaterThan(0);
    expect(result.summary.nominalizations).toBeGreaterThan(0);
    expect(result.summary.hedging).toBeGreaterThan(0);
    expect(result.summary.adverbs).toBeGreaterThan(0);
  });

  it('disabling all detectors yields zero issues', () => {
    const result = analyzeText(REALISTIC, {
      detectors: {
        weaselWords: { enabled: false },
        passiveVoice: { enabled: false },
        duplicateWords: { enabled: false },
        longSentences: { enabled: false },
        nominalizations: { enabled: false },
        hedging: { enabled: false },
        adverbs: { enabled: false },
      },
    });
    expect(result.summary.total).toBe(0);
  });

  it('adding a custom weasel word detects it', () => {
    const result = analyzeText('This is synergy at its finest.', {
      detectors: { weaselWords: { add: ['synergy'] } },
    });
    expect(result.issues.weaselWords.some(w => w.word.toLowerCase() === 'synergy')).toBe(true);
  });

  it('removing a weasel word stops detecting it', () => {
    const result = analyzeText('This is very good.', {
      detectors: { weaselWords: { remove: ['very'] } },
    });
    expect(result.issues.weaselWords.some(w => w.word.toLowerCase() === 'very')).toBe(false);
  });

  it('custom maxWords for long sentences', () => {
    const text = 'one two three four five six seven eight nine ten eleven.';
    const strict = analyzeText(text, { detectors: { longSentences: { maxWords: 5 } } });
    const loose = analyzeText(text, { detectors: { longSentences: { maxWords: 50 } } });
    expect(strict.summary.longSentences).toBe(1);
    expect(loose.summary.longSentences).toBe(0);
  });

  it('adding a nominalization detects it', () => {
    const result = analyzeText('The monetization plan is ready.', {
      detectors: { nominalizations: { add: [{ word: 'monetization', suggestion: 'monetize' }] } },
    });
    expect(result.issues.nominalizations.some(n => n.word.toLowerCase() === 'monetization')).toBe(true);
    expect(result.issues.nominalizations.find(n => n.word.toLowerCase() === 'monetization')?.suggestion).toBe('monetize');
  });

  it('removing a nominalization stops detecting it', () => {
    const result = analyzeText('The utilization is high.', {
      detectors: { nominalizations: { remove: ['utilization'] } },
    });
    expect(result.issues.nominalizations.some(n => n.word.toLowerCase() === 'utilization')).toBe(false);
  });

  it('adding a hedging phrase detects it', () => {
    const result = analyzeText('At the end of the day, this works.', {
      detectors: { hedging: { add: ['at the end of the day'] } },
    });
    expect(result.issues.hedging.length).toBeGreaterThan(0);
  });

  it('adding a filler adverb detects it', () => {
    const result = analyzeText('This is super cool.', {
      detectors: { adverbs: { add: ['super'] } },
    });
    expect(result.issues.adverbs.some(a => a.word.toLowerCase() === 'super')).toBe(true);
  });

  it('multiple config overrides combine correctly', () => {
    const result = analyzeText('This is very good and totally fine.', {
      detectors: {
        weaselWords: { remove: ['very'] },
        adverbs: { enabled: false },
      },
    });
    expect(result.issues.weaselWords.some(w => w.word.toLowerCase() === 'very')).toBe(false);
    expect(result.issues.adverbs).toEqual([]);
  });

  it('meta.sentenceCount is reasonable', () => {
    const result = analyzeText('First. Second! Third?');
    expect(result.meta.sentenceCount).toBe(3);
  });

  it('meta.wordCount is correct', () => {
    const result = analyzeText('one two three');
    expect(result.meta.wordCount).toBe(3);
  });

  it('config is included in result', () => {
    const result = analyzeText('test', { detectors: { longSentences: { maxWords: 15 } } });
    expect((result.config.detectors.longSentences as any).maxWords).toBe(15);
  });
});
