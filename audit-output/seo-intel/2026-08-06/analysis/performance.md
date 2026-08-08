# Lens 5 - Performance and Core Web Vitals

Analyst run: 8 Aug 2026. All live-response evidence gathered fresh today against
https://www.cloudemployee.io, not from the 4 Aug documents. Finding IDs PERF-01..10;
machine version in `performance.json`.

## The one-paragraph answer

Every page fails lab Lighthouse for one dominant, verified reason: three GeoTargetly
snippets still inject `body{opacity:0}` into every page and gate first paint behind a
remote JavaScript callback that a busy main thread can starve (PERF-01). The fix is
unusually clean because the round trip those snippets exist to make is already redundant:
the server renders `window.VISITOR_COUNTRY` into the HTML from Vercel's
`x-vercel-ip-country` header on every request (PERF-02), so geo routing can move
server-side and the body-hide can be deleted rather than patched. Underneath that sit two
more layers: no HTML response is CDN-cached at all (`no-store`, `x-vercel-cache: MISS`
sitewide, field TTFB 1.37s, PERF-03), and per-template client payloads that explain why
/pricing fields at 100 while /our-work fields at 46 (PERF-04). With zero CrUX coverage
this is not a Google ranking input today; it is a conversion issue now and an investment
in what the first real CrUX window will say, which is accumulating from live traffic as
of this month.

## Verification results (hypotheses tested, not assumed)

### The body-hide hypothesis: CONFIRMED live in production, 8 Aug

`curl https://www.cloudemployee.io/` today returns 200 and the head contains three inline
scripts, one per GeoTargetly rule (`-OJz6mUkL51tX4CyQPmd`, `-OK8LE2WwpalZvadeMTu`,
`-OK8QFN5yqnrUvZ_ZFAC`). Each synchronously inserts
`<style>body{opacity:0.0 !important;}</style>` and un-hides only when
`https://g10498469755.co/gr?id=...` loads and invokes the `georedirect*loaded` callback,
which runs the un-hide via `setTimeout`. The `if(redirect){to=5000}` extra 5-second wait
from GEO_ROUTING.md is present verbatim. Grep counts: 6 occurrences each of
`body{opacity:0.0 !important;}` and the 1.0 counterpart (3 rules, inline plus RSC
payload). One nuance the docs miss: `y.onerror` also un-hides, so a hard network failure
recovers, but a slow-but-successful response does not.

SEO_PROGRAMME 2.1's corrected mechanism holds: GeoTargetly answers fast (165-227ms
measured 4 Aug) but the un-hide is main-thread-starvable JS, and HubSpot's 3.6s of
main-thread work starves it. Blocking either alone did nothing; blocking both moved
render delay 5,007ms to 1,496ms. The fault is the body-hide technique, not either vendor.

### Marker.io: CONFIRMED gone

`grep -ci marker` on today's production homepage HTML = 0. Code now guards on
`!(await isCanonicalSite())` (third-party-scripts.tsx:138). ALREADY FIXED list holds.

### The Ahrefs evidence block: verified, with one correction

Per-URL (`ahrefs/site-audit/cloudemployee_06-aug-2026_internal-html-200-u_2026-08-08_09-40-13.csv`,
688 rows): server fetch median 178ms, p90 350ms; only 14 rows over 500ms. The
server-fast/paint-poor signature is real.

The correction (PERF-08): Ahrefs' "all under 100KB" is COMPRESSED transfer size. Verified
by curl: homepage is 525,489 bytes raw, 64,002 bytes with compression; Ahrefs' median
33,257 matches the compressed number (Ahrefs sees Brotli, curl negotiated gzip). So "not
page weight" is true for transfer but the browser still parses 525KB of HTML on the
homepage, largely RSC flight payload duplication. Secondary issue; recorded so nobody
rules payload out using the wrong column.

### NEW: no HTML caching anywhere (PERF-03)

All five routes probed today (/, /pricing, /our-work, /blog, /about-us) return
`cache-control: private, no-cache, no-store, max-age=0, must-revalidate` and
`x-vercel-cache: MISS`. Every page view is a full SSR render. Cause: the root layout
renders `VisitorCountryScript`, which calls `headers()` (third-party-scripts.tsx:60),
opting every route out of static/ISR rendering; `defineLive` sanityFetch is the other
dynamic dependency. This is why field TTFB is 1.37s desktop while Ahrefs' crawler (warm
path, close infrastructure) sees 178ms median. TTFB is the floor under LCP: 1.37s spends
55% of the 2.5s Good budget before anything renders. Ironically the same header read that
forces dynamic rendering is the thing that makes the geo fix free, so PERF-02 and
PERF-03 should be designed together.

