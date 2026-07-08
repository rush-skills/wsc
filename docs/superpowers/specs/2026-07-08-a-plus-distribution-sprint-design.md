# A+ Distribution Sprint — Design

**Date:** 2026-07-08
**Status:** Draft for review
**Goal:** Take WSC from zero distribution presence to listed in every channel where its competitors get discovered, with the product repositioned around its differentiator (the AI-tells detector) and a short list of verified defects fixed so that incoming traffic converts. Bounded: ~4 weeks, then freeze.

## Background

A six-agent investigation (2026-07-08) established:

- The product works and is well-tested, but adoption is zero: 1 GitHub star, 0 monthly `wsc-lint` downloads, ~30 `wsc-mcp` downloads, absent from every MCP registry, awesome list, and marketplace checked — including `awesome-slop`, which lists direct competitors.
- The "standalone, explainable, research-cited AI-tells linter" position is open. Rule-based rivals are Vale add-ons or near-zero-star CLIs; commercial detectors are black-box classifiers, not linters. Demand is proven (a prompt-only agent skill in this niche gained 2,200 stars in 4 months).
- Several user-facing defects would burn incoming traffic: a broken `uses:` snippet in the README, docs describing a deleted MCP tool, five package descriptions that omit the marquee detector, verified passive-voice detector gaps, and Markdown handling that differs across surfaces.

## Success criteria and freeze rule

Measured ~8 weeks after launch (sprint week 12):

- **Signal:** ≥50 GitHub stars, or ≥500 combined npm downloads/month, or ≥1 inbound freelance lead attributable to WSC → selectively invest in product-bet items (density scoring, suppression comments, `--fix`).
- **No signal:** freeze. Health checks and opportunistic word-list updates only. The project remains a finished portfolio piece with a hire-me funnel.

Cloudflare Web Analytics (added in Week 1) is the measurement instrument; without it the rule cannot be evaluated.

## Non-goals (explicitly rejected)

- VS Code extension / LSP server (crowded: Harper, vale-ls; revisit only on signal)
- Custom user-supplied regex rules on the hosted Worker (ReDoS/abuse risk)
- Document-level AI-density scoring, published benchmark corpus, promised release cadences (product-bet items, deferred)
- Per-word programmatic SEO pages, i18n beyond two small Unicode fixes, ChatGPT `ai-plugin.json` (discontinued format — delete it)
- The 18-file uniform-Issue-type refactor as a standalone task (do lazily when a feature forces it; severity tiers below are scoped to avoid it)

## Week 1 — Pre-flight (fix what would burn traffic)

### 1.1 Docs and metadata correctness sweep

- `README.md` (~line 210) and `static/llms.txt`: fix `uses: theserverlessdev/wsc@master` → the working `theserverlessdev/wsc/action@master` form (superseded again in Week 3 by `@v1`).
- Remove `list_weasel_words` from the README MCP tools table and CLAUDE.md (tool no longer exists).
- Add AI tells to the five stale "7 detectors" descriptions: `mcp-server/package.json`, `cli/package.json`, `cli/README.md`, `action/README.md`.
- Delete `static/.well-known/ai-plugin.json` (dead ChatGPT-plugins format, factually wrong).
- Add `repository`, `homepage`, and `bugs` fields to `cli/package.json` and `mcp-server/package.json` (unblocks npm→repo linking and auto-indexing registries).
- Read the CLI version from its `package.json` instead of the hardcoded `'1.2.0'` in `cli/cli.ts:185`; fix the remote MCP `serverInfo` version (`src/mcp/handler.ts:220` says 1.0.0).
- Verify published npm versions match `package.json` on master for both packages; publish if drifted.
- Delete dead `formatText` and its misleading `getLineCol` stub from `cli/formatter.ts`; wire the declared-but-never-imported `picocolors` dependency into the text formatter (colored detector labels now, severity-colored `[error]`/`[warn]`/`[info]` badges once Week 3 lands). Make `--no-color` functional (a no-op today) and honor `NO_COLOR`/non-TTY, which picocolors detects automatically.

### 1.2 Detector quality fixes (all verified defects, all with tests)

- **Passive voice** (`src/core/detector.ts:54-83`):
  - Allow up to two gap words between auxiliary and participle: `(?:not|never|\w+ly)` — fixes misses on "was quickly eaten", "was not fixed".
  - Add get-passive auxiliaries (get/gets/got/gotten/getting).
  - Expand the `notParticiples` stoplist (currently 10 words) with at least: need, speed, tired, talented, excited, interested, supposed, used, indeed, bed, seed, feed, breed, hundred, sacred. Fixes false flags on "there is need", "was tired", "is talented".
