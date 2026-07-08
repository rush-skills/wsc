# Week 1 Pre-flight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix every verified defect and stale-docs bug in WSC, unify Markdown handling across all six surfaces, and reposition the product AI-tells-first — so the Week 2-4 distribution push lands on a product that converts.

**Architecture:** All detection changes happen in `src/core/` (the single engine every surface calls via `analyzeText`). Markdown masking moves from `cli/markdown.ts` into core as an `analyzeText` option so the web editor, API, and both MCP servers gain it without duplicating logic. CLI/metadata/copy changes are surface-local.

**Tech Stack:** SvelteKit + Svelte 5, TypeScript, Vitest, Cloudflare Workers, cac (CLI), picocolors, @modelcontextprotocol/sdk + zod (mcp-server).

## Global Constraints

- Default branch is `master`; commit directly to it (no worktree — this session works in place).
- Every commit message ends with `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- CI runs `npm run check`, `npm test`, `npm run build` on Node 20 + 22 — all must stay green.
- The dogfood workflow gates at **zero** writing-style warnings on `**/*.md`. After every docs/copy edit, run `node cli/dist/cli/index.js check "**/*.md" --max-warnings 0` (rebuild the CLI first if core changed: `cd cli && npm run build`).
- `src/core/config.ts` must stay free of Node.js imports; Node-only code goes in `src/core/config-node.ts` (only cli/ and mcp-server/ may import it).
- `AnalysisResult`'s existing shape is a public API/MCP contract — additive changes only.
- Do not run `npm publish` or `npx wrangler deploy`; those are handoff commands for Ankur (Task 10).
- Run single test files with: `npx vitest run tests/core/detector.test.ts`

**Deviations from the spec, decided during planning (spec: `docs/superpowers/specs/2026-07-08-a-plus-distribution-sprint-design.md`):**
1. The spec's passive-voice stoplist included `used` — **do not add it**. "The library was used by many" is genuine passive voice; blocking `used` creates false negatives.
2. The spec said to add a Cloudflare Web Analytics beacon — **skip it**. `src/app.html` already loads Google Analytics (gtag `G-38BW8P5GZN`); adding a second tracker is redundant. The privacy-wording fix (Task 8) covers the honesty requirement.
3. The CLI already masks Markdown by default with a `--no-markdown` opt-out; core adopts that exact behavior rather than inventing a new flag shape.

---

### Task 1: Passive-voice detector upgrade

**Files:**
- Modify: `src/core/detector.ts:54-83` (`detectPassiveVoice`)
- Modify: `src/core/words.ts:378-387` (`auxiliaryVerbs`)
- Test: `tests/core/detector.test.ts` (existing `describe('detectPassiveVoice')` block)

**Interfaces:**
- Consumes: nothing new.
- Produces: `detectPassiveVoice(text: string)` — same signature, same return type `Array<{ phrase: string; index: number; length: number }>`. The matched `phrase` may now include gap words (e.g. `"was not fixed"`).

- [ ] **Step 1: Check for contract tests pinning list sizes**

Run: `grep -rn "auxiliaryVerbs" tests/`
If any test asserts `auxiliaryVerbs.length` (e.g. `toBe(8)`), note it — Step 4 changes the length to 13 and that assertion must be updated in the same commit.

- [ ] **Step 2: Write the failing tests**

Add to the `describe('detectPassiveVoice')` block in `tests/core/detector.test.ts`:

```ts
it('detects passive voice with an adverb between auxiliary and participle', () => {
  const results = detectPassiveVoice('The cake was quickly eaten.');
  expect(results.length).toBe(1);
  expect(results[0].phrase.toLowerCase()).toBe('was quickly eaten');
});

it('detects negated passive voice', () => {
  const results = detectPassiveVoice('The bug was not fixed.');
  expect(results.length).toBe(1);
  expect(results[0].phrase.toLowerCase()).toBe('was not fixed');
});

it('detects passive with two gap words', () => {
  const results = detectPassiveVoice('The bug was not fully fixed.');
  expect(results.length).toBe(1);
  expect(results[0].phrase.toLowerCase()).toBe('was not fully fixed');
});

it('detects get-passives', () => {
  const results = detectPassiveVoice('He got hit by a car.');
  expect(results.length).toBe(1);
  expect(results[0].phrase.toLowerCase()).toBe('got hit');
});

it('does not flag copula + adjective/noun ending in -ed', () => {
  expect(detectPassiveVoice('There is need for caution.')).toEqual([]);
  expect(detectPassiveVoice('He was tired.')).toEqual([]);
  expect(detectPassiveVoice('She is talented.')).toEqual([]);
  expect(detectPassiveVoice('That was speed.')).toEqual([]);
  expect(detectPassiveVoice('That was greed.')).toEqual([]);
});

it('still flags genuine passives whose participle is also common as an adjective', () => {
  // 'used' must NOT be in the stoplist (deviation #1 in the plan header)
  const results = detectPassiveVoice('The library was used by many teams.');
  expect(results.length).toBe(1);
});
```

- [ ] **Step 3: Run tests to verify the new ones fail**

Run: `npx vitest run tests/core/detector.test.ts`
Expected: the 5 new `it` blocks FAIL (adverb-gap/negation/get-passive find 0 matches; "was tired"/"is need"/"was greed" each find 1); all pre-existing tests PASS.

- [ ] **Step 4: Implement**

In `src/core/words.ts`, extend `auxiliaryVerbs` (keep the existing eight, append the get-forms):

