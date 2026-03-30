## Configuration

Create a `.wscrc.json` file in your project root to customize which detectors run and which words they flag.
The CLI, GitHub Action, and local MCP server auto-discover this file.

### JSON Schema

Add a `$schema` key for autocompletion and validation in your editor:

```json
{
  "$schema": "https://wsc.theserverless.dev/schema.json"
}
```

The full schema is published at `https://wsc.theserverless.dev/schema.json`.

Generate a starter config with the CLI:

```shell
npx wsc-cli init
```

### Detector Reference

All 8 detectors are enabled by default. Set `enabled: false` to disable any detector.

| Detector | Options |
|----------|---------|
| `weaselWords` | `enabled`, `add`, `remove` |
| `passiveVoice` | `enabled` only — uses grammar-based pattern matching (auxiliary verb + past participle), not a word list |
| `duplicateWords` | `enabled` only — detects adjacent repeated words via pattern matching |
| `longSentences` | `enabled`, `maxWords` (integer, default: 30) |
| `nominalizations` | `enabled`, `add` (array of `{word, suggestion}`), `remove` |
| `hedging` | `enabled`, `add`, `remove` |
| `adverbs` | `enabled`, `add`, `remove` |
| `aiTells` | `enabled`, `add`, `remove` (vocabulary), `addPhrases`, `removePhrases` |

### Word List Overrides

**add** appends words to the built-in list (case-insensitive, no duplicates).

**remove** removes words from the built-in list (case-insensitive match).

Browse the full built-in word lists on the [Word Library](/words) page.

### Full Example

```json
{
  "$schema": "https://wsc.theserverless.dev/schema.json",
  "detectors": {
    "weaselWords": {
      "add": ["arguably", "basically"],
      "remove": ["many"]
    },
    "passiveVoice": {
      "enabled": false
    },
    "longSentences": {
      "maxWords": 25
    },
    "nominalizations": {
      "add": [
        { "word": "delegation", "suggestion": "delegate" }
      ]
    },
    "hedging": {
      "remove": ["I think"]
    },
    "aiTells": {
      "remove": ["robust"],
      "addPhrases": ["circle back"]
    }
  }
}
```
