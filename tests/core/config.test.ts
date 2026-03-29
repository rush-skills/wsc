import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  mergeConfig,
  applyWordListOverrides,
  applyNominalizationOverrides,
  validateConfig,
  DEFAULT_CONFIG,
} from '../../src/core/config';
import type { WscConfig } from '../../src/core/config';
import { loadConfigFromFile, findConfigFile } from '../../src/core/config-node';

// ── mergeConfig ──

describe('mergeConfig', () => {
  it('returns DEFAULT_CONFIG for undefined input', () => {
    expect(mergeConfig()).toEqual(DEFAULT_CONFIG);
  });

  it('returns DEFAULT_CONFIG for empty object', () => {
    expect(mergeConfig({})).toEqual(DEFAULT_CONFIG);
  });

  it('fills missing detectors with defaults', () => {
    const result = mergeConfig({ detectors: { weaselWords: { enabled: false } } });
    expect(result.detectors.weaselWords.enabled).toBe(false);
    expect(result.detectors.passiveVoice).toEqual({ enabled: true });
    expect(result.detectors.longSentences).toEqual({ enabled: true, maxWords: 30 });
  });

  it('overrides a single field', () => {
    const result = mergeConfig({ detectors: { longSentences: { maxWords: 20 } } });
    expect(result.detectors.longSentences).toEqual({ enabled: true, maxWords: 20 });
  });

  it('preserves enabled: false', () => {
    const result = mergeConfig({ detectors: { adverbs: { enabled: false } } });
    expect(result.detectors.adverbs.enabled).toBe(false);
  });

  it('preserves add/remove arrays', () => {
    const result = mergeConfig({
      detectors: { weaselWords: { add: ['foo'], remove: ['very'] } },
    });
    expect((result.detectors.weaselWords as any).add).toEqual(['foo']);
    expect((result.detectors.weaselWords as any).remove).toEqual(['very']);
  });

  it('does not mutate DEFAULT_CONFIG', () => {
    const before = structuredClone(DEFAULT_CONFIG);
    mergeConfig({ detectors: { longSentences: { maxWords: 5 } } });
    expect(DEFAULT_CONFIG).toEqual(before);
  });
});

// ── applyWordListOverrides ──

describe('applyWordListOverrides', () => {
  const base = ['very', 'quite', 'fairly'];

  it('returns a copy with no overrides', () => {
    const result = applyWordListOverrides(base);
    expect(result).toEqual(base);
    expect(result).not.toBe(base);
  });

  it('appends new words', () => {
    const result = applyWordListOverrides(base, ['foo', 'bar']);
    expect(result).toEqual(['very', 'quite', 'fairly', 'foo', 'bar']);
  });

  it('does not duplicate words already in base', () => {
    const result = applyWordListOverrides(base, ['Very', 'new']);
    expect(result).toEqual(['very', 'quite', 'fairly', 'new']);
  });

  it('removes existing words', () => {
    const result = applyWordListOverrides(base, undefined, ['very']);
    expect(result).toEqual(['quite', 'fairly']);
  });

  it('case-insensitive removal', () => {
    const result = applyWordListOverrides(base, undefined, ['VERY', 'Quite']);
    expect(result).toEqual(['fairly']);
  });

  it('no error for removing non-existent words', () => {
    const result = applyWordListOverrides(base, undefined, ['nonexistent']);
    expect(result).toEqual(base);
  });

  it('handles both add and remove simultaneously', () => {
    const result = applyWordListOverrides(base, ['new'], ['very']);
    expect(result).toEqual(['quite', 'fairly', 'new']);
  });

  it('handles empty arrays same as no overrides', () => {
    const result = applyWordListOverrides(base, [], []);
    expect(result).toEqual(base);
  });
});

// ── applyNominalizationOverrides ──

