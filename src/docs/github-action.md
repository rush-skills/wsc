## GitHub Action

Automatically check writing style in pull requests and pushes.

### Basic Usage

```yaml
# .github/workflows/writing-check.yml
name: Writing Style Check
on: [push, pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: theserverlessdev/wsc@master
        with:
          files: "**/*.md"
```

### Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `files` | `**/*.md` | Glob pattern for files to check |
| `config` | _(none)_ | Path to `.wscrc.json` config file |
| `max-warnings` | `-1` (unlimited) | Maximum warnings before failing |
| `only-changed` | `false` | Only check files changed in this PR |

### Outputs

| Output | Description |
|--------|-------------|
| `total-issues` | Total number of issues found across all files |

### Check Only Changed Files in PRs

```yaml
# .github/workflows/writing-check.yml
name: Writing Style Check
on: pull_request

jobs:
  check:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: read
    steps:
      - uses: actions/checkout@v4
      - uses: theserverlessdev/wsc@master
        with:
          only-changed: "true"
          max-warnings: "10"
```

### With Custom Config

```yaml
- uses: theserverlessdev/wsc@master
  with:
    files: "docs/**/*.md"
    config: ".wscrc.json"
```

Issues appear as inline annotations on the pull request's "Files changed" tab using GitHub's `::warning` format.
