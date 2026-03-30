# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server at localhost:5173
npm run build        # Build for production (Cloudflare Workers)
npm run check        # Type check (svelte-kit sync + svelte-check)
npm test             # Run all tests (vitest run)
npm run test:watch   # Run tests in watch mode
npm run test:coverage # Coverage report (istanbul)
```

Run a single test file: `npx vitest run tests/core/detector.test.ts`

### MCP Server (separate package in `mcp-server/`)

```bash
cd mcp-server && npm ci && npm run build   # Build standalone MCP server
```

### CLI (separate package in `cli/`)

```bash
cd cli && npm ci && npm run build   # Build CLI
node cli/dist/cli/index.js check "**/*.md"  # Run check
```

## Architecture

**Writing Style Checker (WSC)** — detects 8 types of writing issues. Six interfaces: web editor, HTTP API, remote MCP, local MCP, CLI, and GitHub Action.

### Core Detection Engine (`src/core/`)
- `detector.ts` — 8 detector functions: `detectWeaselWords`, `detectPassiveVoice`, `detectDuplicateWords`, `detectLongSentences`, `detectNominalizations`, `detectHedging`, `detectAdverbs`, `detectAiTells`, plus `removeDuplicateWord`. All return match positions (index + length). Weasel words, nominalizations, hedging, adverbs, and AI tells accept optional custom word lists for config support.
- `words.ts` — Word lists: 95 weasel words (`allWeaselWords`), 262 irregular verbs, 8 auxiliary verbs, 230 nominalizations (with suggestions), 100 hedging phrases, 140 filler adverbs, 96 abbreviations, 37 AI tells vocabulary (with reasons), 31 AI tells phrases (with reasons).
- `config.ts` — Browser-safe config types (`WscConfig`), `DEFAULT_CONFIG`, `mergeConfig()`, `applyWordListOverrides()`, `applyNominalizationOverrides()`, `validateConfig()`. No Node.js imports.
- `config-node.ts` — Node-only: `loadConfigFromFile()`, `findConfigFile()`. Uses `node:fs/promises` and `node:path`. Only imported by mcp-server and CLI.
- `analyzer.ts` — `analyzeText(text, config?)` — the single entry point all consumers call. Runs enabled detectors with config overrides, returns `AnalysisResult`.
- `index.ts` — Public re-exports (does NOT export config-node functions).

### Key Architectural Principle
All consumers call `analyzeText()` rather than individual detectors. Adding a new detector means updating `analyzer.ts` once, not every consumer.

### Surfaces
- **Web Editor** (`src/lib/App.svelte`) — Svelte 5 client-side editor with extracted components in `src/lib/components/`. Calls `analyzeText()` with optional `WscConfig` from ConfigPanel. Shows all 8 detector types with color-coded highlights.
- **Layout** (`src/routes/+layout.svelte`) — Shared header (logo, nav: Editor/Word Library/Docs, theme switcher), footer. Theme state in `src/lib/stores/theme.ts`.
- **Docs Page** (`src/routes/docs/+page.svelte`) — Documentation rendered from Markdown files in `src/docs/` using `marked`. Supports `?section=` deep-linking.
- **Word Library** (`src/routes/words/+page.svelte`) — Searchable browser for all word/phrase lists with suggest-a-word form.
- **HTTP API** (`src/routes/api/check/+server.ts`) — `POST /api/check` accepts `{text, config?}`. GET returns API docs. `GET /api/detectors` lists all detectors with counts.
- **MCP Route** (`src/routes/mcp/+server.ts`) — Streamable HTTP transport. Delegates to `src/mcp/handler.ts` with 4 tools: `check_text` (with config), `fix_duplicates`, `list_weasel_words`, `list_word_lists`.
- **Standalone MCP Server** (`mcp-server/`) — npm package `wsc-mcp`. Adds `check_file` with auto-discovery of `.wscrc.json`. Both `check_text` and `check_file` accept config param.
- **CLI** (`cli/`) — `wsc check`, `wsc list`, `wsc init`. Output formats: text, json, github. Auto-discovers `.wscrc.json`.
- **Health** (`src/routes/health/+server.ts`) — `GET /health` runs a known-text smoke test.
- **GitHub Action** (`action/action.yml`) — Composite action using wsc-cli.

### Web App Components (`src/lib/components/`)
- `StatsBar.svelte` — Clickable stat boxes (reactive `$:` array pattern for Svelte 4 compat)
- `IssueList.svelte` — 8 issue sections with scroll-target `id="issues-{detector}"`
- `ConfigPanel.svelte` — Toggle switches, word list editors, JSON preview. Reactive `$:` array for detector toggles.
- `IntegrationSection.svelte` — Cards linking to `/docs?section=` + embedded ApiTester
- `ApiTester.svelte` — Interactive POST /api/check tester
- `Legend.svelte` — How-to-use legend with link to /words
- `WordLibrary.svelte` — Searchable word list browser with tab groups
- `SuggestWord.svelte` — GitHub issue pre-filler for word suggestions
- `DocsPage.svelte` — Loads `.md` files from `src/docs/` via `?raw` imports, renders with `marked`

### Documentation Content (`src/docs/`)
Markdown files imported at build time: `getting-started.md`, `config.md`, `api.md`, `mcp.md`, `cli.md`, `github-action.md`, `contributing.md`. Edit these files to update website documentation.

### Config System
`.wscrc.json` files configure detectors. JSON Schema at `static/schema.json`. Config supports `enabled`, `add`/`remove` word list overrides, and `maxWords` for long sentences. The API and MCP tools accept inline config objects.

### Stack
- SvelteKit + Svelte 5, TypeScript, SCSS
- Cloudflare Workers via `@sveltejs/adapter-cloudflare`
- Vitest for testing (tests in `tests/`, mirrors `src/` structure)
- `$app/environment` is mocked in tests at `tests/__mocks__/$app/environment.ts`

### Key Constraints
- Default branch is `master`
- CI runs type check, tests, and build on Node 20 + 22
- `config-node.ts` must stay separate from `config.ts` to avoid Node.js imports in browser bundle
- Coverage targets specific files in `vitest.config.ts`