```ts
// Auxiliary verbs used in passive voice (be-forms plus get-passives)
export const auxiliaryVerbs = [
  "am",
  "are",
  "were",
  "being",
  "is",
  "been",
  "was",
  "be",
  "get",
  "gets",
  "got",
  "gotten",
  "getting",
];
```

In `src/core/detector.ts`, replace the body of `detectPassiveVoice` between the `results` declaration and the `while` loop:

```ts
  const regularPattern = "\\w+ed";
  const allVerbs = `${regularPattern}|${irregularVerbs.join("|")}`;

  // Common adjectives/nouns ending in "ed"-like letters that are not past
  // participles ("was tired", "there is need"). 'used' is deliberately
  // absent: "was used by" is genuine passive.
  const notParticiples =
    "indeed|red|bed|naked|sacred|wretched|hundred|wicked|hatred|kindred|" +
    "need|speed|greed|seed|deed|creed|feed|breed|tweed|" +
    "tired|talented|gifted|excited|interested|supposed";

  // \s+ (not literal spaces) so passives spanning a hard line wrap still
  // match. Up to two gap words (negation or -ly adverb) may sit between the
  // auxiliary and the participle: "was not fully fixed".
  const passivePattern = new RegExp(
    `\\b(${auxiliaryVerbs.join("|")})\\b\\s+(?:(?:not|never|\\w+ly)\\s+){0,2}(?!(?:${notParticiples})\\b)(${allVerbs})\\b`,
    "gi"
  );
```

- [ ] **Step 5: Run the full core test file**

Run: `npx vitest run tests/core/detector.test.ts`
Expected: PASS. If a pre-existing test now fails because a gap word extended a match's `phrase`/`length`, update that test's expectation — the longer span is the intended new behavior.

- [ ] **Step 6: Run the whole suite and the dogfood check**

Run: `npm test && (cd cli && npm run build) && node cli/dist/cli/index.js check "**/*.md" --max-warnings 0`
Expected: all tests pass; dogfood reports `No issues found`. If the dogfood run now flags a genuine passive in our own docs (the detector got stricter), rewrite that sentence in the doc — do not suppress.

- [ ] **Step 7: Commit**

```bash
git add src/core/detector.ts src/core/words.ts tests/
git commit -m "fix(core): passive voice catches gap words and get-passives, stops flagging copula+adjective

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Phrase matching and duplicate-word correctness (paragraph bound + Unicode)

**Files:**
- Modify: `src/core/detector.ts:22-24` (`flexibleSource`), `src/core/detector.ts:85-111` (`detectDuplicateWords`)
- Test: `tests/core/detector.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: same signatures. `flexibleSource` is used by weasel/hedging/AI-tells phrase matching — behavior change: multi-word phrases no longer match across blank lines.

- [ ] **Step 1: Write the failing tests**

```ts
describe('multi-word phrase boundaries', () => {
  it('does not match a phrase across a paragraph break', () => {
    const results = detectWeaselWords('It was kind\n\nOf course it worked.');
    expect(results.filter(r => /kind\s+of/i.test(r.word))).toEqual([]);
  });

  it('still matches a phrase across a single hard-wrapped line', () => {
    const results = detectWeaselWords('It was kind\nof working.');
    expect(results.some(r => /kind\s*\nof/i.test(r.word) || /kind of/i.test(r.word.replace(/\s+/g, ' ')))).toBe(true);
  });
});

describe('detectDuplicateWords unicode', () => {
  it('detects duplicated words containing non-ASCII letters', () => {
    const results = detectDuplicateWords('The café café was nice.');
    expect(results.length).toBe(1);
    expect(results[0].word).toBe('café');
  });
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run tests/core/detector.test.ts`
Expected: paragraph-break test FAILS (a match spanning `\n\n` is found), café test FAILS (0 results). The single-newline test may already pass — that is fine; it pins existing behavior.

- [ ] **Step 3: Implement**

In `src/core/detector.ts` replace `flexibleSource`:

```ts
// Multi-word entries should survive hard-wrapped lines ("kind\nof") and curly
// apostrophes ("it's"), so spaces become flexible whitespace and ' matches
// either apostrophe. The whitespace run may contain at most one newline —
// a blank line is a paragraph break, and phrases don't span paragraphs.
function flexibleSource(str: string): string {
  return escapeForRegex(str)
    .replace(/ /g, '(?:(?!\\n[ \\t\\r]*\\n)\\s)+')
    .replace(/'/g, "['’]");
}
```

Replace the regex in `detectDuplicateWords` (keep the rest of the function identical, including the `lastIndex` resumption):

```ts
  const regex = /(?<![\p{L}\p{N}_])([\p{L}\p{N}_]+)\s+(\1)(?![\p{L}\p{N}_])/giu;
```

- [ ] **Step 4: Run the full suite**

Run: `npm test`
Expected: PASS. `svelte-check` too: `npm run check`.

- [ ] **Step 5: Commit**

