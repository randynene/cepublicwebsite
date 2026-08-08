# SEO Execution Sessions - the roadmap as session-sized work

**What this is:** the session plan for executing the synthesis roadmap
(`audit-output/seo-intel/2026-08-06/analysis/ROADMAP.json` + `FINDINGS.md`).
Each session is one context window with a self-contained scope, bundled so that
work touching the same files ships together. Sessions marked INDEPENDENT can run
in any order or in parallel worktrees; sessions with a GATE need Jake first.

**Rules that apply to every session:**
- One branch + PR per session; commit after every working step.
- These are EXECUTION sessions. The analysis is done; do not re-analyse. If a
  session finds evidence a roadmap item is wrong, stop and report, don't improvise.
- Verify against production after merge (each session brief lists its checks).
- Update this file's status column in the same session (the file is the memory).
- No em or en dashes in anything authored.
- Concurrent sessions MUST use separate git worktrees (see HANDBACKS.md for why).

Authored 8 Aug 2026 from the six-lens synthesis.

---

## The dashboard

| # | Session | Wave | Effort | Gate | Status |
|---|---|---|---|---|---|
| S1 | Crawl + redirect hygiene | 1 | ~1 day | none | NOT STARTED |
| S2 | Internal link equity | 1 | ~1 day | none | NOT STARTED |
| S3 | Template fixes (schema, images, anchors) | 1 | ~1 day | none | NOT STARTED |
| S4 | Measurement wiring (Brand Radar weekly) | 1 | ~0.5 day | none | NOT STARTED |
| S5 | Performance package part A: geo server-side + delete body-hide | 2 | ~2 days | DFH-1 + GeoTargetly rules export | NOT STARTED |
| S6 | Performance package part B: HubSpot defer + HTML caching | 2 | ~2 days | S5 merged | NOT STARTED |
| S7 | Metadata batch (titles + descriptions) | 2 | ~1.5 days | none | NOT STARTED |
| S8 | Backlink rescue part A: build the 301 decision list | 2 | ~0.5 day | none | NOT STARTED |
| S9 | Backlink rescue part B: ship the 301s | 2 | ~0.5 day | Jake approves S8's list | NOT STARTED |
| S10 | Content upgrade: staff-augmentation pillar | 2 | ~2 days | none (cited.io) | NOT STARTED |
| S11 | Content upgrade: cost/definitional trio | 2 | ~2-3 days | none (cited.io) | NOT STARTED |
| S12 | UK Phase 0: locale-override schema wiring | 3 | ~2-3 days | DFH-2 | NOT STARTED |
| S13 | UK Phase A1: metadata-localise all 326 | 3 | ~2 days + Seb review | S12 merged | NOT STARTED |
| S14+ | Hire-fleet upgrades (15 pages, batches of 3-5) | 3 | ~40h total | S3 merged (Service JSON-LD) | NOT STARTED |
| S18 | Two new pages (javascript + outsourcing pillar) | 3 | ~2 days each | none (cited.io) | NOT STARTED |
| S19 | Per-template performance pass | 3 | ~1-2 weeks | S5+S6 merged AND re-measured | NOT STARTED |
| S20 | 31 Aug review session (watch list) | - | ~0.5 day | date | SCHEDULED 31 AUG |

Jake-only tasks (no session needed): co.uk auto-renew check; delete 9 dead GSC
sitemap submissions; claim 13 Tier-1 profiles; grant HubSpot CRM scopes; export
GeoTargetly rules; the Seb question batch.

---

## Session briefs (scope per session)