## Reconciling lab vs field (PERF-05)

Both are right; they measure different populations of the same mechanism.

- Un-hide = remote answer (~200ms) + a free main thread. Fast desktop: resolves quickly,
  light routes paint fine, hence Vercel 99-100 on /pricing, /about-us,
  /services/software-engineers.
- Throttled mobile lab: HubSpot's main-thread work stretches to seconds, the un-hide
  starves, LCP is Poor on 100% of pages regardless of template. That is exactly the
  observed pattern: LCP 100% Poor while CLS is 100% Good and server metrics are clean.
- Vercel mobile field cannot arbitrate: 98 data points and FCP 5.36s > LCP 2.02s is
  impossible in one page load; the sample is incoherent. Not treated as measured.

Implication: the population we cannot yet measure (real mobile users) is the one the lab
says suffers multi-second blank screens, and CrUX, when it forms, is mobile-weighted.

## Chrome vs templates (PERF-04)

Server side, templates are indistinguishable: per-template medians from the 688-row CSV
run 131-394ms fetch and 18-47KB compressed across technology-detail (n=192), blog-detail
(n=142), compare-detail (n=53), team-detail (n=51), services-detail (n=48), and all hub
and static pages. Nothing is server-slow.

Field side, routes on identical chrome spread 54 points (100 vs 46). So: the sitewide
chrome (body-hide + HubSpot + pixels) sets the floor everyone pays; template payloads set
the spread. Identifiable per-route payloads: the homepage ships a Vimeo background
autoplay hero (`player.vimeo.com/video/1131836141?background=1&autoplay=1`, in today's
HTML); /contact and /book-a-call mount HubSpot forms and Calendly; blog details carry the
CONTENT-1E recovered video/table embeds; /our-work (46, worst) needs its own audit.
Sequencing matters: template work before the sitewide gates are removed will measure
noise.

## What the blog template is worth (PERF-06)

From `joined/pages.json` (90d window, talent.cloudemployee.io excluded by construction):
site total 488,153 impressions / 1,235 clicks. Blog-detail pages: 222,042 impressions
(45.5%) across 65 pages, 126 clicks (10.2%). Home takes 750 clicks (60.7%), i.e. clicks
today are mostly brand; blog is the impression engine at ~74k/month running ~0.06% CTR,
consistent with mid-page-2 positions. Blog detail is also the worst field scorer (56
desktop, worst on both devices per the brief) while its server delivery is fine (180ms
median, n=142). Honest framing: performance alone does not move page-2 rankings to page 1,
but blog detail is where any ranking-signal gain is levered 45x harder than the average
page, and it is the template to fix and re-measure first after the sitewide work.
Estimate, labelled as such: doubling CTR to a still-modest 0.12% is ~44 clicks/month;
a page-1 move on a tenth of the impression base would be hundreds.

## Images (PERF-07) and Best Practices (PERF-10)

33 oversized image instances, 59.73MB total, every one cdn.sanity.io
(`all-issues/Error-Image_file_size_too_large.csv`). Two patterns: PNGs requested at
`?w=3840` with no `auto=format` (4.0MB for a 1411x1001 source, upscaled), and `.heif`
sources still multi-MB even at `?w=384`, implying the transform is not applying. One
3.19MB asset is inlinked from 10 pages. Not the sitewide LCP cause (LCP is Poor on
pages with no such image), but a genuine quick win: audit the Sanity image component's
URL params. Marked quick_win; per the repo's debugging rules this analysis names the
suspect, an execution session confirms and fixes.

Best Practices 54-56 sitewide is chrome-level (constant across pages), driven by the
marketing pixel stack's third-party cookies and deprecated APIs (Tech Debt #29-#32; all
pixels confirmed still loading today). Not a ranking signal, no traffic number attaches
to it. Last in the queue, and partly a consent-management decision for Jake.

## The 281-to-242 drop (PERF-09)

Plausible attribution to the Marker.io removal (2fe4fcb was the only production change in
the window, and it removed 148KB / 135ms blocking from every page) - but unverifiable
from disk: the 66-CSV all-issues export contains no Lighthouse report, so the 39 moved
pages cannot be identified, and run-to-run Lighthouse variance could account for some or
all of it. Stated as a hypothesis with a cheap test: export the per-URL Lighthouse table
from the Ahrefs UI for both crawl dates. If it holds, it is the first measured
before-and-after and strong evidence many pages sit just below the Poor threshold.

