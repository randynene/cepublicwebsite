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

**Status last reconciled against `origin/main` on 12 Aug 2026.** Every row below
was checked against merged commits, not against what a previous session believed.
If you change a status, cite the commit or PR.

| # | Session | Wave | Effort | Gate | Status |
|---|---|---|---|---|---|
| S1 | Crawl + redirect hygiene | 1 | ~1 day | none | **DONE 8 Aug (PR #93)** |
| S2 | Internal link equity | 1 | ~1 day | none | **PART DONE.** Items 1+2 shipped and merged (PR #95): all 27 compare cards on /alternatives page 1, related-comparisons module. Items 3+4 authored and merged as code (`a1a47c0` scripted Sanity link rewrite + content lint) but **NOT YET RUN** against production Sanity. Needs a local run with the write token. |
| S3 | Template fixes (schema, images, anchors) | 1 | ~1 day | none | **DONE (PR #96 merged).** W1-07, W1-08, W2-06 shipped. W1-02 (VideoObject uploadDate) remains blocked on a content date backfill, documented at `c606729`. |
| S4 | Measurement wiring (Brand Radar weekly) | 1 | ~0.5 day | none | **SCRIPT DONE (PR #94 merged, `746d15c`). FIRST PULL STILL NOT RUN** - no brand-radar output exists in audit-output. Ahrefs collects weekly; pick it up around 14 Aug. |
| S5 | Performance package part A: geo server-side + delete body-hide | 2 | ~2 days | DFH-1 + GeoTargetly rules export | **DONE (PR #106).** GeoTargetly integration and its body-hide deleted (`313bd8b`); CE-48 geo routing reimplemented server-side in `site/src/proxy.ts` (`45b4e91`); rule kept off API and metadata routes, bot bypass widened (`119976b`). The only surviving `opacity:0` in the codebase is a comment explaining the removal. **This was the single biggest item on the roadmap. RE-MEASURED 20 Aug (S5-M): IT WORKED, lab AND field.** Render delay fell from 5,007ms to 31-70ms on image-LCP pages; FCP 1.8-2.1s sitewide (was ~5s under the gate); LCP 3.0-4.2s on 4 of 6 sampled pages, breaking the "Poor on 100%" baseline. Field confirms: Speed Insights mobile RES 95, LCP 1.89s P75, step-change visible 9-10 Aug; Ahrefs 15 Aug crawl Poor 242 to 196. Two 15s outliers (home, /pricing) are lazy-loaded LCP images, S19 scope, not gate residue. Evidence: `audit-output/seo-intel/2026-08-20-s5-measure/`. See the S5-M note below the S5 brief. |
| S6 | Performance package part B: HubSpot defer + HTML caching | 2 | ~2 days | S5 merged | **NOT STARTED. GATE NOW CLEAR.** Carries PERF-03: every HTML response is served `no-store` with `x-vercel-cache MISS`, so nothing caches at the edge. **Before-numbers captured 20 Aug (S5-M):** `private, no-cache, no-store, max-age=0, must-revalidate` + MISS + `age: 0` on every HTML fetch, both repeats, all 6 sampled pages. Cost: HTML median ~610ms TTFB from SE Asia vs ~170ms for a cache-HIT static asset (~440ms edge-cacheable penalty); PSI US lab TTFB 370-419ms. Still no CrUX record at page or origin level, so the field window is still winnable. |
| S7 | Metadata batch (titles + descriptions) | 2 | ~1.5 days | none | NOT STARTED |
| S8 | Backlink rescue part A: build the 301 decision list | 2 | ~0.5 day | none | **DONE (`16c9ca2`).** List at `docs/seo/S8_BACKLINK_DECISION_LIST.md`, top 25 dead URLs. |
| S9 | Backlink rescue part B: ship the 301s | 2 | ~0.5 day | Jake approves S8's list | **DONE (`18c52ce`).** 4 approved reclaims shipped. The remaining S8 candidates are still awaiting a decision. |
| S10 | Content upgrade: staff-augmentation pillar | 2 | ~2 days | none (cited.io) | NOT STARTED |
| S11 | Content upgrade: cost/definitional trio | 2 | ~2-3 days | none (cited.io) | NOT STARTED |
| S12 | UK Phase 0: locale-override schema wiring | 3 | ~2-3 days | DFH-2 (ANSWERED, see UK-03) | NOT STARTED |
| S13 | UK Phase A1: metadata-localise all 326 | 3 | ~2 days + Seb review | S12 merged | NOT STARTED |
| S14+ | Hire-fleet upgrades (15 pages, batches of 3-5) | 3 | ~40h total | S3 merged (Service JSON-LD) | **NOT STARTED. GATE NOW CLEAR** (S3 merged). |
| S18 | Two new pages (javascript + outsourcing pillar) | 3 | ~2 days each | none (cited.io) | NOT STARTED |
| S19 | Per-template performance pass | 3 | ~1-2 weeks | S5+S6 merged AND re-measured | NOT STARTED. S5 merged and re-measured (S5-M, 20 Aug); still needs S6. **First two targets identified by S5-M:** home hero slideshow LCP image is `loading="lazy"` and candidate churn pushes LCP to 14.9s; /pricing LCP is a lazy-loaded Vimeo poster (15.3s). Also 0.7-2.4s font/hydration render delay on text-LCP pages. |
| S20 | 31 Aug review session (watch list) | - | ~0.5 day | date | SCHEDULED 31 AUG |

## Reprioritisation - 20 Aug 2026 (supersedes the NEXT list below)

Agreed with Jake in session, after a two-week stall while marker triage and the
lead-agent track took the checkout. The strategy is unchanged; this is sequencing.
Jake's stated goals: consistent content production sitewide, an off-page/outreach
process (listicles, guest posting, AEO exposure), Seb's podcast as a content
source, and an OCD-clean base first: site fast, CWV good, no duplicate content.

**Wave 0 - this week, parallel:**
- **S5-M: re-measure the speed fix. DONE 20 Aug - S5 worked.** Render delay
  5,007ms down to 31-70ms where the LCP element is present at load; FCP 1.8-2.1s
  sitewide; 4 of 6 sampled pages now hold 3.0-4.2s LCP. Full verdict in the S5-M
  note below the S5 brief; evidence in `audit-output/seo-intel/2026-08-20-s5-measure/`.
  Field confirmed same day by Jake: Speed Insights mobile RES 95 (Great), LCP
  1.89s P75, step-change 9-10 Aug; Ahrefs 15 Aug crawl Poor Lighthouse 242 to
  196. Original baseline to beat: LCP Poor on 100% of pages, 242 Poor / 410 NI
  / 0 Good.
- **UK decision: TAKEN.** Jake decided 20 Aug: KEEP the UK tree and differentiate it -
  page-by-page rewording so content is not duplicate, metadata localised, and where
  it helps, per-page design divergence (design system to be pulled in from Claude
  Design). This answers the S12 gate; S12 (locale-override schema wiring) is now
  unblocked and is the prerequisite for any UK copy to have somewhere to live -
  today zero locale=uk documents exist and every /uk route renders the US document.
- **Measurement repair.** Two halves: (a) conversion tracking broken since Jun 2025 -
  GTM config fix, not code (Tech Debt #67 in the GA4 pull); (b) lead capture
  misrouted in HubSpot - owned by the lead-agent track (feat/lead-agent, active).
  Content production does not start until attribution works.

**Wave 1 - the deadline wave:**
- **S6 (HTML caching + HubSpot defer).** The only item with a clock: CrUX's
  first-ever field window on this site is filling from THIS month's traffic.
  Sitewide no-store / x-vercel-cache MISS must be fixed before that record sets.
- **S12 (UK schema wiring)** - minimal wiring so no new page is born duplicated.

**Wave 2 - the engine (this is "when content starts"):**
- **S14-S17 hire-fleet upgrades first** (already rank 10-30, already hold links,
  fastest return), then S10/S11 pillars, then S18 net-new.
- **Off-page opens in the same wave, in parallel:** the 131 mapped outreach targets,
  reclaiming the 154 soft-404 referring domains (S8 remainder needs Jake's
  decisions), .co.uk auto-renew (45.8% of the link profile), listicle/guest-post
  process, AEO exposure tracking (Brand Radar, S4 pickup).
- **S13 (UK metadata + rewording all 326)** runs through this wave; design
  divergence rides along where Jake supplies it.
- **Podcast (Seb)** folds in as content source + link magnet per episode.

**Wave 3 - ongoing:** S19 per-template perf pass (after S5-M + S6 measured),
full UK localisation completion, S20 review on 31 Aug (11 days out).

**Parallelism rule stands:** one worktree per session (HANDBACKS.md / Tech Debt #73).

---

## NEXT, and why

1. **Re-measure performance.** S5 deleted the body-hide, which the analysis
   identified as the cause of LCP being Poor on 100% of pages while the server
   answered in under 200ms. Nothing else on this list is worth as much as
   knowing whether that worked. Sources: Vercel Speed Insights (now has a week
   of real-user data), and the Ahrefs Site Audit, which re-crawls weekly on
   Saturdays. Baseline to beat: 242 Poor / 410 Needs improvement / 0 Good
   Lighthouse on 8 Aug, and LCP Poor on 100% of pages.
2. **S2 items 3+4** - run the merged link-rewrite script against production
   Sanity. The code is shipped but the data is unchanged, so the benefit is not
   yet realised.
3. **S4 first pull** before 14 Aug, or the weekly Brand Radar collection is
   wasted.
4. **S6**, now unblocked.

## Work done outside this plan

Recorded here so the plan does not look like the whole story:

- **HubSpot CRM scopes granted and lead value joined per page** (`f5af080`,
  `docs/seo/LEAD_VALUE_BY_PAGE.md`). This closes the gap that forced the
  analysis to rank on traffic rather than revenue. Any re-ranking of the
  roadmap can now use real lead value.
- **GA4 Data API puller added and CRO findings recorded** as Tech Debt #67-#70
  (10 Aug). #67 is the headline: conversion tracking has been broken since June
  2025 and is a GTM config fix, not code.

Jake-only tasks (no session needed): co.uk auto-renew check; delete 9 dead GSC
sitemap submissions; claim 13 Tier-1 profiles; the Seb question batch.
**Done since:** HubSpot CRM scopes granted; GeoTargetly rules exported (and the
integration subsequently deleted outright in S5).

---

## Session briefs (scope per session)

### S1 - Crawl + redirect hygiene [DONE 8 Aug 2026]
Roadmap: W1-01, W1-03, W2-05 (if D-BAC decided), TECH-06, Tech Debt #65.
Branch `seo/s1-crawl-redirect-hygiene`, PR #93.

Shipped:
- /team/shawnee-malesich + /uk twin 301. Destination is **/about-us, not /team**:
  /team is itself a 301 to /about-us, so pointing at /team would build the exact
  chain this session removes. Still INTERIM pending Seb (D-EDIT); if the page is
  restored, delete the two lines in `site/src/lib/redirects/locked-rules.ts`.
- Sitemap 653 to 651. The 4 redirecting URLs are filtered by reading the same
  assembled redirect table next.config.ts serves, not a hand-kept list, so the
  fifth retired document is handled the day it is retired.
  /technology/android-studio + UK twin added (the `listItemOnly` filter is gone).
- /ph/services/filipino-developers now lands on /services/philippines-developers
  in one hop, so the utm_source=chatgpt.com traffic reaches a page.
- All 28 redirect chains collapse to single hops, verified against a production
  build, each landing on the same final URL the crawl recorded.
- Whitespace-tolerant paths: middleware trims %20/%09/%0a off both ends and 308s
  to the clean path (Tech Debt #65).

Beyond the brief, both same-defect one-liners:
- /ph/book-a-cto-consultation was left one hop long still landing on a 404.
  Fixed the same way.
- **A real bug the curl pass caught.** 8 rows of Webflow regex syntax leak into
  webflow-redirects.csv as raw `(.*)` / `%1` and were being emitted as live
  rules. Next reads `(.*)` as a capture group and has nothing to do with `%1`, so
  they 308 to the literal path `/blog/%1`. They were harmless only because they
  sat below the properly translated rules and were never reached, until this
  session's reordering moved them up. `extract-redirects.ts` now drops them.

SKIPPED: the /book-a-call noindex item (W2-05). **D-BAC is still undecided** -
it is listed in this file as an open question for Jake, so the gate is not met.

Also skipped, reported rather than improvised: 40 more /ph rows in the Webflow
export have the same shape as the filipino chain (a /ph destination that no
longer exists). Not generalised to `/ph/:path*` - a blanket rule would also
swallow /ph paths that correctly 404, which is the /live-job-role catch-all
mistake. Worth a scoped session of its own.

Verified: curl of every touched path against a production build (28 chains + the
16 destinations + both android-studio pages); `npm run build` clean; tsc clean;
lint identical to main (84 pre-existing problems, 0 new); sitemap count 651 with
the 4 absent and android-studio present. `/web-developer%20` correctly trims to
`/web-developer`, which is still a 404 on purpose: reclaiming it is S9, gated on
Jake approving the S8 list.

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

**STATUS: DONE (PR open on branch seo/s3-template-fixes).** tsc clean; changed
files add zero new lint problems (pre-existing local/no-conditional-strings-in-jsx
debt on untouched lines only). `npm run build` not run here (site/.env.local is
gitignored and the env schema validates Sanity vars at module load) - local build
verification still required before merge.
- **W2-06 (Service JSON-LD): SHIPPED.** technology/json-ld.tsx now emits Service
  (mirrors service/json-ld.tsx: Service @type, #service @id, name/url/provider/
  description/image, serializeJsonLd). serviceType omitted (technology has no
  category enum; data-backed fields only).
- **W1-08 (icon ligature anchors): SHIPPED.** aria-hidden was already present on
  the Material ligature spans since Jul (pre-crawl), which is why the crawl still
  showed leaks: Ahrefs reads raw textContent regardless of aria-hidden. Fix is
  explicit anchor aria-labels (the roadmap's own blog-card technique) on
  article-card, the resources mega-menu pill, and the simple-dropdown (Locations)
  row. Verified: no MaterialIcon passes ariaLabel (all aria-hidden), no raw
  material-symbols spans outside the Icon component.
- **W1-07 (image params): SHIPPED, with the roadmap file corrected.** The E1
  Image loader ALREADY emits auto=format + fit=max + per-width widths and is
  correct - it is NOT the source. The oversized images come from marketing
  templates rendering Sanity photos from a raw GROQ asset->url original through a
  raw <img>/next-image. Added withSanityImageParams (null-safe string transform)
  and applied it across home, how-it-works, location, about-us, fractional-cto,
  hire-engineers, for-engineers. Remaining same-pattern call sites for a
  build-verified follow-up: pricing/testimonial-video poster, catalogue 96px tech
  logos (negligible), and any Sanity-swapped catalogue hero later.
- **W1-02 (VideoObject uploadDate): BLOCKED - content gap, not a template bug.**
  No genuine per-video date exists: the Webflow videos collection carried no date
  into the migration (migrate-videos.ts maps none), Sanity holds none, and the
  Webflow export has no per-video date. _createdAt is the 2026 migration timestamp,
  not the publish date - emitting it would be a false freshness claim, so uploadDate
  is deliberately omitted (documented in video/json-ld.tsx). Closing W1-02 needs an
  editorial date backfill (consistent with Tech Debt #54, metaTitle also dropped),
  then project + emit it as full ISO 8601 with offset.

### S4 - Measurement wiring [INDEPENDENT]
Roadmap: W1-09.
- Script the free Brand Radar weekly pull (POST /v3/brand-radar/mentions-overview,
  0 units, pattern in scripts/seo/ahrefs-deep-pull.ts).
- Output to audit-output/seo-intel/<date>/brand-radar/.
- Optional same session: regenerate the stale MANIFEST-gsc.md (1,070 records).

Execution note (8 Aug): shipped as `scripts/seo/brand-radar-pull.ts` +
`npm run seo:brand-radar-pull`. Two corrections to the brief surfaced against the
live API and are handled in code, not improvised around: (1) the endpoint is GET,
not POST (POST is the history variant); (2) 0 units is conditional on
`prompts=custom`, which requires a saved report id, so `AHREFS_BRAND_RADAR_REPORT_ID`
was added to env and drives brand + competitors + the 10 prompts. First live pull
is NOT run (AHREFS_API_KEY is gitignored and absent here); run it locally before the
14 Aug pickup. Item 2 (MANIFEST-gsc.md) SKIPPED: its generator
`scripts/seo/gsc-deep-pull.ts` is credential-gated (GSC service account) and its
output lives under gitignored `audit-output/`, so it cannot run here.

### S5 - Performance part A: geo goes server-side [DONE 10 Aug 2026]
Roadmap: W2-01 first half. Branch `seo/s5-geo-server-side`, two commits.

The brief above was written before Jake captured the dashboard. It said "replicate
the 3 exported rules" and "PH visitor routing still lands on talent.cloudemployee.io".
Both were superseded on 10 Aug: only ONE of the four dashboard setups was ever on,
and Jake reconfirmed CE-48, which is a different rule. GEO_ROUTING.md section 4.7 is
the spec that was actually built. Recorded here so the change of destination is not
mistaken for drift.

Shipped:
- CE-48 server-side in `site/src/proxy.ts`. If `x-vercel-ip-country` is not in
  the 11-code allow-list (GB, US, AU, NZ, SG, SE, NO, DK, NL, DE, FR) the visitor
  gets a 307 to `/for-developers`. Decided before any HTML is sent, no vendor,
  no flash, no hidden body.
- Every advanced setting from the dashboard capture carried over: destination and
  its UK twin excluded from their own rule, engineer-funnel and legal paths
  excluded, Googlebot and Bingbot bypassed by user agent, `?r=0` escape hatch,
  first-visit-only via a session cookie set on the redirect response, and unknown
  or missing country fails OPEN.
- `GEO_REDIRECT_ENABLED = false` at the top of that file disables the whole rule
  in one line. Tech Debt #63 is why it exists.
- The GeoTargetly integration is deleted, and with it the `body{opacity:0}` hide
  and the hardcoded 5,000 ms wait that were the measured render delay. Nothing in
  the served HTML matches `georedirect`, `g10498469755` or `body{opacity`.
  VisitorCountryScript is untouched and still gates Hotjar.

**This is a DELIBERATE behaviour change**, not a migration. It redirects most of
the world, including countries the old rule never touched, and it stops sending
LATAM and PH traffic to talent.cloudemployee.io - those visitors now reach
`/for-developers` and click through themselves. Tell the PH delivery team before
this merges.

Next.js 16 renamed `middleware` to `proxy`, so `site/src/middleware.ts` became
`site/src/proxy.ts` and the export was renamed. S1's whitespace trim is unchanged
and deliberately still runs FIRST.

Beyond the brief, one real hole the curl pass caught. `/psychometric-test` is a
legacy URL that 308s to `/tools/culture-match`, and `next.config` redirects run
BEFORE the proxy, so excluding only the old name let the visitor be bounced off
the assessment on the very next hop. `culture-match` added to the exclusions.
While checking, `/self-assessment` and `/initial-assessment` turn out to be 404s
in their own right; they are kept in the list because the vendor rule listed them,
but they protect nothing today.

Verified against a local production build with a spoofed country header (the
header is spoofable locally because Vercel is not in front of it): all 12 cases
in the session brief pass, plus Bingbot, `XX`, a cookie-carrying request on a
second path, and S1's trim. `npm run build` exit 0, `npx tsc --noEmit` clean,
lint at the 84-problem baseline with zero new problems, and
`npm run launch:verify-parity -- --target http://localhost:3000` reports
6937/6937.

NOT done here, and deliberately: no HubSpot deferral, no caching work, no
template work (S6 and S19), and the OFF "UK" segment is not resurrected. Also not
done: the Lighthouse before/after this brief asks for. There is no production
"before" on record (Tech Debt #66), so the honest measurement is a PageSpeed run
against production once this merges, not a local number invented now.

**Jake, once this is verified in production the GeoTargetly subscription is
cancellable.** The account now performs no function at all.

### S5-M - Measurement note, 20 Aug 2026 [branch seo/s5-measure, read-only]

**Verdict: S5 worked. No regression found. GeoTargetly is now verifiably absent
from production, so the subscription is cancellable.**

Method: production HTML greps (curl with `?r=0` and a Googlebot UA), PageSpeed
Insights API v5 mobile (Lighthouse 13.4.1) on 6 pages, and header/TTFB timing
runs, all 20 Aug 05:49-06:05 UTC. Raw evidence:
`audit-output/seo-intel/2026-08-20-s5-measure/` (gitignored; this note is the
committed record).

1. **The gate is gone.** Zero matches for `georedirect` / `g10498469755` /
   `geotargetly` / `body{opacity` in the served HTML of home,
   /services/software-engineers, a blog article, /blog, /uk and /pricing. The
   surviving `opacity:0` are element-level animation styles (slideshow
   crossfade, decorative glows). The geo rule was observed live: a curl from a
   non-allow-list country got 307 to /for-developers with `ce_geo_routed=1`
   before any HTML byte; Googlebot fetched full 200 HTML with no redirect;
   `?r=0` works.
2. **Render delay collapsed.** Baseline 8 Aug: 5,007ms, predicted 1,496ms with
   the gates removed. Measured elementRenderDelay: 31ms (home), 70ms
   (/pricing), 666ms (/blog), 786ms (full-stack), 1,117ms (blog article),
   2,422ms (software-engineers). The larger text-LCP numbers are webfont +
   hydration, not a document hide. FCP is 1,827-2,131ms on every page; under
   the gate nothing painted before ~5s.
3. **LCP against the "Poor on 100%" baseline:** 3,001 / 3,526 / 3,751 /
   4,201ms on 4 of 6 pages (mobile-throttled lab). Performance scores 46-87
   (blog hub 87, hire pages 80-81, article 75, home 66, pricing 46).
4. **The two ~15s outliers are NOT S5 residue.** Home's LCP element is the
   hero slideshow `<img alt="Seb Hall" loading="lazy">` (load delay 2,374ms
   plus late candidate swaps); /pricing's is a lazy-loaded Vimeo poster from
   i.vimeocdn.com (load delay 3,286ms). Both are S19 items: eager-load and
   preload the first hero slide and the pricing poster.
5. **S6 before-numbers (unchanged by S5, as expected):** every HTML response
   is `cache-control: private, no-cache, no-store, max-age=0, must-revalidate`
   with `x-vercel-cache: MISS` and `age: 0`, on repeat fetches, all 6 pages.
   Cost: HTML TTFB median ~610ms from SE Asia vs ~170ms for a cache-HIT static
   asset (~440ms edge-cacheable penalty per HTML request); PSI US-probe server
   response 370-419ms (blog article 199ms). Baseline field TTFB on record: 1.37s.
6. **Still no CrUX record** at page or origin level (originLoadingExperience
   null), so the first field window is still filling and still winnable - the
   S6 clock is real and running.
7. **Field data, read by Jake 20 Aug (Vercel Speed Insights, mobile, last 30
   days, 980 data points):** Real Experience Score 95 (Great), LCP 1.89s P75,
   FCP 2.58s, TTFB 0.53s, INP 104ms, CLS 0. A clear step-change is visible
   9-10 Aug when S5 deployed. Real mobile users, the population the 8 Aug
   analysis said suffered most, now measure LCP Good. Remaining ambers, both
   S6 scope: FCP 2.58s sitewide and UK FCP 3.95s Poor (231 samples). Outliers
   for S6: /services/web-based-apps and /events showed 20s TTFB on isolated
   samples.
8. **Ahrefs Site Audit, 15 Aug crawl vs 8 Aug baseline (read by Jake 20 Aug):**
   Poor Lighthouse 242 down to 196 (minus 46), Needs Improvement 421, CLS all
   Good, Performance issues: none. Remaining lab drag maps cleanly to the open
   lanes: TBT ~40% Poor (third-party scripts, S6) and lab LCP ~80% Poor
   (lazy-loaded images + fonts, S19). Pages with CrUX metrics still 0,
   matching point 6.

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