### S1 - Crawl + redirect hygiene [INDEPENDENT]
Roadmap: W1-01, W1-03, W2-05 (if D-BAC decided), TECH-06, Tech Debt #65.
- 301 /team/shawnee-malesich to /team (interim until Seb answers restore-vs-301).
- Drop the 4 redirecting URLs from the sitemap; add /technology/android-studio + UK twin.
- Fix the /ph/services/filipino-developers 308-to-404 chain.
- Collapse the 28 redirect chains to single hops in the tracked redirect tables.
- Whitespace-tolerant redirect matching (trailing %20).
- If Jake has said yes: restore noindex on the 10 /book-a-call/* pages.
- Verify: curl every touched path; npm run build; sitemap count checks.

### S2 - Internal link equity [INDEPENDENT]
Roadmap: W1-04, W1-05, W1-06.
- /alternatives page 1 renders all 30 compare cards.
- Related-comparisons module on the compare detail template.
- Contextual links to the 7 zero-inlink posts + the ~20 one-in-content-link
  impression-bearing pages (list in FINDINGS.md Wave 1 items 4-5).
- Scripted Sanity Portable Text rewrite: 434 apex-host links, 49 calculator
  links, 166 other redirect targets, 27 dead externals. Plus a content-lint.
- Verify: re-run the link extraction from scripts/seo/replay-all-urls.ts on
  touched pages; zero apex-host links remain.

### S3 - Template fixes [INDEPENDENT]
Roadmap: W1-02, W1-07, W1-08, W2-06.
- VideoObject uploadDate (full ISO 8601 with offset) on the video template.
- Technology template emits Service JSON-LD (mirror the services template).
- aria-hidden on icon spans; article-title aria-labels on blog cards.
- Sanity image URL params: auto=format + honest widths in the image component.
- Verify: JSON-LD validates on sample pages; grep rendered HTML for ligature leaks.

### S4 - Measurement wiring [INDEPENDENT]
Roadmap: W1-09.
- Script the free Brand Radar weekly pull (POST /v3/brand-radar/mentions-overview,
  0 units, pattern in scripts/seo/ahrefs-deep-pull.ts).
- Output to audit-output/seo-intel/<date>/brand-radar/.
- Optional same session: regenerate the stale MANIFEST-gsc.md (1,070 records).

### S5 - Performance part A: geo goes server-side [GATE: DFH-1 + rules export]
Roadmap: W2-01 first half.
- Replicate the 3 exported GeoTargetly rules in server-side routing off
  x-vercel-ip-country (proxy/middleware or layout-level redirect).
- Delete the three GeoTargetly snippets and every body{opacity:0} injection.
- Verify: PH visitor routing still lands on talent.cloudemployee.io (test with
  header spoofing); no opacity:0 in production HTML; Lighthouse before/after.
- DO NOT start template-level perf work here; sitewide only.

### S6 - Performance part B: main thread + caching [GATE: S5 merged]
Roadmap: W2-01 second half.
- Defer HubSpot analytics loader to idle/interaction, preserving hubspotutk.
- Isolate the headers() read so routes regain static/ISR; cache tags for Sanity.
- Verify: x-vercel-cache HIT on repeat fetches; hubspotutk present at form
  submit; field TTFB trend in Speed Insights over the following week.

### S7 - Metadata batch [INDEPENDENT]
Roadmap: W2-02.
- Step 1: manual SERP check (or small Ahrefs re-export) for the 26
  Google-rewritten titles - the SERP strings are a known data gap.
- Fix: 26 rewritten titles, 20 long titles, 33 long descriptions, and the 2
  template-level missing-description fixes (review detail + legal).
- Sanity metaTitle/metaDescription edits only. H1s DO NOT change (Tech Debt #43b).

### S8 - Backlink rescue part A: the decision list [INDEPENDENT]
Roadmap: W2-03 prep.
- Build the top-25-by-referring-domains dead-blog list with a proposed target and
  a confidence flag per URL (AUTH-01 has the method + first 10; AUTH-06 has the
  broken-backlink verdicts including the ~5 clean mechanical wins).
- Output: one markdown table for Jake - approve / change target / accept loss.
- Ship nothing in this session.

### S9 - Backlink rescue part B: ship [GATE: Jake approves the S8 list]
- Add the approved 301s to the tracked redirect tables + the ~5 clean reclaims
  (/web-developer etc.). Verify each with curl. Record accepted losses in the
  parity-exceptions style: who decided, why.

### S10 - Staff-augmentation pillar upgrade [INDEPENDENT, cited.io]
Roadmap: W2-08. Answer-box lead, meaning/benefits/vs-outsourcing/pricing H2s,
hub-and-spoke links to all 13 cluster posts. Keep the H1's ranking phrase.

### S11 - Cost/definitional trio upgrade [INDEPENDENT, cited.io]
Roadmap: W2-09. The costs post (top real click earner), outsourcing-definition,
offshoring-explainer. Per-country rate tables linking the live calculators.

### S12 - UK Phase 0: schema wiring [GATE: DFH-2]
Roadmap: W3-03 start. Locale-override fields (ukMetaTitle, ukMetaDescription,
per-section body overrides) on shared documents + query projections + template
fallbacks + Studio deploy. Exit test: editing a UK meta title in Studio changes
/uk/x and NOT /x; hreflang + canonicals unchanged. NEVER: fork slugs, canonical
UK to US, or drop hreflang (UK-07 rules).

### S13 - UK Phase A1: metadata all 326 [GATE: S12]
Generate UK titles/descriptions/OG for every pair (£, British phrasing, UK
geo-qualifiers where query data supports). Ship in batches with Seb review.
Clears 305/306 duplicate-title + 321/322 duplicate-description groups.

### S14-S17 - Hire-fleet upgrades [GATE: S3; batches of 3-5 pages per session]
Roadmap: W3-01, in this order: typescript, philippines, latam, aws, devops,
openai, python, no-code, then descending clean impressions (list in content.md).
Template per page: 1,500-2,000 words, rates table, vetting, engagement models,
FAQ, the GSC query variants. H1s unchanged.

### S18 - The two new pages [INDEPENDENT, cited.io]
Roadmap: W3-02. /technology/javascript-developers (standard hire template) + the
software-development-outsourcing pillar (existing posts link up to it).

### S19 - Per-template performance [GATE: S5+S6 merged and re-measured]
Roadmap: W3-04. Blog detail first, then /our-work, Vimeo facade on /, lazy
HubSpot forms + Calendly. Re-measure between every step.

### S20 - The 31 Aug review [SCHEDULED]
The watch list in one session: 28-day migration read; Copilot recovery (escalate
to Bing if cited pages < ~10/day); crawled-not-indexed trend; the 11 Ahrefs
traffic-drop pages; decide the Philippines consolidation (D-PH); check first
CrUX data. Also due earlier: 14 Aug Brand Radar pickup (Jake), 17 Aug Ahrefs
reset buys (RESUME.md: keywords-explorer + SERP overview only, GB content-gap,
live backlink graph).

---

## Suggested calendar

- **This week:** S1, S2, S3, S4 (all independent - can run as parallel worktree
  sessions or sequentially). Jake: dashboards batch + export GeoTargetly rules +
  answer DFH-1, DFH-2, D-BAC.
- **Next week:** S5 then S6 (the performance package - the priority, to land
  inside the first CrUX window). S7 and S8 alongside in separate worktrees.
- **Rest of August:** S9, S10, S11. Jake: Tier-1 profile claims, Seb batch.
- **31 Aug:** S20 review, then D-PH decision.
- **September:** S12+S13 (UK), S14-S17 (hire fleet), S18, then S19.
