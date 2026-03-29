# Writing Style Checker

A tool that detects common writing issues: **weasel words**, **passive voice**, and **duplicate words**. Available as an interactive web editor, an HTTP API, and an MCP server for AI assistants.

**[Live: wsc.theserverless.dev](https://wsc.theserverless.dev)**

![Screenshot of Writing Style Checker](static/images/ss.png)

## Features

- **Web Editor** - Real-time highlighting with inline fix buttons
- **HTTP API** - POST text, get structured JSON results with positions and context
- **MCP Server (Remote)** - Connect AI assistants via Streamable HTTP transport
- **MCP Server (Local)** - Stdio-based server for Claude Desktop, Claude Code, etc.

---

## API Usage

### `POST /api/check`

Analyze text for writing style issues.

```bash
curl -X POST https://wsc.theserverless.dev/api/check \
  -H "Content-Type: application/json" \
  -d '{"text":"The code was written very quickly."}'
```

**Response:**

```json
{
  "summary": {
    "total": 2,
    "weaselWords": 1,
    "passiveVoice": 1,
    "duplicateWords": 0
  },
  "issues": {
    "weaselWords": [
      {
        "word": "very",
        "index": 21,
        "length": 4,
        "line": 1,
        "column": 22,
        "context": "...he code was written very quickly."
      }
    ],
    "passiveVoice": [
      {
        "phrase": "was written",
        "index": 9,
        "length": 11,
        "line": 1,
        "column": 10,
        "context": "The code was written very quickly."
      }
    ],
    "duplicateWords": []
  },
  "meta": {
    "characterCount": 34,
    "wordCount": 6,
    "processingTimeMs": 2
  }
}
```

**Limits:** Max 100,000 characters per request. CORS enabled for all origins.

**Errors:** `400` for missing/invalid text or exceeding limits.

---

## MCP Server

The Writing Style Checker is available as an [MCP](https://modelcontextprotocol.io/) server, letting AI assistants check your writing directly.

### Tools

| Tool | Description |
|------|-------------|
| `check_text` | Analyze text for weasel words, passive voice, and duplicate words |
| `fix_duplicates` | Remove duplicate adjacent words and return cleaned text |
| `list_weasel_words` | Return the complete list of weasel words the checker flags |
| `check_file` | *(Local only)* Read a file from disk and analyze it |

### Remote MCP Server

Connect any MCP client to the hosted server - no installation required.

**Claude Desktop / Claude Code config:**

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

**Test with curl:**

```bash
# Initialize
curl -X POST https://wsc.theserverless.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}'

# List tools
curl -X POST https://wsc.theserverless.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'

# Check text
curl -X POST https://wsc.theserverless.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"check_text","arguments":{"text":"The the code was written very quickly."}}}'
```

### Local MCP Server (stdio)

For local usage with Claude Desktop, Claude Code, or other MCP clients. Includes the `check_file` tool for analyzing files on disk.

**Claude Desktop config:**

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

**Build from source:**

```bash
cd mcp-server
npm install
npm run build
node dist/mcp-server/index.js
```

---

## Privacy

The web editor runs **entirely in your browser** - text is never sent to any server. The API and MCP endpoints only process text you explicitly send to them.

---

## Project Structure

```
.
├── src/
│   ├── core/                    # Shared detection engine
│   │   ├── detector.ts          # Detection algorithms
│   │   ├── words.ts             # Word lists (weasel words, irregular verbs)
│   │   └── index.ts             # Public API exports
│   ├── mcp/
│   │   └── handler.ts           # MCP JSON-RPC 2.0 handler
│   ├── lib/
│   │   └── App.svelte           # Main application component
│   ├── routes/
│   │   ├── +layout.server.js    # SSR configuration
│   │   ├── +page.server.js      # Page prerender config
│   │   ├── +page.svelte         # Main page
│   │   ├── api/check/
│   │   │   └── +server.ts       # HTTP API endpoint
│   │   └── mcp/
│   │       └── +server.ts       # MCP endpoint
│   └── styles/
│       └── main.scss            # Global styles
├── mcp-server/                  # Standalone stdio MCP server
│   ├── index.ts                 # Entry point
│   ├── package.json
│   └── tsconfig.json
├── static/                      # Images, favicon, SEO files
├── wrangler.toml                # Cloudflare Workers config
└── svelte.config.js             # SvelteKit configuration
```

---

## Detection Logic

1. **Weasel Words** - Matches against a curated list of 54 vague terms using word-boundary regex
2. **Passive Voice** - Detects auxiliary verbs followed by past participles (regular `-ed` forms + 176 irregular verbs)
3. **Duplicate Words** - Finds adjacent repeated words across whitespace, case-insensitive

Word lists sourced from [Matt Might's shell scripts](https://matt.might.net/articles/shell-scripts-for-passive-voice-weasel-words-duplicates/), expanded with additional terms.

---

## Local Development

```bash
git clone https://github.com/rush-skills/wsc.git
cd wsc
npm install
npm run dev
```

Visit `http://localhost:5173`. The API is available at `/api/check` and MCP at `/mcp`.

## Deployment

Deployed as a Cloudflare Worker at `wsc.theserverless.dev`.

```bash
npm run build
npx wrangler deploy --env production
```

To deploy your own instance, update `account_id` and `route` in `wrangler.toml`.

---

## Contributing

- **Word lists**: Edit `src/core/words.ts` to add weasel words or irregular verbs
- **Bug fixes, UI improvements, new detectors**: PRs welcome
- For substantial changes, open an issue first

## Acknowledgements

- [Matt Might](https://matt.might.net/) for the original shell scripts
- Built with [SvelteKit](https://kit.svelte.dev/), deployed on [Cloudflare Workers](https://workers.cloudflare.com/)
- Logo made with [DiffusionBee](https://diffusionbee.com/)

## License

MIT License
