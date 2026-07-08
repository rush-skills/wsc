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
| `cli/` | CLI tool (npm: `wsc-lint`) |
| `action/` | GitHub Action composite action |
| `tests/` | Vitest test suites (mirrors `src/` structure) |

### Improving Detectors

Each detector works differently:

| Detector | How it works | How to improve |
|----------|-------------|----------------|
| Weasel Words | Word list matching (95 words) | Add words to `allWeaselWords` in `words.ts` |
| Passive Voice | Grammar patterns (auxiliary + past participle) | Add irregular verbs to `irregularVerbs` |
| Duplicate Words | Adjacent word repetition pattern | Pattern-based, rarely needs changes |
| Long Sentences | Word count threshold (default: 30) | Configurable via `maxWords` |
| Nominalizations | Word pairs with suggestions (245 pairs) | Add `{word, suggestion}` to `nominalizations` |
| Hedging | Phrase list matching (100 phrases) | Add phrases to `hedgingPhrases` |
| Filler Adverbs | Word list matching (139 words) | Add words to `fillerAdverbs` |
| AI Tells | Vocabulary (98 entries + inflected variants) + phrases (83) + structural regex patterns (12) | Add to `aiTellsVocabulary`, `aiTellsPhrases`, or `aiTellsPatterns` |

**AI Tells** flags words, phrases, and sentence constructions that AI systems produce more than humans. Sources: Kobak et al. 2025 (Science Advances), Juzek & Ward 2025 (COLING), Liang et al. 2024 (Stanford), and Reinhart et al. 2025 (PNAS). Wikipedia's "Signs of AI writing" catalogue and AI-detection vendor reports fill the gaps. Each entry includes a reason explaining why the linter flags it. Vocabulary entries may list inflected `variants` that match along with the base word. Structural patterns carry names (e.g. `negative-parallelism` for `It's not just X — it's Y`), and users can disable each one with `removePatterns`. To add new AI tells, include the word/phrase and a reason string in `src/core/words.ts`.

### Suggest a Word

Want to add a word or phrase to a detector list? Visit the [Word Library](/words) page and use the "Suggest a Word" form. It checks if the word already exists before opening a GitHub issue.
