## MCP Server

Connect any [MCP](https://modelcontextprotocol.io/)-compatible AI assistant (Claude Desktop, Claude Code, Cursor, etc.) to WSC.

### Remote Server (no install)

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

**Tools:** `check_text`, `fix_duplicates`, `list_weasel_words`, `list_word_lists`

### Local Server (stdio)

Run locally for `check_file` support with auto-discovery of `.wscrc.json`.

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

**Additional tool:** `check_file` — reads a file from disk and analyzes it. Auto-discovers `.wscrc.json` in the file's directory or parent directories.

### Tool Reference

| Tool | Description |
|------|-------------|
| `check_text` | Analyze text for all 8 writing style issues. Accepts optional config. |
| `check_file` | Read a file and analyze it (local only). Auto-discovers `.wscrc.json`. |
| `fix_duplicates` | Remove duplicate adjacent words and return cleaned text. |
| `list_weasel_words` | Return the complete list of weasel words the checker flags. |
| `list_word_lists` | Return info about all detector word/phrase lists with counts. |

### Build from Source

```shell
cd mcp-server
npm install
npm run build
node dist/mcp-server/index.js
```
