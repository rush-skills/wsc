# Manual Testing Instructions

This document covers every surface of the Writing Style Checker that should be verified before a release. Work through each section in order.

---

## Prerequisites

```bash
# Install root project dependencies
npm install

# Install MCP server dependencies
cd mcp-server && npm install && cd ..
```

---

## 1. Automated Tests

Run the full test suite and confirm 159 tests pass across 6 files.

```bash
npm test
```

Run with coverage and confirm 100% statement/function/line coverage:

```bash
npm run test:coverage
```

---

## 2. Build Verification

### SvelteKit App

```bash
npm run build
```

- [ ] Build completes without errors
- [ ] Output appears in `.svelte-kit/cloudflare/`

### MCP Server

```bash
cd mcp-server && npm run build && cd ..
```

- [ ] Build completes without errors
- [ ] Output appears in `mcp-server/dist/`
- [ ] No `.js` or `.d.ts` artifacts in `src/core/` (the mcp-server build should only output to `mcp-server/dist/`)

### TypeScript Check

```bash
npm run check
```

- [ ] No type errors reported

---

## 3. Frontend (Local Dev Server)

Start the dev server:

```bash
npm run dev
```

Visit `http://localhost:5173` (or the port shown in output).

### Editor Functionality

- [ ] Default sample text is displayed in the editor
- [ ] Weasel words are highlighted (yellow) — "very", "extremely" in sample text
- [ ] Passive voice is highlighted (blue) — "was written" in sample text
- [ ] Duplicate words are highlighted (red) — "the the" in sample text
- [ ] Issue counts update in the stats bar below the editor
- [ ] Total issues count shows in the editor header

### Issue Lists

- [ ] Weasel Words section appears with detected words
- [ ] Passive Voice section appears with detected phrases
- [ ] Duplicate Words section appears with detected words
- [ ] Each issue shows a position indicator (line:column)
- [ ] "Go to" buttons scroll the editor to the issue position
- [ ] "Fix" buttons on duplicate words remove the duplicate
- [ ] After fixing a duplicate, the text updates and highlights refresh

### Line Numbers

- [ ] Line numbers appear on the left side of the editor
- [ ] Line numbers scroll in sync with the editor content
- [ ] Line numbers update when text is added or removed

### Highlights

- [ ] Highlights align precisely with the underlying text
- [ ] Highlights follow scrolling (both vertical and horizontal)
- [ ] Highlights update when text is edited
- [ ] Hovering over a duplicate highlight shows a "Fix" button

### Theme Switching

- [ ] Light theme button works
- [ ] Dark theme button works
- [ ] System theme button follows OS preference
- [ ] All highlights remain visible in both themes
- [ ] Theme switcher buttons show active state correctly

### About Section

- [ ] Clicking the subtitle expands the about section with slide animation
- [ ] Clicking again collapses it
- [ ] Content describes the tool, inspiration, and privacy

### API & MCP Integration Section

- [ ] Section appears below the legend
- [ ] Three tabs are visible: "HTTP API", "MCP Server (Remote)", "MCP Server (Local)"
- [ ] Clicking each tab switches the content
- [ ] HTTP API tab shows curl example, response format, and limits/CORS/errors info
- [ ] MCP Remote tab shows tool cards, Claude config snippet, and curl test example
- [ ] MCP Local tab shows 4 tool cards (including check_file), config snippet, and build instructions
- [ ] "Copy" buttons copy the code block content to clipboard
- [ ] Copy button text changes to "Copied!" temporarily after clicking

### Responsive Layout

- [ ] Resize browser to mobile width (~375px)
- [ ] Header stacks vertically, theme switcher centers
- [ ] Editor height reduces
- [ ] Stats bar stacks vertically
- [ ] Legend items stack vertically
- [ ] Integration tabs wrap if needed
- [ ] Everything remains readable and functional

---

## 4. HTTP API (Local)

With the dev server running (`npm run dev`), use the port shown in the terminal output (default 5173).

### Valid Request

```bash
curl -s -X POST http://localhost:5173/api/check \
  -H "Content-Type: application/json" \
  -d '{"text":"The code was written very quickly. The the test passed."}' | python3 -m json.tool
```

