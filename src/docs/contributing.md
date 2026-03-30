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

### Improving Detectors

Each detector works differently:

| Detector | How it works | How to improve |
|----------|-------------|----------------|
| Weasel Words | Word list matching (95 words) | Add words to `allWeaselWords` in `words.ts` |
| Passive Voice | Grammar patterns (auxiliary + past participle) | Add irregular verbs to `irregularVerbs` |
| Duplicate Words | Adjacent word repetition pattern | Pattern-based, rarely needs changes |
| Long Sentences | Word count threshold (default: 30) | Configurable via `maxWords` |
| Nominalizations | Word pairs with suggestions (230 pairs) | Add `{word, suggestion}` to `nominalizations` |
| Hedging | Phrase list matching (100 phrases) | Add phrases to `hedgingPhrases` |
| Filler Adverbs | Word list matching (140 words) | Add words to `fillerAdverbs` |
| AI Tells | Vocabulary (37 words) + phrase (31 phrases) matching | Add to `aiTellsVocabulary` or `aiTellsPhrases` |

**AI Tells** flags words and phrases that are statistically overrepresented in AI-generated text (10x-200x vs human writing). Sources: GPTZero corpus analysis, CMU PNAS study. Each entry includes a reason explaining why it's flagged. To add new AI tells, include the word/phrase and a reason string in `src/core/words.ts`.

### Suggest a Word

Think a word or phrase should be added to a detector list? Visit the [Word Library](/words) page and use the "Suggest a Word" form. It checks if the word already exists before opening a GitHub issue.
