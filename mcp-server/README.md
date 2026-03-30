# wsc-mcp

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for the [Writing Style Checker](https://wsc.theserverless.dev). Detects **weasel words**, **passive voice**, **duplicate words**, **long sentences**, **nominalizations**, **hedging language**, **filler adverbs**, and **AI tells** — directly from your AI assistant.

## Tools

| Tool | Description |
|------|-------------|
| `check_text` | Analyze text for all 8 writing style issues with positions and context. Accepts optional `config` to customize detectors. |
| `check_file` | Read a file from disk and analyze it. Auto-discovers `.wscrc.json` config. Accepts optional `config` override. |
| `fix_duplicates` | Remove all duplicate adjacent words and return the cleaned text |
| `list_word_lists` | Return all detector word/phrase lists with counts and sample entries |

## Setup

### Claude Desktop

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "writing-style-checker": {
      "command": "npx",
      "args": ["wsc-mcp"]
    }
  }
}
```

### Claude Code

Add to your Claude Code MCP settings:

```json
{
  "mcpServers": {
    "writing-style-checker": {
      "command": "npx",
      "args": ["wsc-mcp"]
    }
  }
}
```

### Other MCP Clients

Any MCP client that supports stdio transport can use this server:

```bash
npx wsc-mcp
```

## Remote Server

If you don't need local file analysis, you can use the hosted MCP server instead (no installation required):

```json
{
  "mcpServers": {
    "writing-style-checker": {
      "type": "url",
      "url": "https://wsc.theserverless.dev/mcp"
    }
  }
}
```

The remote server provides `check_text`, `fix_duplicates`, and `list_word_lists` (no `check_file` since it runs on Cloudflare Workers).

## Configuration

Both `check_text` and `check_file` accept an optional `config` parameter to customize detectors:

```json
{
  "detectors": {
    "weaselWords": { "enabled": true, "add": ["synergy"], "remove": ["very"] },
    "longSentences": { "maxWords": 25 },
    "adverbs": { "enabled": false }
  }
}
```

The `check_file` tool also auto-discovers `.wscrc.json` files by walking up from the file's directory. A `config` parameter overrides auto-discovery.

## Example Usage

Once connected, ask your AI assistant:

- "Check this text for writing issues: The report was written very quickly and is basically done."
- "Analyze the file at ~/Documents/essay.md for writing style problems"
- "Fix duplicate words in: The the code is is working"
- "Check this text but disable the adverbs detector"
- "What word lists does the checker use?"

## Detection Rules

| Detector | Count | Description |
|----------|-------|-------------|
| Weasel Words | 95 | Vague terms like "very", "basically", "arguably" |
| Passive Voice | — | Auxiliary verbs + past participles (262 irregular + regular `-ed`) |
| Duplicate Words | — | Adjacent repeated words, case-insensitive |
| Long Sentences | — | Sentences exceeding a word threshold (default: 30) |
| Nominalizations | 230 | Nouns replaceable with verbs ("utilization" → "use") |
| Hedging | 100 | Phrases that weaken assertions ("I think", "it seems") |
| Filler Adverbs | 140 | Adverbs adding emphasis without substance ("totally", "utterly") |
| AI Tells | 37+31 | Words/phrases overrepresented in AI text ("delve", "let's dive in") |

## Privacy

The local MCP server runs entirely on your machine. Text is never sent to any external service. The remote server at `wsc.theserverless.dev` only processes text you explicitly send to it.

## Links

- [Web App](https://wsc.theserverless.dev) — Interactive browser-based editor
- [HTTP API](https://wsc.theserverless.dev/api/check) — POST endpoint for programmatic access
- [CLI](https://www.npmjs.com/package/wsc-cli) — Command-line tool
- [GitHub](https://github.com/theserverlessdev/wsc) — Source code
- [MCP Protocol](https://modelcontextprotocol.io/) — Model Context Protocol specification

## License

MIT