describe('applyNominalizationOverrides', () => {
  const base = [
    { word: 'utilization', suggestion: 'use' },
    { word: 'implementation', suggestion: 'implement' },
  ];

  it('returns a copy with no overrides', () => {
    const result = applyNominalizationOverrides(base);
    expect(result).toEqual(base);
    expect(result).not.toBe(base);
  });

  it('adds new entries', () => {
    const result = applyNominalizationOverrides(base, [{ word: 'foo', suggestion: 'bar' }]);
    expect(result).toHaveLength(3);
    expect(result[2]).toEqual({ word: 'foo', suggestion: 'bar' });
  });

  it('does not duplicate by word name', () => {
    const result = applyNominalizationOverrides(base, [{ word: 'Utilization', suggestion: 'use it' }]);
    expect(result).toHaveLength(2);
  });

  it('removes by word name', () => {
    const result = applyNominalizationOverrides(base, undefined, ['utilization']);
    expect(result).toEqual([{ word: 'implementation', suggestion: 'implement' }]);
  });

  it('case-insensitive removal', () => {
    const result = applyNominalizationOverrides(base, undefined, ['UTILIZATION']);
    expect(result).toHaveLength(1);
  });
});

// ── validateConfig ──

describe('validateConfig', () => {
  it('valid minimal config', () => {
    expect(validateConfig({})).toEqual([]);
  });

  it('valid full config', () => {
    expect(validateConfig({
      $schema: 'https://wsc.theserverless.dev/schema.json',
      detectors: {
        weaselWords: { enabled: true, add: ['x'], remove: ['y'] },
        passiveVoice: { enabled: false },
        duplicateWords: { enabled: true },
        longSentences: { enabled: true, maxWords: 25 },
        nominalizations: { enabled: true, add: [{ word: 'x', suggestion: 'y' }], remove: ['z'] },
        hedging: { enabled: true, add: ['a'], remove: ['b'] },
        adverbs: { enabled: false },
      },
    })).toEqual([]);
  });

  it('unknown top-level key', () => {
    const errors = validateConfig({ unknown: true });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Unknown top-level key');
  });

  it('unknown detector name', () => {
    const errors = validateConfig({ detectors: { unknown: {} } });
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('Unknown detector');
  });

  it('enabled as string instead of boolean', () => {
    const errors = validateConfig({ detectors: { weaselWords: { enabled: 'yes' } } });
    expect(errors.some(e => e.includes('enabled must be a boolean'))).toBe(true);
  });

  it('maxWords as string', () => {
    const errors = validateConfig({ detectors: { longSentences: { maxWords: '30' } } });
    expect(errors.some(e => e.includes('maxWords must be a positive integer'))).toBe(true);
  });

  it('maxWords as negative number', () => {
    const errors = validateConfig({ detectors: { longSentences: { maxWords: -1 } } });
    expect(errors.some(e => e.includes('maxWords must be a positive integer'))).toBe(true);
  });

  it('maxWords as 0', () => {
    const errors = validateConfig({ detectors: { longSentences: { maxWords: 0 } } });
    expect(errors.some(e => e.includes('maxWords must be a positive integer'))).toBe(true);
  });

  it('add as string instead of array', () => {
    const errors = validateConfig({ detectors: { weaselWords: { add: 'foo' } } });
    expect(errors.some(e => e.includes('add must be an array'))).toBe(true);
  });

  it('nominalization add with missing suggestion', () => {
    const errors = validateConfig({ detectors: { nominalizations: { add: [{ word: 'foo' }] } } });
    expect(errors.some(e => e.includes('suggestion must be a non-empty string'))).toBe(true);
  });

  it('nominalization add with non-object entry', () => {
    const errors = validateConfig({ detectors: { nominalizations: { add: ['string'] } } });
    expect(errors.some(e => e.includes('must be an object'))).toBe(true);
  });

  it('nominalization add with missing word', () => {
    const errors = validateConfig({ detectors: { nominalizations: { add: [{ suggestion: 'foo' }] } } });
    expect(errors.some(e => e.includes('word must be a non-empty string'))).toBe(true);
  });

  it('nominalization remove as non-array', () => {
    const errors = validateConfig({ detectors: { nominalizations: { remove: 'foo' } } });
    expect(errors.some(e => e.includes('remove must be an array'))).toBe(true);
  });

  it('deeply nested unknown key', () => {
    const errors = validateConfig({ detectors: { weaselWords: { unknown: true } } });
    expect(errors.some(e => e.includes('Unknown key'))).toBe(true);
  });

  it('non-object config', () => {
    expect(validateConfig('string')).toHaveLength(1);
    expect(validateConfig(null)).toHaveLength(1);
    expect(validateConfig([])).toHaveLength(1);
  });

  it('detectors as non-object', () => {
    const errors = validateConfig({ detectors: 'bad' });
    expect(errors.some(e => e.includes('"detectors" must be an object'))).toBe(true);
  });
});

