# Writing Style Checker GitHub Action

Check your writing for style issues in CI. Detects weasel words, passive voice, duplicate words, long sentences, nominalizations, hedging language, and filler adverbs.

## Usage

```yaml
- uses: theserverlessdev/wsc-action@v1
  with:
    files: '**/*.md'
```

## Inputs

| Input | Description | Default |
|-------|-------------|---------|
| `files` | Glob pattern for files to check | `**/*.md` |
| `config` | Path to `.wscrc.json` config file | — |
| `max-warnings` | Max warnings before failing | `-1` (unlimited) |
| `only-changed` | Only check files changed in this PR | `false` |

## Outputs

| Output | Description |
|--------|-------------|
| `total-issues` | Total number of issues found |

## Examples

### Check all markdown files

```yaml
- uses: theserverlessdev/wsc-action@v1
  with:
    files: '**/*.md'
```

### Fail if more than 20 issues

```yaml
- uses: theserverlessdev/wsc-action@v1
  with:
    files: '**/*.md'
    max-warnings: 20
```

### Only check changed files in PRs

```yaml
- uses: theserverlessdev/wsc-action@v1
  with:
    files: '**/*.md'
    only-changed: true
```

### Use a custom config

```yaml
- uses: theserverlessdev/wsc-action@v1
  with:
    files: 'docs/**/*.md'
    config: .wscrc.json
```

## Links

- [Writing Style Checker](https://wsc.theserverless.dev)
- [CLI Documentation](https://www.npmjs.com/package/wsc-cli)
- [GitHub Repository](https://github.com/theserverlessdev/wsc)