- **Phrase matches spanning paragraphs** (`src/core/detector.ts:22-24`): bound `flexibleSource` whitespace to at most one newline (`[ \t]*\n?[ \t]*`) so "…was kind\n\nOf course…" stops matching "kind of".
- **Unicode sharp edges:** compile word-boundary regexes with `/u` and `\p{L}`-based classes so "café café" is caught as a duplicate. (Full i18n remains out of scope.)

### 1.3 Markdown masking into core (one document, same result on every surface)

Today `maskMarkdown` lives in `cli/markdown.ts` and only the CLI uses it; the web editor, HTTP API, remote MCP, and even `mcp-server`'s `check_file` lint code blocks and tables as prose.

- Move `maskMarkdown` (pure, browser-safe) to `src/core/markdown.ts`; the CLI re-imports from core.
- Masking becomes a preprocessing step **inside** `analyzeText`, activated by a new config/request flag, so the original text stays available to future document-level passes (this avoids baking in rework if a doc-signals layer is built later).
- Surface wiring:
  - HTTP API `POST /api/check` and MCP `check_text`: optional `format: "markdown" | "plain"`, default `"plain"` (backward compatible).
  - `mcp-server` `check_file`: infer from file extension, same rule as the CLI.
  - Web editor: a persisted "Markdown mode" toggle, default off.
- **Masking adjacency fix:** mask with `\u0000` instead of spaces so blanked regions no longer create false adjacency ("Run `npm` run build" flagging duplicate "run"; "was `--force` deleted" flagging passive). NUL is neither `\s` nor `\w`, so existing detector regexes stop bridging masked gaps without per-detector changes. Word/sentence counts must strip NULs; add tests for both former false positives.

### 1.4 Free-tier guardrails and measurement

- Add the Cloudflare Web Analytics beacon (free, cookieless) to `src/app.html`.
- Rate limiting: one Cloudflare rate-limiting rule (free plan includes one) covering `/api/*` and `/mcp`, suggested 30 req/min per IP. **Ankur does this in the dashboard** (wrangler cannot manage WAF rules on free tier).
- Scope the privacy claim in the footer: "The editor analyzes text in your browser — it never leaves your device. The API tester, hosted API, and MCP endpoint send text to our server for analysis. Anonymous, cookieless page analytics only."

### 1.5 Repositioning (AI-tells first)

- Site `<title>`/OG/H1: lead with both jobs, e.g. "Writing Style Checker — prose linter + AI writing tells detector".
- GitHub repo description: "Prose linter + AI-slop detector: weasel words, passive voice, hedging, and 190+ research-cited AI tells. Web, API, MCP, CLI, GitHub Action." Topics: `mcp-server`, `mcp`, `prose-linter`, `ai-slop`, `ai-detection`, `technical-writing`, `github-action`, `linter`, `writing-tools`.
- Honest-positioning statement (README section + docs page paragraph + one line near the AI-tells legend in the editor): WSC flags patterns overrepresented in AI text and explains each with its research source; it does not and cannot prove authorship, and every flag is a style improvement regardless of who wrote the text. Cite the Stanford non-native-speaker false-positive findings as the reason for this stance.

### 1.6 Hire-me funnel

- Footer + README: "Built by Ankur Singh — freelance AI agents / automation / web engineer" linking to https://anks.in (confirmed at spec review).

## Week 2 — Registry and directory blast

Preparation (build): a `server.json` manifest per the official MCP registry schema, `mcpName: "io.github.theserverlessdev/wsc"` in `mcp-server/package.json`, a 400×400 PNG logo, and a submission kit (one-paragraph and one-line descriptions, category tags, screenshots) so every form is copy-paste.

Submissions (**Ankur**, ~3.5h, accounts/auth are his):

1. Official MCP registry via `mcp-publisher` (GitHub OAuth for the `io.github.theserverlessdev` namespace).
2. PulseMCP, Glama, mcp.so; Smithery (the already-deployed remote endpoint `https://wsc.theserverless.dev/mcp` qualifies by URL); Cline marketplace (GitHub issue + logo).
3. Awesome-list PRs from his account: `hwajongpark/awesome-slop`, `punkpeye/awesome-mcp-servers`, `caramelomartins/awesome-linters`, one awesome-technical-writing list. (Risk: some lists have notability bars; acceptable to resubmit after launch traction.)
4. pre-commit: add `.pre-commit-hooks.yaml` (`language: node` hook wrapping wsc-lint) to the repo (build), then PR the repo into `pre-commit.github.io`'s `all-repos.yaml` (Ankur).

## Week 3 — Demo polish

### 3.1 Marketplace-ready GitHub Action