## How much does this matter right now? The honest priority call

1. **It is not a Google ranking input today.** CrUX covers 0 of 688 pages; Google has no
   field data on us. Anyone selling this as an urgent rankings fix is ahead of the
   evidence.
2. **It becomes one on a clock we started at launch.** The site now receives real Chrome
   traffic; CrUX aggregates on a 28-day rolling window. What ships in the next few weeks
   decides whether our first-ever field dataset says Poor. Fixing after it forms means
   dragging a bad 28-day average uphill.
3. **It is a conversion and UX issue today**, on the routes that convert (/contact 56,
   /book-a-call 65, blog 56) - though with leads_* null on every row (HubSpot CRM scopes
   missing), the conversion cost cannot be quantified. That is a data gap, not a shrug.
4. **The fix list is short and mostly one decision deep.** The largest item (PERF-01/02)
   is a deletion enabled by infrastructure already in place.

## Ordered fix list

**Sitewide, in order:**

| # | Fix | Expected gain | Basis |
|---|---|---|---|
| 1 | PERF-01+02: geo routing server-side via x-vercel-ip-country, delete all three GeoTargetly snippets and the body-hide | Removes the mechanism behind LCP 100% Poor; measured floor 5,007ms render delay to 1,496ms when both gates removed | SEO_PROGRAMME 2.1 controlled runs; production HTML 8 Aug |
| 2 | Defer HubSpot analytics loader (js.hs-scripts.com) to idle/interaction, preserving hubspotutk attribution | Perf 51 to 67, TBT 840ms to 330ms measured; also addresses TBT ~40% Poor sitewide | SEO_PROGRAMME 2.1 table |
| 3 | PERF-03: restore HTML cacheability (isolate the headers() read; ISR/cache tags for Sanity routes) | Field TTFB 1.37s toward the ~200ms the crawler sees; LCP cannot beat TTFB | live headers 8 Aug; Speed Insights |
| 4 | PERF-07: Sanity image params (auto=format, honest widths) | 59.7MB across 33 instances; quick win | Error-Image_file_size_too_large.csv |

**Per-template, only after 1-3, re-measuring between steps:**

| # | Fix | Expected gain | Basis |
|---|---|---|---|
| 5 | Blog detail: lazy-mount embeds, hero image weight | Worst template (56) carrying 45.5% of impressions | PERF-06 |
| 6 | /our-work audit (46), Vimeo hero facade on / (81), lazy HubSpot forms on /contact (56), Calendly on /book-a-call (65) | Close the 54-point field spread | PERF-04 |
| 7 | PERF-10: Best Practices / cookie batch (Tech Debt #29-#32) | Score cosmetics + compliance; no ranking effect | SEO_PROGRAMME 2.4 |

## CROSS-LENS NOTES

- **Indexing/architecture lens:** every HTML response is `no-store` (PERF-03). Whatever
  crawl-budget analysis that lens runs should know Googlebot re-fetches full renders
  every time; 653 sitemap URLs at ~1s+ TTFB each is a real crawl cost.
- **Content lens:** blog detail = 45.5% of impressions at 0.06% CTR with mid-page-2 avg
  positions (joined/pages.json). The upside there is mostly content/relevance, not speed.
- **International lens:** the 90d GSC aggregation shows the UK half earning almost
  nothing (already known); nothing performance-side differentiates UK routes - server
  metrics identical.
- **Tracking/analytics lens:** the geo stack's three dashboard rules predate CE-48; if
  routing moves server-side (PERF-02), the GeoTargetly subscription itself may be
  retirable. Also HubSpot deferral must preserve hubspotutk for form attribution.
- **AI-visibility lens:** `?utm_source=chatgpt.com` URLs appear in the Ahrefs crawl of
  our own site (e.g. /how-it-works, /reviews, /customer-stories rows in
  internal-html-200-u CSV), meaning something links to us with those params - possible
  corroborating signal for AI referral traffic.

## DATA GAPS

1. **Per-URL Lighthouse.** Exists in the Ahrefs dashboard, absent from the export. Blocks
   PERF-09 verification and any per-template lab breakdown. One UI export fixes it.
2. **Coherent mobile field data.** Vercel mobile sample incoherent (98 points, FCP>LCP).
   Re-pull late Aug.
3. **Lead/conversion data.** leads_* null on every row (HubSpot CRM scopes). The
   conversion cost of slow converting routes cannot be quantified.
4. **CrUX.** Zero coverage; first meaningful window ~28 days after traffic ramps.
5. **A before/after for the Marker.io removal** at per-URL grain (same as gap 1).
