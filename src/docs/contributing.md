## Contributing

WSC is open source. Contributions are welcome!

### Repository

[github.com/theserverlessdev/wsc](https://github.com/theserverlessdev/wsc)

### Development Setup

```shell
git clone https://github.com/theserverlessdev/wsc.git
cd wsc
npm install
npm run dev          # Start dev server at localhost:5173
npm run check        # Type check
npm test             # Run all tests
```

### Project Structure

| Directory | Description |
|-----------|-------------|
| `src/core/` | Detection engine — detectors, word lists, config, analyzer |
| `src/lib/` | Svelte components for the web app |
| `src/routes/` | SvelteKit routes (pages, API, MCP endpoint) |
| `src/docs/` | Documentation content as Markdown files |
| `mcp-server/` | Standalone stdio MCP server (npm: `wsc-mcp`) |
| `cli/` | CLI tool (npm: `wsc-cli`) |
| `action/` | GitHub Action composite action |
| `tests/` | Vitest test suites (mirrors `src/` structure) |

### Suggest a Word

Think a word or phrase should be added to a detector list? Visit the [Word Library](/words) page and use the "Suggest a Word" form to open a pre-filled GitHub issue.