- First verify (30 min) whether a root-level `action.yml` in this monorepo satisfies Marketplace listing (one listing per repo, metadata file at root). If yes: move `action/action.yml` to the repo root, update the dogfood workflow to `uses: ./`, keep `action/action.yml` as a deprecated copy for one release. If no: create a thin `theserverlessdev/wsc-action` repo instead.
- Run `npx wsc-lint@<pinned>` instead of `npm ci && npm run build` from source (removes ~30-60s per CI run and the fragility).
- Take the issue count from `--format json` instead of grepping the human summary line.
- Add a `branding:` block (icon `edit-3`, color `purple`), write a `$GITHUB_STEP_SUMMARY` table (sidesteps GitHub's 10-visible-annotation cap), tag `v1`, publish to the Marketplace with the release, update all docs from `@master` to `@v1`.

### 3.2 Agent skill + Claude Code plugin

- A `SKILL.md` (Claude Code / Cursor compatible) that wraps `wsc-lint`: check the working tree's Markdown, explain each finding with its research-cited reason, and guide fixes. Lives in the repo; submitted to the claude-community plugin catalog (`claude plugin validate`, then the claude.com/plugins form — submission is Ankur's).
- The plugin bundles the MCP server config plus the skill, so "Claude lints its own prose before saving the doc" works out of the box.

### 3.3 Near-zero-FP artifact pack (new AI-tells entries)

Chatbot/RAG markup artifacts that are essentially impossible in human prose — the "caught red-handed" class that demos brilliantly:

- Patterns: `turn0search\d+`, `oaicite`, `oai_citation`, `contentReference`, `attributableIndex`, `utm_source=chatgpt.com` (the ChatGPT-specific parameter only — not `utm_source` generally).
- Phrases: prompt-refusal and assistant-voice leakage ("I cannot provide", "I can't assist with", "as requested, here is", "I hope this helps").
- All descriptions/reasons written originally (WP:AISIGNS is CC BY-SA; we cite it as a reference, we do not copy its prose).
- Implementation note: verify these survive Markdown masking (link URLs must not be blanked before the `utm_source` pattern runs, or the pattern must run pre-mask).

### 3.4 Severity tiers (scoped to avoid the big refactor)

- Add optional `severity: 'error' | 'warning' | 'info'` to AI-tells vocabulary/phrase/pattern entries, promoting the existing Tier 1-3 comments in `words.ts` to data. Artifact-pack entries are `error`; "delve"-class vocabulary `warning`; weak tells ("robust") `info`. All other detectors implicitly `warning`.
- Fix the known `align with` variant gap while touching the list.
- Surfacing: severity included in issue objects (additive, backward compatible), shown in CLI text output (`[error]`/`[warn]`/`[info]`), mapped to `::error`/`::warning`/`::notice` in the github format, badge color in the web IssueList.
- Config: `aiTells.minSeverity` filter (default shows all). Exit-code policy stays count-based (unchanged) — severity-aware gating is deferred.

## Week 4 — Launch

Build: drafts for (a) a Show HN post — angle: "a CI gate for AI slop in your docs, plus an MCP server so the agent lints its own prose", with the self-dogfooding repo as proof; (b) a dev.to/lobste.rs research write-up ("why these ~100 words — the corpus studies behind AI tells"); (c) honest comparison notes for Vale/Harper threads ("lighter than Vale, zero config, AI tells built in").

**Ankur (launch day, ~4h):** posts under his own accounts and handles comment threads. Per standing rules, Claude never posts on his behalf. Sequencing: launch only after Weeks 1-3 are deployed, so the traffic spike lands on fixed docs, analytics, and rate limiting.

## Testing and verification

- Every detector change lands with unit tests (existing `tests/core/` patterns); the two masking false positives and three passive-voice classes get named regression tests.
- `npm run check && npm test && npm run build` green on Node 20/22; CLI and mcp-server package builds green.
- The dogfood workflow (`writing.yml`, gates at zero) must stay green — new AI-tells entries may not flag the repo's own docs, or `.wscrc.json` gets a justified suppression.
- Manual smoke per surface after the masking change: same README via web editor, API (`format: "markdown"`), CLI, and `check_file` returns identical counts.
- `/health` endpoint and `health.yml` must pass post-deploy.

## Risks

- **HN variance:** the angle is the live wire (comparable: 589-point slop story) but flops are the base rate; cost is capped at one drafted post.
- **List acceptance:** a low-star repo self-submitted to awesome lists may be rejected; resubmit after traction, no sunk cost.
- **License hygiene:** all list expansions written in original prose, sources cited as references (WP:AISIGNS and Vale rulesets are CC BY-SA).
- **Free-tier quota:** rate limiting precedes launch; the Worker serves ~100k req/day, and the editor itself is client-side, so a front-page spike degrades only the API/MCP surfaces.

## Out-of-scope follow-ups recorded for the post-freeze decision

Density scoring layer, inline `wsc-disable` suppression, CLI `--fix`, AI-tells suggestion fields + de-slop MCP tool, `wsc-core` npm package, unifying the two MCP server implementations, Action density gating.
