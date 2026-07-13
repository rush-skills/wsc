# WSC Distribution Submission Kit

Everything below is copy-paste ready. Channels verified live on 2026-07-13.
All submissions/posts are made by Ankur under his own accounts.

> Prerequisite for the MCP registry: publish `wsc-mcp@2.2.1` to npm first
> (it adds the `mcpName` field the registry verifies). See §3.

---

## 1. Canonical copy (reuse everywhere)

**One-liner (121 chars, also the Action description):**

> Flag AI tells, weasel words, passive voice, duplicate words, long sentences, nominalizations, hedging, and filler adverbs

**Short tagline (for tight fields):**

> Prose linter + AI-slop detector for docs, PRs, and agents

**One paragraph:**

> Writing Style Checker (WSC) is a prose linter with an AI-tells detector: alongside classic checks (weasel words, passive voice, duplicate words, long sentences, nominalizations, hedging, filler adverbs) it flags 190+ research-cited words, phrases, and structural patterns overrepresented in AI-generated text — each with an explanation and source. It runs everywhere: a free web editor, an HTTP API, a remote MCP server, a local stdio MCP server (`npx wsc-mcp`), a CLI (`npx wsc-lint`), a GitHub Action, and a pre-commit hook. WSC flags style patterns; it does not claim to prove authorship — every flag is a concrete style improvement regardless of who wrote the text.

**Category tags:** `linter`, `prose-linter`, `technical-writing`, `ai-detection`, `ai-slop`, `mcp`, `mcp-server`, `github-action`, `writing-tools`, `documentation`

**Canonical links:**

| Asset | URL |
|---|---|
| Web editor | https://wsc.theserverless.dev |
| Docs | https://wsc.theserverless.dev/docs |
| Remote MCP | https://wsc.theserverless.dev/mcp |
| Repo | https://github.com/theserverlessdev/wsc |
| CLI on npm | https://www.npmjs.com/package/wsc-lint |
| MCP server on npm | https://www.npmjs.com/package/wsc-mcp |
| Logo 400×400 PNG | https://wsc.theserverless.dev/images/logo-400.png (also at `static/images/logo-400.png`) |

---

## 2. GitHub Marketplace (Action) — ~5 min

The draft release "Writing Style Checker Action v1.1.0" already exists and the
`action.yml` description is now under the 125-char limit.

1. Open https://github.com/theserverlessdev/wsc/releases → edit the draft.
2. Tick **"Publish this Action to the GitHub Marketplace"** (accept the
   Marketplace agreement if prompted; 2FA required).
3. **Primary Category:** Code quality. **Another Category:** Utilities.
4. Tag: `v1.1.0` (already pushed). Publish.

---

## 3. npm: publish wsc-mcp 2.2.1 — ~3 min (do before §4)

2.2.1 adds `"mcpName": "io.github.theserverlessdev/wsc"` to `package.json`,
which the MCP registry reads from the published tarball to verify ownership.

```bash
cd mcp-server
npm publish        # prepublishOnly runs the build
npm view wsc-mcp@2.2.1 mcpName   # should print io.github.theserverlessdev/wsc
```

---

## 4. Official MCP registry — ~15 min (highest leverage)

PulseMCP and several other directories ingest from this automatically.
`mcp-server/server.json` is already written (remote + npm package in one entry).

Publishing runs through the `publish-mcp.yml` workflow (GitHub Actions OIDC),
because the CLI device-flow login cannot see org memberships — it 403s with
"You have permission to publish: io.github.rush-skills/*" no matter what the
org/membership settings are. OIDC from a workflow in the org's repo grants
`io.github.theserverlessdev/*` directly.

```bash
gh workflow run publish-mcp.yml   # or Actions tab → Publish to MCP Registry → Run workflow
```

It also runs automatically on future `wsc-mcp-v*` tags. The wsc-mcp version in
`server.json` must already be on npm before the workflow runs.

Verify: `curl -s "https://registry.modelcontextprotocol.io/v0/servers?search=theserverlessdev"`

---

## 5. Smithery — ~10 min

1. Go to https://smithery.ai/new (log in with GitHub).
2. Submit by URL: `https://wsc.theserverless.dev/mcp` (streamable HTTP, no auth).
   Smithery auto-scans the tools (`check_text`, `fix_duplicates`, `list_word_lists`).
3. Paste the one-paragraph description from §1.

---

## 6. Other MCP directories — ~10 min each

- **Glama:** https://glama.ai/mcp/servers — search for `wsc` first (it
  auto-crawls GitHub); claim the listing if present, otherwise use "Add Server"
  in the nav (requires login).
- **mcp.so:** https://mcp.so/submit — form; repo URL + one-paragraph description.
- **MCP Market:** https://mcpmarket.com/submit — form; repo URL.
- **PulseMCP:** nothing to do — syncs from the official registry within ~1 week.
  If missing after that, email hello@pulsemcp.com.

### Cline MCP Marketplace (GitHub issue)

Open a new issue at https://github.com/cline/mcp-marketplace/issues/new/choose
→ "MCP server submission", with:

- **Repo URL:** `https://github.com/theserverlessdev/wsc` (server lives in `mcp-server/`)
- **Logo:** attach `static/images/logo-400.png` (400×400 PNG)
- **Why it's useful (paste):**

> Writing Style Checker gives Cline a self-editing loop for prose: before
> committing README/docs changes, the agent can lint its own writing for
> weasel words, passive voice, hedging, filler adverbs, and 190+
> research-cited AI tells, each flagged with an explanation and source.
> Install: `npx wsc-mcp` (stdio, zero config). Tested that Cline can set it
> up from the README alone.

- Before submitting, actually test the claim above once in Cline
  ("add the wsc-mcp MCP server from https://github.com/theserverlessdev/wsc").