- [ ] Response is valid JSON
- [ ] `summary.total` equals the sum of individual counts
- [ ] `summary.weaselWords` is >= 1 ("very")
- [ ] `summary.passiveVoice` is >= 1 ("was written")
- [ ] `summary.duplicateWords` is >= 1 ("the the")
- [ ] Each issue has `index`, `length`, `line`, `column`, and `context` fields
- [ ] `meta.characterCount` and `meta.wordCount` are correct
- [ ] `meta.processingTimeMs` is a number

### CORS Headers

```bash
curl -s -I -X POST http://localhost:5173/api/check \
  -H "Content-Type: application/json" \
  -d '{"text":"hello"}' 2>&1 | grep -i access-control
```

- [ ] `Access-Control-Allow-Origin: *` is present
- [ ] `Access-Control-Allow-Methods` includes POST
- [ ] `Access-Control-Allow-Headers` includes Content-Type

### OPTIONS Preflight

```bash
curl -s -I -X OPTIONS http://localhost:5173/api/check
```

- [ ] Returns 200 or 204
- [ ] CORS headers are present

### Error: Invalid JSON

```bash
curl -s -X POST http://localhost:5173/api/check \
  -H "Content-Type: application/json" \
  -d 'not json'
```

- [ ] Returns 400 status
- [ ] Response contains `"error"` with message about invalid JSON

### Error: Missing Text

```bash
curl -s -X POST http://localhost:5173/api/check \
  -H "Content-Type: application/json" \
  -d '{}'
```

- [ ] Returns 400 status
- [ ] Response contains `"error"` with message about missing text

### Error: Text Too Long

```bash
python3 -c "import json; print(json.dumps({'text': 'a'*100001}))" | \
  curl -s -X POST http://localhost:5173/api/check \
  -H "Content-Type: application/json" \
  -d @-
```

- [ ] Returns 400 status
- [ ] Response mentions 100000 character limit

### Clean Text

```bash
curl -s -X POST http://localhost:5173/api/check \
  -H "Content-Type: application/json" \
  -d '{"text":"The team wrote clean code."}' | python3 -m json.tool
```

- [ ] `summary.total` is 0
- [ ] All issue arrays are empty

---

## 5. MCP Server — Remote (Local)

With the dev server running.

### GET Info

```bash
curl -s http://localhost:5173/mcp | python3 -m json.tool
```

- [ ] Returns JSON with `name`, `version`, `tools`, `protocol`
- [ ] `tools` array contains `check_text`, `fix_duplicates`, `list_weasel_words`
- [ ] `Content-Type` is `application/json`
- [ ] `Access-Control-Allow-Origin: *` header is present

### Initialize

```bash
curl -s -X POST http://localhost:5173/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | python3 -m json.tool
```

- [ ] `result.protocolVersion` is `"2025-03-26"`
- [ ] `result.serverInfo.name` is `"writing-style-checker"`
- [ ] `result.serverInfo.version` is `"1.0.0"`
- [ ] `result.capabilities.tools` is `{}`

### List Tools

```bash
curl -s -X POST http://localhost:5173/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' | python3 -m json.tool
```

- [ ] `result.tools` has 3 entries
- [ ] Each tool has `name`, `description`, `inputSchema`
- [ ] `check_text` requires `text`
- [ ] `fix_duplicates` requires `text`
- [ ] `list_weasel_words` has no required params

### check_text

```bash
curl -s -X POST http://localhost:5173/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"check_text","arguments":{"text":"The the code was written very quickly."}}}' | python3 -m json.tool
```

- [ ] `result.content[0].type` is `"text"`
- [ ] Output contains "Writing Style Analysis"
- [ ] Output contains "WEASEL WORDS", "PASSIVE VOICE", "DUPLICATE WORDS"
- [ ] Issues include line/column numbers and context

### fix_duplicates

```bash
curl -s -X POST http://localhost:5173/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"fix_duplicates","arguments":{"text":"The the code is is good."}}}' | python3 -m json.tool
```

- [ ] Output contains "Removed" and "duplicate"
- [ ] Output contains "Cleaned text:"
- [ ] Cleaned text has no adjacent duplicates

### list_weasel_words

```bash
curl -s -X POST http://localhost:5173/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"list_weasel_words","arguments":{}}}' | python3 -m json.tool
```