```bash
git add src/core/detector.ts tests/core/detector.test.ts
git commit -m "fix(core): phrases stop matching across paragraph breaks; duplicate words handle non-ASCII letters

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Move Markdown masking into core with sentinel-based inline masking

**Files:**
- Create: `src/core/markdown.ts` (moved + upgraded from `cli/markdown.ts`)
- Delete: `cli/markdown.ts`
- Modify: `src/core/analyzer.ts` (new `options` param), `src/core/index.ts` (re-export), `cli/cli.ts` (imports + call sites), `cli/formatter.ts` (`truncate` strips sentinels)
- Test: move `tests/cli/markdown.test.ts` → `tests/core/markdown.test.ts`; extend it; add analyzer option tests in `tests/core/analyzer.test.ts` (create the describe block if the file lacks one)

**Interfaces:**
- Consumes: nothing new.
- Produces (relied on by Tasks 4, 5):
  - `src/core/markdown.ts`: `export function maskMarkdown(input: string): string`, `export function isMarkdownFile(path: string): boolean` — both re-exported from `src/core/index.ts`.
  - `src/core/analyzer.ts`: `export interface AnalyzeOptions { markdown?: boolean }` and `analyzeText(text: string, config?: WscConfig, options?: AnalyzeOptions): AnalysisResult`. When `options.markdown` is true, detectors run on `maskMarkdown(text)`; offsets remain valid against the original (masking preserves length).

- [ ] **Step 1: Move the file and its tests**

```bash
git mv cli/markdown.ts src/core/markdown.ts
git mv tests/cli/markdown.test.ts tests/core/markdown.test.ts
```

Update the import path inside `tests/core/markdown.test.ts` to `../../src/core/markdown` (match the import style of neighboring files in `tests/core/`).

- [ ] **Step 2: Write the failing tests for sentinel masking**

Add to `tests/core/markdown.test.ts`:

```ts
import { analyzeText } from '../../src/core/analyzer';

describe('inline masking does not create false adjacency', () => {
  it('does not flag duplicate words bridged by an inline code span', () => {
    const result = analyzeText('Run `npm` run build', undefined, { markdown: true });
    expect(result.issues.duplicateWords).toEqual([]);
  });

  it('does not flag passive voice bridged by an inline code span', () => {
    const result = analyzeText('The flag was `--force` deleted.', undefined, { markdown: true });
    expect(result.issues.passiveVoice).toEqual([]);
  });

  it('keeps offsets valid: a weasel word after an inline span maps to the original text', () => {
    const text = 'Use `x` very carefully.';
    const result = analyzeText(text, undefined, { markdown: true });
    const very = result.issues.weaselWords.find(w => w.word.toLowerCase() === 'very');
    expect(very).toBeDefined();
    expect(text.substring(very!.index, very!.index + very!.length)).toBe('very');
  });
});

