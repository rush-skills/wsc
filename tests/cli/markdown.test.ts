import { describe, it, expect } from 'vitest';
import { maskMarkdown, isMarkdownFile } from '../../cli/markdown';

describe('isMarkdownFile', () => {
  it('recognizes markdown extensions', () => {
    expect(isMarkdownFile('README.md')).toBe(true);
    expect(isMarkdownFile('a/b/notes.markdown')).toBe(true);
    expect(isMarkdownFile('doc.MDX')).toBe(true);
    expect(isMarkdownFile('script.ts')).toBe(false);
    expect(isMarkdownFile('plain.txt')).toBe(false);
  });
});

describe('maskMarkdown', () => {
  it('preserves length and line count so offsets stay valid', () => {
    const input = '# Title\n\nHello world.\n\n```\ncode\n```\n';
    const out = maskMarkdown(input);
    expect(out.length).toBe(input.length);
    expect(out.split('\n').length).toBe(input.split('\n').length);
  });

  it('blanks fenced code blocks', () => {
    const input = 'Before.\n\n```js\nconst configuration = 1;\n```\n\nAfter.';
    const out = maskMarkdown(input);
    expect(out).not.toContain('configuration');
    expect(out).toContain('Before.');
    expect(out).toContain('After.');
  });

  it('blanks inline code but keeps surrounding prose', () => {
    const input = 'Run `npm run configuration` now.';
    const out = maskMarkdown(input);
    expect(out).not.toContain('configuration');
    expect(out).toContain('Run');
    expect(out).toContain('now.');
  });

  it('blanks table rows entirely', () => {
    const input = '| Detector | Description |\n| --- | --- |\n| weasel | very |';
    expect(maskMarkdown(input).trim()).toBe('');
  });

  it('blanks ATX headings', () => {
    expect(maskMarkdown('## Configuration System').trim()).toBe('');
  });

  it('blanks HTML comments (including their contents)', () => {
    const input = 'A <!-- hidden documentation --> B';
    const out = maskMarkdown(input);
    expect(out).not.toContain('documentation');
    expect(out).toContain('A ');
    expect(out).toContain('B');
  });

  it('leaves ordinary prose untouched', () => {
    const input = 'This is a normal sentence with words.';
    expect(maskMarkdown(input)).toBe(input);
  });

  it('blanks to end of input for an unterminated fence', () => {
    const out = maskMarkdown('text\n```\ncode line\nmore code');
    expect(out).toContain('text');
    expect(out).not.toContain('code line');
  });
});
