# Testing

This document covers the testing strategy for the Writing Style Checker.

---

## Automated Tests

The project has 341 tests across 18 files. Run them all with:

```bash
npm test
```

Run with coverage:

```bash
npm run test:coverage
```

### Test Structure

```
tests/
├── core/                          # Unit tests
│   ├── words.test.ts              # Word list integrity (duplicates, overlap, lowercase)
│   ├── detector.test.ts           # Original 3 detectors
│   ├── detector-sentences.test.ts # Long sentence detector
│   ├── detector-nominalizations.test.ts
│   ├── detector-hedging.test.ts
│   ├── detector-adverbs.test.ts
│   ├── config.test.ts             # Config merging, validation, file loading
│   └── analyzer.test.ts           # Unified analyzeText()
├── routes/
│   ├── api-check.test.ts          # HTTP API endpoint
│   └── mcp-route.test.ts          # MCP SvelteKit route
├── mcp/
│   └── handler.test.ts            # Remote MCP JSON-RPC handler
├── mcp-server/
│   └── server.test.ts             # Local stdio MCP server
├── cli/
│   └── formatter.test.ts          # CLI output formatters
├── integration/
│   └── analyzer-config.test.ts    # Every config combo with realistic text
├── contracts/
│   ├── api-schema.test.ts         # API response shape compliance
│   └── mcp-protocol.test.ts       # JSON-RPC spec compliance
└── snapshots/
    ├── api-response.test.ts       # API response stability
    └── mcp-output.test.ts         # MCP output stability
```

### Running Specific Tests

```bash
npx vitest run tests/core/detector.test.ts   # Single file
npx vitest run tests/core/                    # Directory
npx vitest run -t "detects weasel words"      # By name
npx vitest                                     # Watch mode
```

---

## Build Verification

### SvelteKit App

```bash
npm run build
```

- [ ] Build completes without errors
- [ ] Output appears in `.svelte-kit/cloudflare/`

### Type Check

```bash
npm run check
```

- [ ] 0 errors, 0 warnings

### MCP Server

```bash
cd mcp-server && npm run build && cd ..
```

- [ ] Build completes, output in `mcp-server/dist/`

### CLI

```bash
cd cli && npm ci && npm run build && cd ..
```

- [ ] Build completes, output in `cli/dist/`

---

## Frontend Manual Testing

Start the dev server: `npm run dev`

### Editor (all 7 detectors)

- [ ] Default sample text triggers all 7 detector types
- [ ] Weasel words highlighted yellow, passive voice blue, duplicates red
- [ ] Long sentences highlighted orange, nominalizations purple, hedging green, adverbs pink
- [ ] Stats bar shows W, P, D, S, N, H, A counts
- [ ] Issue lists appear for each detector with Go to buttons
- [ ] Fix buttons on duplicates work
- [ ] Highlights align with text and follow scrolling

### Theme & Layout

- [ ] Light / Dark / System themes work; highlights visible in both
- [ ] Responsive at mobile width (~375px)

### Integration Section

- [ ] 4 tabs: HTTP API, MCP Remote, MCP Local, CLI
- [ ] API tab shows updated response with all 7 issue types + config example
- [ ] MCP Remote tab lists 4 tools including list_word_lists
- [ ] MCP Local tab lists 4 tools including check_file
- [ ] CLI tab shows commands, output formats
- [ ] Copy buttons work

---

## API Manual Testing

With `npm run dev` running:

```bash
# Valid request
curl -s -X POST http://localhost:5173/api/check \
  -H "Content-Type: application/json" \
  -d '{"text":"The utilization was written very quickly. I think it is totally fine."}' | python3 -m json.tool

# With config
curl -s -X POST http://localhost:5173/api/check \
  -H "Content-Type: application/json" \
  -d '{"text":"very good","config":{"detectors":{"weaselWords":{"enabled":false}}}}' | python3 -m json.tool

# GET /api/check (docs)
curl -s http://localhost:5173/api/check | python3 -m json.tool

# GET /api/detectors
curl -s http://localhost:5173/api/detectors | python3 -m json.tool

# GET /health
curl -s http://localhost:5173/health | python3 -m json.tool

# Error cases
curl -s -X POST http://localhost:5173/api/check -H "Content-Type: application/json" -d '{}'
curl -s -X POST http://localhost:5173/api/check -H "Content-Type: application/json" -d 'not json'
```

---

## MCP Manual Testing

```bash
# GET info
curl -s http://localhost:5173/mcp | python3 -m json.tool

# List tools (should be 4)
curl -s -X POST http://localhost:5173/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | python3 -m json.tool

# check_text with config
curl -s -X POST http://localhost:5173/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"check_text","arguments":{"text":"very good","config":{"detectors":{"weaselWords":{"enabled":false}}}}}}' | python3 -m json.tool
```

### Local MCP (stdio)

```bash
cd mcp-server && npm run build && cd ..
timeout 2 node mcp-server/dist/mcp-server/index.js < /dev/null 2>&1; echo "Exit: $?"
```

---

## CLI Manual Testing

```bash
cd cli && npm ci && npm run build && cd ..

# Check stdin
echo "The code was written very quickly." | node cli/dist/cli/index.js check --stdin

# List detectors
node cli/dist/cli/index.js list

# List weasel words
node cli/dist/cli/index.js list weaselWords

# Init config
node cli/dist/cli/index.js init
cat .wscrc.json
rm .wscrc.json
```

---

## Production Verification

After deploying:

```bash
# Health
curl -s https://wsc.theserverless.dev/health | python3 -m json.tool

# API
curl -s -X POST https://wsc.theserverless.dev/api/check \
  -H "Content-Type: application/json" \
  -d '{"text":"very good"}' | python3 -m json.tool

# MCP tools
curl -s -X POST https://wsc.theserverless.dev/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | python3 -m json.tool

# Frontend loads
curl -s -o /dev/null -w "%{http_code}" https://wsc.theserverless.dev
```

---

## Cross-Browser Testing

Test in Chrome, Firefox, and Safari:
- [ ] Editor highlighting and scrolling
- [ ] Theme switching
- [ ] Fix and Go to buttons
- [ ] Copy buttons in integration section
