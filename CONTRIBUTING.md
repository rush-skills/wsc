# Contributing to Writing Style Checker

Thanks for your interest in contributing! This guide will help you get started.

## Development Setup

```bash
git clone https://github.com/rush-skills/wsc.git
cd wsc
npm install
npm run dev
```

The app runs at `http://localhost:5173` with the API at `/api/check` and MCP at `/mcp`.

## Running Tests

```bash
npm test              # Run all 159 tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report (100% statements/functions/lines)
```

## Type Checking

```bash
npm run check         # svelte-check — must pass with 0 errors, 0 warnings
```

## Building

```bash
npm run build         # SvelteKit build for Cloudflare Workers
```

## MCP Server (standalone)

```bash
cd mcp-server
npm install
npm run build
```

## What to Contribute

### Word Lists
Edit `src/core/words.ts` to add or remove:
- Weasel words (`weaselWords` or `additionalWeaselWords` arrays)
- Irregular past participles (`irregularVerbs` array)

### New Detectors
Add a new detection function in `src/core/detector.ts`, export it from `src/core/index.ts`, and wire it into:
- `src/mcp/handler.ts` (remote MCP)
- `src/routes/api/check/+server.ts` (HTTP API)
- `mcp-server/server.ts` (local MCP)
- `src/lib/App.svelte` (frontend highlighting)

### Bug Fixes and UI Improvements
PRs welcome for any bug fixes, accessibility improvements, or UI enhancements.

## Pull Request Process

1. Fork the repo and create a feature branch from `master`
2. Make your changes
3. Ensure all tests pass: `npm test`
4. Ensure type checking passes: `npm run check`
5. Ensure the build succeeds: `npm run build`
6. Add tests for new functionality
7. Open a PR with a clear description of the change

## Code Style

- TypeScript for all new code
- No linter configured — follow existing patterns
- Keep functions small and focused
- Avoid adding dependencies unless necessary

## Reporting Issues

Open an issue on [GitHub](https://github.com/rush-skills/wsc/issues) with:
- What you expected to happen
- What actually happened
- Steps to reproduce (text input that triggers the bug, if applicable)

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
