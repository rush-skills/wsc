import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { exitCode, run } from '../../cli/cli';

// Text guaranteed to trip several detectors (passive voice, filler adverb).
const NOISY = 'The code was written very quickly.\n';
const CLEAN = 'The team wrote good code today.\n';

describe('exitCode policy', () => {
  it('never fails when maxWarnings is negative (unlimited/annotate-only)', () => {
    expect(exitCode(0, -1)).toBe(0);
    expect(exitCode(999, -1)).toBe(0);
  });

  it('fails on any issue when maxWarnings is 0', () => {
    expect(exitCode(0, 0)).toBe(0);
    expect(exitCode(1, 0)).toBe(1);
  });

  it('fails only above the threshold', () => {
    expect(exitCode(5, 5)).toBe(0);
    expect(exitCode(6, 5)).toBe(1);
    expect(exitCode(3, 10)).toBe(0);
  });

  it('coerces string thresholds (cac may pass strings)', () => {
    expect(exitCode(6, '5' as unknown as number)).toBe(1);
    expect(exitCode(4, '5' as unknown as number)).toBe(0);
  });
});

describe('run() — exit codes propagate (regression: cac swallows action returns)', () => {
  let dir: string;
  let out: ReturnType<typeof vi.spyOn>;
  let err: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'wsc-cli-'));
    out = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
    err = vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
  });

  afterEach(() => {
    out.mockRestore();
    err.mockRestore();
    rmSync(dir, { recursive: true, force: true });
  });

  it('returns 0 for a file with issues under the default (-1)', async () => {
    const f = join(dir, 'doc.md');
    writeFileSync(f, NOISY);
    expect(await run(['node', 'wsc', 'check', f, '--quiet'])).toBe(0);
  });

  it('returns 1 when issues exceed --max-warnings', async () => {
    const f = join(dir, 'doc.md');
    writeFileSync(f, NOISY);
    expect(await run(['node', 'wsc', 'check', f, '--quiet', '--max-warnings', '0'])).toBe(1);
  });

  it('returns 0 when issues stay within --max-warnings', async () => {
    const f = join(dir, 'doc.md');
    writeFileSync(f, NOISY);
    expect(await run(['node', 'wsc', 'check', f, '--quiet', '--max-warnings', '100000'])).toBe(0);
  });

  it('returns 0 for clean text even at --max-warnings 0', async () => {
    const f = join(dir, 'doc.md');
    writeFileSync(f, CLEAN);
    expect(await run(['node', 'wsc', 'check', f, '--quiet', '--max-warnings', '0'])).toBe(0);
  });

  it('returns 2 when no files match the glob', async () => {
    expect(await run(['node', 'wsc', 'check', join(dir, 'nothing-*.md'), '--quiet'])).toBe(2);
  });
});

describe('run() — glob ignores node_modules', () => {
  let dir: string;
  let cwd: string;
  let out: ReturnType<typeof vi.spyOn>;
  let captured: string;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'wsc-ignore-'));
    writeFileSync(join(dir, 'doc.md'), NOISY);
    mkdirSync(join(dir, 'node_modules', 'pkg'), { recursive: true });
    writeFileSync(join(dir, 'node_modules', 'pkg', 'readme.md'), NOISY);
    captured = '';
    out = vi.spyOn(process.stdout, 'write').mockImplementation((s: any) => {
      captured += String(s);
      return true;
    });
    cwd = process.cwd();
    process.chdir(dir);
  });

  afterEach(() => {
    process.chdir(cwd);
    out.mockRestore();
    rmSync(dir, { recursive: true, force: true });
  });

  it('matches only real docs, not node_modules markdown', async () => {
    await run(['node', 'wsc', 'check', '**/*.md', '--format', 'json']);
    const results = JSON.parse(captured);
    expect(results).toHaveLength(1);
    expect(results[0].file).toContain('doc.md');
    expect(results[0].file).not.toContain('node_modules');
  });
});