describe('analyzeText markdown option', () => {
  it('masks fenced code blocks when markdown: true', () => {
    const text = 'Fine prose.\n```\nvery basically utilize\n```\n';
    expect(analyzeText(text, undefined, { markdown: true }).issues.weaselWords).toEqual([]);
    expect(analyzeText(text).issues.weaselWords.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 3: Run to verify the new tests fail**

Run: `npx vitest run tests/core/markdown.test.ts`
Expected: FAIL — `analyzeText` does not accept a third argument yet (TypeScript error) and the adjacency cases flag issues.

- [ ] **Step 4: Upgrade `src/core/markdown.ts` to sentinel masking**

Replace the file's masking internals (keep the header comment, extend it):

```ts
// Masking replaces non-prose regions while preserving length and line layout,
// so offsets map 1:1 back to the original. Two masking modes:
//  - whole-line constructs (fences, headings, tables) blank to SPACES, so a
//    blanked line still reads as a paragraph break to the sentence splitter;
//  - inline constructs (code spans, single-line HTML comments) blank to a NUL
//    sentinel, which is neither \s nor \w, so the words on either side do not
//    become adjacent ("Run `npm` run" must not read as "Run run").

const SENTINEL = '\u0000';
const blankLine = (s: string): string => s.replace(/[^\n]/g, ' ');
const blankInline = (s: string): string => SENTINEL.repeat(s.length);

/** Return true for files that should be treated as Markdown. */
export function isMarkdownFile(path: string): boolean {
  return /\.(md|markdown|mdx)$/i.test(path);
}

export function maskMarkdown(input: string): string {
  const lines = input.split('\n');
  let inFence = false;
  let fenceChar = '';

  const masked = lines.map((line) => {
    const openMatch = line.match(/^\s*(`{3,}|~{3,})/);

    if (inFence) {
      const closeMatch = line.match(/^\s*(`{3,}|~{3,})\s*$/);
      if (closeMatch && closeMatch[1][0] === fenceChar) inFence = false;
      return blankLine(line);
    }

    if (openMatch) {
      inFence = true;
      fenceChar = openMatch[1][0];
      return blankLine(line);
    }

    // ATX headings are titles, not prose sentences.
    if (/^\s{0,3}#{1,6}\s/.test(line)) return blankLine(line);

    // Table rows / separators (GFM tables using a leading pipe).
    if (/^\s*\|/.test(line)) return blankLine(line);

    // Inline code spans within an otherwise-prose line.
    return line.replace(/`[^`\n]*`/g, blankInline);
  });

  let out = masked.join('\n');

  // Single-line HTML comments: sentinel, same adjacency reasoning as inline code.
  out = out.replace(/<!--[^\n]*?-->/g, blankInline);

  // Multi-line HTML comments: space-blank (preserving newlines) so a comment
  // block keeps acting as a paragraph break for the sentence splitter.
  out = out.replace(/<!--[\s\S]*?-->/g, (m) => m.replace(/[^\n]/g, ' '));

  return out;
}
```

- [ ] **Step 5: Add the `options` parameter to `analyzeText`**

In `src/core/analyzer.ts`:

```ts
import { maskMarkdown } from './markdown.js';

export interface AnalyzeOptions {
  /** Mask Markdown structure (code, tables, headings, comments) before analysis. */
  markdown?: boolean;
}

export function analyzeText(text: string, config?: WscConfig, options?: AnalyzeOptions): AnalysisResult {
  const analyzed = options?.markdown ? maskMarkdown(text) : text;
  ...
```

Then replace every use of `text` below that line with `analyzed` (the detector calls, `splitSentences(analyzed)`, and `meta`'s `characterCount`/`wordCount` — masked and original have identical length, and counting words on the masked text matches the CLI's current behavior). In `meta`, filter sentinel runs out of the word count so a masked code span counts as at most one token:

```ts
      wordCount: analyzed.split(/\s+/).filter(w => w && !/^\u0000+$/.test(w)).length,
```

In `src/core/index.ts`, add:

```ts
export { maskMarkdown, isMarkdownFile } from './markdown.js';
export type { AnalyzeOptions } from './analyzer.js';
```

- [ ] **Step 6: Rewire the CLI**

In `cli/cli.ts`:
- Change `import { maskMarkdown, isMarkdownFile } from './markdown.js';` → `import { isMarkdownFile } from '../src/core/markdown.js';`
- stdin branch: replace the two lines computing `analyzed`/`result` with:

```ts
        const result = analyzeText(text, config, { markdown: options.markdown !== false });
```

- files branch: replace the `analyzed`/`result` lines with:

```ts
        const result = analyzeText(text, fileConfig, {
          markdown: isMarkdownFile(filePath) && options.markdown !== false,
        });
```

In `cli/formatter.ts`, make `truncate` sentinel-safe (AI-tells structural matches can span a masked region):

```ts
function truncate(s: string, max = 48): string {
  const clean = s.replace(/\u0000+/g, ' ');
  return clean.length > max ? clean.slice(0, max - 1) + '…' : clean;
}
```

Also strip sentinels in `detectLongSentences`'s display text in `src/core/detector.ts` — replace the `truncated` line:

```ts
      const display = s.text.replace(/\u0000+/g, ' ');
      const truncated = display.length > 50 ? display.substring(0, 50) + '...' : display;
```

- [ ] **Step 7: Run everything**

Run: `npm test && npm run check && (cd cli && npm run build) && node cli/dist/cli/index.js check "**/*.md" --max-warnings 0`
Expected: all green. Some existing tests in the moved `tests/core/markdown.test.ts` asserted spaces where inline spans now produce sentinels — update those assertions to expect `\u0000` for inline code / single-line comments and spaces for whole-line constructs.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat(core): Markdown masking moves into analyzeText with sentinel-based inline masking

All surfaces can now analyze Markdown identically via the new
{ markdown: true } option; inline code spans no longer create
false word-adjacency (duplicate/passive FPs).

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Wire the markdown option into API, remote MCP, and mcp-server; fix version drift

**Files:**
- Modify: `src/routes/api/check/+server.ts`, `src/mcp/handler.ts`, `mcp-server/server.ts`, `src/core/config-node.ts`
- Test: `tests/routes/` (API tests), `tests/mcp/handler.test.ts`, `tests/mcp-server/` (mirror existing test file names in those dirs)

**Interfaces:**
- Consumes: `analyzeText(text, config, { markdown })` and `isMarkdownFile` from Task 3.
- Produces:
  - API `POST /api/check` accepts optional `"format": "markdown" | "plain"` (default `"plain"`).
  - MCP `check_text` (both servers) accepts optional `format` with the same values; `check_file` (mcp-server) masks by file extension automatically.
  - `src/core/config-node.ts`: `export function readPackageVersion(startUrl: string, packageName: string): string` — walks up from `startUrl` to the named `package.json`; returns `'0.0.0'` if not found. Used by Task 6 too.

- [ ] **Step 1: Write failing API tests**

In the existing API test file under `tests/routes/` (find it: `ls tests/routes/`), add:

```ts
it('masks markdown when format is "markdown"', async () => {
  const body = { text: 'Fine prose.\n```\nvery basically utilize\n```\n', format: 'markdown' };
  // build the request the same way neighboring tests in this file do
  const res = await callPost(body);
  expect(res.status).toBe(200);
  const json = await res.json();
  expect(json.summary.weaselWords).toBe(0);
});

it('rejects an invalid format value', async () => {
  const res = await callPost({ text: 'hello', format: 'html' });
  expect(res.status).toBe(400);
});
```

(`callPost` = whatever request helper the existing tests in that file use; reuse it verbatim.)

- [ ] **Step 2: Run to verify they fail**

Run: `npx vitest run tests/routes/`
Expected: the two new tests FAIL (format is ignored → weasel words found; invalid format → 200).

- [ ] **Step 3: Implement the API change**

In `src/routes/api/check/+server.ts`:

```ts
  let body: { text?: string; config?: unknown; format?: unknown };
```

After the config validation block:

```ts
  if (body.format !== undefined && body.format !== 'markdown' && body.format !== 'plain') {
    return json({ error: 'Invalid "format": must be "markdown" or "plain"' }, { status: 400 });
  }

  const result = analyzeText(text, config, { markdown: body.format === 'markdown' });
```

(Replacing the existing `analyzeText(text, config)` call.) In the `GET` handler's `parameters`, add:

```ts
      format: { type: 'string', required: false, enum: ['plain', 'markdown'], description: 'Set to "markdown" to skip code blocks, tables, and headings' },
```

- [ ] **Step 4: Remote MCP handler — format param + version**

In `src/mcp/handler.ts`:
- In the `check_text` tool's `inputSchema.properties`, add:

```ts
        format: {
          type: 'string',
          enum: ['plain', 'markdown'],
          description: 'Set to "markdown" to skip code blocks, tables, and headings when analyzing',
        },
```

- Find where `check_text` executes (the tool-call dispatch calling `formatAnalysis`/`analyzeText` around lines 77-142): thread the argument through — extract `const format = args?.format;` next to where `text`/`config` are read, validate it the same way the API does (return a tool error for invalid values), and pass `{ markdown: format === 'markdown' }` as the third argument to the `analyzeText` call.
- Change `serverInfo` (line ~218-220) version `'1.0.0'` → `'2.2.0'` and add the comment `// keep in step with wsc-mcp releases` above it.
- Add a matching test in `tests/mcp/handler.test.ts` following that file's existing call-tool test pattern: `check_text` with `format: 'markdown'` on the fenced-code fixture text from Step 1 reports 0 weasel words.

- [ ] **Step 5: mcp-server — format param, check_file auto-masking, version helper**

In `src/core/config-node.ts`, add (alongside the existing imports; add `readFileSync` from `node:fs`, `fileURLToPath` from `node:url`):

```ts
/**
 * Resolve a package's version at runtime by walking up from `startUrl`
 * (pass import.meta.url) to the nearest package.json with the given name.
 * Works from both source (tsx) and compiled dist layouts.
 */
export function readPackageVersion(startUrl: string, packageName: string): string {
  let dir = dirname(fileURLToPath(startUrl));
  for (let i = 0; i < 6; i++) {
    try {
      const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf-8'));
      if (pkg.name === packageName) return pkg.version;
    } catch {
      // keep walking
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return '0.0.0';
}
```

In `mcp-server/server.ts`:
- Replace the hardcoded `version: '2.0.0'` in the `McpServer` constructor with `version: readPackageVersion(import.meta.url, 'wsc-mcp')` (import from `../src/core/config-node.js`).
- `check_text`: add `format: z.enum(['plain', 'markdown']).optional().describe('Set to "markdown" to skip code blocks, tables, and headings')` to the schema and pass `{ markdown: format === 'markdown' }` into the analysis call (`formatAnalysis` gains a third `options` parameter it forwards to `analyzeText`).
- `check_file`: after reading the file, compute `const markdown = isMarkdownFile(path);` (import from `../src/core/markdown.js`) and pass `{ markdown }` through `formatAnalysis`.
- Add tests in `tests/mcp-server/` mirroring that directory's existing patterns: `check_file` on a fixture `.md` with a fenced code block full of weasel words reports 0 issues; the same content in a `.txt` fixture reports issues.

- [ ] **Step 6: Run all tests + builds**

Run: `npm test && npm run check && (cd cli && npm run build) && (cd mcp-server && npm run build)`
Expected: all green.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat(api,mcp): markdown-aware analysis on every surface; fix MCP version drift

POST /api/check and check_text accept format:\"markdown\"; check_file
masks by extension like the CLI. Server versions now come from
package.json instead of drifting hardcoded strings.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Web editor Markdown-mode toggle

**Files:**
- Modify: `src/lib/App.svelte` (state + `analyzeText` call + a toggle control near the editor toolbar/config area)

**Interfaces:**
- Consumes: `analyzeText(text, config, { markdown })` from Task 3.
- Produces: UI-only; persisted localStorage key `wsc-markdown-mode` (`'1'`/`'0'`).

- [ ] **Step 1: Add persisted state to `App.svelte`**

Near the other `let` declarations (~line 20):

```ts
  let markdownMode = false;
```

In the component's `onMount` (it exists — `mounted = true` is set there), add:

```ts
    try {
      markdownMode = localStorage.getItem('wsc-markdown-mode') === '1';
    } catch {}
```

Add a persist-on-change function next to the other handlers:

```ts
  function toggleMarkdownMode() {
    markdownMode = !markdownMode;
    try {
      localStorage.setItem('wsc-markdown-mode', markdownMode ? '1' : '0');
    } catch {}
    // re-run analysis with the new mode (call the same function the editor
    // input handler uses — find it where editorContent changes are analyzed)
  }
```

- [ ] **Step 2: Thread the option into the analysis call**

Find the `analyzeText(` call in `App.svelte` (there is exactly one — it feeds all the count/issue variables) and change it to:

```ts
  analyzeText(editorContent, userConfig, { markdown: markdownMode })
```

Make sure the reactive statement or handler that triggers analysis also depends on `markdownMode` so toggling re-analyzes (in Svelte 4-style reactivity used here, reference `markdownMode` inside the same `$:` block or call the analyze function from `toggleMarkdownMode`).

- [ ] **Step 3: Add the toggle control**

Next to the existing config/legend controls above the editor (match the markup pattern of the existing `showConfig` toggle button), add:

```svelte
<label class="markdown-toggle" title="Skip code blocks, tables, and headings when analyzing">
  <input type="checkbox" checked={markdownMode} on:change={toggleMarkdownMode} />
  Markdown mode
</label>
```

Style it consistently with neighboring controls (reuse an existing class if one fits; otherwise add a small `.markdown-toggle` rule in the component's style block matching the toolbar's font size and spacing).

- [ ] **Step 4: Verify manually**

Run: `npm run dev` — in the browser at localhost:5173:
1. Paste: ``Run `npm` run build`` — with Markdown mode OFF a duplicate-word issue appears; toggling ON makes it disappear.
2. Reload — the toggle state persists.
3. `npm run check` passes.

- [ ] **Step 5: Commit**

```bash
git add src/lib/App.svelte
git commit -m "feat(web): persisted Markdown-mode toggle in the editor

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: CLI colors, version from package.json, dead-code removal, format validation

**Files:**
- Modify: `cli/formatter.ts`, `cli/cli.ts`
- Test: `tests/cli/formatter.test.ts`, `tests/cli/cli.test.ts`

**Interfaces:**
- Consumes: `readPackageVersion` from Task 4.
- Produces: `formatTextWithLineCol(filePath, text, result, useColor?: boolean)` and `formatSummary(totalIssues, fileCount, useColor?: boolean)` — new optional last params, default `false` (existing callers/tests stay valid).

- [ ] **Step 1: Read the existing test files first**

Run: `command cat tests/cli/formatter.test.ts tests/cli/cli.test.ts` — mirror their import and invocation patterns in the steps below.

- [ ] **Step 2: Write failing tests**

In `tests/cli/formatter.test.ts`:

```ts
it('emits ANSI colors when useColor is true and none when false', () => {
  // build a minimal AnalysisResult the way existing tests in this file do,
  // with one weasel word issue
  const colored = formatTextWithLineCol('f.md', 'very good', result, true);
  const plain = formatTextWithLineCol('f.md', 'very good', result, false);
  expect(colored).toMatch(/\u001b\[/);
  expect(plain).not.toMatch(/\u001b\[/);
  expect(plain).toContain('weasel-word');
});

it('does not export the dead formatText function', async () => {
  const mod = await import('../../cli/formatter');
  expect((mod as Record<string, unknown>).formatText).toBeUndefined();
});
```

In `tests/cli/cli.test.ts` (using that file's existing pattern for invoking `run` with argv):

```ts
it('exits 2 on an unknown --format value', async () => {
  const code = await run(['node', 'wsc', 'check', 'README.md', '--format', 'sarif']);
  expect(code).toBe(2);
});

it('reports the package.json version', async () => {
  const pkg = JSON.parse(await readFile(new URL('../../cli/package.json', import.meta.url), 'utf-8'));
  // invoke `run(['node','wsc','--version'])` capturing stdout the way the
  // existing tests capture output, and assert it contains pkg.version
});
```

- [ ] **Step 3: Run to verify they fail**

Run: `npx vitest run tests/cli/`
Expected: color test fails (no 4th param / no ANSI), formatText is still exported, unknown format exits 0, version prints the hardcoded string.

- [ ] **Step 4: Implement `cli/formatter.ts`**

- Delete the entire `formatText` function (lines 10-49) and the now-unused `Format` type if nothing imports it (grep first: `grep -rn "from './formatter" cli/ tests/cli/`).
- Add at top: `import pico from 'picocolors';`
- Add a label-color map and rework `formatTextWithLineCol`:

```ts
function labelize(c: ReturnType<typeof pico.createColors>) {
  return {
    'weasel-word': c.yellow,
    'passive-voice': c.magenta,
    'duplicate-word': c.red,
    'long-sentence': c.blue,
    'nominalization': c.cyan,
    'hedging': c.green,
    'filler-adverb': c.blue,
    'ai-tell': c.red,
  } as Record<string, (s: string) => string>;
}

export function formatTextWithLineCol(
  filePath: string,
  text: string,
  result: AnalysisResult,
  useColor = false,
): string {
  const c = pico.createColors(useColor);
  const paint = labelize(c);
  const loc = (line: number, col: number) => c.dim(`${filePath}:${line}:${col}`);
  const tag = (label: string) => paint[label](label);
  ...
```

and each push becomes the same content wrapped, e.g.:

```ts
    lines.push(`${loc(line, col)}  ${tag('weasel-word')}  "${w.word}"`);
```

(apply the same transformation to all eight loops; content after the label is unchanged). Update `formatSummary`:

```ts
export function formatSummary(totalIssues: number, fileCount: number, useColor = false): string {
  const c = pico.createColors(useColor);
  if (totalIssues === 0) {
    return c.green(`No issues found in ${fileCount} file${fileCount !== 1 ? 's' : ''}.`);
  }
  return c.yellow(`Found ${totalIssues} issue${totalIssues !== 1 ? 's' : ''} in ${fileCount} file${fileCount !== 1 ? 's' : ''}.`);
}
```

- [ ] **Step 5: Implement `cli/cli.ts`**

- Add imports: `import pico from 'picocolors';` and `readPackageVersion` from `../src/core/config-node.js`.
- At the top of the `check` action, before any output:

```ts
      if (!['text', 'json', 'github'].includes(options.format)) {
        process.stderr.write(`Error: Unknown format "${options.format}". Valid formats: text, json, github.\n`);
        resultCode = 2;
        return;
      }
      const useColor = options.color !== false && pico.isColorSupported;
```

- Pass `useColor` to every `formatTextWithLineCol(...)` and `formatSummary(...)` call (github/json paths stay uncolored).
- Replace `cli.version('1.2.0');` with:

```ts
  cli.version(readPackageVersion(import.meta.url, 'wsc-lint'));
```

- [ ] **Step 6: Run tests + a live look**

Run: `npx vitest run tests/cli/ && npm test && (cd cli && npm run build)`
Then eyeball: `node cli/dist/cli/index.js check README.md` in the terminal — labels colored, summary green/yellow; `node cli/dist/cli/index.js check README.md --no-color | grep -c $'\u001b'` prints `0`; `node cli/dist/cli/index.js --version` prints the package.json version.

- [ ] **Step 7: Commit**

```bash
git add cli/ tests/cli/ src/core/config-node.ts
git commit -m "feat(cli): colored output via picocolors, working --no-color, version from package.json, reject unknown formats

Also removes the dead formatText/getLineCol stub.

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Docs and metadata correctness sweep

**Files:**
- Modify: `README.md`, `static/llms.txt`, `CLAUDE.md`, `cli/package.json`, `mcp-server/package.json`, `cli/README.md`, `action/README.md`
- Delete: `static/.well-known/ai-plugin.json`

**Interfaces:** none (docs/metadata only).

- [ ] **Step 1: Fix the broken Action reference**

- `README.md` (~line 210): `- uses: theserverlessdev/wsc@master` → `- uses: theserverlessdev/wsc/action@master`
- `static/llms.txt`: find the `theserverlessdev/wsc@master` mention and apply the same `/action` fix.

- [ ] **Step 2: Remove the phantom MCP tool**

- `README.md` (~line 138): delete the `| list_weasel_words | ... |` table row.
- `CLAUDE.md`: the MCP Route bullet says "4 tools" including `list_weasel_words` — correct it to the actual 3 remote tools: `check_text`, `fix_duplicates`, `list_word_lists`. While in CLAUDE.md, update "8 auxiliary verbs" → "13 auxiliary verbs" (Task 1 added the get-forms) and mention the new `src/core/markdown.ts` + `AnalyzeOptions` in the core section.

- [ ] **Step 3: Package metadata**

`cli/package.json` — replace `description` and add fields:

```json
  "description": "CLI prose linter + AI-slop detector: weasel words, passive voice, hedging, filler adverbs, and research-cited AI tells in text and Markdown",
  "repository": { "type": "git", "url": "git+https://github.com/theserverlessdev/wsc.git", "directory": "cli" },
  "homepage": "https://wsc.theserverless.dev",
  "bugs": { "url": "https://github.com/theserverlessdev/wsc/issues" },
```

and extend `keywords` with `"ai-tells"`, `"ai-slop"`, `"ai-detection"`, `"prose-linter"`, `"markdown"`.

`mcp-server/package.json` — same treatment:

```json
  "description": "MCP server for prose linting + AI-slop detection: weasel words, passive voice, hedging, filler adverbs, and research-cited AI tells",
  "repository": { "type": "git", "url": "git+https://github.com/theserverlessdev/wsc.git", "directory": "mcp-server" },
  "homepage": "https://wsc.theserverless.dev",
  "bugs": { "url": "https://github.com/theserverlessdev/wsc/issues" },
```

keywords: add `"mcp-server"`, `"ai-tells"`, `"ai-slop"`, `"prose-linter"`.

- [ ] **Step 4: Intro lines in sub-READMEs**

`cli/README.md` line ~3 and `action/README.md` line ~3 still describe 7 detectors — rewrite each intro sentence to name all 8, ending with "and AI tells (words, phrases, and structures overrepresented in AI-generated text)".

- [ ] **Step 5: Delete the dead ChatGPT plugin manifest**

```bash
git rm static/.well-known/ai-plugin.json
```

If `static/.well-known/` is then empty, remove the directory. Grep for references: `grep -rn "ai-plugin" src/ static/ README.md` — remove any.

- [ ] **Step 6: Verify published npm state (read-only)**

Run: `npm view wsc-lint version && npm view wsc-mcp version`
Record both in the final report. Expected: `wsc-lint` 1.2.0; if `wsc-mcp` shows < 2.1.0, note that master's 2.1.0 was never published — Task 10's release handoff covers it either way.

- [ ] **Step 7: Dogfood + commit**

Run: `node cli/dist/cli/index.js check "**/*.md" --max-warnings 0`
Expected: clean (fix any flagged phrasing in the edited docs — do not suppress).

```bash
git add -A
git commit -m "fix(docs,meta): correct Action uses: path, drop phantom MCP tool and dead ai-plugin.json, complete npm metadata

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: Repositioning, honest-positioning statement, privacy wording, hire-me line

**Files:**
- Modify: `src/app.html`, `README.md`, `src/docs/getting-started.md`, `src/lib/components/Legend.svelte`, `src/routes/+layout.svelte`

**Interfaces:** none (copy/markup only). Exact copy is normative — use it verbatim; it was written to pass the dogfood linter (no weasel words, hedging, or filler adverbs).

- [ ] **Step 1: `src/app.html` — retitle AI-tells-first**

- `<title>` and `og:title` and `twitter:title`: `Writing Style Checker — Prose Linter & AI Writing Tells Detector`
- `meta description`, `og:description`, `twitter:description`:
  `Free prose linter and AI-slop detector: weasel words, passive voice, hedging, filler adverbs, and 190+ research-cited AI writing tells. Web editor, HTTP API, MCP server, CLI, and GitHub Action.`
- `meta keywords`: append `, AI writing tells, AI slop detector, detect AI writing, AI text patterns, prose linter`
- Schema.org block: update `description` to the new copy above, and in `featureList` add as the first entry:
  `"AI tells detection (98 vocabulary entries, 83 phrases, 12 structural patterns — research-cited)"`

- [ ] **Step 2: `README.md` — lead + positioning section**

Rewrite the first paragraph (after the badges) to:

```markdown
A prose linter and AI-slop detector. WSC finds **AI tells** — words, phrases, and sentence structures overrepresented in AI-generated text, each flag backed by a published corpus study — alongside classic writing issues: **weasel words**, **passive voice**, **duplicate words**, **long sentences**, **nominalizations**, **hedging**, and **filler adverbs**. Available as a web editor, HTTP API, MCP server, CLI, and GitHub Action.
```

Add a new section right after the Features list:

```markdown
## What WSC is (and isn't)

WSC flags patterns that corpus studies show are overrepresented in AI-generated text, and explains every flag with its source. It does not — and cannot — prove authorship. Classifier-based detectors carry documented false-accusation risks (a Stanford study found seven detectors misflagged 61% of non-native English speakers' essays). WSC takes the opposite approach: every flag is a specific, explainable edit that improves the text no matter who — or what — wrote it.
```

- [ ] **Step 3: `src/docs/getting-started.md`**

Add the same "What WSC is (and isn't)" paragraph (not the heading syntax `##` if the file uses a different heading level — match its structure) near the AI-tells explanation, or at the end if there is none.

- [ ] **Step 4: `src/lib/components/Legend.svelte`**

In the AI Tells legend item (line ~36-38), extend the `<p>` to:

```svelte
      <p>Words, phrases, and structures overrepresented in AI-generated text (delve, tapestry, "not just X — it's Y"), each flag citing its research source. Flags patterns — it does not prove authorship.</p>
```

- [ ] **Step 5: `src/routes/+layout.svelte` — privacy wording + hire-me line**

Replace the privacy paragraph (lines ~101-104):

```svelte
        <p>
          <strong>Private by design</strong>: this editor analyzes text in
          your browser — it never leaves your device. The API tester and the
          hosted API/MCP endpoints send submitted text to the server for
          analysis. Page-view analytics only; your text is never shared with it.
        </p>
```

Update the footer-credits line (keep the GitHub icon markup as is):

```svelte
      Made by <a
        href="https://anks.in"
        target="_blank"
        rel="noopener noreferrer">Ankur Singh</a
      > — freelance AI agents, automation &amp; web engineer
```

- [ ] **Step 6: Repo description and topics via gh**

```bash
gh repo edit theserverlessdev/wsc \
  --description "Prose linter + AI-slop detector: weasel words, passive voice, hedging, and 190+ research-cited AI tells. Web editor, API, MCP server, CLI, GitHub Action." \
  --add-topic mcp-server --add-topic mcp --add-topic prose-linter \
  --add-topic ai-slop --add-topic ai-detection --add-topic technical-writing \
  --add-topic github-actions --add-topic linter --add-topic writing-tools
```

- [ ] **Step 7: Verify + commit**

Run: `npm run check && npm run build && node cli/dist/cli/index.js check "**/*.md" --max-warnings 0`
Expected: green build, dogfood clean. Note: the positioning copy contains "does not — and cannot —" and "not just X — it's Y" — if the dogfood run flags either under an AI-tells structural pattern, do NOT reword; add the narrowest justified suppression (`.wscrc.json` ignore is file-level, so prefer rewording anything else first and only then discuss).

```bash
git add -A
git commit -m "feat(site,docs): AI-tells-first positioning, honest-detection statement, scoped privacy claim, freelance credit line

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 9: MANUAL — Cloudflare rate limiting (Ankur)

**Files:** none (Cloudflare dashboard).

No code. Ankur, in the Cloudflare dashboard for the zone serving `wsc.theserverless.dev`:

1. Security → WAF → Rate limiting rules → Create rule (free plan includes 1 rule).
2. Name: `wsc-api-mcp-limit`. Expression: `(http.request.uri.path wildcard "/api/*") or (http.request.uri.path eq "/mcp")`.
3. Rate: 30 requests per 60 seconds per IP. Action: Block, duration 60 seconds (fixed on free plan).
4. Deploy, then verify: `for i in $(seq 1 40); do curl -s -o /dev/null -w "%{http_code}\n" -X POST https://wsc.theserverless.dev/api/check -H 'Content-Type: application/json' -d '{"text":"hi"}'; done` — expect 200s turning into 429s near the end.

---

### Task 10: Final verification and release handoff

**Files:**
- Modify: `cli/package.json` (version 1.2.0 → 1.3.0), `mcp-server/package.json` (version 2.1.0 → 2.2.0)

- [ ] **Step 1: Bump versions**

`cli/package.json`: `"version": "1.3.0"` (new features: markdown-in-core wiring, colors, format validation).
`mcp-server/package.json`: `"version": "2.2.0"` (format param, check_file masking). No hardcoded strings to sync — Tasks 4/6 made both read package.json at runtime; the remote handler's `'2.2.0'` constant set in Task 4 now matches.

- [ ] **Step 2: Full verification battery**

```bash
npm run check && npm test && npm run build
(cd cli && npm ci && npm run build)
(cd mcp-server && npm ci && npm run build)
node cli/dist/cli/index.js check "**/*.md" --max-warnings 0
```

Expected: everything green, dogfood clean.

- [ ] **Step 3: Cross-surface smoke — same document, same counts**

```bash
node cli/dist/cli/index.js check README.md --format json | python3 -c "import sys,json; print(json.load(sys.stdin)[0]['summary']['total'])"
npm run dev &   # then POST the same README with format:"markdown"
curl -s -X POST localhost:5173/api/check -H 'Content-Type: application/json' \
  -d "$(python3 -c "import json; print(json.dumps({'text': open('README.md').read(), 'format': 'markdown'}))")" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['summary']['total'])"
```

Expected: the two totals are equal (CLI applies the repo `.wscrc.json` config while the API call doesn't — if they differ, re-run the CLI with `--config /dev/null` semantics by temporarily moving `.wscrc.json`, or POST with the same config JSON; totals must match under identical config). Kill the dev server after.

- [ ] **Step 4: Commit and report**

```bash
git add -A
git commit -m "chore(release): wsc-lint 1.3.0, wsc-mcp 2.2.0

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
git push origin master
```

Hand Ankur the release commands (his machine has the auth):

```bash
cd cli && npm publish
cd ../mcp-server && npm publish
cd .. && npx wrangler deploy
```

Plus the Task 9 Cloudflare checklist if not yet done. Report: published versions, dogfood status, the cross-surface smoke totals, and anything deferred.
