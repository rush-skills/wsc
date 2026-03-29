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

## Architecture

**Writing Style Checker (WSC)** — detects weasel words, passive voice, and duplicate words in text. Three interfaces: web editor, HTTP API, and MCP server.

### Core Detection Engine (`src/core/`)
- `detector.ts` — Three pure functions: `detectWeaselWords`, `detectPassiveVoice`, `detectDuplicateWords`, plus `removeDuplicateWord`. All return match positions (index + length). Regex-based detection using word-boundary matching.
- `words.ts` — Word lists: 54 weasel words (`allWeaselWords`), 176 irregular past participles (`irregularVerbs`), 8 auxiliary verbs (`auxiliaryVerbs`).
- `index.ts` — Public re-exports.

### Surfaces
- **Web Editor** (`src/lib/App.svelte`, `src/routes/+page.svelte`) — Svelte 5 client-side-only editor. All processing happens in-browser using the core engine.
- **HTTP API** (`src/routes/api/check/+server.ts`) — `POST /api/check` accepts `{text}`, returns structured JSON with positions, line/column info, context snippets, and timing. CORS enabled. Max 100K chars.
- **MCP Route** (`src/routes/mcp/+server.ts`) — Streamable HTTP transport. Delegates to `src/mcp/handler.ts` which implements JSON-RPC 2.0 with tools: `check_text`, `fix_duplicates`, `list_weasel_words`.
- **Standalone MCP Server** (`mcp-server/`) — Separate npm package (`wsc-mcp`) using `@modelcontextprotocol/sdk` with stdio transport. Has its own `package.json`, `tsconfig.json`, and `node_modules`. Adds a `check_file` tool for local file reading. Imports from `../src/core`.

### Stack
- SvelteKit + Svelte 5, TypeScript, SCSS
- Cloudflare Workers via `@sveltejs/adapter-cloudflare`
- Vitest for testing (tests in `tests/`, mirrors `src/` structure)
- `$app/environment` is mocked in tests at `tests/__mocks__/$app/environment.ts`

### Key Constraints
- Default branch is `master`
- CI runs type check, tests, and build on Node 20 + 22
- Coverage targets specific files in `vitest.config.ts` (excludes `mcp-server/index.ts` entry point)
