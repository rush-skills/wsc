# wsc-mcp

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for the [Writing Style Checker](https://wsc.theserverless.dev). Detects **weasel words**, **passive voice**, and **duplicate words** in text — directly from your AI assistant.

## Tools

| Tool | Description |
|------|-------------|
| `check_text` | Analyze text for weasel words, passive voice, and duplicate words with positions and context |
| `check_file` | Read a file from disk and analyze it for writing style issues |
| `fix_duplicates` | Remove all duplicate adjacent words and return the cleaned text |
| `list_weasel_words` | Return the complete list of weasel words the checker flags |

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

The remote server provides `check_text`, `fix_duplicates`, and `list_weasel_words` (no `check_file` since it runs on Cloudflare Workers).

## Example Usage

Once connected, ask your AI assistant:

- "Check this text for writing issues: The report was written very quickly and is basically done."
- "Analyze the file at ~/Documents/essay.md for writing style problems"
- "Fix duplicate words in: The the code is is working"
- "What weasel words does the checker look for?"

## Detection Rules

1. **Weasel Words** — 54 vague terms like "very", "basically", "arguably", "several", matched with word-boundary regex
2. **Passive Voice** — Auxiliary verbs (`was`, `were`, `been`, etc.) followed by past participles (regular `-ed` forms + 176 irregular verbs)
3. **Duplicate Words** — Adjacent repeated words across whitespace, case-insensitive

## Privacy

The local MCP server runs entirely on your machine. Text is never sent to any external service. The remote server at `wsc.theserverless.dev` only processes text you explicitly send to it.

## Links

- [Web App](https://wsc.theserverless.dev) — Interactive browser-based editor
- [HTTP API](https://wsc.theserverless.dev/api/check) — POST endpoint for programmatic access
- [GitHub](https://github.com/rush-skills/wsc) — Source code
- [MCP Protocol](https://modelcontextprotocol.io/) — Model Context Protocol specification

## License

MIT
