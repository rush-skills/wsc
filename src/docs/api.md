## HTTP API

Send text to the public API and receive structured results.

### POST /api/check

```shell
curl -X POST https://wsc.theserverless.dev/api/check \
  -H "Content-Type: application/json" \
  -d '{"text":"The code was written very quickly."}'
```

**Response:**

```json
{
  "summary": {
    "total": 2, "weaselWords": 1, "passiveVoice": 1,
    "duplicateWords": 0, "longSentences": 0,
    "nominalizations": 0, "hedging": 0, "adverbs": 0
  },
  "issues": {
    "weaselWords": [{ "word": "very", "index": 21, "line": 1, ... }],
    "passiveVoice": [{ "phrase": "was written", "index": 9, ... }],
    ...
  },
  "meta": { "characterCount": 34, "wordCount": 6, "processingTimeMs": 2 }
}
```

### With Config

Pass an optional `config` object to customize detectors per-request:

```shell
curl -X POST https://wsc.theserverless.dev/api/check \
  -H "Content-Type: application/json" \
  -d '{"text":"...", "config":{"detectors":{"adverbs":{"enabled":false}}}}'
```

### GET /api/detectors

Returns metadata about all detectors and their word/phrase counts.

### Limits

- **Max text:** 100,000 characters per request
- **CORS:** Enabled for all origins
- **Errors:** 400 for missing/invalid text or exceeding limits