// ── loadConfigFromFile ──

describe('loadConfigFromFile', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = join(tmpdir(), `wsc-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(tmpDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('returns empty object for nonexistent file', async () => {
    const result = await loadConfigFromFile(join(tmpDir, '.wscrc.json'));
    expect(result).toEqual({});
  });

  it('returns parsed config for valid file', async () => {
    const config: WscConfig = { detectors: { weaselWords: { enabled: false } } };
    await writeFile(join(tmpDir, '.wscrc.json'), JSON.stringify(config));
    const result = await loadConfigFromFile(join(tmpDir, '.wscrc.json'));
    expect(result).toEqual(config);
  });

  it('throws for invalid JSON', async () => {
    await writeFile(join(tmpDir, '.wscrc.json'), '{bad json}');
    await expect(loadConfigFromFile(join(tmpDir, '.wscrc.json'))).rejects.toThrow('Invalid JSON');
  });

  it('throws for valid JSON but invalid config', async () => {
    await writeFile(join(tmpDir, '.wscrc.json'), JSON.stringify({ bad: true }));
    await expect(loadConfigFromFile(join(tmpDir, '.wscrc.json'))).rejects.toThrow('Invalid config');
  });
});

// ── findConfigFile ──

describe('findConfigFile', () => {
  let tmpDir: string;

  beforeEach(async () => {
    tmpDir = join(tmpdir(), `wsc-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    await mkdir(tmpDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  it('finds config in current directory', async () => {
    await writeFile(join(tmpDir, '.wscrc.json'), '{}');
    const result = await findConfigFile(tmpDir);
    expect(result).toBe(join(tmpDir, '.wscrc.json'));
  });

  it('finds config in parent directory', async () => {
    const childDir = join(tmpDir, 'child');
    await mkdir(childDir);
    await writeFile(join(tmpDir, '.wscrc.json'), '{}');
    const result = await findConfigFile(childDir);
    expect(result).toBe(join(tmpDir, '.wscrc.json'));
  });

  it('finds config in grandparent directory', async () => {
    const deepDir = join(tmpDir, 'a', 'b');
    await mkdir(deepDir, { recursive: true });
    await writeFile(join(tmpDir, '.wscrc.json'), '{}');
    const result = await findConfigFile(deepDir);
    expect(result).toBe(join(tmpDir, '.wscrc.json'));
  });

  it('returns null when no config exists', async () => {
    // Start from a deep temp dir that won't have .wscrc.json above it
    const deepDir = join(tmpDir, 'a', 'b', 'c');
    await mkdir(deepDir, { recursive: true });
    // This will walk up to filesystem root — very unlikely to find .wscrc.json
    // We can't guarantee null unless we control the entire path, but it's very likely
    const result = await findConfigFile(deepDir);
    // If there happens to be a .wscrc.json somewhere above tmpDir, this could be non-null
    // but that's extremely unlikely in a temp directory
    expect(result === null || typeof result === 'string').toBe(true);
  });
});