---

## 7. Awesome-list PRs — ~10 min each

### punkpeye/awesome-mcp-servers (90k stars, active)

Fork → add one line, alphabetical within the best-fitting category (their
legend: 📇 TypeScript · ☁️ cloud · 🏠 local — WSC is all three):

```markdown
- [theserverlessdev/wsc](https://github.com/theserverlessdev/wsc) 📇 ☁️ 🏠 - Prose linter + AI-slop detector: weasel words, passive voice, hedging, and 190+ research-cited AI tells. Remote server at wsc.theserverless.dev/mcp or `npx wsc-mcp`.
```

PR title: `Add Writing Style Checker (wsc)` — their CONTRIBUTING.md invites
AI-assisted PRs to add 🤖🤖🤖 to the title for expedited review (optional).

### hwajongpark/awesome-slop (tiny but the exact niche)

Add to the **Linters** section (alongside slop-gate and Vale):

```markdown
- [Writing Style Checker](https://github.com/theserverlessdev/wsc) - Rule-based linter for AI tells: 190+ research-cited words, phrases, and structural patterns, each flag explained with its source. Web editor, CLI, GitHub Action, and MCP server. Flags style patterns; does not claim authorship detection.
```

### Dormant lists (low expectations, cheap to try)

- `sdras/awesome-actions` (last push Sep 2024) — Utility section:
  `- [Writing Style Checker](https://github.com/theserverlessdev/wsc) - Lint Markdown for AI tells, weasel words, passive voice, and more, with inline PR annotations.`
- `caramelomartins/awesome-linters` (last push Aug 2024) — English/prose section:
  `- [wsc-lint](https://github.com/theserverlessdev/wsc) - Prose linter with an AI-tells detector; CLI, API, MCP, and GitHub Action.`

---

## 8. pre-commit — ship now, list later

`.pre-commit-hooks.yaml` is in the repo, so users can already do:

```yaml
repos:
  - repo: https://github.com/theserverlessdev/wsc
    rev: v1.1.0
    hooks:
      - id: wsc-lint
```

The public listing on pre-commit.com requires **>500 GitHub stars**
(PR to `pre-commit/pre-commit.com`, file `sections/hooks.md`). Revisit after traction.

---

## 9. Show HN draft

**Title (69 chars):**

> Show HN: A CI gate for AI slop in your docs (linter, MCP, GitHub Action)

**URL:** https://wsc.theserverless.dev

**Text (first comment, post right after submitting):**

> I built a prose linter whose main trick is an AI-tells detector: 190+
> words, phrases, and structural patterns overrepresented in AI-generated
> text (each flag cites the research it comes from), alongside the classic
> checks — weasel words, passive voice, hedging, nominalizations, filler
> adverbs, long sentences, duplicate words.
>
> Honest framing: it does not detect authorship, and I don't think
> rule-based tools can. Every flag is just a style improvement that happens
> to also be an AI tell — so false positives still make the text better.
>
> It runs as a web editor (client-side, text never leaves the browser), a
> CLI (npx wsc-lint), a GitHub Action that annotates PRs, and an MCP server
> (remote or npx wsc-mcp) so a coding agent can lint its own prose before
> committing docs. The repo dogfoods it: CI gates every push at zero
> writing issues, including everything this tool itself wrote.
>
> Stack: SvelteKit on a free-tier Cloudflare Worker; the detection engine
> is shared TypeScript across all surfaces. No accounts, no tracking beyond
> cookieless page analytics.

Rules check: title starts with "Show HN", tryable without signup, be
available for comments a few hours after posting.

---

## 10. Product Hunt (optional, after HN)

- **Name:** Writing Style Checker
- **Tagline (39 chars):** Catch AI slop in your docs and PRs
- **Description:** one-paragraph from §1.
- **Links:** website + GitHub. Gallery: screenshot of the editor with AI
  tells highlighted (`static/images/ss.png` exists; retake at 1270×760 if PH complains).
- Launch at 12:01 AM PT for a full voting day.

---

## 11. Deferred (needs new artifacts)

- **Claude Code plugin directory** — package WSC as a plugin (skill wrapping
  `wsc-lint` + MCP config), then submit via the form at
  https://clau.de/plugin-directory-submission (PRs to the GitHub repos are auto-closed).
- **Docker MCP Catalog** — needs a Dockerfile for wsc-mcp; PR to
  https://github.com/docker/mcp-registry.

---

## Tracking

| Channel | Status | Date | Notes |
|---|---|---|---|
| GitHub Marketplace | ☐ | | draft release ready, tick the box |
| npm wsc-mcp 2.2.1 | ✅ | 2026-07-13 | |
| Official MCP registry | ✅ | 2026-07-14 | via publish-mcp.yml OIDC workflow |
| Smithery | ✅ | 2026-07-14 | badge in README |
| Glama | ☐ | | |
| mcp.so | ☐ | | |
| MCP Market | ☐ | | |
| Cline marketplace | ☐ | | |
| PulseMCP | ⏳ | | auto after registry, ~1 week |
| awesome-mcp-servers | ⏳ | 2026-07-14 | [PR #10039](https://github.com/punkpeye/awesome-mcp-servers/pull/10039) |
| awesome-slop | ⏳ | 2026-07-14 | [PR #2](https://github.com/hwajongpark/awesome-slop/pull/2) |
| awesome-actions | ⏳ | 2026-07-14 | [PR #843](https://github.com/sdras/awesome-actions/pull/843), dormant list |
| awesome-linters | ⏳ | 2026-07-14 | [PR #149](https://github.com/caramelomartins/awesome-linters/pull/149), dormant list |
| Show HN | ☐ | | |
| Product Hunt | ☐ | | |
