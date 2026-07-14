# The AI-Slop Curve — corpus study design

**Date:** 2026-07-14
**Status:** Draft for review
**Goal:** Produce a publishable, reproducible data study measuring AI tells in public developer writing over time (2019–2026), collected and computed entirely on Ankur's machine with free APIs. The study is the launch asset: article + charts + Show HN + repro kit, all of which only exist because WSC exists.

## Research questions

1. **Prevalence:** How often do AI tells appear in public developer writing today vs. the pre-ChatGPT baseline (before 2022-11-30)?
2. **Composition:** Which tells drove the change — vocabulary ("delve", "robust"), phrases ("it's worth noting"), or structural patterns ("It's not just X — it's Y")?
3. **Location:** Where is the shift strongest — release notes, READMEs, or conversational text (HN comments)?
4. **Calibration:** How do these rates compare against known-human and known-LLM reference text?

We publish whatever the data says. A flat curve is still a story ("developer prose has resisted the slop wave"); an honest negative beats a tortured positive, and the framing must repeat WSC's standing position: population-level style shift, never per-document authorship claims.

## Corpora (all free, all local)

### C1 — GitHub release notes (primary)
Release bodies are prose written at a **known date**, continuously, by the same population — the cleanest longitudinal signal available.

- Frame: ~2,000 repos (top-starred across `language:` slices to avoid pure-JS bias), all releases 2019-01→2026-06 via `GET /repos/{o}/{r}/releases` (paginated).
- Expected N: 100k–200k release bodies.
- Cost: GitHub REST, ~5–15k requests, authenticated at 5k/hr via existing `gh` token. One evening, resumable.

**The bot confounder is the study's biggest threat:** release-please, semantic-release, dependabot, and AI changelog generators produce templated bodies. Without aggressive filtering the curve measures bot adoption, not writing style. Filters: `author.type == "Bot"` or `[bot]` suffix; bodies that are ≥80% commit-list lines (`* <sha> ...`, `- <PR link>`); "Full Changelog:" -only bodies; per-repo template dedupe (near-duplicate shingling); minimum 50 prose words after masking. Report the excluded fraction — that number is itself interesting.

### C2 — README birth cohorts (secondary)
New repos each year answer "how do people write *new* docs?", avoiding the frozen-README bias of top-starred repos.

- Frame: per year 2019–2026, sample ~300 repos from `created:{year} stars:>100` (search API, language-sliced), fetch README as of ~6 months post-creation (commits API `until=` → `contents?ref=`).
- Expected N: ~2,400 READMEs, ~2–5k requests.

### C3 — Hacker News comments (conversational control)
Same lexicon over informal human discussion, bulk-downloadable by month via the Algolia HN API (`created_at_i` range paging, no auth). Sample ~30k comments/quarter, 2019–2026. If AI tells rise in docs but not in HN comments, that contrast is one of the article's strongest charts.

### C4 — Calibration sets (one-time)
- **Known-human:** text committed before 2022-06 (subset of C1/C2 by date) — the baseline is built in.
- **Known-LLM:** a public dataset of LLM outputs (HC3 or similar free corpus; verify license before download). Purpose: show the tells-per-1k-words distribution separates known-human from known-LLM at the population level, which pre-empts the "these words were always common" objection with data.

### Explicitly out (v1)
arXiv abstracts (covered by Kobak et al.; 4.5 GB download; revisit for a follow-up), Wikipedia revisions (heavy), npm READMEs-per-version (tarball downloads too costly).

## Metrics

Per document: `date`, `corpus`, `repo/source`, `prose_words` (post-masking), counts by detector tier (AI-tells vocabulary / phrases / structural, each also per-entry), plus classic-detector counts (weasel, passive, hedging) as a stability reference — classic issues should stay ~flat, which doubles as an internal control.

Published aggregates:
- **Tells per 1,000 prose words**, monthly/quarterly, per corpus (headline chart).
- **% of documents with ≥1 tell** (robust to a few extreme docs).
- **Per-tell time series** for the top ~15 movers ("the rise of delve", em-dash cadence, "not just X — it's Y").
- Classic-detector rates over the same period (flat line = credibility).
- Known-human vs known-LLM rate distributions (calibration violin/histogram).

## Pipeline (all in-repo under `study/`, data gitignored)

```
study/
  collect/   01-repos.ts  02-releases.ts  03-readmes.ts  04-hn.ts   # → data/raw/*.jsonl (cached, resumable)
  clean/     10-filter.ts                                            # bots, templates, non-English, dedupe, min-length
  analyze/   20-run-wsc.ts                                           # analyzeText(markdown:true) per doc → data/scored.jsonl
  aggregate/ 30-timeseries.ts                                        # → results/*.csv (committed)
  charts/    40-charts.py                                            # matplotlib → results/charts/*.svg
```

- Collection is cache-first and resumable (one JSONL per repo/month; skip if present); a full run survives rate-limit pauses unattended.
- Analysis reuses `analyzeText` from `src/core` directly — the study doubles as a large-scale soak test of the detector.
- `analyze` must record *which* tell matched (entry word/phrase/pattern name), not just counts.
- Language filter: cheap heuristic (ASCII ratio + stopword check) — imperfect is fine if reported.
- Raw text is **never** committed or republished (licensing); the repo ships scripts + aggregate CSVs + doc-URL lists so anyone can re-collect.

## Phasing

- **Phase 0 — pilot (~1 evening):** 50 repos + 2 HN months end-to-end. Validates filters, rates, and whether the signal is even visible. **Go/no-go gate:** if the pilot pre/post difference is invisible even on canonical tells, we reconsider framing before burning a full crawl.
- **Phase 1 — full collection (1–2 nights, unattended):** all corpora to `data/raw/`.
- **Phase 2 — analyze + aggregate (hours, local CPU).**
- **Phase 3 — writeup:** article (~1,500 words, 5–6 charts, methodology appendix, limitations section), hosted as a page on wsc.theserverless.dev (SEO accrues to the product) with a dev.to crosspost pointing at the canonical. Show HN submits the article, not the homepage.
- **Phase 4 — repro kit:** `study/README.md` with exact re-run instructions; aggregates CSVs committed.

## Honesty & rigor checklist (survives the HN comment section)

- Rates, never raw counts; masking ON so code blocks don't pollute.
- Bot/template exclusion documented with numbers; excluded-fraction chart included.
- Per-tell breakdown shown so readers see canonical markers driving the curve, not obscure list entries.
- Limitations section: lexicon circularity (our list was derived from studies of AI text — calibration sets address this), English-only, population ≠ individual, correlation with the ChatGPT release is temporal, not causal proof.
- Every prior study we lean on (Kobak, Juzek & Ward, Liang, Reinhart) cited; we position as extending them to developer writing.
- No LLM API calls anywhere in the pipeline — zero cost, zero "AI judging AI" objections.

## Decisions needed from Ankur

1. Corpus scope OK (C1+C2+C3, arXiv deferred)?
2. Article home: page on wsc.theserverless.dev (recommended) vs anks.in?
3. Repo slice preference for C1 (language mix, floor on stars)?
