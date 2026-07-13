## Getting Started

The Writing Style Checker (WSC) detects 8 types of writing issues: weasel words, passive voice,
duplicate words, long sentences, nominalizations, hedging language, filler adverbs, and AI tells.

### What WSC is (and isn't)

WSC flags patterns that research on AI-generated text finds overrepresented, and cites a source for every flag. It does not, and cannot, prove authorship. Classifier-based detectors carry a documented false-accusation risk: a Stanford study found that seven of them misflagged 61% of essays written by non-native English speakers. WSC avoids that trap by design — every flag is a specific, explainable edit that improves the text no matter who, or what, wrote it.

### Use it online

The fastest way to use WSC is the [web editor](/). Paste your text and see issues highlighted in real time. All analysis runs in your browser — we never send your text to a server.

### Use from the command line

```shell
npx wsc-lint check "**/*.md"
```

### Use in CI

```yaml
# .github/workflows/writing.yml
- uses: theserverlessdev/wsc@v1
  with:
    files: "**/*.md"
```

### Use via AI assistants (MCP)

Add WSC to Claude Code with a single command:

```shell
claude mcp add writing-style-checker --transport http https://wsc.theserverless.dev/mcp
```

Or add to Claude Desktop / other MCP clients:

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
