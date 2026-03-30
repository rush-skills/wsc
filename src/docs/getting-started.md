## Getting Started

The Writing Style Checker (WSC) detects 7 types of writing issues: weasel words, passive voice,
duplicate words, long sentences, nominalizations, hedging language, and filler adverbs.

### Use it online

The fastest way to use WSC is the [web editor](/). Paste your text and see issues highlighted in real time. All analysis runs in your browser — your text is never sent to a server.

### Use from the command line

```shell
npx wsc-cli check "**/*.md"
```

### Use in CI

```yaml
# .github/workflows/writing.yml
- uses: theserverlessdev/wsc@master
  with:
    files: "**/*.md"
```

### Use via AI assistants (MCP)

Add WSC as a remote MCP server in Claude Desktop, Claude Code, or any MCP client:

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

### Integrate via HTTP API

```shell
curl -X POST https://wsc.theserverless.dev/api/check \
  -H "Content-Type: application/json" \
  -d '{"text":"The code was written very quickly."}'
```
