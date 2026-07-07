// Markdown-aware preprocessing for prose checking.
//
// Writing-style detectors expect prose, but Markdown docs are full of code
// blocks, inline code, and tables — none of which are prose. Linting them
// produces noise (e.g. `configuration` in a code sample, a "128-word sentence"
// that is really a table or a directory tree). Prose linters like Vale and
// proselint ignore these regions; we do the same.
//
// Masking replaces each non-prose character with a space and preserves every
// newline, so the masked text has the *same length and line layout* as the
// original. Detectors run on the masked text; offsets still map 1:1 back to
// the original file, so reported line/column numbers stay correct.

const blank = (s: string): string => s.replace(/[^\n]/g, ' ');

/** Return true for files that should be treated as Markdown. */
export function isMarkdownFile(path: string): boolean {
  return /\.(md|markdown|mdx)$/i.test(path);
}

/**
 * Blank out non-prose Markdown regions (fenced code blocks, inline code spans,
 * table rows, and HTML comments) while preserving the length and line layout
 * of the input so character offsets remain valid.
 */
export function maskMarkdown(input: string): string {
  const lines = input.split('\n');
  let inFence = false;
  let fenceChar = '';

  const masked = lines.map((line) => {
    const openMatch = line.match(/^\s*(`{3,}|~{3,})/);

    if (inFence) {
      // Inside a fenced block: blank the line, and close on a matching fence.
      const closeMatch = line.match(/^\s*(`{3,}|~{3,})\s*$/);
      if (closeMatch && closeMatch[1][0] === fenceChar) inFence = false;
      return blank(line);
    }

    if (openMatch) {
      inFence = true;
      fenceChar = openMatch[1][0];
      return blank(line);
    }

    // ATX headings are titles, not prose sentences. Blanking them stops a
    // heading from merging into the next paragraph's sentence (headings have
    // no terminating period) and drops heading-only nominalizations.
    if (/^\s{0,3}#{1,6}\s/.test(line)) return blank(line);

    // Table rows / separators (GFM tables using a leading pipe).
    if (/^\s*\|/.test(line)) return blank(line);

    // Inline code spans within an otherwise-prose line.
    return line.replace(/`[^`\n]*`/g, (m) => ' '.repeat(m.length));
  });

  let out = masked.join('\n');

  // HTML comments can span multiple lines; blank their contents (keeping
  // newlines). This also lets docs carry `<!-- ... -->` notes without linting.
  out = out.replace(/<!--[\s\S]*?-->/g, blank);

  return out;
}