- [ ] Output contains "Weasel Words List"
- [ ] Output contains a comma-separated list of words
- [ ] Known words like "very", "basically", "obviously" are present

### Error: Unknown Method

```bash
curl -s -X POST http://localhost:5173/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":6,"method":"nonexistent"}' | python3 -m json.tool
```

- [ ] `error.code` is `-32601`
- [ ] `error.message` contains "Method not found"

### Error: Invalid JSON

```bash
curl -s -X POST http://localhost:5173/mcp \
  -H "Content-Type: application/json" \
  -d 'broken{json'
```

- [ ] `error.code` is `-32700`
- [ ] `error.message` contains "Parse error"

### OPTIONS Preflight

```bash
curl -s -I -X OPTIONS http://localhost:5173/mcp
```

- [ ] CORS headers present

---

## 6. MCP Server — Stdio (Local)

### Build

```bash
cd mcp-server && npm run build && cd ..
```

- [ ] Build completes without errors

### Test via Echo (smoke test)

The stdio server uses MCP SDK framing, so a simple echo test won't produce readable output. Instead, verify it starts without crashing:

```bash
timeout 2 node mcp-server/dist/mcp-server/index.js < /dev/null 2>&1; echo "Exit code: $?"
```

- [ ] Process exits (timeout or EOF), does not crash with a stack trace

### Test via Claude Desktop (if available)

Add to your Claude Desktop MCP config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "writing-style-checker": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/dist/mcp-server/index.js"]
    }
  }
}
```

- [ ] Claude Desktop shows "writing-style-checker" in the MCP server list
- [ ] Ask Claude: "Use the writing style checker to analyze: The code was written very quickly"
- [ ] Claude calls `check_text` and returns analysis with weasel words and passive voice
- [ ] Ask Claude: "Fix duplicates in: the the code is is good"
- [ ] Claude calls `fix_duplicates` and returns cleaned text
- [ ] Ask Claude: "List all weasel words the checker looks for"
- [ ] Claude calls `list_weasel_words` and returns the word list
- [ ] Ask Claude: "Check the file at /path/to/some/text/file.md"
- [ ] Claude calls `check_file` and returns analysis of the file contents

### Test via Claude Code (if available)

Add to `.claude/settings.json`:

```json
{
  "mcpServers": {
    "writing-style-checker": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-server/dist/mcp-server/index.js"]
    }
  }
}
```

- [ ] The MCP tools appear in Claude Code's tool list
- [ ] Tools function as described above

---

## 7. Production Deployment Verification

After deploying to Cloudflare Workers (see RELEASE-AND-DEPLOYMENT.md):

### Frontend

- [ ] `https://wsc.theserverless.dev` loads the full application
- [ ] Editor, highlighting, theme switching all work as in local testing

### API

```bash
curl -s -X POST https://wsc.theserverless.dev/api/check \
  -H "Content-Type: application/json" \
  -d '{"text":"The code was written very quickly."}' | python3 -m json.tool
```

- [ ] Returns valid JSON with correct analysis

### MCP (Remote)

```bash
curl -s https://wsc.theserverless.dev/mcp | python3 -m json.tool
```

- [ ] Returns server info

```bash
curl -s -X POST https://wsc.theserverless.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | python3 -m json.tool
```

- [ ] Returns valid initialize response

```bash
curl -s -X POST https://wsc.theserverless.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' | python3 -m json.tool
```

- [ ] Returns 3 tools

```bash
curl -s -X POST https://wsc.theserverless.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"check_text","arguments":{"text":"This is very good."}}}' | python3 -m json.tool
```

- [ ] Returns analysis with weasel word detected

### MCP Client Integration (Remote)

Add to Claude Desktop config:

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

- [ ] Claude Desktop can connect to the remote MCP server
- [ ] All three tools work via the remote endpoint

---

## 8. Cross-Browser Testing (Frontend)

Test the frontend in each browser:

- [ ] Chrome/Chromium (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)

For each browser verify:
- [ ] Editor text input and highlighting work
- [ ] Scroll sync between editor, line numbers, and highlights
- [ ] Theme switching
- [ ] Fix buttons work
- [ ] Go to buttons scroll correctly
- [ ] Copy buttons in the integration section work
